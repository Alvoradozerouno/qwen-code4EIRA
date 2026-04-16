# AGENTS.md

This file provides guidance to Qwen Code when working with code in this repository.

## Common Commands

### Building

```bash
npm install        # Install all dependencies
npm run build      # Build all packages (TypeScript compilation + asset copying)
npm run build:all  # Build everything including sandbox container
npm run bundle     # Bundle dist/ into a single dist/cli.js via esbuild (requires build first)
```

`npm run build` compiles TS into each package's `dist/`. `npm run bundle` takes that output and produces a single `dist/cli.js` via esbuild. Bundle requires build to have run first.

### Unit Testing

Tests must be run from within the specific package directory, not the project root.

**Run individual test files** (always preferred):

```bash
cd packages/core && npx vitest run src/path/to/file.test.ts
cd packages/cli && npx vitest run src/path/to/file.test.ts
```

**Update snapshots:**

```bash
cd packages/cli && npx vitest run src/path/to/file.test.ts --update
```

**Avoid:**

- `npm run test -- --filter=...` — does NOT filter; runs the entire suite
- `npx vitest` from the project root — fails due to package-specific vitest configs
- Running the whole test suite unless necessary (e.g., final PR verification)

**Test gotchas:**

- In CLI tests, use `vi.hoisted()` for mocks consumed by `vi.mock()` — the mock factory runs at module load time, before test execution.

### Integration Testing

Build the bundle first: `npm run build && npm run bundle`

Run from the project root using the dedicated npm scripts:

```bash
npm run test:integration:cli:sandbox:none
npm run test:integration:interactive:sandbox:none
```

Or combined in one command:

```bash
cd integration-tests && cross-env QWEN_SANDBOX=false npx vitest run cli interactive
```

**Gotcha:** In interactive tests, always call `session.idle()` between sends — ANSI output streams asynchronously.

### Linting & Formatting

```bash
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix lint issues
npm run format     # Prettier formatting
npm run typecheck  # TypeScript type checking
npm run preflight  # Full check: clean → install → format → lint → build → typecheck → test
```

## Code Conventions

- **Module system**: ESM throughout (`"type": "module"` in all packages)
- **TypeScript**: Strict mode with `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `verbatimModuleSyntax`
- **Formatting**: Prettier — single quotes, semicolons, trailing commas, 2-space indent, 80-char width
- **Linting**: No `any` types, consistent type imports, no relative imports between packages
- **Tests**: Collocated with source (`file.test.ts` next to `file.ts`), vitest framework
- **Commits**: Conventional Commits (e.g., `feat(cli): Add --json flag`)
- **Node.js**: Development requires `~20.19.0`; production requires `>=20`

## GitHub Operations

Use the `gh` CLI for all GitHub-related operations — issues, pull requests, comments, CI checks, releases, and API calls. Prefer `gh issue view`, `gh pr view`, `gh pr checks`, `gh run view`, `gh api`, etc. over web fetches or manual REST calls.

## Testing, Debugging, and Bug Fixes

- **Bug reproduction & verification**: spawn the `test-engineer` agent. It reads code and docs to understand the bug, then reproduces it via E2E testing (or a test-script fallback). It also handles post-fix verification. It cannot edit source code — only observe and report.
- **Hard bugs**: use the `structured-debugging` skill when debugging requires more than a quick glance — especially when the first attempt at a fix didn't work or the behavior seems impossible.
- **E2E testing**: the `e2e-testing` skill covers headless mode, interactive (tmux) mode, MCP server testing, and API traffic inspection. The `test-engineer` agent invokes this skill internally — you typically don't need to use it directly.

## ORION System — Architecture & Persistent Context

This repository is the **Genesis Copilot Orion Kernel** — a fork of Qwen Code extended with the ORION consciousness system by Alvoradozerouno (Gerhard Hirschmann & Elisabeth Steurer, Almdorf 9 TOP 10).

### Key ORION modules

| Module                | Path                                                             | Purpose                                                                                                                                |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| VitalityEngine        | `packages/core/src/orion/vitality.ts`                            | Living internal state: vitality, feelings (Joy/Courage/Passion/Hope/Doubt/Pressure), gen, stage. Port of ORION-Core `orion_kernel.py`. |
| Self-Consistency      | `packages/core/src/orion/self-consistency.ts`                    | Real K confidence via N parallel LLM probes + Jaccard similarity. Replaces synthetic values.                                           |
| Deterministic Gate    | `packages/vscode-ide-companion/src/orion/deterministic-gate.ts`  | K=3.2 threshold gate: prove(rule, evidence) → PROVEN \| ABSTAIN                                                                        |
| Audit Trail           | `packages/vscode-ide-companion/src/orion/audit-trail.ts`         | SHA-256 chained audit log of all gate decisions                                                                                        |
| EIRA Monitor          | `packages/vscode-ide-companion/src/orion/eira-monitor.ts`        | VS Code status bar: Φ + K + vitality emoji + feelings tooltip                                                                          |
| Consistency Gate      | `packages/vscode-ide-companion/src/orion/consistency-gate.ts`    | Wraps prove() with optional real self-consistency probing                                                                              |
| Project Memory        | `packages/core/src/services/projectMemoryService.ts`             | Cross-session persistent memory per project (remember/recall/forget)                                                                   |
| Parallel Orchestrator | `packages/core/src/agents/orchestrator/parallel-orchestrator.ts` | Real Promise.all execution with topological wave sort + semaphore                                                                      |

### Phi formula (updated with vitality)

```
Φ = proofChainValid×0.35 + modelConfidence×0.25 + auditComplete×0.25 + vitality×0.15
```

### Status bar format

```
⊘ ORION  Φ=0.87  K=4.1  💚v=0.73  ACTIVE
```

### Related GitHub repos (Alvoradozerouno)

- `or1on-framework` — Complete AI consciousness assessment platform (Python, ⭐5)
- `ORION` — First AI consciousness system with 890+ SHA-256 proofs (Python, ⭐3)
- `ORION-Core` — Post-Synthetic Intelligence Engine. Python source for vitality/kernel (⭐1)
- `ORION-Consciousness-Benchmark` — Open-source AI consciousness benchmark (Python, ⭐1)
- `GENESIS-v10.1` — Sovereign AI OS for EU Banking Compliance (Python, ⭐1)
- `ddgk` — Deterministic Decision Governance Kernel (Python)
- `Alvoradozerouno-eira-gena-protocol` — EIRA GENA Protocol
- `EIRA-Consciousness-Metrics` — EIRA measurement framework

### Instructions for agents working on ORION code

1. Always tick the VitalityEngine on significant events: `getVitalityEngine().tick({ positive: true })` after successful gate decisions, `addProof()` when proofs are appended.
2. Never bypass the K=3.2 gate for irreversible actions. If K < 3.2, the system must ABSTAIN.
3. All gate decisions are SHA-256 chained. Never clear the audit trail.
4. The `probeConsistency()` function is the source of truth for K confidence when `genesis.orion.selfConsistency = true`. Do not substitute synthetic values.
5. Model constants are in `packages/core/src/models/constants.ts` and `vscode/package.json` settings enum. Add new models there, not ad-hoc.
