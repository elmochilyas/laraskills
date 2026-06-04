# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** queue-async-processing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Queue Isolation Strategy (Dedicated vs Shared Queue)
2. Job Retry Configuration Strategy
3. Rate Limiting Strategy for Webhook Jobs

---

# Architecture-Level Decision Trees

---

## Queue Isolation Strategy

---

## Decision Context

Choosing between a dedicated webhook queue and sharing the default queue.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is webhook volume > 1000 requests/day?
↓
YES → Use dedicated queue connection with separate worker pool
  ↓
  Multiple providers with different processing characteristics?
  ↓
  YES → Per-provider queues (webhooks-stripe, webhooks-github) for isolation
  NO → Single webhooks queue with dedicated workers
NO → Are webhook jobs expected to be slow (>1s processing time)?
  ↓
  YES → Dedicated queue prevents slow webhooks from blocking app jobs
  NO → Shared default queue is acceptable for low-volume fast processing
  ↓
  Need to scale webhook workers independently of application workers?
  ↓
  YES → Dedicated queue enables independent worker scaling via Supervisor
  NO → Shared queue with priority settings is sufficient

---

## Rationale

Dedicated queue isolation prevents webhook processing from blocking application-critical jobs. Per-provider queues provide further isolation — a slow Stripe webhook won't delay GitHub webhook processing.

---

## Recommended Default

**Default:** Dedicated `webhooks` queue with separate worker pool
**Reason:** Prevents webhook processing from impacting application job throughput

---

## Risks Of Wrong Choice

Shared queue causes webhook processing delays to cascade to application jobs. No isolation makes it impossible to scale webhook workers independently.

---

## Related Rules

Always Route Webhook Jobs to a Dedicated Queue

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Job Retry Configuration Strategy

---

## Decision Context

Configuring retry behavior for webhook processing jobs.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the webhook processing dependent on external API calls?
↓
YES → Set explicit $tries (10) and $backoff array with growing delays
  ↓
  Does the downstream API have rate limits?
  ↓
  YES → Use RateLimited middleware; backoff larger than rate limit window
  NO → Standard backoff: [2, 5, 15, 30, 60, 120, 240, 480]
NO → Is the processing purely internal (database writes)?
  ↓
  YES → Fewer tries (3-5) with shorter backoff; internal failures are rare
  NO → 10 tries with standard backoff covers most transient failure scenarios
  ↓
  Need to handle specific exceptions differently?
  ↓
  YES → Use failed() method to customize response per exception type
  NO → Default fail behavior moves to failed_jobs after exhausting tries
  ↓
  Job idempotent on retry?
  ↓
  YES → Full retry is safe; no duplicate side effects
  NO → Idempotency check required at handle() start before any processing

---

## Rationale

Explicit $tries and $backoff prevent infinite retry loops. Growing delays respect downstream recovery time. Rate limiting middleware prevents downstream API throttling.

---

## Recommended Default

**Default:** $tries = 10, $backoff = [2,5,15,30,60,120,240,480] with RateLimited middleware
**Reason:** 10 tries covers transient outages; backoff respects recovery time; rate limiting prevents throttling

---

## Risks Of Wrong Choice

No $tries causes unlimited retry loops. No $backoff causes immediate retry spam, overwhelming recovering downstream services. No idempotency causes duplicate side effects on retry.

---

## Related Rules

Set Explicit tries and backoff Properties on Every Webhook Job

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Rate Limiting Strategy for Webhook Jobs

---

## Decision Context

Preventing webhook job processing from overwhelming downstream APIs.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the webhook processing make downstream API calls?
↓
YES → Apply RateLimited middleware scoped per provider
  ↓
  Does the downstream API publish rate limits?
  ↓
  YES → Configure rate limit to match documented limits minus headroom
  NO -> Configure conservative default (e.g., 100 requests per 60 seconds)
NO → Is the processing purely database-local with no external calls?
  ↓
  YES → Rate limiting is less critical but still protects database
  NO → Rate limiting mandatory for any external dependency
  ↓
  Multiple providers with different rate limits?
  ↓
  YES → Per-provider RateLimited middleware instances with provider-specific config
  NO → Single RateLimited instance for all webhook jobs
  ↓
  Need to handle rate limit responses from downstream?
  ↓
  YES -> Parse Retry-After header; release job with that delay
  NO -> Release job with backoff; downstream may still reject

---

## Rationale

Rate limiting middleware prevents webhook processing bursts from overwhelming downstream APIs. Per-provider limits respect each downstream's capacity. Retry-After handling is the most downstream-friendly approach.

---

## Recommended Default

**Default:** RateLimited middleware at 100 requests/60s per provider
**Reason:** Conservative limit that respects most downstream APIs while maintaining throughput

---

## Risks Of Wrong Choice

No rate limiting causes downstream API throttling on webhook bursts. Overly strict rate limiting delays webhook processing unnecessarily.

---

## Related Rules

Set Explicit tries and backoff Properties on Every Webhook Job

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling
