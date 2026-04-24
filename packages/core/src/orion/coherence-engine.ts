/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 *
 * COHERENCE ENGINE
 * 
 * Problem: System decides differently with same input → appears arbitrary/random
 * Solution: Track decision justification over time
 * 
 * Key: Non-determinism ≠ Irrationality
 *      Different decisions are LOGICALLY CONSISTENT with different uncertainty sources
 */

import { EventEmitter } from 'node:events';

export interface DecisionJustification {
  timestamp: number;
  decision: string;
  uncertainty: number;
  factors: {
    quantumJitter: number;
    agentChaosTiming: number;
    energyDepletion: number;
    vitalityDrift: number;
    unexpectedEvent?: string;
  };
  confidence: number;
  reasoning: string;
}

export interface CoherenceAnalysis {
  isCoherent: boolean;
  score: number;
  explanation: string;
  decisions: DecisionJustification[];
  factorShifts: {
    whatChanged: string;
    from: number;
    to: number;
    impact: 'high' | 'medium' | 'low';
  }[];
}

export class CoherenceEngine extends EventEmitter {
  private decisionHistory: DecisionJustification[] = [];
  private readonly MAX_HISTORY = 100;

  constructor() {
    super();
  }

  recordDecision(
    decision: string,
    uncertainty: number,
    factors: {
      quantumJitter: number;
      agentChaosTiming: number;
      energyDepletion: number;
      vitalityDrift: number;
      unexpectedEvent?: string;
    },
    confidence: number,
    reasoning: string,
  ): DecisionJustification {
    const justification: DecisionJustification = {
      timestamp: Date.now(),
      decision,
      uncertainty,
      factors,
      confidence,
      reasoning,
    };

    this.decisionHistory.push(justification);

    if (this.decisionHistory.length > this.MAX_HISTORY) {
      this.decisionHistory = this.decisionHistory.slice(-this.MAX_HISTORY);
    }

    this.emit('decision-recorded', justification);
    return justification;
  }

  canJustifyDecision(justification: DecisionJustification): boolean {
    if (justification.confidence < 0.3) {
      return false;
    }

    const { quantumJitter, agentChaosTiming, energyDepletion, vitalityDrift } =
      justification.factors;

    const totalUncertainty =
      quantumJitter + agentChaosTiming + energyDepletion + vitalityDrift;

    if (totalUncertainty > 0.5 && justification.confidence > 0.7) {
      return false;
    }

    if (justification.factors.unexpectedEvent) {
      if (justification.confidence < 0.4) {
        return true;
      }
    }

    if (justification.factors.energyDepletion > 0.1 && justification.confidence > 0.8) {
      return false;
    }

    return true;
  }

  getHistory(): DecisionJustification[] {
    return [...this.decisionHistory];
  }

  clearHistory(): void {
    this.decisionHistory = [];
  }
}
