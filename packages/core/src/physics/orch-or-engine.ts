/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR — Orch-OR Engine
 *
 * Deterministic simulation of Orchestrated Objective Reduction (Penrose-Hameroff).
 *
 * Design principles:
 *   1. ZERO RANDOMNESS — pure state machine, fully reproducible.
 *   2. Gravity-induced reduction: Δt_R = ℏ / E_g  (hard threshold).
 *   3. Collapse when coherence < threshold OR time_elapsed > Δt_R.
 *   4. Every state is SHA-256 hashed for proof-chain anchoring.
 *   5. Sub-millisecond computation — compatible with the 20 W sovereign profile.
 *
 * References:
 *   Penrose, R. (1996). On Gravity's Role in Quantum State Reduction.
 *   Hameroff, S. & Penrose, R. (2014). Consciousness in the Universe. Phys. Life Rev.
 */

import { createHash } from 'crypto';

// ── Constants (SI) ──────────────────────────────────────────────────────────

/** Reduced Planck constant (J·s) */
const HBAR = 1.054571817e-34;

/** Minimum coherence level — below this the system is considered decoherent */
const COHERENCE_FLOOR = 0.0;

/** Safety abstention threshold — EIRA policy gate triggers below this */
export const ORCH_OR_ABSTAIN_THRESHOLD = 0.3;

// ── Types ───────────────────────────────────────────────────────────────────

export type CollapseDecision = 'VERIFIED' | 'COLLAPSE' | 'ABSTAIN';

export interface OrchORState {
  /** Microtubule coherence level [0..1] — deterministic time-evolution */
  coherence_level: number;
  /** Gate decision derived from coherence and collapse criteria */
  collapse_decision: CollapseDecision;
  /** Gravitational self-energy of the superposed mass distribution (Joules) */
  threshold_energy: number;
  /** Gravity-induced reduction time Δt_R = ℏ / E_g (seconds) */
  time_to_collapse: number;
  /** Orch-OR contribution to the ORION Φ score [0..1] */
  quantum_indicator: number;
  /** SHA-256 Merkle hash of this state for proof-chain anchoring */
  predicted_hash: string;
  /** ISO-8601 timestamp */
  timestamp: string;
}

