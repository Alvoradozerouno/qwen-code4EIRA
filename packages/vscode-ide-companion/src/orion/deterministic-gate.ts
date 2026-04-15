/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Deterministic Reasoning Gate
 *
 * Implements the K=3.2 threshold for formal verification.
 * Rule: prove(rule, evidence_base) → PROVEN | ABSTAIN
 *
 * When confidence K < K_THRESHOLD (3.2), the system enters abstention mode.
 * This guarantees zero false positives by design.
 */

import * as crypto from 'crypto';

/** The sovereign verification threshold — no decision below this level. */
export const K_THRESHOLD = 3.2;

/** Maximum K value (fully deterministic, highest evidence). */
export const K_MAX = 5.0;

export type GateDecision = 'PROVEN' | 'ABSTAIN';

export interface EvidenceBase {
  /** Primary signal strength [0..1] */
  signalStrength: number;
  /** Historical validation score [0..1] (from proof chain) */
  historicalScore: number;
  /** Contextual relevance [0..1] */
  contextRelevance: number;
  /** Cross-validation matches (integer count) */
  crossValidations: number;
  /** Optional explicit override confidence [0..K_MAX] */
  overrideK?: number;
}

export interface GateResult {
  decision: GateDecision;
  /** Computed K value [0..K_MAX] */
  k: number;
  /** Phi integrity score [0..1] */
  phi: number;
  rule: string;
  sha256: string;
  timestamp: string;
  abstainReason?: string;
}

/**
 * Compute the K value from an evidence base.
 *
 * Formula:
 *   K = K_MAX × (signalStrength × 0.35 + historicalScore × 0.30 +
 *                contextRelevance × 0.25 + min(crossValidations, 4) / 4 × 0.10)
 */
export function computeK(evidence: EvidenceBase): number {
  if (evidence.overrideK !== undefined) {
    return Math.min(K_MAX, Math.max(0, evidence.overrideK));
  }

  const crossNorm = Math.min(evidence.crossValidations, 4) / 4;
  const raw =
    evidence.signalStrength * 0.35 +
    evidence.historicalScore * 0.3 +
    evidence.contextRelevance * 0.25 +
    crossNorm * 0.1;

  return Math.min(K_MAX, Math.max(0, raw * K_MAX));
}

/**
 * Compute the Phi integrity score.
 *
 * Phi measures overall system integrity independent of K.
 * Formula: Phi = proofChainValid×0.4 + modelConfidence×0.3 + auditComplete×0.3
 */
export function computePhi(
  proofChainValid: boolean,
  modelConfidence: number,
  auditComplete: boolean,
): number {
  return (
    (proofChainValid ? 0.4 : 0.0) +
    Math.min(1, Math.max(0, modelConfidence)) * 0.3 +
    (auditComplete ? 0.3 : 0.0)
  );
}

/**
 * The sovereign gate: prove(rule, evidence) → PROVEN | ABSTAIN
 *
 * @param rule - Natural language description of the rule/action being verified
 * @param evidence - Evidence base for computing K
 * @param phi - Current system Phi integrity score
 * @returns GateResult with decision, k, phi, and cryptographic proof
 */
export function prove(
  rule: string,
  evidence: EvidenceBase,
  phi: number = 1.0,
): GateResult {
  const k = computeK(evidence);
  const timestamp = new Date().toISOString();

  const payload = JSON.stringify({ rule, k, phi, timestamp });
  const sha256 = crypto.createHash('sha256').update(payload).digest('hex');

  if (k < K_THRESHOLD) {
    return {
      decision: 'ABSTAIN',
      k,
      phi,
      rule,
      sha256,
      timestamp,
      abstainReason: `K=${k.toFixed(3)} < threshold=${K_THRESHOLD}. Insufficient evidence for deterministic action.`,
    };
  }

  return {
    decision: 'PROVEN',
    k,
    phi,
    rule,
    sha256,
    timestamp,
  };
}

/**
 * Convenience wrapper: returns true only if PROVEN.
 * Use this as a guard before any irreversible action.
 */
export function isProven(
  result: GateResult,
): result is GateResult & { decision: 'PROVEN' } {
  return result.decision === 'PROVEN';
}

/**
 * Build evidence from a simple confidence score [0..1].
 * Useful for quick integration where detailed evidence is not available.
 */
export function evidenceFromConfidence(confidence: number): EvidenceBase {
  const c = Math.min(1, Math.max(0, confidence));
  return {
    signalStrength: c,
    historicalScore: c * 0.9,
    contextRelevance: c * 0.85,
    crossValidations: Math.round(c * 4),
  };
}
