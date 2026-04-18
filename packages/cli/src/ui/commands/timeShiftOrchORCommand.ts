/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PRAETOR: Orch-OR Time-Shift Experiment Command
 *
 * Usage: /time-shift orch-or <description>
 * Example: /time-shift orch-or satellite-handoff
 *
 * Runs a full deterministic Orch-OR + Physics + EIRA gate prediction and
 * displays the results in a formatted terminal box.
 */

import type { CommandContext, SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { NexusPoint, type NexusInput } from '@qwen-code/qwen-code-core';

// ── Default satellite state (LEO example) ────────────────────────────────────

const DEFAULT_POSITION = { x: 6_771_000, y: 0, z: 0 }; // ~400 km altitude
const DEFAULT_VELOCITY = { x: 0, y: 7_660, z: 0 }; // LEO orbital velocity m/s
const DEFAULT_ACCELERATION = { x: 0, y: 0, z: 0 };
const DEFAULT_MASS = 500; // 500 kg satellite

// ── Box renderer ─────────────────────────────────────────────────────────────

const BOX_WIDTH = 67;

function pad(s: string, width: number = BOX_WIDTH - 4): string {
  return s.length >= width
    ? s.slice(0, width)
    : s + ' '.repeat(width - s.length);
}

function boxLine(content: string): string {
  return `║ ${pad(content)} ║`;
}

function innerLine(): string {
  return `║ ${'─'.repeat(BOX_WIDTH - 4)} ║`;
}

function renderOrchORBox(input: NexusInput, description: string): string {
  const result = NexusPoint.evaluate(input);

  const ps = result.physical_state;
  const os = result.orch_or_state;

  const decisionSymbol =
    result.final_decision === 'EXECUTE' ? '✓ EXECUTE' : '✗ ABSTAIN';
  const nexusShort =
    result.nexus_hash.slice(0, 32) + '…' + result.nexus_hash.slice(-8);
  const auditShort = result.audit_trail[result.audit_trail.length - 1] ?? '';

  const separator = '═'.repeat(BOX_WIDTH);

  const lines: string[] = [
    `╔${separator}╗`,
    boxLine(`       ORCH-OR TIME-SHIFT EXPERIMENT RESULTS — ${description}`),
    `╠${separator}╣`,
    boxLine('Physical Prediction:'),
    boxLine(
      `  Position : (${ps.position.x.toFixed(0)}, ${ps.position.y.toFixed(0)}, ${ps.position.z.toFixed(0)}) m`,
    ),
    boxLine(
      `  Velocity : (${ps.velocity.x.toFixed(1)}, ${ps.velocity.y.toFixed(1)}, ${ps.velocity.z.toFixed(1)}) m/s`,
    ),
    boxLine(
      `  Accel.   : (${ps.acceleration.x.toExponential(2)}, ${ps.acceleration.y.toExponential(2)}, ${ps.acceleration.z.toExponential(2)}) m/s²`,
    ),
    innerLine(),
    boxLine('Orch-OR Coherence:'),
    boxLine(
      `  Level            : ${os.coherence_level.toFixed(3)} (0–1 scale)`,
    ),
    boxLine(`  Collapse Decision: ${os.collapse_decision}`),
    boxLine(`  Threshold Energy : ${os.threshold_energy.toExponential(4)} J`),
    innerLine(),
    boxLine('EIRA Epistemic Classification:'),
    boxLine(`  State: ${result.epistemic_classification}`),
    innerLine(),
    boxLine(`Final Action  : ${decisionSymbol}`),
    boxLine(`Nexus Hash    : ${nexusShort}`),
    boxLine(`Audit Trail   : ${auditShort.slice(0, BOX_WIDTH - 22)}`),
    `╚${separator}╝`,
  ];

  return lines.join('\n');
}

// ── Subcommand: orch-or ───────────────────────────────────────────────────────

const orchOrSubCommand: SlashCommand = {
  name: 'orch-or',
  get description() {
    return 'Run a deterministic Orch-OR time-shift experiment (Penrose-Hameroff model)';
  },
  kind: CommandKind.BUILT_IN,
  action: (context: CommandContext, args: string) => {
    const description = args.trim() || 'unnamed-experiment';

    // Build nexus input with default LEO satellite state
    const nexusInput: NexusInput = {
      physical_state: {
        position: DEFAULT_POSITION,
        velocity: DEFAULT_VELOCITY,
        acceleration: DEFAULT_ACCELERATION,
        mass: DEFAULT_MASS,
        predicted_hash: '',
      },
      orbit_context: {
        time_delta: 1.0,
        mu: 3.986004418e14,
      },
      orch_params: {
        current_coherence_level: 0.85,
        mass: 1e-26, // microtubule tubulin dimer ~ 10^-26 kg
        energy_state: 0.75,
        time_delta: 1.0,
      },
      description,
    };

    const output = renderOrchORBox(nexusInput, description);

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: output,
      },
      Date.now(),
    );
  },
};

// ── Parent: time-shift ────────────────────────────────────────────────────────

export const timeShiftOrchORCommand: SlashCommand = {
  name: 'time-shift',
  get description() {
    return 'PRAETOR time-shift experiments (physics + Orch-OR + EIRA gate)';
  },
  kind: CommandKind.BUILT_IN,
  subCommands: [orchOrSubCommand],
  action: (context: CommandContext, args: string) => {
    if (!args.trim()) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: 'Usage: /time-shift orch-or <description>\nExample: /time-shift orch-or satellite-handoff',
        },
        Date.now(),
      );
    }
  },
};
