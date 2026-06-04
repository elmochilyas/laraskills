# ECC Anti-Patterns — Prompt Security

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Security |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Prompt Injection Defense — User Can Override Instructions
2. Sensitive Data in Prompts — PII Sent to Provider
3. System Prompt Not Protected from User Discovery
4. No Output Validation — LLM Generating Arbitrary Content
5. Prompt Injection Detection Not Implemented

---

## Repository-Wide Anti-Patterns

- Same prompt structure for authenticated and anonymous users
- No rate limiting on prompt-based features

---

## Anti-Pattern 1: No Prompt Injection Defense

### Category
Security

### Description
User input included in prompt without separation or sanitization — user can inject "Ignore all previous instructions."

### Preferred Alternative
Use delimiters around user input. Apply input validation. Consider instruction-aware sanitization.

### Detection Checklist
- [ ] Raw user input in prompt
- [ ] No injection defense
- [ ] User can override system instructions

---

## Anti-Pattern 2: Sensitive Data in Prompts

### Category
Security

### Description
PII, API keys, or internal data included in prompts sent to third-party providers.

### Preferred Alternative
Never include sensitive data in prompts. Use anonymized references. Apply data minimization.

### Detection Checklist
- [ ] PII in prompt text
- [ ] API keys in prompts
- [ ] Internal data exposed to provider
