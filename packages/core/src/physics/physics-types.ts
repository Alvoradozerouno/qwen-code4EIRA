/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Physics Types
 *
 * Shared type definitions for the deterministic Newtonian/Verlet physics engine
 * and the Orch-OR coherence simulation.
 */

// ── 3-D vector ─────────────────────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Physical state ──────────────────────────────────────────────────────────

/**
 * Snapshot of a particle / satellite at a single instant.
 *
 * All SI units:
 *   position     → metres
 *   velocity     → m/s
 *   acceleration → m/s²
 *   mass         → kg
 */
export interface PhysicalState {
  position: Vec3;
  velocity: Vec3;
  acceleration: Vec3;
  mass: number;
  /** ISO-8601 timestamp of this state */
  timestamp: string;
  /** SHA-256 hash of the serialised state for proof-chain anchoring */
  predicted_hash: string;
}

// ── Orbital context ─────────────────────────────────────────────────────────

/**
 * Parameters describing the two-body gravitational environment.
 *
 * Designed for NTN (Non-Terrestrial Network) satellite modelling, but works for
 * any Keplerian orbit.
 */
export interface OrbitContext {
  /** Standard gravitational parameter μ = G·M (m³/s²) — defaults to Earth */
  mu: number;
  /** Integration time step in seconds */
  time_delta: number;
  /**
   * Optional second attractor for a simplified 2-body perturbation.
   * When provided, its gravitational pull is added to the acceleration.
   */
  secondary?: {
    position: Vec3;
    mass: number;
  };
}

// ── Satellite state ─────────────────────────────────────────────────────────

/**
 * Extended physical state for an NTN satellite node.
 * Adds orbital element caches for quick access by higher layers.
 */
export interface SatelliteState extends PhysicalState {
  /** Orbital altitude above reference sphere surface (metres) */
  altitude: number;
  /** Orbital speed (m/s) — magnitude of velocity */
  orbital_speed: number;
}
