# Knowledge Unit: Structured Output & JSON Mode

## Metadata

- **ID:** ku-08
- **Subdomain:** Laravel AI SDK
- **Slug:** structured-output---json-mode
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Structured output (also called JSON mode or constrained decoding) is a provider capability that guarantees the LLM's response conforms to a specified JSON schema. This is critical for programmatic consumption of LLM outputs â€” parsing free-text responses is error-prone, but typed, structured responses can be validated and used directly. Different providers offer different levels of guaranteed structure: OpenAI's Structured Outputs use constrained decoding at the token level; others use schema-informed prompting with best-effort adherence.

## Core Concepts

- **JSON Mode:** The provider returns a JSON object (any valid JSON) instead of free text. No schema enforcement.
- **Structured Output:** The provider returns JSON that conforms to a specified JSON Schema. Token-level guarantee (OpenAI) or high-confidence (others).
- **Response Schema:** A JSON Schema definition that describes the expected response structure (fields, types, constraints, nested objects).
- **Schema Adherence Level:** The degree to which the provider guarantees schema compliance (token-level, post-processed, best-effort).
- **Schema Translation:** Converting the application's schema definition to provider-specific format (some providers use JSON Schema, others use function calling schemas).
- **Validation Layer:** Server-side validation that the response conforms to the schema, regardless of provider guarantees.
- **Fallback Parsing:** When structured output is not available or fails, parse free-text response with regex or secondary LLM call.

## Mental Models

- **JSON Mode:** The provider returns a JSON object (any valid JSON) instead of free text. No schema enforcement.
- **Structured Output:** The provider returns JSON that conforms to a specified JSON Schema. Token-level guarantee (OpenAI) or high-confidence (others).
- **Response Schema:** A JSON Schema definition that describes the expected response structure (fields, types, constraints, nested objects).


## Internal Mechanics

The internal mechanics of Structured Output & JSON Mode follow established patterns within the Laravel AI SDK domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Always validate the response server-side** against the schema. Provider guarantees are not absolute.
- **Define schemas with strict typing.** Use JSON Schema with `required`, `type`, `enum`, `minLength`/`maxLength` constraints.
- **Use enums for constrained fields** â€” they reduce hallucination and ensure valid values.
- **Keep schemas simple.** Deeply nested schemas (>3 levels) increase failure rates. Flatten where possible.
- **Provide fallback parsing.** When the provider returns invalid JSON or non-conforming JSON, parse from free-text.
- **Log schema adherence rate.** Track how often the provider returns schema-conforming output vs. needing correction.

## Patterns

- **Always validate the response server-side** against the schema. Provider guarantees are not absolute.
- **Define schemas with strict typing.** Use JSON Schema with `required`, `type`, `enum`, `minLength`/`maxLength` constraints.
- **Use enums for constrained fields** â€” they reduce hallucination and ensure valid values.
- **Keep schemas simple.** Deeply nested schemas (>3 levels) increase failure rates. Flatten where possible.
- **Provide fallback parsing.** When the provider returns invalid JSON or non-conforming JSON, parse from free-text.
- **Log schema adherence rate.** Track how often the provider returns schema-conforming output vs. needing correction.

## Architectural Decisions

- Define response schemas as **PHP DTOs with JSON Schema annotations** (using PHP attributes or a schema builder).
- The schema translation layer should convert DTO attributes to provider-specific schema formats (OpenAI's `response_format`, Anthropic's tool-based structured output).
- Implement a **response validator** that checks the response against the schema immediately after receiving it.
- For fallback, use a **secondary LLM call** (cheaper model) to restructure the free-text response into the expected schema.
- Cache schema definitions per provider â€” translation is expensive (0.5-2ms) and schemas are static.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Structured output may add 200-1000ms latency (provider post-processes to enforce schema).
- Schema validation adds <0.5ms for typical schemas using a PHP JSON Schema validator.
- Fallback LLM call adds 500-3000ms latency. Use only when primary structured output fails.
- Schema translation is a one-time cost per schema (cache aggressively).
- Token consumption: structured output uses additional tokens for the schema definition in the system prompt (with best-effort providers).

## Production Considerations

- **Schema injection:** Never allow user input to influence the response schema directly (could lead to data exfiltration).
- **Schema validation:** Ensure the schema itself is valid and doesn't allow infinite recursion or excessive nesting.
- **Output validation:** Even with provider guarantees, validate the response server-side to catch edge cases.
- **Data type coercion:** Be explicit about number vs. string types to prevent subtle bugs.
- **Sensitive field handling:** Schemas should not include fields that would leak sensitive data if the model fills them in.

## Common Mistakes

- Relying solely on provider guarantees without server-side validation â€” guaranteed structured output is not 100% reliable.
- Using overly complex schemas (deep nesting, circular references) that the provider cannot enforce.
- Not handling the `refusal` case â€” the model may refuse to respond in structured format.
- Assuming all providers support the same JSON Schema features (some don't support `$ref`, `allOf`, `oneOf`).
- Not providing fallback for when structured output is unavailable â€” the application breaks when the model doesn't support it.

## Failure Modes

- **Schema-as-Specification:** Using the JSON Schema as the sole API contract without documenting it in natural language.
- **Over-Engineering Schemas:** 50-field response objects when 5 fields suffice. Each field increases failure probability.
- **No Refusal Handling:** The model may output `{"error": "I cannot answer that"}` in valid JSON but with an unexpected structure.
- **Schema Changes Without Migration:** Changing the response schema without handling old-format responses in the application.
- **Ignoring Provider Limitations:** Using `additionalProperties: false` when the provider doesn't support it.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-03 (Provider-Specific Features): Structured output as a capability.
- ku-04 (Error Handling & Retry): Handling structured output failures.
- agent-architecture-orchestration/ku-05: Tool calling for structured output.
- prompt-engineering-systems/ku-04: Prompt patterns for structured responses.
- ai-middleware-gateway/ku-04: Response transformation and validation.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

