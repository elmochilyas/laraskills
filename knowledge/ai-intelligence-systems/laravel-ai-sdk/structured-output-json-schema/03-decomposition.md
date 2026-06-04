# Decomposition: Structured Output with JSON Schema

## Topic Overview
Structured output ensures LLM responses conform to a defined JSON Schema. The Laravel AI SDK supports this via the `HasStructuredOutput` interface. Output is typed, validated, and accessible as array keys with declared types. Providers implement this differently: OpenAI uses `response_format` with JSON Schema, Anthropic uses tool-based extraction, Gemini uses `response_mime_type`.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-structured-output-json-schema/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Structured Output with JSON Schema
- **Purpose:** Structured output ensures LLM responses conform to a defined JSON Schema. The Laravel AI SDK supports this via the `HasStructuredOutput` interface. Output is typed, validated, and accessible as array keys with declared types. Providers implement this differently: OpenAI uses `response_format` with JSON Schema, Anthropic uses tool-based extraction, Gemini uses `response_mime_type`.
- **Difficulty:** Intermediate
- **Dependencies:** KU-001, KU-002, KU-006, KU-047

## Dependency Graph
**Depends on:**
- KU-001
- KU-002
- KU-006
- KU-047

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- HasStructuredOutput
- JsonSchema
- Automatic parsing
- Validation
- Provider-agnostic

**Out of scope:**
- KU-001 topics covered in their respective KUs
- KU-002 topics covered in their respective KUs
- KU-006 topics covered in their respective KUs
- KU-047 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization