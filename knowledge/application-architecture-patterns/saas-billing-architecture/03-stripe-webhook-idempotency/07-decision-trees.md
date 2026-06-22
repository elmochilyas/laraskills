# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Stripe Webhook Idempotency & Event Deduplication
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Deduplication guard strategy — database-only vs multi-layer
* Decision 2: Webhook processing — synchronous vs asynchronous
* Decision 3: Handler architecture — monolith switch vs per-event classes
* Decision 4: StripeEvent retention — time-based vs status-based vs hybrid

---

# Architecture-Level Decision Trees

---

## Decision: Deduplication Guard Strategy — Database-Only vs Multi-Layer

---

### Decision Context

Determine how many layers of deduplication protection to implement between a Stripe webhook arriving and its handler executing.

---

### Decision Criteria

* reliability: more layers reduce the probability of duplicate processing, at the cost of additional infrastructure dependencies
* complexity: each additional guard adds code and potential failure modes
* performance: database constraints are fast; distributed locks add latency
* failure modes: each layer handles different failure scenarios (race conditions, worker duplication, queue replay)

---

### Decision Tree

Is the StripeEvent table's unique constraint on `stripe_event_id` sufficient for your throughput?
↓
YES → Handling < 10 webhooks/second with a single queue worker?
    YES → Database-only dedup may be sufficient (firstOrCreate + unique constraint)
        ↓
        BUT: does the queue runner have multiple workers?
        YES → Add ShouldBeUnique on the job (prevents two workers processing the same event)
        NO → Database-only with `wasRecentlyCreated` check is adequate

NO → Handling > 10 webhooks/second or running multiple queue workers?
    YES → Multi-layer required:
        Layer 1: Database unique constraint (stripe_event_id) — primary guard
        Layer 2: firstOrCreate with wasRecentlyCreated — application-level guard
        Layer 3: ShouldBeUnique on job — queue-level guard
        Layer 4 (optional): Redis lock on event ID before processing — execution-level guard

Is this a financial system where duplicate processing has monetary consequences?
YES → All four layers recommended (the cost of a duplicate is real money)
NO → Layers 1-3 are sufficient for most SaaS billing

Do you use a queue driver that supports unique jobs (Redis, SQS FIFO)?
YES → ShouldBeUnique is effective and cheap
NO → Consider an external dedup table or a Redis-backed lock

---

### Rationale

The database unique constraint is the primary and final guard — it operates at the database level where all writes converge. `firstOrCreate` with `wasRecentlyCreated` is the fast application-level check. `ShouldBeUnique` prevents two queue workers from processing the same job simultaneously. A Redis lock provides an execution-level guard for financial systems where duplicate processing has real monetary consequences.

---

### Recommended Default

**Default:** Three-layer dedup: database unique constraint (primary) + firstOrCreate/wasRecentlyCreated (application) + ShouldBeUnique on job (queue).

**Reason:** Protects against all common duplication scenarios (webhook retry, concurrent delivery, worker duplication) without adding significant complexity or infrastructure dependencies. The fourth layer (Redis lock) adds marginal benefit for most systems.

---

### Risks Of Wrong Choice

Database-only with multiple workers: two workers pick up jobs for the same event simultaneously, both pass `wasRecentlyCreated` check (jobs were created before either ran), both process. No ShouldBeUnique: queue replay dispatches duplicate jobs for the same event. All layers without monitoring: too many guards create complexity without corresponding value — pick the layers that protect against your actual failure modes.

---

### Related Rules

- Rule 2: Deduplicate at the Database Level Using a Unique Constraint
- Rule 5: Use ShouldBeUnique on the Processing Job as Secondary Guard

---

### Related Skills

- Implement Stripe Webhook Idempotency & Event Deduplication
- Implement Webhook Audit Log, Replay & Reconciliation

---

## Decision: Webhook Processing — Synchronous vs Asynchronous

---

### Decision Context

Choose whether webhook event processing (subscription updates, cache invalidation, notifications) happens synchronously within the webhook controller or asynchronously via a dispatched queued job.

---

### Decision Criteria

