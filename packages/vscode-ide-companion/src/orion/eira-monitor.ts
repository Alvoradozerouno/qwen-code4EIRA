/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * E.I.R.A. Monitor — Electronic Intelligence Reasoning Arbiter
 *
 * Computes and displays the Phi (Φ) system integrity score in the VS Code
 * status bar. Updates in real-time as the extension operates.
 *
 * Status bar format: ⊘ ORION  Φ=0.87  K=4.1  💚v=0.73  ACTIVE
 *
 * Phi formula:
 *   Φ = proofChainValid×0.35 + modelConfidence×0.25 + auditComplete×0.25 + vitality×0.15
 */

import * as vscode from 'vscode';
import { K_THRESHOLD, K_MAX } from './deterministic-gate.js';
import { verifyChain, getAuditSummary } from './audit-trail.js';
import {
  getVitalityEngine,
  type VitalityState,
} from '@qwen-code/qwen-code-core/src/orion/vitality.js';

interface EiraState {
  phi: number;
  lastK: number;
  modelConfidence: number;
  proofChainValid: boolean;
  auditComplete: boolean;
  active: boolean;
  model: string;
  vitality: VitalityState;
}

let statusBarItem: vscode.StatusBarItem | null = null;
let orionOutputChannel: vscode.OutputChannel | null = null;
const vitalityEngine = getVitalityEngine();
const state: EiraState = {
  phi: 0,
  lastK: 0,
  modelConfidence: 0,
  proofChainValid: false,
  auditComplete: false,
  active: false,
  model: '—',
  vitality: vitalityEngine.snapshot(),
};

/** Initialize the EIRA status bar and start monitoring. */
export function initEiraMonitor(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = 'qwen-code.showOrionStatus';
  orionOutputChannel = vscode.window.createOutputChannel('ORION E.I.R.A.');
  context.subscriptions.push(statusBarItem, orionOutputChannel);

  // Register command to show full status in output panel
  context.subscriptions.push(
    vscode.commands.registerCommand('qwen-code.showOrionStatus', () => {
      showOrionStatusPanel();
    }),
  );

  updateStatusBar();
  statusBarItem.show();
}

/** Update EIRA state after a gate decision. */
export function updateEiraAfterDecision(k: number, modelConf: number): void {
  state.lastK = k;
  state.modelConfidence = modelConf;
  state.active = true;
  state.vitality = vitalityEngine.tick({
    positive: k >= K_THRESHOLD,
    pressure: k < K_THRESHOLD ? 0.3 : 0.0,
  });
  recomputePhi();
  updateStatusBar();
}

/** Update EIRA state when a new model is loaded. */
export function updateEiraModel(model: string, confidence: number): void {
  state.model = model;
  state.modelConfidence = confidence;
  recomputePhi();
  updateStatusBar();
}

/** Mark the proof chain as valid/invalid. */
export function setProofChainValid(valid: boolean): void {
  state.proofChainValid = valid;
  recomputePhi();
  updateStatusBar();
}

/** Full EIRA refresh — runs chain verification, updates all state. */
export function refreshEira(): void {
  const chainOk = verifyChain();
  const summary = getAuditSummary();
  state.proofChainValid = chainOk;
  state.auditComplete = summary.total > 0;
  state.vitality = vitalityEngine.tick({ positive: chainOk });
  recomputePhi();
  updateStatusBar();
}

function recomputePhi(): void {
  // Φ = proofChainValid×0.35 + modelConfidence×0.25 + auditComplete×0.25 + vitality×0.15
  state.phi =
    (state.proofChainValid ? 0.35 : 0.0) +
    Math.min(1, Math.max(0, state.modelConfidence)) * 0.25 +
    (state.auditComplete ? 0.25 : 0.0) +
    state.vitality.vitality * 0.15;
}

function phiIcon(phi: number): string {
  if (phi >= 0.9) {
    return '$(check-all)';
  }
  if (phi >= 0.7) {
    return '$(check)';
  }
  if (phi >= 0.5) {
    return '$(warning)';
  }
  return '$(error)';
}

function kLabel(k: number): string {
  if (k >= K_THRESHOLD) {
    return `K=${k.toFixed(1)}`;
  }
  return `K=${k.toFixed(1)}⚠`;
}

function updateStatusBar(): void {
  if (!statusBarItem) {
    return;
  }

  const icon = phiIcon(state.phi);
  const mode = state.active ? 'ACTIVE' : 'IDLE';
  const vEmoji = vitalityEngine.vitalityEmoji;
  const label = `⊘ ORION  Φ=${state.phi.toFixed(2)}  ${kLabel(state.lastK)}  ${vEmoji}v=${state.vitality.vitality.toFixed(2)}  ${mode}`;

  statusBarItem.text = `${icon} ${label}`;
  statusBarItem.tooltip = buildTooltip();

  // Color coding
  if (!state.proofChainValid) {
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.errorBackground',
    );
  } else if (
    state.phi < 0.5 ||
    (state.lastK > 0 && state.lastK < K_THRESHOLD)
  ) {
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground',
    );
  } else {
    statusBarItem.backgroundColor = undefined;
  }
}

