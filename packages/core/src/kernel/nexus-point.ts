/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Nexus-Point — Precausal Inference Buffer
 *
 * Integrates the PhysicsEngine with the EIRA Policy Gate to provide
 * a deterministic, sovereign time-shift prediction pipeline:
 *
 *   1. PhysicsEngine.predictNextPhysicalState(current_state)
 *   2. Precausal Buffer caches the predicted state
 *   3. EIRA Policy Gate (EpistemicState + VERIFIED_STABLE + Abstention)
 *   4. Output: VERIFIED | ESTIMATED | UNKNOWN  +  EXECUTE | ABSTAIN
 *
 * All computation is local — no cloud, no external APIs.
 * 20W sovereign profile: sub-millisecond per call.
 */

import * as crypto from 'crypto';
import {
  predictNextPhysicalState,
  classifyEpistemicState,
  type PhysicalState,
  type PhysicsInput,
  type EpistemicClass,
} from '../physics/physics-engine.js';
import { getVitalityEngine } from '../orion/vitality.js';

// ── Types ──────────────────────────────────────────────────────────────────

export type NexusDecision = 'EXECUTE' | 'ABSTAIN';

/** Full result returned by the Nexus-Point pipeline. */
export interface NexusResult {
  /** Physically predicted next state (Verlet integration). */
  predictedState: PhysicalState;
  /** EIRA epistemic classification of the predicted state. */
  epistemicClass: EpistemicClass;
  /** Whether this prediction is considered VERIFIED_STABLE. */
  verifiedStable: boolean;
  /** Gate decision: EXECUTE (safe) or ABSTAIN (unsafe). */
  decision: NexusDecision;
  /** Human-readable reason for an ABSTAIN decision. */
  abstainReason?: string;
  /** SHA-256 Merkle hash chaining prediction + gate result. */
  nexusHash: string;
  /** ISO timestamp of the nexus evaluation. */
  timestamp: string;
  /** Commitment proof string for the audit trail. */
  auditCommitment: string;
}

// ── Precausal Buffer ───────────────────────────────────────────────────────

/**
 * Module-level precausal buffer.
 * Caches the most recent physically predicted state across calls.
 * (Single-entry ring buffer — per the 20W sovereign profile.)
 */
let _precausalBuffer: PhysicalState | null = null;

/** Read the most recently cached precausal state (may be null). */
export function getPrecausalBuffer(): PhysicalState | null {
  return _precausalBuffer;
}

/** Manually clear the buffer (e.g., between experiments). */
export function clearPrecausalBuffer(): void {
  _precausalBuffer = null;
}

// ── Nexus-Point Pipeline ───────────────────────────────────────────────────

/**
 * Run the full Nexus-Point Precausal Inference pipeline.
 *
 * Steps:
 *  1. Call PhysicsEngine to predict next physical state (Verlet).
 *  2. Cache result in the Precausal Buffer.
 *  3. Apply EIRA Policy Gate:
 *     - Classify EpistemicState (VERIFIED / ESTIMATED / UNKNOWN).
 *     - Check VERIFIED_STABLE marker (requires VERIFIED + VitalityEngine score ≥ 0.5).
 *     - Trigger Abstention if state is UNKNOWN or vitality is critically low.
 *  4. Compute Merkle Nexus Hash chaining physics hash + gate verdict.
 *  5. Return structured NexusResult.
 *
 * @param input - Current physical state and integration parameters.
 * @returns NexusResult with predicted state, epistemic class, and gate decision.
 */
export function runNexusPoint(input: PhysicsInput): NexusResult {
  // ── Step 1: Physics prediction ─────────────────────────────────────────
  const predictedState = predictNextPhysicalState(input);

  // ── Step 2: Precausal Buffer ───────────────────────────────────────────
  _precausalBuffer = predictedState;

  // ── Step 3a: Epistemic classification ─────────────────────────────────
  const epistemicClass = classifyEpistemicState(predictedState);

  // ── Step 3b: VERIFIED_STABLE check ────────────────────────────────────
  const vitality = getVitalityEngine().score;
  const verifiedStable = epistemicClass === 'VERIFIED' && vitality >= 0.5;

  // ── Step 3c: Abstention logic ──────────────────────────────────────────
  let decision: NexusDecision = 'EXECUTE';
  let abstainReason: string | undefined;

  if (epistemicClass === 'UNKNOWN') {
    decision = 'ABSTAIN';
    abstainReason =
      'TIME-SHIFT ABSTAINED – PHYSICS PREDICTION UNSAFE: predicted trajectory enters impact zone (r ≤ surface radius).';
  } else if (epistemicClass === 'ESTIMATED' && vitality < 0.3) {
    decision = 'ABSTAIN';
    abstainReason = `TIME-SHIFT ABSTAINED – ESTIMATED state with critically low vitality (v=${vitality.toFixed(3)} < 0.3). Insufficient confidence for deterministic action.`;
  } else if (!verifiedStable && epistemicClass === 'VERIFIED') {
    decision = 'ABSTAIN';
    abstainReason = `TIME-SHIFT ABSTAINED – VERIFIED state but vitality below VERIFIED_STABLE threshold (v=${vitality.toFixed(3)} < 0.5).`;
  }

  // ── Step 4: Merkle Nexus Hash ──────────────────────────────────────────
  const timestamp = new Date().toISOString();
  const nexusPayload = JSON.stringify({
    predictedHash: predictedState.predictedHash,
    epistemicClass,
    verifiedStable,
    decision,
    timestamp,
  });
  const nexusHash = crypto
    .createHash('sha256')
    .update(nexusPayload)
    .digest('hex');

  // Audit commitment: chain physics hash → nexus hash
  const auditPayload = `${predictedState.predictedHash}:${nexusHash}:${timestamp}`;
  const auditCommitment = crypto
    .createHash('sha256')
    .update(auditPayload)
    .digest('hex');

  // ── Step 5: Tick VitalityEngine ────────────────────────────────────────
  getVitalityEngine().tick({
    positive: decision === 'EXECUTE',
    proofAdded: true,
  });

  return {
    predictedState,
    epistemicClass,
    verifiedStable,
    decision,
    abstainReason,
    nexusHash,
    timestamp,
    auditCommitment,
  };
}
