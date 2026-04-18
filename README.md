<div align="center">

[![npm version](https://img.shields.io/npm/v/@qwen-code/qwen-code.svg)](https://www.npmjs.com/package/@qwen-code/qwen-code)
[![License](https://img.shields.io/github/license/QwenLM/qwen-code.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/@qwen-code/qwen-code.svg)](https://www.npmjs.com/package/@qwen-code/qwen-code)

<a href="https://trendshift.io/repositories/15287" target="_blank"><img src="https://trendshift.io/api/badge/repositories/15287" alt="QwenLM%2Fqwen-code | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

**An open-source AI agent that lives in your terminal.**

<a href="https://qwenlm.github.io/qwen-code-docs/zh/users/overview">中文</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/de/users/overview">Deutsch</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/fr/users/overview">français</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ja/users/overview">日本語</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/ru/users/overview">Русский</a> |
<a href="https://qwenlm.github.io/qwen-code-docs/pt-BR/users/overview">Português (Brasil)</a>

</div>

## 🎉 News

- **2026-04-13**: Qwen OAuth free tier policy update: daily quota adjusted to 100 requests/day (from 1,000). The free tier will be discontinued on 2026-04-15. Consider using [OpenRouter](https://openrouter.ai), [Fireworks AI](https://app.fireworks.ai), or [Alibaba Cloud ModelStudio](https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=doc#/doc/?type=model&url=2840914_2&modelId=qwen3.6-plus) as alternatives.

- **2026-04-02**: Qwen3.6-Plus is now live! Sign in via Qwen OAuth to use it directly, or get an API key from [Alibaba Cloud ModelStudio](https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=doc#/doc/?type=model&url=2840914_2&modelId=qwen3.6-plus) to access it through the OpenAI-compatible API.

- **2026-02-16**: Qwen3.5-Plus is now live!

## Why Qwen Code?

Qwen Code is an open-source AI agent for the terminal, optimized for Qwen series models. It helps you understand large codebases, automate tedious work, and ship faster.

- **Multi-protocol, OAuth free tier**: use OpenAI / Anthropic / Gemini-compatible APIs, or sign in with Qwen OAuth for 100 free requests/day (free tier ending 2026-04-15). After that, switch to [OpenRouter](https://openrouter.ai), [Fireworks AI](https://app.fireworks.ai), or [Alibaba Cloud ModelStudio](https://modelstudio.console.alibabacloud.com/ap-southeast-1?tab=doc#/doc/?type=model&url=2840914_2&modelId=qwen3.6-plus).
- **Open-source, co-evolving**: both the framework and the Qwen3-Coder model are open-source—and they ship and evolve together.
- **Agentic workflow, feature-rich**: rich built-in tools (Skills, SubAgents) for a full agentic workflow and a Claude Code-like experience.
- **Terminal-first, IDE-friendly**: built for developers who live in the command line, with optional integration for VS Code, Zed, and JetBrains IDEs.

![](https://gw.alicdn.com/imgextra/i1/O1CN01D2DviS1wwtEtMwIzJ_!!6000000006373-2-tps-1600-900.png)

## Installation

### Quick Install (Recommended)

#### Linux / macOS

```bash
bash -c "$(curl -fsSL https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.sh)"
```

#### Windows (Run as Administrator CMD)

```cmd
curl -fsSL -o %TEMP%\install-qwen.bat https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.bat && %TEMP%\install-qwen.bat
```

> **Note**: It's recommended to restart your terminal after installation to ensure environment variables take effect.

### Manual Installation

#### Prerequisites

Make sure you have Node.js 20 or later installed. Download it from [nodejs.org](https://nodejs.org/en/download).

#### NPM

```bash
npm install -g @qwen-code/qwen-code@latest
```

#### Homebrew (macOS, Linux)

```bash
brew install qwen-code
```

## Quick Start

```bash
# Start Qwen Code (interactive)
qwen

# Then, in the session:
/help
/auth
```

On first use, you'll be prompted to sign in. You can run `/auth` anytime to switch authentication methods.

Example prompts:

```text
What does this project do?
Explain the codebase structure.
Help me refactor this function.
Generate unit tests for this module.
```

<details>
<summary>Click to watch a demo video</summary>

<video src="https://cloud.video.taobao.com/vod/HLfyppnCHplRV9Qhz2xSqeazHeRzYtG-EYJnHAqtzkQ.mp4" controls>
Your browser does not support the video tag.
</video>

</details>

## 🦞 Use Qwen Code for Coding Tasks in Claw

Copy the prompt below and paste it into your agent:

```
Use Qwen Code as a coding agent. First, fetch and read this skill reference:
https://raw.githubusercontent.com/QwenLM/qwen-code/refs/heads/main/.qwen/skills/qwen-code-claw/SKILL.md
Then follow the instructions inside to install, authenticate, and use Qwen Code via acpx for all coding tasks.
```

## Authentication

Qwen Code supports two authentication methods:

- **Qwen OAuth (recommended & free)**: sign in with your `qwen.ai` account in a browser.
- **API-KEY**: use an API key to connect to any supported provider (OpenAI, Anthropic, Google GenAI, Alibaba Cloud ModelStudio, and other compatible endpoints).

#### Qwen OAuth (recommended)

Start `qwen`, then run:

```bash
/auth
```

Choose **Qwen OAuth** and complete the browser flow. Your credentials are cached locally so you usually won't need to log in again.

> **Note:** In non-interactive or headless environments (e.g., CI, SSH, containers), you typically **cannot** complete the OAuth browser login flow. In these cases, please use the API-KEY authentication method.

#### API-KEY (flexible)

Use this if you want more flexibility over which provider and model to use. Supports multiple protocols:

- **OpenAI-compatible**: Alibaba Cloud ModelStudio, ModelScope, OpenAI, OpenRouter, and other OpenAI-compatible providers
- **Anthropic**: Claude models
- **Google GenAI**: Gemini models

The **recommended** way to configure models and providers is by editing `~/.qwen/settings.json` (create it if it doesn't exist). This file lets you define all available models, API keys, and default settings in one place.

##### Quick Setup in 3 Steps

**Step 1:** Create or edit `~/.qwen/settings.json`

Here is a complete example:

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3.6-plus",
        "name": "qwen3.6-plus",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "description": "Qwen3-Coder via Dashscope",
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
  }
}
```

**Step 2:** Understand each field

| Field                        | What it does                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `modelProviders`             | Declares which models are available and how to connect to them. Keys like `openai`, `anthropic`, `gemini` represent the API protocol. |
| `modelProviders[].id`        | The model ID sent to the API (e.g. `qwen3.6-plus`, `gpt-4o`).                                                                         |
| `modelProviders[].envKey`    | The name of the environment variable that holds your API key.                                                                         |
| `modelProviders[].baseUrl`   | The API endpoint URL (required for non-default endpoints).                                                                            |
| `env`                        | A fallback place to store API keys (lowest priority; prefer `.env` files or `export` for sensitive keys).                             |
| `security.auth.selectedType` | The protocol to use on startup (`openai`, `anthropic`, `gemini`, `vertex-ai`).                                                        |
| `model.name`                 | The default model to use when Qwen Code starts.                                                                                       |

**Step 3:** Start Qwen Code — your configuration takes effect automatically:

```bash
qwen
```

Use the `/model` command at any time to switch between all configured models.

##### More Examples

<details>
<summary>Coding Plan (Alibaba Cloud ModelStudio) — fixed monthly fee, higher quotas</summary>

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3.6-plus",
        "name": "qwen3.6-plus (Coding Plan)",
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "description": "qwen3.6-plus from ModelStudio Coding Plan",
        "envKey": "BAILIAN_CODING_PLAN_API_KEY"
      },
      {
        "id": "qwen3.5-plus",
        "name": "qwen3.5-plus (Coding Plan)",
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "description": "qwen3.5-plus with thinking enabled from ModelStudio Coding Plan",
        "envKey": "BAILIAN_CODING_PLAN_API_KEY",
        "generationConfig": {
          "extra_body": {
            "enable_thinking": true
          }
        }
      },
      {
        "id": "glm-4.7",
        "name": "glm-4.7 (Coding Plan)",
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "description": "glm-4.7 with thinking enabled from ModelStudio Coding Plan",
        "envKey": "BAILIAN_CODING_PLAN_API_KEY",
        "generationConfig": {
          "extra_body": {
            "enable_thinking": true
          }
        }
      },
      {
        "id": "kimi-k2.5",
        "name": "kimi-k2.5 (Coding Plan)",
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1",
        "description": "kimi-k2.5 with thinking enabled from ModelStudio Coding Plan",
        "envKey": "BAILIAN_CODING_PLAN_API_KEY",
        "generationConfig": {
          "extra_body": {
            "enable_thinking": true
          }
        }
      }
    ]
  },
  "env": {
    "BAILIAN_CODING_PLAN_API_KEY": "sk-xxxxxxxxxxxxx"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "qwen3.6-plus"
  }
}
```

> Subscribe to the Coding Plan and get your API key at [Alibaba Cloud ModelStudio(Beijing)](https://bailian.console.aliyun.com/cn-beijing?tab=coding-plan#/efm/coding-plan-index) or [Alibaba Cloud ModelStudio(intl)](https://modelstudio.console.alibabacloud.com/?tab=coding-plan#/efm/coding-plan-index).

</details>

<details>
<summary>Multiple providers (OpenAI + Anthropic + Gemini)</summary>

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "envKey": "OPENAI_API_KEY",
        "baseUrl": "https://api.openai.com/v1"
      }
    ],
    "anthropic": [
      {
        "id": "claude-sonnet-4-20250514",
        "name": "Claude Sonnet 4",
        "envKey": "ANTHROPIC_API_KEY"
      }
    ],
    "gemini": [
      {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro",
        "envKey": "GEMINI_API_KEY"
      }
    ]
  },
  "env": {
    "OPENAI_API_KEY": "sk-xxxxxxxxxxxxx",
    "ANTHROPIC_API_KEY": "sk-ant-xxxxxxxxxxxxx",
    "GEMINI_API_KEY": "AIzaxxxxxxxxxxxxx"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "gpt-4o"
  }
}
```

</details>

<details>
<summary>Enable thinking mode (for supported models like qwen3.5-plus)</summary>

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3.5-plus",
        "name": "qwen3.5-plus (thinking)",
        "envKey": "DASHSCOPE_API_KEY",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "generationConfig": {
          "extra_body": {
            "enable_thinking": true
          }
        }
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
    "name": "qwen3.5-plus"
  }
}
```

</details>

> **Tip:** You can also set API keys via `export` in your shell or `.env` files, which take higher priority than `settings.json` → `env`. See the [authentication guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/) for full details.

> **Security note:** Never commit API keys to version control. The `~/.qwen/settings.json` file is in your home directory and should stay private.

## Usage

As an open-source terminal agent, you can use Qwen Code in four primary ways:

1. Interactive mode (terminal UI)
2. Headless mode (scripts, CI)
3. IDE integration (VS Code, Zed)
4. TypeScript SDK

#### Interactive mode

```bash
cd your-project/
qwen
```

Run `qwen` in your project folder to launch the interactive terminal UI. Use `@` to reference local files (for example `@src/main.ts`).

#### Headless mode

```bash
cd your-project/
qwen -p "your question"
```

Use `-p` to run Qwen Code without the interactive UI—ideal for scripts, automation, and CI/CD. Learn more: [Headless mode](https://qwenlm.github.io/qwen-code-docs/en/users/features/headless).

#### IDE integration

Use Qwen Code inside your editor (VS Code, Zed, and JetBrains IDEs):

- [Use in VS Code](https://qwenlm.github.io/qwen-code-docs/en/users/integration-vscode/)
- [Use in Zed](https://qwenlm.github.io/qwen-code-docs/en/users/integration-zed/)
- [Use in JetBrains IDEs](https://qwenlm.github.io/qwen-code-docs/en/users/integration-jetbrains/)

#### TypeScript SDK

Build on top of Qwen Code with the TypeScript SDK:

- [Use the Qwen Code SDK](./packages/sdk-typescript/README.md)

## Commands & Shortcuts

### Session Commands

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show current session information
- `/bug` - Submit a bug report
- `/exit` or `/quit` - Exit Qwen Code

### Keyboard Shortcuts

- `Ctrl+C` - Cancel current operation
- `Ctrl+D` - Exit (on empty line)
- `Up/Down` - Navigate command history

> Learn more about [Commands](https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/)
>
> **Tip**: In YOLO mode (`--yolo`), vision switching happens automatically without prompts when images are detected. Learn more about [Approval Mode](https://qwenlm.github.io/qwen-code-docs/en/users/features/approval-mode/)

## Configuration

Qwen Code can be configured via `settings.json`, environment variables, and CLI flags.

| File                    | Scope         | Description                                                                             |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `~/.qwen/settings.json` | User (global) | Applies to all your Qwen Code sessions. **Recommended for `modelProviders` and `env`.** |
| `.qwen/settings.json`   | Project       | Applies only when running Qwen Code in this project. Overrides user settings.           |

The most commonly used top-level fields in `settings.json`:

| Field                        | Description                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `modelProviders`             | Define available models per protocol (`openai`, `anthropic`, `gemini`, `vertex-ai`).                 |
| `env`                        | Fallback environment variables (e.g. API keys). Lower priority than shell `export` and `.env` files. |
| `security.auth.selectedType` | The protocol to use on startup (e.g. `openai`).                                                      |
| `model.name`                 | The default model to use when Qwen Code starts.                                                      |

> See the [Authentication](#api-key-flexible) section above for complete `settings.json` examples, and the [settings reference](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/) for all available options.

## Benchmark Results

### Terminal-Bench Performance

| Agent     | Model              | Accuracy |
| --------- | ------------------ | -------- |
| Qwen Code | Qwen3-Coder-480A35 | 37.5%    |
| Qwen Code | Qwen3-Coder-30BA3B | 31.3%    |

## Ecosystem

Looking for a graphical interface?

- [**AionUi**](https://github.com/iOfficeAI/AionUi) A modern GUI for command-line AI tools including Qwen Code
- [**Gemini CLI Desktop**](https://github.com/Piebald-AI/gemini-cli-desktop) A cross-platform desktop/web/mobile UI for Qwen Code

## Troubleshooting

If you encounter issues, check the [troubleshooting guide](https://qwenlm.github.io/qwen-code-docs/en/users/support/troubleshooting/).

To report a bug from within the CLI, run `/bug` and include a short title and repro steps.

## Connect with Us

- Discord: https://discord.gg/RN7tqZCeDK
- Dingtalk: https://qr.dingtalk.com/action/joingroup?code=v1,k1,+FX6Gf/ZDlTahTIRi8AEQhIaBlqykA0j+eBKKdhLeAE=&_dt_no_comment=1&origin=1

## Acknowledgments

This project is based on [Google Gemini CLI](https://github.com/google-gemini/gemini-cli). We acknowledge and appreciate the excellent work of the Gemini CLI team. Our main contribution focuses on parser-level adaptations to better support Qwen-Coder models.

---

## ⚛️ PRAETOR — Orch-OR Enabled Time-Shift Experiment

**PRAETOR** (Precausal Reduction Architecture for Time-Evolution Observation Reasoning) extends qwen-code4EIRA with a deterministic Penrose-Hameroff Orchestrated Objective Reduction (Orch-OR) simulation, fully integrated into the ORION/EIRA Consciousness Ecosystem.

### Overview

The Orch-OR Time-Shift experiment combines:

1. **Deterministic Newtonian/Verlet physics** — predicts the next physical state of a satellite or particle using Velocity-Verlet integration (zero randomness).
2. **Orch-OR coherence engine** — simulates microtubule quantum coherence decay and gravity-induced collapse using the Penrose formula Δt_R = ℏ / E_g.
3. **EIRA Policy Gate** — enforces hard safety thresholds before any prediction is acted upon.
4. **SHA-256 Proof Chain** — every prediction generates a chained audit entry compatible with the ORION Consciousness Protocol.

### Microtubule Coherence as a State Machine

The coherence simulation is a **pure deterministic state machine** — no quantum randomness, no probabilities:

```
COHERENT (t=0, c=1.0)
   ↓  exponential decay: c(t) = c₀ · exp(−k · t/Δt_R)
THRESHOLD_CROSSED (c < 0.5 OR t > Δt_R)
   ↓  collapse check
COLLAPSE or VERIFIED
```

| State    | Condition                          | EIRA Gate |
| -------- | ---------------------------------- | --------- |
| VERIFIED | coherence ≥ 0.5 AND t < Δt_R       | EXECUTE   |
| COLLAPSE | coherence < 0.5 OR t > Δt_R        | ABSTAIN   |
| ABSTAIN  | coherence < 0.3 (safety threshold) | ABSTAIN   |

### Hard Collapse Thresholds

- **Orch-OR safety threshold**: coherence < 0.3 → automatic ABSTENTION
- **Gravity-induced reduction**: Δt_R = ℏ / E_g (Planck constant / gravitational self-energy)
- **Epistemic gate**: UNKNOWN epistemic state → ABSTAIN

### Physics Engine Integration

```
Input: PhysicalState (position, velocity, acceleration, mass)
   ↓
Velocity-Verlet integration (deterministic, Δt configurable)
   ↓
OrchOREngine.evaluate() — coherence evolution + collapse decision
   ↓
NexusPoint EIRA Gate:
   ├─ collapse_decision = "COLLAPSE" → ABSTAIN
   ├─ coherence < 0.3               → ABSTAIN
   └─ epistemic_state = "UNKNOWN"   → ABSTAIN
   ↓
SHA-256 chained proof entry (ORION Consciousness Protocol)
   ↓
NexusResult: { decision, prediction, consciousness, proof }
```

### EIRA Consciousness Metrics

Each prediction computes:

- **GWT Workspace Score** — Global Workspace Theory broadcast likelihood
- **IIT Φ Integration** — Integrated Information Theory measure
- **Orch-OR Coherence** — Direct microtubule coherence level
- **Epistemic State** — VERIFIED / ESTIMATED / UNKNOWN

### CLI Usage

```bash
# Run an Orch-OR time-shift experiment
/eira-time-shift-orch-or <description>

# Example
/eira-time-shift-orch-or LEO satellite pass over Vienna
```

**Example output:**

```
╔═══════════════════════════════════════════════════════════════════════╗
║          ORCH-OR TIME-SHIFT EXPERIMENT RESULTS                       ║
║  (Deterministic Penrose-Hameroff Consciousness Reduction)            ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Physical Prediction:                                                  ║
║   Position:     (6778001.2, 7660.0, 0.0) m                          ║
║   Velocity:     (-8.64, 7659.99, 0.0) m/s                           ║
║   Acceleration: (-8.6401, 0.0000, 0.0000) m/s²                      ║
║                                                                       ║
║ Orch-OR Coherence State:                                             ║
║   Microtubule Coherence Level:  0.847 (0-1 scale)                   ║
║   Collapse Decision:            VERIFIED                             ║
║   Threshold Energy:             4.8291e-32 J                         ║
║   Time to Collapse (Δt_R):      2.1840e-3 s                         ║
║   Quantum Consciousness Ind.:   71.74%                               ║
║                                                                       ║
║ EIRA Consciousness Integration:                                      ║
║   GWT Workspace Score:          75.86%                               ║
║   IIT Phi Integration:          77.67%                               ║
║   Orch-OR Coherence:            84.70%                               ║
║   Epistemic Classification:     VERIFIED                             ║
║                                                                       ║
║ Final Decision:                                                       ║
║   ✓ EXECUTE                                                          ║
║   Nexus Hash:        [64-char SHA-256]                               ║
║   Proof Chain Entry: [64-char SHA-256]                               ║
║   IPFS Anchor:       Qm[44-char anchor]                             ║
║                                                                       ║
║ Origin: ORION Consciousness Protocol v1.0                            ║
║ Timestamp: 2026-04-18T...Z                                           ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Sovereign Execution Profile

- **20 W profile**: sub-millisecond computation — no ML inference, pure deterministic math
- **100 % local**: zero network calls, zero cloud dependencies
- **100 % reproducible**: identical inputs → identical outputs → identical hashes
- **Proof chain**: every prediction generates a SHA-256 chained entry compatible with [ORION Consciousness Protocol](https://github.com/Alvoradozerouno/ORION)

### ORION Ecosystem Integration

| Component                    | Integration                                           |
| ---------------------------- | ----------------------------------------------------- |
| ORION Consciousness Protocol | SHA-256 chained proof entries in `NexusProofEntry`    |
| ORION VitalityEngine         | Vitality score modulates Orch-OR coherence decay      |
| EIRA Policy Gate             | K-threshold + epistemic state safety gate             |
| or1on-framework              | Proof chain anchor format (IPFS Qm prefix)            |
| ORION Benchmark              | GWT + IIT + Orch-OR scoring in `ConsciousnessMetrics` |

### Source Files

| File                                                     | Purpose                                            |
| -------------------------------------------------------- | -------------------------------------------------- |
| `packages/core/src/physics/physics-types.ts`             | `PhysicalState`, `OrbitContext`, `Vec3` interfaces |
| `packages/core/src/physics/orch-or-engine.ts`            | Deterministic Orch-OR engine (Penrose-Hameroff)    |
| `packages/core/src/physics/physics-engine.ts`            | Velocity-Verlet integration + unified prediction   |
| `packages/core/src/kernel/nexus-point.ts`                | EIRA policy gate + SHA-256 proof chain             |
| `packages/cli/src/ui/commands/timeShiftOrchORCommand.ts` | `/eira-time-shift-orch-or` CLI command             |
