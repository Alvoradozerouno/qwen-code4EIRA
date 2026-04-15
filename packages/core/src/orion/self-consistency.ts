/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Self-Consistency Prober
 *
 * Replaces synthetic K evidence with real model confidence derived from
 * response stability across N independent probes.
 *
 * Algorithm:
 *   1. Send the same prompt N times with temperature > 0
 *   2. Measure pairwise token-overlap (Jaccard similarity) between responses
 *   3. Map mean similarity to a confidence score [0..1]
 *   4. Feed that score into evidenceFromConfidence() → real K value
 *
 * The result is a genuine, model-derived confidence signal rather than
 * a hand-crafted heuristic.
 *
 * Usage:
 *   const confidence = await probeConsistency(generate, prompt, { n: 3 });
 *   const evidence   = evidenceFromConfidence(confidence);
 *   const result     = prove('action-description', evidence, phi);
 */

export interface ProbeOptions {
  /** Number of independent probes (default: 3). Higher = more accurate, more cost. */
  n?: number;
  /** Sampling temperature for probes (default: 0.6). 0 = deterministic. */
  temperature?: number;
  /** Max tokens per probe response (default: 256). */
  maxTokens?: number;
  /** Timeout per probe in ms (default: 15_000). */
  timeoutMs?: number;
}

export interface ConsistencyResult {
  /** Mean Jaccard similarity across all probe pairs [0..1] */
  similarity: number;
  /** Normalised confidence score [0..1] derived from similarity */
  confidence: number;
  /** Number of probes that completed successfully */
  successfulProbes: number;
  /** Raw response texts from each successful probe */
  probeTexts: string[];
  /** Whether the result was computed from real probes (true) or defaulted (false) */
  isReal: boolean;
}

/**
 * Generate function signature accepted by probeConsistency.
 * Callers pass a thin wrapper around their actual LLM client.
 */
export type GenerateFn = (
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number,
) => Promise<string>;

/**
 * Tokenise text into a bag of lower-case words for Jaccard comparison.
 * Intentionally simple — consistent cross-language, no dependency needed.
 */
function tokenise(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9_\-./\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  return new Set(tokens);
}

/**
 * Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|
 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1.0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1.0 : intersection / union;
}

/**
 * Compute mean pairwise Jaccard similarity across a list of texts.
 */
function meanPairwiseSimilarity(texts: string[]): number {
  if (texts.length === 0) {
    return 0;
  }
  if (texts.length === 1) {
    return 1.0;
  }

  const tokenSets = texts.map(tokenise);
  let total = 0;
  let pairs = 0;

  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      total += jaccard(tokenSets[i], tokenSets[j]);
      pairs += 1;
    }
  }

  return pairs === 0 ? 0 : total / pairs;
}

/**
 * Similarity band boundaries for the piecewise confidence mapping.
 *
 * Tuned so that:
 *  - VERY_HIGH (0.85+): nearly identical responses → confidence 0.75–1.0
 *    At this level K will exceed 3.2 (PROVEN) even with conservative evidence.
 *  - HIGH (0.60+):      strong overlap → confidence 0.55–0.75
 *    May produce PROVEN for low-stakes rules.
 *  - MODERATE (0.35+):  some overlap → confidence 0.30–0.55
 *    Will typically ABSTAIN. Safe floor for uncertain decisions.
 *  - LOW (<0.35):       divergent responses → confidence 0–0.30
 *    Gate will ABSTAIN. User should re-phrase or increase n.
 */
const SIM_VERY_HIGH = 0.85; // lower bound of very-high band
const SIM_HIGH = 0.6; // lower bound of high band
const SIM_MODERATE = 0.35; // lower bound of moderate band

// Confidence output at each band boundary
const CONF_AT_VERY_HIGH_LOW = 0.75; // confidence when similarity === SIM_VERY_HIGH
const CONF_AT_HIGH_LOW = 0.55; // confidence when similarity === SIM_HIGH
const CONF_AT_MODERATE_LOW = 0.3; // confidence when similarity === SIM_MODERATE

