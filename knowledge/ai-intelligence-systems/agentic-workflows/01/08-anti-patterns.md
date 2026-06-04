# ECC Anti-Patterns — Agent Prompting & Instructions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Prompting & Instructions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Vague Instructions — LLM Guesses Intent
2. Instructions Contradicting Each Other
3. Instructions Mixed with Conversation Context
4. No Output Format Specification
5. Instructions Longer Than Model Context Window

---

## Repository-Wide Anti-Patterns

- Instructions not versioned — no tracking of prompt changes
- Instructions duplicated across agent classes

---

## Anti-Pattern 1: Vague Instructions

### Category
Reliability

### Description
Instructions like "Help the user" without specifics about tone, scope, constraints, or output format.

### Preferred Alternative
Write precise instructions covering: role, task, constraints, output format, edge cases, examples.

### Detection Checklist
- [ ] Instructions are generic/vague
- [ ] LLM output inconsistent
- [ ] No constraints defined

---

## Anti-Pattern 2: Contradicting Instructions

### Category
Reliability

### Description
Instructions say both "be concise" and "provide detailed analysis" — LLM cannot satisfy both.

### Preferred Alternative
Ensure instructions are consistent and non-contradictory. Test with multiple inputs.

### Detection Checklist
- [ ] Conflicting requirements in instructions
- [ ] LLM output oscillates between styles
- [ ] No consistency in responses
