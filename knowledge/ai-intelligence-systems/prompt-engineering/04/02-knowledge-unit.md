# Knowledge Unit: Structured Output Prompting

## Metadata

- **ID:** ku-04
- **Subdomain:** Prompt Engineering
- **Slug:** structured-output-prompting
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Structured output prompting is the practice of designing prompts that reliably produce machine-parseable, schema-conforming output from LLMs. While provider-side structured output (JSON mode, constrained decoding) provides guarantees, prompt-based structure remains essential for providers that don't support native structured output, as a fallback, and for controlling output format beyond what schemas can express. This KU covers prompt patterns that reliably produce structured outputs across models and providers.

## Core Concepts

- **Format Specification:** Explicitly describing the expected output format in the prompt (JSON schema, markdown template, XML structure).
- **Schema Embedding:** Including the JSON Schema or type definition in the prompt for the model to follow.
- **Example-Driven Formatting:** Providing input-output examples that demonstrate the exact desired format.
- **Delimiter-Based Structure:** Using delimiters (```json, <output>, |---|) to define structural boundaries.
- **Output Constraints:** Specifying constraints on the output (field types, allowed values, required fields, nesting limits).
- **Fallback Formatting:** When primary structured output fails, using a secondary prompt to parse or reformat the output.
- **Self-Correction:** Prompting the model to validate and correct its own output against the format specification.

## Mental Models

- **Format Specification:** Explicitly describing the expected output format in the prompt (JSON schema, markdown template, XML structure).
- **Schema Embedding:** Including the JSON Schema or type definition in the prompt for the model to follow.
- **Example-Driven Formatting:** Providing input-output examples that demonstrate the exact desired format.


## Internal Mechanics

The internal mechanics of Structured Output Prompting follow established patterns within the Prompt Engineering domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Embed the schema in the prompt** as JSON Schema or a type definition. Use the same schema that your application validates against.
- **Provide a markdown template** for complex nested structures â€” it's easier for models to fill in a template than to generate JSON from scratch.
- **Use example-based formatting** for models that struggle with schema following. 2-3 diverse examples cover most cases.
- **Request the model to output in a code block** (```json) so you can extract it reliably.
- **Validate output server-side** and retry with a correction prompt if validation fails.
- **Specify output constraints explicitly** â€” "The response must be valid JSON. Do not include any text outside the JSON."

## Patterns

- **Embed the schema in the prompt** as JSON Schema or a type definition. Use the same schema that your application validates against.
- **Provide a markdown template** for complex nested structures â€” it's easier for models to fill in a template than to generate JSON from scratch.
- **Use example-based formatting** for models that struggle with schema following. 2-3 diverse examples cover most cases.
- **Request the model to output in a code block** (```json) so you can extract it reliably.
- **Validate output server-side** and retry with a correction prompt if validation fails.
- **Specify output constraints explicitly** â€” "The response must be valid JSON. Do not include any text outside the JSON."

## Architectural Decisions

- Implement structured output prompting as a **fallback layer** in the provider adapter, activated when native structured output is unavailable or fails.
- Use a **response extractor** that can handle multiple output formats (JSON in code block, JSON raw, XML, markdown table).
- Store structured output prompt templates in the **prompt registry** alongside the schema definition.
- For complex schemas, use a **multi-step approach**: first generate text, then extract structured data with a second LLM call.
- Implement a **correction loop**: if the output fails validation, send the validation error back to the model with a request to fix it.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Structured output prompting adds tokens for the schema definition (100-500 tokens depending on schema complexity).
- Multi-step extraction (generate â†’ extract) doubles latency and cost. Use single-step where possible.
- Self-correction loops: 1-2 correction iterations typically resolve format issues. Cap at 3 to prevent infinite loops.
- Schema in prompt: cache the schema text (it doesn't change per request).
- Response extraction (regex for code blocks) adds <0.1ms.

## Production Considerations

- **Schema injection:** User input should not influence the output schema (could lead to data exfiltration).
- **Output validation:** Even with prompt-based structured output, validate server-side. The model may produce valid JSON with incorrect content.
- **Schema leakage:** The embedded schema may reveal internal data structures. Consider whether this is acceptable.
- **Prompt-based format override:** Ensure user input cannot override the format instructions in the prompt.
- **Self-correction safety:** Correction prompts should not introduce new vulnerabilities (the correction LLM call has the same attack surface).

## Common Mistakes

- Embedding the schema in the user message (which can be overridden) instead of the system message.
- Not providing examples for complex schemas â€” the model struggles to infer the structure from a schema alone.
- Requesting JSON without specifying the exact fields â€” the model invents its own structure.
- Not handling the case where the model outputs valid JSON but with wrong field types or values.
- Using only prompt-based structure when the provider supports native structured output â€” native is more reliable.

## Failure Modes

- **Schema in Every Turn:** Re-sending the full schema in every message of a multi-turn conversation. Send once in the system message.
- **Post-Process-Only:** Relying solely on regex parsing to extract structure from free-text. Use prompt-based structure first, regex as fallback.
- **Over-Specification:** Specifying every possible field and constraint, making the prompt so long that the model ignores it.
- **No Format Fallback:** Assuming the model will always output the correct format. Always have a fallback strategy.
- **Format Obsession:** Spending more effort on format control than on content quality.

## Ecosystem Usage

### Structured Output Prompt Template
```php
class StructuredOutputPrompt {
    public static function forExtraction(string $schemaJson): string {
        return <<<PROMPT
Extract the requested information from the user's input and return it as valid JSON.

Schema:
```json
{$schemaJson}
```

Rules:
1. Return ONLY valid JSON â€” no explanation, no markdown formatting.
2. Use null for missing fields â€” do not make up values.
3. For enum fields, use ONLY the allowed values listed in the schema.
4. Do not include any text outside the JSON object.

Example output:
```json
{"name": "John Doe", "age": 30, "role": "user"}
```
PROMPT;
    }
}
```

### Response Extractor
```php
class StructuredResponseExtractor {
    public function extract(string $response): ?array {
        // Try JSON code block first
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $response, $matches)) {
            return json_decode($matches[1], true);
        }

        // Try raw JSON
        if (preg_match('/^\s*(\{.*\})\s*$/s', trim($response), $matches)) {
            return json_decode($matches[1], true);
        }

        // Try to find JSON anywhere in the response
        if (preg_match('/\{[^{}]*\}/s', $response, $matches)) {
            return json_decode($matches[0], true);
        }

        return null; // Unable to extract structured output
    }
}
```

## Related Knowledge Units

- ku-01 (Prompt Engineering Fundamentals): Foundation for structured prompting.
- ku-03 (Prompt Optimization): Reducing schema token overhead.
- llm-provider-abstraction/ku-08: Provider-native structured output.
- agent-architecture-orchestration/ku-05: Tool calling for structured output.
- ai-middleware-gateway/ku-04: Response transformation and validation.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

