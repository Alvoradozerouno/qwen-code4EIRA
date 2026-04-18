/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nexus Point — Unified Physics + Orch-OR + EIRA Policy Gate
 *
 * Decision logic (per PRAETOR specification):
 *   1. Run Newtonian/Verlet physics prediction via PhysicsEngine.
 *   2. Apply Orch-OR coherence evaluation via OrchOREngine.
 *   3. If Orch-OR collapse_decision = "COLLAPSE"    → immediate ABSTAIN.
 *   4. If coherence_level < SAFE_THRESHOLD (0.3)   → immediate ABSTAIN.
 *   5. Otherwise: evaluate EIRA EpistemicState and run the deterministic
 *      K=3.2 gate (prove() from deterministic-gate.ts equivalent).
 *
 * Output:
 *   NexusResult containing physical_state, orch_or_state,
 *   epistemic_classification, final_decision, nexus_hash, audit_trail.
 */

import * as crypto from 'crypto';
import {
  PhysicsEngine,
  type UnifiedPredictionState,
} from '../physics/physics-engine.js';
import type { PhysicalState, OrbitContext } from '../physics/physics-types.js';
import {
  type OrchORParams,
  SAFE_COHERENCE_THRESHOLD,
} from '../physics/orch-or-engine.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum K confidence for EXECUTE decision (mirrors K_THRESHOLD = 3.2) */
const K_THRESHOLD = 3.2;
const K_MAX = 5.0;

// ── EIRA Epistemic State ──────────────────────────────────────────────────────

export type EpistemicClassification = 'VERIFIED' | 'ESTIMATED' | 'UNKNOWN';

export type FinalDecision = 'EXECUTE' | 'ABSTAIN';

// ── Nexus Result ──────────────────────────────────────────────────────────────

export interface NexusResult {
  physical_state: {
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    acceleration: { x: number; y: number; z: number };
  };
  orch_or_state: {
    coherence_level: number;
    collapse_decision: string;
    threshold_energy: number;
  };
  epistemic_classification: EpistemicClassification;
  final_decision: FinalDecision;
  nexus_hash: string;
  audit_trail: string[];
}

// ── Nexus input ───────────────────────────────────────────────────────────────

