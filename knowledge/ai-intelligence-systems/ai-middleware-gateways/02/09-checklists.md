# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Consider semantic equivalence.
- [ ] Log every failover event
- [ ] Set health check intervals
- [ ] Test failover paths regularly.
- [ ] Use circuit breakers with exponential backoff
- [ ] Circuit breaker is configured with failure threshold, cooldown, and half-open max requests.
- [ ] Failover events are logged with provider, error, and fallback decision.
- [ ] Failover is tested regularly (automated chaos testing).
- [ ] Rules for Load Balancing & Failover Strategies
- [ ] Circuit breaker is configured with failure threshold, cooldown, and half-open max requests
- [ ] Failover events are logged with provider, error, and fallback decision
- [ ] Failover is tested regularly (automated chaos testing, monthly minimum)
- [ ] **Configure circuit breakers per provider**: Initialize a `CircuitBreaker` for each provider with provider-specific thresholds (more lenient for 429 rate limits, stricter for 401/403 auth errors). Store state in Redis for cross-instance consistency.
- [ ] **Define the provider pool**: Configure each provider with model, endpoint, API key, priority weight, rate limits, and geographic region. Include health check configuration per provider.
- [ ] **Fall back gracefully**: Define a fallback chain (primary â†’ secondary â†’ tertiary). Limit to 2-3 fallback hops max. On complete failure of all fallbacks, return a graceful degradation response.
- [ ] Circuit breaker opens appropriately for each provider based on its error characteristics
- [ ] Failover chain completes within 2x the normal request time limit with graceful degradation as final fallback
- [ ] Failover events are logged with full context for post-mortem analysis

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

- [ ] Consider semantic equivalence.
- [ ] Log every failover event
- [ ] Set health check intervals
- [ ] Test failover paths regularly.
- [ ] Use circuit breakers with exponential backoff
- [ ] **Configure circuit breakers per provider**: Initialize a `CircuitBreaker` for each provider with provider-specific thresholds (more lenient for 429 rate limits, stricter for 401/403 auth errors). Store state in Redis for cross-instance consistency.
- [ ] **Define the provider pool**: Configure each provider with model, endpoint, API key, priority weight, rate limits, and geographic region. Include health check configuration per provider.
- [ ] **Fall back gracefully**: Define a fallback chain (primary â†’ secondary â†’ tertiary). Limit to 2-3 fallback hops max. On complete failure of all fallbacks, return a graceful degradation response.
- [ ] **Handle failures**: On provider error, record the failure in the circuit breaker. If the failure count exceeds the threshold, open the circuit for the cooldown period. Retry with the next provider in the failover chain.
- [ ] **Implement health checks**: Set up active health checks at 30-60 second intervals using lightweight requests. Supplement with passive health detection from real request failures.
- [ ] **Implement routing strategy interface**: Create a `RoutingStrategy` interface with `select(array $pool, RequestContext $context): ProviderEndpoint`. Implement strategy classes: `WeightedRandomStrategy`, `LatencyAwareStrategy`, `CostAwareStrategy`, `RoundRobinStrategy`.
- [ ] **Log failover events**: Every failover event must be logged with provider, error code, circuit breaker state, and fallback decision. Use these logs to tune thresholds.

---

# Performance Checklist

- [ ] Circuit breaker state changes should be async â€” don't block requests waiting for health checks.
- [ ] Connection pooling per provider: ~10-50 connections per provider is typical.
- [ ] Failover adds latency equal to the original request timeout (usually 10-30s). Optimize timeouts to fail fast.
- [ ] Health checks add overhead â€” use lightweight requests (e.g., a simple chat completion with a tiny model).
- [ ] Weighted random routing is O(1); latency-based routing requires recent metrics and is O(n).
- [ ] All providers in the pool must meet the same security and compliance requirements
- [ ] Connection pooling per provider: 10-50 connections per provider
- [ ] Failover adds latency equal to the original request timeout (optimize timeouts to fail fast: 5-10s for fallback)

---

# Security Checklist

- [ ] Audit failover decisions:
- [ ] Failover to untrusted providers:
- [ ] Health check endpoints:
- [ ] Provider credential isolation:
- [ ] Sticky sessions and data isolation:

---

# Reliability Checklist

- [ ] Assuming all models produce equivalent outputs â€” test failover quality before enabling automatic failover.
- [ ] Not configuring a fallback â€” when the primary provider goes down, all requests fail.
- [ ] Not monitoring failover frequency â€” frequent failovers indicate a chronic issue with the primary provider.
- [ ] Performing health checks against non-production endpoints (e.g., hitting the billing API instead of the chat endpoint).
- [ ] Using too short a circuit breaker cooldown â€” the provider may still be recovering, causing repeated failures.
- [ ] Rules for Load Balancing & Failover Strategies

---

# Testing Checklist

- [ ] Circuit breaker is configured with failure threshold, cooldown, and half-open max requests
- [ ] Circuit breaker is configured with failure threshold, cooldown, and half-open max requests.
- [ ] Circuit breaker opens appropriately for each provider based on its error characteristics
- [ ] Failover chain completes within 2x the normal request time limit with graceful degradation as final fallback
- [ ] Failover events are logged with full context for post-mortem analysis
- [ ] Failover events are logged with provider, error, and fallback decision
- [ ] Failover events are logged with provider, error, and fallback decision.
- [ ] Failover is tested regularly (automated chaos testing).
- [ ] Failover is tested regularly (automated chaos testing, monthly minimum)
- [ ] Fallback chain is defined per task type with max 2-3 fallback hops

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Failover Without Provider-Specific Timeouts â€” Slow Provider Delays All]
- [ ] [No Fallback Model Mapping â€” Same Model Name Fails on Backup]
- [ ] [Failover Circuit Breaker Not Synced Across Instances]
- [ ] [Failover Not Tested â€” Production First Exercise]
- [ ] [Failover Without Cost Consideration â€” Backup More Expensive]
- [ ] Failover Cascade:
- [ ] Hardcoded Fallback Order:
- [ ] Health Check Noise:
- [ ] Provider Starvation:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log failover decisions with audit trail (why failover occurred, which provider selected)

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


