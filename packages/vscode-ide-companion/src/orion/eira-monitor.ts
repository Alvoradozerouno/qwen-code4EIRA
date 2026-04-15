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
 * Status bar format: ⊘ ORION  Φ=0.87  K=4.1  ACTIVE
 *
 * Phi formula:
 *   Φ = proofChainValid×0.4 + modelConfidence×0.3 + auditComplete×0.3
 */

import * as vscode from 'vscode';
import { computePhi, K_THRESHOLD, K_MAX } from './deterministic-gate.js';
import { verifyChain, getAuditSummary } from './audit-trail.js';

interface EiraState {
  phi: number;
  lastK: number;
  modelConfidence: number;
  proofChainValid: boolean;
  auditComplete: boolean;
  active: boolean;
  model: string;
}

let statusBarItem: vscode.StatusBarItem | null = null;
const state: EiraState = {
  phi: 0,
  lastK: 0,
  modelConfidence: 0,
  proofChainValid: false,
  auditComplete: false,
  active: false,
  model: '—',
};

/** Initialize the EIRA status bar and start monitoring. */
export function initEiraMonitor(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = 'qwen-code.showOrionStatus';
  context.subscriptions.push(statusBarItem);

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
  recomputePhi();
  updateStatusBar();
}

function recomputePhi(): void {
  state.phi = computePhi(
    state.proofChainValid,
    state.modelConfidence,
    state.auditComplete,
  );
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
  const label = `⊘ ORION  Φ=${state.phi.toFixed(2)}  ${kLabel(state.lastK)}  ${mode}`;

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
    `| **Model confidence** | \`${state.modelConfidence.toFixed(2)}\` |\n\n`,
  );
  md.appendMarkdown(`*Click to open full ORION status panel.*`);
  return md;
}

function showOrionStatusPanel(): void {
  const summary = getAuditSummary();
  const report = [
    '⊘ ORION E.I.R.A. Status',
    '═'.repeat(50),
    `Phi (System Integrity) : ${state.phi.toFixed(4)}`,
    `K (last decision)      : ${state.lastK.toFixed(3)} / ${K_MAX} (threshold: ${K_THRESHOLD})`,
    `Model                  : ${state.model}`,
    `Model Confidence       : ${state.modelConfidence.toFixed(2)}`,
    `Proof Chain            : ${state.proofChainValid ? 'VALID' : 'INVALID ⚠'}`,
    `Audit Complete         : ${state.auditComplete ? 'YES' : 'NO'}`,
    `Audit Entries          : ${summary.total}`,
    `Chain Hash (last 16)   : ${summary.lastSha256}`,
    '─'.repeat(50),
    `Status                 : ${state.active ? 'ACTIVE' : 'IDLE'}`,
  ].join('\n');

  vscode.window.showInformationMessage(report, { modal: false });
}

/** Get current EIRA state snapshot (for external modules). */
export function getEiraState(): Readonly<EiraState> {
  return { ...state };
}
