# Knowledge Unit: Structured Output with JSON Schema

## Metadata

- **ID:** KU-005
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** structured-output-json-schema
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Structured output ensures LLM responses conform to a defined JSON Schema. The Laravel AI SDK supports this via the `HasStructuredOutput` interface. Output is typed, validated, and accessible as array keys with declared types. Providers implement this differently: OpenAI uses `response_format` with JSON Schema, Anthropic uses tool-based extraction, Gemini uses `response_mime_type`.

## Core Concepts

- `HasStructuredOutput` interface: Agent declares `schema()` method returning a `JsonSchema` definition
- `JsonSchema` builder: Fluent API for defining properties, types, descriptions, and requirements
- Automatic parsing: SDK converts LLM response into typed PHP array matching schema
- Validation: SDK validates response against schema on receipt; throws on malformed output
- Provider-agnostic: Works across all providers supporting JSON Schema mode or tool-based extraction

## Mental Models

- **Form request validation for LLMs**: Like Laravel's form request validation — schema defines expected structure, SDK enforces it, application receives typed data.
- **TypeScript interface for AI**: Schema serves as TypeScript-style interface for unstructured LLM output — catch mismatches at parse time, not runtime.

## Internal Mechanics

When an agent implements `HasStructuredOutput`:
1. SDK calls `schema()` on agent instantiation
2. Converts `JsonSchema` definition to provider-specific format (OpenAI: `response_format`, Anthropic: tool definition, Gemini: `response_mime_type`)
3. Sends schema to provider as part of request
4. On response, extracts structured data from provider-specific response format
5. Validates against original schema — throws `SchemaValidationException` on mismatch
6. Returns typed array via `$response->data`

V0.4.2+ added tool-fallback structured output (PR #309) — providers without native JSON Schema support can use tool calling as fallback.

## Patterns

- **Schema-per-agent**: Each agent defines its own output schema in the `schema()` method
- **Schema reuse**: Define shared schemas as invokable classes or enums
- **Nested schemas**: `JsonSchema::object()` for nested structures within properties
- **Union types**: `JsonSchema::anyOf()` for flexible output shapes

## Architectural Decisions

- **Decision**: Server-side schema enforcement vs. client-side transformation → SDK enforces schema server-side by sending to provider. Reason: Prevents malformed output; client-side transformation would accept garbage.
- **Decision**: Fluent `JsonSchema` builder vs. raw array → Fluent API with autocomplete. Reason: Developer experience; type safety; validation at definition time.
- **Decision**: Tool-fallback for non-native providers (PR #309) → Uses tool calling as structured output mechanism. Reason: Broader provider support without sacrificing type safety.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Strict schema enforcement | Reliable typed output | Provider may fail if schema is too complex |
| Server-side schema definition | Single source of truth | Schema must be serializable for API transport |
| Automatic parsing | Zero boilerplate | Debugging raw responses harder when validation fails |

## Performance Considerations

- Schema definitions add to prompt token count — keep schemas concise for cost efficiency
- Provider-side JSON Schema parsing adds 100-500ms latency vs. free text
- Complex nested schemas increase failure rates — prefer flat schemas with 5-10 fields

## Production Considerations

- Always define `description` on schema fields — improves LLM accuracy significantly
- Use `required()` for mandatory fields — optional fields degrade extraction reliability
- Enforce `maxLength` on string fields — prevent LLM from generating novel-length responses
- Handle `SchemaValidationException` gracefully — log raw response for debugging
- Version your schemas — breaking changes require prompt/agent updates

## Common Mistakes

- Omitting field descriptions — LLM fills fields with plausible but incorrect data
- Overly complex nested schemas — provider JSON Schema parser may reject or LLM may fail to follow
- Assuming all providers support the same JSON Schema features — OpenAI supports `$defs`, Anthropic does not
- Not handling schema validation failures — application receives unexpected data shapes silently

## Failure Modes

- **Schema too complex**: Provider returns 400 — flatten structure or split into multiple agent calls
- **LLM ignores schema**: Returns valid JSON but doesn't follow instructions — add few-shot examples to instructions
- **Provider schema limitations**: Anthropic recursive schema depth limited — use shallow nesting for Anthropic
- **Missing fields**: LLM omits optional fields — make critical fields required or provide defaults

## Ecosystem Usage

- Data extraction from documents, emails, support tickets
- Structured classification and categorization
- Form generation from natural language descriptions
- Multi-agent handoff — structured output from one agent feeds as input to another

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-002: Multi-Provider Text Generation
- KU-006: Tool Calling
- KU-047: Structured Output Schemas

## Research Notes

- Laravel AI SDK uses `response_format` with `json_schema` type for OpenAI, tool-based for Anthropic
- v0.4.2+ added structured output with tool fallback for providers without native JSON Schema support
- JsonSchema builder supports: string, number, integer, boolean, array, object, enum, anyOf, allOf, ref
- Anthropic tool-based structured output has better accuracy than JSON mode in some benchmarks
