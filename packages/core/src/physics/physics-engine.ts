/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic Physics Engine
 *
 * Implements Verlet integration for Newtonian mechanics with optional
 * two-body gravitational force (NTN satellite context).
 *
 * Integration order (per PhysicsEngine.predictNextPhysicalState):
 *   1. Newtonian / Verlet physics prediction
 *   2. Orch-OR coherence evaluation
 *   3. Determine if coherence allows continued prediction or triggers collapse
 *   4. Combine physical_state + orch_or_state → UnifiedPredictionState
 */

import * as crypto from 'crypto';
import type { PhysicalState, OrbitContext, Vec3 } from './physics-types.js';
import {
  OrchOREngine,
  type OrchORParams,
  type OrchORState,
} from './orch-or-engine.js';

export type { PhysicalState, OrbitContext };
export type { SatelliteState } from './physics-types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Earth standard gravitational parameter μ = GM (m³/s²) */
const EARTH_MU = 3.986004418e14;

/** Default integration time step (seconds) */
const DEFAULT_TIME_DELTA = 1.0;

// ── Helpers ───────────────────────────────────────────────────────────────────

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vecMagnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Compute gravitational acceleration vector toward the central body (origin).
 *   a = −(μ / |r|³) · r
 */
function gravitationalAcceleration(position: Vec3, mu: number): Vec3 {
  const r = vecMagnitude(position);
  if (r < 1.0) {
    // Avoid singularity — return zero acceleration
    return { x: 0, y: 0, z: 0 };
  }
  const scale = -mu / (r * r * r);
  return vecScale(position, scale);
}

/**
 * Deterministic Merkle hash for a physical state.
 */
function hashPhysicalState(
  state: Omit<PhysicalState, 'predicted_hash'>,
): string {
  const payload = JSON.stringify({
    position: state.position,
    velocity: state.velocity,
    acceleration: state.acceleration,
    mass: state.mass,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ── Unified prediction output ─────────────────────────────────────────────────

export interface UnifiedPredictionState {
  physical_state: PhysicalState;
  orch_or_state: OrchORState;
  /** True when Orch-OR coherence allows continued prediction */
  coherence_ok: boolean;
}

// ── PhysicsEngine ─────────────────────────────────────────────────────────────

export class PhysicsEngine {
  /**
   * Predict the next physical state using deterministic Verlet integration.
   *
   * Algorithm (velocity Verlet):
   *   1. r(t+Δt) = r(t) + v(t)·Δt + ½·a(t)·Δt²
   *   2. a(t+Δt) = gravitational_acceleration(r(t+Δt))
   *   3. v(t+Δt) = v(t) + ½·[a(t) + a(t+Δt)]·Δt
   *
   * @param state   - Current kinematic state.
   * @param context - Optional orbital context (time_delta, mu).
   * @returns         Predicted state at t+Δt.
   */
  static predictNextPhysicalState(
    state: PhysicalState,
    context: OrbitContext = {},
  ): PhysicalState {
    const dt = context.time_delta ?? DEFAULT_TIME_DELTA;
    const mu = context.mu ?? EARTH_MU;

    const { position, velocity, acceleration } = state;

    // Step 1: advance position
    const halfDtSquared = 0.5 * dt * dt;
    const newPosition: Vec3 = vecAdd(
      vecAdd(position, vecScale(velocity, dt)),
      vecScale(acceleration, halfDtSquared),
    );

    // Step 2: recompute acceleration at new position
    const newAcceleration = gravitationalAcceleration(newPosition, mu);

    // Step 3: advance velocity (average of old + new acceleration)
    const avgAcc = vecScale(vecAdd(acceleration, newAcceleration), 0.5);
    const newVelocity: Vec3 = vecAdd(velocity, vecScale(avgAcc, dt));

    const nextState: Omit<PhysicalState, 'predicted_hash'> = {
      position: newPosition,
      velocity: newVelocity,
      acceleration: newAcceleration,
      mass: state.mass,
    };

    return {
      ...nextState,
      predicted_hash: hashPhysicalState(nextState),
    };
  }

  /**
   * Full unified prediction: Newtonian physics → Orch-OR coherence evaluation.
   *
   * Integration order (per PRAETOR specification):
   *   1. Run Verlet physics prediction.
   *   2. Apply Orch-OR coherence evaluation.
   *   3. Determine if coherence allows continued prediction or triggers collapse.
   *   4. Return combined physical_state + orch_or_state.
   *
   * @param state      - Current kinematic state.
   * @param orchParams - Orch-OR parameters for this prediction step.
   * @param context    - Optional orbital context.
   * @returns            UnifiedPredictionState.
   */
  static predictUnified(
    state: PhysicalState,
    orchParams: OrchORParams,
    context: OrbitContext = {},
  ): UnifiedPredictionState {
    // Step 1: Newtonian / Verlet physics prediction
    const physical_state = PhysicsEngine.predictNextPhysicalState(
      state,
      context,
    );

    // Step 2: Orch-OR coherence evaluation
    const orch_or_state = OrchOREngine.predictOrchORState(orchParams);

    // Step 3: coherence gate
    const coherence_ok = orch_or_state.collapse_decision === 'VERIFIED';

    return {
      physical_state,
      orch_or_state,
      coherence_ok,
    };
  }
}
