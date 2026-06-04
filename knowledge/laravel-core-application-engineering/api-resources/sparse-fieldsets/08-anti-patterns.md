# ECC Anti-Patterns — Sparse Fieldsets

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Sparse Fieldsets |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Sparse Fieldsets Without Requested Field Validation
2. Database-Level Selection Without Required Keys (Relations Break)
3. Using Sparse Fieldsets on Internal APIs (Unnecessary Complexity)
4. Inconsistent Default Field Sets Across Resources

---

## Repository-Wide Anti-Patterns

- Premature Optimization (sparse fieldsets when response size is not a concern)

---

## Anti-Pattern 1: Sparse Fieldsets Without Requested Field Validation

### Category
Security | Reliability

### Description
Accepting any value in the `fields[type]` parameter without validation, allowing clients to request non-existent fields or fields used for internal logic.

### Why It Happens
The developer implements field filtering but skips validation because "the client knows what it wants."

### Warning Signs
- Any string in `fields[type]` is accepted
- Invalid fields return `null` or trigger errors in `toArray()`
- Internal model accessors are accidentally exposed through field names

### Preferred Alternative
Validate requested fields against an allowed list. Reject invalid fields with 400.

### Related Rules
- Rule: Validate Requested Fields Against an Allowed List
