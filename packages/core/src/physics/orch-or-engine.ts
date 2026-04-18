/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic Orch-OR (Orchestrated Objective Reduction) Engine
 *
 * Classical simulation of the Penrose-Hameroff model.
 * ALL transitions are governed by hard rules — zero randomness.
 *
 * Physical basis
 * ──────────────
 *  • Gravity-induced objective-reduction threshold (Penrose 1996):
 *      Δt_R = ℏ / E_g
 *    where E_g is the gravitational self-energy of the mass superposition.
 *    For a sphere of radius r:
 *      E_g ≈ G·m²/r    (simplified single-body approximation)
 *    We use r = (3·m / (4π·ρ))^(1/3) with ρ = 1 500 kg/m³ (microtubule density).
 *
 *  • Collapse fires when EITHER:
 *      1. coherence_level < collapse_threshold, OR
 *      2. time_delta ≥ Δt_R (reduction time exceeded)
 *
 * State machine (deterministic):
 *   COHERENT  →  THRESHOLD_CROSSED  →  COLLAPSE
 *
 * Output
 * ──────
 *   OrchORState  with  collapse_decision  ∈  { "VERIFIED" | "COLLAPSE" | "ABSTAIN" }
 */

import * as crypto from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Reduced Planck constant (J·s) */
const HBAR = 1.0545718e-34;

/** Gravitational constant (m³ kg⁻¹ s⁻²) */
const G = 6.674e-11;

/** Microtubule protein density (kg/m³) — tubulin dimer approximation */
const MICROTUBULE_DENSITY = 1500;

/** Safe coherence threshold below which the engine enters ABSTAIN */
export const SAFE_COHERENCE_THRESHOLD = 0.3;

/** Coherence decay rate per second (deterministic) */
const COHERENCE_DECAY_RATE = 0.05;

/** Coherence restoration per unit energy (normalised) */
const COHERENCE_ENERGY_GAIN = 0.1;

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface OrchORParams {
  /** Current coherence level [0..1] */
  current_coherence_level: number;
  /** Mass of the quantum system (kg) — microtubule / protein complex */
  mass: number;
  /** Normalised energy state [0..1]; higher → better coherence maintenance */
  energy_state: number;
  /** Time elapsed since last evaluation (seconds) */
  time_delta: number;
}

export type CollapseDecision = 'VERIFIED' | 'COLLAPSE' | 'ABSTAIN';

export interface OrchORState {
  /** Updated coherence level after time evolution [0..1] */
  coherence_level: number;
  /** Hard deterministic collapse decision */
  collapse_decision: CollapseDecision;
  /** Gravitational self-energy (Joules) */
  threshold_energy: number;
  /** Penrose reduction time Δt_R (seconds) */
  reduction_time: number;
  /** Deterministic state-machine phase */
  phase: 'COHERENT' | 'THRESHOLD_CROSSED' | 'COLLAPSE';
  /** Merkle hash commitment for this prediction */
  predicted_hash: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute the effective radius of a sphere with given mass and density.
 * r = ∛( 3m / (4π·ρ) )
 */
function effectiveRadius(mass: number): number {
  return Math.cbrt((3 * mass) / (4 * Math.PI * MICROTUBULE_DENSITY));
}

/**
 * Compute gravitational self-energy: E_g ≈ G·m²/r
 * Returns energy in Joules.
 */
function gravitationalSelfEnergy(mass: number): number {
  const r = effectiveRadius(mass);
  if (r <= 0) return Number.EPSILON;
  return (G * mass * mass) / r;
}

/**
 * Penrose reduction time: Δt_R = ℏ / E_g (seconds)
 */
function penroseReductionTime(energy: number): number {
  if (energy <= 0) return Number.MAX_SAFE_INTEGER;
  return HBAR / energy;
}

/**
 * Deterministic coherence evolution over time_delta:
 *   coherence(t+Δt) = coherence(t) · e^(−decay·Δt) + energy_gain·Δt
 *
 * Uses a closed-form approximation to keep arithmetic deterministic.
 */
function evolveCoherence(
  coherence: number,
  energy_state: number,
  time_delta: number,
): number {
  // Decay term (exponential approximated via first-order Taylor for small Δt)
  const decayFactor = Math.max(0, 1 - COHERENCE_DECAY_RATE * time_delta);
  const gain = COHERENCE_ENERGY_GAIN * energy_state * time_delta;
  const evolved = coherence * decayFactor + gain;
  return Math.min(1.0, Math.max(0.0, evolved));
}

/**
 * Compute a deterministic Merkle-style hash commitment for an Orch-OR state.
 * Uses SHA-256 over a canonical JSON serialisation.
 */
function computePredictedHash(
  params: OrchORParams,
  state: Partial<OrchORState>,
): string {
  const payload = JSON.stringify({ params, state });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ── OrchOREngine ──────────────────────────────────────────────────────────────

/**
 * Deterministic Orch-OR simulation engine.
 *
 * All transitions follow hard rules; there is no stochastic sampling.
 */
export class OrchOREngine {
  /**
   * Predict the Orch-OR state from current parameters.
   *
   * Algorithm:
   *   1. Evolve coherence deterministically over time_delta.
   *   2. Compute gravitational self-energy E_g for the given mass.
   *   3. Compute Penrose reduction time Δt_R = ℏ / E_g.
   *   4. Determine state-machine phase and collapse decision via hard rules.
   *   5. Generate Merkle hash commitment.
   *
   * @param params - Current Orch-OR input parameters.
   * @returns       Fully resolved OrchORState.
   */
  static predictOrchORState(params: OrchORParams): OrchORState {
    const { current_coherence_level, mass, energy_state, time_delta } = params;

    // ── Step 1: deterministic coherence evolution ─────────────────────────
    const evolved_coherence = evolveCoherence(
      Math.min(1.0, Math.max(0.0, current_coherence_level)),
      Math.min(1.0, Math.max(0.0, energy_state)),
      Math.max(0, time_delta),
    );

    // ── Step 2 & 3: gravitational self-energy and reduction time ──────────
    const safeMass = Math.max(Number.EPSILON, mass);
    const threshold_energy = gravitationalSelfEnergy(safeMass);
    const reduction_time = penroseReductionTime(threshold_energy);

    // ── Step 4: deterministic state-machine ───────────────────────────────
    //   Rule A: time_delta ≥ Δt_R  →  reduction time exceeded → COLLAPSE
    //   Rule B: evolved_coherence < SAFE_THRESHOLD  →  ABSTAIN
    //   Rule C: otherwise → phase depends on proximity to threshold

    let phase: OrchORState['phase'];
    let collapse_decision: CollapseDecision;

    if (time_delta >= reduction_time) {
      // Hard collapse rule A
      phase = 'COLLAPSE';
      collapse_decision = 'COLLAPSE';
    } else if (evolved_coherence < SAFE_COHERENCE_THRESHOLD) {
      // Hard collapse rule B
      phase = 'THRESHOLD_CROSSED';
      collapse_decision = 'ABSTAIN';
    } else {
      // Coherent — further classify phase
      const proximity = evolved_coherence - SAFE_COHERENCE_THRESHOLD;
      if (proximity < 0.15) {
        // Within 15% of safe threshold — approaching but not crossed
        phase = 'THRESHOLD_CROSSED';
      } else {
        phase = 'COHERENT';
      }
      collapse_decision = 'VERIFIED';
    }

    // ── Step 5: Merkle hash commitment ────────────────────────────────────
    const partial: Partial<OrchORState> = {
      coherence_level: evolved_coherence,
      collapse_decision,
      threshold_energy,
      reduction_time,
      phase,
    };
    const predicted_hash = computePredictedHash(params, partial);

    return {
      coherence_level: evolved_coherence,
      collapse_decision,
      threshold_energy,
      reduction_time,
      phase,
      predicted_hash,
    };
  }
}
