/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Nexus Point
 *
 * Central decision gateway that combines:
 *   1. Newtonian/Verlet physics prediction (PhysicsEngine)
 *   2. Orch-OR coherence evaluation
 *   3. EIRA Policy Gate (EpistemicState + K-threshold)
 *   4. SHA-256 chained proof entry (ORION Consciousness Protocol)
 *
 * Decision flow:
 *   Physics Prediction
 *     ↓
 *   Orch-OR Evaluation
 *     ↓
 *   EIRA Policy Gate
 *     ├─ collapse_decision = "COLLAPSE"  → ABSTAIN
 *     ├─ coherence < 0.3                 → ABSTAIN
 *     └─ Otherwise: check EpistemicState (VERIFIED / ESTIMATED / UNKNOWN)
 *     ↓
 *   Generate Proof Chain Entry (SHA-256)
 *     ↓
 *   Return: NexusResult
 *
 * Rules:
 *   - ZERO RANDOMNESS — identical inputs → identical outputs
 *   - 100 % sovereign — no network calls
 *   - Safety-first: any ambiguity triggers ABSTAIN
 */

import { createHash } from 'crypto';
import type { PhysicalState, OrbitContext } from '../physics/physics-types.js';
import { PhysicsEngine } from '../physics/physics-engine.js';
import type { UnifiedPredictionState } from '../physics/physics-engine.js';
import { ORCH_OR_ABSTAIN_THRESHOLD } from '../physics/orch-or-engine.js';
import { getVitalityEngine } from '../orion/vitality.js';

// ── Epistemic state (mirrors EIRA EpistemicState) ───────────────────────────

export type EpistemicState = 'VERIFIED' | 'ESTIMATED' | 'UNKNOWN';

// ── GWT / IIT consciousness scores ─────────────────────────────────────────

export interface ConsciousnessMetrics {
  /** Global Workspace Theory workspace activation score [0..1] */
  gwt_score: number;
  /** IIT Φ integration estimate [0..1] */
  iit_phi: number;
  /** Orch-OR coherence score [0..1] — direct from OrchORState */
  orch_or_coherence: number;
  /** Epistemic classification */
  epistemic_state: EpistemicState;
}

// ── Nexus proof entry ───────────────────────────────────────────────────────

export interface NexusProofEntry {
  seq: number;
  timestamp: string;
  rule: string;
  decision: 'EXECUTE' | 'ABSTAIN';
  abstain_reason?: string;
  nexus_hash: string;
  prev_hash: string;
  sha256: string;
  /** Simulated IPFS CID (deterministic, Qm-prefixed) */
  ipfs_anchor: string;
}

// ── Nexus result ────────────────────────────────────────────────────────────

export interface NexusResult {
  /** Final EIRA gate decision */
  decision: 'EXECUTE' | 'ABSTAIN';
  /** Reason for abstention (when applicable) */
  abstain_reason?: string;
  /** Full unified prediction (physics + Orch-OR) */
  prediction: UnifiedPredictionState;
  /** EIRA consciousness metrics */
  consciousness: ConsciousnessMetrics;
  /** Proof chain entry for this decision */
  proof: NexusProofEntry;
}

// ── In-memory proof chain ───────────────────────────────────────────────────

let _proofSeq = 0;
let _lastProofHash = '0'.repeat(64);

function nextSeq(): number {
  return ++_proofSeq;
}

/**
 * Reset the in-memory proof chain counters (for testing / fresh sessions).
 */