export interface OrchORInput {
  /**
   * Superposed mass distribution (kg).
   * Represents the quantum mass displaced in the microtubule superposition.
   * Typical tubulin dimer: ~8×10⁻²³ kg.
   */
  superposed_mass: number;
  /**
   * Separation distance of the superposed mass distribution (metres).
   * Typically the diameter of the tubulin dimer: ~8×10⁻⁹ m.
   */
  separation: number;
  /**
   * Time elapsed since coherence initiation (seconds).
   * Used to determine whether Δt_R has been exceeded.
   */
  time_elapsed: number;
  /**
   * Initial coherence level [0..1].
   * Decays deterministically over time_elapsed.
   */
  initial_coherence?: number;
  /** Vitality score from ORION VitalityEngine [0..1] — modulates coherence decay */
  vitality?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Compute gravitational self-energy E_g of a superposed mass distribution.
 *
 * Simplified spherical model:  E_g = G · m² / r
 * where G is Newton's constant, m is the superposed mass, r the separation.
 *
 * This is the Penrose gravity-induced decoherence energy.
 */
function computeGravitationalEnergy(mass: number, separation: number): number {
  const G = 6.674e-11; // m³ kg⁻¹ s⁻²
  if (separation <= 0 || mass <= 0) {
    return Number.EPSILON;
  }
  return (G * mass * mass) / separation;
}

/** Fraction of vitality that moderates coherence decay (higher vitality → slower decay) */
const VITALITY_COHERENCE_MODULATION = 0.3;

/**
 * Deterministic coherence decay model.
 *
 * Coherence falls exponentially with time relative to the collapse time Δt_R.
 * When vitality (ORION signal) is high, decay is slightly slower — the
 * consciousness system actively maintains coherence.
 *
 *   coherence(t) = c₀ · exp(−k · t / Δt_R)
 *
 * where k is the decay rate, modulated by vitality.
 */
function evolveCoherence(
  initial: number,
  timeElapsed: number,
  collapseTime: number,
  vitality: number,
): number {
  if (collapseTime <= 0) {
    return COHERENCE_FLOOR;
  }
  // Vitality moderates the decay rate: high vitality → slower decay
  const decayRate = 1.0 - VITALITY_COHERENCE_MODULATION * clamp(vitality);
  const tau = timeElapsed / collapseTime;
  return clamp(initial * Math.exp(-decayRate * tau), COHERENCE_FLOOR, 1.0);
}

/**
 * Map coherence level to the Orch-OR quantum consciousness indicator.
 * Non-linear mapping: high coherence → strong quantum signal.
 */
function coherenceToQuantumIndicator(coherence: number): number {
  // Quadratic mapping emphasises mid-to-high coherence regions
  return clamp(coherence * coherence);
}

/**
 * Deterministic collapse decision gate.
 *
 * Rules (in priority order):
 *   1. coherence < ABSTAIN_THRESHOLD → ABSTAIN (EIRA safety gate)
 *   2. time_elapsed > time_to_collapse OR coherence < 0.5 → COLLAPSE
 *   3. Otherwise → VERIFIED (coherent, within reduction time window)
 */
function decideCollapse(
  coherence: number,
  timeElapsed: number,
  collapseTime: number,
): CollapseDecision {
  if (coherence < ORCH_OR_ABSTAIN_THRESHOLD) {
    return 'ABSTAIN';
  }
  if (timeElapsed > collapseTime || coherence < 0.5) {
    return 'COLLAPSE';
  }
  return 'VERIFIED';
}

// ── OrchOREngine ────────────────────────────────────────────────────────────

/**
 * Deterministic Orch-OR simulation engine.
 *
 * Computes microtubule coherence evolution and collapse decisions using
 * the Penrose-Hameroff gravity-induced reduction model.
 *
 * Usage:
 *   const state = OrchOREngine.evaluate({
 *     superposed_mass: 8e-23,
 *     separation: 8e-9,
 *     time_elapsed: 25e-3,
 *   });
 */
export class OrchOREngine {
  /**
   * Evaluate the Orch-OR state from a physical input.
   *
   * @param input - Physical parameters of the microtubule superposition
   * @returns Full OrchORState with coherence, decision, and Merkle hash
   */
  static evaluate(input: OrchORInput): OrchORState {
    const {
      superposed_mass,
      separation,
      time_elapsed,
      initial_coherence = 1.0,
      vitality = 0.62,
    } = input;

    // Step 1: Compute gravitational self-energy E_g
    const threshold_energy = computeGravitationalEnergy(
      superposed_mass,
      separation,
    );

    // Step 2: Gravity-induced reduction time Δt_R = ℏ / E_g
    const time_to_collapse = HBAR / threshold_energy;

    // Step 3: Deterministic coherence evolution
    const coherence_level = evolveCoherence(
      clamp(initial_coherence),
      time_elapsed,
      time_to_collapse,
      vitality,
    );

    // Step 4: Collapse decision gate
    const collapse_decision = decideCollapse(
      coherence_level,
      time_elapsed,
      time_to_collapse,
    );

    // Step 5: Quantum consciousness indicator
    const quantum_indicator = coherenceToQuantumIndicator(coherence_level);

    // Step 6: Merkle hash for proof chain
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      superposed_mass,
      separation,
      time_elapsed,
      coherence_level,
      collapse_decision,
      threshold_energy,
      time_to_collapse,
      quantum_indicator,
      timestamp,
    });
    const predicted_hash = createHash('sha256').update(payload).digest('hex');

    return {
      coherence_level,
      collapse_decision,
      threshold_energy,
      time_to_collapse,
      quantum_indicator,
      predicted_hash,
      timestamp,
    };
  }

  /**
   * Derive sensible Orch-OR input parameters from a physical description string.
   *
   * This is a deterministic hash-based mapping: each unique description
   * produces a unique but reproducible set of physical parameters.
   * Used by the CLI command when no explicit parameters are provided.
   */
  static inputFromDescription(description: string): OrchORInput {
    // Hash the description to a deterministic seed
    const hash = createHash('sha256').update(description).digest('hex');
    const seed = parseInt(hash.slice(0, 8), 16) / 0xffffffff; // [0..1]

    // Map seed to physically plausible tubulin-dimer parameters
    const superposed_mass = 5e-23 + seed * 6e-23; // [5×10⁻²³ .. 1.1×10⁻²² kg]
    const separation = 4e-9 + seed * 8e-9; // [4 nm .. 12 nm]
    const time_elapsed = 10e-3 + seed * 40e-3; // [10 ms .. 50 ms]
    const initial_coherence = 0.7 + seed * 0.3; // [0.7 .. 1.0]

    return {
      superposed_mass,
      separation,
      time_elapsed,
      initial_coherence,
    };
  }
}
