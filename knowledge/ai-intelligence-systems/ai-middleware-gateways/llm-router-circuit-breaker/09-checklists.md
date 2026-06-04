# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** llm-router-circuit-breaker
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] A/B provider testing
- [ ] Airline Rebooking
- [ ] Cost-aware routing
- [ ] Data Center Failover
- [ ] Exponential backoff on fallback
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for LLM Router & Circuit Breaker

---

# Architecture Checklist

- [ ] Cache
- [ ] PHP
- [ ] Synchronous failover vs. async retry queue â†’ Synchronous for user
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] A/B provider testing
- [ ] Airline Rebooking
- [ ] Cost-aware routing
- [ ] Data Center Failover
- [ ] Exponential backoff on fallback
- [ ] Fuse Box
- [ ] Provider health dashboard
- [ ] Stale response fallback
- [ ] Rules for LLM Router & Circuit Breaker

---

# Performance Checklist

- [ ] Cache circuit breaker state aggressively â€” TTL should match recovery timeout
- [ ] Circuit breaker state check is ~1-10ms (Redis read) â€” negligible overhead
- [ ] Failover chain adds latency proportional to number of attempts â€” each failed provider call consumes 2-10s
- [ ] Health checks should be async (queued jobs) â€” synchronous health checks during agent calls add latency
- [ ] Use `useSmartestModel()` attribute with fallback â€” combines model selection with failover

---

# Security Checklist

- [ ] Alert when all fallbacks are exhausted â€” this is a critical incident for AI-dependent features
- [ ] Implement degradation endpoints â€” when circuit is open, return degraded response instead of error
- [ ] Log every failover event with provider, model, error, and latency â€” build failover analytics
- [ ] Monitor circuit breaker open/close events â€” unexpected trips signal provider issues or misconfiguration
- [ ] Test circuit breaker behavior with chaos engineering â€” simulate provider failures in staging
- [ ] Tune `failure_threshold` per provider â€” OpenAI's 429 rate limits are transient (retryable), Claude's 529 overloads may require longer cooldown

---

# Reliability Checklist

- [ ] Forgetting cache persistence â€” if Redis restarts, all circuits reset to closed state, causing a burst of failures
- [ ] Not considering cost implications â€” failover from `gpt-4o` to `claude-opus` could increase cost 5x without warning
- [ ] Not distinguishing retryable vs. non-retryable errors â€” invalid request errors (400) should not count toward circuit breaker threshold
- [ ] Setting `failure_threshold` too low â€” transient rate limits (429) trip the breaker unnecessarily, reducing provider utilization
- [ ] Using circuit breaker without fallback â€” if breaker opens and no fallback is configured, requests fail when they could have used an alternative
- [ ] Rules for LLM Router & Circuit Breaker

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Simple Round-Robin Routing Without Health Checks]
- [ ] [Circuit Breaker Without Half-Open Recovery State]
- [ ] [All Models in Same Circuit Breaker â€” One Failure Blocks All]
- [ ] [No Affinity â€” Same Conversation Routed to Different Models]
- [ ] [Router Without Latency-Based Steering]
- [ ] Cache failure
- [ ] Fallback exhaustion
- [ ] Infinite failover loop
- [ ] Split-brain
- [ ] Thundering herd

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


