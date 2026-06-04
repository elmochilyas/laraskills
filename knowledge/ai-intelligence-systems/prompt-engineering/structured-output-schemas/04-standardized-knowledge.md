---
id: KU-033 (Prompt Engineering)
title: "Structured Output Schemas"
subdomain: "prompt-engineering"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/10-prompt-engineering/structured-output-schemas/04-standardized-knowledge.md"
---

# Structured Output Schemas

## Overview

Structured output schemas enforce that LLM responses conform to a predefined JSON Schema, eliminating the need for prompt-based format instructions and post-processing parsing. The Laravel AI SDK's `HasStructuredOutput` interface and `schema()` method enable agents to return typed, validated data directly â€” critical for programmatic consumption of AI output, database persistence, API responses, and tool calling argument generation.

## Core Concepts

- **`HasStructuredOutput` interface**: Agent implements this interface and declares a `schema()` method returning a JSON Schema definition
- **JSON Schema**: Standard schema format (draft-07/2020-12) defining required fields, types, nested objects, enums, and constraints
- **Provider-native structured output**: OpenAI `response_format` and Anthropic `thinking` + structured output â€” enforced at the API level, not by prompt instructions
- **Schema enforcement**: Provider guarantees the response matches the schema â€” eliminates hallucinations in field names/types and reduces parsing errors
- **PHP type mapping**: Schema types map to PHP types â€” `string` â†’ string, `integer` â†’ int, `array` â†’ array, `object` â†’ stdClass/array
- **Nested schemas**: Define complex nested objects with required sub-fields â€” enables multi-level structured responses
- **Tool-call fallback**: When provider-native structured output is unavailable (e.g., streaming, some providers), the SDK falls back to tool-calling to produce structured output

## When To Use

- Production applications requiring Structured Output Schemas functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Agent-level schema**: Declare schema on the Agent class for all calls to that agent
- **Dynamic schema per call**: Pass schema as parameter to `Ai::call()` for one-off structured extractions
- **Schema composition**: Build complex schemas from reusable schema fragments (address schema, user profile schema, etc.)
- **Nested schemas with descriptions**: Use `description` field in schema properties to guide the AI on what to populate â€” significantly improves output quality
- **Enum constraints**: Use `enum` for fields with finite valid values â€” prevents the AI from inventing categories
- **Optional fields with default guidance**: Mark optional and use `description` to suggest when to include them

- **Form Validation for AI**: Just as Laravel FormRequest validates user input against rules, structured output validates LLM output against a schema. The AI can't submit a response that doesn't match the schema.
- **Blueprint for a House**: The schema is the architect's blueprint â€” it defines every room (field), its size (type), and what must be in it (required). The AI builder follows the blueprint; deviations are caught by inspection.
- **TypeScript Interface for AI Output**: Schema is like a TypeScript interface â€” the AI agrees to return data matching this contract. Any mismatch is a type error caught at the provider level.

## Architecture Guidelines

- **Decision**: Provider-native enforcement vs. prompt-based format instructions â†’ Provider-native. Reason: Prompt instructions are not enforced â€” the AI may deviate; provider-native structured output guarantees schema conformance at the API level.
- **Decision**: JSON Schema vs. PHP class/attribute schemas â†’ JSON Schema. Reason: JSON Schema is provider-agnostic, well-specified, and can be validated against standard validators; PHP-native schemas would tie to the SDK implementation.
- **Decision**: Tool-call fallback vs. error when provider doesn't support structured output â†’ Tool-call fallback. Reason: Ensures broad provider compatibility; not all providers support native structured output, but all support tool calling.

## Performance Considerations

- Provider-native structured output adds no additional latency â€” schema is sent alongside the request
- Tool-call fallback adds 1 additional round-trip (model calls tool â†’ SDK validates â†’ returns) â€” 500-2000ms extra
- Complex schemas (20+ fields, deep nesting) may increase generation time by 10-50% â€” the model spends more tokens planning the structure
- Schema enforcement may cause retries if output fails validation â€” implement retry logic with max 2-3 attempts
- Caching structured responses is safe (same input â†’ same structured output) for deterministic use cases

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Provider-native vs. prompt-based | Guaranteed schema conformance | Only available on newer models (GPT-4o, Claude 3.5+) |
| Strict schema (all required) | Predictable output, safe parsing | Model may refuse if it can't fill all required fields |
| Tool-call fallback | Works with all providers | Adds latency of tool-calling round; less reliable enforcement |

## Security Considerations

- Validate schema against JSON Schema draft-07 before deploying â€” malformed schemas cause silent response failures
- Test schema with edge case values â€” empty arrays, null optionals, boundary integers
- Monitor schema validation failures â€” repeated failures may indicate the schema is too strict or ambiguous
- Version schemas alongside prompts â€” schema changes may break consumers expecting the old format
- Log structured output parse errors with full response dump â€” debugging schema issues requires seeing what the model actually returned
- For user-facing AI, include a `confidence_score` field (0.0-1.0) so consumers can handle low-confidence responses

## Common Mistakes

- Making all fields required â€” the model may refuse to respond if it can't determine a required field; use `required` sparingly
- Omitting `description` on fields â€” models need semantic guidance on what to put in each field; descriptions improve fill-rate significantly
- Over-nesting schemas (3+ levels deep) â€” models struggle with deep nested structures; flatten where possible
- Using schema without `HasStructuredOutput` interface on the agent â€” the SDK ignores schema without the interface declaration
- Assuming tool-call fallback has the same enforcement level as provider-native â€” tool-call fallback relies on the model's ability to format arguments correctly, which is less reliable

## Anti-Patterns

- **Schema too strict**: Model cannot satisfy all constraints â€” returns error or hallucinated data; relax constraints or make fields optional
- **Enum mismatch**: Model outputs value not in enum â€” provider-native enforcement catches this; tool-call fallback may not
- **Nested object truncation**: Deeply nested schemas exceed token limits for the reasoning step â€” simplify structure
- **Schema conflict with system prompt**: System prompt says "be concise" but schema has 15 required fields â€” align instructions with schema complexity
- **Provider limitation error**: Older providers throw error when receiving `response_format` parameter â€” the SDK should detect and fall back to tool-call automatically

## Examples

The following ecosystem packages provide reference implementations:

- **Laravel AI SDK `HasStructuredOutput`**: Primary interface for structured output on Agent classes
- **Laravel AI SDK `Ai::call()`**: Accepts `$schema` parameter for one-off structured extractions
- **OpenAI `response_format` API**: Native structured output support (gpt-4o-mini, gpt-4o)
- **Anthropic Claude `thinking` block**: Extended thinking with structured output (claude-sonnet-4-20250514, claude-opus-4)
- **LLPhant `StructuredOutput`**: Alternative implementation in LLPhant framework
- **Prism PHP**: Lower-level structured output support used by Laravel AI SDK internally

## Related Topics

- KU-001: Laravel AI SDK Architecture (agent with structured output)
- KU-006: Tool Calling (tool-call fallback mechanism)
- KU-002: Few-Shot Chain-of-Thought (combine structured output with reasoning)
- KU-031: System Prompt Design (aligning instructions with schema constraints)
- KU-030: Agent Architecture Fundamentals (how agents consume structured output)

## AI Agent Notes

- When asked about Structured Output Schemas, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

