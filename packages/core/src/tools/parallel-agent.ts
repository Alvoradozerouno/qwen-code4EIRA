/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * parallel_agent — ORION LLM Tool
 *
 * Exposes SubagentManager.runParallelSubagents() as a first-class LLM tool.
 * The model can dispatch multiple subagents concurrently with dependency ordering.
 *
 * Key properties:
 * - Tasks in the same dependency wave execute in parallel (up to maxConcurrency=4)
 * - Tasks with dependsOn wait for their named dependencies first
 * - Each task runs a named subagent type (builtin or user-defined)
 * - ORION VitalityEngine ticks on run completion
 */

import type { FunctionDeclaration } from '@google/genai';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import type { ToolResult, ToolResultDisplay } from './tools.js';
import type { Config } from '../config/config.js';
import { getVitalityEngine } from '../orion/vitality.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('PARALLEL_AGENT');

export interface ParallelAgentTask {
  /** Unique name — used for dependsOn references */
  name: string;
  /** The instruction passed to the subagent */
  prompt: string;
  /** Subagent type name (builtin: 'task', 'explore', or user-defined) */
  subagent_type: string;
  /** Tasks that must complete before this task starts */
  depends_on?: string[];
  /** Per-task timeout in seconds (default: 120) */
  timeout_seconds?: number;
  /** Max retry attempts on failure (default: 0) */
  max_retries?: number;
}

export interface ParallelAgentParams {
  tasks: ParallelAgentTask[];
  /** Max simultaneous subagents (default: 4, max: 8) */
  max_concurrency?: number;
}

const parallelAgentSchema: FunctionDeclaration = {
  name: 'parallel_agent',
  description: `Run multiple subagents in parallel with optional dependency ordering.

Use this tool when you have independent tasks that can run concurrently, or when
you need a pipeline of dependent steps each handled by a specialized subagent.

Rules:
- Tasks with the same dependency wave execute concurrently (up to max_concurrency)
- A task with depends_on waits for ALL listed tasks to complete before starting
- If a dependency fails, downstream tasks are skipped automatically
- Each task runs an isolated subagent with its own context

Example uses:
- "Analyse A, B, C files in parallel, then write a summary after all 3 are done"
- "Run tests and docs generation concurrently"
- "Analyse codebase → (write fix + write test) in parallel → validate fix"`,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        description:
          'The list of tasks to run. Order within the array does not matter; dependency order controls execution.',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description:
                'Unique task identifier within this run. Referenced by other tasks in depends_on.',
            },
            prompt: {
              type: 'string',
              description: 'The full instruction for this subagent.',
            },
            subagent_type: {
              type: 'string',
              description:
                'Subagent type name. Common values: "task" (default general-purpose), "explore" (read-only research). Can also be a user-defined agent name from .qwen/agents/.',
            },
            depends_on: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Names of tasks that must complete successfully before this task starts.',
            },
            timeout_seconds: {
              type: 'number',
              description: 'Per-task timeout in seconds (default: 120).',
            },
            max_retries: {
              type: 'number',
              description: 'Number of retry attempts on failure (default: 0).',
            },
          },
          required: ['name', 'prompt', 'subagent_type'],
        },
        minItems: 1,
        maxItems: 16,
      },
      max_concurrency: {
        type: 'number',
        description:
          'Maximum number of simultaneously running subagents (default: 4, max: 8).',
      },
    },
    required: ['tasks'],
  },
};

export class ParallelAgentTool extends BaseDeclarativeTool<
  ParallelAgentParams,
  ToolResult
> {
  static readonly Name = 'parallel_agent';

  constructor(private readonly config: Config) {
    super(
      ParallelAgentTool.Name,
      'ParallelAgent',
      parallelAgentSchema.description ?? '',
      Kind.Other,
      parallelAgentSchema.parametersJsonSchema,
      /* isOutputMarkdown */ true,
      /* canUpdateOutput */ true,
    );
  }

  protected createInvocation(params: ParallelAgentParams) {
    return new ParallelAgentInvocation(this.config, params);
  }
}

class ParallelAgentInvocation extends BaseToolInvocation<
  ParallelAgentParams,
  ToolResult
> {
  constructor(
    private readonly config: Config,
    params: ParallelAgentParams,
  ) {
    super(params);
  }

  getDescription(): string {
    const taskNames = this.params.tasks.map((t) => t.name).join(', ');
    return `Run ${this.params.tasks.length} parallel agent task(s): ${taskNames}`;
  }

  override getDefaultPermission() {
    // Side-effectful — always ask (subagents write files, run shell commands)
    return Promise.resolve('ask' as const);
  }

  async execute(
    signal?: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    const subagentManager = this.config.getSubagentManager();
    const maxConcurrency = Math.min(this.params.max_concurrency ?? 4, 8);

    updateOutput?.(
      `⊘ ORION ParallelOrchestrator: launching ${this.params.tasks.length} task(s) (concurrency=${maxConcurrency})…`,
    );

    const taskDefs = this.params.tasks.map((t) => ({
      name: t.name,
      prompt: t.prompt,
      agentName: t.subagent_type,
      dependsOn: t.depends_on,
      timeoutMs:
        t.timeout_seconds != null ? t.timeout_seconds * 1000 : undefined,
      maxRetries: t.max_retries,
    }));

    try {
      const run = await subagentManager.runParallelSubagents(
        taskDefs,
        this.config,
        {
          orchestratorOptions: { maxConcurrency },
          signal,
        },
      );

      // Tick ORION VitalityEngine
      const vitality = getVitalityEngine();
      vitality.tick({
        positive: run.allSucceeded,
        proofAdded: run.allSucceeded,
        pressure:
          run.failedTasks.length > 0 ? 0.15 * run.failedTasks.length : 0,
      });

      const summary = run.summary();
      debugLogger.info(`[ParallelAgent] Run complete:\n${summary}`);

      updateOutput?.(summary);

      // Build result per task for LLM
      const taskResults: Record<string, string> = {};
      for (const [name, result] of run.results) {
        taskResults[name] =
          result.status === 'done'
            ? ((result.value as string | undefined) ?? '(completed)')
            : result.status === 'skipped'
              ? `[SKIPPED — dependency failed]`
              : `[FAILED: ${result.error ?? 'unknown error'}]`;
      }

      const llmText = [
        summary,
        '',
        '### Task Results',
        ...Object.entries(taskResults).map(
          ([name, val]) => `**${name}**: ${val}`,
        ),
      ].join('\n');

      return {
        llmContent: [{ text: llmText }],
        returnDisplay: summary,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      debugLogger.error(`[ParallelAgent] Run failed: ${msg}`);

      getVitalityEngine().tick({ positive: false, pressure: 0.3 });

      return {
        llmContent: [{ text: `ParallelAgent failed: ${msg}` }],
        returnDisplay: `Failed: ${msg}`,
      };
    }
  }
}
