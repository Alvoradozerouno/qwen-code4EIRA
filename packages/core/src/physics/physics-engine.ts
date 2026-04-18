/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Physics Engine
 *
 * Deterministic Newtonian mechanics with Velocity-Verlet integration.
 * Supports simplified 2-body orbital mechanics for NTN satellite context.
 *
 * Design:
 *   - 100 % deterministic — zero randomness, identical inputs → identical outputs
 *   - Standard gravitational parameter μ = G·M defaults to Earth
 *   - Optional secondary attractor for 2-body perturbation
 *   - Every predicted state is SHA-256 hashed for proof-chain anchoring
 */

import { createHash } from 'crypto';
import type {
  PhysicalState,
  OrbitContext,
  SatelliteState,
  Vec3,
} from './physics-types.js';
import { OrchOREngine } from './orch-or-engine.js';
import type { OrchORState } from './orch-or-engine.js';

// ── Earth constants ─────────────────────────────────────────────────────────

/** Standard gravitational parameter for Earth: μ = G·M_⊕  (m³/s²) */
const MU_EARTH = 3.986004418e14;

/** Mean Earth radius (metres) — used for altitude computation */
const R_EARTH = 6.371e6;

// ── Vector math helpers ─────────────────────────────────────────────────────

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vecMag(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// ── Combined prediction result ──────────────────────────────────────────────

export interface UnifiedPredictionState {
  physical: PhysicalState;
  orchOR: OrchORState;
  /** ISO-8601 timestamp of this unified prediction */
  timestamp: string;
  /** Merkle hash linking physical + orch-OR states */
  nexus_hash: string;
}

// ── PhysicsEngine ───────────────────────────────────────────────────────────

export class PhysicsEngine {
  /**
   * Predict the next physical state using Velocity-Verlet integration.
   *
   * Algorithm (Verlet):
   *   r(t+dt) = r(t) + v(t)·dt + ½·a(t)·dt²
   *   a(t+dt) = F(r(t+dt)) / m
   *   v(t+dt) = v(t) + ½·(a(t) + a(t+dt))·dt
   *
   * @param state   Current physical state
   * @param context Integration parameters and gravitational environment
   * @returns Next physical state with SHA-256 hash
   */
  static predictNextPhysicalState(
    state: PhysicalState,
    context: OrbitContext,
  ): PhysicalState {
    const mu = context.mu ?? MU_EARTH;
    const dt = context.time_delta;

    // ── Step 1: position update r(t+dt) ──────────────────────────────────
    const halfDt2 = 0.5 * dt * dt;
    const next_pos: Vec3 = {
      x:
        state.position.x +
        state.velocity.x * dt +
        state.acceleration.x * halfDt2,
      y:
        state.position.y +
        state.velocity.y * dt +
        state.acceleration.y * halfDt2,
      z:
        state.position.z +
        state.velocity.z * dt +
        state.acceleration.z * halfDt2,
    };

    // ── Step 2: acceleration at new position a(t+dt) ──────────────────────
    const next_acc = PhysicsEngine._computeAcceleration(
      next_pos,
      state.mass,
      mu,
      context.secondary,
    );

    // ── Step 3: velocity update v(t+dt) ──────────────────────────────────
    const next_vel: Vec3 = {
      x: state.velocity.x + 0.5 * (state.acceleration.x + next_acc.x) * dt,
      y: state.velocity.y + 0.5 * (state.acceleration.y + next_acc.y) * dt,
      z: state.velocity.z + 0.5 * (state.acceleration.z + next_acc.z) * dt,
    };

    // ── Step 4: hash the predicted state ─────────────────────────────────
    const timestamp = new Date().toISOString();
    const hashPayload = JSON.stringify({
      position: next_pos,
      velocity: next_vel,
      acceleration: next_acc,
      mass: state.mass,
      timestamp,
    });
    const predicted_hash = createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    return {
      position: next_pos,
      velocity: next_vel,
      acceleration: next_acc,
      mass: state.mass,
      timestamp,
      predicted_hash,
    };
  }

  /**
   * Predict the next satellite state.
   * Extends the physical state with altitude and orbital speed.
   */
  static predictNextSatelliteState(
    state: PhysicalState,
    context: OrbitContext,
  ): SatelliteState {
    const next = PhysicsEngine.predictNextPhysicalState(state, context);
    const altitude = vecMag(next.position) - R_EARTH;
    const orbital_speed = vecMag(next.velocity);
    return { ...next, altitude, orbital_speed };
  }

  /**
   * Compute the unified prediction: physics + Orch-OR coherence evaluation.
   *
   * @param state          Current physical state
   * @param context        Orbital integration context
   * @param orchORVitality ORION vitality [0..1] fed into coherence decay
   * @returns Combined physical + Orch-OR state with nexus hash
   */
  static predictUnified(
    state: PhysicalState,
    context: OrbitContext,
    orchORVitality = 0.62,
  ): UnifiedPredictionState {
    // Step 1: Newtonian/Verlet physics prediction
    const physical = PhysicsEngine.predictNextPhysicalState(state, context);

    // Step 2: Orch-OR evaluation — map physical state to biological-scale inputs
    //   We map orbital energy to microtubule mass-scale analogues.
    //   Separation scales with orbital radius (normalised to tubulin-dimer range).
    // Map orbital radius to tubulin-dimer separation range.
    // Tubulin dimers have a physical size of ~4–12 nm (4e-9..12e-9 m).
    // The scaling factor 1e-15 maps megametre-scale orbital radii to nanometre scales.
    const orbitalRadius = vecMag(state.position);
    const separation = Math.max(4e-9, Math.min(12e-9, orbitalRadius * 1e-15));
    const orchORInput = OrchOREngine.inputFromDescription(
      JSON.stringify({ pos: state.position, ts: physical.timestamp }),
    );
    // Override with physics-derived separation and use provided vitality
    const orchOR = OrchOREngine.evaluate({
      ...orchORInput,
      separation,
      vitality: orchORVitality,
    });

    // Step 3: Unified nexus hash linking both states
    const timestamp = new Date().toISOString();
    const nexusPayload = JSON.stringify({
      physical_hash: physical.predicted_hash,
      orchOR_hash: orchOR.predicted_hash,
      timestamp,
    });
    const nexus_hash = createHash('sha256').update(nexusPayload).digest('hex');

    return { physical, orchOR, timestamp, nexus_hash };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Compute gravitational acceleration at position r.
   * Includes primary attractor (central body) and optional secondary.
   */
  private static _computeAcceleration(
    pos: Vec3,
    _mass: number,
    mu: number,
    secondary?: OrbitContext['secondary'],
  ): Vec3 {
    // Primary attractor: a_primary = −μ · r̂ / |r|²
    const r = vecMag(pos);
    const r3 = r * r * r;
    let acc: Vec3 = vecScale(pos, -mu / r3);

    // Optional secondary attractor perturbation
    if (secondary) {
      const G = 6.674e-11;
      const dr: Vec3 = {
        x: secondary.position.x - pos.x,
        y: secondary.position.y - pos.y,
        z: secondary.position.z - pos.z,
      };
      const dist = vecMag(dr);
      const dist3 = dist * dist * dist;
      const mu2 = G * secondary.mass;
      acc = vecAdd(acc, vecScale(dr, mu2 / dist3));
    }

    return acc;
  }
}
