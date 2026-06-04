# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** rate-limiting-algorithms
**Generated:** 2026-06-03

---

# Decision Inventory

1. Algorithm Selection (Token Bucket vs Leaky Bucket vs Sliding Window)
2. Distributed State Strategy
3. Rate Limit Response Strategy

---

# Architecture-Level Decision Trees

---

## Algorithm Selection

---

## Decision Context

Choosing the appropriate rate limiting algorithm for the workload.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the workload require burst capacity (spikes followed by quiet periods)?
↓
YES → Use Token Bucket (supports bursts up to bucket size)
  ↓
  Need precise per-second rate enforcement?
  ↓
  YES → Set bucket small (burst = 1-2x refill rate)
  NO → Token bucket with generous burst is ideal
NO → Does the workload require smooth constant-rate throughput?
  ↓
  YES → Use Leaky Bucket (processes at constant rate; queues excess)
  NO → Does the workload need precise time-window limits?
    ↓
    YES → Sliding Window (most accurate, per-window enforcement)
    NO → Fixed Window for simplest implementation (boundary burst risk)
  ↓
  Need O(1) performance for high-throughput?
  ↓
  YES → Token bucket or leaky bucket (both O(1))
  NO → Sliding window is acceptable for moderate throughput

---

## Rationale

Token bucket handles bursty workloads naturally by accumulating tokens. Leaky bucket enforces constant rate for processing-sensitive workloads. Sliding window provides the most accurate per-window enforcement.

---

## Recommended Default

**Default:** Token bucket for general-purpose rate limiting
**Reason:** Supports bursts; O(1) performance; widely implemented; matches most real-world API patterns

---

## Risks Of Wrong Choice

Fixed window causes boundary bursts (double traffic at window edges). Leaky bucket with no buffer drops legitimate bursts. Sliding window has higher overhead for high-throughput workloads.

---

## Related Rules

Prefer Token Bucket for Burst-Tolerant Workloads

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Distributed State Strategy

---

## Decision Context

Managing rate limiter state across multiple servers.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Use Redis-backed rate limit state (atomic INCR + TTL)
  ↓
  Need rate limit persistence across Redis restarts?
  ↓
  YES → Enable Redis persistence (RDB/AOF) for rate limit state
  NO → Ephemeral rate limits; reset on restart is acceptable
NO → Is the application single-server with cache available?
  ↓
  YES → Cache-backed state (Redis still preferred for accuracy)
  NO → File-based state (inaccurate under concurrent requests)
  ↓
  Need atomic rate limit check + increment?
  ↓
  YES → Redis INCR with TTL provides atomic operation
  NO → Cache::increment with fallback is non-atomic

---

## Rationale

Distributed rate limiting requires atomic counters visible to all servers. Redis provides atomic INCR with TTL, ensuring accurate rate limits across the entire deployment.

---

## Recommended Default

**Default:** Redis-backed token bucket with atomic INCR and TTL expiry
**Reason:** Distributed-safe; O(1) performance; automatic state cleanup via TTL

---

## Risks Of Wrong Choice

File-based state in multi-server provides inaccurate counts (each server has its own window). Non-atomic check-then-increment allows race conditions (double-counting near the limit).

---

## Related Rules

Implement Distributed Rate Limiting via Redis for Multi-Server

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Rate Limit Response Strategy

---

## Decision Context

Determining behavior when a rate limit is exceeded.

---

## Decision Criteria

* reliability
* user experience

---

## Decision Tree

Is the rate limit for outbound requests (we are the client)?
↓
YES → Auto-delay request until rate limit allows (queue/delay)
  ↓
  Does the upstream provide Retry-After header?
  ↓
  YES → Respect Retry-After; delay exact duration specified
  NO → Use token bucket auto-delay based on refill rate
NO → Is the rate limit for inbound requests (we are the server)?
  ↓
  YES → Return 429 with Retry-After header (client should back off)
  NO → No rate limit needed; not applicable
  ↓
  Need to queue rate-limited requests for later processing?
  ↓
  YES → Release queued job with delay instead of failing
  NO → Drop or reject the request (acceptable for non-critical)

---

## Rationale

Outbound rate limits should delay requests, not drop them. Inbound rate limits should return 429 to signal the caller to back off. Retry-After provides the client with exact timing for retry.

---

## Recommended Default

**Default:** Delay outbound requests; return 429 with Retry-After for inbound
**Reason:** Preserves request completion for outbound; standard signaling for inbound

---

## Risks Of Wrong Choice

Dropping outbound requests causes data loss. Delaying inbound requests holds server resources. 429 without Retry-After leaves the client guessing when to retry.

---

## Related Rules

Always Respect Retry-After Headers from Upstream

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries
