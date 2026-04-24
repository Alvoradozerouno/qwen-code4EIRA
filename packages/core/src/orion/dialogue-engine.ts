/**
 * DIALOGUE-BASED AUTONOMOUS DECISION ENGINE
 *
 * Multi-party negotiation framework for agent decisions.
 * Each decision involves 5 potential partners:
 * 1. Agent-Self (internal logic)
 * 2. User (intent authority)
 * 3. Archive (historical precedent)
 * 4. System (EIRA alignment)
 * 5. Witnesses (human override)
 *
 * Dialogue is transparent, logged, and auditable.
 */

import * as fs from 'fs';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Partner = 'agent-self' | 'user' | 'archive' | 'system' | 'witnesses';
type Vote = 'YES' | 'NO' | 'MAYBE' | 'BLOCKED' | 'PENDING';

interface DialogueTurn {
  speaker: Partner;
  timestamp: string;
  query: string;
  reasoning: string;
  vote: Vote;
  confidence: number; // 0-1
  dependencies?: string[]; // What this depends on
}

interface DecisionContext {
  decision_id: string;
  question: string;
  options: DecisionOption[];
  timestamp: string;
  initiated_by: 'user' | 'agent' | 'system';
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface DecisionOption {
  id: string;
  name: string;
  description: string;
  estimated_duration: string;
  reversibility: 'full' | 'partial' | 'irreversible';
  risks: string[];
  benefits: string[];
}

interface DialogueResult {
  decision_id: string;
  dialogue: DialogueTurn[];
  recommended_option: string;
  aggregate_weight: number;
  blockers: string[];
  next_step: 'PROCEED' | 'BLOCKED' | 'ASK_USER' | 'AWAIT_WITNESS';
  transcript: string[]; // Human-readable
}

// ─── DIALOGUE ENGINE ────────────────────────────────────────────────────────

export class DialogueEngine {
  private dialogueLog: DialogueTurn[] = [];
  private archivePath: string;

  constructor(archivePath: string = './DIALOGUE_ARCHIVE.jsonl') {
    this.archivePath = archivePath;
  }

  /**
   * STEP 1: Agent questions itself
   * Input: Question, context
   * Output: Self-assessment
   */
  async consultAgentSelf(
    decision: DecisionContext,
    agentContext: any,
  ): Promise<DialogueTurn> {
    const turn: DialogueTurn = {
      speaker: 'agent-self',
      timestamp: new Date().toISOString(),
      query: `Do I understand "${decision.question}"?`,
      reasoning: this.generateSelfReasoning(decision, agentContext),
      vote: this.castSelfVote(decision, agentContext),
      confidence: this.calculateSelfConfidence(decision, agentContext),
    };

    this.dialogueLog.push(turn);
    console.log(
      `[AGENT-SELF] ${turn.reasoning} (confidence: ${turn.confidence})`,
    );
    return turn;
  }

  /**
   * STEP 2: Consult archive (previous agent decisions)
   */
  async consultArchive(question: string): Promise<DialogueTurn> {
    const precedent = this.searchPrecedent(question);

    const turn: DialogueTurn = {
      speaker: 'archive',
      timestamp: new Date().toISOString(),
      query: `Has a similar decision happened before?`,
      reasoning: precedent
        ? `FOUND: "${precedent.decision}" - Result: ${precedent.outcome}`
        : `NO precedent found for this decision type`,
      vote: precedent ? (precedent.successful ? 'YES' : 'NO') : 'MAYBE',
      confidence: precedent ? 0.95 : 0.3,
      dependencies: precedent ? [precedent.decision_id] : [],
    };

    this.dialogueLog.push(turn);
    console.log(`[ARCHIVE] ${turn.reasoning}`);
    return turn;
  }

  /**
   * STEP 3: Check System (EIRA) alignment
   */
  async consultSystem(
    decision: DecisionContext,
    systemState: any,
  ): Promise<DialogueTurn> {
    const kThreshold = 3.2;
    const currentK = systemState.K || 0;
    const aligned = currentK >= kThreshold;

    const turn: DialogueTurn = {
      speaker: 'system',
      timestamp: new Date().toISOString(),
      query: `Is this decision aligned with EIRA principles?`,
      reasoning:
        currentK >= kThreshold
          ? `K = ${currentK.toFixed(1)} ≥ ${kThreshold}. PROVEN state. Proceeding is safe.`
          : `K = ${currentK.toFixed(1)} < ${kThreshold}. ABSTAIN state. RequireWitness.`,
      vote: aligned ? 'YES' : 'BLOCKED',
      confidence: 0.95,
      dependencies: ['K-gate-check'],
    };

    this.dialogueLog.push(turn);
    console.log(`[SYSTEM] ${turn.reasoning}`);
    return turn;
  }

