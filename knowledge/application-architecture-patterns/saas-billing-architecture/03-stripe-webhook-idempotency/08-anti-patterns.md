# Anti-Patterns: Stripe Webhook Idempotency & Event Deduplication

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Stripe Webhook Idempotency & Event Deduplication |
| Audience | Developers, Billing Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-WHI-01 | No Webhook Signature Verification | Critical | Low | Low |
| AP-WHI-02 | Synchronous Webhook Processing | High | High | Medium |
| AP-WHI-03 | Non-Idempotent Webhook Handlers | Critical | Medium | Medium |
| AP-WHI-04 | Missing Unique Constraint on Event ID | Critical | Medium | Low |
| AP-WHI-05 | No Race Condition Handling | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Processing Webhooks Without a StripeEvent Model**: Transforming and applying state directly without recording the raw event
- **Single Monolithic Webhook Handler**: One giant class with a switch statement handling 20+ event types
- **No Retry Logic on Failed Events**: Failed handlers leave events permanently unprocessed with no mechanism to retry

---

## 1. No Webhook Signature Verification

### Category
Security · Critical

### Description
Processing Stripe webhook payloads without verifying the `Stripe-Signature` header using `Webhook::constructEvent()`, allowing attackers to forge webhook payloads.

### Why It Happens
During initial webhook setup, the developer tests with the Stripe CLI or dashboard's "Send test webhook" feature. It works. They move on to handling the payload without realizing the signature verification step is missing. The webhook endpoint "works" in testing because Stripe sends valid payloads. The gap only becomes apparent when considering security.

### Warning Signs
- `json_decode($request->getContent(), true)` is the first line of the webhook controller
- No call to `Webhook::constructEvent()` anywhere in the webhook handling code
- No `config('cashier.webhook.secret')` referenced in the webhook flow
- Webhook endpoint returns 200 for any POST request with valid JSON

### Why Harmful
Without signature verification, anyone who discovers the webhook endpoint URL can POST forged Stripe events. An attacker can send a `customer.subscription.deleted` event to cancel any subscription. They can send `invoice.payment_succeeded` to mark invoices as paid. The entire billing system's integrity depends on verifying that webhooks actually came from Stripe.

### Real-World Consequences
- Attacker discovers webhook URL (often guessable: `/stripe/webhook`)
- Sends forged `customer.subscription.updated` with `status: active` and a premium price ID
- Gains access to enterprise features without paying
- Sends forged `invoice.payment_succeeded` — system records payment that never occurred
- Sends forged `charge.refunded` — triggers refund for a charge ID they found in client-side code

### Preferred Alternative
Always call `Webhook::constructEvent($payload, $sigHeader, $secret)` at the top of the webhook controller. Return 400 for any request with an invalid signature. Never process the payload before verification.

### Refactoring Strategy
1. Set `STRIPE_WEBHOOK_SECRET` in `.env` from the Stripe Dashboard
2. Add signature verification as the first operation in the webhook controller
3. Return 400 with a logged warning for invalid signatures
4. Test with Stripe CLI's `stripe trigger` (which sends proper signatures)
5. Test by sending a request without a signature header — verify 400 response

### Detection Checklist
- [ ] Is `Webhook::constructEvent()` called before any payload processing?
- [ ] Is the webhook signing secret configured from environment variable (not hardcoded)?
- [ ] Does an invalid signature return 400?
- [ ] Can you send a forged webhook payload and get a 200 response?
- [ ] Is the signing secret rotated on a defined schedule?

### Related Rules/Skills/Trees
- Rule 1: Always Verify Webhook Signatures Before Processing
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)

---

## 2. Synchronous Webhook Processing

### Category
Performance · Reliability

### Description
Processing webhook business logic (database updates, cache invalidation, email notifications) synchronously within the webhook controller instead of dispatching to a queued job, risking Stripe timeout and duplicate processing.

### Why It Happens
During development, synchronous processing is the path of least resistance. The developer handles the event inline: update subscription, clear cache, send email. It works for a single event. Queue setup feels like overhead for "just handling a webhook." The latency isn't apparent until production scale.

### Warning Signs
- Webhook controller contains business logic beyond event recording and job dispatch
- `ProcessStripeEvent` job doesn't exist or isn't dispatched from the controller
- Controller access time in logs exceeds 10 seconds for some webhooks
- Stripe dashboard shows webhook delivery failures with timeout errors
- Increasing webhook retry rate in Stripe dashboard

### Why Harmful
Stripe expects a response within 20 seconds. If processing takes longer, Stripe marks the delivery as failed and retries. The retry also times out (same slow processing). This creates a cascade: each retry dispatches more work, the queue backs up, more webhooks time out. The idempotency layer catches duplicates, but the processing is wasted and resources are consumed.

