# ECC Anti-Patterns — Prompt Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Assuming LLM Understands Implicit Context
2. No Input Validation Before Prompt Construction
3. Prompt Template Injection — User Input Breaks Prompt Structure
4. Hardcoded Prompts for All Locales
5. No Prompt Testing — Unknown Quality

---

## Repository-Wide Anti-Patterns

- Prompts not optimized for token efficiency
- No prompt performance baseline

---

## Anti-Pattern 1: Assuming LLM Understands Implicit Context

### Category
Reliability

### Description
Prompt assumes LLM knows business-specific context, recent events, or proprietary terminology.

### Preferred Alternative
Provide all necessary context in the prompt. Never assume LLM training data covers your domain specifics.

### Detection Checklist
- [ ] Assumes LLM knows business context
- [ ] Missing domain-specific information
- [ ] Wrong answers due to lack of context

---

## Anti-Pattern 2: Prompt Template Injection

### Category
Security

### Description
User input directly interpolated into prompt template — user can inject instructions that override system prompt.

### Preferred Alternative
Sanitize user input. Use delimiters to separate user input from instructions. Validate input before prompt construction.

### Detection Checklist
- [ ] Raw user input in prompt
- [ ] No input sanitization
- [ ] Injection attack possible
