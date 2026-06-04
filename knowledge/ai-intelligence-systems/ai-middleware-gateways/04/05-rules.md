---
id: ku-04
title: "Request/Response Transformation - Rules"
subdomain: "ai-middleware-gateway"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Request/Response Transformation

### R1: Design transforms as single-responsibility pipeline classes, never a monolithic transform function
- **Category:** Maintainability
- **Rule:** Implement each transformation (PII redaction, schema normalization, context injection) as a separate class implementing a common `TransformInterface`; compose them into a pipeline.
- **Reason:** Monolithic transform functions violate single responsibility, making them hard to test, debug, and configure per-route. A single function doing PII redaction, format conversion, and content filtering cannot be tested in isolation.
- **Bad Example:** A 500-line `transformRequest()` function that handles PII, schema conversion, and context injection in one method.
- **Good Example:** `class NormalizeRequestTransform implements TransformInterface`, `class PiiRedactionTransform implements TransformInterface`, each tested independently.
- **Exceptions:** Trivial transforms (<10 lines) that will never grow.
- **Consequences of Violation:** Untestable transform logic, inability to selectively enable/disable transforms, and difficult debugging when a transform fails.

### R2: Never buffer entire streaming responses for transformation — use per-chunk processing
- **Category:** Performance
- **Rule:** For streaming responses, apply transformations on individual chunks as they arrive; avoid accumulating the entire response before applying transforms.
- **Reason:** Buffering streaming responses for transformation defeats the purpose of streaming — the client must wait for the full response before receiving any tokens. Per-chunk processing maintains real-time delivery.
- **Bad Example:** A transform pipeline that waits for the complete streamed response (collecting all chunks), transforms the full text, then returns to the client.
- **Good Example:** Each chunk passed through `PiiRedactionTransform::processResponseChunk()` individually, emitting transformed chunks immediately.
- **Exceptions:** Transforms that require full context (e.g., summary generation, entity extraction) cannot be per-chunk.
- **Consequences of Violation:** Streaming becomes equivalent to non-streaming in terms of perceived latency; users see no incremental output.

### R3: Validate transformed payloads against the target provider's schema before sending
- **Category:** Reliability
- **Rule:** After applying all request transforms, validate the final payload against the target provider's API schema before sending; reject invalid payloads with a clear error.
- **Reason:** A transform error (wrong field type, missing required field, incorrect nesting) can produce a request that passes all transform logic but fails when sent to the provider, wasting the LLM call.
- **Bad Example:** A schema normalization transform that outputs an invalid field name — the provider returns a 400 error after the request was sent.
- **Good Example:** A `ProviderSchemaValidator` that checks the transformed payload against the target provider's JSON schema and throws before the HTTP call.
- **Exceptions:** When the provider's schema is unavailable or not machine-readable.
- **Consequences of Violation:** Silent request failures that cost LLM call time and tokens, returning provider errors that are hard to correlate to transform issues.
