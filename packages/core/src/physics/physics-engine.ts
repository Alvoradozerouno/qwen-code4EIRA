/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Physics Engine
 *
 * Deterministic Newtonian physics + simplified 2-body orbital mechanics
 * for the Precausal Inference (Time-Shift) experiment.
 *
 * Design constraints:
 *   - 100% deterministic: Verlet integration, no randomness
 *   - Zero cloud: all computation local, no external APIs
 *   - 20W sovereign profile: sub-millisecond computation
 *   - Merkle audit trail for every predicted state
 */

import * as crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────

/** 3-dimensional vector. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Full physical state of a body in Newtonian mechanics. */
export interface PhysicalState {
  /** Position vector [m] */
  position: Vec3;
  /** Velocity vector [m/s] */
  velocity: Vec3;
  /** Acceleration vector [m/s²] (includes gravity from primary) */
  acceleration: Vec3;
  /** Body mass [kg] */
  mass: number;
  /** SHA-256 Merkle hash of this state (for audit trail) */
  predictedHash: string;
  /** ISO timestamp of the prediction */
  timestamp: string;
}

/** Input parameters for a single integration step. */
export interface PhysicsInput {
  position: Vec3;
  velocity: Vec3;
  /** External acceleration (thrust, drag, etc.) [m/s²] */
  acceleration: Vec3;
  /** Body mass [kg] */
  mass: number;
  /** Integration time step [s] */
  timeDelta: number;
  /**
   * Optional gravitational parameter μ = G·M of the central body [m³/s²].
   * Defaults to Earth standard: 3.986004418e14 m³/s²
   */
  gravitationalParameter?: number;
}

/** Result of the EIRA safety gate applied to a physics prediction. */
export type EpistemicClass = 'VERIFIED' | 'ESTIMATED' | 'UNKNOWN';

// ── Constants ──────────────────────────────────────────────────────────────

/** Standard gravitational parameter for Earth μ = G·M_earth [m³/s²] */
export const EARTH_GM = 3.986004418e14;

/** Minimum allowed orbital radius to avoid singularity [m] (≈ 6,357 km = Earth surface) */
const MIN_ORBITAL_RADIUS = 6_357_000;

// ── Helpers ────────────────────────────────────────────────────────────────

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vec3Magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Compute gravitational acceleration on a body at position `r`
 * due to a central mass described by gravitational parameter `gm`.
 *
 * Formula: a = -μ / |r|³ · r
 */
function gravitationalAcceleration(r: Vec3, gm: number): Vec3 {
  const mag = vec3Magnitude(r);
  if (mag < MIN_ORBITAL_RADIUS) {
    // Below Earth surface — return zero to avoid singularity
    return { x: 0, y: 0, z: 0 };
  }
  const factor = -gm / (mag * mag * mag);
  return vec3Scale(r, factor);
}

/**
 * Compute a deterministic SHA-256 hash of a physical state for the Merkle
 * audit trail.  Uses only numeric fields — no Date objects — to ensure
 * the hash is reproducible given the same inputs.
 */
function hashPhysicalState(
  pos: Vec3,
  vel: Vec3,
  acc: Vec3,
  mass: number,
  dt: number,
): string {
  const payload = JSON.stringify({
    px: pos.x,
    py: pos.y,
    pz: pos.z,
    vx: vel.x,
    vy: vel.y,
    vz: vel.z,
    ax: acc.x,
    ay: acc.y,
    az: acc.z,
    mass,
    dt,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ── Verlet Integration ─────────────────────────────────────────────────────

/**
 * Velocity-Verlet integration step.
 *
 * Algorithm:
 *   r(t+dt) = r(t) + v(t)·dt + ½·a(t)·dt²
 *   a(t+dt) = gravity(r(t+dt)) + external_acc
 *   v(t+dt) = v(t) + ½·[a(t) + a(t+dt)]·dt
 *
 * This is symplectic (energy-conserving) and fully deterministic.
 */
function verletStep(
  pos: Vec3,
  vel: Vec3,
  accExternal: Vec3,
  gm: number,
  dt: number,
): { pos: Vec3; vel: Vec3; acc: Vec3 } {
  // --- position update ---
  const halfDt2 = 0.5 * dt * dt;
  const gravNow = gravitationalAcceleration(pos, gm);
  const accNow = vec3Add(gravNow, accExternal);

  const newPos: Vec3 = {
    x: pos.x + vel.x * dt + accNow.x * halfDt2,
    y: pos.y + vel.y * dt + accNow.y * halfDt2,
    z: pos.z + vel.z * dt + accNow.z * halfDt2,
  };

  // --- acceleration update at new position ---
  const gravNext = gravitationalAcceleration(newPos, gm);
  const accNext = vec3Add(gravNext, accExternal);

  // --- velocity update (average of old and new acceleration) ---
  const newVel: Vec3 = {
    x: vel.x + 0.5 * (accNow.x + accNext.x) * dt,
    y: vel.y + 0.5 * (accNow.y + accNext.y) * dt,
    z: vel.z + 0.5 * (accNow.z + accNext.z) * dt,
  };

  return { pos: newPos, vel: newVel, acc: accNext };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Predict the next physical state for a body using deterministic
 * Velocity-Verlet integration with 2-body orbital mechanics.
 *
 * @param input - Current state and integration parameters
 * @returns PhysicalState at t + timeDelta, with Merkle hash
 */
export function predictNextPhysicalState(input: PhysicsInput): PhysicalState {
  const gm = input.gravitationalParameter ?? EARTH_GM;
  const dt = input.timeDelta;

  const { pos, vel, acc } = verletStep(
    input.position,
    input.velocity,
    input.acceleration,
    gm,
    dt,
  );

  const timestamp = new Date().toISOString();
  const predictedHash = hashPhysicalState(pos, vel, acc, input.mass, dt);

  return {
    position: pos,
    velocity: vel,
    acceleration: acc,
    mass: input.mass,
    predictedHash,
    timestamp,
  };
}

/**
 * Classify an orbital radius into an epistemic safety class.
 *
 * Rules:
 *   r > MIN_ORBITAL_RADIUS × 1.1  → VERIFIED (safely above surface)
 *   r > MIN_ORBITAL_RADIUS         → ESTIMATED (close to boundary)
 *   r ≤ MIN_ORBITAL_RADIUS         → UNKNOWN   (impact trajectory — unsafe)
 */
export function classifyEpistemicState(state: PhysicalState): EpistemicClass {
  const r = vec3Magnitude(state.position);
  if (r > MIN_ORBITAL_RADIUS * 1.1) return 'VERIFIED';
  if (r > MIN_ORBITAL_RADIUS) return 'ESTIMATED';
  return 'UNKNOWN';
}
