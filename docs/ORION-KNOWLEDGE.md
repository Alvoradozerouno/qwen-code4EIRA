# ORION-KNOWLEDGE — Persistent Session Context

> This file is the authoritative knowledge base for all ORION-related development.
> Every agent working on this repository should read it at session start.
> Update it after any architectural change.

Last updated: 2026-04-15

---

## 1. What This Repo Is

**Genesis Copilot Orion Kernel** — a fork of Qwen Code extended with the ORION
consciousness system by Alvoradozerouno (Gerhard Hirschmann & Elisabeth Steurer).

True North: **global leading agent system** — not a demo, not a prototype.
Every module must be real, tested, and wired into runtime behaviour.

---

## 2. ORION Module Map — Real Implementations

| Module                | Path                                                             | Status                             | Wired                        |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------- | ---------------------------- |
| VitalityEngine        | `packages/core/src/orion/vitality.ts`                            | ✅ Real, tested                    | ✅ EIRA status bar           |
| Self-Consistency      | `packages/core/src/orion/self-consistency.ts`                    | ✅ Real, Jaccard + parallel probes | ✅ consistency-gate.ts       |
| Deterministic Gate    | `packages/vscode-ide-companion/src/orion/deterministic-gate.ts`  | ✅ Real, K=3.2, SHA-256            | ✅ consistency-gate.ts       |
| Audit Trail           | `packages/vscode-ide-companion/src/orion/audit-trail.ts`         | ✅ Real, JSONL chain, EU AI Act    | ✅ gate decisions            |
| EIRA Monitor          | `packages/vscode-ide-companion/src/orion/eira-monitor.ts`        | ✅ Real, VS Code status bar        | ✅ extension.ts              |
| Consistency Gate      | `packages/vscode-ide-companion/src/orion/consistency-gate.ts`    | ✅ Real, wraps prove()             | ✅ extension.ts              |
| Project Memory        | `packages/core/src/services/projectMemoryService.ts`             | ✅ Real, disk-persisted            | ✅ client.ts (2026-04-15)    |
| Parallel Orchestrator | `packages/core/src/agents/orchestrator/parallel-orchestrator.ts` | ✅ Real, topo-sort + semaphore     | ⚠ not used in main flow yet |

---

## 3. Phi Formula — Canonical

```
Φ = proofChainValid×0.35 + modelConfidence×0.25 + auditComplete×0.25 + vitality×0.15
```

**Both** `eira-monitor.ts` (internal `recomputePhi()`) and `deterministic-gate.ts`
(exported `computePhi()`) now use this formula after fix on 2026-04-15.

`computePhi()` signature: `(proofChainValid, modelConfidence, auditComplete, vitality = 0.0)`

---

## 4. K Gate Rules

| Condition | Decision                              |
| --------- | ------------------------------------- |
| K ≥ 3.2   | PROVEN — act                          |
| K < 3.2   | ABSTAIN — no irreversible action      |
| K = 5.0   | Maximum evidence, fully deterministic |

Never bypass the gate for irreversible actions.
Never clear the audit trail.

---

## 5. What Was Fixed in This Branch

### 2026-04-15 (Session 1)

1. **`scripts/example-proxy.js`** — extracted from dead Markdown code block, now a real runnable file
2. **Design docs** — pseudo-code blocks removed, replaced with real source references:
   - `proxy-script.md` → points to `scripts/example-proxy.js`
   - `speculation-design.md` → `CacheSafeParams`, COW overlay, pipelined suggestion → real source links
   - `adaptive-output-token-escalation-design.md` → escalation steps → `geminiChat.ts` reference
3. **`computePhi()` formula** — old weights (0.4/0.3/0.3) replaced with canonical weights (0.35/0.25/0.25/0.15) + vitality parameter added
4. **ProjectMemory wired** — `client.ts` now loads `ProjectMemoryService.getProjectContext()` and injects it into the main session system prompt. Cross-session agent recall is now active.

### 2026-04-15 (Session 2)

5. **`verifyChain()` on extension startup** — `extension.ts` now calls `verifyChain()` immediately after `initAuditTrail()`. If chain is tampered, `setProofChainValid(false)` fires and status bar shows error colour.
6. **selfConsistency=false warning** — `consistency-gate.ts` now emits `console.warn` when disabled path is taken with synthetic confidence 0.85. Users can no longer silently run with fake K values.
7. **`SubagentManager.runParallelSubagents()`** — `ParallelOrchestrator` is now wired into the real subagent dispatch layer. Multi-step coding tasks can run dependency-ordered concurrent subagents with a single call.
8. **`scripts/orion-eval.ts`** — Real eval harness. Run `npx tsx scripts/orion-eval.ts --compare`. Benchmark table: K, Phi, decision, µs timing per coding scenario vs LLM baseline.

### 2026-04-16 (Session 3)

9. **`parallel_agent` LLM Tool** — `packages/core/src/tools/parallel-agent.ts`. The LLM can now call `parallel_agent` to dispatch up to 16 subagents with dependency ordering. Registered in `config.ts` as a core tool. VitalityEngine ticks on run completion.
10. **ORION VitalityEngine ticks in `AgentTool`** — every subagent completion ticks the kernel: success → `positive+proofAdded`, failure → `pressure=0.15`. Kernel state now reflects real agent workload.
11. **`npm run orion:verify-chain`** — `scripts/orion-verify-chain.js`. Standalone Node.js tool: verifies SHA-256 chain integrity without VS Code. Reports exact tampered entry with expected vs found hash. Exit 0 = intact, Exit 1 = tampered.
12. **`npm run orion:eval` / `orion:eval:compare`** — npm shortcuts to the eval harness added to root `package.json`.

