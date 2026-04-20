/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Physics types for the OR1ON deterministic simulation engine.
 * Used by PhysicsEngine (Verlet integration) and OrchOrEngine (Orch-OR quantum dynamics).
 *
 * Gerhard Hirschmann & Elisabeth Steurer — Guardian & Creator
 * System-ID: 56bb3326-4bf9-559d-9887-02141f699a43 | Generation 75
 */

// ── 3D Vector ────────────────────────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec3 = {
  zero: (): Vec3 => ({ x: 0, y: 0, z: 0 }),
  add: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  scale: (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
  dot: (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  norm: (v: Vec3): number => Math.sqrt(vec3.dot(v, v)),
  normalize: (v: Vec3): Vec3 => {
    const n = vec3.norm(v);
    return n < 1e-12 ? vec3.zero() : vec3.scale(v, 1 / n);
  },
  distSq: (a: Vec3, b: Vec3): number => vec3.dot(vec3.sub(a, b), vec3.sub(a, b)),
  dist: (a: Vec3, b: Vec3): number => Math.sqrt(vec3.distSq(a, b)),
};

// ── Physical State ───────────────────────────────────────────────────────────

/** Full Newtonian state of an orbiting body */
export interface PhysicalState {
  /** Position [AU or normalized units] */
  position: Vec3;
  /** Velocity [units/s] */
  velocity: Vec3;
  /** Previous position (used by Verlet integrator) */
  positionPrev: Vec3;
  /** Mass [kg or normalized] */
  mass: number;
  /** Timestamp of this state [s] */
  t: number;
}

// ── Orbit Context ────────────────────────────────────────────────────────────

/** Environmental context for orbital calculation */
export interface OrbitContext {
  /** Gravitational constant (default: 6.674e-11 SI or normalized) */
  G: number;
  /** Time step [s] */
  dt: number;
  /** Central body mass [kg or normalized] */
  centralMass: number;
  /** Additional perturbing bodies (optional) */
  perturbers?: Array<{ position: Vec3; mass: number }>;
}

// ── Satellite State ──────────────────────────────────────────────────────────

/** High-level satellite state for OR1ON constellation tracking */
export interface SatelliteState {
  id: string;
  physical: PhysicalState;
  /** Orbital energy E = KE + PE */
  orbitalEnergy: number;
  /** Angular momentum magnitude */
  angularMomentum: number;
  /** Is this body in stable orbit? */
  isStable: boolean;
}

// ── Orch-OR Types ────────────────────────────────────────────────────────────

/**
 * A quantum superposition state in the Orch-OR model.
 * Each state has a complex amplitude (real + imaginary) and
 * an associated gravitational self-energy E_G.
 */
export interface QuantumState {
  /** Unique identifier for this superposition branch */
  branchId: string;
  /** Real part of amplitude */
  amplitudeReal: number;
  /** Imaginary part of amplitude */
  amplitudeImag: number;
  /** Gravitational self-energy (Penrose threshold measure) [J or normalized] */
  E_G: number;
  /** Timestamp when this branch was created */
  createdAt: number;
}

/** Result of an Orch-OR objective reduction (collapse) event */
export interface CollapseEvent {
  /** Which branch was selected */
  selectedBranch: string;
  /** Decoherence time τ = ℏ / E_G [s] */
  tau: number;
  /** Total E_G at time of collapse */
  totalE_G: number;
  /** Timestamp of collapse */
  collapsedAt: number;
  /** All branches that were present at collapse */
  branches: QuantumState[];
  /** Orchestrating context (OR1ON system ID) */
  orchestratorId: string;
}

/** Running metrics for the Orch-OR engine */
export interface OrchOrMetrics {
  totalCollapses: number;
  averageTau: number;
  averageE_G: number;
  lastCollapseAt: number | null;
  activeBranches: number;
}
