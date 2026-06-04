# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** circuit-breaker-rate-limiting
**Difficulty:** Intermediate
**Category:** Resilience Engineering
**Last Updated:** 2026-06-03

---

# Overview

Circuit breakers and rate limiters form the resilience layer for analytics pipelines that depend on external services — geo-IP databases, user-agent parsers, reverse DNS, spam filters, or third-party analytics APIs. Without them, a single external dependency failure cascades into tracking failures, queue backlogs, and ultimately data loss across the entire pipeline.

The circuit breaker pattern detects when an external service is failing and short-circuits requests to it, allowing the system to degrade gracefully instead of failing entirely. Rate limiting controls the volume of requests to protect both the caller (from cost overruns on metered APIs) and the downstream service (from overload). In Laravel analytics pipelines, these patterns are typically implemented at the middleware layer, in queue job processing, and at the HTTP client level.

Engineers should care because analytics pipelines are uniquely vulnerable to external dependency failures: they run in background processes with less monitoring, they process high volumes of requests, and data loss is often silent — a failed geo-IP lookup just means a null field in the database, not a 500 error that wakes someone up.

---

# Core Concepts

## Circuit Breaker States

A circuit breaker transitions through three states: **Closed** (normal operation, requests pass through), **Open** (failures threshold exceeded, requests are immediately rejected), and **Half-Open** (probing to see if the service has recovered). The transition from Open to Half-Open happens after a configurable timeout period, allowing one or a small number of test requests through.

## Failure Threshold Configuration

The threshold is the number of failures within a time window that triggers the Open state. For analytics pipelines, the threshold must account for transient failures (network blips, DNS resolution delays) versus sustained failures (service down, rate limit exceeded). A common pattern is a sliding window counter with a configurable failure count and time window.

## Rate Limiting Strategies

- **Token Bucket:** Tokens are added at a fixed rate; each request consumes a token. Bursts are allowed up to bucket capacity. Good for APIs with bursty traffic patterns.
- **Leaky Bucket:** Requests are processed at a fixed rate; excess requests are queued or dropped. Ensures smooth throughput.
- **Fixed Window:** Counters reset at interval boundaries. Simple but allows double-burst at boundaries.
- **Sliding Window Log:** Tracks timestamps of all requests within the window. Most accurate but memory-intensive.

## Degraded Fallback

When the circuit is open or rate limit is exceeded, the system must still handle the request. Common fallback strategies for analytics enrichment: return null/default values, use cached results, skip enrichment and mark the event for later reprocessing, or route to a dead-letter queue.

---

# When To Use

- Analytics pipelines that call external enrichment APIs (geo-IP, user-agent parsing, spam detection)
- Queue jobs that process events and depend on external services
- Third-party analytics forwarding (sending events to external analytics platforms)
- Multi-tenant systems where one tenant's external dependency failure should not affect other tenants
- Metered API integrations where cost control is required
- High-throughput pipelines where a single slow external call can block the entire ingestion path

---

# When NOT To Use

- Internal service calls within the same datacenter or Kubernetes cluster (use connection timeouts and retries instead)
- Synchronous user-facing operations that cannot tolerate latency from circuit breaker state checks
- Services where the cost of false positives (rejecting healthy requests) exceeds the cost of degraded operation
- Systems where external dependency calls are idempotent and can be safely retried indefinitely

---

# Best Practices

## Separate Circuit Breakers Per Dependency

Each external service should have its own circuit breaker instance. A geo-IP service failure should not affect user-agent parsing. Use a registry or factory pattern to manage multiple circuit breaker instances.

## Use Half-Open Probing with Care

The half-open state should send a single probe request, not a burst. If the probe succeeds, transition to Closed immediately. If it fails, return to Open and extend the timeout (exponential backoff pattern).

## Prefer Token Bucket for Analytics Pipelines

Analytics traffic is bursty — events arrive in waves from user activity. Token bucket handles bursts naturally. Fixed window rate limiters cause thundering herd problems at window boundaries.

## Log Circuit Breaker State Changes

Every state transition should be logged with full context: service name, previous state, new state, failure count, time since last transition. This is critical for debugging silent data quality issues.

## Implement Degraded Fallbacks, Not Silent Failures

When the circuit is open, the enriched field should contain a sentinel value or null, and the event should be flagged for reprocessing. Silent nulls are the most common data quality bug in analytics pipelines.

---

# Architecture Guidelines

## Layer Placement

Circuit breaker and rate limiting logic belongs in the **infrastructure layer**, not the application layer. The enrichment service classes should receive a circuit breaker wrapper, not implement circuit breaker logic themselves. This enables independent testing and swapping of resilience strategies.

