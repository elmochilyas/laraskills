---
id: ku-08
title: "Structured Output & JSON Mode"
subdomain: "llm-provider-abstraction"
ku-type: "capability"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-08/04-standardized-knowledge.md"
---

# Structured Output & JSON Mode

## Overview

Structured output (also called JSON mode or constrained decoding) is a provider capability that guarantees the LLM's response conforms to a specified JSON schema. This is critical for programmatic consumption of LLM outputs — parsing free-text responses is error-prone, but typed, structured responses can be validated and used directly. Different providers offer different levels of guaranteed structure: OpenAI's Structured Outputs use constrained decoding at the token level; others use schema-informed prompting with best-effort adherence.

## Core Concepts

- **JSON Mode:** The provider returns a JSON object (any valid JSON) instead of free text. No schema enforcement.
- **Structured Output:** The provider returns JSON that conforms to a specified JSON Schema. Token-level guarantee (OpenAI) or high-confidence (others).
- **Response Schema:** A JSON Schema definition that describes the expected response structure (fields, types, constraints, nested objects).
- **Schema Adherence Level:** The degree to which the provider guarantees schema compliance (token-level, post-processed, best-effort).
- **Schema Translation:** Converting the application's schema definition to provider-specific format (some providers use JSON Schema, others use function calling schemas).
- **Validation Layer:** Server-side validation that the response conforms to the schema, regardless of provider guarantees.
- **Fallback Parsing:** When structured output is not available or fails, parse free-text response with regex or secondary LLM call.

## When To Use

- API endpoints that return structured data (the caller expects typed JSON).
- Systems that process LLM output programmatically (extraction, classification, data transformation).
- Multi-step agent workflows where intermediate outputs must be machine-parseable.
- When response consistency is more important than creative variation.

## When NOT To Use

- Creative writing or conversational UI where free-text is expected.
- When the JSON schema changes frequently (schema updates need provider support).
- Applications with very simple output (single boolean or number) — prompt engineering may suffice.
- When the latency of structured output is unacceptable (some providers add processing time).

## Best Practices

- **Always validate the response server-side** against the schema. Provider guarantees are not absolute.
- **Define schemas with strict typing.** Use JSON Schema with `required`, `type`, `enum`, `minLength`/`maxLength` constraints.
- **Use enums for constrained fields** — they reduce hallucination and ensure valid values.
- **Keep schemas simple.** Deeply nested schemas (>3 levels) increase failure rates. Flatten where possible.
- **Provide fallback parsing.** When the provider returns invalid JSON or non-conforming JSON, parse from free-text.
- **Log schema adherence rate.** Track how often the provider returns schema-conforming output vs. needing correction.

## Architecture Guidelines

- Define response schemas as **PHP DTOs with JSON Schema annotations** (using PHP attributes or a schema builder).
- The schema translation layer should convert DTO attributes to provider-specific schema formats (OpenAI's `response_format`, Anthropic's tool-based structured output).
- Implement a **response validator** that checks the response against the schema immediately after receiving it.
- For fallback, use a **secondary LLM call** (cheaper model) to restructure the free-text response into the expected schema.
- Cache schema definitions per provider — translation is expensive (0.5-2ms) and schemas are static.

## Performance Considerations

- Structured output may add 200-1000ms latency (provider post-processes to enforce schema).
- Schema validation adds <0.5ms for typical schemas using a PHP JSON Schema validator.
- Fallback LLM call adds 500-3000ms latency. Use only when primary structured output fails.
- Schema translation is a one-time cost per schema (cache aggressively).
- Token consumption: structured output uses additional tokens for the schema definition in the system prompt (with best-effort providers).

## Security Considerations

- **Schema injection:** Never allow user input to influence the response schema directly (could lead to data exfiltration).
- **Schema validation:** Ensure the schema itself is valid and doesn't allow infinite recursion or excessive nesting.
- **Output validation:** Even with provider guarantees, validate the response server-side to catch edge cases.
- **Data type coercion:** Be explicit about number vs. string types to prevent subtle bugs.
- **Sensitive field handling:** Schemas should not include fields that would leak sensitive data if the model fills them in.

## Common Mistakes

- Relying solely on provider guarantees without server-side validation — guaranteed structured output is not 100% reliable.
- Using overly complex schemas (deep nesting, circular references) that the provider cannot enforce.
- Not handling the `refusal` case — the model may refuse to respond in structured format.
- Assuming all providers support the same JSON Schema features (some don't support `$ref`, `allOf`, `oneOf`).
- Not providing fallback for when structured output is unavailable — the application breaks when the model doesn't support it.

## Anti-Patterns

- **Schema-as-Specification:** Using the JSON Schema as the sole API contract without documenting it in natural language.
- **Over-Engineering Schemas:** 50-field response objects when 5 fields suffice. Each field increases failure probability.
- **No Refusal Handling:** The model may output `{"error": "I cannot answer that"}` in valid JSON but with an unexpected structure.
- **Schema Changes Without Migration:** Changing the response schema without handling old-format responses in the application.
- **Ignoring Provider Limitations:** Using `additionalProperties: false` when the provider doesn't support it.

## Examples

### Response Schema Definition
```php
class UserProfileExtraction {
    public function __construct(
        public readonly string $name,
        public readonly ?string $email,
        public readonly int $age,
        public readonly string $role, // 'admin', 'user', 'viewer'
    ) {}

    public static function schema(): array {
        return [
            'type' => 'object',
            'properties' => [
                'name' => ['type' => 'string'],
                'email' => ['type' => 'string', 'format' => 'email'],
                'age' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 150],
                'role' => ['type' => 'string', 'enum' => ['admin', 'user', 'viewer']],
            ],
            'required' => ['name', 'age', 'role'],
            'additionalProperties' => false,
        ];
    }
}
```

### Structured Output Client
```php
class StructuredOutputClient {
    public function extract(string $text, string $schemaClass): object {
        $schema = $schemaClass::schema();

        $response = $this->provider->chat(
            (new ChatRequest($this->buildPrompt($text)))
                ->withStructuredOutput($schema)
        );

        // Validate server-side
        $data = json_decode($response->content, true);
        $validator = new JsonSchemaValidator();
        if (!$validator->validate($data, $schema)) {
            // Fallback: retry with prompt-based extraction
            $data = $this->fallbackExtract($text, $schema);
        }

        return new $schemaClass(...$data);
    }
}
```

## Related Topics

- ku-03 (Provider-Specific Features): Structured output as a capability.
- ku-04 (Error Handling & Retry): Handling structured output failures.
- agent-architecture-orchestration/ku-05: Tool calling for structured output.
- prompt-engineering-systems/ku-04: Prompt patterns for structured responses.
- ai-middleware-gateway/ku-04: Response transformation and validation.

## AI Agent Notes

- When asked to implement structured output, first check which providers/models support it and at what adherence level.
- For structured output bugs, check: schema format (provider-specific), validation logic, and fallback parsing.
- Prefer reading the schema translation code before the response validation — the format conversion is where bugs appear.
- When generating structured output code, always include: schema definition, server-side validation, and fallback parsing.

## Verification

- [ ] Response schemas are defined as DTOs with JSON Schema generation.
- [ ] Structured output request uses the provider's native format (different per provider).
- [ ] Server-side validation is applied to every structured output response.
- [ ] Fallback parsing exists for when structured output fails or is unavailable.
- [ ] Schema adherence rate is tracked (percentage of responses conforming to schema).
- [ ] Refusal and error cases are handled gracefully.
- [ ] Schema is kept simple (max 3 levels of nesting, reasonable number of fields).
