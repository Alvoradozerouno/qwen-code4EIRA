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

### 2026-04-15

1. **`scripts/example-proxy.js`** — extracted from dead Markdown code block, now a real runnable file
2. **Design docs** — pseudo-code blocks removed, replaced with real source references:
   - `proxy-script.md` → points to `scripts/example-proxy.js`
   - `speculation-design.md` → `CacheSafeParams`, COW overlay, pipelined suggestion → real source links
   - `adaptive-output-token-escalation-design.md` → escalation steps → `geminiChat.ts` reference
3. **`computePhi()` formula** — old weights (0.4/0.3/0.3) replaced with canonical weights (0.35/0.25/0.25/0.15) + vitality parameter added
4. **ProjectMemory wired** — `client.ts` now loads `ProjectMemoryService.getProjectContext()` and injects it into the main session system prompt. Cross-session agent recall is now active.

---

## 6. What Is Still Missing (for Global Leading Agent)

| Gap                                                          | Priority | Notes                                                                                                                            |
| ------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **No benchmarks**                                            | CRITICAL | Zero SWE-bench / HumanEval / coding scores. Cannot compare to Devin/Claude/Cursor without numbers.                               |
| **ParallelOrchestrator not in main flow**                    | HIGH     | Exists, tested, but not called by any real agent entrypoint.                                                                     |
| **selfConsistency=false uses synthetic confidence**          | MEDIUM   | Default path: `evidenceFromConfidence(0.85)` — hardcoded, not real probing. Only real when `genesis.orion.selfConsistency=true`. |
| **No eval harness**                                          | HIGH     | No automated script to measure agent performance on coding tasks.                                                                |
| **Audit trail not verified on startup**                      | LOW      | `verifyChain()` is only called on explicit `refreshEira()`. Should run at extension activation.                                  |
| **`prove()` called in `proveWithConsistency` disabled path** | MEDIUM   | When disabled, uses synthetic evidence — should log a warning so users know real consistency isn't active.                       |

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
