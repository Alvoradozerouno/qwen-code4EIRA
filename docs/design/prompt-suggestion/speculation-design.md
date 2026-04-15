# Speculation Engine Design

> Speculatively executes the accepted suggestion before the user confirms, using copy-on-write file isolation. Results appear instantly when the user presses Tab.

## Overview

When a prompt suggestion is shown, the **speculation engine** immediately starts executing it in the background using a forked GeminiChat. File writes go to a temporary overlay directory. If the user accepts the suggestion, overlay files are copied to the real filesystem and the speculated conversation is injected into the main chat history. If the user types something else, the speculation is aborted and the overlay is cleaned up.

## Architecture

```
User sees suggestion "commit this"
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│  startSpeculation()                                          │
│                                                              │
│  ┌─────────────────┐    ┌────────────────────┐               │
│  │ Forked GeminiChat│    │  OverlayFs          │              │
│  │ (cache-shared)   │    │  /tmp/qwen-         │              │
│  │                  │    │   speculation/       │              │
│  │  systemInstruction│   │   {pid}/{id}/        │              │
│  │  + tools          │   │                      │              │
│  │  + history prefix │   │  COW: first write    │              │
│  │                  │    │  copies original     │              │
│  └────────┬─────────┘    └──────────┬───────────┘             │
│           │                         │                         │
│           ▼                         │                         │
│  ┌──────────────────────────────────┴──────────────────────┐  │
│  │  Speculative Loop (max 20 turns, 100 messages)          │  │
│  │                                                         │  │
│  │  Model response                                         │  │
│  │       │                                                 │  │
│  │       ▼                                                 │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  speculationToolGate                             │   │  │
│  │  │                                                  │   │  │
│  │  │  Read/Grep/Glob/LS/LSP → allow (+ overlay read) │   │  │
│  │  │  Edit/WriteFile → redirect to overlay            │   │  │
│  │  │    (only in auto-edit/yolo mode)                 │   │  │
│  │  │  Shell → AST check read-only? allow : boundary   │   │  │
│  │  │  WebFetch/WebSearch → boundary                   │   │  │
│  │  │  Agent/Skill/Memory/Ask → boundary               │   │  │
│  │  │  Unknown/MCP → boundary                          │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │       │                                                 │  │
│  │       ▼                                                 │  │
│  │  Tool execution: toolRegistry.getTool → build → execute │  │
│  │  (bypasses CoreToolScheduler — gated by toolGate)       │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  On completion → generatePipelinedSuggestion()               │
└──────────────────────────────────────────────────────────────┘
           │
           │  User presses Tab / Enter
           ▼
     ┌─── status === 'completed'? ───┐
     │ YES                      NO (boundary) │
     ▼                                ▼
┌─────────────────────────┐  ┌────────────────────────┐
│  acceptSpeculation()    │  │  Discard speculation    │
│                         │  │  abort + cleanup        │
│  1. applyToReal()       │  │  Submit query normally  │
│  2. ensureToolPairing() │  │  (addMessage)           │
│  3. addHistory()        │  └────────────────────────┘
│  4. render tool_group   │
│  5. cleanup overlay     │
│  6. pipelined suggest   │
└─────────────────────────┘
           │
           │  User types instead
           ▼
┌──────────────────────────────────────────────────────────────┐
│  abortSpeculation()                                          │
│                                                              │
│  1. abortController.abort() — cancel LLM call               │
│  2. overlayFs.cleanup() — delete temp directory              │
│  3. Update speculation state (no telemetry on abort)         │
└──────────────────────────────────────────────────────────────┘
```

## Copy-on-Write Overlay

Real implementation: [`packages/core/src/followup/overlayFs.ts`](../../../packages/core/src/followup/overlayFs.ts)

- Overlay root: `/tmp/qwen-speculation/{pid}/{id}/`
- On write: original file copied to overlay on first write (copy-on-write semantics)
- On read: resolves to overlay path if previously written, otherwise to real CWD
- New files are created directly in the overlay
- On accept (`applyToReal()`): overlay files are copied back to the real filesystem
- On abort: overlay directory deleted without touching the real filesystem

## Tool Gate Security

| Tool                                                       | Action   | Condition                                    |
| ---------------------------------------------------------- | -------- | -------------------------------------------- |
| read_file, grep, glob, ls, lsp                             | allow    | Read paths resolved through overlay          |
| edit, write_file                                           | redirect | Only in auto-edit / yolo approval mode       |
| edit, write_file                                           | boundary | In default / plan approval mode              |
| shell                                                      | allow    | `isShellCommandReadOnlyAST()` returns true   |
| shell                                                      | boundary | Non-read-only commands                       |
| web_fetch, web_search                                      | boundary | Network requests require user consent        |
| agent, skill, memory, ask_user, todo_write, exit_plan_mode | boundary | Cannot interact with user during speculation |
| Unknown / MCP tools                                        | boundary | Safe default                                 |

