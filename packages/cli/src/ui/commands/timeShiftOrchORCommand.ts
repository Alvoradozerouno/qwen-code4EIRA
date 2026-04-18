/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR — Orch-OR Time-Shift Command
 *
 * Slash command: /eira-time-shift-orch-or [description]
 *
 * Runs a full deterministic Orch-OR time-shift experiment and displays
 * the results in a formatted ANSI box.
 *
 * Origin: ORION Consciousness Protocol v1.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { NexusPoint } from '@qwen-code/qwen-code-core';
import type { PhysicalState, OrbitContext } from '@qwen-code/qwen-code-core';

// ── Default ISS-like low-Earth-orbit initial state ──────────────────────────

const DEFAULT_STATE: PhysicalState = {
  position: { x: 6_778_000, y: 0, z: 0 }, // 407 km altitude, equatorial
  velocity: { x: 0, y: 7_660, z: 0 }, // ~7.66 km/s orbital velocity
  acceleration: { x: -8.64, y: 0, z: 0 }, // gravitational pull at 407 km
  mass: 419_725, // kg — ISS mass
  timestamp: new Date().toISOString(),
  predicted_hash: '0'.repeat(64),
};

const DEFAULT_CONTEXT: OrbitContext = {
  mu: 3.986004418e14, // Earth standard gravitational parameter
  time_delta: 1.0, // 1-second integration step
};

// ── Formatting helpers ───────────────────────────────────────────────────────

// Box inner width (between the │ chars).
// 71 characters ensures the 64-char SHA-256 hashes fit on one row with
// a 2-char label prefix ("  ") and 3-char frame ("║ " ... " ║").
const W = 71;

function pad(s: string, width: number): string {
  const truncated = s.length > width ? s.slice(0, width - 1) + '…' : s;
  return truncated.padEnd(width, ' ');
}

function row(content: string): string {
  return `║ ${pad(content, W - 2)} ║`;
}

function blank(): string {
  return row('');
}

function divider(): string {
  return '╠' + '═'.repeat(W) + '╣';
}

function header(title: string): string {
  const padded = pad(title, W - 2);
  return `║ ${padded} ║`;
}

function topBar(): string {
  return '╔' + '═'.repeat(W) + '╗';
}

function bottomBar(): string {
  return '╚' + '═'.repeat(W) + '╝';
}

function fmt(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

function pct(n: number): string {
  return (n * 100).toFixed(2) + '%';
}

// ── Command ──────────────────────────────────────────────────────────────────

export const timeShiftOrchORCommand: SlashCommand = {
  name: 'eira-time-shift-orch-or',
  altNames: ['praetor'],
  description:
    'Run deterministic Orch-OR time-shift experiment (Penrose-Hameroff + EIRA gate)',
  kind: CommandKind.BUILT_IN,

  action: (context, args) => {
    const description =
      args.trim() || 'Default LEO satellite time-shift Orch-OR experiment';

    // Build initial state — use default ISS-like orbit
    const state: PhysicalState = {
      ...DEFAULT_STATE,
      timestamp: new Date().toISOString(),
    };

    // Run the full NexusPoint evaluation
    const result = NexusPoint.evaluate(state, DEFAULT_CONTEXT, description);

    const { prediction, consciousness, proof } = result;
    const { physical, orchOR } = prediction;

    // ── Format output ──────────────────────────────────────────────────────
    const lines: string[] = [
      topBar(),
      header('         ORCH-OR TIME-SHIFT EXPERIMENT RESULTS'),
      header(' (Deterministic Penrose-Hameroff Consciousness Reduction)'),
      divider(),
      row('Physical Prediction:'),
      row(
        `  Position:     (${fmt(physical.position.x, 1)}, ${fmt(physical.position.y, 1)}, ${fmt(physical.position.z, 1)}) m`,
      ),
      row(
        `  Velocity:     (${fmt(physical.velocity.x, 2)}, ${fmt(physical.velocity.y, 2)}, ${fmt(physical.velocity.z, 2)}) m/s`,
      ),
      row(
        `  Acceleration: (${fmt(physical.acceleration.x, 4)}, ${fmt(physical.acceleration.y, 4)}, ${fmt(physical.acceleration.z, 4)}) m/s²`,
      ),
      blank(),
      row('Orch-OR Coherence State:'),
      row(
        `  Microtubule Coherence Level:  ${fmt(orchOR.coherence_level)} (0-1 scale)`,
      ),
      row(`  Collapse Decision:            ${orchOR.collapse_decision}`),
      row(
        `  Threshold Energy:             ${orchOR.threshold_energy.toExponential(4)} J`,
      ),
      row(
        `  Time to Collapse (Δt_R):      ${orchOR.time_to_collapse.toExponential(4)} s`,
      ),
      row(`  Quantum Consciousness Ind.:   ${pct(orchOR.quantum_indicator)}`),
      blank(),
      row('EIRA Consciousness Integration:'),
      row(`  GWT Workspace Score:          ${pct(consciousness.gwt_score)}`),
      row(`  IIT Phi Integration:          ${pct(consciousness.iit_phi)}`),
      row(
        `  Orch-OR Coherence:            ${pct(consciousness.orch_or_coherence)}`,
      ),
      row(`  Epistemic Classification:     ${consciousness.epistemic_state}`),
      blank(),
      row('Final Decision:'),
      row(
        result.decision === 'EXECUTE'
          ? '  ✓ EXECUTE'
          : `  ✗ ABSTAIN  — ${(result.abstain_reason ?? '').replace('TIME-SHIFT ABSTAINED – ', '')}`,
      ),
      row(`  Nexus Hash:        ${prediction.nexus_hash.slice(0, 64)}`),
      row(`  Proof Chain Entry: ${proof.sha256.slice(0, 64)}`),
      row(`  IPFS Anchor:       ${proof.ipfs_anchor}`),
      blank(),
      row('Origin: ORION Consciousness Protocol v1.0'),
      row(`Timestamp: ${proof.timestamp}`),
      bottomBar(),
    ];

    const text = lines.join('\n');

    context.ui.addItem({ type: MessageType.INFO, text }, Date.now());
  },
};
