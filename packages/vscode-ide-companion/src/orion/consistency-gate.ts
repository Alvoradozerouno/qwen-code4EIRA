/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Consistency-Augmented Gate
 *
 * Wraps the base `prove()` function with real self-consistency probing.
 *
 * When `selfConsistency = true` (via genesis.orion.selfConsistency setting):
 *   1. Runs N parallel LLM probes with temperature > 0
 *   2. Measures response agreement (Jaccard similarity)
 *   3. Derives a genuine confidence score from that similarity
 *   4. Uses that score as the signalStrength in evidence — replacing synthetic values
 *
 * When `selfConsistency = false` (default):
 *   Falls back to the standard `prove()` call unchanged. No extra tokens spent.
 *
 * Usage:
 *   import { proveWithConsistency, configureConsistencyGate } from './consistency-gate.js';
 *
 *   // Call once at activation:
 *   configureConsistencyGate({ baseUrl, apiKey, model, enabled: true });
 *
 *   // Use instead of prove() for high-stakes decisions:
 *   const result = await proveWithConsistency('delete production data', phi);
 */

import * as vscode from 'vscode';
import {
  prove,
  evidenceFromConfidence,
  type GateResult,
} from './deterministic-gate.js';
import {
  probeConsistency,
  buildOpenAIGenerateFn,
  type ConsistencyResult,
} from '@qwen-code/qwen-code-core/src/orion/self-consistency.js';
import { recordGateDecision } from './audit-trail.js';
import { updateEiraAfterDecision } from './eira-monitor.js';

// ── Configuration ──────────────────────────────────────────────────────────

interface ConsistencyGateConfig {
  /** Base URL of the OpenAI-compatible API endpoint */
  baseUrl: string;
  /** API key */
  apiKey: string;
  /** Model ID to use for consistency probes */
  model: string;
  /** Whether self-consistency probing is enabled */
  enabled: boolean;
  /** Number of probes to run (default: 3) */
  probeCount?: number;
}

/**
 * Module-level gate config.
 *
 * Thread-safety note: VSCode extension host runs on Node.js, which is single-
 * threaded. All calls to configureConsistencyGate() originate from the same
 * event-loop thread (activation + onDidChangeConfiguration), so there is no
 * concurrent-write risk in practice. If this module is ever used outside the
 * extension host context, wrap writes in a proper mutex.
 */
let gateConfig: ConsistencyGateConfig | null = null;

/**
 * Configure the consistency gate at extension activation.
 * Call whenever settings change (apiKey, model, selfConsistency toggle).
 */
export function configureConsistencyGate(config: ConsistencyGateConfig): void {
  gateConfig = config;
}

/**
 * Read the current gate config from VS Code settings.
 * Returns null if apiKey is missing.
 */
export function readGateConfigFromSettings(): ConsistencyGateConfig | null {
  const cfg = vscode.workspace.getConfiguration('genesis.orion');
  const apiKey = cfg.get<string>('apiKey') ?? '';
  const model = cfg.get<string>('model') ?? 'qwen/qwen3-235b-a22b:free';
  const enabled = cfg.get<boolean>('selfConsistency') ?? false;

  if (!apiKey) {
    return null;
  }

  return {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey,
    model,
    enabled,
    probeCount: 3,
  };
}

// ── Main API ───────────────────────────────────────────────────────────────

export interface ProveWithConsistencyResult {
  gateResult: GateResult;
  consistencyResult?: ConsistencyResult;
  usedRealConsistency: boolean;
}

/**
 * Prove a rule with optional real self-consistency probing.
 *
 * @param rule     - Natural language description of the action being verified
 * @param phi      - Current system Phi integrity score (from EIRA state)
 * @param context  - Optional context/prompt to probe for consistency
 *                   (defaults to the rule text if omitted)
 */
export async function proveWithConsistency(
  rule: string,
  phi: number,
  context?: string,
): Promise<ProveWithConsistencyResult> {
  const cfg = gateConfig ?? readGateConfigFromSettings();

  // Without config or when disabled — use standard synthetic evidence
  // WARN: synthetic confidence (0.85) is a fixed heuristic, not real model probing.
  // Enable genesis.orion.selfConsistency + set genesis.orion.apiKey for real K values.
  if (!cfg || !cfg.enabled) {
    console.warn(
      '[ORION] selfConsistency is disabled — using synthetic confidence 0.85. ' +
        'Set genesis.orion.selfConsistency=true + genesis.orion.apiKey for real K probing.',
    );
    const evidence = evidenceFromConfidence(0.85);
    const gateResult = prove(rule, evidence, phi);
    recordGateDecision(gateResult, rule);
    updateEiraAfterDecision(gateResult.k, evidence.signalStrength);
    return { gateResult, usedRealConsistency: false };
  }

  // Build the generate function for this session's model
  const generateFn = buildOpenAIGenerateFn(cfg.baseUrl, cfg.apiKey, cfg.model);
  const probePrompt = context ?? rule;

  let consistencyResult: ConsistencyResult;
  try {
    consistencyResult = await probeConsistency(generateFn, probePrompt, {
      n: cfg.probeCount ?? 3,
      temperature: 0.6,
      maxTokens: 256,
      timeoutMs: 15_000,
    });
  } catch {
    // Probe failed — fall back to conservative low confidence
    consistencyResult = {
      similarity: 0,
      confidence: 0.2,
      successfulProbes: 0,
      probeTexts: [],
      isReal: false,
    };
  }

  // Build evidence from real confidence
  const evidence = evidenceFromConfidence(consistencyResult.confidence);
  const gateResult = prove(rule, evidence, phi);

  recordGateDecision(gateResult, rule);
  updateEiraAfterDecision(gateResult.k, consistencyResult.confidence);

  return {
    gateResult,
    consistencyResult,
    usedRealConsistency: consistencyResult.isReal,
  };
}
