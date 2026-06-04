# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** dispatching-webhooks
**Generated:** 2026-06-03

---

# Decision Inventory

1. Dispatch Method (Synchronous vs Queue)
2. Payload Versioning and Compatibility Strategy
3. Delivery Tracking and Audit Strategy

---

# Architecture-Level Decision Trees

---

## Dispatch Method

---

## Decision Context

Choosing between synchronous and queue-based webhook dispatch.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the webhook dispatched within an HTTP request lifecycle?
↓
YES → Use queue-based dispatch via ->onQueue()->dispatch()
  ↓
  Does the controller need to confirm delivery before responding?
  ↓
  YES → Still use queue; return 202 Accepted indicating async processing
  NO → Queue dispatch is standard; return immediately after dispatch
NO → Is the dispatch within a queue job or CLI command?
  ↓
  YES → Queue dispatch still preferred for decoupling and retry
  NO → Always queue dispatch in production; synchronous only for tests
  ↓
  High volume of simultaneous dispatches expected?
  ↓
  YES → Dedicated webhooks queue with sufficient worker capacity
  NO → Single webhooks queue is sufficient for moderate volume

---

## Rationale

Queue dispatch decouples webhook sending from the event producer, preventing subscriber latency from blocking application throughput. Even within queue jobs, separate dispatch enables parallel delivery.

---

## Recommended Default

**Default:** ->onQueue('webhooks')->dispatch() for all production webhook dispatch
**Reason:** Non-blocking; retry-capable; decoupled from producer lifecycle

---

## Risks Of Wrong Choice

Synchronous dispatch blocks HTTP response until subscriber responds. dispatchSync inside a queue job holds the worker hostage to subscriber response time.

---

## Related Rules

Always Use Queue-Based Dispatch in Production

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server

---

## Payload Versioning and Compatibility Strategy

---

## Decision Context

Managing payload schema changes across subscriber versions.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are there multiple subscribers with different payload expectations?
↓
YES → Include version field in payload; maintain subscriber version registry
  ↓
  Do subscribers declare their supported versions?
  ↓
  YES → Dispatch versioned payload based on subscriber's declared version
  NO → Use latest payload version; subscriber must handle migration
NO → Single subscriber with regular payload changes?
  ↓
  YES → Version payload from day one; never send unversioned payload
  NO → Version field still recommended; enables future changes
  ↓
  Need backward compatibility during payload migration?
  ↓
  YES → Add new fields alongside old; remove old after subscriber migration
  NO → Breaking change with coordinated subscriber update window

---

## Rationale

Versioned payloads enable forward-compatible schema evolution. Subscribers can migrate at their own pace without breaking delivery. Version field in every payload documents the schema contract.

---

## Recommended Default

**Default:** Include version field in every webhook payload; maintain per-subscriber version config
**Reason:** Enables schema evolution without breaking existing subscribers

---

## Risks Of Wrong Choice

No version field makes it impossible to evolve payload schema without breaking all subscribers. Breaking changes without migration window cause subscriber errors.

---

## Related Rules

Always Use Queue-Based Dispatch in Production

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server

---

## Delivery Tracking and Audit Strategy

---

## Decision Context

Tracking and auditing webhook delivery lifecycle.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Does the application need a delivery audit trail?
↓
YES → Use Spatie's WebhookCall model for full delivery tracking
  ↓
  Need to track per-attempt details (status, timing, response)?
  ↓
  YES → Configure WebhookCall to store attempt metadata
  NO → Track only final status (success/failed)
NO → Is manual retry of failed deliveries needed?
  ↓
  YES → Keep WebhookCall records accessible via dashboard or command
  NO → Delete on completion; no retry capability needed
  ↓
  Need lifecycle event listeners?
  ↓
  YES → Implement listeners for WebhookCallSuccessEvent
  NO → Listen to FinalWebhookCallFailedEvent only for alerting

---

## Rationale

WebhookCall model provides full audit trail with per-attempt tracking. Lifecycle events enable monitoring, alerting, and business logic integration. Cleanup prevents unbounded table growth.

---

## Recommended Default

**Default:** Full delivery tracking via WebhookCall model with success/failure event listeners
**Reason:** Complete audit trail; operational visibility; no silent delivery failures

---

## Risks Of Wrong Choice

No delivery tracking leaves failures undetected until subscriber complains. No cleanup causes unbounded table growth.

---

## Related Rules
Always Use Queue-Based Dispatch in Production

---

## Related Skills
Send Outgoing Webhooks with Spatie Laravel Webhook Server
