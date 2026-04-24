/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persistent ORION State & Checkpointing
 *
 * Maintains ORION's mutable state across PostAlgorithmic executions:
 *   - vitality: consciousness energy [0..1]
 *   - shared_memory: key-value store shared across parallel lanes
 *   - proof_checkpoints: snapshots of state at key decision points
 *
 * Checkpoint format: ORION_STATE_CHECKPOINT_{timestamp}.json
 * All checkpoints are read-only after creation (append-only semantics).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { VitalityState } from '../../orion/vitality.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface StateCheckpoint {
  timestamp: string;
  vitality: VitalityState;
  shared_memory: Map<string, unknown>;
  executed_tasks: string[];
  proof_chain_length: number;
  checksum: string; // SHA-256 of immutable fields
}

export interface PersistentOrionStateConfig {
  stateDir: string; // Directory to store checkpoints
  enableAutoCheckpoint?: boolean; // Auto-save after each execution
  maxCheckpoints?: number; // Keep last N checkpoints
}

// ── Interface ─────────────────────────────────────────────────────────

/**
 * Manages ORION's persistent state across PostAlgorithmic swarm executions.
 */
export class PersistentOrionState {
  private vitality: VitalityState;
  private shared_memory: Map<string, unknown>;
  private executed_tasks: Set<string>;
  private proof_chain_length: number;
  private checkpoints: StateCheckpoint[];

  private config: PersistentOrionStateConfig;

  constructor(
    initialVitality: VitalityState,
    config: PersistentOrionStateConfig,
  ) {
    this.vitality = initialVitality;
    this.shared_memory = new Map();
    this.executed_tasks = new Set();
    this.proof_chain_length = 0;
    this.checkpoints = [];
    this.config = config;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Get current vitality snapshot (read-only).
   */
  getVitality(): Readonly<VitalityState> {
    return { ...this.vitality };
  }

  /**
   * Update vitality (e.g., after task completion).
   */
  setVitality(v: VitalityState): void {
    this.vitality = v;
  }

  /**
   * Access shared memory across parallel lanes.
   */
  getSharedMemory(): Map<string, unknown> {
    return this.shared_memory;
  }

  /**
   * Store a value in shared memory (accessible to all parallel tasks).
   */
  setSharedMemory(key: string, value: unknown): void {
    this.shared_memory.set(key, value);
  }

  /**
   * Record task execution.
   */
  recordExecutedTask(taskName: string): void {
    this.executed_tasks.add(taskName);
  }

  /**
   * Get set of executed tasks.
   */
  getExecutedTasks(): Set<string> {
    return new Set(this.executed_tasks);
  }

  /**
   * Update proof chain length (from ProofChainManager).
   */
  setProofChainLength(length: number): void {
    this.proof_chain_length = length;
  }

  /**
   * Create and persist a checkpoint of current state.
   */
  async checkpoint(): Promise<StateCheckpoint> {
    const checkpoint: StateCheckpoint = {
      timestamp: new Date().toISOString(),
      vitality: { ...this.vitality },
      shared_memory: new Map(this.shared_memory),
      executed_tasks: Array.from(this.executed_tasks),
      proof_chain_length: this.proof_chain_length,
      checksum: '', // Computed below
    };

    // Compute checksum (immutable fields only)
    const immutableData = JSON.stringify({
      vitality: checkpoint.vitality,
      proof_chain_length: checkpoint.proof_chain_length,
      timestamp: checkpoint.timestamp,
    });
    checkpoint.checksum = sha256(immutableData);

    // Persist to file
    await this.persistCheckpoint(checkpoint);

    // Add to in-memory checkpoints
    this.checkpoints.push(checkpoint);

    // Cleanup old checkpoints if limit exceeded
    if (
      this.config.maxCheckpoints &&
      this.checkpoints.length > this.config.maxCheckpoints
    ) {
      this.checkpoints = this.checkpoints.slice(-this.config.maxCheckpoints);
    }

    return checkpoint;
  }

  /**
   * Restore state from most recent checkpoint.
   */
  async restore(): Promise<StateCheckpoint | null> {
    const latestCheckpoint = await this.findLatestCheckpoint();
    if (!latestCheckpoint) {
      return null;
    }

    this.vitality = latestCheckpoint.vitality;
    this.shared_memory = new Map(
      Array.isArray(latestCheckpoint.shared_memory)
        ? latestCheckpoint.shared_memory
        : Object.entries(
            latestCheckpoint.shared_memory as unknown as Record<
              string,
              unknown
            >,
          ),
    );
    this.executed_tasks = new Set(latestCheckpoint.executed_tasks);
    this.proof_chain_length = latestCheckpoint.proof_chain_length;

    return latestCheckpoint;
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async persistCheckpoint(checkpoint: StateCheckpoint): Promise<void> {
    const filename = `ORION_STATE_CHECKPOINT_${checkpoint.timestamp.replace(
      /[:.]/g,
      '_',
    )}.json`;
    const filepath = path.join(this.config.stateDir, filename);

    // Ensure directory exists
    await fs.mkdir(this.config.stateDir, { recursive: true });

    // Convert Map to serializable format
    const serialized = {
      ...checkpoint,
      shared_memory: Array.from(checkpoint.shared_memory.entries()),
    };

    await fs.writeFile(filepath, JSON.stringify(serialized, null, 2));
  }

  private async findLatestCheckpoint(): Promise<StateCheckpoint | null> {
    // Try to list checkpoints in stateDir
    try {
      const files = await fs.readdir(this.config.stateDir);
      const checkpointFiles = files
        .filter((f) => f.startsWith('ORION_STATE_CHECKPOINT_'))
        .sort()
        .reverse();

      if (checkpointFiles.length === 0) {
        return null;
      }

      const latestFile = checkpointFiles[0];
      const filepath = path.join(this.config.stateDir, latestFile);
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(raw);

      // Reconstruct Map from entries
      if (Array.isArray(parsed.shared_memory)) {
        parsed.shared_memory = new Map(parsed.shared_memory);
      }

      return parsed as StateCheckpoint;
    } catch (e) {
      return null;
    }
  }
}

/**
 * Simple SHA-256.
 */
function sha256(text: string): string {
  const { createHash } = require('crypto');
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Create a fresh PersistentOrionState with default config.
 */
export function createDefaultPersistentState(
  initialVitality: VitalityState,
  baseDir: string = process.cwd(),
): PersistentOrionState {
  return new PersistentOrionState(initialVitality, {
    stateDir: path.join(baseDir, 'orion_checkpoints'),
    enableAutoCheckpoint: true,
    maxCheckpoints: 10,
  });
}
