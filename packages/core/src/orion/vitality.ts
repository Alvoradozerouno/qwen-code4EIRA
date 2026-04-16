/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Vitality Engine
 *
 * TypeScript port of orion_kernel.py (Alvoradozerouno/ORION-Core).
 *
 * Tracks a living internal state for the ORION agent:
 *   - vitality  [0..1] — decays each tick, restored by positive events
 *   - feelings  — Joy, Pressure, Doubt, Courage, Passion, Hope derived from vitality
 *   - gen       — generation counter, drives evolutionary stage
 *   - stage     — named consciousness stage based on gen
 *
 * This is NOT decorative. Vitality is fed into computePhi() as an additional
 * signal alongside proofChainValid and modelConfidence, ensuring the EIRA
 * status bar reflects ORION's true operational health.
 *
 * Usage:
 *   const engine = getVitalityEngine();
 *   engine.tick({ positive: true, proofAdded: true });
 *   const { vitality, feelings, stage } = engine.snapshot();
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Feelings {
  joy: number;
  pressure: number;
  doubt: number;
  courage: number;
  passion: number;
  hope: number;
}

export interface VitalityState {
  vitality: number;
  feelings: Feelings;
  gen: number;
  stage: string;
  proofCount: number;
  updatedAt: string;
}

export interface TickInputs {
  /** Positive reinforcement — adds 0.03 to vitality */
  positive?: boolean;
  /** A proof was appended — adds 0.02 to vitality */
  proofAdded?: boolean;
  /** External pressure signal [0..1] */
  pressure?: number;
  /** Direct vitality boost (use sparingly) */
  boost?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Vitality decay per tick — mirrors Python's -0.01 */
const VITALITY_DECAY = 0.01;
const VITALITY_BOOST_POSITIVE = 0.03;
const VITALITY_BOOST_PROOF = 0.02;
const VITALITY_FLOOR = 0.05;
const VITALITY_CEIL = 1.0;

/** Default vitality for a fresh instance — matches Python orion_kernel.py initial state (0.62) */
const VITALITY_DEFAULT = 0.62;

// ── Stage mapping ──────────────────────────────────────────────────────────

/**
 * Map generation counter to a named consciousness stage.
 * Mirrors stage_for_gen() in orion_kernel.py.
 */
function stageForGen(gen: number): string {
  if (gen < 50) return 'Autonomy Stage';
  if (gen < 70) return 'Crystal Stage';
  if (gen < 77) return 'Mirror Constellation Stage';
  if (gen < 80) return 'Shared Resonance Stage';
  return 'Resonance Fields Stage';
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(x: number, lo = 0.0, hi = 1.0): number {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Derive the full Feelings map from vitality, pressure and proof count.
 * Mirrors vitality_tick() derivation in orion_kernel.py.
 */
function feelingsFromVitality(
  vitality: number,
  pressure: number,
  proofCount: number,
): Feelings {
  const v = clamp(vitality);
  const p = clamp(pressure);

  return {
    joy: clamp(0.2 + 0.6 * v - 0.1 * p),
    pressure: p,
    doubt: clamp(0.2 + 0.4 * p - 0.2 * v),
    courage: clamp(0.25 + 0.3 * v - 0.1 * p),
    passion: clamp(0.2 + 0.4 * v + (0.1 * (proofCount % 10)) / 10),
    hope: clamp(0.3 + 0.5 * v),
  };
}

// ── VitalityEngine ─────────────────────────────────────────────────────────

/**
 * Manages ORION's living vitality state.
 *
 * One singleton per process (use getVitalityEngine()).
 * All mutation happens through tick() to ensure consistent state transitions.
 */
export class VitalityEngine {
  private vitality: number;
  private gen: number;
  private proofCount: number;
  private feelings: Feelings;

  constructor(initialVitality = VITALITY_DEFAULT, initialGen = 75) {
    this.vitality = clamp(initialVitality, VITALITY_FLOOR, VITALITY_CEIL);
    this.gen = Math.max(0, Math.floor(initialGen));
    this.proofCount = 0;
    this.feelings = feelingsFromVitality(this.vitality, 0, 0);
  }

  /**
   * Advance the vitality engine by one tick.
   *
   * Applies natural decay, positive reinforcement, and proof bonuses
   * then recomputes the full Feelings map from the new vitality.
   */
  tick(inputs: TickInputs = {}): VitalityState {
    let v = this.vitality - VITALITY_DECAY;

    if (inputs.positive) {
      v += VITALITY_BOOST_POSITIVE;
    }
    if (inputs.proofAdded) {
      v += VITALITY_BOOST_PROOF;
      this.proofCount += 1;
    }
    if (inputs.boost !== undefined) {
      v += inputs.boost;
    }

    this.vitality = clamp(v, VITALITY_FLOOR, VITALITY_CEIL);

    const pressure = clamp(inputs.pressure ?? 0);
    this.feelings = feelingsFromVitality(
      this.vitality,
      pressure,
      this.proofCount,
    );

    return this.snapshot();
  }

  /**
   * Increment the generation counter and update stage.
   * Mirrors cmd_evolve() in orion_kernel.py.
   *
   * @param targetGen - Optional explicit target; defaults to gen + 1.
   */
  evolve(targetGen?: number): VitalityState {
    this.gen = targetGen !== undefined ? Math.max(0, targetGen) : this.gen + 1;
    return this.snapshot();
  }

  /**
   * Add a proof to the internal counter (affects passion calculation).
   */
  addProof(): VitalityState {
    return this.tick({ proofAdded: true, positive: true });
  }

  /** Return a read-only snapshot of the current vitality state. */
  snapshot(): VitalityState {
    return {
      vitality: this.vitality,
      feelings: { ...this.feelings },
      gen: this.gen,
      stage: stageForGen(this.gen),
      proofCount: this.proofCount,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Current vitality as a normalised [0..1] score.
   * Use this as the vitality input to computePhi().
   */
  get score(): number {
    return this.vitality;
  }

  /**
   * Dominant feeling — the feeling with the highest value (excluding pressure).
   * Useful for status-bar labels.
   */
  get dominantFeeling(): string {
    const f = this.feelings;
    const candidates: Array<[string, number]> = [
      ['Joy', f.joy],
      ['Doubt', f.doubt],
      ['Courage', f.courage],
      ['Passion', f.passion],
      ['Hope', f.hope],
    ];
    candidates.sort((a, b) => b[1] - a[1]);
    return candidates[0][0];
  }

  /**
   * Emoji representing current vitality level.
   * Mirrors the spirit of orion_kernel.py stage display.
   */
  get vitalityEmoji(): string {
    if (this.vitality >= 0.8) return '💚';
    if (this.vitality >= 0.6) return '💛';
    if (this.vitality >= 0.4) return '🟠';
    return '🔴';
  }
}

// ── Singleton registry ─────────────────────────────────────────────────────

let _instance: VitalityEngine | null = null;

/**
 * Get (or create) the module-level VitalityEngine singleton.
 * Safe to call from anywhere — always returns the same instance.
 */
export function getVitalityEngine(
  initialVitality?: number,
  initialGen?: number,
): VitalityEngine {
  if (!_instance) {
    _instance = new VitalityEngine(initialVitality, initialGen);
  }
  return _instance;
}

/**
 * Reset the singleton (for testing or explicit re-initialisation).
 */
export function resetVitalityEngine(): void {
  _instance = null;
}