* latency: synchronous processing adds time to the webhook response; asynchronous returns 200 immediately
* reliability: synchronous processing risks Stripe timeout (20s) and retry; asynchronous decouples delivery from processing
* complexity: synchronous is simpler to debug (call stack is linear); asynchronous requires queue infrastructure and monitoring
* consistency: synchronous guarantees the state change is applied before the response; asynchronous introduces eventual consistency

---

### Decision Tree

Can all webhook processing complete in under 2 seconds (including database writes, cache invalidation, and any external calls)?
↓
YES → Is the processing guaranteed to never exceed 2 seconds under any load?
    YES → Are you comfortable with Stripe potentially retrying the webhook during processing?
        YES → Synchronous processing acceptable (but risky)
        NO → Asynchronous (always safer)

NO → Asynchronous processing required (Stripe's 20-second timeout is non-negotiable)
    ↓
    Which operations can happen synchronously?
    Event recording (StripeEvent insert) → ALWAYS synchronous (1-2ms, establishes the record)
    Signature verification → ALWAYS synchronous (required before anything else)
    Subscription state update → Asynchronous via job
    Cache invalidation → Asynchronous via job
    Email notifications → Asynchronous via job
    Analytics tracking → Asynchronous via job

Is there a requirement for the webhook response to indicate processing success/failure?
NO → Return 200 immediately after recording the event (standard approach)
YES → Consider a webhook status endpoint the caller can poll

---

### Rationale

Asynchronous processing is the correct default. The webhook controller records the event and dispatches a job — total time: 10-50ms. Processing complexity (which may involve third-party calls, heavy queries, or email sending) runs in the job, decoupled from Stripe's 20-second timeout. This prevents the most common webhook failure mode: Stripe times out, retries, and the retry also times out because the processing is too slow.

---

### Recommended Default

**Default:** Asynchronous processing. Controller verifies signature, records event, dispatches job, returns 200. All business logic runs in the queued job.

**Reason:** Decouples webhook delivery availability from processing throughput. Prevents Stripe timeout retries. Allows retry logic on failed processing without involving Stripe. Keeps the webhook controller fast and simple.

---

### Risks Of Wrong Choice

Synchronous for slow processing: Stripe times out (20s), retries the webhook, duplicate arrives, dedup catches it but the original processing is wasted. Under load, the queue of timed-out synchronous requests grows. Asynchronous without monitoring: job silently fails, subscription state becomes stale, drift accumulates.

---

### Related Rules

- Rule 3: Return 200 Quickly, Process Asynchronously via Queued Job
- Rule 1: Always Verify Webhook Signatures Before Processing

---

### Related Skills

- Implement Stripe Webhook Idempotency & Event Deduplication
- Detect and Repair Subscription Drift

---

## Decision: Handler Architecture — Monolith Switch vs Per-Event Classes

---

### Decision Context

Choose between a single handler class with a large switch/match statement dispatching by event type, or individual handler classes (one per Stripe event type) resolved at runtime.

---

### Decision Criteria

* maintainability: per-event classes isolate change scope; monolith switch grows unboundedly
* testability: per-event classes can be unit-tested in isolation; monolith requires integration testing
* discoverability: per-event classes self-document which events the system handles
* simplicity: monolith is simpler for < 5 event types; becomes unwieldy beyond that

---

### Decision Tree

How many distinct Stripe event types does your application handle?
↓
< 5 events → Monolith switch may be acceptable (e.g., subscription created/updated/deleted, invoice paid)
    BUT: are you likely to add more event types as the product grows?
    YES → Start with per-event classes now (refactoring a switch is painful)
    NO → Monolith switch is simpler and fine for stable event sets

5-15 events → Per-event handler classes (one class per event type)
    ↓
    How to dispatch to the correct handler?
    Match statement on event type → simplest, no registry needed
    Handler registry with auto-discovery → more decoupled, each handler registers itself
    Event type → class name convention (e.g., `CustomerSubscriptionCreated` → `SubscriptionCreatedHandler`)

> 15 events → Per-event classes with registry pattern
    Consider auto-discovery via interface + service container tagging

Do you need to support custom/additional event handlers (e.g., per-tenant, per-plan)?
YES → Registry or tagged service pattern (allows plugins/extensions)
NO → Match statement is adequate (static event set)

---

### Rationale

Per-event handler classes are the better architecture for any system handling more than a few event types. Each handler is a single-responsibility class: it knows how to process one specific Stripe event. Testing is trivial (one handler, one test class). Adding a new event type means adding one new class — no risk of breaking existing handlers.

---

### Recommended Default

**Default:** Per-event handler classes resolved via a match statement in the ProcessStripeEvent job. One class per event type.

**Reason:** Isolates each event type's processing logic. Easy to test. Easy to add new handlers. The match statement provides a clear, auditable mapping of event types to handlers. When the handler set exceeds 10, consider a registry pattern — but the match statement works well for most SaaS billing needs.

---

### Risks Of Wrong Choice

Monolith switch with 20 event types: 500+ lines of handler logic in one class, merge conflicts on every billing change, impossible to test individual handlers in isolation. Per-event classes with overly granular splitting: 50 handlers for events that all do the same thing. Registry pattern too early: over-engineered for 5 events.

---

### Related Rules

- Rule 4: All Webhook Handlers Must Use Idempotent Operations (updateOrCreate/upsert)
- Rule 3: Return 200 Quickly, Process Asynchronously via Queued Job

---

### Related Skills

- Implement Stripe Webhook Idempotency & Event Deduplication

---

## Decision: StripeEvent Retention — Time-Based vs Status-Based vs Hybrid

---

### Decision Context

Determine the retention and pruning strategy for the StripeEvent audit log table, which grows unbounded as webhooks accumulate.

---

### Decision Criteria

* compliance: regulatory requirements may mandate minimum retention periods for billing audit trails
* performance: large tables degrade query performance for admin dashboards and replay operations
* storage: StripeEvent payloads are JSON blobs that consume significant storage at scale
* operational: pruning strategy must not interfere with ongoing processing or reconciliation

---

### Decision Tree

What is the daily webhook volume?
↓
< 1,000 events/day → Is there a compliance requirement for audit retention?
    YES → Retain per compliance minimum (e.g., 7 years for financial records)
        Store older events in cold storage (S3, archive table) rather than the active table
    NO → Prune processed events after 90 days (keep recent history for debugging)

1,000-10,000 events/day → Prune processed events after 30-90 days
    Keep failed events indefinitely (for replay and investigation)
    Archive or delete skipped/duplicate events sooner (7 days)

> 10,000 events/day → Aggressive pruning required
    Processed events: prune after 30 days
    Failed events: prune after 90 days
    Consider partitioning the StripeEvent table by month
    Use a dedicated archive process (not in the active database)

Which statuses should be retained longer?
PROCESSED → Standard retention (30-90 days)
FAILED → Extended retention (90+ days — needed for debugging and replay)
SKIPPED/DUPLICATE → Short retention (7-14 days — minimal debugging value)
PENDING/PROCESSING → Retain indefinitely (these should be rare and resolved quickly)

---

### Rationale

A hybrid strategy (time-based with status differentiation) balances operational needs against storage costs. Processed events are the majority and can be pruned aggressively. Failed events have debugging value and should be retained longer. The pruning job should be a scheduled Artisan command that runs daily to prevent unbounded table growth.

---

### Recommended Default

**Default:** Prune processed events after 90 days, failed events after 180 days, skipped/duplicate events after 14 days. Never prune pending or processing events (these indicate a stuck job). Archive to cold storage if compliance requires longer retention.

**Reason:** 90 days of processed event history is sufficient for most debugging scenarios. Failed events need longer retention for incident investigation. Pending/processing events should never be silently pruned — they indicate a problem that needs resolution.

---

### Risks Of Wrong Choice

No pruning: StripeEvent table grows to millions of rows, queries for admin dashboard timeout, storage costs escalate. Over-aggressive pruning (7 days): cannot investigate a billing issue reported 2 weeks after it occurred because the audit trail is gone. Pruning pending events: silently deleting events that were never processed, losing the record of what should have happened.