export interface NexusInput {
  /** Current physical state of the satellite / body */
  physical_state: PhysicalState;
  /** Orbital context (time_delta, mu) */
  orbit_context?: OrbitContext;
  /** Orch-OR input parameters */
  orch_params: OrchORParams;
  /** Human-readable description of the prediction scenario */
  description?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute an EIRA epistemic classification from Orch-OR coherence and K.
 *
 * Mapping:
 *   coherence ≥ 0.8 && K ≥ K_THRESHOLD  →  VERIFIED
 *   coherence ≥ 0.5                     →  ESTIMATED
 *   otherwise                           →  UNKNOWN
 */
function classifyEpistemic(
  coherence_level: number,
  k: number,
): EpistemicClassification {
  if (coherence_level >= 0.8 && k >= K_THRESHOLD) return 'VERIFIED';
  if (coherence_level >= 0.5) return 'ESTIMATED';
  return 'UNKNOWN';
}

/**
 * Compute K confidence from physical and Orch-OR states.
 *
 * Uses the same formula as the ORION deterministic gate but applied to
 * physical evidence signals:
 *   K = K_MAX × (coherence×0.35 + hashPresent×0.30 + physicsValid×0.25 + energyNorm×0.10)
 */
function computeK(unified: UnifiedPredictionState): number {
  const coherenceNorm = unified.orch_or_state.coherence_level;
  const hashPresent =
    unified.physical_state.predicted_hash.length === 64 ? 1.0 : 0.0;
  const physicsValid = unified.coherence_ok ? 1.0 : 0.0;
  const energyNorm = Math.min(
    1.0,
    unified.orch_or_state.threshold_energy > 0
      ? Math.log10(1 + unified.orch_or_state.threshold_energy * 1e34) / 10
      : 0.0,
  );
  const raw =
    coherenceNorm * 0.35 +
    hashPresent * 0.3 +
    physicsValid * 0.25 +
    energyNorm * 0.1;
  return Math.min(K_MAX, Math.max(0, raw * K_MAX));
}

/**
 * Compute SHA-256 nexus hash chaining the physical and Orch-OR hashes.
 */
function computeNexusHash(
  physHash: string,
  orchHash: string,
  decision: FinalDecision,
): string {
  const payload = JSON.stringify({
    physHash,
    orchHash,
    decision,
    ts: new Date().toISOString(),
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ── NexusPoint ────────────────────────────────────────────────────────────────

/**
 * The PRAETOR Nexus Point:
 * Orchestrates Physics → Orch-OR → EIRA gate into a single sovereign decision.
 */
export class NexusPoint {
  /**
   * Evaluate a time-shift prediction through the full EIRA Policy Gate.
   *
   * @param input - Full nexus input (physical state + Orch-OR params + context).
   * @returns       NexusResult with final_decision and audit trail.
   */
  static evaluate(input: NexusInput): NexusResult {
    const audit_trail: string[] = [];

    const timestamp = new Date().toISOString();
    audit_trail.push(
      `[${timestamp}] NexusPoint.evaluate() started — ${input.description ?? 'no description'}`,
    );

    // ── Step 1 & 2: Physics + Orch-OR unified prediction ─────────────────
    const unified = PhysicsEngine.predictUnified(
      input.physical_state,
      input.orch_params,
      input.orbit_context ?? {},
    );

    audit_trail.push(
      `[${timestamp}] Physics → position(${unified.physical_state.position.x.toFixed(0)}, ` +
        `${unified.physical_state.position.y.toFixed(0)}, ` +
        `${unified.physical_state.position.z.toFixed(0)}) m`,
    );
    audit_trail.push(
      `[${timestamp}] Orch-OR → coherence=${unified.orch_or_state.coherence_level.toFixed(3)} ` +
        `decision=${unified.orch_or_state.collapse_decision} ` +
        `phase=${unified.orch_or_state.phase}`,
    );

    // ── Step 3: Hard rule — COLLAPSE → immediate ABSTAIN ─────────────────
    if (unified.orch_or_state.collapse_decision === 'COLLAPSE') {
      audit_trail.push(`[${timestamp}] ABSTAIN — Orch-OR COLLAPSE triggered`);
      const nexus_hash = computeNexusHash(
        unified.physical_state.predicted_hash,
        unified.orch_or_state.predicted_hash,
        'ABSTAIN',
      );
      return NexusPoint._buildResult(
        unified,
        'UNKNOWN',
        'ABSTAIN',
        nexus_hash,
        audit_trail,
      );
    }

    // ── Step 4: Hard rule — coherence < SAFE_THRESHOLD → immediate ABSTAIN
    if (unified.orch_or_state.coherence_level < SAFE_COHERENCE_THRESHOLD) {
      audit_trail.push(
        `[${timestamp}] ABSTAIN — coherence ${unified.orch_or_state.coherence_level.toFixed(3)} ` +
          `< SAFE_THRESHOLD ${SAFE_COHERENCE_THRESHOLD}`,
      );
      const nexus_hash = computeNexusHash(
        unified.physical_state.predicted_hash,
        unified.orch_or_state.predicted_hash,
        'ABSTAIN',
      );
      return NexusPoint._buildResult(
        unified,
        'UNKNOWN',
        'ABSTAIN',
        nexus_hash,
        audit_trail,
      );
    }

    // ── Step 5: EIRA gate — compute K and epistemic classification ────────
    const k = computeK(unified);
    const epistemic = classifyEpistemic(
      unified.orch_or_state.coherence_level,
      k,
    );

    audit_trail.push(
      `[${timestamp}] EIRA gate → K=${k.toFixed(3)} epistemic=${epistemic}`,
    );

    const final_decision: FinalDecision =
      k >= K_THRESHOLD && epistemic !== 'UNKNOWN' ? 'EXECUTE' : 'ABSTAIN';

    if (final_decision === 'ABSTAIN') {
      audit_trail.push(
        `[${timestamp}] ABSTAIN — K=${k.toFixed(3)} < threshold=${K_THRESHOLD} or epistemic=UNKNOWN`,
      );
    } else {
      audit_trail.push(
        `[${timestamp}] EXECUTE — K=${k.toFixed(3)} ≥ ${K_THRESHOLD}, epistemic=${epistemic}`,
      );
    }

    const nexus_hash = computeNexusHash(
      unified.physical_state.predicted_hash,
      unified.orch_or_state.predicted_hash,
      final_decision,
    );

    audit_trail.push(`[${timestamp}] nexus_hash=${nexus_hash.slice(0, 16)}…`);

    return NexusPoint._buildResult(
      unified,
      epistemic,
      final_decision,
      nexus_hash,
      audit_trail,
    );
  }

  private static _buildResult(
    unified: UnifiedPredictionState,
    epistemic: EpistemicClassification,
    decision: FinalDecision,
    nexus_hash: string,
    audit_trail: string[],
  ): NexusResult {
    const ps = unified.physical_state;
    const os = unified.orch_or_state;
    return {
      physical_state: {
        position: ps.position,
        velocity: ps.velocity,
        acceleration: ps.acceleration,
      },
      orch_or_state: {
        coherence_level: os.coherence_level,
        collapse_decision: os.collapse_decision,
        threshold_energy: os.threshold_energy,
      },
      epistemic_classification: epistemic,
      final_decision: decision,
      nexus_hash,
      audit_trail,
    };
  }
}
