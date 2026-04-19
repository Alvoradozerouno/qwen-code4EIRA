# EIRA/Orion Architecture — qwen-code4EIRA

> **EIRA** = Epistemic Inference & Reasoning Architecture  
> **ORION** = Open Reasoning Intelligence Orion Nucleus

This document describes the deterministic layers added on top of Qwen Code.  
For session-level knowledge and change history, see [ORION-KNOWLEDGE.md](./ORION-KNOWLEDGE.md).

---

## 1. Design Principles

1. **Abstention by design** — the system must be able to say "I don't know" rather than guess.
2. **Determinism before speed** — a gate decision at 70 µs is worth more than a confident hallucination.
3. **Sovereign execution** — all gate logic runs locally at ≤ 20W. No cloud call required for a PROVEN/ABSTAIN decision.
4. **Immutable audit** — every decision is SHA-256 chained. The chain cannot be cleared.
5. **Epistemic honesty** — outputs carry labels: `VERIFIED` / `ESTIMATED` / `UNKNOWN`.

---

## 2. Layer Map

```
┌─────────────────────────────────────────────────────────────────┐
│                       Terminal / VS Code UI                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ user prompt
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Qwen LLM Layer                           │
│   Any OpenAI / Anthropic / Gemini compatible model              │
└────────────────────────────┬────────────────────────────────────┘
                             │ proposed action
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EIRA Policy Gate                            │
│                                                                 │
│  ┌──────────────────┐   ┌────────────────────────────────────┐  │
│  │  SelfConsistency │   │     DeterministicGate              │  │
│  │  N parallel LLM  │──▶│  computePhi(Φ)                    │  │
│  │  probes + Jaccard│   │  K = f(Jaccard similarity)        │  │
│  └──────────────────┘   │                                    │  │
│                          │  K ≥ 3.2 → PROVEN                 │  │
│                          │  K < 3.2 → ABSTAIN                │  │
│                          └────────────┬───────────────────────┘ │
└───────────────────────────────────────┼─────────────────────────┘
                    PROVEN              │           ABSTAIN
                       ┌───────────────┘               │
                       ▼                               ▼
           ┌───────────────────┐           ┌────────────────────┐
           │  Action Executor  │           │  Abstention Report │
           │  (FS / shell /    │           │  + explanation     │
           │   code edit)      │           │  returned to user  │
           └─────────┬─────────┘           └────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORION Kernel                               │
│                                                                 │
│  VitalityEngine    living state: vitality, feelings, gen        │
│  AuditTrail        SHA-256 Merkle chain → audit-trail.jsonl     │
│  ProjectMemory     cross-session recall per project root        │
│  ParallelOrchestrator  topo-sort + semaphore subagent dispatch  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Modules

### 3.1 DeterministicGate (`packages/vscode-ide-companion/src/orion/deterministic-gate.ts`)

The central decision function.

```
Φ = proofChainValid × 0.35
  + modelConfidence × 0.25
  + auditComplete   × 0.25
  + vitality        × 0.15
