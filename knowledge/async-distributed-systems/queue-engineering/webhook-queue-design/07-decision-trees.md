# Decision Trees for Webhook Queue Design

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Webhook Queue Design for Billing Systems |
| Related KUs | Billing queue topology, Queue deployment safety, After-commit events and jobs |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-WQD-001 | Does this webhook system need a dedicated queue? | P0 |
| DT-WQD-002 | Which idempotency mechanism should I use? | P0 |
| DT-WQD-003 | Should webhook processing be serialized per entity? | P0 |
| DT-WQD-004 | What retry configuration is appropriate for webhook jobs? | P1 |

---

## DT-WQD-001: Does This Webhook System Need a Dedicated Queue?

### Decision Context
Not every webhook system needs a dedicated queue. For low-volume applications, the default queue is sufficient. For billing systems where webhook processing affects subscription state, a dedicated queue prevents notification backlogs from delaying billing updates. The decision calibrates infrastructure investment to actual need.

### Decision Criteria
- How many webhooks per hour does the system receive at peak?
- Do webhooks mutate billing state (subscriptions, invoices, payments)?
- Can a notification backlog delay webhook processing?
- Is the application using Horizon for queue management?

### Decision Tree

```
Do webhooks mutate billing state (subscriptions, invoices, payments)?
├── NO → Default queue is likely sufficient. Monitor for contention.
├── YES → How many webhooks per hour at peak?
    ├── < 10/hour → Default queue is acceptable. Add a dedicated queue when volume grows.
    ├── 10-100/hour → DEDICATED QUEUE RECOMMENDED. Notification backlogs may delay processing.
    └── > 100/hour → DEDICATED QUEUE REQUIRED. Without isolation, billing state divergence is likely.
```

### Rationale
Billing webhooks directly affect subscription state, payment records, and feature entitlements. A delay in processing means customers may lose access to paid features or retain access without payment. When webhooks share a queue with notification jobs (email blasts, report generation), a backlog of non-critical work can block critical billing updates. A dedicated queue with 1-2 workers ensures webhooks are always picked up immediately.

### Recommended Default
**For billing webhooks, default to a dedicated `webhooks` queue.** The cost is minimal (one Horizon supervisor with 1-2 workers) and the benefit is guaranteed isolation from non-critical job backlogs. Calibrate down only for very low-volume non-billing webhooks.

### Risks Of Wrong Choice
- **Dedicated queue when not needed**: One extra supervisor to manage. Negligible cost.
- **Shared queue for billing webhooks**: Notification backlog delays webhook processing. Subscription state diverges from Stripe. Customers lose paid access. Revenue-impacting incident.

### Related Rules
- Never Process Webhooks Synchronously in the Controller

---

## DT-WQD-002: Which Idempotency Mechanism Should I Use?

### Decision Context
Stripe delivers webhooks with at-least-once semantics — the same event may be delivered multiple times. Without idempotency, a redelivered `invoice.payment_succeeded` event creates duplicate revenue records. Laravel offers `ShouldBeUnique` (prevents duplicate dispatch) and database-level checks (prevents duplicate processing). The decision determines where idempotency is enforced.

### Decision Criteria
- Can the same webhook event be dispatched to the queue multiple times?
- Can the same job be picked up by multiple workers simultaneously?
- Is the idempotency check fast enough to not block the job?
- Do you need defense in depth (both dispatch-level and processing-level idempotency)?

### Decision Tree

```
Can the same webhook event be dispatched multiple times (Stripe redelivery)?
├── YES → ShouldBeUnique with uniqueId() = stripe_event_id prevents duplicate dispatch
│   └── Also implement a processed_at check in handle() for defense in depth
├── NO (single delivery guaranteed) → Is the job retried after failure?
    ├── YES → processed_at check in handle() prevents reprocessing on retry
    └── NO → Idempotency check may be unnecessary (but is cheap insurance)
```

### Rationale
`ShouldBeUnique` prevents the same job from being dispatched twice (based on `uniqueId()`). This handles Stripe redelivery at the dispatch level. However, if the unique lock expires before the first job completes (long processing time), a second dispatch may succeed. The `processed_at` check in `handle()` is the second layer — even if the job is dispatched twice, the second execution sees `processed_at` is set and returns early. Defense in depth is the safest approach.

### Recommended Default
**Use both: `ShouldBeUnique` with `uniqueId()` returning `stripe_event_id`, plus a `processed_at` check in `handle()`.** The cost is minimal (one extra database column and one extra query) and the benefit is guaranteed idempotency even under edge cases.

### Risks Of Wrong Choice
- **Only `ShouldBeUnique`**: If the unique lock expires before processing completes, a redelivered webhook is dispatched and processed twice.
- **Only `processed_at` check**: Duplicate jobs are dispatched and picked up by workers, consuming resources before the check bails them out. Not harmful but wasteful.
- **No idempotency**: Duplicate invoices, double-credited accounts, corrupted subscription state. This is a production incident.

