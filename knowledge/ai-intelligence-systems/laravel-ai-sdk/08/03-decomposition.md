# Decomposition: Structured Output & JSON Mode

## Topic Overview

Structured output (also called JSON mode or constrained decoding) is a provider capability that guarantees the LLM's response conforms to a specified JSON schema. This is critical for programmatic consumption of LLM outputs â€” parsing free-text responses is error-prone, but typed, structured responses can be validated and used directly. Different providers offer different levels of guaranteed structure: OpenAI's Structured Outputs use constrained decoding at the token level; others use schema-informed prompting with best-effort adherence.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-08/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Structured Output & JSON Mode
- **Purpose:** Structured output (also called JSON mode or constrained decoding) is a provider capability that guarantees the LLM's response conforms to a specified JSON schema. This is critical for programmatic consumption of LLM outputs â€” parsing free-text responses is error-prone, but typed, structured responses can be validated and used directly. Different providers offer different levels of guaranteed structure: OpenAI's Structured Outputs use constrained decoding at the token level; others use schema-informed prompting with best-effort adherence.
- **Difficulty:** Intermediate
- **Dependencies:** ku-03, ku-04, ku-05, ku-04, ku-04

## Dependency Graph
**Depends on:**
- ku-03
- ku-04
- ku-05
- ku-04
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **JSON Mode:** The provider returns a JSON object (any valid JSON) instead of free text. No schema enforcement.
- **Structured Output:** The provider returns JSON that conforms to a specified JSON Schema. Token-level guarantee (OpenAI) or high-confidence (others).
- **Response Schema:** A JSON Schema definition that describes the expected response structure (fields, types, constraints, nested objects).
- **Schema Adherence Level:** The degree to which the provider guarantees schema compliance (token-level, post-processed, best-effort).
- **Schema Translation:** Converting the application's schema definition to provider-specific format (some providers use JSON Schema, others use function calling schemas).
- **Validation Layer:** Server-side validation that the response conforms to the schema, regardless of provider guarantees.
- **Fallback Parsing:** When structured output is not available or fails, parse free-text response with regex or secondary LLM call.

**Out of scope:**
- ku-03 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

