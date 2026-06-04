# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** retry-strategies
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Exponential backoff with jitter implemented
- [ ] Idempotency verified before retry of write operations
- [ ] Maximum retry count capped (3-5)
- [ ] Cap Maximum Retries
- [ ] Only Retry on Retryable Status Codes
- [ ] Set Overall Deadline for Retry Sequence
- [ ] Use Exponential Backoff with Jitter
- [ ] Verify Idempotency Before Retrying Writes
- [ ] Exponential backoff with jitter configured
- [ ] Failure classification defines retryable vs non-retryable
- [ ] Maximum attempts and delay capped
- [ ] Add jitter to prevent thundering herd
- [ ] Cap maximum delay
- [ ] Choose retry strategy: exponential backoff for most APIs

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add jitter to prevent thundering herd
- [ ] Cap maximum delay
- [ ] Choose retry strategy: exponential backoff for most APIs
- [ ] Classify failures: transient (retry) vs permanent (don't retry)
- [ ] Configure initial delay, multiplier, max attempts
- [ ] Integrate with circuit breaker for upstream outage protection
- [ ] Log retry attempts and delays for monitoring
- [ ] Use `Http::retry()` for simple cases, job `$backoff` for queues
- [ ] Cap Maximum Retries
- [ ] Only Retry on Retryable Status Codes
- [ ] Set Overall Deadline for Retry Sequence
- [ ] Use Exponential Backoff with Jitter

---

# Performance Checklist

- [ ] 3 retries with 1s, 2s, 4s backoff adds minimum 7s to request
- [ ] Each retry adds latency equal to backoff + request time
- [ ] Jitter adds 0-50% variance to backoff time
- [ ] Retry budget reduces load during degradation

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Infinite retries (resource exhaustion)
- [ ] No jitter on retry timing (thundering herd)
- [ ] No retry budget leading to retry amplification
- [ ] Not checking idempotency before retry (duplicate writes)
- [ ] Retrying 4xx errors (wasteful, may cause account lockout)
- [ ] Retrying after timeout without shorter per-attempt timeout
- [ ] Only Retry on Retryable Status Codes
- [ ] Set Overall Deadline for Retry Sequence
- [ ] Use Exponential Backoff with Jitter
- [ ] Verify Idempotency Before Retrying Writes

---

# Testing Checklist

- [ ] Exponential backoff with jitter configured
- [ ] Exponential backoff with jitter implemented
- [ ] Failure classification defines retryable vs non-retryable
- [ ] Idempotency verified before retry of write operations
- [ ] Maximum attempts and delay capped
- [ ] Maximum retry count capped (3-5)
- [ ] Overall deadline for retry sequence
- [ ] Retry activity logged for monitoring
- [ ] Retry integrated with circuit breaker
- [ ] Retry logging for debugging and monitoring

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Retrying 4xx Client Errors (Wasted Resources, Account Lockout)]
- [ ] [Pure Exponential Backoff Without Jitter (Thundering Herd)]
- [ ] [No Maximum Retry Cap (Infinite Resource Exhaustion)]
- [ ] [No Overall Deadline for Retry Sequence]
- [ ] [Retrying Write Operations Without Idempotency Keys]

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