### Related Rules
- Enforce Idempotency on Every Webhook Job

---

## DT-WQD-003: Should Webhook Processing Be Serialized Per Entity?

### Decision Context
Stripe can deliver multiple webhooks for the same resource concurrently. A `subscription.updated` and `subscription.deleted` arriving at the same time, processed by different workers, can produce corrupted state: the delete handler sets `status = 'cancelled'`, then the update handler overwrites it back to `status = 'active'` based on stale data. `WithoutOverlapping` middleware serializes processing per entity.

### Decision Criteria
- Can multiple webhooks for the same subscription/team arrive simultaneously?
- Does webhook processing mutate shared state (subscription status, invoice records)?
- Are there multiple workers on the webhooks queue?
- Can out-of-order processing corrupt billing state?

### Decision Tree

```
Can multiple webhooks for the same entity arrive simultaneously?
├── NO (single worker, serialized by design) → WithoutOverlapping not needed
├── YES → Does processing mutate shared billing state?
    ├── NO (read-only, analytics-only) → WithoutOverlapping not needed
    ├── YES → Are there multiple workers on the webhooks queue?
        ├── NO (single worker) → WithoutOverlapping not needed (serialized by single worker)
        └── YES → WithoutOverlapping REQUIRED. Key on team_id or subscription_id.
```

### Rationale
With multiple workers, two webhooks for the same subscription can be picked up simultaneously. Without serialization, their state mutations interleave: one sets `status = 'active'`, the other sets `status = 'cancelled'`, and the final state depends on which finishes last — non-deterministic. `WithoutOverlapping('stripe-webhook-team:' . $teamId)` ensures only one webhook per team processes at a time, while webhooks for different teams still process in parallel.

### Recommended Default
**If the webhooks queue has more than 1 worker, use `WithoutOverlapping` keyed on the team or subscription ID.** The cost is a cache lock per entity; the benefit is preventing state corruption from concurrent processing.

### Risks Of Wrong Choice
- **WithoutOverlapping when not needed (single worker)**: Negligible overhead. No harm.
- **No WithoutOverlapping with multiple workers**: Intermittent state corruption from interleaved webhook processing. Bugs are extremely difficult to reproduce and debug because they depend on timing.

### Related Rules
- Serialize Webhook Processing Per Entity with WithoutOverlapping

---

## DT-WQD-004: What Retry Configuration Is Appropriate for Webhook Jobs?

### Decision Context
Webhook jobs need retries for transient failures (Stripe API rate limits, network blips, temporary database unavailability) but must stop retrying for permanent failures (invalid payload, missing customer record, deleted subscription). The retry configuration must balance resilience against resource waste.

### Decision Criteria
- Are failures likely to be transient (network, rate limit) or permanent (invalid data)?
- How long does the webhook handler take to process?
- What's the maximum acceptable delay for a webhook to be processed?
- Is there a dead-letter table for permanent failures?

### Decision Tree

```
Are failures likely to be transient (Stripe API blips, rate limits)?
├── YES → #[Tries(5)] with exponential backoff: #[Backoff([5, 15, 30, 60, 120])]
│   └── Is there a dead-letter table for permanent failures?
│       ├── YES → Implement failed() handler to write to dead_letters table
│       └── NO → Create dead-letter table before deploying (permanent failures need visibility)
├── NO (all failures are permanent) → #[Tries(3)] with short backoff: #[Backoff([1, 5, 15])]
└── MIXED (some transient, some permanent) → #[Tries(5)] with backoff + failed() handler
    └── The job logic should distinguish: retry transient, dead-letter permanent
```

### Rationale
Stripe API failures are often transient — a rate limit response (429) or a brief network timeout resolves on retry. But a webhook referencing a customer that was deleted from Stripe is a permanent failure — no amount of retries will fix it. `#[Tries(5)]` with exponential backoff gives transient failures 5 chances to succeed. The `failed()` handler catches permanent failures after all retries are exhausted and writes them to a dead-letter table for manual inspection.

### Recommended Default
**`#[Tries(5)]` with `#[Backoff([5, 15, 30, 60, 120])]` and a `failed()` handler that writes to a `dead_letters` table.** Never use `tries=0` (infinite) — permanent failures would retry forever, wasting workers.

### Risks Of Wrong Choice
- **`tries=0` (infinite)**: Permanent failures retry forever. Workers permanently occupied. Failed jobs table fills with unrecoverable entries.
- **`tries=1` (no retry)**: Transient Stripe API failures become permanent processing failures. A single rate-limit response loses the webhook.
- **No `failed()` handler**: Permanent failures disappear into the failed_jobs table with no readable context. Support staff can't replay them.

### Related Rules
- Set a Finite Retry Limit with maxExceptions and a failed() Handler
