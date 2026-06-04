# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** circuit-breaker
**Generated:** 2026-06-03

---

# Decision Inventory

1. Circuit Breaker Implementation (Synchronous vs Queue)
2. Failure Classification Strategy
3. State Storage Strategy (Cache vs Database)

---

# Architecture-Level Decision Trees

---

## Circuit Breaker Implementation

---

## Decision Context

Choosing between synchronous and queue-based circuit breaker.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the integration synchronous (HTTP request-response)?
↓
YES → Use algoyounes/circuit-breaker with Guzzle middleware
  ↓
  Does the integration also use queue jobs for async processing?
  ↓
  YES → Add Fuse circuit breaker for queue jobs alongside sync breaker
  NO → Synchronous circuit breaker alone is sufficient
NO → Is the integration entirely queue-based (webhook jobs)?
  ↓
  YES → Use harris21/laravel-fuse CircuitBreakerMiddleware on jobs
  NO → Both sync and queue circuit breakers needed for hybrid integrations
  ↓
  Need to coordinate state between sync and queue paths?
  ↓
  YES → Share Redis-backed circuit state between both implementations
  NO → Independent circuit breakers per path are fine

---

## Rationale

Synchronous circuit breakers protect HTTP request paths; queue circuit breakers (Fuse) protect async job paths. Both are needed in hybrid integrations to prevent resource exhaustion across all request paths.

---

## Recommended Default

**Default:** Fuse circuit breaker for queue jobs; algoyounes for synchronous HTTP calls
**Reason:** Each is purpose-built for its execution context; shared Redis state for coordination

---

## Risks Of Wrong Choice

Synchronous-only breaker leaves queue processing unprotected (retries still hammer failing service during outage). Queue-only breaker doesn't protect synchronous HTTP paths.

---

## Related Rules

Classify Failures Carefully, Use Distributed Cache for State

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Failure Classification Strategy

---

## Decision Context

Determining which HTTP errors should trip the circuit breaker.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the status code 5xx (server error)?
↓
YES → Count as circuit breaker failure; upstream is likely degraded
  ↓
  Is it a 503 Service Unavailable?
  ↓
  YES → Count as failure immediately; overload/retry scenario
  NO → Count as failure with shorter cooldown (transient)
NO → Is the status code 429 (rate limited)?
  ↓
  YES → Do NOT count as circuit breaker failure; use rate limit handling instead
  NO → Is the error a 4xx client error?
    ↓
    YES → Do NOT count as circuit breaker failure; client error not service health
    NO → Is the error a network/timeout/connection error?
      ↓
      YES → Count as circuit breaker failure; indicates downstream connectivity issue
      NO → Unexpected error; log and count as failure for safety

---

## Rationale

5xx and network errors indicate upstream problems that warrant circuit breaking. 429 is a rate limit, not an outage — handle separately. 4xx are client errors that won't improve with circuit breaking.

---

## Recommended Default

**Default:** Count 5xx, timeouts, and connection errors as failures; exclude 4xx and 429
**Reason:** Matches upstream service health — 5xx = degraded, 4xx = client mistake, 429 = rate limit

---

## Risks Of Wrong Choice

Counting 429 as failures opens breaker on rate limits, not actual outages. Excluding all 5xx allows circuit to stay closed during upstream outages. Counting 4xx as failures trips breaker on client bugs.

---

## Related Rules

Classify Failures Carefully, Exclude 429/401/403 from Failure Count

---

## Related Skills

Implement Retry and Circuit Breaker

---

## State Storage Strategy

---

## Decision Context

Choosing where to store circuit breaker state.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis for distributed circuit breaker state
  ↓
  Need state transition events for monitoring?
  ↓
  YES → Fire events on Closed→Open, Open→Half-Open transitions
  NO → State management without events is sufficient
NO → Is the application single-server with cache available?
  ↓
  YES → Cache-backed state is sufficient; Redis still recommended for growth
  NO → In-memory state; resets on restart, acceptable for single-server
  ↓
  Need persistence across restarts?
  ↓
  YES → Redis with persistence is preferred
  NO → In-memory state; risk of reset on restart

---

## Rationale

Distributed Redis state ensures all workers see the same circuit status. In-memory state is simple for single-server but loses state on restart. Events enable automated alerting on circuit transitions.

---

## Recommended Default

**Default:** Redis-backed state with transition events for monitoring
**Reason:** Distributed consistency; event-driven alerting; survives restarts

---

## Risks Of Wrong Choice

In-memory state in multi-server causes inconsistent circuit states across workers. No events blind ops teams to circuit transitions (entering/exiting degraded mode).

---

## Related Rules

Use Distributed Cache (Redis) for State Storage, Register Event Listeners on State Transitions

---

## Related Skills

Implement Retry and Circuit Breaker
