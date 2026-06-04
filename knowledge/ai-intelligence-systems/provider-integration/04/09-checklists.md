# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** provider-integration
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Alert on high error rates.
- [ ] Classify every error as retryable or non-retryable.
- [ ] Implement circuit breaker.
- [ ] Log every error with context.
- [ ] Provide fallback.
- [ ] Circuit breaker is implemented with configurable thresholds.
- [ ] Error logs include provider, model, status code, error type, and attempt number.
- [ ] Error taxonomy classifies errors as retryable or non-retryable.
- [ ] Classify Every Error as Retryable or Non-Retryable
- [ ] Implement Circuit Breaker for Provider Calls
- [ ] Implement Retry as a Decorator, Not Inside the Adapter
- [ ] Use Exponential Backoff with Jitter
- [ ] All documented error status codes are mapped to typed exceptions
- [ ] Catch-all handler exists for undocumented errors
- [ ] Circuit breaker half-open state allows recovery testing
- [ ] Circuit breaker prevents cascading failures during provider outages
- [ ] Error classification enables correct retry decisions
- [ ] Error taxonomy is documented and tested for all covered providers

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

- [ ] Alert on high error rates.
- [ ] Classify every error as retryable or non-retryable.
- [ ] Implement circuit breaker.
- [ ] Log every error with context.
- [ ] Provide fallback.
- [ ] Set a maximum retry count (3-5).
- [ ] Use exponential backoff with jitter.
- [ ] Classify Every Error as Retryable or Non-Retryable
- [ ] Implement Circuit Breaker for Provider Calls
- [ ] Implement Retry as a Decorator, Not Inside the Adapter
- [ ] Use Exponential Backoff with Jitter
- [ ] Error message extraction

---

# Performance Checklist

- [ ] Backoff computation is trivial (<0.01ms). Use pre-computed backoff schedules for known providers.
- [ ] Circuit breaker reduces latency during provider outages â€” requests fail fast (1-5ms) instead of waiting for timeouts.
- [ ] Distributed circuit breaker (Redis) adds 1-5ms per check. Use local circuit breaker for faster decision, with periodic sync to distributed state.
- [ ] Retries add latency proportional to backoff duration. Configure timeouts aggressively (5-15s per attempt) so retries don't exhaust request budgets.
- [ ] Retry decorator overhead is <0.1ms when no retry is needed.
- [ ] Circuit breaker reduces latency during provider outages â€” fails fast (1-5ms) instead of waiting for timeouts
- [ ] Exception creation is <0.1ms â€” no performance concern
- [ ] Retries add latency proportional to backoff duration (configure timeouts 5-15s per attempt)

---

# Security Checklist

- [ ] Circuit breaker state:
- [ ] Content policy errors:
- [ ] Error message leakage:
- [ ] Fallback security:
- [ ] Retry amplification:
- [ ] Cap retries and use rate limiting to prevent retry amplification attacks
- [ ] Log full error context internally, return sanitized messages externally
- [ ] Provider error messages may contain internal details â€” sanitize before returning to clients

---

# Reliability Checklist

- [ ] Not differentiating error types â€” treating all errors the same leads to incorrect retry decisions.
- [ ] Not implementing circuit breaker â€” continuing to retry against an overloaded provider makes the problem worse.
- [ ] Retrying indefinitely â€” without a max retry count, a sustained provider outage keeps consumers waiting forever.
- [ ] Retrying non-retryable errors (4xx except 429). Retrying "invalid request" will always fail.
- [ ] Swallowing errors â€” logging "request failed, retrying" without surfacing the error to observability.
- [ ] Using fixed retry intervals â€” creates thundering herd and worsens rate limit issues.
- [ ] Classify Every Error as Retryable or Non-Retryable
- [ ] Implement Circuit Breaker for Provider Calls
- [ ] Implement Retry as a Decorator, Not Inside the Adapter
- [ ] Use Exponential Backoff with Jitter

---

# Testing Checklist

- [ ] All documented error status codes are mapped to typed exceptions
- [ ] Catch-all handler exists for undocumented errors
- [ ] Circuit breaker half-open state allows recovery testing
- [ ] Circuit breaker is implemented with configurable thresholds.
- [ ] Circuit breaker opens after configurable consecutive failures
- [ ] Circuit breaker prevents cascading failures during provider outages
- [ ] Distributed circuit breaker uses shared state (Redis) for multi-instance coordination
- [ ] Each mapped exception includes the correct retryable classification
- [ ] Error classification enables correct retry decisions
- [ ] Error logs include provider, model, status code, and attempt number

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Classify every error as retryable or non-retryable.

---

# Anti-Pattern Prevention Checklist

- [ ] [Immediate Retry â€” No Backoff Between Retries]
- [ ] [Infinite Retry â€” No Maximum Retry Count]
- [ ] [One-Size-Fits-All Retry Policy]
- [ ] [Retrying Non-Retryable Errors]
- [ ] [No Circuit Breaker â€” Retrying Against Overloaded Provider]
- [ ] Immediate Retry:
- [ ] Infinite Retry:
- [ ] One-Size-Fits-All Retry:
- [ ] Retry Spiral:
- [ ] Silent Failure:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log full error context internally, return sanitized messages externally

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


