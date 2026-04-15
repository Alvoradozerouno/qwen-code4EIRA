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
  'qwen-oauth': {
    apiKey: ['GENESIS_ORION_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY'],
    baseUrl: ['OPENAI_BASE_URL'],
    model: ['OPENAI_MODEL'],
  },
} as const satisfies Record<AuthType, AuthEnvMapping>;

export const DEFAULT_MODELS = {
  openai: MAINLINE_CODER_MODEL,
  'qwen-oauth': DEFAULT_QWEN_MODEL,
} as Partial<Record<AuthType, string>>;

/**
 * Hard-coded Qwen OAuth models that are always available.
 * These cannot be overridden by user configuration.
 */
export const QWEN_OAUTH_MODELS: ModelConfig[] = [
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
];

/**
 * Derive allowed models from QWEN_OAUTH_MODELS for authorization.
 * This ensures single source of truth (SSOT).
 */
export const QWEN_OAUTH_ALLOWED_MODELS = QWEN_OAUTH_MODELS.map(
  (model) => model.id,
) as readonly string[];