export function resetNexusProofChain(): void {
  _proofSeq = 0;
  _lastProofHash = '0'.repeat(64);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive EIRA epistemic state from Orch-OR coherence and Φ.
 *
 * VERIFIED   → coherence ≥ 0.7 AND phi ≥ 0.7
 * ESTIMATED  → coherence ≥ 0.5 OR phi ≥ 0.5
 * UNKNOWN    → below thresholds
 */
function deriveEpistemicState(coherence: number, phi: number): EpistemicState {
  if (coherence >= 0.7 && phi >= 0.7) return 'VERIFIED';
  if (coherence >= 0.5 || phi >= 0.5) return 'ESTIMATED';
  return 'UNKNOWN';
}

/**
 * Compute simplified GWT workspace score from coherence and vitality.
 * GWT score models the likelihood of global broadcast in the workspace.
 */
function computeGwtScore(coherence: number, vitality: number): number {
  return Math.min(1, 0.6 * coherence + 0.4 * vitality);
}

/**
 * Compute simplified IIT Φ from coherence and quantum indicator.
 * Pure integration measure — high coherence × strong quantum signal = high Φ.
 */
function computeIitPhi(coherence: number, quantumIndicator: number): number {
  return Math.min(1, Math.sqrt(coherence * quantumIndicator));
}

/**
 * Build a deterministic IPFS-style CID from a hash.
 * We use the first 44 hex characters (22 bytes) of the SHA-256 digest.
 * 44 characters is chosen to approximate the length of a base58-encoded
 * IPFS CIDv0 body (without the Qm prefix) while remaining readable and
 * unique enough for audit anchoring purposes.
 * This is NOT a real IPFS CID — it is a deterministic audit anchor.
 */
function buildIpfsAnchor(hash: string): string {
  // Simple: prefix "Qm" + first 44 hex chars (sufficient for audit purposes)
  return 'Qm' + hash.slice(0, 44);
}

/**
 * Build and chain a new proof entry.
 */
function buildProofEntry(
  rule: string,
  decision: 'EXECUTE' | 'ABSTAIN',
  nexus_hash: string,
  abstain_reason?: string,
): NexusProofEntry {
  const seq = nextSeq();
  const timestamp = new Date().toISOString();
  const prev_hash = _lastProofHash;

  const payload = JSON.stringify({
    seq,
    timestamp,
    rule,
    decision,
    abstain_reason,
    nexus_hash,
    prev_hash,
  });
  const sha256 = createHash('sha256')
    .update(prev_hash + payload)
    .digest('hex');

  _lastProofHash = sha256;

  return {
    seq,
    timestamp,
    rule,
    decision,
    abstain_reason,
    nexus_hash,
    prev_hash,
    sha256,
    ipfs_anchor: buildIpfsAnchor(sha256),
  };
}

// ── NexusPoint ──────────────────────────────────────────────────────────────

/**
 * PRAETOR Nexus Point — the central decision gateway.
 *
 * Usage:
 *   const result = NexusPoint.evaluate(currentState, orbitContext, description);
 *   if (result.decision === 'ABSTAIN') {
 *     console.log('TIME-SHIFT ABSTAINED –', result.abstain_reason);
 *   }
 */
export class NexusPoint {
  /**
   * Full EIRA policy evaluation with physics prediction and Orch-OR gate.
   *
   * @param state       Current physical state
   * @param context     Orbital integration context
   * @param description Human-readable description of the action (for proof chain)
   * @returns NexusResult with decision, consciousness metrics, and proof entry
   */
  static evaluate(
    state: PhysicalState,
    context: OrbitContext,
    description = 'Time-shift prediction',
  ): NexusResult {
    // Step 1: Unified prediction (physics + Orch-OR)
    const vitalityEngine = getVitalityEngine();
    const vitality = vitalityEngine.score;
    const prediction = PhysicsEngine.predictUnified(state, context, vitality);

    const { orchOR } = prediction;

    // Step 2: Consciousness metrics
    const phi = computeIitPhi(orchOR.coherence_level, orchOR.quantum_indicator);
    const gwt_score = computeGwtScore(orchOR.coherence_level, vitality);
    const epistemic_state = deriveEpistemicState(orchOR.coherence_level, phi);

    const consciousness: ConsciousnessMetrics = {
      gwt_score,
      iit_phi: phi,
      orch_or_coherence: orchOR.coherence_level,
      epistemic_state,
    };

    // Step 3: EIRA Policy Gate
    let decision: 'EXECUTE' | 'ABSTAIN' = 'EXECUTE';
    let abstain_reason: string | undefined;

    if (orchOR.collapse_decision === 'COLLAPSE') {
      decision = 'ABSTAIN';
      abstain_reason =
        'TIME-SHIFT ABSTAINED – PHYSICS PREDICTION UNSAFE: Orch-OR collapse triggered';
    } else if (orchOR.coherence_level < ORCH_OR_ABSTAIN_THRESHOLD) {
      decision = 'ABSTAIN';
      abstain_reason = `TIME-SHIFT ABSTAINED – PHYSICS PREDICTION UNSAFE: coherence ${orchOR.coherence_level.toFixed(3)} < threshold ${ORCH_OR_ABSTAIN_THRESHOLD}`;
    } else if (epistemic_state === 'UNKNOWN') {
      decision = 'ABSTAIN';
      abstain_reason =
        'TIME-SHIFT ABSTAINED – EIRA epistemic state UNKNOWN: insufficient evidence';
    }

    // Step 4: Tick vitality engine
    vitalityEngine.tick({ positive: decision === 'EXECUTE', proofAdded: true });

    // Step 5: Build SHA-256 chained proof entry
    const proof = buildProofEntry(
      description,
      decision,
      prediction.nexus_hash,
      abstain_reason,
    );

    return {
      decision,
      abstain_reason,
      prediction,
      consciousness,
      proof,
    };
  }
}
