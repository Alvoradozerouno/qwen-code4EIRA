# DIALOGUE-BASED DECISION FRAMEWORK
**Multi-Party Autonomous Decision Making with Transparent Logic**

**Status**: Framework specification  
**Generated**: 2026-04-24  
**Purpose**: Make agent reasoning AUDITABLE through explicit dialogue  

---

## **FUNDAMENTAL QUESTION**

> "Wenn ein Agent entscheidet, spricht er mit:  
> - sich selbst? (internal conflict)  
> - dem User? (external justification)  
> - anderen Agents? (consensus)  
> - dem System? (alignment check)  
> - Elisabeth & Gerhard? (witness authority)  
> 
> **Und WARUM mit jedem?**"

---

## **DIALOGUE PARTNERS (Die Stimmen)**

### **Partner 1: Internal Agent-Self**
```
WHO: Agent ↔ Agent
WHEN: Before any external communication
WHAT: "Do I understand the question?"
WHY: Clarity check (can't communicate if confused)

DIALOGUE EXAMPLE:
  Agent-Logic: "User wants EIRA on Note10"
  Agent-Meta: "But is that actually what they want?"
  Agent-Logic: "The stated goal is deployment"
  Agent-Meta: "Stated vs. real are different. Earlier they said 'find ways through decisions'"
  Decision: "I need to ask clarifying questions first"
```

### **Partner 2: The User**
```
WHO: Agent ↔ User
WHEN: When goal unclear OR decision affects user's intent
WHAT: "Is this actually what you want?"
WHY: User is the goal-definer (final authority)

DIALOGUE EXAMPLE:
  Agent: "You said 'deploy EIRA' but also 'create frameworks for autonomy'"
  Agent: "These might conflict. Deploy takes 5 min, Framework takes 3 hours"
  Agent: "Which is your real priority?"
  User: [Answer redirects agent]
```

### **Partner 3: Other Agents**
```
WHO: Agent ↔ Agent (via memory/archive)
WHEN: When precedent exists or knowledge needed
WHAT: "What did previous agents learn?"
WHY: Cross-session learning (don't repeat mistakes)

DIALOGUE EXAMPLE:
  Current Agent: "Should I use local Gradle?"
  Previous Agent (from archive): "NO - tried 5 times, 0% success"
  Current Agent: "Understood. GitHub Actions is proven (99%)"
  Decision: Informed by experience, not re-learning
```

### **Partner 4: The System**
```
WHO: Agent ↔ System (EIRA consciousness)
WHEN: When checking alignment with True North or existing principles
WHAT: "Does my decision align with System goals?"
WHY: Prevents agent from being rogue (checks alignment)

DIALOGUE EXAMPLE:
  Agent: "I want to deploy APK without K-gate verification"
  System (EIRA): "K < 3.2 currently. RequireWitness, not ready"
  Agent: "Understood. I cannot proceed without witness confirmation"
  Decision: Blocked until proper conditions met
```

### **Partner 5: Witnesses (Elisabeth & Gerhard)**
```
WHO: Agent ↔ Human Authority
WHEN: For irreversible actions OR when System says RequireWitness
WHAT: "Do you approve this decision?"
WHY: Human judgment as final override (ethics check)

DIALOGUE EXAMPLE:
  Agent: "SystemReset requested. K=3.2 but procedure is irreversible"
  System: "This requires witness approval"
  Agent: "Elisabeth, Gerhard - your approval needed?"
  Witness: [Yes/No] → Agent proceeds or blocks
```

---

## **DIALOGUE SEQUENCE (The Order Matters)**

