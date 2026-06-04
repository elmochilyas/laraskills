# Skill: Transform Requests and Responses at the Gateway

## Purpose
Build a configurable transform pipeline at the AI gateway for request normalization, response normalization, PII redaction, content moderation, and schema conversion — ensuring provider-agnostic clients while supporting provider-specific capabilities with <20ms overhead.

## When To Use
- Multi-provider gateways where each provider has a different API format
- Applications requiring consistent response structures (unified response DTOs)
- Compliance-driven PII redaction at the gateway level
- A/B testing where transformations differ between test and control groups

## When NOT To Use
- Single-provider applications (use the provider's SDK directly)
- When transformation overhead adds unacceptable latency (>20ms per request)
- When the transformation logic duplicates what `laravel/ai` already handles natively

## Prerequisites
- KU-01 (AI Gateway Fundamentals) — understanding of gateway middleware pipeline
- Provider API schemas for request/response format differences
- PII detection patterns or service
- Content moderation service or rules

## Inputs
- Request object (messages, model, tools, options)
- Target provider schema
- PII redaction rules (patterns, allowlist)
- Content moderation policies (blocked categories, thresholds)
- Context injection data (RAG results, system instructions)
- Transform pipeline configuration (ordered list of enabled transforms)

## Workflow
1. **Define the transform interface**: Create `TransformInterface` with `processRequest(array $request): array` and `processResponse(array $response): array` (plus `processResponseChunk()` for streaming).
2. **Implement request normalization**: Convert the application's generic request format to each provider's native JSON schema. Handle differences in message roles, tool call schemas, options naming, and streaming parameters.
3. **Implement response normalization**: Convert each provider's response format into a standardized response DTO with consistent fields (content, finish_reason, tool_calls, usage, error).
4. **Implement PII redaction**: Create a pattern-based PII redaction transform (emails, SSNs, credit cards, phone numbers). Apply to both request content and response content. Use configurable patterns and locale-aware rules.
5. **Implement content moderation**: Add a moderation transform that checks content against policy before sending to the provider and before returning to the user. Block high-confidence violations; flag medium-confidence for review.
6. **Implement context injection**: Create a transform that injects system messages, RAG context, or instructions without the client being aware. This enables gateway-level RAG augmentation.
7. **Compose the pipeline**: Register transforms in order in the pipeline configuration. PII redaction should run before context injection (to avoid injecting into redacted content). Content moderation should run before sending to provider.
8. **Handle streaming transforms**: For streaming responses, apply per-chunk processing for PII and moderation. For transforms requiring full context (summarization), buffer minimally and warn about latency impact.
9. **Validate transformed payloads**: After all request transforms, validate the final payload against the target provider's API schema. Reject invalid payloads with clear error messages before sending.
10. **Log transform actions**: Log all redactions, content blocks, and schema transformations for debugging and compliance. Include transform name, action taken, and field affected.

## Validation Checklist
- [ ] Transform pipeline is composed of focused, single-responsibility transforms
- [ ] PII redaction runs before content is sent to providers or stored in logs
- [ ] Schema transformation handles all provider-specific format differences
- [ ] Streaming responses are not fully buffered for transforms — per-chunk processing or minimal buffering
- [ ] Transform failures are caught gracefully (log and skip, don't crash)
- [ ] Transform configurations are versioned and traceable
- [ ] Each transform has unit tests with input/output fixtures

## Common Failures
- **PII redaction before content moderation masks policy violations**: Redacting emails before moderation means the moderator can't see the email address in the violation. Fix: run moderation first, then redact.
- **Broken streaming transforms**: Buffering the entire streaming response for PII redaction defeats streaming. Fix: use per-chunk processing for PII; only buffer when absolutely necessary.
- **Invalid payloads sent to provider**: Transform error produces an invalid field name or missing required field. Fix: validate payloads against provider schema after all transforms.
- **Transform order dependency breaks on reorder**: Transforms that assume a specific order. Fix: document dependencies or make transforms order-independent.
- **Context injection duplicates content on retry**: RAG context injected into a retried request gets duplicated. Fix: make context injection idempotent (check for existing context before injecting).

## Decision Points
- **Structural vs. content transforms**: Structural transforms (schema normalization) run first. Content transforms (PII, moderation, context injection) run after. Separate them into distinct pipeline stages.
- **Per-chunk vs. buffered for streaming**: Per-chunk for PII redaction and simple moderation (no context needed). Buffered for transforms needing full context (summarization, entity extraction).
- **Regex vs. ML-based PII detection**: Regex for high-throughput, well-defined patterns (emails, SSNs, credit cards). ML-based NER for complex patterns (names, addresses) — slower but more accurate.

## Performance Considerations
- Each transform adds 0.5-5ms. Keep pipeline lean (3-5 transforms max on hot path)
- Regex-based PII redaction: <1ms per request
- ML-based PII detection (NER): 10-50ms — use only for high-confidence requirements
- Schema transformation: precompute cached schemas per provider (<0.1ms lookup)
- Per-chunk streaming transforms: <1ms per chunk
- Payload validation against schema: 1-5ms depending on payload size

## Security Considerations
- PII redaction at gateway ensures downstream logs don't contain sensitive data
- Content moderation before provider: blocks policy-violating content before it reaches the LLM (saves cost, prevents abuse)
- Response sanitization: strip provider-specific metadata that might leak internal configuration
- Transform rules cannot be overridden by client-provided headers or parameters
- Audit log all redactions and content blocks for compliance review
- Ensure transform pipeline itself doesn't introduce security vulnerabilities (e.g., injection via transform configuration)

## Related Rules
- Design transforms as single-responsibility pipeline classes, never a monolithic transform function
- Never buffer entire streaming responses for transformation — use per-chunk processing
- Validate transformed payloads against the target provider's schema before sending

## Related Skills
- Skill: Set Up an AI Gateway with Routing, Caching, and Failover (ku-01)
- Skill: Monitor and Observe AI Gateway Performance (ku-05)
- Skill: Implement PII Redaction and Content Moderation (safety-ku-04)

## Success Criteria
- All requests and responses are normalized to provider-agnostic formats
- PII is redacted from all content sent to providers and stored in logs
- Content moderation blocks policy-violating content before reaching the LLM
- Context injection adds RAG/system context without client awareness
- Transformed payloads pass target provider schema validation 100% of the time
- Streaming responses maintain real-time delivery (<50ms chunk delay) with per-chunk transforms
- Transform pipeline adds <20ms overhead (p95) on the hot path