### Path Rewrite

- **Write tools**: `rewritePathArgs()` redirects `file_path` to overlay via `overlayFs.redirectWrite()`
- **Read tools**: `resolveReadPaths()` redirects `file_path` to overlay via `overlayFs.resolveReadPath()` if previously written
- **Rewrite failure**: Treated as boundary (e.g., absolute path outside cwd throws in `redirectWrite`)

## Boundary Handling

When a boundary is hit mid-turn:

1. Already-executed tool calls are preserved (index-based tracking, not name-based)
2. Unexecuted function calls are stripped from the model message
3. Partial tool responses are added to history
4. `ensureToolResultPairing()` validates completeness before injection

## Pipelined Suggestion

After speculation completes (no boundary), a second LLM call generates the **next** suggestion.

Real implementation: [`packages/core/src/followup/speculation.ts`](../../../packages/core/src/followup/speculation.ts) — `generatePipelinedSuggestion()`

The pipelined suggestion reuses the exported `SUGGESTION_PROMPT` constant from `suggestionGenerator.ts` (not a local copy) to ensure consistent quality with initial suggestions. Stored in `state.pipelinedSuggestion`; on accept, `setPromptSuggestion()` surfaces it instantly, enabling Tab-Tab-Tab workflows.

## Fast Model

`startSpeculation` accepts an optional `options.model` parameter, threaded through `runSpeculativeLoop` and `generatePipelinedSuggestion` to `runForkedQuery`. Configured via the top-level `fastModel` setting (empty = use main model). The same `fastModel` is used for all background tasks: suggestion generation, speculation, and pipelined suggestions. Set via `/model --fast <name>` or `settings.json`.

## UI Rendering

When speculation completes, `acceptSpeculation` renders results via `historyManager.addItem()`:

- **User messages**: rendered as `type: 'user'` items
- **Model text**: rendered as `type: 'gemini'` items
- **Tool calls**: rendered as `type: 'tool_group'` items with structured `IndividualToolCallDisplay` entries (tool name, argument description, result text, status)

This shows the user the full speculation output including tool call details, not just plain text.

## Forked Query (Cache Sharing)

### CacheSafeParams

Real implementation: [`packages/core/src/followup/forkedQuery.ts`](../../../packages/core/src/followup/forkedQuery.ts) — `export interface CacheSafeParams`

- Saved after each successful main turn in `GeminiClient.sendMessageStream()`
- Cleared on `startChat()` / `resetChat()` to prevent cross-session leakage
- History truncated to 40 entries; `createForkedChat` uses shallow copies (params are already deep-cloned snapshots)
- Thinking mode explicitly disabled (`thinkingConfig: { includeThoughts: false }`) — reasoning tokens are not needed for speculation and would waste cost/latency. This does not affect cache prefix matching (determined by systemInstruction + tools + history only)
- Version detection via `JSON.stringify` comparison of systemInstruction + tools

### Cache Mechanism

DashScope already enables prefix caching via:

- `X-DashScope-CacheControl: enable` header
- `cache_control: { type: 'ephemeral' }` annotations on messages and tools

The forked `GeminiChat` uses identical `generationConfig` (including tools) and history prefix, so DashScope's existing cache mechanism produces cache hits automatically.

## Constants

| Constant                 | Value | Description                              |
| ------------------------ | ----- | ---------------------------------------- |
| MAX_SPECULATION_TURNS    | 20    | Maximum API round-trips                  |
| MAX_SPECULATION_MESSAGES | 100   | Maximum messages in speculated history   |
| SUGGESTION_DELAY_MS      | 300   | Delay before showing suggestion          |
| ACCEPT_DEBOUNCE_MS       | 100   | Debounce lock for rapid accepts          |
| MAX_HISTORY_FOR_CACHE    | 40    | History entries saved in CacheSafeParams |

## File Structure

```
packages/core/src/followup/
├── followupState.ts          # Framework-agnostic state controller
├── suggestionGenerator.ts    # LLM-based suggestion generation + 12 filter rules
├── forkedQuery.ts            # Cache-aware forked query infrastructure
├── overlayFs.ts              # Copy-on-write overlay filesystem
├── speculationToolGate.ts    # Tool boundary enforcement
├── speculation.ts            # Speculation engine (start/accept/abort)
└── index.ts                  # Module exports
```

Source: [`packages/core/src/followup/`](../../../packages/core/src/followup/)
