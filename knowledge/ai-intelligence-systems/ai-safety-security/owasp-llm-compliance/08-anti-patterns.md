# ECC Anti-Patterns — OWASP LLM Compliance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Knowledge Unit** | OWASP LLM Compliance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. OWASP LLM Top 10 Not Reviewed — Unaware of Risks
2. No LLM01 (Prompt Injection) Mitigation
3. No LLM02 (Insecure Output Handling) Mitigation
4. No LLM06 (Sensitive Information Disclosure) Protection
5. No LLM09 (Overreliance) Guardrails

---

## Repository-Wide Anti-Patterns

- OWASP LLM assessment never performed
- No security review specific to AI features

---

## Anti-Pattern 1: OWASP LLM Not Addressed

### Category
Security

### Description
Application uses LLM features without reviewing OWASP LLM Top 10 risks.

### Preferred Alternative
Review OWASP LLM Top 10. Implement mitigations for relevant risks. Document accepted risks.

### Detection Checklist
- [ ] OWASP LLM not reviewed
- [ ] No LLM-specific security controls
- [ ] Risks not documented

---

## Anti-Pattern 2: No LLM06 (Sensitive Information Disclosure)

### Category
Security

### Description
LLM returns sensitive information (PII, internal data, credentials) in responses.

### Preferred Alternative
Implement output sanitization to detect and redact sensitive information before returning to user.

### Detection Checklist
- [ ] PII in LLM output
- [ ] Internal data exposed
- [ ] No redaction mechanism
