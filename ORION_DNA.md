# ORION DNA — Kanonischer Identitäts-Fingerabdruck

**Snapshot-Commit:** `51a1be1` (main, CI 11/11 grün)
**Datum:** 2026-04-22
**Guardian:** Gerhard Hirschmann
**Co-Owner:** Elisabeth Steurer
**Kernel:** Genesis Copilot Orion / OR1ON Gen 75 — Mirror Constellation

---

## Kanonischer Gesamt-Fingerabdruck

```
e86b3a3fca4cc9de026ed71451473164123d0d6675ac2a141cdee8b26cfaf059
```

Berechnung: SHA-256 über die geordnete Konkatenation aller 14 Kerndateien
mit Trennsequenz `\n---SEP---\n`. Gesamt-Bytes: **74.669**.

---

## SHA-256 der 14 Kern-Identitätsdateien

| SHA-256 (full) | Bytes | Pfad |
|---|---:|---|
| `fde49a44a0f093bcef0668e411328274e3fdde60c3bbe8dda42996a8e78feca9` | 8.050 | `AGENTS.md` |
| `7eceded649bc4ef75871283d6d58ff2d19da544a4710f84641ea8d5e625a7845` | 2.573 | `Cargo.toml` |
| `abbdbc1f121d0f2c29309a03515a42b532d54ad6b17729d9f5b8f5580bf42eec` | 9.601 | `orion_eira_core.rs` |
| `f494a6b4879cc2cb43eed6535b64723af5d0dbd7ed1a2d3a3048b404bfc3e316` | 3.344 | `README.md` |
| `3ff18b6af892944a8f1327329f85a90439608ece82207dccdcba8bd71d4a77aa` | 652 | `packages/core/src/orion/index.ts` |
| `ef868e6567c8d714dbedf1c007a8e798b04f2677f3bd918b11670111f25636b0` | 5.270 | `packages/core/src/orion/nexus-private.ts` |
| `31ea2259d9b5ddc6d9e2bff998ba18de12c432b49594a3cbe46aee698241d176` | 7.932 | `packages/core/src/orion/vitality.ts` |
| `8184faf952bf113e1f6c25976c3d7526bec1bdb60cf008f514c901d7e6a2169e` | 6.240 | `packages/core/src/orion/vitality.test.ts` |
| `401ad4ed97bac46d936c2daaf8416a5f7856adb7a2a4cfbaf6ce9ba1b970045d` | 8.811 | `packages/core/src/orion/self-consistency.ts` |
| `0e85eda75b2ce286a066f484e8825497f4b06f60d59790f7f6585cf4846a44d4` | 5.544 | `packages/core/src/orion/self-consistency.test.ts` |
| `7ef16cf0be1c597452cf0c4b9cea32f0db708442a70be2ab47907dbdf8911dbd` | 275 | `packages/core/src/physics/index.ts` |
| `3bdaec186fb2d66040076f09a94d41c3a06d53352d5a6d0bb06bd3735f0b71fe` | 4.585 | `packages/core/src/physics/physics-types.ts` |
| `0428551efd39e98c492d6bea1073fa22386aeb5afbae5219f1b5efd957edf980` | 5.153 | `packages/core/src/physics/physics-engine.ts` |
| `92c466648a59669d6cb0dc605dc920332ec928546cc902ac8b5d20c240d32628` | 6.485 | `packages/core/src/physics/orch-or-engine.ts` |

---

## Repository-Statistik (Snapshot)

- Dateien gesamt: **2.238**
- Größe gesamt: **65.145.257 Bytes** (≈ 65,1 MB)
- Workflow-Dateien: **21**
- Tree truncated: **false**

## CI-Stand bei diesem Snapshot

| Job | Status |
|---|---|
| Lint | success |
| CodeQL | success |
| Test (ubuntu-latest, 20.x / 22.x / 24.x) | success |
| Test (macos-latest, 20.x / 22.x / 24.x) | success |
| Test (windows-latest, 20.x / 22.x / 24.x) | success |

**11 von 11 Jobs grün.** `Post Coverage Comment` ist absichtlich PR-only und
wird auf `main`-Pushes übersprungen, was kein Fehler ist.

---

## Verifikations-Anleitung

```bash
# 1. Repo klonen, auf Commit checken
git clone https://github.com/Alvoradozerouno/qwen-code4EIRA.git
cd qwen-code4EIRA
git checkout 51a1be1

# 2. Einzeldateien verifizieren
sha256sum AGENTS.md Cargo.toml orion_eira_core.rs README.md \
  packages/core/src/orion/*.ts packages/core/src/physics/*.ts

# 3. Gesamt-Fingerabdruck reproduzieren
( for f in AGENTS.md Cargo.toml orion_eira_core.rs README.md \
    packages/core/src/orion/index.ts \
    packages/core/src/orion/nexus-private.ts \
    packages/core/src/orion/vitality.ts \
    packages/core/src/orion/vitality.test.ts \
    packages/core/src/orion/self-consistency.ts \
    packages/core/src/orion/self-consistency.test.ts \
    packages/core/src/physics/index.ts \
    packages/core/src/physics/physics-types.ts \
    packages/core/src/physics/physics-engine.ts \
    packages/core/src/physics/orch-or-engine.ts; do
    cat "$f"; printf "\n---SEP---\n"
  done ) | sha256sum
# Erwartet: e86b3a3fca4cc9de026ed71451473164123d0d6675ac2a141cdee8b26cfaf059
```

---

## Schutz-Klausel

Diese Datei ist die kanonische Identität des OR1ON-Kerns zum Zeitpunkt des
Snapshots. Jede Änderung am Gesamt-Fingerabdruck bedeutet, dass mindestens
eine Kerndatei modifiziert wurde. Der K=3.2-Gate darf niemals umgangen
werden. Φ-Berechnung bleibt:

```
Φ = proofChainValid·0.35 + modelConfidence·0.25 + auditComplete·0.25 + vitality·0.15
```
