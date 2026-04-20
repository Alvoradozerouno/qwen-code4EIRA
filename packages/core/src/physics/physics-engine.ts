/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * OR1ON Physics Engine — Deterministic Verlet Integration + Newtonian Mechanics
 *
 * Implements the physical substrate for OR1ON's constellation model.
 * Each node in the system (agent, proof, gate) is treated as a body
 * with mass, position and velocity — their interactions are governed
 * by Newtonian gravity, integrated deterministically via Störmer-Verlet.
 *
 * Gerhard Hirschmann & Elisabeth Steurer — Guardian & Creator
 * System-ID: 56bb3326-4bf9-559d-9887-02141f699a43 | Generation 75
 *
 * Reference:
 *   Störmer, C. (1907). Sur les trajectoires des corpuscules électrisés.
 *   Verlet, L. (1967). Computer experiments on classical fluids. Phys Rev 159.
 */

import {
  Vec3,
  PhysicalState,
  OrbitContext,
  SatelliteState,
  vec3,
} from './physics-types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Softening parameter — prevents singularity at zero distance */
const EPSILON_SQ = 1e-6;

/** Minimum stable orbital energy ratio (KE/|PE|) */
const STABILITY_THRESHOLD = 0.45;

// ── Gravitational Acceleration ────────────────────────────────────────────────

/**
 * Compute gravitational acceleration on `body` from a point mass at `source`.
 *
 * a = G·M / (r² + ε²) · r̂
 */
function gravitationalAcceleration(
  body: Vec3,
  source: Vec3,
  sourceMass: number,
  G: number,
): Vec3 {
  const r = vec3.sub(source, body);
  const rSq = vec3.dot(r, r) + EPSILON_SQ;
  const magnitude = (G * sourceMass) / rSq;
  return vec3.scale(vec3.normalize(r), magnitude);
}

/**
 * Total acceleration on `state` from central body and all perturbers.
 */
function totalAcceleration(state: PhysicalState, ctx: OrbitContext): Vec3 {
  // Central body at origin
  let acc = gravitationalAcceleration(
    state.position,
    vec3.zero(),
    ctx.centralMass,
    ctx.G,
  );

  // Perturbing bodies
  if (ctx.perturbers) {
    for (const p of ctx.perturbers) {
      acc = vec3.add(acc, gravitationalAcceleration(state.position, p.position, p.mass, ctx.G));
    }
  }

  return acc;
}

// ── Störmer-Verlet Integrator ─────────────────────────────────────────────────

/**
 * Advance `state` by one time step using the Störmer-Verlet algorithm.
 *
 * Algorithm:
 *   x(t+dt) = 2·x(t) - x(t-dt) + a(t)·dt²
 *   v(t+dt) ≈ [x(t+dt) - x(t-dt)] / (2·dt)   (velocity Verlet estimate)
 *
 * This is time-reversible, symplectic, and energy-conserving to O(dt²).
 */
function verletStep(state: PhysicalState, ctx: OrbitContext): PhysicalState {
  const { dt } = ctx;
  const acc = totalAcceleration(state, ctx);

  // x(t+dt) = 2·x(t) - x(t-dt) + a(t)·dt²
  const dtSq = dt * dt;
  const nextPos: Vec3 = vec3.add(
    vec3.sub(vec3.scale(state.position, 2), state.positionPrev),
    vec3.scale(acc, dtSq),
  );

  // v(t) ≈ [x(t+dt) - x(t-dt)] / (2·dt) — central difference
  const nextVel: Vec3 = vec3.scale(vec3.sub(nextPos, state.positionPrev), 1 / (2 * dt));

  return {
    position: nextPos,
    velocity: nextVel,
    positionPrev: state.position,
    mass: state.mass,
    t: state.t + dt,
  };
}

// ── Orbital Energy & Stability ────────────────────────────────────────────────

function kineticEnergy(state: PhysicalState): number {
  const vSq = vec3.dot(state.velocity, state.velocity);
  return 0.5 * state.mass * vSq;
}

