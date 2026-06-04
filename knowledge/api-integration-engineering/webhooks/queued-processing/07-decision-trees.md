# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** queued-processing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Queue Dispatcher Strategy (Spatie ProcessWebhookJob vs Custom Job)
2. Queue Configuration Strategy (Connection, Name, Timeout)
3. Job Failure and Retry Strategy

---

# Architecture-Level Decision Trees

---

## Queue Dispatcher Strategy

---

## Decision Context

Choosing between Spatie's built-in ProcessWebhookJob and a custom job class.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the webhook need custom processing beyond storage and dispatch?
↓
YES → Custom ProcessWebhookJob extending Spatie's base or implementing ShouldQueue
  ↓
  Need per-provider processing logic?
  ↓
  YES → Custom job per provider with provider-specific handle() method
  NO → Single custom job with provider routing in handle()
NO → Is Spatie's default processing sufficient (store + dispatch)?
  ↓
  YES → Use ProcessWebhookJob default; no custom job needed
  NO → Custom job required for non-standard processing
  ↓
  Need job middleware (rate limiting, circuit breaker)?
  ↓
  YES → Use custom job with middleware() method returning middleware array
  NO → Default Spatie job; no middleware customization

---

## Rationale

Spatie's default ProcessWebhookJob handles the standard pipeline: validation, storage, and dispatch. Custom jobs add provider-specific business logic. Job middleware adds resilience without cluttering the handle() method.

---

## Recommended Default

**Default:** Custom ProcessWebhookJob per provider with job middleware for rate limiting and circuit breaker
**Reason:** Provider-specific processing logic + resilience middleware in clean separation

---

## Risks Of Wrong Choice

Default Spatie job without customization can't handle provider-specific business logic. Custom job without middleware misses resilience patterns (rate limiting, circuit breaker).

---

## Related Rules

Always Use Queue-First for Incoming Webhooks

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Queue Configuration Strategy

---

## Decision Context

Configuring queue connection, name, and timeout for webhook jobs.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is webhook volume high (>1000/day) or processing time variable?
↓
YES → Dedicated `webhooks` queue with separate worker pool
  ↓
  Does webhook processing involve slow external API calls?
  ↓
  YES → Set job timeout to 120s; ensure worker timeout exceeds job timeout
  NO → Standard 60s job timeout is sufficient
NO → Is the application using Horizon for queue management?
  ↓
  YES → Configure dedicated Horizon pool for webhooks with auto-scaling
  NO → Single queue worker for low-volume webhooks is acceptable
  ↓
  Need to persist jobs across queue restarts?
  ↓
  YES → Use Redis queue connection (persists to disk; survives restart)
  NO → Database queue is sufficient for low volume

---

## Rationale

Dedicated queue isolation prevents webhook processing from blocking application jobs. Proper timeout configuration prevents zombie jobs from holding workers indefinitely.

---

## Recommended Default

**Default:** Redis `webhooks` queue with dedicated Horizon pool and 120s timeout
**Reason:** Production-grade isolation; persistent jobs; ample timeout for API calls

---

## Risks Of Wrong Choice

Shared queue allows slow webhooks to block application jobs. Timeout too short causes premature job failure. Timeout > worker timeout causes worker death without proper release.

---

## Related Rules

Always Use Queue-First for Incoming Webhooks

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Job Failure and Retry Strategy

---

## Decision Context

Configuring how webhook jobs respond to processing failures.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the failure transient (network timeout, rate limited)?
↓
YES → Release job back to queue with backoff delay
  ↓
  Has the job exceeded $tries (10)?
  ↓
  YES → Fire FinalWebhookCallFailedEvent; move to failed_jobs
  NO → Continue retry cycle with exponential backoff
NO → Is the failure permanent (validation error, bad data)?
  ↓
  YES → Fail immediately; do not retry; log validation error
  NO → Apply $maxExceptions (3) to distinguish transient from permanent
  ↓
  Need manual retry capability for failed jobs?
  ↓
  YES → Use Horizon/Telescope failed job dashboard for retry
  NO → Implement custom Artisan command for retry by provider

---

## Rationale

Transient failures should be retried with backoff. Permanent failures should fail fast to preserve retry capacity for transient issues. Manual retry dashboard enables operator recovery.

---

## Recommended Default

**Default:** 10 tries with backoff; fail immediately on validation errors; manual retry via Horizon
**Reason:** Maximum delivery reliability; fast failure on permanent errors; operational visibility

---

## Risks Of Wrong Choice

Retrying validation errors wastes all retry attempts. No backoff causes immediate retry storms. No manual retry capability requires redeployment to re-process failed webhooks.

---

## Related Rules

Configure Queue Connection in Webhook Config, Use Circuit Breaker Middleware

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling
