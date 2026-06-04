# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Circuit Breaker Patterns
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Circuit breaker patterns protect Laravel applications from cascading failures when external services or dependencies become unavailable. In Laravel, circuit breakers are implemented primarily via two packages: `laravel-fuse` (for queue job circuits) and `laravel-circuit-breaker` (for general service calls). A circuit breaker monitors failures to an external dependency — after a configurable threshold of failures, it "opens" the circuit, immediately failing subsequent calls without attempting the real operation. After a timeout period, it transitions to "half-open" state, allowing a trial call to test if the service has recovered. Circuit breaker patterns are essential for resilient Laravel applications that depend on external APIs, databases, queues, or services.

# Core Concepts
- **Circuit states**: Closed (normal operation, calls pass through), Open (failures exceed threshold, calls fail fast), Half-Open (trial period, limited calls allowed to test recovery).
- **Failure threshold**: Number of consecutive failures before circuit opens. Configurable. Example: 5 consecutive timeouts to external API.
- **Reset timeout**: Duration after which circuit transitions from Open to Half-Open. Configurable. Example: 30 seconds.
- **Half-open max calls**: Number of trial calls allowed in Half-Open state. Usually 1. If successful, circuit closes. If fails, circuit re-opens.
- **Fallback mechanism**: Alternative behavior when circuit is open. Return cached data, use default value, queue operation for retry, or return degraded response.
- **`laravel-fuse`**: Package focused on queue job circuit breaking. Wraps job dispatch with circuit state checks. Prevents job processing when dependencies are unhealthy.
- **`laravel-circuit-breaker`**: General-purpose circuit breaker for any service call. Supports array/Redis/DB storage for circuit state.

# Mental Models
- **Circuit breaker as automatic fuse**: Like a home electrical circuit breaker — when too much current flows (too many failures), the circuit opens and prevents further damage. Automatic reset when conditions improve.
- **Fail fast vs fail slow**: Open circuit = fail fast (immediate response). No circuit breaker = fail slow (wait for timeout on every call). Fail fast saves resources and improves user experience.
- **Fallback as plan B**: When the circuit is open, the fallback kicks in. Fallback ensures the application can still function (possibly in degraded mode) rather than crashing.
- **Bulkhead vs circuit breaker**: Bulkhead isolates resources (separate connection pools per service). Circuit breaker prevents repeated calls to a failing service. They complement each other.

# Internal Mechanics
- **`laravel-fuse` operation**: Before dispatching a job, Fuse checks circuit state. If closed: job dispatches normally. If open: job is rejected (or redirected to fallback queue). After each failure, failure counter increments. After configurable threshold, circuit opens.
- **`laravel-circuit-breaker` operation**: Wraps service calls with a decorator. Before call: check circuit state. If closed: execute call, report success/failure. If open: throw CircuitOpenException or execute fallback. After reset timeout: transition to half-open.
- **State storage**: Circuit state stored in Redis (recommended for distributed apps) or database or array (single-server apps). State includes: current state, failure count, last failure timestamp, last success timestamp.
- **Failure detection**: Configurable what counts as a failure: network timeout, HTTP 5xx, exception, response time exceeds threshold. Timeouts are the most common failure trigger.
- **Thread safety**: Circuit state updates must be atomic. Redis atomic operations (`WATCH`, `MULTI`, `EXEC`) or database locks ensure consistency across concurrent requests/workers.

# Patterns
- **Pattern: External API circuit breaker**
  - Purpose: Protect against upstream API failures
  - Benefits: Prevents cascading failures; saves API rate limits
  - Tradeoffs: Stale data during open circuit (if using cached fallback)
  - Implementation: Wrap HTTP client calls with circuit breaker; fallback = cached response or degraded notification

- **Pattern: Queue job circuit breaker**
  - Purpose: Prevent job processing when dependency is unhealthy
  - Benefits: Avoids retry storms; preserves queue resources
  - Tradeoffs: Delayed job processing during recovery
  - Implementation: `laravel-fuse` wraps job dispatch; failed jobs route to failure queue for later retry

- **Pattern: Database circuit breaker**
  - Purpose: Protect against database connection failures
  - Benefits: Prevents connection pool exhaustion; fast failure
  - Tradeoffs: Application cannot serve data-dependent requests
  - Implementation: Wrap database queries with circuit breaker; fallback = return read-replica or cached data

- **Pattern: Half-open health probe**
  - Purpose: Test service recovery without full traffic load
  - Benefits: Prevents recovery thundering herd (all calls hitting recovering service at once)
  - Tradeoffs: Single probe may not represent full recovery
  - Implementation: Half-open state allows 1 trial call; if successful, close circuit and resume normal traffic

# Architectural Decisions
- **`laravel-fuse` vs `laravel-circuit-breaker`**: Use `laravel-fuse` for queue-specific circuit breaking (jobs, workers). Use `laravel-circuit-breaker` for synchronous service calls (HTTP, database, cache).
- **Redis vs database state storage**: Redis for high-throughput distributed applications. Database for simple single-server applications. Redis is preferred for circuit breakers (low latency, atomic operations).
- **Fallback granularity**: Per-operation fallback (specific cached data for specific endpoint) vs generic fallback (return error message). Per-operation is more useful but requires more configuration.
- **Failure threshold tuning**: Start with 3-5 consecutive failures. Adjust based on dependency reliability. Lower threshold for critical dependencies (2 failures). Higher for tolerant dependencies (10 failures).

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Prevents cascading failures | Added complexity; state management | Worth it for critical external dependencies |
| Fast failure under duress | Stale data when circuit is open | Use short reset timeouts (10-30s) |
| Protects queue worker resources | Delayed processing during open circuit | Use separate failure queue for non-urgent work |
| Automatic recovery testing | Half-open probe may fail and re-open | Acceptable; prevents premature full recovery |

# Performance Considerations
- Circuit check overhead: <1ms (Redis read) to 5ms (database read). Negligible compared to operation cost.
- State update on success/failure: 1-5ms per operation. Acceptable for most use cases.
- Circuit open saves significant time: Immediate failure vs waiting for timeout (which could be 5-30 seconds).
- State storage sizing: Minimal. Circuit state is a few bytes per dependency. No scaling concerns.
- Concurrent state updates: Redis handles atomically. Database may require pessimistic locking for high-concurrency scenarios.

# Production Considerations
- **Monitoring circuit state**: Expose circuit state in health endpoint. Alert when circuits are open. Track open-circuit duration and frequency.
- **Graceful degradation**: When circuit is open, the application should still return a useful response (cached data, default value, informative error message).
- **Retry strategy**: Combine circuit breaker with exponential backoff. After circuit re-closes, resume normal retry behavior.
- **Circuit breaker testing**: Test circuit breaker behavior in staging. Verify open → half-open → closed transition works correctly.
- **Configuration per dependency**: Different dependencies need different thresholds. External API: 3 failures → 30s reset. Cache: 2 failures → 10s reset. Database: 5 failures → 60s reset.

# Common Mistakes
- **Mistake: No fallback when circuit is open**
  - Why: "The circuit breaker prevents the call; that's enough"
  - Why harmful: Application throws CircuitOpenException; user sees 500 error
  - Better: Always implement fallback: cached data, default value, or informative degraded-mode response

- **Mistake: Too-sensitive failure detection**
  - Why: "Any exception should open the circuit"
  - Why harmful: Valid client errors (400 Bad Request) count as circuit-breaking failures
  - Better: Only count server errors (5xx) and timeouts as failures. Client errors are not circuit failures.

- **Mistake: Global circuit breaker instead of per-dependency**
  - Why: Single circuit breaker for all external calls
  - Why harmful: One dependency failure opens circuit for all dependencies
  - Better: Separate circuit breaker instance per external dependency

- **Mistake: Not testing circuit breaker behavior**
  - Why: "It's infrastructure code; it just works"
  - Why harmful: Production dependency failure reveals circuit breaker misconfiguration (wrong threshold, no fallback, state storage failure)
  - Better: Write integration tests that simulate dependency failure and verify circuit breaker behavior

# Failure Modes
- **State storage failure**: Redis/database used for circuit state is itself unavailable. Circuit breaker cannot check or update state. Fail-open (allow all calls) or fail-closed (block all calls) based on configuration.
- **Premature circuit close**: Half-open probe succeeds (quick response) but full traffic load causes failure again. Consider weighted half-open (multiple probe calls).
- **Stale state after deployment**: Circuit state stored in Redis survives deployment. A previously open circuit may remain open after the dependency has been fixed. Reset circuit state during deployment.
- **Atomicity failure**: Multiple concurrent requests may all see "close enough to threshold" and all increment failure count, causing circuit to open prematurely. Use atomic increment operations.

# Ecosystem Usage
- **`laravel-fuse` (harris21/laravel-fuse)**: 378 stars. Focused on queue job resilience. Wraps job dispatch with circuit breaker logic. Configuration via Laravel config file.
- **`laravel-circuit-breaker` (syastrebov/laravel-circuit-breaker)**: General-purpose circuit breaker for service calls. Supports multiple storage backends. Annotations-based configuration.
- **Laravel Resilience package**: Includes circuit breaker functionality as part of broader resilience features (fault injection, retry, fallback).
- **Non-PHP circuit breaker inspiration**: Hystrix (Netflix), Resilience4j (Java) — the patterns that inspired Laravel implementations.

# Related Knowledge Units
- **Prerequisites**: Distributed systems fundamentals, External API integration, Queue job management
- **Related Topics**: Resilience testing (Laravel Resilience), Chaos engineering (Laravel Bazooka), Retry and backoff strategies
- **Advanced Follow-up**: Bulkhead pattern implementation, Advanced circuit breaker metrics, Multi-layer resilience patterns

# Research Notes
- Circuit breaker packages in the PHP/Laravel ecosystem are less mature than in Java (Hystrix, Resilience4j) and Node.js (Opossum); teams should expect ongoing API changes in early-stage packages
- `laravel-fuse` has 378 GitHub stars as of 2026, making it the most popular circuit breaker package for Laravel; its focus on queue jobs addresses the most common use case for circuit breakers in Laravel applications
- Circuit breaker state management is critical for distributed Laravel applications running on multiple servers; Redis-based state storage is strongly recommended over database storage for consistency and performance
- The circuit breaker pattern is most valuable for Laravel applications that integrate with third-party APIs, microservices, or legacy systems; applications that are self-contained (no external dependencies) rarely need circuit breakers
- Half-open probe configuration is often overlooked; the number of probe calls and the success criteria for re-closing the circuit should match the dependency's recovery characteristics
