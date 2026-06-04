# ECC Anti-Patterns — Output Guarding & Validation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Knowledge Unit** | Output Guarding & Validation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Output Validation — LLM Output Trusted Unconditionally
2. No Content Moderation — Harmful Content Reaches Users
3. No PII Detection in LLM Output
4. Output Used Directly in SQL/HTML Without Sanitization
5. No Output Length Limits — Massive Output DOS

---

## Repository-Wide Anti-Patterns

- Output validation not logged — can't detect patterns
- No output encoding for different contexts (HTML, SQL, JSON)

---

## Anti-Pattern 1: No Output Validation

### Category
Security

### Description
LLM output used directly without validation — prompt injection may produce malicious output.

### Preferred Alternative
Validate LLM output against schema, content policy, and expected format before using.

### Detection Checklist
- [ ] No output validation
- [ ] LLM output trusted
- [ ] Injection output reaches users

---

## Anti-Pattern 2: Output Used Directly in SQL/HTML

### Category
Security

### Description
LLM output inserted into SQL query or HTML without sanitization — injection attack vector.

### Preferred Alternative
Sanitize LLM output for the target context. Use parameterized queries. Escape HTML.

### Detection Checklist
- [ ] LLM output in SQL query
- [ ] LLM output in HTML
- [ ] No context-aware sanitization
