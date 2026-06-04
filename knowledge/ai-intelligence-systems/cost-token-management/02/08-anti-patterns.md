# ECC Anti-Patterns — Cost Optimization Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Cost & Token Management |
| **Knowledge Unit** | Cost Optimization Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Always Using Most Expensive Model for All Tasks
2. No Prompt Compression — Redundant Tokens in Every Request
3. No Caching for Repeated LLM Queries
4. Long Instructions Sent on Every Prompt — No Instruction Caching
5. No Model Tiering — Same Model for Simple and Complex Tasks

---

## Repository-Wide Anti-Patterns

- No cost optimization review cycle
- Token optimization not part of development process

---

## Anti-Pattern 1: Always Using Most Expensive Model

### Category
Cost Management

### Description
Using GPT-4 or Claude Opus for every request including simple classification or translation tasks.

### Preferred Alternative
Tier models: cheap/small for simple tasks, expensive/large for complex reasoning. Route by task complexity.

### Detection Checklist
- [ ] Expensive model for all tasks
- [ ] No model tiering
- [ ] Simple tasks overpaying

---

## Anti-Pattern 2: No Prompt Compression

### Category
Cost Management

### Description
Instructions include verbose boilerplate repeated on every request — unnecessary tokens.

### Preferred Alternative
Compress instructions: remove redundancy, use concise language, cache instructions when possible.

### Detection Checklist
- [ ] Verbose instructions
- [ ] Repeated boilerplate
- [ ] No compression effort
