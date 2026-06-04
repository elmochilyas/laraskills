---
id: ku-02
title: "Load Balancing & Failover Strategies - Rules"
subdomain: "ai-middleware-gateway"
ku-type: "strategic"
date-created: "2026-06-02"
---

## Rules for Load Balancing & Failover Strategies

### R1: Test failover paths at least monthly with automated chaos testing
- **Category:** Reliability
- **Rule:** Schedule regular automated tests that simulate provider outages and verify that failover chains work end-to-end; never assume untested failover will work in production.
- **Reason:** Untested failover is hypothetical failover. Configuration drift, credential expiration, or provider API changes can silently break fallback paths. Failover that hasn't been tested in 6 months will fail when needed.
- **Bad Example:** A failover chain configured and never tested; when the primary provider has an outage, the fallback provider's API key expired last month.
- **Good Example:** A scheduled chaos engineering job that disables the primary provider in staging and validates that the fallback chain returns acceptable responses.
- **Exceptions:** Provider contracts that prohibit automated testing.
- **Consequences of Violation:** Failover silently broken when needed, leading to extended downtime during provider outages.

### R2: Implement circuit breakers with provider-specific thresholds, not one-size-fits-all
- **Category:** Reliability
- **Rule:** Configure separate circuit breaker thresholds per provider — higher tolerance for transient errors (429 rate limits, 5xx overloads) vs. immediate trip for auth errors (401, 403).
- **Reason:** Different providers have different error characteristics. OpenAI returns 429s frequently under load (retryable), while Anthropic's 529s indicate server overload. A single threshold either trips too frequently or fails to protect.
- **Bad Example:** A global circuit breaker set to open after 5 failures for all providers indiscriminately.
- **Good Example:** OpenAI circuit: 10 failures/60s for 429s, 3 failures/60s for 5xx. Anthropic circuit: 3 failures/120s for 529s.
- **Exceptions:** Uniform error-handling SLAs across all providers.
- **Consequences of Violation:** Circuit breaker either opens too frequently (false positives — rejecting healthy providers) or stays closed during actual degradation (false negatives — continuing to send traffic to failing providers).

### R3: Share provider health status across all gateway instances via Redis
- **Category:** Architecture
- **Rule:** Store provider circuit breaker state in a shared Redis store so all gateway instances have a consistent view of provider health; never use local in-memory state.
- **Reason:** Without shared state, one gateway instance may open a circuit and stop routing to a provider while another instance continues routing to the same failing provider, defeating the circuit breaker's purpose.
- **Bad Example:** Circuit breaker state stored in-process memory; a multi-instance deployment sends 50% of traffic to a failing provider.
- **Good Example:** A `RedisCircuitBreaker` that uses `SETNX` with TTL for atomic state transitions visible to all instances.
- **Exceptions:** Single-instance deployments.
- **Consequences of Violation:** Inconsistent provider health state across instances; the failing provider still receives traffic from healthy instances, causing partial failures.
