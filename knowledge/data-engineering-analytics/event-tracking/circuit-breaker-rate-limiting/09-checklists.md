# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** circuit-breaker-rate-limiting
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Circuit breaker states (closed, open, half-open) understood for external analytics API calls
- [ ] Rate limiter configuration for each external dependency (geo-IP, user-agent parser, reverse DNS, spam filters)
- [ ] Failure threshold tuned per external service based on latency profiles
- [ ] Half-open probe interval configured to avoid thundering herd on recovery
- [ ] Degraded fallback behavior defined for tracking pipeline when circuit is open
- [ ] Queue retry vs circuit breaker interaction designed (no retry while circuit open)

---

# Architecture Checklist

- [ ] Circuit breaker placed between middleware enrichment layer and each external dependency call
- [ ] Rate limiter scoped per external analytics API endpoint, not globally
- [ ] Degraded fallback path returns cached or stub enrichment data when circuit open
- [ ] Half-open probe frequency tuned to match external service recovery time
- [ ] Failure threshold and timeout values separate per service type (read vs write APIs)
- [ ] Circuit breaker not applied to local/pure functions — only to external network calls

---

# Implementation Checklist

- [ ] Circuit breaker state machine implemented with persistent storage (closed/open/half-open transitions)
- [ ] Rate limiter uses token bucket or sliding window algorithm stored in Redis
- [ ] Half-open probe sends limited test requests before transitioning to closed
- [ ] Failed request count tracked in cache with configurable TTL threshold
- [ ] Degraded fallback returns last-known-good enrichment data or empty stub gracefully
- [ ] Circuit breaker state survives worker restart (Redis or database-backed)

---

# Performance Checklist

- [ ] Circuit breaker state check is O(1) in-memory lookup — no database query per request
- [ ] Rate limiter counters use Redis INCR with appropriate expiry, not database writes
- [ ] Half-open probe interval prevents request pile-up on service recovery
- [ ] Circuit breaker reset cooldown prevents rapid open/close oscillation (no flapping)
- [ ] Rate limiter capacity aligned with external API rate limits and burst allowance

---

# Security Checklist

- [ ] Rate limiter keyed by client API key, not IP alone (prevents spoofing bypass)
- [ ] Circuit breaker does not leak internal error details in degraded fallback responses
- [ ] Half-open probe uses safe read-only requests, not data mutations
- [ ] Rate limit headers (X-RateLimit-Remaining) exposed without revealing internal thresholds
- [ ] Circuit breaker state observable in metrics without exposing security-sensitive configuration

---

# Reliability Checklist

- [ ] Retry with exponential backoff configured for transient failures before circuit opens
- [ ] Circuit breaker trips after consecutive failures exceeding configurable threshold for each service
- [ ] Half-open probe resets failure count on success, transitions to closed
- [ ] Degraded fallback returns meaningful response, not empty silence or exception
- [ ] Circuit breaker state persisted and recoverable after application restart

---

# Testing Checklist

- [ ] Unit test circuit breaker state transitions: closed -> open -> half-open -> closed
- [ ] Unit test rate limiter resets correctly after window expiry
- [ ] Integration test half-open probe with mock external service that alternates success/failure
- [ ] Test degraded fallback returns gracefully with circuit open — no crash or exception
- [ ] Test circuit breaker interaction with queue retry — job not retried while circuit is open
- [ ] Test concurrent rate limiter access from multiple workers

---

# Maintainability Checklist

- [ ] Circuit breaker and rate limiter configuration in config file per service, not hardcoded
- [ ] Degraded fallback logic isolated in dedicated class, not scattered across middleware or jobs
- [ ] Rate limiter and circuit breaker each in separate classes (single responsibility)
- [ ] State machine transitions documented in code comments with threshold rationale
- [ ] Tests structured per scenario (state transition, window reset, concurrent access)

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use circuit breaker for local/latency-free calls — only for external network dependencies
- [ ] Do not make rate limiter block synchronously — use async decrement or token bucket
- [ ] Do not fallback to silent no-op — always return a degraded but meaningful response
- [ ] Do not mix rate limiter and circuit breaker into same class — separate concerns
- [ ] Do not hardcode failure thresholds — read from config/env with documented defaults

---

# Production Readiness Checklist

- [ ] Prometheus/Grafana metrics for circuit state, rate limit counter, and failure count per service
- [ ] Logged warnings at WARN level for state transitions (open, half-open, closed) with service name
- [ ] Alert configured if circuit remains open longer than expected threshold for any service
- [ ] Rate limit burst capacity matches peak analytics load during traffic spikes
- [ ] Circuit breaker togglable per-service via config flag for emergency override
- [ ] Deploy checklist includes verification of circuit breaker thresholds for new external services

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: circuit placement, rate limiter scoping, fallback path defined
- [ ] Security requirements satisfied: key-based rate limiting, no internal detail leakage, safe probes
- [ ] Performance requirements satisfied: O(1) state checks, Redis counters, no oscillation
- [ ] Testing requirements satisfied: state transitions, window resets, concurrent access, fallback behavior
- [ ] Anti-pattern checks passed: no local use, no sync blocking, no silent fallback, no hardcoded config
- [ ] Production readiness verified: metrics, alerts, burst capacity, emergency toggle, deploy checklist

---

# Related References

- K001 (Middleware Event Tracking): Enrichment failures happen in tracking middleware
- K002 (Queue Dispatching): Queue retry vs circuit breaker interaction
- K017 (Kafka CDC): Circuit breaker for Kafka producer failures
