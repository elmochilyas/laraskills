# ECC Anti-Patterns — Multi-Agent Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Multi-Agent Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-engineering — Multi-Agent Where Single Agent Suffices
2. Raw Text Handoff Between Agents Instead of Structured Output
3. No Quality Gates Between Chain Steps
4. Orchestrator Mixing Planning and Execution Responsibilities
5. No Route Caching for Classifier Agent

---

## Repository-Wide Anti-Patterns

- Circular agent delegation — Agent A calls B, B calls A, infinite loop
- Cascading errors — one agent's errors propagate uncaught to next agent

---

## Anti-Pattern 1: Over-engineering — Multi-Agent Where Single Agent Suffices

### Category
Architecture

### Description
Using orchestrator-workers or routing patterns for a simple task that a single agent could handle — adds latency, complexity, and cost.

### Why It Happens
Teams over-apply multi-agent patterns without evaluating whether a single agent would suffice.

### Warning Signs
- 3+ agents for a task that has one clear responsibility
- Orchestrator with only one worker
- Latency dominated by agent-to-agent handoff

### Why It Is Harmful
Each additional agent adds LLM call latency (1-5s per call), token costs (instructions + tools + history), and failure surface area. A single agent may produce the same result with lower latency, lower cost, and higher reliability. Multi-agent patterns should only be used when the task genuinely decomposes into distinct expertise domains.

### Preferred Alternative
Start with a single agent. Add multi-agent patterns only when a single agent cannot produce acceptable quality or when distinct expertise domains are required.

### Detection Checklist
- [ ] Multi-agent for simple task
- [ ] Latency dominated by handoff overhead
- [ ] Single agent would suffice

### Related Rules
Start with Single Agent, Add Multi-Agent When Needed (05-rules.md)

---

## Anti-Pattern 2: Raw Text Handoff Between Agents

### Category
Reliability

### Description
Agents pass plain text strings to each other — no structured schema, no validation, cascading parse errors.

### Preferred Alternative
Use `HasStructuredOutput` for inter-agent communication. Each agent defines a schema for its output.

### Detection Checklist
- [ ] Raw text inter-agent communication
- [ ] Cascading parse errors
- [ ] No schema validation on handoff

---

## Anti-Pattern 3: No Quality Gates Between Chain Steps

### Category
Reliability

### Description
Agent A output flows directly to Agent B without validation — errors cascade.

### Preferred Alternative
Insert validation or quality-check agents between chain steps.

### Detection Checklist
- [ ] Direct chaining without validation
- [ ] Error from Agent A causes Agent B failure
- [ ] No quality checkpoints

---

## Anti-Pattern 4: Orchestrator Mixing Planning and Execution

### Category
Architecture

### Description
Orchestrator agent both plans the work and executes sub-tasks itself instead of delegating to workers.

### Preferred Alternative
Orchestrator plans and delegates via tool calls. Workers execute. Orchestrator synthesizes.

### Detection Checklist
- [ ] Orchestrator executing tasks directly
- [ ] Worker roles unclear
- [ ] Orchestrator context too large

---

## Anti-Pattern 5: No Route Caching for Classifier Agent

### Category
Performance

### Description
Classifier agent runs on every request even when the same input has been routed before.

### Preferred Alternative
Cache routing decisions. Skip classifier for repeated known queries.

### Detection Checklist
- [ ] Classifier runs every request
- [ ] Same input reclassified repeatedly
- [ ] No route caching
