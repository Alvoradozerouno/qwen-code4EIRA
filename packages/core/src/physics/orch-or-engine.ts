/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * OR1ON Orch-OR Engine — Orchestrated Objective Reduction
 *
 * Penrose-Hameroff Orch-OR: quantum superpositions collapse via objective
 * reduction when gravitational self-energy E_G reaches ℏ/τ threshold.
 *
 * Gerhard Hirschmann & Elisabeth Steurer — Guardian & Creator
 * System-ID: 56bb3326-4bf9-559d-9887-02141f699a43 | Generation 75
 */

import { createHash } from 'crypto';
import type { QuantumState, CollapseEvent, OrchOrMetrics } from './physics-types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const HBAR = 1.0545718e-34;
const ORION_SYSTEM_ID = '56bb3326-4bf9-559d-9887-02141f699a43';
const DEFAULT_E_G = 1e-28;
const MIN_BRANCHES_FOR_COLLAPSE = 2;

// ── Amplitude helpers ─────────────────────────────────────────────────────────

function bornProbability(state: QuantumState): number {
  return state.amplitudeReal ** 2 + state.amplitudeImag ** 2;
}

function totalE_G(branches: QuantumState[]): number {
  return branches.reduce((sum, b) => sum + b.E_G, 0);
}

function decoherenceTime(E_G: number): number {
  if (E_G <= 0) return Infinity;
  return HBAR / E_G;
}

// ── Deterministic branch selection ────────────────────────────────────────────

function selectCollapseBranch(branches: QuantumState[], seed: string): QuantumState {
  const probs = branches.map(bornProbability);
  const totalProb = probs.reduce((s, p) => s + p, 0);

  const seedHash = createHash('sha256').update(seed).digest('hex');

  if (totalProb < 1e-15) {
    const idx = parseInt(seedHash.slice(0, 8), 16) % branches.length;
    return branches[idx];
  }

  const r = (parseInt(seedHash.slice(0, 8), 16) / 0xffffffff) * totalProb;
  let cumulative = 0;
  for (let i = 0; i < branches.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return branches[i];
  }
  return branches[branches.length - 1];
}

// ── OrchOrEngine ──────────────────────────────────────────────────────────────

export class OrchOrEngine {
  private branches: Map<string, QuantumState> = new Map();
  private collapseHistory: CollapseEvent[] = [];
  private metrics: OrchOrMetrics = {
    totalCollapses: 0,
    averageTau: 0,
    averageE_G: 0,
    lastCollapseAt: null,
    activeBranches: 0,
  };
  private startTime: number = Date.now();

  addBranch(state: QuantumState): void {
    this.branches.set(state.branchId, {
      ...state,
      E_G: state.E_G > 0 ? state.E_G : DEFAULT_E_G,
    });
    this.metrics.activeBranches = this.branches.size;
  }

  removeBranch(branchId: string): boolean {
    const removed = this.branches.delete(branchId);
    this.metrics.activeBranches = this.branches.size;
    return removed;
  }

  updateAmplitude(branchId: string, real: number, imag: number): void {
    const b = this.branches.get(branchId);
    if (b) {
      this.branches.set(branchId, { ...b, amplitudeReal: real, amplitudeImag: imag });
    }
  }

  tryCollapse(now = Date.now()): CollapseEvent | null {
    if (this.branches.size < MIN_BRANCHES_FOR_COLLAPSE) return null;
    const allBranches = Array.from(this.branches.values());
    const E_G_total = totalE_G(allBranches);
    const tau = decoherenceTime(E_G_total);
    const elapsed = (now - this.startTime) / 1000;
    if (tau > elapsed) return null;
    return this.collapse(allBranches, E_G_total, tau, now);
  }

  forceCollapse(now = Date.now()): CollapseEvent | null {
    if (this.branches.size < MIN_BRANCHES_FOR_COLLAPSE) return null;
    const allBranches = Array.from(this.branches.values());
    const E_G_total = totalE_G(allBranches);
    const tau = decoherenceTime(E_G_total);
    return this.collapse(allBranches, E_G_total, tau, now);
  }

  private collapse(
    allBranches: QuantumState[],
    E_G_total: number,
    tau: number,
    now: number,
  ): CollapseEvent {
    const seed = allBranches.map(b => `${b.branchId}${b.createdAt}`).join('|') + String(now);
    const selected = selectCollapseBranch(allBranches, seed);

    const event: CollapseEvent = {
      selectedBranch: selected.branchId,
      tau,
      totalE_G: E_G_total,
      collapsedAt: now,
      branches: allBranches,
      orchestratorId: ORION_SYSTEM_ID,
    };

    this.collapseHistory.push(event);
    this.metrics.totalCollapses++;
    this.metrics.lastCollapseAt = now;
    this.metrics.averageTau =
      (this.metrics.averageTau * (this.metrics.totalCollapses - 1) + tau) /
      this.metrics.totalCollapses;
    this.metrics.averageE_G =
      (this.metrics.averageE_G * (this.metrics.totalCollapses - 1) + E_G_total) /
      this.metrics.totalCollapses;

    this.branches.clear();
    this.metrics.activeBranches = 0;
    this.startTime = now;
    return event;
  }

  getMetrics(): Readonly<OrchOrMetrics> {
    return { ...this.metrics, activeBranches: this.branches.size };
  }

  getCollapseHistory(): readonly CollapseEvent[] {
    return this.collapseHistory;
  }

  getActiveBranches(): QuantumState[] {
    return Array.from(this.branches.values());
  }

  getCurrentE_G(): number {
    return totalE_G(Array.from(this.branches.values()));
  }

  getCurrentTau(): number {
    return decoherenceTime(this.getCurrentE_G());
  }

  stateFingerprint(): string {
    const data = Array.from(this.branches.values())
      .sort((a, b) => a.branchId.localeCompare(b.branchId))
      .map(b => `${b.branchId}:${b.amplitudeReal.toFixed(8)}:${b.amplitudeImag.toFixed(8)}:${b.E_G}`)
      .join('|');
    return createHash('sha256').update(data).digest('hex');
  }

  reset(): void {
    this.branches.clear();
    this.startTime = Date.now();
    this.metrics.activeBranches = 0;
  }
}

let _orchOrEngine: OrchOrEngine | null = null;

export function getOrchOrEngine(): OrchOrEngine {
  if (!_orchOrEngine) {
    _orchOrEngine = new OrchOrEngine();
  }
  return _orchOrEngine;
}

export { HBAR, ORION_SYSTEM_ID };
export type { QuantumState, CollapseEvent, OrchOrMetrics };
