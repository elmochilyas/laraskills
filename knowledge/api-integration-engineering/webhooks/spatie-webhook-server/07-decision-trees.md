# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** spatie-webhook-server
**Generated:** 2026-06-03

---

# Decision Inventory

1. Webhook Dispatch Method (Queue vs Synchronous)
2. Subscriber Secret Management Strategy
3. Webhook Tagging and Categorization Strategy
4. Delivery Failure Handling Strategy

---

# Architecture-Level Decision Trees

---

## Webhook Dispatch Method

---

## Decision Context

Choosing between queue and synchronous dispatch for outgoing webhooks.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the webhook dispatched from within an HTTP controller?
↓
YES → Always use queue dispatch via dispatch() on dedicated webhooks queue
  ↓
  Is the controller already in a queue job (worker context)?
  ↓
  YES → dispatch() still preferred; dispatchSync() only if result needed before next step
  NO → dispatch() is mandatory; never block the HTTP response
NO → Is the webhook triggered by a scheduled task or CLI command?
  ↓
  YES → dispatch() is preferred; avoids blocking the CLI process
  NO → dispatch() is the default; synchronous dispatch is the exception
  ↓
  High delivery volume expected (>1000 webhooks/day)?
  ↓
  YES → Dedicated webhooks queue with separate worker pool
  NO → Shared queue with webhooks queue name is sufficient

---

## Rationale

Queue dispatch decouples webhook delivery from the event producer, preventing subscriber latency from blocking application throughput. Dedicated queue isolation prevents webhook delivery from starving application jobs.

---

## Recommended Default

**Default:** Queue dispatch via ->onQueue('webhooks')->dispatch()
**Reason:** Non-blocking, retry-capable, decoupled from producer lifecycle

---

## Risks Of Wrong Choice

Synchronous dispatch blocks thread until subscriber responds. Shared queue with application jobs causes head-of-line blocking when subscribers are slow.

---

## Related Rules

Always Dispatch Via Queue

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server

---

## Subscriber Secret Management Strategy

---

## Decision Context

Managing signing secrets for multiple subscriber endpoints.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are there multiple subscribers consuming webhooks?
↓
YES → Use per-subscriber secrets via useSecret() on each WebhookCall
  ↓
  Are secrets stored in the database?
  ↓
  YES → Encrypt subscriber webhook_secret column at rest
  NO → Use environment variables for single-subscriber setups
NO → Is the single subscriber a first-party service in the same trust boundary?
  ↓
  YES → Default config secret is acceptable within trusted network
  NO → Unique secret per subscriber regardless of trust boundary
  ↓
  Need to rotate secrets on schedule?
  ↓
  YES → Implement quarterly rotation; maintain old+new secrets during overlap
  NO → Rotate on compromise; document rotation procedure

---

## Rationale

Per-subscriber secrets ensure that a compromised secret affects only one subscriber. Encryption at rest prevents secret exposure in database breaches.

---

## Recommended Default

**Default:** Per-subscriber encrypted secrets with unique useSecret() per WebhookCall
**Reason:** Maximum security isolation; individual rotation capability

---

## Risks Of Wrong Choice

Shared secret means any subscriber can forge webhooks as another. Plain-text secrets in database expose all subscribers on breach.

---

## Related Rules

Use Per-Subscriber Signing Secrets

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server

---

## Webhook Tagging and Categorization Strategy

---

## Decision Context

Using tags to organize and filter outgoing webhooks by event type or subscriber group.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are webhooks dispatched for multiple event types (payment, user, order)?
↓
YES → Use tags per event type: ->tag('payment'), ->tag('user')
  ↓
  Need to filter webhooks by subscriber group?
  ↓
  YES → Use tags for subscriber groups (->tag('beta'), ->tag('premium'))
  NO → Event-type tags alone are sufficient for filtering
NO → Is there only one event type and subscriber group?
  ↓
  YES → Tags may be omitted; simplify configuration
  NO → Tags help organize mixed webhook types
  ↓
  Need to query webhooks by tag for debugging?
  ↓
  YES → Use tags as filterable metadata; index tags for query performance
  NO → Tags are for organization only; no query optimization needed

---

## Rationale

Tags provide metadata categorization that enables filtering, querying, and monitoring webhook delivery by event type or subscriber group without inspecting payloads.

---

## Recommended Default

**Default:** Tag by event type (->tag('payment'), ->tag('order'))
**Reason:** Enables monitoring and debugging by event category without payload inspection

---

## Risks Of Wrong Choice

No tags make it difficult to filter webhook delivery metrics by event type. Too many unique tags create fragmentation with no query benefit.

---

## Related Rules

Always Dispatch Via Queue

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server

---

## Delivery Failure Handling Strategy

---

## Decision Context

Handling webhook delivery failures and notifying operations.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the webhook have automatic retry configured?
↓
YES → Listen to FinalWebhookCallFailedEvent for permanent failure alerting
  ↓
  Are some failures expected and not alert-worthy?
  ↓
  YES → Alert only after consecutive failures or final attempt exhaustion
  NO → Alert on every delivery failure for immediate investigation
NO → Is manual retry desired after permanent failure?
  ↓
  YES → Implement Artisan command to retry failed WebhookCalls by tag
  NO → Log failure; no manual retry capability needed
  ↓
  Need to disable subscribers after repeated failures?
  ↓
  YES → Track consecutive failures; auto-disable at threshold; alert ops
  NO → Always attempt delivery; never auto-disable subscribers

---

## Rationale

FinalWebhookCallFailedEvent is the standard hook for alerting on permanent delivery failure. Auto-disable prevents wasted retry resources on dead endpoints while alerting ensures human intervention.

---

## Recommended Default

**Default:** Listen to FinalWebhookCallFailedEvent for alerting; auto-disable after 10 consecutive failures
**Reason:** Ensures operational visibility while preventing wasted retry effort

---

## Risks Of Wrong Choice

No failure event listener leaves permanent failures undetected. No auto-disable sends unlimited retries to dead endpoints, consuming queue capacity and delaying other deliveries.

---

## Related Rules

Always Dispatch Via Queue

---

## Related Skills

Send Outgoing Webhooks with Spatie Laravel Webhook Server