## Dependency Direction

The tracking middleware depends on enrichment services. Enrichment services depend on circuit breaker wrappers. Circuit breaker wrappers depend on HTTP clients. This layering ensures that resilience concerns can be modified without touching business logic.

## Integration with Queue Dispatching

When a circuit breaker opens in a queue job context, the job should be released back to the queue with a delay equal to the half-open timeout, not failed immediately. This prevents job loss while the circuit is open. Use `$this->release($timeout)` for fine-grained control.

---

# Performance Considerations

- Circuit breaker state checks are O(1) — they do not materially impact throughput.
- Rate limiter performance depends on implementation: token bucket with atomic counters is fast; sliding window log with timestamp arrays is memory-intensive.
- In high-throughput pipelines (10,000+ events/second), use in-memory rate limiters (Laravel's `Cache::lock` with Redis) rather than database-backed implementations.
- The main performance cost is the enrichment call itself, not the protection layer. Circuit breakers improve overall throughput by failing fast instead of waiting for timeouts.

---

# Security Considerations

- Rate limiting is a security control: it prevents external analytics APIs from being used as an amplification vector for DDoS attacks.
- Circuit breaker state should not be observable by end users — it leaks information about third-party service health.
- In multi-tenant systems, rate limiting must be per-tenant to prevent one tenant from exhausting shared rate limits.
- Ensure that circuit breaker failure counters cannot be reset via user-controlled input.

---

# Common Mistakes

## Mistake: Single Circuit Breaker for All External Services

Developers create one circuit breaker that covers all external API calls. When the geo-IP service fails, the entire pipeline shuts down, including calls to working services like user-agent parsing.

**Better approach:** One circuit breaker instance per external dependency, managed via a registry.

## Mistake: No Degraded Fallback

When the circuit opens, the enrichment returns null, and this null is stored in the analytics database without flagging the event for later reprocessing.

**Better approach:** Store a sentinel value and a `needs_reprocessing` flag; run a batch reprocessing job when the circuit closes.

## Mistake: Rate Limiting at the Wrong Granularity

Rate limiting at the global level instead of per-API-key or per-tenant. A single noisy tenant causes all tenants to be rate limited.

**Better approach:** Use Laravel's `RateLimiter::for()` with named limits per tenant or per API key.

---

# Anti-Patterns

## Magic Number Thresholds

Hardcoding failure thresholds (e.g., "5 failures in 60 seconds") without any monitoring or adjustment mechanism. Thresholds should be configurable per environment and adjustable at runtime through a configuration provider.

## Infinite Retry Loops

Queue jobs that retry indefinitely when the circuit is open. The job is released, then immediately retried, fails again, released again — generating infinite traffic to the circuit breaker.

**Solution:** Release with a delay equal to the circuit breaker's half-open timeout, and use `maxAttempts` on the job.

---

# Examples

## Circuit Breaker Registration

```php
// App\Infrastructure\Resilience\CircuitBreakerRegistry
class CircuitBreakerRegistry
{
    private array $breakers = [];

    public function register(string $service, CircuitBreaker $breaker): void
    {
        $this->breakers[$service] = $breaker;
    }

    public function get(string $service): CircuitBreaker
    {
        return $this->breakers[$service] ?? throw new \RuntimeException("Unknown service: $service");
    }
}
```

## Enrichment Service with Circuit Breaker

```php
class GeoIpEnricher
{
    public function __construct(
        private CircuitBreaker $breaker,
        private GeoIpClient $client
    ) {}

    public function enrich(string $ip): ?GeoIpResult
    {
        if (!$this->breaker->isAvailable()) {
            return null; // Degraded fallback - event flagged for reprocessing
        }

        try {
            $result = $this->client->lookup($ip);
            $this->breaker->recordSuccess();
            return $result;
        } catch (RequestException $e) {
            $this->breaker->recordFailure();
            throw $e;
        }
    }
}
```

---

# Related Topics

**Prerequisites:**
- Middleware Event Tracking — Where enrichment failures happen
- Queue Dispatching — How queue retry interacts with circuit breaker

**Closely Related:**
- Kafka CDC — Circuit breaker for Kafka producer failures
- Multi-Tenancy Analytics — Per-tenant rate limiting patterns

**Advanced Follow-Up:**
- Saga Pattern with Kafka — Circuit breakers in distributed transaction coordination

**Cross-Domain Connections:**
- API Integration Engineering — External API resilience patterns
- Observability & Production Intelligence — Monitoring circuit breaker state transitions
