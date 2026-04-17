/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Parallel Multi-Agent Orchestrator
 *
 * Enables real concurrent execution of independent sub-tasks via
 * Promise.all — each task runs in its own async lane with its own
 * timeout, retry budget, and result contract.
 *
 * Key concepts:
 *   OrchestratorTask   — a named unit of work with a prompt, executor fn,
 *                        optional timeout/retries, and optional dependencies
 *   TaskResult         — outcome + timing + error info per task
 *   OrchestratorRun    — a batch of tasks with a shared coordinator plan
 *
 * The orchestrator does NOT spawn separate OS processes (that requires a
 * full sandboxing layer). It runs tasks as concurrent async coroutines,
 * which is the correct model for LLM I/O-bound work.
 *
 * Dependency ordering:
 *   Tasks may declare `dependsOn: string[]` to specify other task names
 *   they need to complete first. The orchestrator topologically sorts
 *   tasks and runs independent groups in parallel waves.
 *
 * Usage:
 *   const orchestrator = new ParallelOrchestrator({ maxConcurrency: 4 });
 *   const run = await orchestrator.run([
 *     { name: 'analyse-deps',  prompt: '...', execute: myAgent },
 *     { name: 'write-tests',   prompt: '...', execute: myAgent, dependsOn: ['analyse-deps'] },
 *     { name: 'write-docs',    prompt: '...', execute: myAgent },
 *   ]);
 *   console.log(run.summary());
 */

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * A single unit of work for the orchestrator.
 */
export interface OrchestratorTask<TResult = string> {
  /** Unique name within this run — used for dependency references */
  name: string;
  /** Human-readable description of what this task does */
  description?: string;
  /** The prompt / instruction passed to the executor */
  prompt: string;
  /**
   * Async executor function.
   * Receives the task prompt plus results of any declared dependencies.
   */
  execute: (prompt: string, deps: TaskResultMap) => Promise<TResult>;
  /** Optional task-level timeout in milliseconds (default: 120_000) */
  timeoutMs?: number;
  /** Optional max retry attempts on failure (default: 0) */
  maxRetries?: number;
  /** Names of tasks that must complete before this task starts */
  dependsOn?: string[];
  /** Optional metadata for logging / audit */
  meta?: Record<string, unknown>;
}

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface TaskResult<TResult = string> {
  name: string;
  status: TaskStatus;
  /** Resolved value (present when status === 'done') */
  value?: TResult;
  /** Error message (present when status === 'failed') */
  error?: string;
  /** Wall-clock duration in milliseconds */
  durationMs: number;
  /** Number of attempts made (1 = first try, 2+ = retried) */
  attempts: number;
}

/** Map of task name → result, passed as dependency context to downstream tasks */
export type TaskResultMap = Map<string, TaskResult>;

/**
 * Inference optimization profiles for the orchestrator.
 *
 * - `balanced`    — Default. maxConcurrency=4, timeout=120 s. Good all-around.
 * - `throughput`  — Maximizes parallel work: maxConcurrency=8, timeout=240 s.
 *                   Best for batch / background pipelines where latency is not critical.
 * - `latency`     — Minimizes wait time: maxConcurrency=2, timeout=60 s.
 *                   Best for interactive, user-facing calls where fast first-response matters.
 */
export type InferenceOptimizationMode = 'balanced' | 'throughput' | 'latency';

/** Pre-set concurrency + timeout values for each optimization mode. */
const INFERENCE_OPTIMIZATION_PRESETS: Record<
  InferenceOptimizationMode,
  { maxConcurrency: number; defaultTimeoutMs: number }
> = {
  balanced: { maxConcurrency: 4, defaultTimeoutMs: 120_000 },
  throughput: { maxConcurrency: 8, defaultTimeoutMs: 240_000 },
  latency: { maxConcurrency: 2, defaultTimeoutMs: 60_000 },
};

