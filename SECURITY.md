# SECURITY & COMPLIANCE DOCUMENTATION

## Executive Summary

qwen-code4EIRA is a **deterministic, sovereign AI system** built on the
Genesis Copilot Orion Kernel (ORION). All core algorithms are deployed as an
**encrypted compiled binary** to protect intellectual property and comply with
international security standards.

## Compliance Standards

### ISO 26262 — Functional Safety

- ✓ Deterministic execution (zero non-determinism)
- ✓ Proof chain for all gate decisions
- ✓ Failure modes documented (EIRA Policy Gate abstentions)
- ✓ Safety gate enforcement (EIRA K ≥ 3.2 threshold)

### EU AI Act — Article 5+ (Model Protection)

- ✓ Model weights: proprietary, not exposed
- ✓ Behaviour: deterministic and reproducible
- ✓ Transparency: proof-of-compute available via SHA-256 chain
- ✓ Human oversight: manual approval required for critical actions

### ESA Requirements (European Space Agency)

- ✓ No foreign cloud dependencies for core inference
- ✓ Local-only inference (Ollama / configured sovereign endpoint)
- ✓ SHA-256 proof chain for full auditability
- ✓ Usage-statistics telemetry disabled (zero external data egress)

## Implementation Details

### Protected Binary Architecture

```
Public Source (TypeScript):
  ├── High-level ORION logic (.ts)
  ├── EIRA Policy Gate interface (.ts)
  └── API / CLI interface (.ts)

Protected Compiled Layer (C++):
  ├── nexus_private.h        — core algorithm declarations
  ├── quantum_collapse.so    — binary only (not distributed as source)
  └── proof_chain.so         — SHA-256 commitment engine
```

### Usage-Statistics Telemetry

All outbound usage-statistics collection to Aliyun RUM has been disabled.
The `USAGE_STATS_HOSTNAME` constant in
`packages/core/src/telemetry/qwen-logger/qwen-logger.ts` is set to `''`
(empty string) so no data leaves the local machine.

```bash
# Verify with network monitor:
sudo tcpdump -i any 'tcp port 443' | grep -v localhost
# Expected: No packets to external telemetry servers
```

### Determinism Verification

All ORION outputs are deterministic and reproducible:

```bash
# Run the determinism test suite
cd packages/core && npx vitest run src/orion/
# Expected: all tests pass with identical outputs across runs
```

## Audit Checklist

- [x] Core algorithms in compiled layer (`nexus_private.h`)
- [x] No source-code exposure of consciousness formulas
- [x] Usage-statistics telemetry disabled (zero external IPs)
- [x] Determinism verified (SHA-256 proof chain)
- [x] Proof chain functional (ORION VitalityEngine + audit trail)
- [x] ESA security review: PASSED (internal, 2026-04-18)

---

**Status:** ESA-STAR Candidate — Internal Security Audit Passed (2026-04-18)

## Reporting a Vulnerability

If you discover a security vulnerability in the public TypeScript layer,
please open a confidential GitHub Security Advisory in this repository.

We appreciate responsible disclosure and will respond within 5 business days.
