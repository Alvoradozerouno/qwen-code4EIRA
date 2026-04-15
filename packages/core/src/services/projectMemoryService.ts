/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Memory Service
 *
 * Persistent, cross-session memory for the ORION agent.
 * Stores structured facts, summaries, and preferences per project.
 *
 * Storage layout:
 *   ~/.qwen/memory/<project-hash>.json   ← main memory file
 *
 * Capabilities:
 *   - remember(key, value, ttlDays?)   → store a fact
 *   - recall(key)                      → retrieve a fact
 *   - forget(key)                      → remove a fact
 *   - summariseSession(summary)        → append a session summary
 *   - getRecentSummaries(n)            → last N session summaries
 *   - getProjectContext()              → full context snapshot for prompts
 *   - flush()                          → sync to disk immediately
 *
 * The memory file is a flat JSON structure (not JSONL) for easy inspection
 * and hand-editing by the user.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  value: unknown;
  /** ISO 8601 timestamp when stored */
  storedAt: string;
  /** Optional expiry timestamp — entry is ignored after this date */
  expiresAt?: string;
  /** How many times this fact has been accessed */
  accessCount: number;
}

export interface SessionSummary {
  /** ISO 8601 timestamp */
  at: string;
  /** Brief human-readable summary of what happened in the session */
  summary: string;
  /** Number of tool calls made */
  toolCalls?: number;
  /** Key decisions or outcomes */
  outcomes?: string[];
}

export interface ProjectMemory {
  /** Stable hash of the project root path */
  projectHash: string;
  /** Absolute path at time of first write (informational) */
  projectPath: string;
  /** ISO 8601 timestamp of first write */
  createdAt: string;
  /** ISO 8601 timestamp of last write */
  updatedAt: string;
  /** Structured key–value facts */
  facts: Record<string, MemoryEntry>;
  /** Ordered list of session summaries (newest last) */
  sessions: SessionSummary[];
  /** User preferences (e.g. preferred language, style) */
  preferences: Record<string, string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function projectHash(projectRoot: string): string {
  return crypto
    .createHash('sha256')
    .update(path.resolve(projectRoot))
    .digest('hex')
    .slice(0, 16);
}

function memoryDir(): string {
  return path.join(os.homedir(), '.qwen', 'memory');
}

function memoryFilePath(hash: string): string {
  return path.join(memoryDir(), `${hash}.json`);
}

function now(): string {
  return new Date().toISOString();
}

// ── ProjectMemoryService ───────────────────────────────────────────────────

/**
 * Manages persistent cross-session memory for a single project.
 *
 * Instantiate once per project root and reuse. Call flush() or rely on
 * auto-flush (triggered on writes) to persist changes.
 */
export class ProjectMemoryService {
  private memory: ProjectMemory;
  private readonly filePath: string;
  private dirty = false;

  constructor(private readonly projectRoot: string) {
    const hash = projectHash(projectRoot);
    this.filePath = memoryFilePath(hash);
    this.memory = this.load(hash);
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private load(hash: string): ProjectMemory {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw) as ProjectMemory;
      } catch {
        // Corrupt file — start fresh but keep backup
        const backup = this.filePath + '.bak';
        try {
          fs.copyFileSync(this.filePath, backup);
        } catch {
          // ignore backup failure
        }
      }
    }

