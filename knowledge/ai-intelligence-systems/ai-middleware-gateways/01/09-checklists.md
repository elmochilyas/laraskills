# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Implement semantic caching
- [ ] Log every request and response
- [ ] Route by task type, not by model name.
- [ ] Set per-provider rate limits
- [ ] Use health checks
- [ ] All requests are logged with latency, tokens, cost, and status (with PII redaction).
- [ ] API keys are managed centrally and never exposed in logs.
- [ ] Gateway is deployable as a stateless, horizontally scalable service.
- [ ] Rules for AI Gateway Fundamentals
- [ ] All requests are logged with latency, tokens, cost, and status (with PII redaction)
- [ ] API keys are managed centrally and never exposed in logs
- [ ] Gateway is deployable as a stateless, horizontally scalable service
- [ ] **Configure failover**: Define a fallback chain per task type. Implement circuit breaker per provider (failure threshold, cooldown, half-open retries). Route to fallback when primary is unhealthy.
- [ ] **Configure rate limiting**: Set per-key limits (requests per minute, tokens per day) using Redis counters. Enforce server-side. Queue or reject requests that exceed limits with clear error messages.
- [ ] **Define routing rules**: Create a configuration mapping task types (chat, embed, summarize) to provider/model pairs. Reference by task key, not model name. Include fallback providers per task.
- [ ] All requests have structured logs with correlation IDs, latency breakdown, token usage, and cost
- [ ] Cache hit rate >20% for production traffic
- [ ] Failover activates within 30 seconds of primary provider degradation

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

- [ ] Implement semantic caching
- [ ] Log every request and response
- [ ] Route by task type, not by model name.
- [ ] Set per-provider rate limits
- [ ] Use health checks
- [ ] **Configure failover**: Define a fallback chain per task type. Implement circuit breaker per provider (failure threshold, cooldown, half-open retries). Route to fallback when primary is unhealthy.
- [ ] **Configure rate limiting**: Set per-key limits (requests per minute, tokens per day) using Redis counters. Enforce server-side. Queue or reject requests that exceed limits with clear error messages.
- [ ] **Define routing rules**: Create a configuration mapping task types (chat, embed, summarize) to provider/model pairs. Reference by task key, not model name. Include fallback providers per task.
- [ ] **Deploy as a stateless service**: The gateway should be horizontally scalable with Redis for shared state. Deploy behind a load balancer with health checks.
- [ ] **Health check and monitoring**: Configure health check endpoints for the gateway itself and passive health detection for upstream providers. Set up dashboards for latency, errors, cost, and cache performance.
- [ ] **Implement provider-agnostic request/response normalization**: Convert all requests to a standard format and translate to each provider's native schema. Normalize all responses into a unified response DTO.
- [ ] **Implement semantic caching**: Configure a semantic cache middleware that generates embeddings for incoming queries, compares against cached queries using cosine similarity (>0.95 threshold for exact, >0.85 for semantic), and serves cached responses on match.

---

# Performance Checklist

- [ ] Batching: the gateway can batch multiple embedding requests into a single provider call for efficiency.
- [ ] Caching reduces median latency by 40-80% for cached requests. Hit rates of 20-40% are common for production traffic.
- [ ] Connection pooling: reuse HTTP connections to providers to reduce TLS handshake overhead.
- [ ] Gateway overhead should be <50ms (typically 5-20ms). Profile and optimize hot paths (serialization, routing logic).
- [ ] Rate limiting with Redis is ~1ms per check. For high-throughput systems, use local counters with periodic sync.
- [ ] Connection pooling: reuse HTTP connections to providers (saves 100-300ms TLS handshake)
- [ ] Gateway overhead target: <50ms (typically 5-20ms with optimal configuration)
- [ ] Logging: async (queue or UDP) to avoid blocking the request path

---

# Security Checklist

- [ ] API key storage:
- [ ] Authentication:
- [ ] Data residency:
- [ ] Rate limit bypass:
- [ ] Request/response logging:
- [ ] Connection pooling: reuse HTTP connections to providers (saves 100-300ms TLS handshake)
- [ ] Rate limit check: ~1ms via Redis
- [ ] Redact PII from all logs before writing (use PII redaction transform middleware)

---

# Reliability Checklist

- [ ] Building custom gateway logic that duplicates what `laravel/ai` already provides.
- [ ] Caching LLM responses without considering PII â€” cached responses may leak user data to other users.
- [ ] Not implementing provider failover â€” a provider outage takes down the entire application.
- [ ] Over-caching: caching dynamic or time-sensitive requests produces stale responses.
- [ ] Using the gateway as a single point of failure â€” deploy with redundancy and health checks.

---

# Testing Checklist

- [ ] All requests are logged with latency, tokens, cost, and status (with PII redaction)
- [ ] All requests are logged with latency, tokens, cost, and status (with PII redaction).
- [ ] All requests have structured logs with correlation IDs, latency breakdown, token usage, and cost
- [ ] API keys are managed centrally and never exposed in logs
- [ ] API keys are managed centrally and never exposed in logs.
- [ ] Cache hit rate >20% for production traffic
- [ ] Failover activates within 30 seconds of primary provider degradation
- [ ] Gateway is deployable as a stateless, horizontally scalable service
- [ ] Gateway is deployable as a stateless, horizontally scalable service.
- [ ] Gateway overhead <50ms (p95) for all request types

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Gateway â€” Direct Provider Calls from Application]
- [ ] [Gateway Without Observability â€” Opaque Traffic]
- [ ] [Single Provider Behind Gateway â€” No Failover]
- [ ] [Gateway Without Caching â€” Repeated Identical Requests]
- [ ] [No Request/Response Transformation at Gateway]
- [ ] Blind Failover:
- [ ] Gateway as Monolith:
- [ ] Infinite Retries:
- [ ] Logging Everything:
- [ ] Tight Coupling to Provider SDKs:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Logging: async (queue or UDP) to avoid blocking the request path
- [ ] Redact PII from all logs before writing (use PII redaction transform middleware)

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


