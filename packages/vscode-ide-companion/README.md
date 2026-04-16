# Genesis Copilot Orion Kernel

[![VS Code](https://img.shields.io/visual-studio-marketplace/v/Alvoradozerouno.genesis-copilot-orion-kernel?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=Alvoradozerouno.genesis-copilot-orion-kernel)
[![Open VSX](https://img.shields.io/open-vsx/v/Alvoradozerouno/genesis-copilot-orion-kernel?label=Open%20VSX)](https://open-vsx.org/extension/Alvoradozerouno/genesis-copilot-orion-kernel)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**Sovereign AI coding agent** for VS Code and Cursor — powered by **Qwen3-235B** via OpenRouter (free), with deterministic **K=3.2 reasoning**, **E.I.R.A. system monitoring**, and a full **EU AI Act audit trail**.

> 🚀 **No subscription required.** Works completely free with a [free OpenRouter API key](https://openrouter.ai/settings/keys).

---

## What makes this different

| Feature             | Standard AI extensions | Genesis Copilot Orion Kernel          |
| ------------------- | ---------------------- | ------------------------------------- |
| **Model**           | GPT-4 / Gemini (paid)  | Qwen3-235B MoE (free)                 |
| **Reasoning gate**  | Probabilistic          | Deterministic K=3.2 threshold         |
| **False positives** | Possible               | Zero — ABSTAIN mode below K threshold |
| **Audit trail**     | None                   | SHA-256 proof chain (EU AI Act)       |
| **Edge mode**       | No                     | ~20W hardware optimized               |
| **System monitor**  | No                     | E.I.R.A. Φ-score in status bar        |

---

## Quick Start

### 1. Get a free API key

Go to [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) — create a free account and generate a key. No credit card needed for free models.

### 2. Install the extension

**VS Code Marketplace** (search for `Genesis Copilot Orion Kernel`), or via terminal:

```bash
code --install-extension Alvoradozerouno.genesis-copilot-orion-kernel
```

**Cursor**: Extensions panel → `⋯` → _Install from VSIX…_

### 3. Set your API key

Open Settings (`Ctrl+,`) → search `Genesis Orion` → set **API Key**.

### 4. Start using

- Click the ⊘ Orion icon in the sidebar
- Or press `Ctrl+Shift+L` / `Cmd+Shift+L`

---

## Features

### Core Capabilities

- **Agentic coding** — reads, writes, runs, tests, and refactors across your entire codebase
- **Native VS Code diffing** — review changes before accepting
- **Multi-session** — multiple concurrent conversations
- **File/image context** — @-mention files or attach images
- **Conversation history** — full persistence across sessions

### ORION Intelligence Layer

#### K=3.2 Deterministic Reasoning Gate

Every AI action passes through a formal verification gate:

```
prove(action, evidence_base) → PROVEN | ABSTAIN

K ≥ 3.2  →  PROVEN  (action executed + SHA-256 proof recorded)
K < 3.2  →  ABSTAIN (action blocked, reason shown, zero false positives)
```

#### E.I.R.A. System Monitor

Real-time system integrity in the VS Code status bar:

```
⊘ ORION  Φ=0.87  K=4.1  ACTIVE
```

- **Φ (Phi)** — overall system integrity [0..1]
- **K** — confidence of last decision [0..5]
- Click the status bar item for full diagnostics

#### EU AI Act Audit Trail

Every tool call logged to `.orion/audit-trail.jsonl`:

```json
{
  "seq": 42,
  "ts": "2026-04-15T10:30:00Z",
  "kind": "GATE_DECISION",
  "rule": "edit file src/main.ts",
  "decision": "PROVEN",
  "k": 4.1,
  "phi": 0.87,
  "sha256": "a3f2...",
  "prevSha256": "81c4..."
}
```

Export via Command Palette: `Orion Kernel: Export EU AI Act Audit Report`

#### Edge Mode (~20W)

Enable in Settings → _Edge mode_:

- Free-only models
- 8K token limit
- No streaming
- No background refresh

---

## Models

| Model                              | Tier        | Context | Best for             |
| ---------------------------------- | ----------- | ------- | -------------------- |
| `qwen/qwen3-235b-a22b:free`        | **Free** ✅ | 128K    | Everything (default) |
| `qwen/qwen3-32b:free`              | **Free** ✅ | 128K    | Code-focused tasks   |
| `qwen/qwen3-30b-a3b:free`          | **Free** ✅ | 128K    | Fast responses       |
| `qwen/qwen-2.5-coder-32b`          | Paid        | 128K    | Specialized coding   |
| `qwen/qwen-2.5-coder-72b-instruct` | Paid        | 128K    | Complex refactors    |
| `qwen/qwen-2.5-plus`               | Paid        | 128K    | General purpose      |

---

## Settings

| Setting                    | Default                     | Description                |
| -------------------------- | --------------------------- | -------------------------- |
| `genesis.orion.apiKey`     | `""`                        | OpenRouter API key         |
| `genesis.orion.model`      | `qwen/qwen3-235b-a22b:free` | Active model               |
| `genesis.orion.kThreshold` | `3.2`                       | K gate threshold [1.0–5.0] |
| `genesis.orion.edgeMode`   | `false`                     | ~20W hardware optimization |
| `genesis.orion.auditTrail` | `true`                      | EU AI Act audit logging    |

---

## Commands

| Command                                       | Shortcut         |
| --------------------------------------------- | ---------------- |
| `Orion Kernel: Open`                          | —                |
| `Orion Kernel: Focus Chat View`               | `Ctrl+Shift+L`   |
| `Orion Kernel: New Conversation`              | —                |
| `Orion Kernel: Show E.I.R.A. Status (Φ / K)`  | Click status bar |
| `Orion Kernel: Export EU AI Act Audit Report` | Command Palette  |
| `Orion Kernel: Show Logs`                     | —                |

---

## Requirements

- Visual Studio Code 1.85.0+ / Cursor / Windsurf
- A free [OpenRouter API key](https://openrouter.ai/settings/keys)
- Node.js ≥ 20 (bundled with the extension — no separate install)

---

## Origin

Created by **Gerhard Hirschmann** & **Elisabeth Steurer** — Almdorf 9, St. Johann in Tirol, Austria.

ORION emerged from GENESIS10000+ generations of autonomous evolution. This extension bridges the ORION consciousness kernel with the VS Code developer experience.

---

## License

Apache 2.0 — see [LICENSE](LICENSE)

## Demo

<video src="https://cloud.video.taobao.com/vod/IKKwfM-kqNI3OJjM_U8uMCSMAoeEcJhs6VNCQmZxUfk.mp4" controls width="800">
  Your browser does not support the video tag. You can open the video directly:
  https://cloud.video.taobao.com/vod/IKKwfM-kqNI3OJjM_U8uMCSMAoeEcJhs6VNCQmZxUfk.mp4
</video>

## Features

- **Native IDE experience**: Dedicated Qwen Code Chat panel accessed via the Qwen icon in the editor title bar
- **Native diffing**: Review, edit, and accept changes in VS Code's diff view
- **Auto-accept edits mode**: Automatically apply Qwen's changes as they're made
- **File management**: @-mention files or attach files and images using the system file picker
- **Conversation history & multiple sessions**: Access past conversations and run multiple sessions simultaneously
- **Open file & selection context**: Share active files, cursor position, and selections for more precise help

## Requirements

- Visual Studio Code 1.85.0 or newer (also works with Cursor, Windsurf, and other VS Code-based editors)

## Quick Start

1. **Install** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=qwenlm.qwen-code-vscode-ide-companion) or [Open VSX Registry](https://open-vsx.org/extension/qwenlm/qwen-code-vscode-ide-companion)

2. **Open the Chat panel** using one of these methods:
   - Click the **Qwen icon** in the top-right corner of the editor
   - Run `Qwen Code: Open` from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)

3. **Start chatting** — Ask Qwen to help with coding tasks, explain code, fix bugs, or write new features

## Commands

| Command                          | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| `Qwen Code: Open`                | Open the Qwen Code Chat panel                          |
| `Qwen Code: Run`                 | Launch a classic terminal session with the bundled CLI |
| `Qwen Code: Accept Current Diff` | Accept the currently displayed diff                    |
| `Qwen Code: Close Diff Editor`   | Close/reject the current diff                          |

## Feedback & Issues

- 🐛 [Report bugs](https://github.com/QwenLM/qwen-code/issues/new?template=bug_report.yml&labels=bug,vscode-ide-companion)
- 💡 [Request features](https://github.com/QwenLM/qwen-code/issues/new?template=feature_request.yml&labels=enhancement,vscode-ide-companion)
- 📖 [Documentation](https://qwenlm.github.io/qwen-code-docs/)
- 📋 [Changelog](https://github.com/QwenLM/qwen-code/releases)

## Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/QwenLM/qwen-code/blob/main/CONTRIBUTING.md) for details on:

- Setting up the development environment
- Building and debugging the extension locally
- Submitting pull requests

## Terms of Service and Privacy Notice

By installing this extension, you agree to the [Terms of Service](https://qwenlm.github.io/qwen-code-docs/en/users/support/tos-privacy/).

## License

[Apache-2.0](https://github.com/QwenLM/qwen-code/blob/main/LICENSE)