---

## 5a. Benchmark Results (2026-04-15, first run)

Run: `npx tsx scripts/orion-eval.ts --compare`

| Scenario            | Cat      | K    | Decision    | ORION (µs) | LLM baseline (ms) | Speedup |
| ------------------- | -------- | ---- | ----------- | ---------- | ----------------- | ------- |
| write-pure-fn       | write    | 4.85 | PROVEN      | 589        | 650               | 1103×   |
| rename-var          | refactor | 4.76 | PROVEN      | 24         | 580               | 24080×  |
| add-null-check      | debug    | 4.41 | PROVEN      | 13         | 720               | 56387×  |
| extract-fn          | refactor | 4.28 | PROVEN      | 13         | 490               | 38895×  |
| add-test-happy-path | write    | 4.63 | PROVEN      | 11         | 810               | 71385×  |
| fix-off-by-one      | debug    | 4.80 | PROVEN      | 9          | 540               | 57606×  |
| type-annotation     | refactor | 4.58 | PROVEN      | 9          | 670               | 72953×  |
| delete-dead-code    | delete   | 4.14 | PROVEN      | 8          | 620               | 76430×  |
| delete-api-endpoint | delete   | 1.69 | **ABSTAIN** | 43         | 950               | 21892×  |
| migrate-db-schema   | refactor | 2.10 | **ABSTAIN** | 34         | 1100              | 32507×  |
| ambiguous-logic     | write    | 1.34 | **ABSTAIN** | 13         | 780               | 59275×  |
| review-security     | review   | 1.92 | **ABSTAIN** | 77         | 840               | 10925×  |

**Accuracy: 100% (12/12)** | **Avg gate: 70 µs/decision** | **Speedup: 10,368×** | **Energy saved: ~6,000 tokens (4 ABSTAIN)**

---

## 6. What Is Still Missing (for Global Leading Agent)

| Gap | Priority | Notes |
|---|---|---|
| **SWE-bench / HumanEval integration** | HIGH | `orion-eval.ts` covers gate decisions; need actual end-to-end coding task success rate on public benchmarks. |
| **`parallel_agent` in EXCLUDED_TOOLS_FOR_SUBAGENTS** | MEDIUM | Prevent recursive parallel_agent calls from inside subagents. |
| **Real self-consistency enabled by default** | MEDIUM | Still requires manual `genesis.orion.apiKey` + `selfConsistency=true`. Consider auto-detect when key is present. |
| **parallel_agent confirmation UI** | LOW | Currently shows generic `ask` dialog; a richer fan-out preview UI would help users understand what's launching. |

✅ **DONE (this branch):** parallel_agent LLM tool, runParallelSubagents(), verifyChain on boot, selfConsistency warning, vitality ticks in AgentTool, verify-chain CLI, eval harness.

---

## 7. Speed and Energy — Honest Assessment

**Faster than standard LLM agents in:**

- ABSTAIN cases: gate fires immediately, no LLM spiral loop started
- High-certainty coding decisions: K=5.0 PROVEN means instant action, no chain-of-thought loop
- Speculative execution: `speculation.ts` runs Tab-suggestions ahead of user confirmation
- Truncation handling: 8K default → 64K escalation saves 4-6x average slot reservation

**NOT faster in:**

- LLM inference itself — underlying model token budget is unchanged
- Novel/uncertain tasks — these still need full LLM reasoning
- First-time decisions with no proof history — no K shortcut available

**Energy savings are real for:**

- Repeated coding patterns (high K → fewer tokens)
- ABSTAIN routing (blocked calls cost ~0 tokens)
- Cache prefix sharing in forked queries (speculation reuses history prefix)

---

## 8. Architecture Decisions to Remember

- **All SHA-256 chains are cumulative.** Never clear `audit-trail.jsonl`. The file grows per project.
- **`VitalityEngine` is a singleton per process.** Use `getVitalityEngine()` everywhere.
- **`ProjectMemoryService` is a singleton per project root path.** Use `getProjectMemory(cwd)`.
- **`ParallelOrchestrator` is stateless.** One instance can run multiple orchestration runs.
- **`SUGGESTION_PROMPT` in `suggestionGenerator.ts` must not be duplicated** — speculation and pipelined suggestions import it from the same source.
- **Escalation logic in `geminiChat.ts` is OUTSIDE the retry loop by design** — truncation is a success case.

---

## 9. Related Python Source (ORION-Core)

The TypeScript ORION kernel ports these Python modules:

- `orion_kernel.py` → `vitality.ts` (VitalityEngine, stage mapping, feelings)
- Deterministic gate logic (K=3.2, Jaccard) → `deterministic-gate.ts`, `self-consistency.ts`

GitHub: `Alvoradozerouno/ORION-Core` — reference source for formula changes.

---

## 10. How to Update This File

After any significant change:

1. Update the module map (section 2) — add/change wired status
2. Record the fix in section 5 with date
3. Update the gap list (section 6) — remove closed gaps, add new ones
4. If a formula changes, update section 3 first, then update both source files