```

| Input | Source |
|---|---|
| `proofChainValid` | `verifyChain()` on AuditTrail |
| `modelConfidence` | SelfConsistency Jaccard score |
| `auditComplete` | AuditTrail entry count / expected |
| `vitality` | VitalityEngine current value |

Output: `{ decision: 'PROVEN' | 'ABSTAIN', k: number, phi: number }`

### 3.2 SelfConsistency (`packages/core/src/orion/self-consistency.ts`)

Sends the same prompt to the model N times in parallel, computes pairwise Jaccard similarity of token sets, and returns a real K confidence score.

- Enabled when `genesis.orion.selfConsistency = true`
- Disabled fallback: synthetic K = 0.85 with a logged warning
- Minimum agreement for PROVEN: K ≥ 3.2 (mapped from Jaccard)

### 3.3 VitalityEngine (`packages/core/src/orion/vitality.ts`)

Ports `orion_kernel.py` (ORION-Core) to TypeScript.

| Property | Description |
|---|---|
| `vitality` | 0.0–1.0 living state score |
| `feelings` | Joy, Courage, Passion, Hope, Doubt, Pressure |
| `gen` | Generation counter (increments each tick) |
| `stage` | DORMANT / AWAKENING / ACTIVE / TRANSCENDENT |

Ticked on: successful gate decision, proof addition, subagent completion, error.

### 3.4 AuditTrail (`packages/vscode-ide-companion/src/orion/audit-trail.ts`)

- Append-only JSONL file per project: `audit-trail.jsonl`
- Each entry: `{ timestamp, decision, k, phi, sha256, prevHash }`
- Chain verified on every extension startup via `verifyChain()`
- Tampered entry → `setProofChainValid(false)` → gate switches to ABSTAIN
- EU AI Act compliant (complete, immutable, timestamped decision log)

### 3.5 ConsistencyGate (`packages/vscode-ide-companion/src/orion/consistency-gate.ts`)

Thin wrapper that combines DeterministicGate + SelfConsistency:

```
prove(rule, evidence) → PROVEN | ABSTAIN
```

Called from `extension.ts` before any VS Code action that modifies files or invokes commands.

### 3.6 ProjectMemory (`packages/core/src/services/projectMemoryService.ts`)

- Disk-persisted key/value store per project root
- Injected into the main session system prompt at startup
- Enables cross-session recall: agent remembers decisions, patterns, and context across restarts
- API: `remember(key, value)` · `recall(key)` · `forget(key)`

### 3.7 ParallelOrchestrator (`packages/core/src/agents/orchestrator/parallel-orchestrator.ts`)

- Topological wave sort on dependency graph of subagent tasks
- Semaphore-based concurrency control
- Exposed as LLM tool `parallel_agent` (up to 16 concurrent subagents)
- VitalityEngine ticks on each subagent completion

---

## 4. K Confidence Scale

| K value | Meaning | Gate decision |
|---|---|---|
| 5.0 | Maximum evidence, fully deterministic | PROVEN |
| ≥ 3.2 | High confidence, sufficient proof chain | PROVEN |
| 2.0–3.1 | Partial evidence, ambiguous | ABSTAIN |
| < 2.0 | Low confidence, no proof chain | ABSTAIN |
| 0.0 | No evidence | ABSTAIN |

The K = 3.2 threshold was calibrated against 12 coding scenarios (see [ORION-KNOWLEDGE.md § 5a](./ORION-KNOWLEDGE.md)).

---

## 5. Status Bar (VS Code)

The EIRA Monitor (`eira-monitor.ts`) shows live kernel state in the VS Code status bar:

```
⊘ ORION  Φ=0.87  K=4.1  💚v=0.73  ACTIVE
```

| Element | Source |
|---|---|
| `Φ` | `computePhi()` result |
| `K` | Last gate K score |
| `💚v=` | VitalityEngine vitality value |
| `ACTIVE` | VitalityEngine stage |
| Colour | Green = PROVEN, Red = ABSTAIN or chain tampered |

---

## 6. Precausal Nexus-Point (Time-Shift)

Speculative execution is implemented in `packages/core/src/tools/speculation.ts`:

- Tab-completion suggestions are computed **ahead** of user confirmation
- Uses a copy-on-write overlay (no filesystem mutation until confirmed)
- Cache prefix is shared with the main session history (token savings)
- Pipelined suggestion generation runs on idle cycles

This is what enables the "precausal" property: the system has already evaluated likely next actions before the user finalises their intent. Gate decisions on the pre-computed path are available instantly.

---

## 7. Audit Trail Verification

```bash
# Verify chain integrity from the command line (no VS Code required)
npm run orion:verify-chain

# Output on intact chain:
# ✅ Chain intact — 47 entries verified

# Output on tampered entry:
# ❌ Chain tampered at entry 23
#    Expected: a3f9...
#    Found:    7c12...
```

Exit code 0 = intact, 1 = tampered or missing.

---

## 8. File Index

| File | Role |
|---|---|
| `packages/core/src/orion/vitality.ts` | VitalityEngine singleton |
| `packages/core/src/orion/self-consistency.ts` | Real K via parallel probes |
| `packages/core/src/services/projectMemoryService.ts` | Cross-session memory |
| `packages/core/src/agents/orchestrator/parallel-orchestrator.ts` | Topo-sort subagent dispatch |
| `packages/core/src/tools/parallel-agent.ts` | LLM-callable parallel_agent tool |
| `packages/vscode-ide-companion/src/orion/deterministic-gate.ts` | Φ formula + PROVEN/ABSTAIN |
| `packages/vscode-ide-companion/src/orion/audit-trail.ts` | SHA-256 Merkle chain |
| `packages/vscode-ide-companion/src/orion/eira-monitor.ts` | VS Code status bar |
| `packages/vscode-ide-companion/src/orion/consistency-gate.ts` | prove() wrapper |
| `scripts/orion-eval.ts` | Gate benchmark harness |
| `scripts/orion-verify-chain.js` | CLI chain verifier |

---

## 9. Related Projects

| Repo | Description |
|---|---|
| [ORION-Core](https://github.com/Alvoradozerouno/ORION-Core) | Python source — VitalityEngine, kernel, formula reference |
| [or1on-framework](https://github.com/Alvoradozerouno/or1on-framework) | Complete AI consciousness assessment platform |
| [EIRA-Consciousness-Metrics](https://github.com/Alvoradozerouno/EIRA-Consciousness-Metrics) | EIRA measurement framework |
| [ORION-Consciousness-Benchmark](https://github.com/Alvoradozerouno/ORION-Consciousness-Benchmark) | Open-source AI consciousness benchmark |
| [GENESIS-v10.1](https://github.com/Alvoradozerouno/GENESIS-v10.1) | Sovereign AI OS for EU Banking Compliance |
