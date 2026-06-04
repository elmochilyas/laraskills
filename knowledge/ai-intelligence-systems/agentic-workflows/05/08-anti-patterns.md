# ECC Anti-Patterns — Agent Output Validation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Output Validation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Schema Validation on Structured Agent Output
2. Trusting Structured Output Guarantee — No Server-Side Check
3. Not Handling Output Truncation (Finish Reason Checks)
4. Overly Complex Schema That Restricts Valid Outputs
5. No Retry on Invalid Output

---

## Repository-Wide Anti-Patterns

- Output validation errors not logged — hard to debug schema issues
- Same schema used for different output formats without adjustment

---

## Anti-Pattern 1: No Schema Validation on Output

### Category
Reliability

### Description
Agent returns structured output but application uses it without server-side validation.

### Preferred Alternative
Always validate agent output against the defined schema. Reject or retry on validation failure.

### Detection Checklist
- [ ] No validation on agent output
- [ ] Invalid output propagates to business logic
- [ ] Schema validation not implemented

---

## Anti-Pattern 2: Trusting Structured Output Guarantee

### Category
Reliability

### Description
Assuming provider structured output mode guarantees valid output — never server-checking.

### Preferred Alternative
Server-side validation is mandatory. Provider guarantee reduces but doesn't eliminate invalid output.

### Detection Checklist
- [ ] Provider guarantee trusted without validation
- [ ] No fallback for invalid output
- [ ] Production incidents from malformed output