export interface OrchestratorOptions {
  /** Maximum number of tasks allowed to run concurrently (default: 4) */
  maxConcurrency?: number;
  /** Default task timeout if not set per-task (default: 120_000 ms) */
  defaultTimeoutMs?: number;
  /**
   * Inference optimization mode (default: 'balanced').
   * When set, this pre-configures maxConcurrency and defaultTimeoutMs.
   * Explicit maxConcurrency / defaultTimeoutMs values override the preset.
   */
  inferenceOptimization?: InferenceOptimizationMode;
  /** Called after each task completes (for logging / UI updates) */
  onTaskDone?: (result: TaskResult) => void;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  taskName: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Task "${taskName}" timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Topological sort of tasks by dependency.
 * Returns an ordered list of waves — tasks in the same wave can run in parallel.
 *
 * Throws if a circular dependency is detected.
 */
function topoWaves(tasks: OrchestratorTask[]): OrchestratorTask[][] {
  const nameSet = new Set(tasks.map((t) => t.name));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>(); // dependency → dependents

  for (const task of tasks) {
    inDegree.set(task.name, 0);
    adjacency.set(task.name, []);
  }

  for (const task of tasks) {
    for (const dep of task.dependsOn ?? []) {
      if (!nameSet.has(dep)) {
        throw new Error(`Task "${task.name}" depends on unknown task "${dep}"`);
      }
      adjacency.get(dep)!.push(task.name);
      inDegree.set(task.name, (inDegree.get(task.name) ?? 0) + 1);
    }
  }

  const waves: OrchestratorTask[][] = [];
  const remaining = new Set(tasks.map((t) => t.name));

  while (remaining.size > 0) {
    // All tasks with inDegree 0 can run in this wave
    const wave = tasks.filter(
      (t) => remaining.has(t.name) && (inDegree.get(t.name) ?? 0) === 0,
    );

    if (wave.length === 0) {
      throw new Error(
        `Circular dependency detected among tasks: ${[...remaining].join(', ')}`,
      );
    }

    waves.push(wave);

    for (const task of wave) {
      remaining.delete(task.name);
      for (const dependent of adjacency.get(task.name) ?? []) {
        inDegree.set(dependent, (inDegree.get(dependent) ?? 0) - 1);
      }
    }
  }

  return waves;
}

// ── Semaphore ─────────────────────────────────────────────────────────────

class Semaphore {
  private permits: number;
  private readonly queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      this.queue.shift()!();
    } else {
      this.permits++;
    }
  }
}

// ── OrchestratorRun ────────────────────────────────────────────────────────

/**
 * Immutable result of a completed orchestration run.
 */
export class OrchestratorRun {
  constructor(readonly results: Map<string, TaskResult>) {}

  /** true iff all tasks completed with status 'done' */
  get allSucceeded(): boolean {
    for (const r of this.results.values()) {
      if (r.status !== 'done') {
        return false;
      }
    }
    return true;
  }

  /** List of failed task names */
  get failedTasks(): string[] {
    return [...this.results.entries()]
      .filter(([, r]) => r.status === 'failed')
      .map(([name]) => name);
  }

  /** Total wall-clock time across all tasks (sum, not elapsed) */
  get totalDurationMs(): number {
    let total = 0;
    for (const r of this.results.values()) {
      total += r.durationMs;
    }
    return total;
  }

  /** Human-readable summary */
  summary(): string {
    const lines: string[] = [
      `Orchestrator run — ${this.results.size} tasks`,
      `  Succeeded : ${[...this.results.values()].filter((r) => r.status === 'done').length}`,
      `  Failed    : ${this.failedTasks.length}`,
      `  Skipped   : ${[...this.results.values()].filter((r) => r.status === 'skipped').length}`,
      `  Total CPU : ${(this.totalDurationMs / 1000).toFixed(1)}s`,
    ];
    for (const [name, r] of this.results) {
      const tag =
        r.status === 'done'
          ? '✓'
          : r.status === 'failed'
            ? '✗'
            : r.status === 'skipped'
              ? '⊘'
              : '…';
      lines.push(
        `  ${tag} ${name} (${(r.durationMs / 1000).toFixed(1)}s, attempts=${r.attempts})`,
      );
      if (r.error) {
        lines.push(`      error: ${r.error}`);
      }
    }
    return lines.join('\n');
  }

  /** Get the resolved value for a specific task, or undefined */
  valueOf(taskName: string): unknown {
    return this.results.get(taskName)?.value;
  }
}

// ── ParallelOrchestrator ───────────────────────────────────────────────────

/**
 * Base delay in milliseconds for exponential-ish back-off between retries.
 * Retry N uses delay = RETRY_BACKOFF_BASE_MS * N (linear, not exponential,
 * to keep total wait bounded for small retry budgets).
 */
const RETRY_BACKOFF_BASE_MS = 500;

/**
 * Orchestrates multiple tasks with dependency ordering and concurrency control.
 *
 * Stateless — create a new instance or reuse the same one across runs.
 */
