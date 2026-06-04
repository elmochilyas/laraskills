---
id: KU-005
title: "Structured Output with JSON Schema"
subdomain: "laravel-ai-sdk"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/02-laravel-ai-sdk/structured-output-json-schema/04-standardized-knowledge.md"
---

# Structured Output with JSON Schema

## Overview

Structured output ensures LLM responses conform to a defined JSON Schema. The Laravel AI SDK supports this via the `HasStructuredOutput` interface. Output is typed, validated, and accessible as array keys with declared types. Providers implement this differently: OpenAI uses `response_format` with JSON Schema, Anthropic uses tool-based extraction, Gemini uses `response_mime_type`.

## Core Concepts

- `HasStructuredOutput` interface: Agent declares `schema()` method returning a `JsonSchema` definition
- `JsonSchema` builder: Fluent API for defining properties, types, descriptions, and requirements
- Automatic parsing: SDK converts LLM response into typed PHP array matching schema
- Validation: SDK validates response against schema on receipt; throws on malformed output
- Provider-agnostic: Works across all providers supporting JSON Schema mode or tool-based extraction

## When To Use

- Production applications requiring Structured Output with JSON Schema functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Schema-per-agent**: Each agent defines its own output schema in the `schema()` method
- **Schema reuse**: Define shared schemas as invokable classes or enums
- **Nested schemas**: `JsonSchema::object()` for nested structures within properties
- **Union types**: `JsonSchema::anyOf()` for flexible output shapes

- **Form request validation for LLMs**: Like Laravel's form request validation â€” schema defines expected structure, SDK enforces it, application receives typed data.
- **TypeScript interface for AI**: Schema serves as TypeScript-style interface for unstructured LLM output â€” catch mismatches at parse time, not runtime.

## Architecture Guidelines

- **Decision**: Server-side schema enforcement vs. client-side transformation â†’ SDK enforces schema server-side by sending to provider. Reason: Prevents malformed output; client-side transformation would accept garbage.
- **Decision**: Fluent `JsonSchema` builder vs. raw array â†’ Fluent API with autocomplete. Reason: Developer experience; type safety; validation at definition time.
- **Decision**: Tool-fallback for non-native providers (PR #309) â†’ Uses tool calling as structured output mechanism. Reason: Broader provider support without sacrificing type safety.

## Performance Considerations

- Schema definitions add to prompt token count â€” keep schemas concise for cost efficiency
- Provider-side JSON Schema parsing adds 100-500ms latency vs. free text
- Complex nested schemas increase failure rates â€” prefer flat schemas with 5-10 fields

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Strict schema enforcement | Reliable typed output | Provider may fail if schema is too complex |
| Server-side schema definition | Single source of truth | Schema must be serializable for API transport |
| Automatic parsing | Zero boilerplate | Debugging raw responses harder when validation fails |

## Security Considerations

- Always define `description` on schema fields â€” improves LLM accuracy significantly
- Use `required()` for mandatory fields â€” optional fields degrade extraction reliability
- Enforce `maxLength` on string fields â€” prevent LLM from generating novel-length responses
- Handle `SchemaValidationException` gracefully â€” log raw response for debugging
- Version your schemas â€” breaking changes require prompt/agent updates

## Common Mistakes

- Omitting field descriptions â€” LLM fills fields with plausible but incorrect data
- Overly complex nested schemas â€” provider JSON Schema parser may reject or LLM may fail to follow
- Assuming all providers support the same JSON Schema features â€” OpenAI supports `$defs`, Anthropic does not
- Not handling schema validation failures â€” application receives unexpected data shapes silently

## Anti-Patterns

- **Schema too complex**: Provider returns 400 â€” flatten structure or split into multiple agent calls
- **LLM ignores schema**: Returns valid JSON but doesn't follow instructions â€” add few-shot examples to instructions
- **Provider schema limitations**: Anthropic recursive schema depth limited â€” use shallow nesting for Anthropic
- **Missing fields**: LLM omits optional fields â€” make critical fields required or provide defaults

## Examples

The following ecosystem packages provide reference implementations:

- Data extraction from documents, emails, support tickets
- Structured classification and categorization
- Form generation from natural language descriptions
- Multi-agent handoff â€” structured output from one agent feeds as input to another

## Related Topics

- KU-001: Laravel AI SDK Architecture
- KU-002: Multi-Provider Text Generation
- KU-006: Tool Calling
- KU-047: Structured Output Schemas

## AI Agent Notes

- When asked about Structured Output with JSON Schema, first determine the specific use case and requirements.
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

