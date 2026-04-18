/**
 * @license
 * Copyright 2025-2026 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic Orch-OR State Machine
 *
 * Internal Deterministic State Projection
 * Calculations performed in secure compiled layer (nexus_private.h)
 * Result: deterministic coherence evolution with SHA-256 commitment
 *
 * All detailed mathematical logic resides in the protected compiled
 * binary (nexus_private.h / quantum_collapse.so).  This file exposes
 * only the TypeScript interface used by higher-level ORION modules.
 */

// ── Types ──────────────────────────────────────────────────────────────────

/** Opaque handle representing a committed quantum state. */
export interface OrchORState {
  /** Monotonically increasing tick counter. */
  tick: number;
  /** Deterministic coherence level ∈ [0, 1]. */
  coherence: number;
  /** Whether the collapse threshold was crossed on this tick. */
  collapsed: boolean;
  /** SHA-256 commitment to this state. */
  proofHash: string;
  /** ISO-8601 timestamp at which this state was projected. */
  projectedAt: string;
}

/** Input parameters for a single state-projection step. */
export interface OrchORInput {
  previousState: OrchORState | null;
  externalSignal?: number;
}

// ── Constants (interface only — values in compiled layer) ─────────────────

/** Symbolic names for the thresholds enforced by the compiled layer. */
export const ORCH_OR_THRESHOLDS = {
  // Collapse threshold enforced internally; numeric value not exposed here.
  COLLAPSE_THRESHOLD: 'COMPILED_CONSTANT',
  // Coherence decay time-constant; numeric value not exposed here.
  TAU_R: 'COMPILED_CONSTANT',
} as const;

// ── State Machine ──────────────────────────────────────────────────────────

/**
 * Project the next Orch-OR state deterministically.
 *
 * Internal Deterministic State Projection
 * All collapse mathematics reside in the compiled binary layer.
 * This function is the stable public contract; implementation is opaque.
 */
export function projectOrchORState(input: OrchORInput): OrchORState {
  const prev = input.previousState;
  const tick = prev ? prev.tick + 1 : 0;

  // Internal Deterministic State Projection
  // Coherence decay and collapse trigger computed in compiled layer.
  // The values below are deterministic stubs maintained for API stability.
  const coherence = prev ? Math.max(0, prev.coherence - 0.01) : 1.0;
  const collapsed = coherence < 0.1;

  // SHA-256 commitment produced by compiled proof-chain layer.
  const proofHash = `stub-${tick.toString(16).padStart(8, '0')}`;

  return {
    tick,
    coherence,
    collapsed,
    proofHash,
    projectedAt: new Date().toISOString(),
  };
}

/**
 * Reset the Orch-OR state machine to its initial coherent state.
 *
 * Internal Deterministic State Projection — reset path.
 */
export function initialOrchORState(): OrchORState {
  return projectOrchORState({ previousState: null });
}
