---
id: ku-05
title: "Output Format Control - Rules"
subdomain: "prompt-engineering"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for Output Format Control

### R1: Always use structured output modes (JSON mode, tool calling) over natural language format instructions
- **Category:** Reliability
- **Rule:** When the LLM provider supports structured output (JSON mode, constrained decoding, tool_use), use it instead of natural language instructions like "Respond in JSON format." Never rely solely on prompt instructions for format compliance.
- **Reason:** Prompt instructions for format compliance fail 5-20% of the time — the model produces markdown-wrapped JSON, extra commentary, or malformed structures. Structured output modes guarantee format compliance.
- **Bad Example:** A system prompt saying "Always respond in valid JSON with fields status and message" — 15% of responses include extra text before or after the JSON.
- **Good Example:** Using the provider's `response_format: { type: 'json_object' }` or tool-calling API that enforces the schema.
- **Exceptions:** Providers that do not support any structured output mode.
- **Consequences of Violation:** A significant percentage of responses are unparsable by consuming code; error handling for malformed responses adds complexity and degrades UX.

### R2: Validate LLM output format with a schema validator before returning to the user
- **Category:** Reliability
- **Rule:** Parse and validate every LLM response against the expected schema (JSON Schema, Pydantic model, Zod schema) immediately; return a clear format error or retry if validation fails.
- **Reason:** Even with structured output, provider errors, content policy blocks, or edge cases can produce outputs that don't match the schema. Downstream code that expects a specific format will crash.
- **Bad Example:** An integration that directly passes LLM output to a `json_decode()` without validation — invalid JSON causes a runtime exception.
- **Good Example:** A `ResponseValidator` that checks the JSON against an expected schema using `opis/json-schema` and throws a specific `InvalidResponseFormatException` with the validation errors.
- **Exceptions:** Free-text chat applications with no structured output requirements.
- **Consequences of Violation:** Runtime exceptions when parsing LLM output; cascading failures in dependent services; bad user experience when responses are silently dropped due to parse errors.

### R3: Implement automatic retry with reformatting instruction when schema validation fails
- **Category:** Reliability
- **Rule:** When output validation fails, automatically retry the request once with an additional instruction: "Your previous response failed format validation. Respond ONLY with valid JSON matching this schema: [schema]." Limit retries to 1.
- **Reason:** A single retry with a format fix instruction resolves 80%+ of format failures. More than 1 retry wastes tokens and indicates a deeper issue.
- **Bad Example:** When JSON parsing fails, returning an "Internal error" to the user without any retry.
- **Good Example:** `if ($validator->fails()) { $retryResponse = $this->retryWithFormatFix($originalRequest, $schema); }` — with a max 1 retry before returning an error.
- **Exceptions:** Non-production environments where retry behavior should be visible for debugging.
- **Consequences of Violation:** Format failures that would be resolved with a simple retry instead produce user-facing errors; degraded reliability and user trust.
