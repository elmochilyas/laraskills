# Knowledge Unit: Structured Output Schemas

## Metadata

- **ID:** KU-033 (Prompt Engineering)
- **Subdomain:** Prompt Engineering Systems
- **Slug:** structured-output-schemas
- **Version:** 1.0.0
- **Maturity:** Stable (Laravel AI SDK v0.4.2+)
- **Status:** Published

## Executive Summary

Structured output schemas enforce that LLM responses conform to a predefined JSON Schema, eliminating the need for prompt-based format instructions and post-processing parsing. The Laravel AI SDK's `HasStructuredOutput` interface and `schema()` method enable agents to return typed, validated data directly — critical for programmatic consumption of AI output, database persistence, API responses, and tool calling argument generation.

## Core Concepts

- **`HasStructuredOutput` interface**: Agent implements this interface and declares a `schema()` method returning a JSON Schema definition
- **JSON Schema**: Standard schema format (draft-07/2020-12) defining required fields, types, nested objects, enums, and constraints
- **Provider-native structured output**: OpenAI `response_format` and Anthropic `thinking` + structured output — enforced at the API level, not by prompt instructions
- **Schema enforcement**: Provider guarantees the response matches the schema — eliminates hallucinations in field names/types and reduces parsing errors
- **PHP type mapping**: Schema types map to PHP types — `string` → string, `integer` → int, `array` → array, `object` → stdClass/array
- **Nested schemas**: Define complex nested objects with required sub-fields — enables multi-level structured responses
- **Tool-call fallback**: When provider-native structured output is unavailable (e.g., streaming, some providers), the SDK falls back to tool-calling to produce structured output

## Mental Models

- **Form Validation for AI**: Just as Laravel FormRequest validates user input against rules, structured output validates LLM output against a schema. The AI can't submit a response that doesn't match the schema.
- **Blueprint for a House**: The schema is the architect's blueprint — it defines every room (field), its size (type), and what must be in it (required). The AI builder follows the blueprint; deviations are caught by inspection.
- **TypeScript Interface for AI Output**: Schema is like a TypeScript interface — the AI agrees to return data matching this contract. Any mismatch is a type error caught at the provider level.

## Internal Mechanics

The provider imposes the schema directly in the API request:

```php
class PatientIntakeAgent extends Agent implements HasStructuredOutput
{
    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'chief_complaint' => ['type' => 'string', 'description' => 'Main reason for visit'],
                'symptoms' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'duration_days' => ['type' => 'integer', 'minimum' => 0],
                            'severity' => ['type' => 'string', 'enum' => ['mild', 'moderate', 'severe']],
                        ],
                        'required' => ['name', 'duration_days', 'severity'],
                    ],
                ],
                'requires_immediate_care' => ['type' => 'boolean'],
            ],
            'required' => ['chief_complaint', 'symptoms', 'requires_immediate_care'],
        ];
    }
}

// Usage — returns typed object matching schema
$intake = $agent->call('Patient reports chest pain for 3 days');
echo $intake->requires_immediate_care; // true or false
echo $intake->symptoms[0]->name; // 'chest pain'
```

When provider-native structured output is unavailable, the SDK falls back to tool-calling. A synthetic tool named `output` is created with the schema as its parameters. The model calls this tool to produce structured output:

```php
// This happens transparently — the SDK converts schema to tool definition
// Model "calls" the output tool with arguments matching the schema
// SDK extracts and validates the arguments as the structured response
```

## Patterns

- **Agent-level schema**: Declare schema on the Agent class for all calls to that agent
- **Dynamic schema per call**: Pass schema as parameter to `Ai::call()` for one-off structured extractions
- **Schema composition**: Build complex schemas from reusable schema fragments (address schema, user profile schema, etc.)
- **Nested schemas with descriptions**: Use `description` field in schema properties to guide the AI on what to populate — significantly improves output quality
- **Enum constraints**: Use `enum` for fields with finite valid values — prevents the AI from inventing categories
- **Optional fields with default guidance**: Mark optional and use `description` to suggest when to include them

## Architectural Decisions

