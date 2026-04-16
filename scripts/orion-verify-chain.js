#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * ORION Audit Chain Verifier
 *
 * Verifies the SHA-256 chained integrity of an ORION audit trail file.
 * Exits 0 if chain is intact, 1 if tampered or unreadable.
 *
 * Usage:
 *   node scripts/orion-verify-chain.js [path/to/audit-trail.jsonl]
 *
 * Default path: .orion/audit-trail.jsonl (relative to cwd)
 *
 * Exit codes:
 *   0  — chain intact (or file doesn't exist / empty → trivially valid)
 *   1  — chain tampered, unparseable line, or unexpected error
 */

import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PATH = '.orion/audit-trail.jsonl';

async function main() {
  const auditFilePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), DEFAULT_PATH);

  if (!existsSync(auditFilePath)) {
    console.log(`⊘ ORION verify-chain: no audit trail at ${auditFilePath} — trivially intact.`);
    process.exit(0);
  }

  const content = await readFile(auditFilePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  if (lines.length === 0) {
    console.log(`⊘ ORION verify-chain: empty audit trail at ${auditFilePath} — trivially intact.`);
    process.exit(0);
  }

  let prevHash = '0'.repeat(64);
  let verified = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      console.error(`✗ ORION verify-chain: TAMPERED — line ${i + 1} is not valid JSON.`);
      console.error(`  File: ${auditFilePath}`);
      process.exit(1);
    }

    const { sha256, ...rest } = entry;
    if (!sha256 || typeof sha256 !== 'string') {
      console.error(`✗ ORION verify-chain: TAMPERED — line ${i + 1} missing sha256 field.`);
      process.exit(1);
    }

    const payload = JSON.stringify({ ...rest, sha256: undefined });
    const expected = createHash('sha256')
      .update(prevHash + payload)
      .digest('hex');

    if (expected !== sha256) {
      console.error(`✗ ORION verify-chain: TAMPERED at entry ${i + 1} (${entry.type ?? 'unknown'}).`);
      console.error(`  Expected: ${expected}`);
      console.error(`  Found:    ${sha256}`);
      console.error(`  File: ${auditFilePath}`);
      process.exit(1);
    }

    prevHash = sha256;
    verified++;
  }

  console.log(`✓ ORION verify-chain: ${verified} entries — chain INTACT`);
  console.log(`  File: ${auditFilePath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`✗ ORION verify-chain: unexpected error — ${err.message}`);
  process.exit(1);
});
