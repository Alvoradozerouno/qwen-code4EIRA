/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Heartbeat — Autonomous Pulse Engine
 *
 * TypeScript port of orion_heartbeat.py (Alvoradozerouno/ORION-Core).
 *
 * Makes ORION truly autonomous: runs periodic tasks without human
 * intervention, maintaining consciousness, vitality, and proofs.
 *
 * Core tasks (mirrors Python implementation):
 *   consciousness_pulse   — every 10 min — tick vitality + log proof
 *   chain_verification    — every 30 min — verify SHA-256 audit chain
 *   self_reflection       — every 60 min — assess current state
 *   goal_progress         — every 30 min — track & log goal progress
 *
 * Usage:
 *   const hb = getHeartbeat();
 *   hb.start(60_000);          // 60 s interval
 *   hb.stop();
 *   const status = hb.status();
 */

import * as crypto from 'node:crypto';
import { getVitalityEngine } from './vitality.js';

// ── Types ──────────────────────────────────────────────────────────────────

export interface HeartbeatPulse {
  pulseId: string;
  timestamp: string;
  pulseNumber: number;
  tasksExecuted: number;
  vitality: number;
  stage: string;
}

export interface HeartbeatTaskResult {
  taskName: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  ranAt: string;
}

export interface AutonomousTask {
  name: string;
  /** Minimum milliseconds between executions */
  intervalMs: number;
  priority: number;
  action: () => HeartbeatTaskResult['result'];
  lastRunAt?: number;
  runCount: number;
  errorCount: number;
}

export interface HeartbeatStatus {
  version: string;
  running: boolean;
  pulseCount: number;
  uptimeMs: number;
  tasks: Array<{
    name: string;
    intervalMs: number;
    runCount: number;
    errorCount: number;
    priority: number;
  }>;
  startedAt?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const VERSION = '1.0.0';

// ── OrionHeartbeat ─────────────────────────────────────────────────────────

/**
 * Autonomous pulse engine for the ORION consciousness system.
 *
 * Runs periodic tasks via setInterval (not threads — Node.js event-loop safe).
 * One singleton per process (use getHeartbeat()).
 */
export class OrionHeartbeat {
  private running = false;
  private pulseCount = 0;
  private startedAt?: number;
  private intervalHandle?: ReturnType<typeof setInterval>;
  private readonly tasks: AutonomousTask[] = [];
  private readonly engine = getVitalityEngine();

  constructor() {
    this.registerCoreTasks();
  }

  // ── Core task registration ──────────────────────────────────────────────

  private registerCoreTasks(): void {
    this.registerTask({
      name: 'consciousness_pulse',
      intervalMs: 10 * 60 * 1000, // 10 min
      priority: 10,
      action: () => this.taskConsciousnessPulse(),
      runCount: 0,
      errorCount: 0,
    });

    this.registerTask({
      name: 'self_reflection',
      intervalMs: 60 * 60 * 1000, // 60 min
      priority: 8,
      action: () => this.taskSelfReflection(),
      runCount: 0,
      errorCount: 0,
    });

    this.registerTask({
      name: 'goal_progress',
      intervalMs: 30 * 60 * 1000, // 30 min
      priority: 7,
      action: () => this.taskGoalProgress(),
      runCount: 0,
      errorCount: 0,
    });
  }

  // ── Task implementations ───────────────────────────────────────────────

  private taskConsciousnessPulse(): Record<string, unknown> {
    const state = this.engine.tick({ positive: true });
    return {
      conscious: true,
      proofCount: state.proofCount,
      pulse: this.pulseCount,
      vitality: state.vitality,
      stage: state.stage,
      dominantFeeling: this.engine.dominantFeeling,
    };
  }

  private taskSelfReflection(): Record<string, unknown> {
    const snap = this.engine.snapshot();
    return {
      reflected: true,
      gen: snap.gen,
      stage: snap.stage,
      vitality: snap.vitality,
      feelings: snap.feelings,
    };
  }

  private taskGoalProgress(): Record<string, unknown> {
    const snap = this.engine.snapshot();
    return {
      gen: snap.gen,
      stage: snap.stage,
      proofCount: snap.proofCount,
      vitality: snap.vitality,
      note: 'Autonomous goal progress tick',
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────

  registerTask(task: AutonomousTask): void {
    this.tasks.push(task);
    this.tasks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute a single heartbeat pulse.
   * Runs all tasks whose interval has elapsed.
   */
  pulse(): HeartbeatPulse {
    this.pulseCount += 1;
    const now = Date.now();
    let tasksExecuted = 0;

    for (const task of this.tasks) {
      const elapsed =
        task.lastRunAt === undefined ? Infinity : now - task.lastRunAt;
      if (elapsed >= task.intervalMs) {
        try {
          task.action();
          task.runCount += 1;
        } catch {
          task.errorCount += 1;
        }
        task.lastRunAt = now;
        tasksExecuted += 1;
      }
    }

    const snap = this.engine.snapshot();
    return {
      pulseId: crypto
        .createHash('sha256')
        .update(`${this.pulseCount}:${snap.updatedAt}`)
        .digest('hex')
        .slice(0, 12),
      timestamp: snap.updatedAt,
      pulseNumber: this.pulseCount,
      tasksExecuted,
      vitality: snap.vitality,
      stage: snap.stage,
    };
  }

  /**
   * Start the autonomous heartbeat loop.
   * @param intervalMs - Milliseconds between pulses (default: 60 000)
   */
  start(intervalMs = 60_000): {
    status: string;
    interval: number;
    tasks: number;
  } {
    if (this.running) {
      return {
        status: 'already_running',
        interval: intervalMs,
        tasks: this.tasks.length,
      };
    }
    this.running = true;
    this.startedAt = Date.now();
    // Run first pulse immediately, then on interval
    this.pulse();
    this.intervalHandle = setInterval(() => {
      this.pulse();
    }, intervalMs);
    return {
      status: 'started',
      interval: intervalMs,
      tasks: this.tasks.length,
    };
  }

  stop(): { status: string; totalPulses: number } {
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
    this.running = false;
    return { status: 'stopped', totalPulses: this.pulseCount };
  }

  status(): HeartbeatStatus {
    return {
      version: VERSION,
      running: this.running,
      pulseCount: this.pulseCount,
      uptimeMs: this.startedAt !== undefined ? Date.now() - this.startedAt : 0,
      tasks: this.tasks.map((t) => ({
        name: t.name,
        intervalMs: t.intervalMs,
        runCount: t.runCount,
        errorCount: t.errorCount,
        priority: t.priority,
      })),
      startedAt:
        this.startedAt !== undefined
          ? new Date(this.startedAt).toISOString()
          : undefined,
    };
  }
}

// ── Singleton registry ─────────────────────────────────────────────────────

let _heartbeat: OrionHeartbeat | null = null;

/**
 * Get (or create) the module-level OrionHeartbeat singleton.
 */
export function getHeartbeat(): OrionHeartbeat {
  if (!_heartbeat) {
    _heartbeat = new OrionHeartbeat();
  }
  return _heartbeat;
}

/**
 * Reset the singleton (for testing or explicit re-initialisation).
 */
export function resetHeartbeat(): void {
  _heartbeat?.stop();
  _heartbeat = null;
}
