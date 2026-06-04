# ECC Anti-Patterns — PII Pseudonymization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Knowledge Unit** | PII Pseudonymization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Raw PII Sent to LLM Provider — Compliance Violation
2. No PII Detection Before Prompt Construction
3. Pseudonymization Not Reversible for Debugging
4. Same Pseudonym for All Users — Cross-User Correlation
5. No PII Logging Controls — Pseudonymized Data in Logs

---

## Repository-Wide Anti-Patterns

- No PII audit — unknown what PII reaches provider
- Pseudonymization not tested against re-identification

---

## Anti-Pattern 1: Raw PII Sent to Provider

### Category
Security

### Description
User names, emails, addresses, or other PII included in prompts sent to third-party LLM providers.

### Preferred Alternative
Detect and pseudonymize PII before prompt construction. Use placeholders instead of actual values.

### Detection Checklist
- [ ] Raw PII in prompts
- [ ] No PII detection
- [ ] Compliance violation risk

---

## Anti-Pattern 2: No Reversible Pseudonymization

### Category
Maintainability

### Description
PII replaced with irreversible hashes — can't map back for debugging or context restoration.

### Preferred Alternative
Use reversible pseudonymization (encrypted mapping) for debugging. Restore original values in response.

### Detection Checklist
- [ ] Irreversible pseudonymization
- [ ] Can't debug with real data
- [ ] No mapping table
