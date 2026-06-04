# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Log transformations
- [ ] Test transformations independently
- [ ] Use a pipeline of transforms
- [ ] Validate transformed payloads
- [ ] Version transform configurations
- [ ] Each transform has unit tests with input/output fixtures.
- [ ] PII redaction runs before content is sent to providers or stored in logs.
- [ ] Schema transformation handles all provider-specific format differences.
- [ ] Rules for Request/Response Transformation
- [ ] Each transform has unit tests with input/output fixtures
- [ ] PII redaction runs before content is sent to providers or stored in logs
- [ ] Schema transformation handles all provider-specific format differences
- [ ] **Compose the pipeline**: Register transforms in order in the pipeline configuration. PII redaction should run before context injection (to avoid injecting into redacted content). Content moderation should run before sending to provider.
- [ ] **Define the transform interface**: Create `TransformInterface` with `processRequest(array $request): array` and `processResponse(array $response): array` (plus `processResponseChunk()` for streaming).
- [ ] **Handle streaming transforms**: For streaming responses, apply per-chunk processing for PII and moderation. For transforms requiring full context (summarization), buffer minimally and warn about latency impact.
- [ ] All requests and responses are normalized to provider-agnostic formats
- [ ] Content moderation blocks policy-violating content before reaching the LLM
- [ ] Context injection adds RAG/system context without client awareness

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Log transformations
- [ ] Test transformations independently
- [ ] Use a pipeline of transforms
- [ ] Validate transformed payloads
- [ ] Version transform configurations
- [ ] **Compose the pipeline**: Register transforms in order in the pipeline configuration. PII redaction should run before context injection (to avoid injecting into redacted content). Content moderation should run before sending to provider.
- [ ] **Define the transform interface**: Create `TransformInterface` with `processRequest(array $request): array` and `processResponse(array $response): array` (plus `processResponseChunk()` for streaming).
- [ ] **Handle streaming transforms**: For streaming responses, apply per-chunk processing for PII and moderation. For transforms requiring full context (summarization), buffer minimally and warn about latency impact.
- [ ] **Implement content moderation**: Add a moderation transform that checks content against policy before sending to the provider and before returning to the user. Block high-confidence violations; flag medium-confidence for review.
- [ ] **Implement context injection**: Create a transform that injects system messages, RAG context, or instructions without the client being aware. This enables gateway-level RAG augmentation.
- [ ] **Implement PII redaction**: Create a pattern-based PII redaction transform (emails, SSNs, credit cards, phone numbers). Apply to both request content and response content. Use configurable patterns and locale-aware rules.
- [ ] **Implement request normalization**: Convert the application's generic request format to each provider's native JSON schema. Handle differences in message roles, tool call schemas, options naming, and streaming parameters.

---

# Performance Checklist

- [ ] Each transformation adds latency. Keep the pipeline lean (3-5 transforms maximum on the hot path).
- [ ] PII redaction using regex is fast (<1ms); ML-based NER is slower (10-50ms). Use regex for high-throughput paths.
- [ ] Response transformations on streaming responses require buffering or per-chunk processing. Buffering adds latency; per-chunk processing is more complex.
- [ ] Schema transformation should be precomputed where possible (cached schemas per provider).
- [ ] Use a **transform cache**: if the same transformation is applied to similar requests, cache the result.
- [ ] Payload validation against schema: 1-5ms depending on payload size
- [ ] Schema transformation: precompute cached schemas per provider (<0.1ms lookup)

---

# Security Checklist

- [ ] Audit transform actions:
- [ ] Content moderation before provider:
- [ ] PII redaction at the gateway
- [ ] Response sanitization:
- [ ] Transform injection:
- [ ] Ensure transform pipeline itself doesn't introduce security vulnerabilities (e.g., injection via transform configuration)
- [ ] ML-based PII detection (NER): 10-50ms â€” use only for high-confidence requirements
- [ ] Payload validation against schema: 1-5ms depending on payload size

---

# Reliability Checklist

- [ ] Applying the same transforms to all request types (chat, embedding, streaming) when they need different pipelines.
- [ ] Applying transformations in the wrong order (PII redaction before content moderation may mask policy-violating content).
- [ ] Breaking streaming responses by buffering the entire response â€” defeats the purpose of streaming.
- [ ] Forgetting to transform tool call schemas â€” the LLM receives schemas in the wrong format.
- [ ] Not handling transform failures gracefully â€” a redaction error should not crash the gateway.

---

# Testing Checklist

- [ ] All requests and responses are normalized to provider-agnostic formats
- [ ] Content moderation blocks policy-violating content before reaching the LLM
- [ ] Context injection adds RAG/system context without client awareness
- [ ] Each transform has unit tests with input/output fixtures
- [ ] Each transform has unit tests with input/output fixtures.
- [ ] PII is redacted from all content sent to providers and stored in logs
- [ ] PII redaction runs before content is sent to providers or stored in logs
- [ ] PII redaction runs before content is sent to providers or stored in logs.
- [ ] Schema transformation handles all provider-specific format differences
- [ ] Schema transformation handles all provider-specific format differences.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Version transform configurations

---

# Anti-Pattern Prevention Checklist

- [ ] [No Caching at Gateway â€” Repeated Identical Requests Hit Provider]
- [ ] [Caching Dynamic Requests â€” Stale Answers for Time-Sensitive Queries]
- [ ] [Cache Key Without Model/Provider â€” Wrong Cache Hit]
- [ ] [Long TTL on Cache â€” Outdated Information Served]
- [ ] [No Cache Invalidation â€” Content Change Not Reflected]
- [ ] Hardcoded PII Patterns:
- [ ] Monolithic Transform Function:
- [ ] Silent Data Loss:
- [ ] Transform Order Dependency:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Audit log all redactions and content blocks for compliance review
- [ ] PII redaction at gateway ensures downstream logs don't contain sensitive data

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


