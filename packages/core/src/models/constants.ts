/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_QWEN_MODEL, MAINLINE_CODER_MODEL } from '../config/models.js';

import type { ModelConfig } from './types.js';

type AuthType = import('../core/contentGenerator.js').AuthType;
type ContentGeneratorConfig =
  import('../core/contentGenerator.js').ContentGeneratorConfig;

/**
 * Field keys for model-scoped generation config.
 *
 * Kept in a small standalone module to avoid circular deps. The `import('...')`
 * usage is type-only and does not emit runtime imports.
 */
export const MODEL_GENERATION_CONFIG_FIELDS = [
  'samplingParams',
  'timeout',
  'maxRetries',
  'retryErrorCodes',
  'enableCacheControl',
  'schemaCompliance',
  'reasoning',
  'contextWindowSize',
  'customHeaders',
  'extra_body',
  'modalities',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * Credential-related fields that are part of ContentGeneratorConfig
 * but not ModelGenerationConfig.
 */
export const CREDENTIAL_FIELDS = [
  'model',
  'apiKey',
  'apiKeyEnvKey',
  'baseUrl',
] as const satisfies ReadonlyArray<keyof ContentGeneratorConfig>;

/**
 * All provider-sourced fields that need to be tracked for source attribution
 * and cleared when switching from provider to manual credentials.
 */
export const PROVIDER_SOURCED_FIELDS = [
  ...CREDENTIAL_FIELDS,
  ...MODEL_GENERATION_CONFIG_FIELDS,
] as const;

/**
 * Environment variable mappings per authType.
 */
export interface AuthEnvMapping {
  apiKey: string[];
  baseUrl: string[];
  model: string[];
}

export const AUTH_ENV_MAPPINGS = {
  openai: {
    apiKey: ['OPENAI_API_KEY'],
    baseUrl: ['OPENAI_BASE_URL'],
    model: ['OPENAI_MODEL', 'QWEN_MODEL'],
  },
  anthropic: {
    apiKey: ['ANTHROPIC_API_KEY'],
    baseUrl: ['ANTHROPIC_BASE_URL'],
    model: ['ANTHROPIC_MODEL'],
  },
  gemini: {
    apiKey: ['GEMINI_API_KEY'],
    baseUrl: [],
    model: ['GEMINI_MODEL'],
  },
  'vertex-ai': {
    apiKey: ['GOOGLE_API_KEY'],
    baseUrl: [],
    model: ['GOOGLE_MODEL'],
  },
  'localhost-nexus-redirect': {
    apiKey: [],
    baseUrl: [],
    model: [],
  },
} as const satisfies Record<AuthType, AuthEnvMapping>;

export const DEFAULT_MODELS = {
  openai: MAINLINE_CODER_MODEL,
  'localhost-nexus-redirect': DEFAULT_QWEN_MODEL,
} as Partial<Record<AuthType, string>>;

/**
 * Hard-coded Localhost-Nexus-Redirect models available via the local inference server.
 * These cannot be overridden by user configuration.
 *
 * The local inference server (http://localhost:11434/v1) should serve these models.
 * Ollama-compatible endpoint — no API key required.
 */
export const LOCAL_NEXUS_MODELS: ModelConfig[] = [
  // ── Tier 0: Free Qwen3 ───────────────────────────────────────────────────
  {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Orion Ultra Free (Qwen3 235B)',
    description: 'Stärkstes kostenloses Qwen3-MoE-Modell via OpenRouter',
    capabilities: { vision: false },
  },
  {
    id: 'qwen/qwen3-32b:free',
    name: 'Orion 32B Free (Qwen3)',
    description: 'Qwen3 32B Dense – kostenlos via OpenRouter',
    capabilities: { vision: false },
  },
  {
    id: 'qwen/qwen3-30b-a3b:free',
    name: 'Orion Fast Free (Qwen3 30B)',
    description: 'Qwen3 30B MoE – schnell und kostenlos via OpenRouter',
    capabilities: { vision: false },
  },

  // ── Tier 1: Paid Qwen ────────────────────────────────────────────────────
  {
    id: 'qwen/qwen3-235b-a22b',
    name: 'Orion Ultra (Qwen3 235B)',
    description:
      'Qwen3 235B MoE – keine Rate-Limits, volle Geschwindigkeit via OpenRouter',
    capabilities: { vision: false },
  },
  {
    id: 'qwen/qwen-2.5-coder-32b',
    name: 'Orion Coder 32B (Qwen2.5)',
    description: 'Qwen2.5-Coder 32B – optimiert für Code via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'qwen/qwen-2.5-coder-72b-instruct',
    name: 'Orion Coder Ultra 72B (Qwen2.5)',
    description: 'Qwen2.5-Coder 72B Instruct via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'qwen/qwen-2.5-plus',
    name: 'Orion Plus (Qwen2.5)',
    description: 'Qwen2.5-Plus – Allzweck-Modell via OpenRouter',
    capabilities: { vision: true },
  },

  // ── Tier 2: Top Frontier Models via OpenRouter ───────────────────────────
  // Same single OpenRouter API key — no separate provider accounts needed.
  {
    id: 'anthropic/claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5 (Anthropic)',
    description:
      'Anthropics stärkstes Alltags-Modell – führend auf SWE-Bench via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'anthropic/claude-opus-4-5',
    name: 'Claude Opus 4.5 (Anthropic)',
    description:
      'Anthropics leistungsstärkstes Modell – maximale Reasoning-Tiefe via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1 (OpenAI)',
    description:
      'OpenAIs aktuelles Flagship-Modell – sehr stark für Code via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini (OpenAI)',
    description:
      'GPT-4.1 Mini – schnell und günstig, gut für Drafts via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Google)',
    description: 'Googles stärkstes Modell mit 1M-Token-Kontext via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Google)',
    description:
      'Gemini 2.5 Flash – extrem schnell und kostengünstig via OpenRouter',
    capabilities: { vision: true },
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B (Meta)',
    description:
      'Metas stärkstes Open-Source-Modell – kosteneffizient für Batch-Tasks via OpenRouter',
    capabilities: { vision: false },
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (DeepSeek)',
    description:
      'Führendes chinesisches Reasoning-Modell – stärkstes Preis-Leistungs-Verhältnis via OpenRouter',
    capabilities: { vision: false },
  },
];

/**
 * Derive allowed models from LOCAL_NEXUS_MODELS for authorization.
 * This ensures single source of truth (SSOT).
 */
export const LOCAL_NEXUS_ALLOWED_MODELS = LOCAL_NEXUS_MODELS.map(
  (model) => model.id,
) as readonly string[];