export class ParallelOrchestrator {
  private readonly semaphore: Semaphore;
  private readonly defaultTimeoutMs: number;
  private readonly onTaskDone?: (result: TaskResult) => void;

  constructor(opts: OrchestratorOptions = {}) {
    const preset =
      INFERENCE_OPTIMIZATION_PRESETS[opts.inferenceOptimization ?? 'balanced'];
    this.semaphore = new Semaphore(
      opts.maxConcurrency ?? preset.maxConcurrency,
    );
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? preset.defaultTimeoutMs;
    this.onTaskDone = opts.onTaskDone;
  }

  /**
   * Execute a list of tasks respecting dependency order and concurrency limits.
   *
   * @param tasks - Array of tasks (order within a dependency wave doesn't matter)
   * @returns     - OrchestratorRun with all results
   */
  async run<TResult = string>(
    tasks: Array<OrchestratorTask<TResult>>,
  ): Promise<OrchestratorRun> {
    if (tasks.length === 0) {
      return new OrchestratorRun(new Map());
    }

    const waves = topoWaves(tasks as OrchestratorTask[]);
    const allResults = new Map<string, TaskResult>();

    for (const wave of waves) {
      // Run all tasks in this wave in parallel (limited by semaphore)
      await Promise.all(
        wave.map((task) =>
          this.executeTask(task as OrchestratorTask, allResults),
        ),
      );

      // If any task in this wave failed and downstream tasks exist, mark them skipped
      for (const task of wave) {
        const result = allResults.get(task.name)!;
        if (result.status === 'failed') {
          this.markDependentsSkipped(
            task.name,
            tasks as OrchestratorTask[],
            allResults,
          );
        }
      }
    }

    return new OrchestratorRun(allResults);
  }

  private async executeTask(
    task: OrchestratorTask,
    allResults: Map<string, TaskResult>,
  ): Promise<void> {
    // Check if any dependency failed → skip this task
    for (const dep of task.dependsOn ?? []) {
      const depResult = allResults.get(dep);
      if (depResult && depResult.status !== 'done') {
        allResults.set(task.name, {
          name: task.name,
          status: 'skipped',
          error: `Skipped because dependency "${dep}" ${depResult.status}`,
          durationMs: 0,
          attempts: 0,
        });
        this.onTaskDone?.(allResults.get(task.name)!);
        return;
      }
    }

    const maxRetries = task.maxRetries ?? 0;
    const timeoutMs = task.timeoutMs ?? this.defaultTimeoutMs;

    // Build dependency results map for this task
    const deps: TaskResultMap = new Map();
    for (const dep of task.dependsOn ?? []) {
      const r = allResults.get(dep);
      if (r) {
        deps.set(dep, r);
      }
    }

    await this.semaphore.acquire();

    let attempts = 0;
    let lastError = '';
    const start = Date.now();

    try {
      while (attempts <= maxRetries) {
        attempts++;
        try {
          const value = await withTimeout(
            task.execute(task.prompt, deps),
            timeoutMs,
            task.name,
          );

          const result: TaskResult = {
            name: task.name,
            status: 'done',
            value,
            durationMs: Date.now() - start,
            attempts,
          };
          allResults.set(task.name, result);
          this.onTaskDone?.(result);
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (attempts > maxRetries) {
            break;
          }
          // Brief back-off before retry (linear: RETRY_BACKOFF_BASE_MS × attempt)
          await new Promise((r) =>
            setTimeout(r, RETRY_BACKOFF_BASE_MS * attempts),
          );
        }
      }

      // All attempts exhausted
      const result: TaskResult = {
        name: task.name,
        status: 'failed',
        error: lastError,
        durationMs: Date.now() - start,
        attempts,
      };
      allResults.set(task.name, result);
      this.onTaskDone?.(result);
    } finally {
      this.semaphore.release();
    }
  }

  private markDependentsSkipped(
    failedName: string,
    tasks: OrchestratorTask[],
    allResults: Map<string, TaskResult>,
  ): void {
    for (const task of tasks) {
      if (task.dependsOn?.includes(failedName) && !allResults.has(task.name)) {
        allResults.set(task.name, {
          name: task.name,
          status: 'skipped',
          error: `Skipped because upstream task "${failedName}" failed`,
          durationMs: 0,
          attempts: 0,
        });
        // Cascade to their dependents too
        this.markDependentsSkipped(task.name, tasks, allResults);
      }
    }
  }
}