### Real-World Consequences
- Invoice payment webhook runs for 15 seconds (update subscription, generate PDF, send email, update analytics)
- During batch invoicing, 200 invoices fire in rapid succession
- 200 synchronous processors consume all PHP-FPM workers
- Other webhooks time out because no workers are available
- Stripe retries all timed-out webhooks, doubling the load
- Application becomes unresponsive during billing cycles

### Preferred Alternative
Webhook controller: verify signature → record StripeEvent → dispatch ProcessStripeEvent job → return 200. All processing happens in the queued job with retry logic. Controller response time: 10-50ms.

### Refactoring Strategy
1. Create `ProcessStripeEvent` job if it doesn't exist
2. Move all business logic from controller to appropriate handler classes
3. In controller, keep only: signature verification, event recording, job dispatch, 200 response
4. Ensure queue workers are configured and monitored
5. Test webhook response time under load (should be < 100ms)

### Detection Checklist
- [ ] Does the webhook controller contain business logic beyond signature verification and event recording?
- [ ] Is `ProcessStripeEvent::dispatch()` called for every new event?
- [ ] What is the 99th percentile response time for the webhook endpoint?
- [ ] Are there webhook timeout errors in the Stripe dashboard?
- [ ] Do webhook retries correlate with high application load?

### Related Rules/Skills/Trees
- Rule 3: Return 200 Quickly, Process Asynchronously via Queued Job
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
- Webhook Processing — Synchronous vs Asynchronous (07-decision-trees.md)

---

## 3. Non-Idempotent Webhook Handlers

### Category
Data Integrity · Critical

### Description
Webhook handler classes using `create()` or other non-idempotent operations, producing duplicate records when an event is replayed or retried.

### Why It Happens
`create()` is the natural operation for "save this new thing." The handler receives a subscription.created event and calls `Subscription::create(...)`. It works the first time. The developer hasn't considered what happens when the same event is processed twice. The idempotency requirement feels like a theoretical concern until a replay or retry actually occurs.

### Warning Signs
- `Model::create([...])` inside webhook handler classes
- `INSERT INTO` without `ON CONFLICT` or `ON DUPLICATE KEY UPDATE`
- No `updateOrCreate` or `upsert` calls in handler code
- Tests never replay the same handler twice for the same event
- `replay` functionality exists but hasn't been tested for idempotency

### Why Harmful
When a handler using `create()` is replayed (due to retry, manual replay, or reconciliation), it creates a duplicate record. For subscription.created: duplicate subscription, duplicate entitlement cache, confused billing state. For invoice.payment_succeeded: duplicate payment record, double-counted revenue, duplicate receipt email. The replay system becomes dangerous instead of helpful.

### Real-World Consequences
- Bug in webhook processing: all `subscription.created` events from the last 24 hours need replay
- Support runs `billing:replay --type=customer.subscription.created --since=yesterday`
- Non-idempotent handler creates duplicate subscriptions for 50 teams
- Each team now has two "active" subscriptions, two entitlement sets
- Revenue reporting shows double the actual subscription count
- Data cleanup requires manual database surgery

### Preferred Alternative
Every handler must use `updateOrCreate` (Eloquent) or `upsert` (Query Builder) operations. The natural key (usually `stripe_id`) is used to find-or-create the record. Replay produces the same result regardless of how many times it executes.

### Refactoring Strategy
1. Audit all handler classes for `create()` calls
2. Replace with `updateOrCreate(['stripe_id' => $data['id']], [...])`
3. For handlers that insert into pivot tables, use `syncWithoutDetaching` or `updateOrCreate`
4. Add idempotency tests: call each handler twice with the same payload, verify only one record exists
5. Document the idempotency requirement in the handler base class or contract

### Detection Checklist
- [ ] Are there any `::create([...])` calls in webhook handler classes?
- [ ] Do handlers use `updateOrCreate` or `upsert` consistently?
- [ ] Can each handler be called twice with the same payload without producing duplicates?
- [ ] Is there an idempotency test for each handler?
- [ ] Does the replay system document which handlers are safe to replay?

### Related Rules/Skills/Trees
- Rule 4: All Webhook Handlers Must Use Idempotent Operations (updateOrCreate/upsert)
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
- Implement Webhook Audit Log, Replay & Reconciliation (06-skills.md)

---

## 4. Missing Unique Constraint on Event ID

### Category
Data Integrity · Critical

### Description
Relying solely on application-level deduplication (`firstOrCreate` with `wasRecentlyCreated`) without a database-level unique index on `stripe_event_id`, leaving a race condition window for concurrent webhooks.

### Why It Happens
`firstOrCreate` appears to handle deduplication. The developer tests single-threaded and it works. The database constraint is forgotten because the application code "already handles duplicates." The race condition window (between the `SELECT` and `INSERT` in `firstOrCreate`) is invisible during development.

### Warning Signs
- No `$table->string('stripe_event_id')->unique()` in the StripeEvent migration
- Only application-level dedup: `if (!StripeEvent::where(...)->exists()) { create }`
- Occasional duplicate StripeEvent records in production with same `stripe_event_id`
- "Duplicate entry" errors appearing intermittently (the only sign the constraint is missing)

