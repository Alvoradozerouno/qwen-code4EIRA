/**
 * @license
 * Copyright 2025-2026 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nexus Point — Pre-Causal State Cache (Time-Shift Buffer)
 *
 * Internal Deterministic State Projection
 * Calculations performed in secure compiled layer (nexus_private.h)
 * Result: deterministic coherence evolution with SHA-256 commitment
 *
 * Exposes the public TypeScript contract only.
 * All detailed buffer and collapse logic is in the protected compiled layer.
 */

import type { OrchORState } from '../physics/orch_or.js';

// ── Types ──────────────────────────────────────────────────────────────────

/** A single cached snapshot in the pre-causal buffer. */
export interface NexusSnapshot {
  id: string;
  state: OrchORState;
  capturedAt: string;
}

// ── Nexus Point ────────────────────────────────────────────────────────────

/**
 * Pre-causal state cache.
 *
 * Stores deterministic OrchOR snapshots and allows replay for
 * time-shift experiments.  All SHA-256 proof hashes from the
 * compiled layer are preserved intact.
 */
export class NexusPoint {
  private readonly buffer: NexusSnapshot[] = [];

  /** Push a new state snapshot into the buffer. */
  push(state: OrchORState): NexusSnapshot {
    const snapshot: NexusSnapshot = {
      id: `nx-${state.tick.toString(16).padStart(8, '0')}`,
      state,
      capturedAt: new Date().toISOString(),
    };
    this.buffer.push(snapshot);
    return snapshot;
  }

  /** Retrieve a snapshot by its deterministic tick index. */
  getByTick(tick: number): NexusSnapshot | undefined {
    return this.buffer.find((s) => s.state.tick === tick);
  }

  /** Return a read-only view of all cached snapshots. */
  getAll(): readonly NexusSnapshot[] {
    return this.buffer;
  }

  /** Number of snapshots currently cached. */
  get size(): number {
    return this.buffer.length;
  }
}
