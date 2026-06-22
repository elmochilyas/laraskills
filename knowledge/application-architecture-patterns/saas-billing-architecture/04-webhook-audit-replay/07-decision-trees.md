# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Webhook Audit Log, Replay & Reconciliation
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Audit log storage — active StripeEvent table vs archive strategy
* Decision 2: Replay safety enforcement — manual verification vs automated handler audit
* Decision 3: Reconciliation auto-repair scope — safe fields only vs extended repair
* Decision 4: Reconciliation scheduling — single-server vs sharded by team

---

# Architecture-Level Decision Trees

---

## Decision: Audit Log Storage — Active StripeEvent Table vs Archive Strategy

---

### Decision Context

Determine how long to retain StripeEvent records in the active database table and when/if to archive older records to cold storage.

---

### Decision Criteria

* query performance: larger active tables degrade query performance for admin dashboards and replay operations
* compliance requirements: financial audits may require years of billing event history
* storage costs: JSON payloads consume significant database storage at scale
* operational complexity: archiving adds infrastructure and retrieval complexity

---

### Decision Tree

What is the daily webhook volume?
↓
< 500 events/day → Retain everything in the active table (annual storage is manageable)
    ↓
    Is there a compliance requirement for multi-year retention?
    YES → Export to cold storage annually (S3, archive DB); keep 1 year in active table
    NO → Retain in active table indefinitely (low volume, low cost)

500-5,000 events/day → Is regulatory compliance required (SOC2, PCI, GDPR)?
    YES → Retain in active table per compliance minimum; archive older to cold storage
    NO → Prune processed events at 90 days; keep failed events 180 days

> 5,000 events/day → Aggressive pruning required for active table performance
    ↓
    Archive workflow:
    1. Active table: last 30 days (for recent debugging)
    2. Archive table or S3: 30-365 days (for investigation)
    3. Cold storage: > 365 days (compliance-only, slow retrieval)

What query patterns does the admin UI need?
Recent events only (last 30 days) → Short active retention is fine
Historical audit queries (any date) → Need archive with query capability
No admin UI for events → Retention purely for operational debugging

---

### Rationale

For most SaaS billing systems, a 90-day active retention with a nightly prune job and optional cold storage archive strikes the right balance. 90 days covers most debugging scenarios. Beyond 90 days, events are needed only for compliance audits and historical investigations — slower retrieval from archive is acceptable.

---

### Recommended Default

**Default:** 90-day active retention for processed events, 180-day for failed events. Prune via scheduled Artisan command. Archive to S3 or a separate archive database if compliance requires longer retention.

**Reason:** Keeps the active table lean for query performance. Failed events get extended retention for debugging. Cold storage handles compliance without affecting operational performance.

---

### Risks Of Wrong Choice

No pruning: active table grows to millions of rows, admin dashboard queries time out, storage costs increase linearly. Over-aggressive pruning (7 days): cannot debug a billing issue reported 2 weeks later. Archiving without retrieval tooling: have the data but can't query it effectively.

---

### Related Rules

- Rule 1: The Audit Log Is Append-Only — Never Mutate Event Payloads

---

### Related Skills

- Implement Webhook Audit Log, Replay & Reconciliation
- Implement Stripe Webhook Idempotency & Event Deduplication

---

## Decision: Replay Safety Enforcement — Manual Verification vs Automated Handler Audit

---

### Decision Context

Determine how to ensure that webhook event replay is safe — that every handler is idempotent and can be replayed without producing duplicate records or corrupted state.

---

### Decision Criteria

* safety: automated enforcement prevents replay of non-idempotent handlers; manual verification relies on developer discipline
* developer experience: automated enforcement may flag false positives; manual verification requires pre-replay code review
* operational agility: manual verification allows fast replay in emergencies; automated enforcement requires handler fixes before replay
* false positives: static analysis may flag `create()` calls that are actually safe (e.g., append-only audit logs)

---

### Decision Tree

