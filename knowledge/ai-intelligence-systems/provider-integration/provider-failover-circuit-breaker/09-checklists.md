# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** provider-integration
**Knowledge Unit:** provider-failover-circuit-breaker
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Circuit breaker pattern
- [ ] Cost-aware failover
- [ ] Database read replicas
- [ ] Graceful degradation
- [ ] Ordered failover
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Configure a Failover Chain
- [ ] Ensure Feature Parity Across Failover Providers
- [ ] Monitor Failover Frequency
- [ ] Test Failover Paths in Staging
- [ ] Circuit breaker wraps provider calls with configurable thresholds
- [ ] Exponential backoff with jitter implemented
- [ ] Failover activations logged and alerted
- [ ] Classify every error as retryable or non-retryable
- [ ] Configure a failover chain in `config/ai.php` with at least 2 providers
- [ ] Implement or use a circuit breaker that opens after N consecutive failures
- [ ] All failover paths are tested in staging
- [ ] Circuit breaker opens after configurable threshold, fails fast during cooldown

---

# Architecture Checklist

- [ ] Client
- [ ] Failover at provider level vs. model level â†’ Laravel AI SDK supports both. Provider
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Circuit breaker pattern
- [ ] Cost-aware failover
- [ ] Database read replicas
- [ ] Graceful degradation
- [ ] Ordered failover
- [ ] Smart failover
- [ ] Classify every error as retryable or non-retryable
- [ ] Configure a failover chain in `config/ai.php` with at least 2 providers
- [ ] Implement or use a circuit breaker that opens after N consecutive failures
- [ ] Implement retry as a decorator wrapping the provider adapter, not inside it
- [ ] Log and alert on every failover activation
- [ ] Monitor failover rate per provider over time

---

# Performance Checklist

- [ ] Circuit breaker state checks are in-memory (or Redis-backed) â€” negligible latency
- [ ] Cost amplification
- [ ] Failover chain attempts are sequential â€” each adds provider round-trip time
- [ ] Feature inconsistency
- [ ] Health check probes add background HTTP traffic â€” schedule at 30-60s intervals, not per-request
- [ ] Latency impact

---

# Security Checklist

- [ ] Define failover chains in `config/ai.php` for observability â€” not scattered across agent classes
- [ ] Implement alerting on failover activations â€” silent failover masks provider problems
- [ ] Monitor failover frequency â€” rising failover rate signals provider degradation
- [ ] Set `MaxSteps` lower on failover agents â€” retry loops compound token costs
- [ ] Test failover paths in staging â€” don't discover broken fallback during production outage

---

# Reliability Checklist

- [ ] Circuit breaker with too-aggressive thresholds â€” unnecessary failovers from transient errors
- [ ] Defining failover chains with providers that don't support the same features (e.g., tool calling on all providers)
- [ ] Failover to costlier model without budget guardrails â€” unexpected bills during outages
- [ ] No failover at all â€” single provider dependency leads to complete AI outage
- [ ] Not testing failover paths â€” broken fallback discovered during real outage
- [ ] All traffic to single provider
- [ ] Failover breaks features
- [ ] Failover never tested
- [ ] Retries on doomed requests
- [ ] Retry logic duplicated

---

# Testing Checklist

- [ ] All failover paths are tested in staging
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Circuit breaker opens after configurable threshold, fails fast during cooldown
- [ ] Circuit breaker wraps provider calls with configurable thresholds
- [ ] Core concepts are understood and applied correctly.
- [ ] Exponential backoff with jitter implemented
- [ ] Failover activates automatically when primary provider fails
- [ ] Failover activations are logged and alerted
- [ ] Failover activations logged and alerted

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Circuit breaker pattern

---

# Anti-Pattern Prevention Checklist

- [ ] [Failover Without Circuit Breaker â€” Blind Retries to All Providers]
- [ ] [All Providers in Same Circuit Breaker Group]
- [ ] [Hardcoded Provider Order Without Dynamic Health Assessment]
- [ ] [No Fallback Model â€” Same Model Name Fails on All Providers]
- [ ] [Stateful Circuit Breaker Without Shared Backing Store]
- [ ] All providers degraded
- [ ] Circuit breaker false positive
- [ ] Model continuity failure
- [ ] Rate limit cascade

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log failover events with provider name and error detail for audit
- [ ] Monitor failover rate to detect provider degradation early
- [ ] Retry decorator keeps adapter focused on provider-specific logic

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


