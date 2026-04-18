/**
 * @license
 * Copyright 2025-2026 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Time-Shift Orch-OR Command  (/timeshift)
 *
 * Internal Deterministic State Projection
 * Calculations performed in secure compiled layer (nexus_private.h)
 * Result: deterministic coherence evolution with SHA-256 commitment
 *
 * Exposes the `/timeshift` slash-command that replays a cached
 * Nexus pre-causal state into the current ORION session.
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { NexusPoint } from '../../../../core/src/kernel/nexus_point.js';
import {
  initialOrchORState,
  projectOrchORState,
} from '../../../../core/src/physics/orch_or.js';

// Module-level Nexus buffer (single session scope).
const nexusPoint = new NexusPoint();

export const timeShiftOrchORCommand: SlashCommand = {
  name: 'timeshift',
  altNames: ['orch-or', 'orchor'],
  description: 'Replay a deterministic Orch-OR state snapshot (time-shift)',
  kind: CommandKind.BUILT_IN,
  action: async (context, args) => {
    // Internal Deterministic State Projection
    // Step 1: ensure buffer is seeded with at least one initial state.
    if (nexusPoint.size === 0) {
      nexusPoint.push(initialOrchORState());
    }

    // Step 2: project the next state forward deterministically.
    const latest = nexusPoint.getAll()[nexusPoint.size - 1];
    const next = projectOrchORState({ previousState: latest.state });
    const snapshot = nexusPoint.push(next);

    // Step 3: resolve optional tick argument for replay.
    const tickArg = args ? parseInt(args.trim(), 10) : NaN;
    const target = Number.isFinite(tickArg)
      ? nexusPoint.getByTick(tickArg)
      : snapshot;

    if (!target) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: `No Nexus snapshot found for tick ${tickArg}.`,
        },
        Date.now(),
      );
      return;
    }

    // Internal Deterministic State Projection — output
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: [
          '⊘ ORION Time-Shift — Deterministic State Projection',
          `  Tick:      ${target.state.tick}`,
          `  Coherence: ${target.state.coherence.toFixed(4)}`,
          `  Collapsed: ${target.state.collapsed}`,
          `  Proof:     ${target.state.proofHash}`,
          `  Captured:  ${target.capturedAt}`,
        ].join('\n'),
      },
      Date.now(),
    );
  },
};
