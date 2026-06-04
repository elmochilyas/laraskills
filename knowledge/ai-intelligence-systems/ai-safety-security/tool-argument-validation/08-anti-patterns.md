# ECC Anti-Patterns — Tool Argument Validation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Knowledge Unit** | Tool Argument Validation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Schema Validation for Tool Arguments
2. Accepting Arbitrary Arguments From LLM — Injection Vector
3. Tool Arguments Not Sanitized Before Use
4. No Type Validation — String Expected But Array Passed
5. No Max Length on String Arguments — Buffer Overflow

---

## Repository-Wide Anti-Patterns

- Tool arguments not logged for audit
- Validation errors not returned to LLM gracefully

---

## Anti-Pattern 1: No Schema Validation

### Category
Security

### Description
Tool `handle()` accepts arguments without validating structure, types, or constraints.

### Preferred Alternative
Validate tool arguments against defined JSON Schema before execution. Reject invalid arguments.

### Detection Checklist
- [ ] No argument validation
- [ ] Invalid arguments reach handle()
- [ ] Schema validation missing

---

## Anti-Pattern 2: Accepting Arbitrary Arguments

### Category
Security

### Description
Tool accepts dynamic parameters from LLM without defining expected schema — LLM can pass anything.

### Preferred Alternative
Define explicit argument schema with required fields, types, and constraints. Reject unknown parameters.

### Detection Checklist
- [ ] No defined argument schema
- [ ] LLM can pass arbitrary args
- [ ] Injection vector