/**
 * Map raw Jaccard similarity to a usable confidence score using a piecewise
 * linear function bounded by the SIM_* / CONF_AT_* constants above.
 *
 * The mapping is deliberately conservative to avoid false positives.
 */
function similarityToConfidence(similarity: number): number {
  // Clamp input
  const s = Math.min(1, Math.max(0, similarity));

  // Piecewise linear mapping — tuned to produce K≥3.2 only when truly consistent
  if (s >= SIM_VERY_HIGH) {
    const span = 1 - SIM_VERY_HIGH; // 0.15
    return (
      CONF_AT_VERY_HIGH_LOW +
      (1 - CONF_AT_VERY_HIGH_LOW) * ((s - SIM_VERY_HIGH) / span)
    ); // 0.75 → 1.0
  }
  if (s >= SIM_HIGH) {
    const span = SIM_VERY_HIGH - SIM_HIGH; // 0.25
    return (
      CONF_AT_HIGH_LOW +
      (CONF_AT_VERY_HIGH_LOW - CONF_AT_HIGH_LOW) * ((s - SIM_HIGH) / span)
    ); // 0.55 → 0.75
  }
  if (s >= SIM_MODERATE) {
    const span = SIM_HIGH - SIM_MODERATE; // 0.25
    return (
      CONF_AT_MODERATE_LOW +
      (CONF_AT_HIGH_LOW - CONF_AT_MODERATE_LOW) * ((s - SIM_MODERATE) / span)
    ); // 0.30 → 0.55
  }
  return s * (CONF_AT_MODERATE_LOW / SIM_MODERATE); // 0 → 0.30
}

/**
 * Run N independent probes and return real consistency confidence.
 *
 * @param generate - Async function that calls the LLM and returns text
 * @param prompt   - The prompt to probe for consistency
 * @param opts     - Probe options
 */
export async function probeConsistency(
  generate: GenerateFn,
  prompt: string,
  opts: ProbeOptions = {},
): Promise<ConsistencyResult> {
  const n = Math.max(2, opts.n ?? 3);
  const temperature = opts.temperature ?? 0.6;
  const maxTokens = opts.maxTokens ?? 256;
  const timeoutMs = opts.timeoutMs ?? 15_000;

  // Fire all probes concurrently — each is independent by design
  const probePromises = Array.from({ length: n }, () =>
    generate(prompt, temperature, maxTokens, timeoutMs).catch(() => null),
  );

  const results = await Promise.all(probePromises);
  const probeTexts: string[] = [];

  for (const r of results) {
    if (typeof r === 'string' && r.trim().length > 0) {
      probeTexts.push(r.trim());
    }
  }

  if (probeTexts.length < 2) {
    // Not enough data — fall back to a neutral low confidence
    return {
      similarity: 0,
      confidence: 0.2,
      successfulProbes: probeTexts.length,
      probeTexts,
      isReal: false,
    };
  }

  const similarity = meanPairwiseSimilarity(probeTexts);
  const confidence = similarityToConfidence(similarity);

  return {
    similarity,
    confidence,
    successfulProbes: probeTexts.length,
    probeTexts,
    isReal: true,
  };
}

/**
 * Build a GenerateFn from a plain fetch call to an OpenAI-compatible endpoint.
 * This avoids importing the full SDK — suitable for lightweight probe callers.
 *
 * @param baseUrl  - e.g. "https://openrouter.ai/api/v1"
 * @param apiKey   - API key for the provider
 * @param model    - Model ID to use for probes
 */
export function buildOpenAIGenerateFn(
  baseUrl: string,
  apiKey: string,
  model: string,
): GenerateFn {
  return async (
    prompt: string,
    temperature: number,
    maxTokens: number,
    timeoutMs: number,
  ): Promise<string> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://openrouter.ai',
          'X-Title': 'Genesis Copilot Orion Self-Consistency',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await response.json()) as any;
      const text: string =
        data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
      return text;
    } finally {
      clearTimeout(timer);
    }
  };
}
