# ECC Anti-Patterns — Structured Output with JSON Schema

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Structured Output with JSON Schema |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Trusting LLM Structured Output Without Server-Side Validation
2. Using Complex Nested JSON Schema Beyond Provider Capabilities
3. No Fallback When Provider Doesn't Support Structured Output
4. Overly Permissive Schema That Defeats the Purpose
5. Not Caching Schema Definitions

---

## Repository-Wide Anti-Patterns

- Ignoring `finish_reason` — structured output may have been truncated or filtered
- Provider-specific schema format differences ignored

---

## Anti-Pattern 1: Trusting LLM Structured Output Without Server-Side Validation

### Category
Security

### Description
Assuming the provider's structured output guarantee means the response is always valid — using it without server-side validation.

### Why It Happens
Developers believe structured output mode guarantees perfect JSON compliance.

### Warning Signs
- No JSON validation after structured output
- No schema validation on the parsed response
- Production failures from invalid structured output

### Why It Is Harmful
Even with structured output mode, providers may return malformed JSON, truncated responses (reaching token limits), or content-filtered responses where the structure is corrupted. Server-side validation catches these cases, logs them, and triggers a retry or fallback. Without validation, malformed output propagates to the application, causing data corruption or runtime exceptions.

### Preferred Alternative
Always validate structured output against the schema server-side. Use a validation library to verify types, required fields, and constraints.

### Detection Checklist
- [ ] No server-side schema validation
- [ ] Trusting provider's structured output guarantee
- [ ] Unhandled invalid structured responses

### Related Rules
Validate Structured Output Server-Side (05-rules.md)

---

## Anti-Pattern 2: Using Complex Nested JSON Schema Beyond Provider Capabilities

### Category
Reliability

### Description
Schema with deep nesting, `anyOf`, `if/then/else`, or recursive definitions that the provider's structured output mode doesn't support.

### Preferred Alternative
Use simple, flat schemas that match provider capabilities. Test schema complexity limits per provider.

### Detection Checklist
- [ ] Complex nested schemas
- [ ] JSON Schema features beyond provider support
- [ ] Schema validation fails on provider side

---

## Anti-Pattern 3: No Fallback When Provider Doesn't Support Structured Output

### Category
Reliability

### Description
Application requires structured output but doesn't check `supports()` or implement a client-side fallback.

### Preferred Alternative
Check `supports(Capability::StructuredOutput)`. Fall back to requesting plain text and validating JSON client-side.

### Detection Checklist
- [ ] No `supports()` check
- [ ] Provider switch breaks structured output
- [ ] No fallback path

---

## Anti-Pattern 4: Overly Permissive Schema

### Category
Architecture

### Description
Schema with minimum constraints (all-optional fields, `additionalProperties: true`) — LLM output is valid JSON but has no useful structure.

### Preferred Alternative
Define required fields, type constraints, and enums. Restrict `additionalProperties` to false.

### Detection Checklist
- [ ] All fields optional
- [ ] `additionalProperties: true`
- [ ] No type constraints
- [ ] Valid but semantically useless output

---

## Anti-Pattern 5: Not Caching Schema Definitions

### Category
Performance

### Description
Re-building JSON Schema arrays on every agent prompt — redundant serialization overhead.

### Preferred Alternative
Define schemas as static properties or cached config. Reuse across prompts.

### Detection Checklist
- [ ] Schema built per request
- [ ] Redundant serialization
- [ ] Static schema not cached
