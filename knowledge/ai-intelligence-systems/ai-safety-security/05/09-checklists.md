# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Allow bursting
- [ ] Always return meaningful error responses:
- [ ] Implement layered rate limits:
- [ ] Notify users approaching limits
- [ ] Use token-aware limits, not just request counts.
- [ ] 429 responses include `Retry-After` header and a clear error message.
- [ ] Rate limit policies are configurable per environment, plan, and endpoint.
- [ ] Rate limit service failure results in graceful degradation (fail-open logged).
- [ ] Rules for Tool Argument Validation
- [ ] 429 responses include Retry-After header and a clear error message
- [ ] Rate limit policies are configurable per environment, plan, and endpoint
- [ ] Rate limit service failure results in graceful degradation (fail-open logged)
- [ ] **Define rate limit tiers**: Create limit configurations per user tier (free, pro, enterprise), per endpoint (chat vs. embed vs. batch), and per model (cheap models vs. expensive models). Store in config with hot-reload capability.
- [ ] **Detect abuse patterns**: Monitor for: multiple accounts from same IP, rapid-fire requests without pauses, repeated injection attempts, unusual request size patterns. Flag and escalate.
- [ ] **Implement application-level request limits**: Add middleware that checks per-user request count using Redis sliding window counter. Return 429 with Retry-After header when exceeded. Track by user ID for authenticated, IP for anonymous.
- [ ] 429 responses include Retry-After header and clear messages in all cases
- [ ] Concurrency limits prevent any single user from consuming all workers
- [ ] Rate limit service failure results in graceful degradation (requests allowed, logged)

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

- [ ] Allow bursting
- [ ] Always return meaningful error responses:
- [ ] Implement layered rate limits:
- [ ] Notify users approaching limits
- [ ] Use token-aware limits, not just request counts.
- [ ] **Define rate limit tiers**: Create limit configurations per user tier (free, pro, enterprise), per endpoint (chat vs. embed vs. batch), and per model (cheap models vs. expensive models). Store in config with hot-reload capability.
- [ ] **Detect abuse patterns**: Monitor for: multiple accounts from same IP, rapid-fire requests without pauses, repeated injection attempts, unusual request size patterns. Flag and escalate.
- [ ] **Implement application-level request limits**: Add middleware that checks per-user request count using Redis sliding window counter. Return 429 with Retry-After header when exceeded. Track by user ID for authenticated, IP for anonymous.
- [ ] **Implement concurrency limits**: Use Redis INCR/DECR to track simultaneous requests per user. Reject if concurrency exceeds limit. Prevents a single user from consuming all workers.
- [ ] **Implement cost-based limits**: Compute cost from token usage Ã— model pricing. Enforce daily/weekly/monthly spend caps. Critical for preventing budget overruns from runaway agents or abuse.
- [ ] **Implement graduated responses**: At 80% usage: warning notification. At 90%: warning + reduced priority. At 100%: hard block with clear message and time-to-reset. After repeated violations: permanent block (requires manual review).
- [ ] **Implement infrastructure-level limits**: Configure nginx/Cloudflare rate limiting for baseline protection (requests per IP per second). This catches distributed attacks before they reach the application.

---

# Performance Checklist

- [ ] Cache rate limit policy definitions (not the counters) locally with short TTL (60 seconds).
- [ ] Concurrency limits require atomic operations (Redis INCR/DECR on request start/end).
- [ ] For high-throughput systems (>1000 req/s), use **local counters** with periodic sync to Redis (eventual consistency is acceptable for rate limiting).
- [ ] Redis-based rate limiting adds <1ms per check. Use pipelining for batched checks.
- [ ] Token counting (prompt + completion) should be fast (<0.1ms). Use pre-computed estimates where exact counting is not needed.
- [ ] Cache policy definitions locally with 60s TTL
- [ ] Cost computation: <0.1ms (cached pricing table lookup)
- [ ] Don't expose detailed rate limit state (remaining budget) to unauthenticated users (helps attackers optimize)

---

# Security Checklist

- [ ] Cost-based attacks:
- [ ] Graceful degradation:
- [ ] Rate limit bypass:
- [ ] Rate limit header information:
- [ ] Resource exhaustion:
- [ ] Attackers may use distributed attacks (many IPs, many API keys) â€” implement behavioral analysis alongside rate limits
- [ ] Cost-based attacks: attacker triggers expensive model calls â€” always rate limit by cost, not just requests
- [ ] Don't expose detailed rate limit state (remaining budget) to unauthenticated users (helps attackers optimize)

---

# Reliability Checklist

- [ ] Applying the same limits to all endpoints â€” streaming endpoints should have different limits than batch endpoints.
- [ ] Exposing detailed rate limit state to unauthenticated users.
- [ ] Not rate limiting at the infrastructure level â€” application-level limits can be bypassed by direct network access.
- [ ] Only rate limiting by request count, ignoring token/cost consumption.
- [ ] Using fixed-window rate limiting without handling window boundary spikes (sliding window preferred).

---

# Testing Checklist

- [ ] 429 responses include `Retry-After` header and a clear error message.
- [ ] 429 responses include Retry-After header and a clear error message
- [ ] 429 responses include Retry-After header and clear messages in all cases
- [ ] Concurrency limits prevent any single user from consuming all workers
- [ ] Rate limit policies are configurable per environment, plan, and endpoint
- [ ] Rate limit policies are configurable per environment, plan, and endpoint.
- [ ] Rate limit service failure results in graceful degradation (fail-open logged)
- [ ] Rate limit service failure results in graceful degradation (fail-open logged).
- [ ] Rate limit service failure results in graceful degradation (requests allowed, logged)
- [ ] Rate limit state is stored in Redis (distributed, shared across instances)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Hardcoded Rate Limits](#1-hardcoded-rate-limits)]
- [ ] [[Punitive Throttling](#2-punitive-throttling)]
- [ ] [[No Limit Visibility](#3-no-limit-visibility)]
- [ ] [[Synchronous Blocking in Rate Limiting](#4-synchronous-blocking-in-rate-limiting)]
- [ ] [[Single Rate Limiter for All Traffic](#5-single-rate-limiter-for-all-traffic)]
- [ ] Hardcoded Limits:
- [ ] No Limit Visibility:
- [ ] Punitive Throttling:
- [ ] Single Rate Limiter:
- [ ] Synchronous Blocking:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] If rate limit service fails, allow requests with warning log (fail-open for rate limiting)

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


