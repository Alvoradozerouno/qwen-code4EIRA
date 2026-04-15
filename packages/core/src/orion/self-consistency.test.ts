/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import {
  probeConsistency,
  buildOpenAIGenerateFn,
  type GenerateFn,
} from './self-consistency.js';

// ── Helper factories ───────────────────────────────────────────────────────

/** Always returns the same text — maximum similarity */
function constantFn(text: string): GenerateFn {
  return async () => text;
}

/** Returns one of the provided texts in round-robin */
function rotatingFn(texts: string[]): GenerateFn {
  let i = 0;
  return async () => {
    const t = texts[i % texts.length];
    i++;
    return t;
  };
}

/** Always rejects — simulates network failure */
const failingFn: GenerateFn = async () => {
  throw new Error('Network error');
};

// ── probeConsistency ──────────────────────────────────────────────────────

describe('probeConsistency', () => {
  it('returns high confidence for identical responses', async () => {
    const generate = constantFn('The answer is 42. This is a test response.');
    const result = await probeConsistency(generate, 'What is the answer?', {
      n: 3,
    });

    expect(result.successfulProbes).toBe(3);
    expect(result.isReal).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.99);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('returns lower confidence for divergent responses', async () => {
    const generate = rotatingFn([
      'The capital of France is Paris, a beautiful city.',
      'Quantum entanglement allows for spooky action at a distance.',
      'The best way to cook pasta is to use plenty of salted water.',
    ]);
    const result = await probeConsistency(generate, 'Tell me something', {
      n: 3,
    });

    expect(result.successfulProbes).toBe(3);
    expect(result.isReal).toBe(true);
    // Divergent texts should produce low similarity
    expect(result.similarity).toBeLessThan(0.4);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('falls back gracefully when all probes fail', async () => {
    const result = await probeConsistency(failingFn, 'test', { n: 3 });

    expect(result.isReal).toBe(false);
    expect(result.successfulProbes).toBe(0);
    expect(result.confidence).toBe(0.2);
    expect(result.similarity).toBe(0);
  });

  it('falls back gracefully when only one probe succeeds', async () => {
    let callCount = 0;
    const mixedFn: GenerateFn = async () => {
      callCount++;
      if (callCount === 1) return 'Some response text here';
      throw new Error('fail');
    };

    const result = await probeConsistency(mixedFn, 'test', { n: 3 });

    expect(result.isReal).toBe(false);
    expect(result.successfulProbes).toBe(1);
    expect(result.confidence).toBe(0.2);
  });

  it('uses minimum n=2 even when n=1 is requested', async () => {
    const generate = constantFn('response');
    const result = await probeConsistency(generate, 'test', { n: 1 });

    expect(result.successfulProbes).toBe(2);
    expect(result.isReal).toBe(true);
  });

  it('empty responses are filtered out', async () => {
    let callCount = 0;
    const emptyFn: GenerateFn = async () => {
      callCount++;
      if (callCount % 2 === 0) return '   '; // blank
      return 'real response text';
    };

    const result = await probeConsistency(emptyFn, 'test', { n: 4 });
    // Only non-blank responses count
    expect(result.probeTexts.every((t) => t.trim().length > 0)).toBe(true);
  });
});

// ── buildOpenAIGenerateFn ─────────────────────────────────────────────────

describe('buildOpenAIGenerateFn', () => {
  it('returns a GenerateFn', () => {
    const fn = buildOpenAIGenerateFn(
      'https://openrouter.ai/api/v1',
      'test-key',
      'qwen/qwen3-235b-a22b:free',
    );
    expect(typeof fn).toBe('function');
  });

  it('calls the correct endpoint with the right body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'test answer' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const fn = buildOpenAIGenerateFn(
      'https://openrouter.ai/api/v1',
      'my-key',
      'test-model',
    );
    const result = await fn('hello', 0.5, 128, 5000);

    expect(result).toBe('test answer');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.model).toBe('test-model');
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(128);
    expect(body.messages[0].content).toBe('hello');

    vi.unstubAllGlobals();
  });

  it('throws on non-OK HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );

    const fn = buildOpenAIGenerateFn(
      'https://openrouter.ai/api/v1',
      'key',
      'model',
    );
    await expect(fn('test', 0.5, 128, 5000)).rejects.toThrow('HTTP 429');

    vi.unstubAllGlobals();
  });
});
