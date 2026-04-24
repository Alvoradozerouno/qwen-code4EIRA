/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROOF CHAIN ENGINE
 * 
 * SHA-256 chained audit trail of all decisions
 * Each record links to previous (blockchain-style)
 */

import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';

export interface ProofRecord {
  sequence: number;
  timestamp: number;
  decision: string;
  confidence: number;
  factors: {
    quantumJitter: number;
    agentChaosTiming: number;
    energyDepletion: number;
    vitalityDrift: number;
    unexpectedEvent?: string;
  };
  reasoning: string;
  currentHash: string;
  previousHash: string;
  couldHaveChosen?: Array<{
    route: string;
    probability: number;
  }>;
}

export interface ChainVerification {
  isValid: boolean;
  intactRecords: number;
  brokenAt?: number;
  details: string;
}

export class ProofChainEngine extends EventEmitter {
  private chain: ProofRecord[] = [];
  private readonly MAX_CHAIN_LENGTH = 10000;

  constructor() {
    super();
  }

  recordDecision(
    decision: string,
    confidence: number,
    factors: {
      quantumJitter: number;
      agentChaosTiming: number;
      energyDepletion: number;
      vitalityDrift: number;
      unexpectedEvent?: string;
    },
    reasoning: string,
    couldHaveChosen?: Array<{ route: string; probability: number }>,
  ): ProofRecord {
    const sequence = this.chain.length;
    const timestamp = Date.now();

    const previousHash =
      this.chain.length > 0 ? this.chain[this.chain.length - 1].currentHash : '';

    const recordContent = JSON.stringify({
      sequence,
      timestamp,
      decision,
      confidence,
      factors,
      reasoning,
      previousHash,
      couldHaveChosen,
    });

    const currentHash = this.computeHash(recordContent);

    const record: ProofRecord = {
      sequence,
      timestamp,
      decision,
      confidence,
      factors,
      reasoning,
      currentHash,
      previousHash,
      couldHaveChosen,
    };

    this.chain.push(record);

    if (this.chain.length > this.MAX_CHAIN_LENGTH) {
      this.chain = this.chain.slice(-this.MAX_CHAIN_LENGTH);
    }

    this.emit('record-added', record);
    return record;
  }

  verifyIntegrity(): ChainVerification {
    if (this.chain.length === 0) {
      return {
        isValid: true,
        intactRecords: 0,
        details: 'Empty chain (no records yet)',
      };
    }

    let intactRecords = 0;

    for (let i = 0; i < this.chain.length; i++) {
      const record = this.chain[i];

      const recordContent = JSON.stringify({
        sequence: record.sequence,
        timestamp: record.timestamp,
        decision: record.decision,
        confidence: record.confidence,
        factors: record.factors,
        reasoning: record.reasoning,
        previousHash: record.previousHash,
        couldHaveChosen: record.couldHaveChosen,
      });

      const computedHash = this.computeHash(recordContent);

      if (computedHash !== record.currentHash) {
        return {
          isValid: false,
          intactRecords,
          brokenAt: i,
          details: `Chain broken at record ${i}. Record was modified after creation.`,
        };
      }

      if (i > 0) {
        const previousRecord = this.chain[i - 1];
        if (record.previousHash !== previousRecord.currentHash) {
          return {
            isValid: false,
            intactRecords,
            brokenAt: i - 1,
            details: `Chain broken at record ${i - 1}. Previous record's hash changed.`,
          };
        }
      }

      intactRecords++;
    }

    return {
      isValid: true,
      intactRecords,
      details: `✅ Chain integrity verified: ${intactRecords} records, all intact.`,
    };
  }

  getChain(): ProofRecord[] {
    return [...this.chain];
  }

  getChainLength(): number {
    return this.chain.length;
  }

  getHeadHash(): string {
    return this.chain.length > 0 ? this.chain[this.chain.length - 1].currentHash : '';
  }

  exportChain(): string {
    return JSON.stringify(this.chain, null, 2);
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
