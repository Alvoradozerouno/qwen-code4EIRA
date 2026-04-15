/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ParallelOrchestrator,
  type OrchestratorTask,
} from './parallel-orchestrator.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function immediateTask(
  name: string,
  value: string,
  depNames?: string[],
): OrchestratorTask {
  return {
    name,
    prompt: `prompt for ${name}`,
    execute: async () => value,
    dependsOn: depNames,
  };
}

function failingTask(name: string, depNames?: string[]): OrchestratorTask {
  return {
    name,
    prompt: `prompt for ${name}`,
    execute: async () => {
      throw new Error(`${name} failed intentionally`);
    },
    dependsOn: depNames,
  };
}

// ── Basic execution ────────────────────────────────────────────────────────

describe('ParallelOrchestrator basic execution', () => {
  it('runs a single task and returns its value', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([immediateTask('t1', 'hello')]);

    expect(run.allSucceeded).toBe(true);
    expect(run.valueOf('t1')).toBe('hello');
  });

  it('runs multiple independent tasks in parallel', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([
      immediateTask('a', 'A'),
      immediateTask('b', 'B'),
      immediateTask('c', 'C'),
    ]);

    expect(run.allSucceeded).toBe(true);
    expect(run.valueOf('a')).toBe('A');
    expect(run.valueOf('b')).toBe('B');
    expect(run.valueOf('c')).toBe('C');
  });

  it('returns an empty run for zero tasks', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([]);
    expect(run.allSucceeded).toBe(true);
    expect(run.results.size).toBe(0);
  });
});

// ── Dependencies ──────────────────────────────────────────────────────────

describe('ParallelOrchestrator dependency ordering', () => {
  it('passes upstream results to downstream tasks', async () => {
    const o = new ParallelOrchestrator();

    const tasks: OrchestratorTask[] = [
      immediateTask('first', 'first-value'),
      {
        name: 'second',
        prompt: 'second prompt',
        execute: async (_prompt, deps) => {
          const firstResult = deps.get('first');
          return `second-got-${firstResult?.value}`;
        },
        dependsOn: ['first'],
      },
    ];

    const run = await o.run(tasks);
    expect(run.allSucceeded).toBe(true);
    expect(run.valueOf('second')).toBe('second-got-first-value');
  });

  it('handles a chain of 3 sequential dependencies', async () => {
    const o = new ParallelOrchestrator();

    const run = await o.run([
      immediateTask('step1', 's1'),
      immediateTask('step2', 's2', ['step1']),
      immediateTask('step3', 's3', ['step2']),
    ]);

    expect(run.allSucceeded).toBe(true);
    expect(run.valueOf('step3')).toBe('s3');
  });

  it('throws on circular dependencies', async () => {
    const o = new ParallelOrchestrator();

    await expect(() =>
      o.run([immediateTask('a', 'A', ['b']), immediateTask('b', 'B', ['a'])]),
    ).rejects.toThrow(/circular/i);
  });

  it('throws on unknown dependency', async () => {
    const o = new ParallelOrchestrator();
    await expect(() =>
      o.run([immediateTask('x', 'X', ['nonexistent'])]),
    ).rejects.toThrow(/unknown task/i);
  });
});

// ── Failure handling ───────────────────────────────────────────────────────

describe('ParallelOrchestrator failure handling', () => {
  it('marks a failing task as failed', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([failingTask('bad')]);

    expect(run.allSucceeded).toBe(false);
    expect(run.failedTasks).toContain('bad');
    const r = run.results.get('bad');
    expect(r?.status).toBe('failed');
    expect(r?.error).toContain('failed intentionally');
  });

  it('skips tasks whose dependencies failed', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([
      failingTask('parent'),
      immediateTask('child', 'ok', ['parent']),
    ]);

    const child = run.results.get('child');
    expect(child?.status).toBe('skipped');
  });

  it('cascades skip through multi-level dependencies', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([
      failingTask('root'),
      immediateTask('mid', 'ok', ['root']),
      immediateTask('leaf', 'ok', ['mid']),
    ]);

    expect(run.results.get('mid')?.status).toBe('skipped');
    expect(run.results.get('leaf')?.status).toBe('skipped');
  });

  it('retries on failure and succeeds within retry budget', async () => {
    let attempts = 0;
    const o = new ParallelOrchestrator();

    const run = await o.run([
      {
        name: 'flaky',
        prompt: 'test',
        maxRetries: 2,
        execute: async () => {
          attempts++;
          if (attempts < 2) throw new Error('transient');
          return 'success';
        },
      },
    ]);

    expect(run.allSucceeded).toBe(true);
    expect(run.valueOf('flaky')).toBe('success');
    expect(run.results.get('flaky')?.attempts).toBe(2);
  });
});

// ── Concurrency ───────────────────────────────────────────────────────────

describe('ParallelOrchestrator concurrency', () => {
  it('respects maxConcurrency limit', async () => {
    let concurrentNow = 0;
    let maxObserved = 0;

    const makeTask = (name: string): OrchestratorTask => ({
      name,
      prompt: name,
      execute: async () => {
        concurrentNow++;
        maxObserved = Math.max(maxObserved, concurrentNow);
        await new Promise((r) => setTimeout(r, 20));
        concurrentNow--;
        return name;
      },
    });

    const o = new ParallelOrchestrator({ maxConcurrency: 2 });
    const tasks = Array.from({ length: 6 }, (_, i) => makeTask(`t${i}`));
    const run = await o.run(tasks);

    expect(run.allSucceeded).toBe(true);
    expect(maxObserved).toBeLessThanOrEqual(2);
  });
});

// ── onTaskDone callback ────────────────────────────────────────────────────

describe('ParallelOrchestrator onTaskDone', () => {
  it('calls onTaskDone for each task', async () => {
    const doneCalled: string[] = [];
    const o = new ParallelOrchestrator({
      onTaskDone: (r) => doneCalled.push(r.name),
    });

    await o.run([immediateTask('x', 'xv'), immediateTask('y', 'yv')]);

    expect(doneCalled).toContain('x');
    expect(doneCalled).toContain('y');
  });
});

// ── summary ───────────────────────────────────────────────────────────────

describe('OrchestratorRun.summary', () => {
  it('produces a non-empty summary string', async () => {
    const o = new ParallelOrchestrator();
    const run = await o.run([
      immediateTask('ok-task', 'ok'),
      failingTask('fail-task'),
    ]);

    const s = run.summary();
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
    expect(s).toContain('ok-task');
    expect(s).toContain('fail-task');
  });
});
