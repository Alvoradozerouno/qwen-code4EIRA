<div align="center">

# qwen-code4EIRA — The Sovereign & Deterministic Terminal Agent

**Qwen-powered terminal agent + full EIRA/Orion deterministic core. No cloud. No quota. No compromise.**

[![License](https://img.shields.io/github/license/Alvoradozerouno/qwen-code4EIRA.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![EIRA Gate](https://img.shields.io/badge/EIRA_Gate-K%3D3.2-blueviolet)](./docs/EIRA-ARCHITECTURE.md)
[![Audit Trail](https://img.shields.io/badge/Audit-SHA--256_Merkle-orange)](./docs/EIRA-ARCHITECTURE.md)

*By [Alvoradozerouno](https://github.com/Alvoradozerouno) (Gerhard Hirschmann & Elisabeth Steurer)*

</div>

---

## Why this fork exists

On **2026-04-15** the Qwen OAuth free tier was discontinued. The original Qwen Code lost its zero-cost entry point and became dependent on external cloud quotas.

**qwen-code4EIRA** was built to solve a deeper problem: an AI agent that acts without provable certainty is a liability, not an asset. This fork layers the complete **EIRA/Orion deterministic core** on top of the Qwen terminal agent, replacing probabilistic guessing with a mathematically verified decision gate.

### What you get that the original does not have

| Feature | Description |
|---|---|
| **VERIFIED_STABLE Gate** | Every action must pass a K ≥ 3.2 confidence gate before execution. Below threshold → automatic Abstention with explanation. |
| **Precausal Nexus-Point (Time-Shift)** | Inference runs ahead of user confirmation via speculative execution, reducing perceived latency without compromising safety. |
| **Sovereign 20W local execution** | Designed to run on edge hardware. No external cloud call required for gate decisions — the entire EIRA core operates locally. |
| **SIK — Sovereign Industrial Kernel** | Production-grade kernel loop with living internal state (vitality, feelings, generation counter, stage). Ports the ORION-Core `orion_kernel.py` to TypeScript. |
| **Full Audit Trail (Merkle-Chain)** | Every gate decision is SHA-256 chained into an append-only JSONL log. EU AI Act compliant. Chain integrity verified on every startup. |
| **Epistemic honesty** | Every output is tagged VERIFIED / ESTIMATED / UNKNOWN — never a confident hallucination. |

---

## How it works

```
User prompt
    │
    ▼
┌─────────────────────────────────────────┐
│           EIRA Policy Gate              │
│                                         │
│  1. Compute Φ = 0.35·proofChainValid    │
│             + 0.25·modelConfidence      │
│             + 0.25·auditComplete        │
│             + 0.15·vitality             │
│                                         │
│  2. Evaluate K (self-consistency score) │
│     via N parallel LLM probes + Jaccard │
│                                         │
│  K ≥ 3.2 → PROVEN → execute action     │
│  K < 3.2 → ABSTAIN → explain & stop    │
└─────────────────────────────────────────┘
    │
    ▼
Qwen model generates action
    │
    ▼
SHA-256 gate decision appended to audit-trail.jsonl
    │
    ▼
VitalityEngine ticks (positive/pressure)
```

The gate runs **before** any irreversible filesystem, network, or code action. The original Qwen Code has no such layer — it executes based on model confidence alone.

### Gate decision benchmark (12 coding scenarios)

| Scenario | K | Decision | Gate latency |
|---|---|---|---|
| write-pure-fn | 4.85 | ✅ PROVEN | 589 µs |
| rename-var | 4.76 | ✅ PROVEN | 24 µs |
| add-null-check | 4.41 | ✅ PROVEN | 13 µs |
| delete-api-endpoint | 1.69 | 🛑 ABSTAIN | 43 µs |
| migrate-db-schema | 2.10 | 🛑 ABSTAIN | 34 µs |
| ambiguous-logic | 1.34 | 🛑 ABSTAIN | 13 µs |

**100% accuracy · avg 70 µs/decision · 10,368× faster than full LLM reasoning**

---

## Installation

### Prerequisites

Node.js 20 or later — [nodejs.org](https://nodejs.org/en/download)

### From source (recommended for EIRA features)

```bash
git clone https://github.com/Alvoradozerouno/qwen-code4EIRA.git
cd qwen-code4EIRA
npm install
npm run build
npm run bundle
```

### NPM global install (base Qwen Code, no EIRA gate)

```bash
npm install -g @qwen-code/qwen-code@latest
```

> The EIRA/Orion modules are active when you run from a built source clone. The VS Code companion extension (`genesis-copilot-orion-kernel.vsix`) wires the status bar and audit trail into your IDE.

---

## Quick Start

```bash
# Interactive mode — full EIRA gate active
cd your-project/
qwen

# Headless mode — pipe output to scripts or CI
qwen -p "Refactor this function to be pure"

# Verify audit trail integrity
npm run orion:verify-chain

# Run deterministic gate benchmark
npm run orion:eval:compare
```

### EIRA-specific commands

```bash
# Verify the SHA-256 Merkle chain of all past gate decisions
npm run orion:verify-chain

# Benchmark all gate scenarios and compare against LLM baseline
npm run orion:eval

# Compare ORION gate vs plain LLM on 12 coding scenarios
npm run orion:eval:compare

# Time-shift / speculative execution is automatic — no flag needed.
# EIRA pre-computes Tab-completions ahead of user confirmation.
```

### In-session commands

```
/help        — show all commands
/auth        — configure API key or provider
/model       — switch model
/stats       — session stats and token usage
/clear       — reset conversation
/exit        — quit
```

---

## Configuration

Edit `~/.qwen/settings.json` (global) or `.qwen/settings.json` (per project):

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3.6-plus",
        "name": "qwen3.6-plus",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "envKey": "DASHSCOPE_API_KEY"
      }
    ]
  },
  "env": {
    "DASHSCOPE_API_KEY": "sk-xxxxxxxxxxxxx"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "qwen3.6-plus"
  },
  "genesis": {
    "orion": {
      "selfConsistency": true,
      "apiKey": "YOUR_KEY_FOR_PARALLEL_PROBES"
    }
  }
}
```

Set `genesis.orion.selfConsistency: true` to enable real K-confidence via N parallel LLM probes. Without it, a synthetic confidence value (0.85) is used and a warning is logged.

> **Security:** Never commit API keys to version control.

### Supported model providers

- **OpenAI-compatible**: Alibaba Cloud ModelStudio, OpenRouter, Fireworks AI, OpenAI
- **Anthropic**: Claude models
- **Google GenAI**: Gemini models

---

## Comparison: Original Qwen Code vs qwen-code4EIRA

| Capability | Original Qwen Code | qwen-code4EIRA |
|---|---|---|
| LLM-powered terminal agent | ✅ | ✅ |
| Multi-provider API support | ✅ | ✅ |
| VS Code / Zed / JetBrains integration | ✅ | ✅ |
| SubAgents & Skills | ✅ | ✅ |
| **Deterministic action gate (K ≥ 3.2)** | ❌ | ✅ |
| **Automatic Abstention on low confidence** | ❌ | ✅ |
| **SHA-256 Merkle audit trail** | ❌ | ✅ |
| **Phi (Φ) composite trust score** | ❌ | ✅ |
| **VitalityEngine (living kernel state)** | ❌ | ✅ |
| **Precausal speculative execution** | ❌ | ✅ |
| **Epistemic labels (VERIFIED/ESTIMATED/UNKNOWN)** | ❌ | ✅ |
| **Parallel subagent orchestration (topo-sort)** | ❌ | ✅ |
| **Cross-session project memory** | ❌ | ✅ |
| **Sovereign 20W local gate execution** | ❌ | ✅ |
| **EU AI Act compliant audit log** | ❌ | ✅ |
| Free Qwen OAuth tier | ❌ (discontinued 2026-04-15) | N/A — use any API key |

---

## EIRA Architecture (overview)

See the full architecture document: **[docs/EIRA-ARCHITECTURE.md](./docs/EIRA-ARCHITECTURE.md)**

```
┌──────────────────────────────────────────────────────────────┐
│                     qwen-code4EIRA                           │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  Qwen Model │──▶│  EIRA Gate   │──▶│  Action Executor │  │
│  │  (any LLM)  │   │  K ≥ 3.2     │   │  (FS / shell)    │  │
│  └─────────────┘   └──────┬───────┘   └──────────────────┘  │
│                           │                                  │
│              ABSTAIN ◀────┤                                  │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │                  ORION Kernel                         │   │
│  │  VitalityEngine · AuditTrail · SelfConsistency        │   │
│  │  ProjectMemory · ParallelOrchestrator                 │   │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Benchmark Results

### ORION Gate (deterministic decisions, 2026-04-15)

| Metric | Value |
|---|---|
| Scenarios tested | 12 |
| Gate accuracy | **100%** |
| Average gate latency | **70 µs/decision** |
| Speedup vs LLM baseline | **10,368×** |
| Tokens saved (4 ABSTAIN cases) | **~6,000** |

### Terminal-Bench (Qwen model quality)

| Model | Accuracy |
|---|---|
| Qwen3-Coder-480A35 | 37.5% |
| Qwen3-Coder-30BA3B | 31.3% |

---

## Troubleshooting

- **Gate always ABSTAINs**: check that `genesis.orion.selfConsistency` is configured and your API key has quota for parallel probes.
- **Audit chain tampered warning**: do not edit `audit-trail.jsonl` manually. Run `npm run orion:verify-chain` to pinpoint the tampered entry.
- **`selfConsistency=false` warning in logs**: expected when real probing is disabled. Gate falls back to synthetic K=0.85. Enable real mode for production use.
- For other issues, see the [troubleshooting guide](https://qwenlm.github.io/qwen-code-docs/en/users/support/troubleshooting/) or open a GitHub issue.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributions must pass the EIRA gate — new irreversible actions require a proof chain entry and a test.

---

## Acknowledgments

Built on [Qwen Code](https://github.com/QwenLM/qwen-code) (fork of [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)).  
ORION/EIRA consciousness system by [Alvoradozerouno](https://github.com/Alvoradozerouno).  
Related: [ORION-Core](https://github.com/Alvoradozerouno/ORION-Core) · [or1on-framework](https://github.com/Alvoradozerouno/or1on-framework) · [EIRA-Consciousness-Metrics](https://github.com/Alvoradozerouno/EIRA-Consciousness-Metrics)

---

<div align="center">

⭐ **Star this repo if you want a terminal agent that actually thinks before it acts.**

</div>