How many webhook handler classes does the system have?
↓
< 10 handlers → Manual verification: review each handler before enabling replay for its event type
    ↓
    Document each handler's idempotency status in a replay manifest:
    - `SubscriptionCreatedHandler`: idempotent (updateOrCreate on stripe_id) ✓
    - `InvoicePaymentSucceededHandler`: idempotent (updateOrCreate on invoice_id) ✓
    - `UsageRecordHandler`: NOT idempotent (creates records) — replay disabled ✗

> 10 handlers → Consider automated enforcement:
    ↓
    Static analysis rule: disallow `::create(` in handler classes (architecture test)
    ↓
    Runtime guard: before replay, check handler class against an approved list
    ↓
    Contract: handlers implement `IdempotentHandler` interface as declaration of safety

Is manual replay performed by engineers (who can verify) or by support staff (who cannot)?
ENGINEERS → Manual verification with checklist acceptable
SUPPORT STAFF → Automated enforcement required (support can't verify idempotency)

---

### Rationale

For teams with fewer than 10 handlers and replay performed by engineers, manual verification with a documented checklist is sufficient. The engineer reviewing the handler code before replaying is the safety mechanism. For larger systems or support-driven replay, automated enforcement (static analysis + approved handler list) prevents dangerous replays.

---

### Recommended Default

**Default:** Manual verification with a documented replay safety manifest. Each handler's idempotency status is explicitly declared. The replay service checks this manifest before allowing replay. Add an architecture test that flags `::create(` calls in handler classes as a secondary guard.

**Reason:** Manual verification is proportional for the typical number of handlers. The manifest documents which handlers are safe, creating accountability. Static analysis catches regressions (someone adding a `create()` call to a previously-idempotent handler).

---

### Risks Of Wrong Choice

No verification at all: support staff replays a non-idempotent handler, creates duplicate subscriptions for 100 teams. Overly strict automated enforcement: flags append-only audit logs as "unsafe" because they use `create()`, preventing replay of legitimate handlers. False sense of security from the `IdempotentHandler` interface: implementing the interface doesn't guarantee the code is actually idempotent.

---

### Related Rules

- Rule 2: Replay Must Be Safe — All Handlers Must Be Idempotent Before Enabling Replay
- Rule 4 (Webhook Idempotency): All Webhook Handlers Must Use Idempotent Operations

---

### Related Skills

- Implement Webhook Audit Log, Replay & Reconciliation
- Implement Stripe Webhook Idempotency & Event Deduplication

---

## Decision: Reconciliation Auto-Repair Scope — Safe Fields Only vs Extended Repair

---

### Decision Context

Define which subscription fields reconciliation can automatically repair (without human review) and which require manual approval.

---

### Decision Criteria

* business risk: auto-repairing plan changes could switch customer pricing without consent
* data integrity: date drifts are harmless to auto-repair; status drifts are usually safe
* operational load: more auto-repair reduces manual intervention; less auto-repair ensures human oversight
* reversibility: auto-repaired dates are easy to verify; auto-repaired plans have financial implications

---

### Decision Tree

Does the field affect how much the customer is charged?
↓
YES → NEVER auto-repair (plan/price changes are financial decisions)
    ALERT with high severity, create DriftAlert record for review

NO → Does the field affect whether the customer has feature access?
    YES → Is the access change from "has access" to "no access"?
        YES → DO NOT auto-repair (locking out a paying customer requires human judgment)
        NO → Auto-repair (granting access that Stripe confirms they should have)
    NO → Is the field a date (period start/end, trial end, canceled_at)?
        YES → Auto-repair with logging (dates are informational, clock skew is expected)
        ↓
        Is the date difference > 24 hours?
        YES → Auto-repair but alert (large date drift may indicate deeper issue)
        NO → Auto-repair silently (normal clock skew or minor timing difference)

Is the field `cancel_at_period_end`?
YES → Auto-repair (Stripe is authoritative on cancellation intent)

Is the field `stripe_status`?
YES → Is the transition moving to a "less access" state (active → past_due, past_due → canceled)?
    YES → Auto-repair but notify (user may notice access change)
    NO → Auto-repair (active → trialing is unlikely but harmless)

---

### Rationale

The guiding principle: Stripe is the source of truth for billing state. Fields that describe state (status, dates) can be safely auto-repaired. Fields that control pricing (plan/price ID) have financial implications and must never be auto-repaired. Fields that revoke access (active → canceled) should be auto-repaired but with notification, since users will notice the access change.

---

### Recommended Default

**Default:** Auto-repair: stripe_status, trial_ends_at, current_period_start, current_period_end, canceled_at, cancel_at_period_end. Never auto-repair: plan_id / stripe_price_id. Alert on all repairs, escalate on: plan drift, status transition to canceled/expired, date drift > 24 hours.

**Reason:** Maximizes automation for safe fields while protecting against financial and access-related errors. All repairs are logged for audit. Plan changes are never automated — the financial risk is too high.

---

### Risks Of Wrong Choice

Auto-repairing plan changes: customer silently switched to a different plan, charged a different amount, files a chargeback. Not auto-repairing dates: 10,000 subscriptions have minor date drift, ops team spends hours clicking "repair" for each one. Auto-repairing access revocation: user locked out because a transient Stripe API issue reported "canceled" status incorrectly.

---

### Related Rules

- Rule 3: Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes
- Rule 1 (Drift): Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe

---

### Related Skills

- Detect and Repair Subscription Drift
- Implement Webhook Audit Log, Replay & Reconciliation

---

## Decision: Reconciliation Scheduling — Single-Server vs Sharded by Team

---

### Decision Context

Choose how to schedule and execute reconciliation jobs as the number of active subscriptions grows from hundreds to tens of thousands.

---

### Decision Criteria

* throughput: Stripe API rate limit (~25 req/sec live mode) is the bottleneck, not CPU or memory
* reliability: single-server is simpler; sharded requires coordination to avoid gaps
* monitoring: single-server output is easy to parse; sharded requires aggregation
* operational complexity: sharding requires partitioning logic and job coordination

---

### Decision Tree

How many active subscriptions does the system have?
↓
< 1,000 → Single-server, single-threaded reconciliation (runs in ~50 seconds at 20 calls/sec)
    Schedule: hourly with `withoutOverlapping`

1,000-10,000 → Single-server, single-threaded (runs in ~50-500 seconds at 20 calls/sec)
    Schedule: hourly with `withoutOverlapping` and `runInBackground`
    Consider: running during off-peak hours if full reconciliation takes > 10 minutes

10,000-50,000 → Single-server with batching (chunk team IDs, process in batches)
    Schedule: stagger reconciliation across hours (batch 1 at :00, batch 2 at :15, etc.)
    OR: shard by team ID ranges across multiple server instances

> 50,000 → Sharded by team ID ranges required
    Shard strategy: partition by `team_id % N` where N = number of shards
    Each shard runs as a separate scheduled job
    Aggregate results into a central drift_report table
    Use `onOneServer` per shard to prevent duplicate runs

Is reconciliation latency critical (must detect drift within minutes)?
YES → Continuous reconciliation: process a small batch every minute
NO → Hourly batch reconciliation is sufficient for most SaaS

---

### Rationale

For most SaaS businesses (< 10,000 active subscriptions), a single-server, single-threaded reconciliation job is adequate. At 20 calls/sec, 10,000 subscriptions take ~8 minutes — well within an hourly window. Sharding adds complexity that isn't warranted until the subscription count exceeds what a single job can process in one hour.

---

### Recommended Default

**Default:** Single-server, hourly reconciliation with `withoutOverlapping(600)` (10-minute lock). For > 10,000 subscriptions, add batching within the single job. Graduate to sharding at > 50,000.

**Reason:** Simplicity first. A single job is easy to monitor, easy to debug, and handles most scales. Batching within the job covers the gap between single-server and full sharding. Sharding adds operational complexity that should be deferred until necessary.

---

### Risks Of Wrong Choice

Single-server with 100,000 subscriptions: reconciliation takes 83 minutes, overlaps with the next scheduled run, Stripe rate limits kick in, job never completes. Sharding too early: complex job coordination for 500 subscriptions, operational overhead with no benefit. Not using `withoutOverlapping`: two reconciliation jobs run simultaneously, both querying Stripe API, doubling the rate-limit pressure.