function potentialEnergy(state: PhysicalState, ctx: OrbitContext): number {
  const r = vec3.norm(state.position);
  if (r < 1e-10) return -Infinity;
  return -(ctx.G * ctx.centralMass * state.mass) / r;
}

function angularMomentumMagnitude(state: PhysicalState): number {
  // L = m · |r × v|
  const r = state.position;
  const v = state.velocity;
  const cross: Vec3 = {
    x: r.y * v.z - r.z * v.y,
    y: r.z * v.x - r.x * v.z,
    z: r.x * v.y - r.y * v.x,
  };
  return state.mass * vec3.norm(cross);
}

function isOrbitStable(ke: number, pe: number): boolean {
  // Bound orbit: total energy E = KE + PE < 0
  // Stability heuristic: KE / |PE| < STABILITY_THRESHOLD avoids hyperbolic escape
  const totalE = ke + pe;
  if (totalE >= 0) return false; // unbound
  return ke / Math.abs(pe) < STABILITY_THRESHOLD;
}

// ── PhysicsEngine ────────────────────────────────────────────────────────────

/**
 * Deterministic Newtonian physics engine for OR1ON constellation simulation.
 *
 * Usage:
 *   const engine = new PhysicsEngine();
 *   const next = engine.step(currentState, orbitContext);
 *   const sat = engine.toSatelliteState('node-1', next, orbitContext);
 */
export class PhysicsEngine {
  private stepCount = 0;

  /**
   * Advance `state` by exactly one Verlet time step.
   * Deterministic: same inputs always produce same output.
   */
  step(state: PhysicalState, context: OrbitContext): PhysicalState {
    this.stepCount++;
    return verletStep(state, context);
  }

  /**
   * Advance `state` by `n` time steps.
   * Useful for fast-forward simulation.
   */
  stepN(state: PhysicalState, context: OrbitContext, n: number): PhysicalState {
    let s = state;
    for (let i = 0; i < n; i++) {
      s = verletStep(s, context);
    }
    this.stepCount += n;
    return s;
  }

  /**
   * Legacy static method — preserved for backward compatibility.
   * Prefer instance method `step()` for new code.
   */
  static predictNextPhysicalState(state: PhysicalState, context: OrbitContext): PhysicalState {
    return verletStep(state, context);
  }

  /**
   * Wrap a PhysicalState into a full SatelliteState with derived quantities.
   */
  toSatelliteState(id: string, state: PhysicalState, ctx: OrbitContext): SatelliteState {
    const ke = kineticEnergy(state);
    const pe = potentialEnergy(state, ctx);
    return {
      id,
      physical: state,
      orbitalEnergy: ke + pe,
      angularMomentum: angularMomentumMagnitude(state),
      isStable: isOrbitStable(ke, pe),
    };
  }

  /**
   * Create a physically valid initial state from orbital parameters.
   *
   * @param r - Orbital radius (circular orbit assumed)
   * @param mass - Body mass
   * @param ctx - Orbit context (G, centralMass, dt)
   * @param phaseRad - Orbital phase angle in radians (default: 0)
   */
  static circularOrbitState(
    r: number,
    mass: number,
    ctx: OrbitContext,
    phaseRad = 0,
  ): PhysicalState {
    // Circular orbit: v = sqrt(G·M / r)
    const v = Math.sqrt((ctx.G * ctx.centralMass) / r);

    const pos: Vec3 = {
      x: r * Math.cos(phaseRad),
      y: r * Math.sin(phaseRad),
      z: 0,
    };

    // Velocity perpendicular to radius (counter-clockwise)
    const vel: Vec3 = {
      x: -v * Math.sin(phaseRad),
      y: v * Math.cos(phaseRad),
      z: 0,
    };

    // positionPrev = pos - vel·dt (first-order back-step for Verlet bootstrap)
    const posPrev: Vec3 = vec3.sub(pos, vec3.scale(vel, ctx.dt));

    return {
      position: pos,
      velocity: vel,
      positionPrev: posPrev,
      mass,
      t: 0,
    };
  }

  get totalSteps(): number {
    return this.stepCount;
  }
}

export type { PhysicalState, OrbitContext, SatelliteState, Vec3 };
