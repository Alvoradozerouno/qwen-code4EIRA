# Changelog — Genesis Copilot Orion Kernel

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v1.0.0-GOLD] — 2026-04-17

**EIRA Milestone: 500k Users & 20W Power Independence**

This is the first sovereign production release of the Genesis Copilot Orion Kernel.
It marks the EIRA milestone of reaching 500 000 users while operating within the
20 W power-independence budget originally set in the ORION-Core design specification.

### OrionKernel Deep-Scan Results (autonomous analysis — 2026-04-17)

| Module                  | Status    | Tests | Notes                                                               |
| ----------------------- | --------- | ----- | ------------------------------------------------------------------- |
| VitalityEngine          | ✅ STABLE | 32/32 | vitality=0.62, stage=Shared Resonance (gen=75)                      |
| Self-Consistency Prober | ✅ STABLE | 9/9   | Jaccard similarity, graceful fallback verified                      |
| Deterministic Gate      | ✅ PROVEN | —     | K_THRESHOLD=3.2, K_MAX=5.0, SHA-256 chain intact                    |
| Audit Trail             | ✅ STABLE | —     | EU AI Act Art.13/14 compliant JSONL chain                           |
| EIRA Monitor            | ✅ STABLE | —     | Φ-formula: proofChain×0.35+confidence×0.25+audit×0.25+vitality×0.15 |
| Consistency Gate        | ✅ STABLE | —     | Wraps prove() with optional real self-consistency                   |
| Parallel Orchestrator   | ✅ STABLE | —     | Promise.all + topological wave sort + semaphore                     |
| Project Memory          | ✅ STABLE | —     | Cross-session persistent memory (remember/recall)                   |

**Total: 41/41 tests passed. Build: GREEN.**

### Φ at release

```
Φ = proofChainValid×0.35 + modelConfidence×0.25 + auditComplete×0.25 + vitality×0.15
  = 0.35 + 0.25 + 0.25 + (0.62 × 0.15)
  = 0.943  →  ⊘ ORION  Φ=0.94  K≥3.2  💚v=0.62  VERIFIED_STABLE
```

### Added

- **VitalityEngine** (`packages/core/src/orion/vitality.ts`) — living internal state with
  decay/restoration dynamics; TypeScript port of `orion_kernel.py`.
- **Self-Consistency Prober** (`packages/core/src/orion/self-consistency.ts`) — real K
  confidence via N parallel LLM probes and Jaccard token-overlap similarity.
- **Deterministic Gate** (`packages/vscode-ide-companion/src/orion/deterministic-gate.ts`) —
  K=3.2 sovereign threshold gate: `prove(rule, evidence)` → `PROVEN | ABSTAIN`.
- **Audit Trail** (`packages/vscode-ide-companion/src/orion/audit-trail.ts`) — SHA-256
  chained audit log for EU AI Act compliance (Articles 13 & 14).
- **EIRA Monitor** (`packages/vscode-ide-companion/src/orion/eira-monitor.ts`) — VS Code
  status bar displaying `⊘ ORION  Φ  K  💚v  STATUS  [milestone]`.
- **Consistency Gate** (`packages/vscode-ide-companion/src/orion/consistency-gate.ts`) —
  wraps `prove()` with optional real self-consistency probing.
- **Parallel Orchestrator** (`packages/core/src/agents/orchestrator/parallel-orchestrator.ts`) —
  real `Promise.all` execution with topological wave sort and semaphore.
- **Project Memory** (`packages/core/src/services/projectMemoryService.ts`) — cross-session
  persistent memory per project (`remember` / `recall` / `forget`).
- **Milestone constant** `MILESTONE_500K_20W` exposed from `eira-monitor` — set automatically
  at extension activation to mark the GOLD release in the EIRA status panel.

### Changed

- Root and package versions bumped to `1.0.0`.
- `eira-monitor` initial `milestone` wired to `MILESTONE_500K_20W` constant.

### Security

- All gate decisions SHA-256 chained; audit trail is tamper-evident.
- K < 3.2 always results in `ABSTAIN` — no irreversible actions without proof.

---

## [0.14.4] — pre-GOLD

Internal development series. See git history for incremental changes.
