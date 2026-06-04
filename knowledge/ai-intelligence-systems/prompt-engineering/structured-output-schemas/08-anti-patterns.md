# ECC Anti-Patterns — Structured Output Schemas (Prompt Engineering)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Structured Output Schemas |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Schema Not Included in System Prompt — LLM Guesses Output Format
2. Overly Complex Schema — LLM Can't Reliably Generate
3. Schema Without Examples — LLM Misunderstands Field Meanings
4. Schema Mismatch Between Prompt and Validation
5. No Fallback When LLM Fails to Match Schema

---

## Repository-Wide Anti-Patterns

- Schema fields not documented for prompt writers
- Schema breaking changes without prompt update

---

## Anti-Pattern 1: Schema Not in System Prompt

### Category
Reliability

### Description
JSON schema defined in code but never shown to LLM — LLM outputs unstructured text or guesses format.

### Preferred Alternative
Include schema description (field names, types, constraints) in the system prompt. Show example output.

### Detection Checklist
- [ ] Schema in code only
- [ ] LLM not instructed on format
- [ ] Improperly structured outputs

---

## Anti-Pattern 2: Overly Complex Schema

### Category
Reliability

### Description
Schema with deep nesting, `anyOf`, recursive definitions — LLM produces invalid structures.

### Preferred Alternative
Flatten schemas. Use simpler structures that the LLM can reliably produce.

### Detection Checklist
- [ ] Deep nested schema
- [ ] Complex JSON Schema features
- [ ] LLM output frequently fails validation
