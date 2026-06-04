# Metadata

**Domain:** API Integration Engineering
**Subdomain:** webhook-systems-outgoing
**Knowledge Unit:** Spatie laravel-webhook-server Dispatch and Retry Customization
**Generated:** 2026-06-03

---

# Decision Inventory

1. Dispatch Location Strategy (Controller vs Service Class)
2. Max Attempts and Retry Configuration
3. Delivery Event Handling Strategy (Alerting vs Tracking)

---

# Architecture-Level Decision Trees

---

## Dispatch Location Strategy

---

## Decision Context

Choosing whether to dispatch WebhookCall from controllers or from dedicated service classes.

---

## Decision Criteria

* maintainability
* testability

---

## Decision Tree

Is the webhook dispatch triggered by an HTTP request in a controller?
↓
YES → Create a dedicated service class for webhook dispatch; never dispatch in controller
  ↓
  Does the dispatch depend on multiple data sources or business logic?
  ↓
  YES → Service class encapsulates dispatch, signing, and error handling
  NO → Service class still preferred; keeps controller focused on HTTP concerns
NO → Is the dispatch triggered by a queue job or CLI command?
  ↓
  YES → Service class still recommended; dispatch logic is a separate concern
    ↓
  Is the dispatch logic reused across multiple triggers?
    ↓
  YES → Service class enables reuse without duplication
  NO → Service class still enables isolated unit testing
NO → Simple prototyping or proof-of-concept code?
  ↓
  YES → Direct dispatch in controller is acceptable temporarily
  NO → Always use service class; structure from day one

---

## Rationale

Controllers should handle HTTP concerns only. Embedding webhook dispatch in controllers violates single responsibility, makes testing difficult, and couples delivery logic to request context. Service classes encapsulate dispatch, signing, and error handling.

---

## Recommended Default

**Default:** Create `WebhookDispatchService` class with methods like `dispatchOrderCreated()`
**Reason:** Testable; reusable; keeps controllers clean; encapsulates signing and error handling

---

## Risks Of Wrong Choice

Dispatch logic scattered across controllers. Cannot unit-test dispatch behavior without HTTP request setup. Business logic coupled to HTTP layer.

---

## Related Rules

Create WebhookCall from Service Classes, Not Controllers

---

## Related Skills

Use Spatie Webhook Server for Outgoing Webhook Delivery

---

## Max Attempts and Retry Configuration

---

## Decision Context

Configuring the maximum retry attempts for outgoing webhook delivery.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Does the subscriber endpoint have a known delivery SLA?
↓
YES → Calculate max_attempts based on backoff schedule and SLA window
  ↓
  Is the subscriber endpoint failure permanent or transient?
  ↓
  PERMANENT → Set low max_attempts (1-3); detect dead endpoints early
  TRANSIENT → Set higher max_attempts (10-15) with sufficient backoff window
NO → Rely on default unlimited retry or conservative explicit value?
  ↓
  YES → Always set explicit max_attempts; never use unlimited
    ↓
  Are webhooks business-critical with high delivery reliability requirements?
  ↓
  YES → Configure 10-15 max attempts with jitter-based exponential backoff
  NO → Configure 3-5 max attempts; conserve resources for non-critical events
  NO → Unlimited retries are never acceptable in production
  ↓
  Multiple subscribers with different reliability needs?
  ↓
  YES → Per-webhook-call max_attempts via useBackoffStrategy()
  NO → Single global max_attempts in config is acceptable

---

## Rationale

Without a configured limit, retry chains run indefinitely on dead endpoints, consuming queue workers and database storage. Explicit max_attempts aligned to delivery SLA prevents resource exhaustion.

---

## Recommended Default

**Default:** 10-15 max_attempts for critical webhooks; never null/unlimited
**Reason:** Prevents infinite retry loops; aligns with 24-hour delivery window; protects queue resources

---

## Risks Of Wrong Choice

Unlimited retries consume queue capacity indefinitely on dead endpoints. Too few attempts cause premature failure on transient issues. Too many delay final failure detection and alerting.

---

## Related Rules

Always Configure max_attempts

---

## Related Skills

Use Spatie Webhook Server for Outgoing Webhook Delivery

---

## Delivery Event Handling Strategy

---

## Decision Context

Choosing which delivery events to listen to and how to handle them.

---

## Decision Criteria

* observability
* reliability

---

## Decision Tree

Does the application need real-time alerting on webhook delivery failures?
↓
YES → Implement `FinalWebhookCallFailedEvent` listener for alerting
  ↓
  Need per-attempt failure tracking for debugging?
  ↓
  YES → Also listen to `WebhookCallFailedEvent` for per-attempt logs
  NO → Listen to FinalWebhookCallFailedEvent only for final failure alerting
NO → Is delivery tracking needed for audit or reconciliation?
  ↓
  YES → Listen to both success and failure events for full audit trail
    ↓
  Need to trigger business logic on successful delivery?
  ↓
  YES → Implement `WebhookCallSucceededEvent` listener for post-delivery actions
  NO → Final failure alerting is sufficient for monitoring-only needs
  NO → No event listeners needed; rely on WebhookCall record inspection
  ↓
  Need manual retry capability after final failure?
  ↓
  YES → Keep WebhookCall records accessible; implement retry command
  NO → Clean up old records on final failure; no retry needed

---

## Rationale

Delivery events enable subscriber-facing SLAs, operational alerting, and automated reconciliation. FinalWebhookCallFailedEvent is the minimum viable monitoring; WebhookCallSucceededEvent enables business workflow integration.

---

## Recommended Default

**Default:** Listen to `FinalWebhookCallFailedEvent` for alerting; `WebhookCallSucceededEvent` for audit
**Reason:** Complete delivery visibility; no silent failures; audit trail for reconciliation

---

## Risks Of Wrong Choice

No event listeners mean delivery failures go undetected until subscribers report missing webhooks. No success tracking means no delivery confirmation for audit or business workflows.

---

## Related Rules

Always Handle FinalWebhookCallFailedEvent

---

## Related Skills

Use Spatie Webhook Server for Outgoing Webhook Delivery
