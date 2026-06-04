# ECC Anti-Patterns — System Prompt Design

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | System Prompt Design |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Vague System Prompts — LLM Guesses Role and Tone
2. Overly Long System Prompts Wasting Context Window
3. Contradictory Instructions in System Prompt
4. System Prompt Not Versioned — No Rollback on Regressions
5. No Negative Instructions — What NOT to Do

---

## Repository-Wide Anti-Patterns

- System prompt mixed with user message
- Same system prompt for all agents regardless of task

---

## Anti-Pattern 1: Vague System Prompts

### Category
Reliability

### Description
"You are a helpful assistant" — LLM has no specific guidance on tone, constraints, or output format.

### Preferred Alternative
Specify: role, task description, constraints, output format, edge case handling, examples.

### Detection Checklist
- [ ] Generic system prompt
- [ ] Inconsistent output quality
- [ ] No specific instructions

---

## Anti-Pattern 2: Overly Long System Prompts

### Category
Cost Management

### Description
System prompt consumes 50%+ of context window — limited space for user input and retrieval results.

### Preferred Alternative
Keep system prompt concise. Move examples to few-shot section, details to retrieval context.

### Detection Checklist
- [ ] System prompt >2000 tokens
- [ ] Context dominated by instructions
- [ ] Little space for actual input