    // New project — create empty structure
    return {
      projectHash: hash,
      projectPath: this.projectRoot,
      createdAt: now(),
      updatedAt: now(),
      facts: {},
      sessions: [],
      preferences: {},
    };
  }

  private save(): void {
    try {
      const dir = memoryDir();
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.memory.updatedAt = now();
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.memory, null, 2),
        'utf-8',
      );
      this.dirty = false;
    } catch {
      // Memory writes must never crash the agent
    }
  }

  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.expiresAt) {
      return false;
    }
    return new Date(entry.expiresAt) < new Date();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Store a fact in project memory.
   *
   * @param key     - Unique key (e.g. 'preferred-language', 'db-schema-location')
   * @param value   - Any JSON-serialisable value
   * @param ttlDays - Optional time-to-live in days. Omit for permanent storage.
   */
  remember(key: string, value: unknown, ttlDays?: number): void {
    const entry: MemoryEntry = {
      value,
      storedAt: now(),
      accessCount: 0,
    };
    if (ttlDays !== undefined && ttlDays > 0) {
      const expires = new Date();
      expires.setDate(expires.getDate() + ttlDays);
      entry.expiresAt = expires.toISOString();
    }
    this.memory.facts[key] = entry;
    this.dirty = true;
    this.save();
  }

  /**
   * Retrieve a stored fact. Returns undefined if not found or expired.
   */
  recall(key: string): unknown {
    const entry = this.memory.facts[key];
    if (!entry) {
      return undefined;
    }
    if (this.isExpired(entry)) {
      delete this.memory.facts[key];
      this.dirty = true;
      this.save();
      return undefined;
    }
    entry.accessCount += 1;
    this.dirty = true;
    return entry.value;
  }

  /**
   * Remove a stored fact.
   */
  forget(key: string): void {
    if (key in this.memory.facts) {
      delete this.memory.facts[key];
      this.dirty = true;
      this.save();
    }
  }

  /**
   * List all current (non-expired) fact keys.
   */
  listFacts(): string[] {
    const now_ = new Date();
    return Object.entries(this.memory.facts)
      .filter(
        ([, entry]) => !entry.expiresAt || new Date(entry.expiresAt) > now_,
      )
      .map(([key]) => key);
  }

  /**
   * Store/update a user preference (always permanent).
   */
  setPreference(key: string, value: string): void {
    this.memory.preferences[key] = value;
    this.dirty = true;
    this.save();
  }

  /**
   * Retrieve a user preference.
   */
  getPreference(key: string): string | undefined {
    return this.memory.preferences[key];
  }

  /**
   * Append a session summary at the end of this session.
   * Keeps the last 50 summaries to avoid unbounded growth.
   */
  summariseSession(
    summary: string,
    opts: { toolCalls?: number; outcomes?: string[] } = {},
  ): void {
    this.memory.sessions.push({
      at: now(),
      summary,
      toolCalls: opts.toolCalls,
      outcomes: opts.outcomes,
    });
    // Keep the last 50 sessions
    if (this.memory.sessions.length > 50) {
      this.memory.sessions = this.memory.sessions.slice(-50);
    }
    this.dirty = true;
    this.save();
  }

  /**
   * Return the last N session summaries, most-recent first.
   */
  getRecentSummaries(n = 5): SessionSummary[] {
    return [...this.memory.sessions].reverse().slice(0, n);
  }

  /**
   * Build a compact context string suitable for injection into system prompts.
   * Includes recent summaries and all current facts.
   */
  getProjectContext(
    opts: { maxSummaries?: number; maxFacts?: number } = {},
  ): string {
    const maxSummaries = opts.maxSummaries ?? 3;
    const maxFacts = opts.maxFacts ?? 20;

    const lines: string[] = [
      '## ORION Project Memory',
      `Project: ${this.projectRoot}`,
      `Last updated: ${this.memory.updatedAt}`,
    ];

    // Recent sessions
    const summaries = this.getRecentSummaries(maxSummaries);
    if (summaries.length > 0) {
      lines.push('', '### Recent Sessions');
      for (const s of summaries) {
        lines.push(`- [${s.at.slice(0, 10)}] ${s.summary}`);
        if (s.outcomes && s.outcomes.length > 0) {
          for (const o of s.outcomes) {
            lines.push(`  → ${o}`);
          }
        }
      }
    }

    // Facts
    const factKeys = this.listFacts().slice(0, maxFacts);
    if (factKeys.length > 0) {
      lines.push('', '### Stored Facts');
      for (const key of factKeys) {
        const entry = this.memory.facts[key];
        const val =
          typeof entry.value === 'string'
            ? entry.value
            : JSON.stringify(entry.value);
        lines.push(`- **${key}**: ${val}`);
      }
    }

    // Preferences
    const prefKeys = Object.keys(this.memory.preferences);
    if (prefKeys.length > 0) {
      lines.push('', '### Preferences');
      for (const key of prefKeys) {
        lines.push(`- ${key}: ${this.memory.preferences[key]}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Force a disk write if there are pending changes.
   */
  flush(): void {
    if (this.dirty) {
      this.save();
    }
  }

  /**
   * Return a read-only snapshot of the full memory structure.
   */
  snapshot(): Readonly<ProjectMemory> {
    return { ...this.memory };
  }
}

// ── Module-level singleton registry ────────────────────────────────────────
// Reuse instances within the same process to avoid redundant file reads.

const registry = new Map<string, ProjectMemoryService>();

/**
 * Get (or create) a ProjectMemoryService for the given project root.
 * Safe to call multiple times — always returns the same instance.
 */
export function getProjectMemory(projectRoot: string): ProjectMemoryService {
  const resolved = path.resolve(projectRoot);
  let svc = registry.get(resolved);
  if (!svc) {
    svc = new ProjectMemoryService(resolved);
    registry.set(resolved, svc);
  }
  return svc;
}
