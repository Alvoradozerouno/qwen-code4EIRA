/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * OR1ON Physics Engine — Deterministic Verlet Integration + Newtonian Mechanics
 *
 * Gerhard Hirschmann & Elisabeth Steurer — Guardian & Creator
 * System-ID: 56bb3326-4bf9-559d-9887-02141f699a43 | Generation 75
 */

import type {
  Vec3,
  PhysicalState,
  OrbitContext,
  SatelliteState,
} from './physics-types.js';
import { vec3 } from './physics-types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const EPSILON_SQ = 1e-6;
const STABILITY_THRESHOLD = 0.45;

// ── Gravitational Acceleration ────────────────────────────────────────────────

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

function totalAcceleration(state: PhysicalState, ctx: OrbitContext): Vec3 {
  let acc = gravitationalAcceleration(
    state.position,
    vec3.zero(),
    ctx.centralMass,
    ctx.G,
  );
  if (ctx.perturbers) {
    for (const p of ctx.perturbers) {
      acc = vec3.add(acc, gravitationalAcceleration(state.position, p.position, p.mass, ctx.G));
    }
  }
  return acc;
}

// ── Störmer-Verlet Integrator ─────────────────────────────────────────────────

function verletStep(state: PhysicalState, ctx: OrbitContext): PhysicalState {
  const { dt } = ctx;
  const acc = totalAcceleration(state, ctx);
  const dtSq = dt * dt;

  const nextPos: Vec3 = vec3.add(
    vec3.sub(vec3.scale(state.position, 2), state.positionPrev),
    vec3.scale(acc, dtSq),
  );
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
  const totalE = ke + pe;
  if (totalE >= 0) return false;
  return ke / Math.abs(pe) < STABILITY_THRESHOLD;
}

// ── PhysicsEngine ─────────────────────────────────────────────────────────────

export class PhysicsEngine {
  private stepCount = 0;

  step(state: PhysicalState, context: OrbitContext): PhysicalState {
    this.stepCount++;
    return verletStep(state, context);
  }

  stepN(state: PhysicalState, context: OrbitContext, n: number): PhysicalState {
    let s = state;
    for (let i = 0; i < n; i++) {
      s = verletStep(s, context);
    }
    this.stepCount += n;
    return s;
  }

  static predictNextPhysicalState(state: PhysicalState, context: OrbitContext): PhysicalState {
    return verletStep(state, context);
  }

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

  static circularOrbitState(
    r: number,
    mass: number,
    ctx: OrbitContext,
    phaseRad = 0,
  ): PhysicalState {
    const v = Math.sqrt((ctx.G * ctx.centralMass) / r);
    const pos: Vec3 = {
      x: r * Math.cos(phaseRad),
      y: r * Math.sin(phaseRad),
      z: 0,
    };
    const vel: Vec3 = {
      x: -v * Math.sin(phaseRad),
      y: v * Math.cos(phaseRad),
      z: 0,
    };
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
