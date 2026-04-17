/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Audit Trail
 *
 * Cryptographically anchored audit log for EU AI Act compliance.
 * Article 13 (Transparency) + Article 14 (Human Oversight).
 *
 * Every tool call, decision, and ABSTAIN is recorded with:
 *   - SHA-256 chained proof (tamper-evident)
 *   - K value and Phi at time of decision
 *   - Full decision trace
 *
 * Log location: <workspace>/.orion/audit-trail.jsonl
 * Export: JSON report via exportAuditReport()
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import type { GateResult } from './deterministic-gate.js';

export interface AuditEntry {
  seq: number;
  ts: string;
  kind: 'TOOL_CALL' | 'GATE_DECISION' | 'SYSTEM_EVENT' | 'ABSTAIN';
  rule: string;
  decision: string;
  k: number;
  phi: number;
  inputHash: string;
  sha256: string;
  prevSha256: string;
  chainValid: boolean;
}

export interface AuditReport {
  generatedAt: string;
  totalEntries: number;
  provenCount: number;
  abstainCount: number;
  chainIntegrity: boolean;
  entries: AuditEntry[];
}

let auditFilePath: string | null = null;
let lastSha256 = '0'.repeat(64);
let seqCounter = 0;
let provenCounter = 0;
let abstainCounter = 0;
let chainValid = true;

/**
 * Initialize the audit trail.
 * Must be called once at extension activation with the workspace root.
 */
export function initAuditTrail(workspaceRoot: string): void {
  const orionDir = path.join(workspaceRoot, '.orion');
  if (!fs.existsSync(orionDir)) {
    fs.mkdirSync(orionDir, { recursive: true });
  }
  auditFilePath = path.join(orionDir, 'audit-trail.jsonl');

  // Resume chain from last entry if file exists
  if (fs.existsSync(auditFilePath)) {
    const lines = fs.readFileSync(auditFilePath, 'utf-8').trim().split('\n');
    let proven = 0;
    let abstain = 0;
    for (const line of lines) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line) as AuditEntry;
          seqCounter = entry.seq;
          lastSha256 = entry.sha256;
          if (entry.decision === 'PROVEN') {
            proven += 1;
          }
          if (entry.decision === 'ABSTAIN') {
            abstain += 1;
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
    provenCounter = proven;
    abstainCounter = abstain;
  }
}

function getAuditFile(): string | null {
  if (auditFilePath) {
    return auditFilePath;
  }
  // Fallback: try first workspace folder
  const folders = vscode.workspace.workspaceFolders;
  if (folders && folders.length > 0) {
    initAuditTrail(folders[0].uri.fsPath);
    return auditFilePath;
  }
  return null;
}

function hashInput(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/**
 * Record a gate decision in the audit trail.
 */
export function recordGateDecision(result: GateResult, input?: string): void {
  const file = getAuditFile();
  if (!file) {
    return;
  }

  seqCounter += 1;
  if (result.decision === 'PROVEN') {
    provenCounter += 1;
  } else if (result.decision === 'ABSTAIN') {
    abstainCounter += 1;
  }
  const entry: AuditEntry = {
    seq: seqCounter,
    ts: result.timestamp,
    kind: result.decision === 'ABSTAIN' ? 'ABSTAIN' : 'GATE_DECISION',
    rule: result.rule,
    decision: result.decision,
    k: result.k,
    phi: result.phi,
    inputHash: hashInput(input ?? result.rule),
    sha256: '',
    prevSha256: lastSha256,
    chainValid,
  };

  const payload = JSON.stringify({ ...entry, sha256: undefined });
  entry.sha256 = crypto
    .createHash('sha256')
    .update(lastSha256 + payload)
    .digest('hex');
  lastSha256 = entry.sha256;

  try {
    fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // silently fail — never block user flow for audit logging
  }
}

/**
 * Record a generic system event (startup, model change, error, etc.).
 */
export function recordSystemEvent(
  event: string,
  k: number = 5.0,
  phi: number = 1.0,
): void {
  const file = getAuditFile();
  if (!file) {
    return;
  }

  seqCounter += 1;
  const ts = new Date().toISOString();
  const entry: AuditEntry = {
    seq: seqCounter,
    ts,
    kind: 'SYSTEM_EVENT',
    rule: event,
    decision: 'SYSTEM',
    k,
    phi,
    inputHash: hashInput(event),
    sha256: '',
    prevSha256: lastSha256,
    chainValid,
  };

  const payload = JSON.stringify({ ...entry, sha256: undefined });
  entry.sha256 = crypto
    .createHash('sha256')
    .update(lastSha256 + payload)
    .digest('hex');
  lastSha256 = entry.sha256;

  try {
    fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // silently fail
  }
}

/**
 * Verify the chain integrity of the entire audit log.
 * Returns true if all SHA-256 links are valid.
 */
export function verifyChain(): boolean {
  const file = getAuditFile();
  if (!file || !fs.existsSync(file)) {
    return true;
  }

  const lines = fs
    .readFileSync(file, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);
  let prevHash = '0'.repeat(64);

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as AuditEntry;
      const { sha256, ...rest } = entry;
      const payload = JSON.stringify({ ...rest, sha256: undefined });
      const expected = crypto
        .createHash('sha256')
        .update(prevHash + payload)
        .digest('hex');
      if (expected !== sha256) {
        chainValid = false;
        return false;
      }
      prevHash = sha256;
    } catch {
      chainValid = false;
      return false;
    }
  }

  chainValid = true;
  return true;
}

/**
 * Export a structured audit report (EU AI Act Article 13 transparency output).
 */
export function exportAuditReport(): AuditReport {
  const file = getAuditFile();
  const entries: AuditEntry[] = [];

  if (file && fs.existsSync(file)) {
    const lines = fs
      .readFileSync(file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as AuditEntry);
      } catch {
        // skip
      }
    }
  }

  const provenCount = entries.filter((e) => e.decision === 'PROVEN').length;
  const abstainCount = entries.filter((e) => e.decision === 'ABSTAIN').length;

  return {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    provenCount,
    abstainCount,
    chainIntegrity: verifyChain(),
    entries,
  };
}

/**
 * Get summary statistics without loading all entries.
 */
export function getAuditSummary(): {
  total: number;
  proven: number;
  abstain: number;
  chainValid: boolean;
  lastSha256: string;
} {
  return {
    total: seqCounter,
    proven: provenCounter,
    abstain: abstainCounter,
    chainValid,
    lastSha256: lastSha256.slice(0, 16) + '…',
  };
}