### Why Harmful
Two concurrent webhook requests for the same event (common during Stripe retries) can both pass the `firstOrCreate` check before either inserts. Without the unique constraint, both inserts succeed. Two `ProcessStripeEvent` jobs are dispatched for the same event. Both process the same state change. Unless every handler is perfectly idempotent (many aren't), this produces duplicate records.

### Real-World Consequences
- Stripe retry delivers the same `invoice.payment_succeeded` event twice within 100ms
- Both webhook processes pass the application-level "does this event exist?" check
- Both insert a StripeEvent record (no unique constraint to prevent it)
- Both dispatch ProcessStripeEvent jobs
- If the handler is idempotent: wasted processing, but no data corruption (best case)
- If the handler is not idempotent: duplicate payment record, double-counted revenue, duplicate email

### Preferred Alternative
Add a unique index on `stripe_event_id` in the database migration. Use `firstOrCreate` within a transaction. Catch `UniqueConstraintViolationException` for the race condition case. The unique constraint is the atomic guard that catches what application-level checks miss.

### Refactoring Strategy
1. Add unique index: `$table->unique('stripe_event_id')` in a migration
2. Verify no existing duplicates before adding the constraint (clean up if needed)
3. Ensure webhook controller uses `firstOrCreate` within `DB::transaction()`
4. Add catch for `UniqueConstraintViolationException` as a safety net
5. Test with concurrent webhook delivery (use `ab -n 10 -c 10` or concurrent test)

### Detection Checklist
- [ ] Is there a unique index or constraint on `stripe_event_id` in the database?
- [ ] Does `SHOW INDEX FROM stripe_events` show a unique index on `stripe_event_id`?
- [ ] Does the webhook controller catch `UniqueConstraintViolationException`?
- [ ] Are there any duplicate `stripe_event_id` values in the production database?
- [ ] Has concurrent webhook delivery been tested?

### Related Rules/Skills/Trees
- Rule 2: Deduplicate at the Database Level Using a Unique Constraint
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
- Deduplication Guard Strategy — Database-Only vs Multi-Layer (07-decision-trees.md)

---

## 5. No Race Condition Handling

### Category
Reliability

### Description
Implementing deduplication with `firstOrCreate` but not handling the `UniqueConstraintViolationException` that occurs when two concurrent processes insert the same event ID simultaneously.

### Why It Happens
The `firstOrCreate` pattern looks correct. The developer assumes it's atomic (it's not — it executes a SELECT followed by an INSERT). During single-threaded testing, it always works. The race condition is a production-scale edge case that's hard to reproduce in development.

### Warning Signs
- `firstOrCreate` used without `DB::transaction()` wrapping
- No try-catch for `UniqueConstraintViolationException` around event insertion
- Occasional 500 errors in the webhook endpoint logs
- Error messages mentioning "Duplicate entry" for `stripe_event_id`

### Why Harmful
When the race condition fires (two concurrent webhooks, both finding no existing record, both trying to insert), one succeeds and one gets a `UniqueConstraintViolationException`. Without catching this exception, the webhook endpoint returns a 500 error. Stripe sees the 500 and retries the webhook. The retry creates a new StripeEvent (different arrival time) and dispatches another job. The duplicate webhook cycle continues.

### Real-World Consequences
- Stripe sends `customer.subscription.updated` → two concurrent processes both pass the application check
- One inserts successfully, the other throws `UniqueConstraintViolationException`
- Uncaught exception → 500 response → Stripe retries → another 500
- Stripe eventually gives up after 3 days of retries
- The subscription state change that was supposed to trigger entitlement invalidation never happened
- Customer reports "my plan changed but the app still shows the old plan"

### Preferred Alternative
Wrap `firstOrCreate` in a `DB::transaction()` block. Catch `UniqueConstraintViolationException` and treat it as an idempotent duplicate: log a debug message, return 200. The duplicate webhook is safely ignored.

### Refactoring Strategy
1. Wrap the event insert in `DB::transaction(function () { ... })`
2. Add catch for `UniqueConstraintViolationException` after the transaction
3. Log at INFO level when the race condition occurs (for monitoring)
4. Return 200 — the event was already recorded (idempotent behavior)
5. Test with concurrent requests to verify the catch works

### Detection Checklist
- [ ] Is there a try-catch for `UniqueConstraintViolationException` around event insertion?
- [ ] Does the webhook controller return 200 for the race condition case?
- [ ] Are race condition occurrences logged for monitoring?
- [ ] Has concurrent webhook delivery been tested in CI?
- [ ] Are there any unhandled 500 errors in the webhook endpoint logs?

### Related Rules/Skills/Trees
- Rule 2: Deduplicate at the Database Level Using a Unique Constraint
- Rule 5: Use ShouldBeUnique on the Processing Job as Secondary Guard
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