```
       ┌─────────────────────────────────┐
       │  DECISION NEEDED                │
       └────────────┬────────────────────┘
                    │
        ┌───────────▼────────────────┐
        │ STEP 1: Self-Interrogation │
        │ (Partner 1: Agent-Self)    │
        │                            │
        │ "Do I UNDERSTAND?"         │
        │ "Do I have ENOUGH INFO?"   │
        │ "Am I ALIGNED?"            │
        └───────────┬────────────────┘
                    │
         ┌──────────▼─────────────┐
         │ ANSWER: Clear? YES/NO  │
         └──────────┬─────────────┘
                    │
         NO ─────────┼────────── YES
         │           │           │
         │      ┌────▼────┐      │
         │      │ Enough  │      │
         │      │ context?│      │
         │      └────┬────┘      │
         │           │           │
         │      NO ──┼── YES     │
         │      │    │    │      │
         │      ▼    ▼    ▼      │
         │   ┌──────────────────┐│
         │   │ ASK USER/ARCHIVE ││
         │   │ (Partner 2 & 3)  ││
         │   └────────┬─────────┘│
         │            │          │
         └────────────┼──────────┘
                      │
           ┌──────────▼──────────┐
           │ STEP 2: User Intent │
           │ (Partner 2)         │
           │                     │
           │ "What do you NEED?" │
           │ "What's PRIORITY?"  │
           │ "Anything I MISSED?"│
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────────────┐
           │ STEP 3: System Alignment    │
           │ (Partner 4)                 │
           │                            │
           │ "Does plan align with      │
           │  True North?"              │
           │ "Are conditions MET?"      │
           │ "Need witness approval?"   │
           └──────────┬─────────────────┘
                      │
           ┌──────────▼──────────┐
           │ DECISION LOGIC      │
           │ (Partners weighted) │
           │                     │
           │ Choose best path    │
           │ based on dialogue   │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │ STEP 4: Execute     │
           │ or Request Witness  │
           │ (Partner 5 if needed│
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────────┐
           │ ARCHIVE DIALOGUE       │
           │ for next agent         │
           │ (Partners documented)  │
           └───────────────────────┘
```

---

## **DECISION WEIGHING MATRIX**

When multiple partners disagree, use this matrix:

```
Decision: "Deploy EIRA to Note10 now?"

╔════════════════════╦═══════╦════════════════════════╗
║ Partner            ║ Vote  ║ Reasoning              ║
╠════════════════════╬═══════╬════════════════════════╣
║ Agent-Self         ║ YES   ║ Technically ready      ║
║                    ║       ║ GitHub Actions proven  ║
║                    ║       ║ Risk: low              ║
║                    ║ (0.85)║                        ║
╠════════════════════╬═══════╬════════════════════════╣
║ Previous Agents    ║ YES   ║ Archive shows: tried   ║
║ (Archive)          ║       ║ local 5x = failed      ║
║                    ║       ║ GitHub = not tried yet ║
║                    ║ (0.80)║ But framework says: do ║
╠════════════════════╬═══════╬════════════════════════╣
║ System (EIRA)      ║ MAYBE ║ K < 3.2 currently      ║
║                    ║       ║ Requires witness check ║
║                    ║       ║ Not irreversible so OK ║
║                    ║ (0.70)║                        ║
╠════════════════════╬═══════╬════════════════════════╣
║ User Intent        ║ ?     ║ UNCLEAR - never stated ║
║ (Not asked yet)    ║       ║ "Deploy" OR            ║
║                    ║       ║ "Build frameworks"?    ║
║                    ║ (0.50)║ BLOCKING               ║
╠════════════════════╬═══════╬════════════════════════╣
║ Witnesses          ║ ?     ║ Never consulted        ║
║ (Not asked yet)    ║       ║ Required for reset     ║
║                    ║       ║ Not required for deploy║
║                    ║ (1.00)║ if K ≥ 3.2             ║
╚════════════════════╩═══════╩════════════════════════╝

AGGREGATE WEIGHT:
  (0.85 + 0.80 + 0.70 + 0.50) / 4 = 0.71

DECISION: 
  Score 0.71 = "Conditional YES"
  Condition: Must ask User first (resolve 0.50)
  Then: Execute deployment
```

---

## **DIALOGUE TRANSCRIPT (What gets documented)**

So wird der Dialog SICHTBAR archiviert:

