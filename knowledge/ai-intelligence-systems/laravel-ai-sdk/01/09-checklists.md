# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Design the interface for the 80% use case.
- [ ] Handle provider errors uniformly.
- [ ] Implement a factory pattern
- [ ] Use DTOs for request/response.
- [ ] Version the provider interface
- [ ] Application code depends only on the provider interface, not concrete adapters.
- [ ] Configuration is normalized across providers with sensible defaults.
- [ ] Cross-cutting concerns (retry, logging, caching) are implemented as decorators.
- [ ] Design the Provider Interface for the 80% Use Case
- [ ] Implement Decorators for Cross-Cutting Concerns
- [ ] Implement Provider Feature Detection
- [ ] Map Provider Errors to a Common Hierarchy
- [ ] Never Leak Provider-Specific Types to Application Code
- [ ] `supports()` method available for capability detection
- [ ] Cross-cutting concerns implemented as decorators, not inside adapters
- [ ] Feature detection checked before using capabilities
- [ ] Add `supports(string $capability): bool` for feature detection
- [ ] Define a provider interface covering the 80% use case (chat, stream, embeddings, tools)
- [ ] Implement decorators for cross-cutting concerns (retry, logging, caching, rate limiting)
- [ ] All cross-cutting concerns are decorators wrapping the provider interface

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

- [ ] Design the interface for the 80% use case.
- [ ] Handle provider errors uniformly.
- [ ] Implement a factory pattern
- [ ] Use DTOs for request/response.
- [ ] Version the provider interface
- [ ] Add `supports(string $capability): bool` for feature detection
- [ ] Define a provider interface covering the 80% use case (chat, stream, embeddings, tools)
- [ ] Implement decorators for cross-cutting concerns (retry, logging, caching, rate limiting)
- [ ] Implement feature detection via `supports()` and check before using capabilities
- [ ] Keep the adapter layer focused on provider-specific logic; decorators handle cross-cutting
- [ ] Map provider errors to a common exception hierarchy
- [ ] Never leak provider-specific types to application code

---

# Performance Checklist

- [ ] Connection pooling: the abstraction should reuse HTTP connections across calls (Guzzle pool or curl handle reuse).
- [ ] Lazy provider instantiation: don't create provider instances until they're needed (register closures, not instances).
- [ ] Provider abstraction adds <0.1ms per call (interface dispatch, DTO construction). Negligible.
- [ ] Provider fallback adds latency equal to retry timeout. Configure timeouts aggressively for fast failover.
- [ ] The real cost is in serialization/deserialization. Optimize DTO serialization (use array access, avoid reflection-heavy serialization).
- [ ] Cache provider driver instances in the service container
- [ ] Feature detection should be O(1) (cached capability matrix, not API calls)

---

# Security Checklist

- [ ] API key isolation:
- [ ] Input validation:
- [ ] Output sanitization:
- [ ] Provider trust:
- [ ] Secrets in transit:

---

# Reliability Checklist

- [ ] Forgetting to implement provider feature detection â€” the application calls `tool_calling()` on a provider that doesn't support it.
- [ ] Leaking provider-specific types into the application â€” the application should never import OpenAI-specific classes.
- [ ] Making the abstraction layer too thick â€” trying to hide all provider differences results in a least-common-denominator interface.
- [ ] Making the abstraction layer too thin â€” just passing through to the provider SDK without value-add (error mapping, retry, logging).
- [ ] Not handling provider-specific error codes â€” generic "provider error" loses information needed for debugging.
- [ ] Duplicated retry logic
- [ ] Interface too large
- [ ] Provider lock-in
- [ ] Runtime errors on unsupported feature
- [ ] Slow startup

---

# Testing Checklist

- [ ] `supports()` method available for capability detection
- [ ] All cross-cutting concerns are decorators wrapping the provider interface
- [ ] Application code depends only on the provider interface, not concrete adapters.
- [ ] Application code never imports provider-specific types
- [ ] Capability detection works via `supports()` before using features
- [ ] Configuration is normalized across providers with sensible defaults.
- [ ] Cross-cutting concerns (retry, logging, caching) are implemented as decorators.
- [ ] Cross-cutting concerns implemented as decorators, not inside adapters
- [ ] Feature detection checked before using capabilities
- [ ] No provider-specific types imported in application code

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Implement a factory pattern

---

# Anti-Pattern Prevention Checklist

- [ ] [Leaking Provider-Specific Types Through the Abstraction Interface]
- [ ] [Implementing Lowest Common Denominator Interface Only]
- [ ] [Provider-Specific Error Handling Outside the Abstraction]
- [ ] [Bypassing the Abstraction â€” Direct Provider Calls in Business Logic]
- [ ] [Not Implementing Capability Detection in the Abstraction]
- [ ] Abstraction Inversion:
- [ ] Config Sprawl:
- [ ] Fake Provider Abstraction:
- [ ] God Interface:
- [ ] Provider Leakage:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Implement retry, logging, and circuit breaker as composable decorators

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