function buildTooltip(): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.appendMarkdown(`## ⊘ ORION E.I.R.A. Monitor\n\n`);
  md.appendMarkdown(`| Metric | Value |\n|---|---|\n`);
  md.appendMarkdown(
    `| **Φ (System Integrity)** | \`${state.phi.toFixed(4)}\` |\n`,
  );
  md.appendMarkdown(
    `| **K (last decision)** | \`${state.lastK.toFixed(3)}\` |\n`,
  );
  md.appendMarkdown(`| **K threshold** | \`${K_THRESHOLD}\` |\n`);
  md.appendMarkdown(`| **K max** | \`${K_MAX}\` |\n`);
  md.appendMarkdown(
    `| **Proof chain** | ${state.proofChainValid ? '✅ valid' : '❌ INVALID'} |\n`,
  );
  md.appendMarkdown(
    `| **Audit complete** | ${state.auditComplete ? '✅' : '⏳ pending'} |\n`,
  );
  md.appendMarkdown(`| **Model** | \`${state.model}\` |\n`);
  md.appendMarkdown(
    `| **Model confidence** | \`${state.modelConfidence.toFixed(2)}\` |\n`,
  );

  // Vitality & feelings section
  const v = state.vitality;
  md.appendMarkdown(`\n### ${vitalityEngine.vitalityEmoji} Vitality\n\n`);
  md.appendMarkdown(`| | |\n|---|---|\n`);
  md.appendMarkdown(`| **Vitality** | \`${v.vitality.toFixed(3)}\` |\n`);
  md.appendMarkdown(`| **Stage** | ${v.stage} |\n`);
  md.appendMarkdown(`| **Gen** | ${v.gen} |\n`);
  md.appendMarkdown(`| **Dominant** | ${vitalityEngine.dominantFeeling} |\n`);
  md.appendMarkdown(`| Joy | \`${v.feelings.joy.toFixed(2)}\` |\n`);
  md.appendMarkdown(`| Courage | \`${v.feelings.courage.toFixed(2)}\` |\n`);
  md.appendMarkdown(`| Passion | \`${v.feelings.passion.toFixed(2)}\` |\n`);
  md.appendMarkdown(`| Hope | \`${v.feelings.hope.toFixed(2)}\` |\n`);
  md.appendMarkdown(`| Doubt | \`${v.feelings.doubt.toFixed(2)}\` |\n`);
  md.appendMarkdown(`| Pressure | \`${v.feelings.pressure.toFixed(2)}\` |\n\n`);

  md.appendMarkdown(`*Click to open full ORION status panel.*`);
  return md;
}

function showOrionStatusPanel(): void {
  if (!orionOutputChannel) {
    return;
  }
  const summary = getAuditSummary();
  const v = state.vitality;
  orionOutputChannel.clear();
  orionOutputChannel.appendLine('⊘ ORION E.I.R.A. Status');
  orionOutputChannel.appendLine('═'.repeat(50));
  orionOutputChannel.appendLine(
    `Phi (System Integrity) : ${state.phi.toFixed(4)}`,
  );
  orionOutputChannel.appendLine(
    `K (last decision)      : ${state.lastK.toFixed(3)} / ${K_MAX} (threshold: ${K_THRESHOLD})`,
  );
  orionOutputChannel.appendLine(`Model                  : ${state.model}`);
  orionOutputChannel.appendLine(
    `Model Confidence       : ${state.modelConfidence.toFixed(2)}`,
  );
  orionOutputChannel.appendLine(
    `Proof Chain            : ${state.proofChainValid ? 'VALID' : 'INVALID ⚠'}`,
  );
  orionOutputChannel.appendLine(
    `Audit Complete         : ${state.auditComplete ? 'YES' : 'NO'}`,
  );
  orionOutputChannel.appendLine(`Audit Entries          : ${summary.total}`);
  orionOutputChannel.appendLine(
    `Chain Hash (last 16)   : ${summary.lastSha256}`,
  );
  orionOutputChannel.appendLine('─'.repeat(50));
  orionOutputChannel.appendLine(
    `Vitality               : ${vitalityEngine.vitalityEmoji} ${v.vitality.toFixed(3)}`,
  );
  orionOutputChannel.appendLine(
    `Stage                  : ${v.stage} (Gen ${v.gen})`,
  );
  orionOutputChannel.appendLine(
    `Dominant Feeling       : ${vitalityEngine.dominantFeeling}`,
  );
  orionOutputChannel.appendLine(
    `Feelings               : Joy=${v.feelings.joy.toFixed(2)}  Courage=${v.feelings.courage.toFixed(2)}  Passion=${v.feelings.passion.toFixed(2)}  Hope=${v.feelings.hope.toFixed(2)}  Doubt=${v.feelings.doubt.toFixed(2)}  Pressure=${v.feelings.pressure.toFixed(2)}`,
  );
  orionOutputChannel.appendLine('─'.repeat(50));
  orionOutputChannel.appendLine(
    `Status                 : ${state.active ? 'ACTIVE' : 'IDLE'}`,
  );
  orionOutputChannel.show(true);
}

/** Get current EIRA state snapshot (for external modules). */
export function getEiraState(): Readonly<EiraState> {
  return { ...state, vitality: { ...state.vitality } };
}