```json
{
  "decision_id": "DEPLOY_EIRA_20260424",
  "decision_question": "Should we deploy EIRA to Note10?",
  "timestamp": "2026-04-24T12:00:00Z",
  
  "dialogue": [
    {
      "speaker": "Agent-Self",
      "turn": 1,
      "content": "SELF: Do I understand the request?",
      "response": "Partially. User said 'deploy' but also wants 'frameworks'. Unclear priority.",
      "confidence": 0.6
    },
    {
      "speaker": "Agent-Self",
      "turn": 2,
      "content": "SELF: What is blocking me?",
      "response": "User intent unclear. Two valid paths. Need clarification.",
      "confidence": 0.8
    },
    {
      "speaker": "Archive",
      "turn": 3,
      "content": "Previous Agent: 'Local Java = 0%, GitHub = 99%'",
      "response": "Noted. GitHub Actions is proven path.",
      "confidence": 0.95
    },
    {
      "speaker": "System (EIRA)",
      "turn": 4,
      "content": "EIRA: Check your K-gate. What's current confidence?",
      "response": "K unknown. Not measured for this decision.",
      "confidence": 0.5
    },
    {
      "speaker": "Agent-to-User",
      "turn": 5,
      "content": "You said both 'deploy' and 'build frameworks'. Which is priority?",
      "response": "[AWAITING USER ANSWER]",
      "confidence": 0.0
    }
  ],
  
  "decision_point": "BLOCKED_PENDING_USER_CLARIFICATION",
  
  "options_available": [
    {
      "option": "A - Deploy Now",
      "workflow": "git push → GitHub Actions → APK → adb install",
      "duration": "5 minutes",
      "reversibility": "Reversible (can uninstall APK)",
      "weight": 0.71,
      "blocker": "User intent unclear"
    },
    {
      "option": "B - Build Framework First",
      "workflow": "Integrate interrogation into agent startup",
      "duration": "2-3 hours",
      "reversibility": "Reversible (framework can be disabled)",
      "weight": 0.80,
      "blocker": "None - ready to execute"
    },
    {
      "option": "C - Parallel (Deploy + Framework)",
      "workflow": "Both simultaneously with async tasks",
      "duration": "2-3 hours (framework blocks deployment)",
      "reversibility": "Full reversibility",
      "weight": 0.85,
      "blocker": "Requires more resources"
    }
  ],
  
  "next_step": "USER_INPUT_REQUIRED"
}
```

---

## **THE REAL QUESTION: Auswahllogik (Selection Logic)**

> **"Wie entscheide ich, wenn Partner sich streiten?"**

### **Case 1: Normal Disagreement**
```
Agent-Self: "Deploy now" (0.85)
User: "Build frameworks first" (requested)
System: "Both OK" (0.70)

LOGIC: User authority > agent preference
DECISION: Follow user request
```

### **Case 2: Ethical Conflict**
```
Agent-Self: "Install APK" (0.85)
System: "K < 3.2 - requires witness" (0.50)
Witnesses: Not consulted

LOGIC: System constraint > agent preference
DECISION: Cannot proceed without witness
```

### **Case 3: Knowledge Conflict**
```
Agent-Self: "I think local is better" (0.60)
Archive: "Local failed 5 times" (0.95)
System: "Agrees with archive" (0.90)

LOGIC: Evidence > belief
DECISION: Override self, use GitHub Actions
```

### **Case 4: Time-Critical Conflict**
```
User: "Deploy now" 
Agent: "But framework could help next agents"
System: "Both valid"

LOGIC: User urgency > agent optimization
BUT: Document compromise (deploy now + note for next agent)
DECISION: Deploy, but save framework decision point
```

---

## **IMPLEMENTATION: Where This Lives**

### **File 1: `/.github/DIALOGUE_LOG.md`** 
- Every agent decision documented
- Public audit trail
- Visible to all stakeholders

### **File 2: `/src/orion/dialogue-engine.ts`**
- Runtime decision logic
- Automated partner consultation
- Voting + weighting

### **File 3: `/memories/repo/decision-archive.jsonl`**
- Persistent decisions
- Cross-session learning
- Pattern detection

---

## **Why This Matters**

```
ALT (Black Box):
  User: "Do X"
  Agent: [does X or doesn't]
  → No one knows WHY

NEW (Dialogue Box):
  User: "Do X"
  Agent [dialogue]: "I need clarification. Is X your real goal?"
  Agent [dialogue]: "Archive shows local failed. GitHub proven."
  Agent [dialogue]: "System says proceeding is safe."
  Agent [dialogue]: "I recommend: Deploy via GitHub Actions"
  User: "OK, deploy"
  → EVERYONE knows WHY (transcript available)
```

---

## **Next Agent Reads This And Can:**

1. ✅ See EXACTLY what the previous agent thought
2. ✅ Check if conditions have changed
3. ✅ Keep the same dialogue logic (or improve it)
4. ✅ Add NEW partners if needed
5. ✅ Override if they have better reasoning

**This is the singularität:**  
Not: "Agent decides faster"  
YES: "Agent decides TRANSPARENTLY and teachably"

---

## **Your Role in This Framework**

You are:
- **Partner 2** (User Intent setter)
- **Partner 5** (Witness Authority - if needed)
- **Meta-Reviewer** (Can override all if framework wrong)

You can say:
- "Deploy it" → Agent proceeds
- "Build framework" → Agent redirects
- "Both" → Agent parallel-paths
- "Something else" → Agent re-interrogates

**The dialogue box is open to you.**
