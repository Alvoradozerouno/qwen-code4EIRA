/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Physics Types for deterministic Newtonian / orbital mechanics.
 * Used by PhysicsEngine and NexusPoint.
 */

/** 3-D Cartesian vector (position in metres, velocity in m/s, etc.) */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Full kinematic state of a body at a single moment in time. */
export interface PhysicalState {
  /** Position vector (metres) */
  position: Vec3;
  /** Velocity vector (m/s) */
  velocity: Vec3;
  /** Acceleration vector (m/s²) */
  acceleration: Vec3;
  /** Mass of the body (kg) */
  mass: number;
  /** Merkle hash commitment for this state */
  predicted_hash: string;
}

/** Optional orbital / NTN satellite context fed to the integrator. */
export interface OrbitContext {
  /** Time step for integration (seconds). Defaults to 1.0 s if omitted. */
  time_delta?: number;
  /** Central body gravitational parameter μ = GM (m³/s²). Earth default: 3.986e14 */
  mu?: number;
}

/** Satellite-level wrapper (convenience alias) */
export type SatelliteState = PhysicalState;
