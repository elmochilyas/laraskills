# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** provider-integration
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Handle rate limit headers.
- [ ] Keep adapters stateless.
- [ ] Log raw request/response
- [ ] Map errors comprehensively.
- [ ] Test adapters independently
- [ ] Adapter implements the full provider interface (chat, stream, embeddings, supports).
- [ ] API keys are injected via constructor (never read from global state).
- [ ] Error mapping covers all provider-specific error codes and HTTP statuses.
- [ ] Implement Comprehensive Error Mapping
- [ ] Never Read API Keys from Global State
- [ ] One Adapter Class per Provider
- [ ] Use Fixture-Based Tests for Adapter Response Parsing
- [ ] `supports()` method returns accurate capability array
- [ ] Adapter implements full provider interface (chat, stream, embeddings, supports)
- [ ] API keys injected via constructor (never read from env/config inside adapter)
- [ ] All adapter response parsing tests pass with real-world fixture data
- [ ] All provider API responses parse correctly with fixture-verified tests
- [ ] Error handling verified for every documented error code

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Handle rate limit headers.
- [ ] Keep adapters stateless.
- [ ] Log raw request/response
- [ ] Map errors comprehensively.
- [ ] Test adapters independently
- [ ] Validate provider responses.
- [ ] Implement Comprehensive Error Mapping
- [ ] Never Read API Keys from Global State
- [ ] One Adapter Class per Provider
- [ ] Use Fixture-Based Tests for Adapter Response Parsing
- [ ] DTOs vs raw arrays
- [ ] Fixture coverage

---

# Performance Checklist

- [ ] Adapter construction should be lightweight â€” heavy initialization (loading models, fetching config) should be lazy.
- [ ] Connection reuse: share HTTP clients across adapter instances (Guzzle pool).
- [ ] Request/response serialization is the dominant cost in adapters (0.1-0.5ms). Optimize with cached serialization templates where possible.
- [ ] Response validation should be minimal on the success path â€” validate structure, not content.
- [ ] Streaming adapters should process chunks incrementally without buffering the entire response.
- [ ] Fixture loading from JSON files: <1ms per test
- [ ] Request/response serialization is 0.1-0.5ms â€” optimize with cached serialization templates
- [ ] Share HTTP clients across adapter instances (Guzzle connection pool)

---

# Security Checklist

- [ ] API key handling:
- [ ] Request logging:
- [ ] Response injection:
- [ ] TLS verification:
- [ ] URL validation:
- [ ] API keys via constructor injection, never from global state
- [ ] Never commit fixtures containing API keys or real user data
- [ ] Redact API keys and sensitive content in debug logs

---

# Reliability Checklist

- [ ] Assuming all providers' streaming formats are identical â€” each provider has unique SSE event types.
- [ ] Forgetting to implement `supports($capability)` correctly â€” claiming support for features the provider doesn't offer.
- [ ] Hardcoding model names in the adapter â€” models should be configurable via request DTOs.
- [ ] Not handling all provider-specific error codes â€” unhandled errors surface as generic HTTP exceptions.
- [ ] Not handling finish reasons correctly â€” `stop`, `length`, `tool_calls`, `content_filter` have different representations across providers.
- [ ] Implement Comprehensive Error Mapping
- [ ] Never Read API Keys from Global State

---

# Testing Checklist

- [ ] `supports()` method returns accurate capability array
- [ ] Adapter implements full provider interface (chat, stream, embeddings, supports)
- [ ] Adapter implements the full provider interface (chat, stream, embeddings, supports).
- [ ] All adapter response parsing tests pass with real-world fixture data
- [ ] All provider API responses parse correctly with fixture-verified tests
- [ ] API keys are injected via constructor (never read from global state).
- [ ] API keys injected via constructor (never read from env/config inside adapter)
- [ ] Error fixtures exist for each mapped error code
- [ ] Error handling verified for every documented error code
- [ ] Error mapping covers all provider-specific error codes and HTTP statuses

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Adapter Monolith â€” One Class Handling Multiple Providers]
- [ ] [Hardcoding Model Names Inside the Adapter]
- [ ] [Reading API Keys from Global State Inside Adapter]
- [ ] [Assuming Identical Streaming Formats Across Providers]
- [ ] [Embedding Business Logic (Pricing, Routing) in Adapter Code]
- [ ] Adapter Monolith:
- [ ] Adapter-Dependent Business Logic:
- [ ] Lowest Common Denominator:
- [ ] Magic Response Parsing:
- [ ] Silent Fallbacks:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Redact API keys and sensitive content in debug logs

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


