# Skill: Produce Structured Output from LLMs

## Purpose
Reliably generate machine-parseable, schema-conforming structured output (JSON, XML) from LLMs using prompt engineering — with schema embedding, example-driven formatting, response extraction, validation, and automatic correction loops.

## When To Use
- Applications that consume LLM output programmatically (API responses, data extraction, function calling)
- Multi-step workflows where intermediate outputs must be machine-parseable
- When the provider does not support native structured output (JSON mode)
- As a fallback for when provider-side structured output fails or produces invalid output

## When NOT To Use
- When provider-side structured output (JSON mode, constrained decoding) is available and reliable — use it instead
- Human-facing chat where free-text responses are expected
- When the output format is trivial (single number, boolean) — a simple instruction suffices

## Prerequisites
- KU-01 (Prompt Engineering Fundamentals) — understanding of prompt structure
- Target output schema (JSON Schema or type definition)
- JSON Schema validator library (e.g., opis/json-schema)
- Response extractor for parsing various output formats

## Inputs
- Target output schema (fields, types, allowed values, required fields)
- Sample data for example-driven formatting
- Input content to extract/transform
- Correction prompt template (for retry on validation failure)

## Workflow
1. **Check provider structured output support**: If the provider supports native structured output (JSON mode, constrained decoding, tool calling), use that instead of prompt-based structure. Only use prompt-based as fallback.
2. **Embed the schema in the system prompt**: Add the JSON Schema or type definition to the system message (not user message — users could override). Include field descriptions, allowed values, and format constraints.
3. **Add format rules**: Include explicit format rules: "Return ONLY valid JSON. Do not include any text outside the JSON. Use null for missing fields. For enum fields, use ONLY the allowed values listed."
4. **Provide example outputs**: Include 2-3 diverse examples showing the exact expected format. Use the same schema as the actual task. Place examples after the schema and rules.
5. **Request code block output**: Ask the model to output JSON inside a ```json code block for reliable extraction. Add "Use a markdown code block with the json language tag."
6. **Implement response extraction**: Create a `StructuredResponseExtractor` that handles multiple formats: JSON in code block, raw JSON, JSON embedded in text, and markdown tables. Try formats in order of reliability.
7. **Validate output against schema**: Parse the extracted output and validate against the JSON Schema. Check field types, allowed values, required fields, and nesting. Use a schema validation library.
8. **Retry on validation failure**: If validation fails, automatically retry once with a correction prompt: "Your previous response failed format validation. Respond ONLY with valid JSON matching this schema: [schema]." Limit to 1 retry.
9. **Fall back on persistent failure**: If retry also fails, log the failure, fall back to a default/empty response, and alert. Don't crash or return unparsed output to the user.
10. **Monitor format failure rate**: Track the percentage of responses that fail validation. Set alerts if the rate exceeds 5%. Investigate and adjust the prompt or model.

## Validation Checklist
- [ ] Structured output prompts include the schema definition, examples, and format rules
- [ ] Response extractor handles multiple formats (code block, raw JSON, embedded JSON)
- [ ] Server-side validation runs on every structured output response
- [ ] Correction loop retries with validation error feedback (capped at 1 iteration)
- [ ] Native structured output is preferred over prompt-based structure when available
- [ ] Schema is embedded in the system message (not user message)
- [ ] Output format failure rate is monitored

## Common Failures
- **Schema in user message**: User can override the schema by editing the user message. Fix: embed schema in the system prompt only.
- **No examples for complex schemas**: Model struggles to infer nested structure from schema alone. Fix: always provide 2-3 diverse examples.
- **Correction loop infinite retry**: Retry on every failure without limit. Fix: cap at 1 retry. If it still fails, there's a deeper issue.
- **Validation error not fed back**: Retry sends the same request, getting the same failure. Fix: include the specific validation error in the correction prompt.
- **Output contains extra text**: Model adds "Here is the JSON you requested:" before the output. Fix: add stricter format rules and use code block extraction.

## Decision Points
- **Native structured output vs. prompt-based**: Always prefer native (JSON mode, tool calling) for guaranteed format compliance. Use prompt-based as fallback only.
- **Single-step vs. multi-step**: Single-step (generate + extract in one call) for simple schemas. Multi-step (generate free text → extract structure with second LLM call) for complex nested schemas.
- **Retry count**: 1 retry resolves 80%+ of format failures. 0 retries = format failures become user-facing errors. 2+ retries = token waste.

## Performance Considerations
- Schema in prompt: 100-500 tokens depending on complexity
- Multi-step extraction doubles latency and cost
- Retry with correction prompt: 1 additional LLM call
- Response extraction: <0.1ms (regex-based)
- Schema validation: 1-5ms depending on schema complexity
- Format failure rate target: <5% with prompt-based structure, <1% with native structured output

## Security Considerations
- User input should not influence the output schema (could lead to data exfiltration)
- Validate output server-side even with structured output modes — model may produce valid JSON with incorrect content
- Embedded schema may reveal internal data structures — consider whether this is acceptable
- Ensure user input cannot override format instructions in the prompt
- Correction prompts have the same attack surface as the original — validate retry output too
- Cap retry attempts to prevent cost amplification attacks

## Related Rules
- Always use structured output modes (JSON mode, tool calling) over natural language format instructions
- Validate LLM output format with a schema validator before returning to the user
- Implement automatic retry with reformatting instruction when schema validation fails

## Related Skills
- Skill: Design and Manage Production Prompts (ku-01)
- Skill: Design System Prompts for Agents (ku-02)
- Skill: Optimize Prompt Token Usage and Quality (ku-03)
- Skill: Test and Evaluate Prompt Quality (ku-05)

## Success Criteria
- >95% of responses are valid machine-parseable JSON matching the schema
- Retry with correction prompt resolves >80% of initial format failures
- Format failure rate is <5% (prompt-based) or <1% (native structured output)
- Response extractor successfully parses output in all supported formats
- Server-side validation catches all schema violations before returning to user
- Format failure alerts trigger when rate exceeds 5% threshold
- Native structured output is used when available, with prompt-based fallback