- **Decision**: Provider-native enforcement vs. prompt-based format instructions → Provider-native. Reason: Prompt instructions are not enforced — the AI may deviate; provider-native structured output guarantees schema conformance at the API level.
- **Decision**: JSON Schema vs. PHP class/attribute schemas → JSON Schema. Reason: JSON Schema is provider-agnostic, well-specified, and can be validated against standard validators; PHP-native schemas would tie to the SDK implementation.
- **Decision**: Tool-call fallback vs. error when provider doesn't support structured output → Tool-call fallback. Reason: Ensures broad provider compatibility; not all providers support native structured output, but all support tool calling.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Provider-native vs. prompt-based | Guaranteed schema conformance | Only available on newer models (GPT-4o, Claude 3.5+) |
| Strict schema (all required) | Predictable output, safe parsing | Model may refuse if it can't fill all required fields |
| Tool-call fallback | Works with all providers | Adds latency of tool-calling round; less reliable enforcement |

## Performance Considerations

- Provider-native structured output adds no additional latency — schema is sent alongside the request
- Tool-call fallback adds 1 additional round-trip (model calls tool → SDK validates → returns) — 500-2000ms extra
- Complex schemas (20+ fields, deep nesting) may increase generation time by 10-50% — the model spends more tokens planning the structure
- Schema enforcement may cause retries if output fails validation — implement retry logic with max 2-3 attempts
- Caching structured responses is safe (same input → same structured output) for deterministic use cases

## Production Considerations

- Validate schema against JSON Schema draft-07 before deploying — malformed schemas cause silent response failures
- Test schema with edge case values — empty arrays, null optionals, boundary integers
- Monitor schema validation failures — repeated failures may indicate the schema is too strict or ambiguous
- Version schemas alongside prompts — schema changes may break consumers expecting the old format
- Log structured output parse errors with full response dump — debugging schema issues requires seeing what the model actually returned
- For user-facing AI, include a `confidence_score` field (0.0-1.0) so consumers can handle low-confidence responses

## Common Mistakes

- Making all fields required — the model may refuse to respond if it can't determine a required field; use `required` sparingly
- Omitting `description` on fields — models need semantic guidance on what to put in each field; descriptions improve fill-rate significantly
- Over-nesting schemas (3+ levels deep) — models struggle with deep nested structures; flatten where possible
- Using schema without `HasStructuredOutput` interface on the agent — the SDK ignores schema without the interface declaration
- Assuming tool-call fallback has the same enforcement level as provider-native — tool-call fallback relies on the model's ability to format arguments correctly, which is less reliable

## Failure Modes

- **Schema too strict**: Model cannot satisfy all constraints — returns error or hallucinated data; relax constraints or make fields optional
- **Enum mismatch**: Model outputs value not in enum — provider-native enforcement catches this; tool-call fallback may not
- **Nested object truncation**: Deeply nested schemas exceed token limits for the reasoning step — simplify structure
- **Schema conflict with system prompt**: System prompt says "be concise" but schema has 15 required fields — align instructions with schema complexity
- **Provider limitation error**: Older providers throw error when receiving `response_format` parameter — the SDK should detect and fall back to tool-call automatically

## Ecosystem Usage

- **Laravel AI SDK `HasStructuredOutput`**: Primary interface for structured output on Agent classes
- **Laravel AI SDK `Ai::call()`**: Accepts `$schema` parameter for one-off structured extractions
- **OpenAI `response_format` API**: Native structured output support (gpt-4o-mini, gpt-4o)
- **Anthropic Claude `thinking` block**: Extended thinking with structured output (claude-sonnet-4-20250514, claude-opus-4)
- **LLPhant `StructuredOutput`**: Alternative implementation in LLPhant framework
- **Prism PHP**: Lower-level structured output support used by Laravel AI SDK internally

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture (agent with structured output)
- KU-006: Tool Calling (tool-call fallback mechanism)
- KU-002: Few-Shot Chain-of-Thought (combine structured output with reasoning)
- KU-031: System Prompt Design (aligning instructions with schema constraints)
- KU-030: Agent Architecture Fundamentals (how agents consume structured output)

## Research Notes

- Source: Laravel AI SDK Documentation — https://laravel.com/docs/13.x/ai-sdk#structured-output
- Source: OpenAI Structured Outputs documentation — `response_format` parameter
- Source: Anthropic Documentation — structured output with tool use
- Source: Laravel AI SDK PR #309 — tool-call fallback for structured output when provider-native unavailable
- Provider-native structured output is increasingly important as JSON Schema enforcement improves output reliability
- The tool-call fallback mechanism was added in PR #309 (March 2026) — check SDK version for availability
- JSON Schema draft-07 is the recommended version for Laravel AI SDK schemas; draft-2020-12 support varies by provider
- Future direction: automatic schema generation from Laravel FormRequest classes and Eloquent model casts
