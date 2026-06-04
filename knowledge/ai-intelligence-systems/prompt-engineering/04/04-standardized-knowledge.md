---
id: ku-04
title: "Structured Output Prompting"
subdomain: "prompt-engineering-systems"
ku-type: "technique"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/prompt-engineering-systems/ku-04/04-standardized-knowledge.md"
---

# Structured Output Prompting

## Overview

Structured output prompting is the practice of designing prompts that reliably produce machine-parseable, schema-conforming output from LLMs. While provider-side structured output (JSON mode, constrained decoding) provides guarantees, prompt-based structure remains essential for providers that don't support native structured output, as a fallback, and for controlling output format beyond what schemas can express. This KU covers prompt patterns that reliably produce structured outputs across models and providers.

## Core Concepts

- **Format Specification:** Explicitly describing the expected output format in the prompt (JSON schema, markdown template, XML structure).
- **Schema Embedding:** Including the JSON Schema or type definition in the prompt for the model to follow.
- **Example-Driven Formatting:** Providing input-output examples that demonstrate the exact desired format.
- **Delimiter-Based Structure:** Using delimiters (```json, <output>, |---|) to define structural boundaries.
- **Output Constraints:** Specifying constraints on the output (field types, allowed values, required fields, nesting limits).
- **Fallback Formatting:** When primary structured output fails, using a secondary prompt to parse or reformat the output.
- **Self-Correction:** Prompting the model to validate and correct its own output against the format specification.

## When To Use

- Applications that consume LLM output programmatically (API responses, data extraction, function calling).
- Multi-step workflows where intermediate outputs must be machine-parseable.
- When the provider does not support native structured output (JSON mode).
- As a fallback for when provider-side structured output fails or produces invalid output.

## When NOT To Use

- When provider-side structured output (JSON mode, constrained decoding) is available and reliable — use it instead.
- Human-facing chat where free-text responses are expected.
- When the output format is trivial (single number, boolean) — a simple instruction suffices.

## Best Practices

- **Embed the schema in the prompt** as JSON Schema or a type definition. Use the same schema that your application validates against.
- **Provide a markdown template** for complex nested structures — it's easier for models to fill in a template than to generate JSON from scratch.
- **Use example-based formatting** for models that struggle with schema following. 2-3 diverse examples cover most cases.
- **Request the model to output in a code block** (```json) so you can extract it reliably.
- **Validate output server-side** and retry with a correction prompt if validation fails.
- **Specify output constraints explicitly** — "The response must be valid JSON. Do not include any text outside the JSON."

## Architecture Guidelines

- Implement structured output prompting as a **fallback layer** in the provider adapter, activated when native structured output is unavailable or fails.
- Use a **response extractor** that can handle multiple output formats (JSON in code block, JSON raw, XML, markdown table).
- Store structured output prompt templates in the **prompt registry** alongside the schema definition.
- For complex schemas, use a **multi-step approach**: first generate text, then extract structured data with a second LLM call.
- Implement a **correction loop**: if the output fails validation, send the validation error back to the model with a request to fix it.

## Performance Considerations

- Structured output prompting adds tokens for the schema definition (100-500 tokens depending on schema complexity).
- Multi-step extraction (generate → extract) doubles latency and cost. Use single-step where possible.
- Self-correction loops: 1-2 correction iterations typically resolve format issues. Cap at 3 to prevent infinite loops.
- Schema in prompt: cache the schema text (it doesn't change per request).
- Response extraction (regex for code blocks) adds <0.1ms.

## Security Considerations

- **Schema injection:** User input should not influence the output schema (could lead to data exfiltration).
- **Output validation:** Even with prompt-based structured output, validate server-side. The model may produce valid JSON with incorrect content.
- **Schema leakage:** The embedded schema may reveal internal data structures. Consider whether this is acceptable.
- **Prompt-based format override:** Ensure user input cannot override the format instructions in the prompt.
- **Self-correction safety:** Correction prompts should not introduce new vulnerabilities (the correction LLM call has the same attack surface).

## Common Mistakes

- Embedding the schema in the user message (which can be overridden) instead of the system message.
- Not providing examples for complex schemas — the model struggles to infer the structure from a schema alone.
- Requesting JSON without specifying the exact fields — the model invents its own structure.
- Not handling the case where the model outputs valid JSON but with wrong field types or values.
- Using only prompt-based structure when the provider supports native structured output — native is more reliable.

## Anti-Patterns

- **Schema in Every Turn:** Re-sending the full schema in every message of a multi-turn conversation. Send once in the system message.
- **Post-Process-Only:** Relying solely on regex parsing to extract structure from free-text. Use prompt-based structure first, regex as fallback.
- **Over-Specification:** Specifying every possible field and constraint, making the prompt so long that the model ignores it.
- **No Format Fallback:** Assuming the model will always output the correct format. Always have a fallback strategy.
- **Format Obsession:** Spending more effort on format control than on content quality.

## Examples

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
1. Return ONLY valid JSON — no explanation, no markdown formatting.
2. Use null for missing fields — do not make up values.
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

## Related Topics

- ku-01 (Prompt Engineering Fundamentals): Foundation for structured prompting.
- ku-03 (Prompt Optimization): Reducing schema token overhead.
- llm-provider-abstraction/ku-08: Provider-native structured output.
- agent-architecture-orchestration/ku-05: Tool calling for structured output.
- ai-middleware-gateway/ku-04: Response transformation and validation.

## AI Agent Notes

- When asked to implement structured output prompting, first check if the provider supports native structured output (JSON mode) — use that first, fall back to prompting.
- For structured output bugs, check: schema format, example quality, and delimiter handling.
- Prefer reading the response extractor and correction loop before the prompt template.
- When generating structured output code, include: schema embedding, examples, response extraction, validation, and correction loop.

## Verification

- [ ] Structured output prompts include the schema definition, examples, and format rules.
- [ ] Response extractor handles multiple formats (code block, raw JSON, embedded JSON).
- [ ] Server-side validation runs on every structured output response.
- [ ] Correction loop retries with validation error feedback (capped at 3 iterations).
- [ ] Native structured output is preferred over prompt-based structure when available.
- [ ] Schema is embedded in the system message (not user message).
- [ ] Output format failure rate is monitored.
