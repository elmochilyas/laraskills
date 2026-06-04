# ECC Anti-Patterns — Structured Output (JSON Schema)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Structured Output (JSON Schema) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Server-Side Validation After Structured Output
2. Nested Schema Beyond Provider Capabilities
3. No Fallback for Unsupported Structured Output
4. Overly Permissive Schema — Defeats Purpose
5. Uncached Schema Definitions

---

## Repository-Wide Anti-Patterns

- Ignoring finish_reason — truncated structured output goes undetected
- Same schema complexity across all providers despite capability differences

---

## Anti-Pattern 1: No Server-Side Validation

### Category
Security

### Description
Trusting provider structured output guarantee — no validation of returned JSON against schema.

### Why It Happens
Believing structured output mode guarantees perfect compliance.

### Warning Signs
- No JSON validation after structured output
- Malformed output propagates to application
- Truncated structured output undetected

### Why It Is Harmful
Providers may return malformed JSON, truncated responses (token limit), or content-filtered output where structure is corrupted. Server-side validation catches these cases and triggers retry/fallback. Without validation, malformed output causes data corruption or runtime exceptions downstream.

### Preferred Alternative
Always validate structured output against the schema server-side using a validation library.

### Detection Checklist
- [ ] No server-side schema validation
- [ ] Trusting provider guarantee
- [ ] Unhandled invalid responses

### Related Rules
Validate Structured Output Server-Side (05-rules.md)
