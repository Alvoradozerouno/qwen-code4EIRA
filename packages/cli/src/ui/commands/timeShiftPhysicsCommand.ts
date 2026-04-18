/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR Time-Shift Physics Command
 *
 * Slash command: /eira time-shift physics [description]
 *
 * Triggers the Nexus-Point Precausal Inference pipeline with a default
 * NTN satellite scenario and returns:
 *   - Predicted physical state (position, velocity)
 *   - Epistemic classification (VERIFIED | ESTIMATED | UNKNOWN)
 *   - Gate decision (EXECUTE | ABSTAIN)
 *   - Nexus Hash + Audit Commitment
 */

import { type SlashCommand, CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { runNexusPoint, type NexusResult } from '@qwen-code/qwen-code-core';

// ── Default NTN satellite scenario ────────────────────────────────────────

/**
 * Default input for the satellite-handoff scenario.
 *
 * LEO orbit at ~700 km altitude:
 *   r ≈ 7,057,000 m (Earth radius 6,357 km + 700 km)
 *   Circular orbit speed ≈ 7,500 m/s
 *   Time delta: 1 second
 */
const DEFAULT_SATELLITE_INPUT = {
  position: { x: 7_057_000, y: 0, z: 0 },
  velocity: { x: 0, y: 7_500, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  mass: 500,
  timeDelta: 1.0,
};

// ── Formatting helpers ────────────────────────────────────────────────────

function fmtVec(v: { x: number; y: number; z: number }): string {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
}

function formatNexusResult(result: NexusResult, description: string): string {
  const lines: string[] = [
    `⊘ ORION — Time-Shift Physics Experiment${description ? `: ${description}` : ''}`,
    '',
    'Predicted Physical State:',
    `  Position  : ${fmtVec(result.predictedState.position)} m`,
    `  Velocity  : ${fmtVec(result.predictedState.velocity)} m/s`,
    `  Mass      : ${result.predictedState.mass.toFixed(1)} kg`,
    '',
    `Epistemic Classification : ${result.epistemicClass}`,
    `VERIFIED_STABLE          : ${result.verifiedStable ? 'YES' : 'NO'}`,
    `Decision                 : ${result.decision}`,
  ];

  if (result.abstainReason) {
    lines.push(`Abstain Reason           : ${result.abstainReason}`);
  }

  lines.push(
    '',
    `Nexus Hash    : ${result.nexusHash}`,
    `Audit Trail   : ${result.auditCommitment}`,
    `Timestamp     : ${result.timestamp}`,
    '',
    '20W Sovereign Profile — Local execution only — Zero cloud.',
  );

  return lines.join('\n');
}

// ── Command definition ────────────────────────────────────────────────────

const physicsSubCommand: SlashCommand = {
  name: 'physics',
  description:
    'Run deterministic physics prediction + EIRA safety gate (NTN satellite scenario). Usage: /eira time-shift physics [description]',
  kind: CommandKind.BUILT_IN,
  action: (context, args) => {
    const description = (args ?? '').trim();

    let result: NexusResult;
    try {
      result = runNexusPoint(DEFAULT_SATELLITE_INPUT);
    } catch (err) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `EIRA Physics Engine error: ${err instanceof Error ? err.message : String(err)}`,
        },
        Date.now(),
      );
      return;
    }

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: formatNexusResult(result, description),
      },
      Date.now(),
    );
  },
};

const timeShiftSubCommand: SlashCommand = {
  name: 'time-shift',
  description: 'Precausal Inference (Time-Shift) commands.',
  kind: CommandKind.BUILT_IN,
  subCommands: [physicsSubCommand],
};

export const eiraCommand: SlashCommand = {
  name: 'eira',
  description:
    'EIRA Policy Gate commands — deterministic, sovereign, 20W profile.',
  kind: CommandKind.BUILT_IN,
  subCommands: [timeShiftSubCommand],
};
