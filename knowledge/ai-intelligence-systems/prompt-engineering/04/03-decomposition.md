# Decomposition: Structured Output Prompting

## Topic Overview

Structured output prompting is the practice of designing prompts that reliably produce machine-parseable, schema-conforming output from LLMs. While provider-side structured output (JSON mode, constrained decoding) provides guarantees, prompt-based structure remains essential for providers that don't support native structured output, as a fallback, and for controlling output format beyond what schemas can express. This KU covers prompt patterns that reliably produce structured outputs across models and providers.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-04/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Structured Output Prompting
- **Purpose:** Structured output prompting is the practice of designing prompts that reliably produce machine-parseable, schema-conforming output from LLMs. While provider-side structured output (JSON mode, constrained decoding) provides guarantees, prompt-based structure remains essential for providers that don't support native structured output, as a fallback, and for controlling output format beyond what schemas can express. This KU covers prompt patterns that reliably produce structured outputs across models and providers.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-08, ku-05, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-08
- ku-05
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Format Specification:** Explicitly describing the expected output format in the prompt (JSON schema, markdown template, XML structure).
- **Schema Embedding:** Including the JSON Schema or type definition in the prompt for the model to follow.
- **Example-Driven Formatting:** Providing input-output examples that demonstrate the exact desired format.
- **Delimiter-Based Structure:** Using delimiters (```json, <output>, |---|) to define structural boundaries.
- **Output Constraints:** Specifying constraints on the output (field types, allowed values, required fields, nesting limits).
- **Fallback Formatting:** When primary structured output fails, using a secondary prompt to parse or reformat the output.
- **Self-Correction:** Prompting the model to validate and correct its own output against the format specification.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-08 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
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

