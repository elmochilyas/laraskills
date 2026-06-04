# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** retry-circuit-breaker
**Generated:** 2026-06-03

---

# Decision Inventory

1. Retry vs Circuit Breaker Coordination
2. Failure Classification Strategy
3. Circuit Breaker State Management

---

# Architecture-Level Decision Trees

---

## Retry vs Circuit Breaker Coordination

---

## Decision Context

Coordinating retry logic with circuit breaker to avoid wasteful retries during outages.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the circuit breaker in Open state?
↓
YES → Skip retry entirely; fail fast or use fallback
  ↓
  Is circuit in Half-Open state?
  ↓
  YES → Allow one probe request; no retry on probe failure
  NO → Circuit is Closed; proceed with retry logic
NO → Is this a transient failure (timeout, 503)?
  ↓
  YES → Retry with exponential backoff + jitter
  ↓
  Did retry succeed within max attempts?
  ↓
  YES → Return response; reset circuit failure count
  NO → Record failure; check if circuit threshold exceeded
NO → Is this a non-retryable failure (4xx)?
  ↓
  YES → Do not retry; do not count toward circuit breaker
  NO → Handle based on classification

---

## Rationale

Circuit breaker prevents retry from hammering a downed service. Retry handles transient blips when the circuit is healthy. Combined, they provide comprehensive resilience: retry for blips, circuit breaker for outages.

---

## Recommended Default

**Default:** Retry (3 attempts, exponential backoff) + circuit breaker (5 failures in 60s)
**Reason:** Standard resilience configuration that handles both transient and persistent failures

---

## Risks Of Wrong Choice

Retrying when circuit is open wastes resources on guaranteed failure. No circuit breaker means retry storms during outages cause cascading failures.

---

## Related Rules

Retry only when circuit is closed, Classify failures correctly

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Failure Classification Strategy

---

## Decision Context

Determining which HTTP errors are retryable and which trip the circuit breaker.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the status code 5xx (server error)?
↓
YES → Retryable; count toward circuit breaker failure threshold
NO → Is the status code 429 (rate limited)?
  ↓
  YES → Retryable (after Retry-After); DO NOT count toward circuit breaker
  NO → Is the status code 4xx (client error)?
    ↓
    YES → NOT retryable; do NOT count toward circuit breaker
      ↓
      Exception: 409 Conflict may be retryable with fresh data?
      ↓
      YES → Conditional retry with reconciliation
      NO → Return error immediately
    NO → Network/timeout errors?
      ↓
      YES → Retryable; count toward circuit breaker
      NO → Unexpected; log and escalate

---

## Rationale

5xx and network errors indicate upstream problems — retry and track for circuit breaking. 4xx (except 409/429) are client errors that won't succeed on retry. 429 are rate limits — retry but don't open circuit.

---

## Recommended Default

**Default:** Retry 5xx, timeout, 429; trip breaker on 5xx + timeout; never retry 4xx
**Reason:** Industry-standard classification used by AWS SDK, Istio, and others

---

## Risks Of Wrong Choice

Counting 429 as circuit failures opens breaker on rate limits, not actual outages. Retrying 4xx wastes resources and may cause account lockout.

---

## Related Rules

Classify failures: 5xx + network trip breaker; 4xx (except 429) don't

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Circuit Breaker State Management

---

## Decision Context

Storing and transitioning circuit breaker state across the application.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis-backed circuit breaker state (distributed, atomic)
  ↓
  Need state transition events for alerting?
  ↓
  YES → Fire events on Closed→Open, Open→Half-Open, Half-Open→Closed
  NO → State management without events; manual dashboard monitoring
NO → Cache-backed state is sufficient (single server)
  ↓
  Need persistence across restarts?
  ↓
  YES → Redis even for single server; file cache with persistence
  NO → In-memory state; reset on restart is acceptable
  ↓
  Implement half-open probes?
  ↓
  YES → Single probe request after reset timeout; lock-protected
  NO → Circuit stays open forever; manual recovery needed

---

## Rationale

Distributed state (Redis) ensures all workers see the same circuit state. Events enable automated alerting and dashboards. Half-open probes with lock protection prevent thundering herd on recovery.

---

## Recommended Default

**Default:** Redis-backed state with transition events and lock-protected half-open probes
**Reason:** Production-ready distributed circuit breaker with full observability

---

## Risks Of Wrong Choice

File cache state in multi-server causes inconsistent breaker states across workers. No half-open probes require manual recovery. No events blind ops teams to integration degradation.

---

## Related Rules

Use Redis-backed state, Implement half-open probes, Fire events on transitions

---

## Related Skills

Implement Retry and Circuit Breaker
