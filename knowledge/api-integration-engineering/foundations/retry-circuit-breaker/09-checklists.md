# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** retry-circuit-breaker
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Circuit breaker classifies 5xx as failures, 4xx as non-failures
- [ ] Event listeners fire on state transitions
- [ ] Half-open probes test recovery automatically
- [ ] Classify Failures: 5xx Trips Breaker, 4xx Does Not
- [ ] Implement Half-Open Probes for Automatic Recovery
- [ ] Set Minimum Requests Before Evaluating Failure Rate
- [ ] Stop Retry When Circuit Breaker Is Open
- [ ] Use Redis for Distributed Circuit State
- [ ] Circuit breaker states (Closed, Open, Half-Open) working
- [ ] Circuit state changes logged
- [ ] Failure classification: retryable vs non-retryable
- [ ] Classify failures: 5xx, timeouts, connection errors are retryable; 4xx are not
- [ ] Configure exponential backoff: `->retry(3, fn ($attempt) => $attempt * 1000)`
- [ ] For queue jobs: use `harris21/laravel-fuse` for persistence across process restarts

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Classify failures: 5xx, timeouts, connection errors are retryable; 4xx are not
- [ ] Configure exponential backoff: `->retry(3, fn ($attempt) => $attempt * 1000)`
- [ ] For queue jobs: use `harris21/laravel-fuse` for persistence across process restarts
- [ ] Implement circuit breaker: Open after N failures, Half-Open after timeout, Close on success
- [ ] Log retry attempts and circuit state changes for monitoring
- [ ] Set maximum retry count with jitter to prevent thundering herd
- [ ] Test retry behavior with mock failure sequences
- [ ] Use `Http::retry(3, 100)` for simple retry with 100ms delay
- [ ] Classify Failures: 5xx Trips Breaker, 4xx Does Not
- [ ] Implement Half-Open Probes for Automatic Recovery
- [ ] Set Minimum Requests Before Evaluating Failure Rate
- [ ] Stop Retry When Circuit Breaker Is Open

---

# Performance Checklist

- [ ] Half-Open probing: single request per timeout period
- [ ] Open state: request rejected in ~1ms vs waiting for timeout (30s+)
- [ ] State check: single cache read (~1-5ms)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Counting 429 as circuit breaker failures (rate limits != service outage)
- [ ] Not implementing half-open probes (circuit stays open forever)
- [ ] Retrying when circuit is open (wastes resources on guaranteed failure)
- [ ] Using file cache for state in multi-worker deployments
- [ ] Stop Retry When Circuit Breaker Is Open
- [ ] Use Redis for Distributed Circuit State

---

# Testing Checklist

- [ ] Circuit breaker classifies 5xx as failures, 4xx as non-failures
- [ ] Circuit breaker states (Closed, Open, Half-Open) working
- [ ] Circuit state changes logged
- [ ] Event listeners fire on state transitions
- [ ] Failure classification: retryable vs non-retryable
- [ ] Half-open probes test recovery automatically
- [ ] Jitter added to prevent thundering herd
- [ ] Retry configured with exponential backoff
- [ ] Retry stops when circuit breaker opens
- [ ] Retry/breaker behavior tested with mock failures

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Retrying When Circuit Breaker Is Open]
- [ ] [Counting 4xx Errors (Including 429) as Circuit Breaker Failures]
- [ ] [No Half-Open Probes for Automatic Recovery]
- [ ] [File/In-Memory Circuit State in Multi-Worker Deployments]
- [ ] [No Circuit Breaker at All â€” Retry-Only Pattern]

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