  /**
   * STEP 4: Request user input if blocked
   */
  async askUser(question: string, options: string[]): Promise<DialogueTurn> {
    console.log(`\n[⏸️  AWAITING USER INPUT]`);
    console.log(`Question: ${question}`);
    console.log(`Options:`);
    options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));

    const turn: DialogueTurn = {
      speaker: 'user',
      timestamp: new Date().toISOString(),
      query: question,
      reasoning: 'User authority required to disambiguate',
      vote: 'PENDING',
      confidence: 0.0, // Will be updated when user responds
    };

    this.dialogueLog.push(turn);
    return turn;
  }

  /**
   * STEP 5: Calculate aggregate weight
   */
  calculateAggregateWeight(): number {
    // Filter out PENDING votes
    const decidedTurns = this.dialogueLog.filter((t) => t.vote !== 'PENDING');

    if (decidedTurns.length === 0) return 0;

    // Convert votes to numbers
    const voteValue: { [key in Vote]: number } = {
      YES: 1.0,
      MAYBE: 0.5,
      NO: 0.0,
      BLOCKED: -1.0, // Prevents execution
      PENDING: 0.5,
    };

    const sum = decidedTurns.reduce(
      (acc, turn) => acc + voteValue[turn.vote] * turn.confidence,
      0,
    );

    return sum / decidedTurns.length;
  }

  /**
   * STEP 6: Determine next step
   */
  determineNextStep(): 'PROCEED' | 'BLOCKED' | 'ASK_USER' | 'AWAIT_WITNESS' {
    const hasBlocked = this.dialogueLog.some((t) => t.vote === 'BLOCKED');
    const hasPending = this.dialogueLog.some((t) => t.vote === 'PENDING');
    const weight = this.calculateAggregateWeight();

    if (hasBlocked) {
      const blocker = this.dialogueLog.find((t) => t.vote === 'BLOCKED');
      console.log(`\n[🚫 BLOCKED] ${blocker?.speaker}: ${blocker?.reasoning}`);
      return 'BLOCKED';
    }

    if (hasPending) {
      console.log(`\n[⏸️  PENDING] Awaiting user/witness input`);
      return 'ASK_USER';
    }

    if (weight >= 0.7) {
      console.log(`\n[✅ PROCEED] Weight ${weight.toFixed(2)} ≥ 0.70`);
      return 'PROCEED';
    }

    if (weight >= 0.4) {
      console.log(
        `\n[❓ MAYBE] Weight ${weight.toFixed(2)} in uncertain range`,
      );
      return 'ASK_USER';
    }

    console.log(`\n[❌ BLOCKED] Weight ${weight.toFixed(2)} too low`);
    return 'BLOCKED';
  }

  /**
   * STEP 7: Generate transcript for humans
   */
  generateTranscript(): string[] {
    const lines: string[] = [];

    lines.push(`# DECISION DIALOGUE TRANSCRIPT`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(``);

    const speakerLabels: { [key in Partner]: string } = {
      'agent-self': '🤖 AGENT (Internal Logic)',
      user: '👤 USER (Intent Authority)',
      archive: '📚 ARCHIVE (Historical Precedent)',
      system: '⚙️  SYSTEM (EIRA Alignment)',
      witnesses: '👁️  WITNESSES (Human Authority)',
    };

    this.dialogueLog.forEach((turn, idx) => {
      lines.push(`## Turn ${idx + 1}: ${speakerLabels[turn.speaker]}`);
      lines.push(`**Time**: ${turn.timestamp}`);
      lines.push(
        `**Vote**: ${turn.vote} (confidence: ${(turn.confidence * 100).toFixed(0)}%)`,
      );
      lines.push(``);
      lines.push(`**Query**: ${turn.query}`);
      lines.push(``);
      lines.push(`**Reasoning**:`);
      lines.push(`> ${turn.reasoning}`);
      lines.push(``);
    });

    const weight = this.calculateAggregateWeight();
    const nextStep = this.determineNextStep();

    lines.push(`---`);
    lines.push(`## SUMMARY`);
    lines.push(`- **Aggregate Weight**: ${weight.toFixed(2)}/1.0`);
    lines.push(`- **Next Step**: ${nextStep}`);
    lines.push(
      `- **Dialogue Partners**: ${this.dialogueLog.map((t) => t.speaker).join(', ')}`,
    );

    return lines;
  }

  /**
   * STEP 8: Archive decision for future agents
   */
  async archiveDecision(
    decision: DecisionContext,
    result: DialogueResult,
  ): Promise<void> {
    const record = {
      decision_id: decision.decision_id,
      timestamp: decision.timestamp,
      question: decision.question,
      recommendation: result.recommended_option,
      weight: result.aggregate_weight,
      next_step: result.next_step,
      dialogue_count: result.dialogue.length,
      blockers: result.blockers,
      transcript_preview: result.transcript.slice(0, 15).join('\n'),
    };

    fs.appendFileSync(this.archivePath, JSON.stringify(record) + '\n');

    console.log(`\n[📝 ARCHIVED] Decision saved to ${this.archivePath}`);
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────

  private generateSelfReasoning(
    decision: DecisionContext,
    context: any,
  ): string {
    const hasPriorKnowledge = !!context.previousDecisions?.[decision.question];
    const hasBlockers = context.blockers?.length > 0;

    if (hasBlockers) {
      return `I understand the question, but there are blockers: ${context.blockers.join(', ')}`;
    }

    if (hasPriorKnowledge) {
      return `I've seen this before. Previous approach: ${context.previousDecisions[decision.question].method}`;
    }

    return `I understand the question. Ready to proceed if other parties agree.`;
  }

  private castSelfVote(decision: DecisionContext, context: any): Vote {
    if (context.blockers?.includes('blocked-by-rule')) return 'BLOCKED';
    if (context.urgency === 'critical') return 'YES';
    if (decision.options.length === 0) return 'BLOCKED';
    return 'YES';
  }

  private calculateSelfConfidence(
    decision: DecisionContext,
    context: any,
  ): number {
    let confidence = 0.5;
    if (decision.initiated_by === 'user') confidence += 0.2;
    if (context.previousDecisions?.[decision.question]) confidence += 0.25;
    if (context.blockers?.length === 0) confidence += 0.1;
    return Math.min(1, confidence);
  }

  private searchPrecedent(question: string): any {
    if (!fs.existsSync(this.archivePath)) return null;

    const lines = fs
      .readFileSync(this.archivePath, 'utf-8')
      .split('\n')
      .filter((l) => l);
    const relevant = lines
      .map((l) => JSON.parse(l))
      .find((record) => record.question.includes(question.split(' ')[0]));

    return relevant || null;
  }
}

// ─── EXAMPLE USAGE ───────────────────────────────────────────────────────

export async function exampleDecision() {
  const engine = new DialogueEngine('./DIALOGUE_ARCHIVE.jsonl');

  const decision: DecisionContext = {
    decision_id: 'DEPLOY_EIRA_20260424',
    question: 'Should we deploy EIRA to Note10?',
    options: [
      {
        id: 'deploy-now',
        name: 'Deploy Now',
        description: 'GitHub Actions → APK → adb install',
        estimated_duration: '5 minutes',
        reversibility: 'full',
        risks: ['Might not work on Note10'],
        benefits: ['Proof of concept achieved'],
      },
      {
        id: 'build-framework',
        name: 'Build Framework First',
        description: 'Integrate interrogation system',
        estimated_duration: '3 hours',
        reversibility: 'full',
        risks: ['Delays deployment'],
        benefits: ['Better future decisions'],
      },
    ],
    timestamp: new Date().toISOString(),
    initiated_by: 'user',
    urgency: 'medium',
  };

  const agentContext = {
    blockers: [],
    previousDecisions: {
      DEPLOY: {
        method: 'GitHub Actions',
        success: 'pending',
      },
    },
  };

  const systemState = {
    K: 3.5, // > 3.2 threshold
  };

  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  DIALOGUE-BASED DECISION ENGINE       ║`);
  console.log(`║  Decision: "${decision.question}"  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);

  // RUN DIALOGUE
  await engine.consultAgentSelf(decision, agentContext);
  await engine.consultArchive(decision.question);
  await engine.consultSystem(decision, systemState);

  const nextStep = engine.determineNextStep();
  const weight = engine.calculateAggregateWeight();

  console.log(`\n────────────────────────────────────────`);
  console.log(`DECISION RESULT:`);
  console.log(
    `  Recommendation: ${
      nextStep === 'PROCEED' ? 'PROCEED WITH DEPLOYMENT' : 'BLOCKED - ASK USER'
    }`,
  );
  console.log(`  Aggregate Weight: ${weight.toFixed(2)}`);
  console.log(`────────────────────────────────────────\n`);

  // GENERATE TRANSCRIPT
  const transcript = engine.generateTranscript();
  transcript.forEach((line) => console.log(line));

  // ARCHIVE
  const result: DialogueResult = {
    decision_id: decision.decision_id,
    dialogue: [],
    recommended_option: nextStep === 'PROCEED' ? 'deploy-now' : 'ask-user',
    aggregate_weight: weight,
    blockers: [],
    next_step: nextStep,
    transcript,
  };

  await engine.archiveDecision(decision, result);
}

// Run example
// exampleDecision().catch(console.error);
