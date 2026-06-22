# Anti-Patterns for Webhook Queue Design

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Webhook Queue Design for Billing Systems |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-WQD-001 | Synchronous Webhook Processing | Critical | Medium |
| AP-WQD-002 | Single Queue for Everything | High | High |
| AP-WQD-003 | Fire-and-Forget Webhook Processing | Critical | Medium |
| AP-WQD-004 | No Dead-Letter Table | High | Medium |
| AP-WQD-005 | Infinite Retries on Webhook Jobs | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-AC-001 (Stripe Charge Inside Transaction) — from After-Commit Events
- AP-QDS-001 (Kill -9 on Queue Workers) — from Queue Deployment Safety

---

## AP-WQD-001: Synchronous Webhook Processing

### Category
Resilience | Billing

### Description
Processing Stripe webhook business logic (subscription updates, invoice generation, notification sending) inline in the webhook controller instead of dispatching to a queue. Stripe expects a 200 response within ~20 seconds; synchronous processing risks timeouts, which Stripe interprets as failure and triggers redelivery.

### Why It Happens
- Convenience of single-file code: everything in the controller is easy to read
- The developer doesn't know about queue-based webhook processing
- The webhook volume is low in development, so no timeout is observed
- Copy-paste from a tutorial that processes webhooks synchronously

### Warning Signs
- Business logic (subscription updates, invoice creation, mail sending) in the webhook controller's `__invoke` method
- No `ProcessStripeWebhook` job class in the codebase
- Stripe dashboard shows webhook delivery timeouts or 5xx responses
- The webhook controller takes more than 2 seconds to respond

### Why Harmful
Stripe expects a quick 200 response. Long synchronous processing blocks the HTTP worker, reducing capacity for other webhooks. If the inline logic throws an exception, the endpoint returns 500 — Stripe retries, potentially re-processing a partially-applied state change. Under high webhook volume, synchronous processing exhausts the HTTP worker pool, causing all webhooks to fail.

### Real-World Consequences
- A SaaS platform processes `invoice.payment_succeeded` synchronously: updates the subscription, generates an invoice PDF, sends a confirmation email. The PDF generation takes 15 seconds. Stripe times out at 20 seconds and redelivers the webhook. The controller processes it again — duplicate invoice, duplicate email. Under a batch of 50 invoices, the HTTP worker pool is exhausted and all incoming requests fail.

### Preferred Alternative
The webhook controller should only: (1) validate the Stripe signature, (2) persist the raw payload to `stripe_events`, (3) dispatch a `ProcessStripeWebhook` job with `->afterCommit()`, (4) return 200 immediately. All business logic runs in the queued job, which has retry, timeout, and dead-letter handling.

### Refactoring Strategy
1. Identify webhook controllers that contain business logic beyond signature validation and persistence.
2. Move business logic to a `ProcessStripeWebhook` job class.
3. Update the controller to persist the raw payload and dispatch the job.
4. Test that the controller responds in under 1 second.
5. Test that the job processes the webhook correctly when picked up by the worker.

### Detection Checklist
- [ ] Business logic (subscription updates, invoice creation) found in webhook controller
- [ ] No `ProcessStripeWebhook` or equivalent job class exists
- [ ] Stripe dashboard shows webhook delivery timeouts
- [ ] Webhook controller response time exceeds 2 seconds
- [ ] No queue dispatch in the webhook controller

### Related Rules
- Never Process Webhooks Synchronously in the Controller

---

## AP-WQD-002: Single Queue for Everything

### Category
Queue Topology | Billing

### Description
Processing Stripe webhooks, email notifications, report generation, and image processing all on the same `default` queue. A backlog of non-critical work (10,000 welcome emails during a marketing campaign) blocks critical billing webhooks, causing subscription state divergence.

### Why It Happens
- Default Laravel configuration uses a single `default` queue
- The developer hasn't configured Horizon with multiple supervisors
- Adding queues feels like premature optimization
- The impact of queue contention isn't visible until production traffic spikes

### Warning Signs
- All jobs dispatched without `->onQueue()` or `#[Queue]` attribute
- Only a `default` queue in `config/horizon.php`
- Webhook processing delays during notification bursts
- Stripe dashboard shows webhook delivery delays during marketing campaigns

### Why Harmful
Webhooks are the critical integration point between Stripe and your billing state. A delay means subscription statuses, payment confirmations, and cancellation events are not reflected in your database. When a 10,000-email marketing campaign fills the default queue, Stripe webhooks sit behind those emails for minutes or hours. Customers on paid plans lose access. Customers who cancelled retain access. Revenue-impacting outage from a non-critical notification backlog.

### Real-World Consequences
- A SaaS platform sends a welcome email campaign to 10,000 new users. All email jobs go to the `default` queue. During the 30 minutes it takes to process the email backlog, 50 Stripe webhooks sit in the queue behind the emails. A customer's `invoice.payment_failed` webhook is delayed by 25 minutes — they don't receive the payment failure notification until it's too late to update their card, and their subscription is cancelled by Stripe before the webhook is even processed.

### Preferred Alternative
Separate queues by concern: `webhooks` (Stripe events, critical), `billing` (invoice generation, subscription sync), `notifications` (emails, Slack), `default` (everything else). Each queue gets its own Horizon supervisor with appropriate worker counts. Webhooks always have 1-2 dedicated workers and are never blocked by notification backlogs.

### Refactoring Strategy
1. Identify all job classes in the codebase and categorize them by concern (webhook, billing, notification, default).
2. Add `#[Queue('webhooks')]`, `#[Queue('billing')]`, etc. to each job class.
3. Configure Horizon supervisors for each queue with appropriate `maxProcesses`, `tries`, and `timeout`.
4. Test that a notification backlog does not delay webhook processing.

### Detection Checklist
- [ ] All jobs dispatched to the `default` queue
- [ ] No `#[Queue]` attribute on job classes
- [ ] Only one supervisor in `config/horizon.php`
- [ ] Webhook processing delays observed during notification bursts
- [ ] No queue separation between critical and non-critical jobs

### Related Rules
- Always Persist Raw Webhook Payload Before Processing

---

## AP-WQD-003: Fire-and-Forget Webhook Processing

### Category
Data Integrity | Billing

### Description
Dispatching a webhook processing job with the parsed payload directly, without first persisting the raw event to a `stripe_events` table. If the job fails at the queue level (Redis outage, memory exhaustion, worker crash), the payload is in the failed_jobs table as a serialized blob — not queryable, not easily replayable, and potentially lost.

### Why It Happens
- The developer treats the job payload as the source of truth
- No awareness of the `stripe_events` table pattern
- The failed_jobs table seems sufficient for recovery
- Convenience: dispatching with the payload directly is one less step

### Warning Signs
- `ProcessStripeWebhook::dispatch($event->data->toArray())` — dispatches parsed payload, not an ID
- No `stripe_events` table in the database
- No `StripeEvent` model in the codebase
- Failed webhooks require manual reconstruction from Stripe's dashboard or API
- No way to query "which webhooks failed last week?"

### Why Harmful
If the job fails and the raw payload was not persisted, the team must reconstruct the event from Stripe's dashboard or API — error-prone and slow during an incident. The failed_jobs table stores serialized job payloads, but these are not queryable by `stripe_event_id`, `team_id`, or `event_type`. Without a `stripe_events` table, there's no audit trail of which webhooks were received and which were processed.

### Real-World Consequences
- A Redis outage causes 30 webhook jobs to fail. The jobs were dispatched with parsed payloads, not persisted to a `stripe_events` table. The failed_jobs table has 30 serialized blobs. The team must manually extract the `stripe_event_id` from each blob, fetch the event from Stripe's API, and replay it. This takes 4 hours during an incident. If the team had persisted the raw payloads first, replay would have been a simple `SELECT * FROM stripe_events WHERE processed_at IS NULL` followed by re-dispatching.

### Preferred Alternative
Always INSERT the raw webhook payload into a `stripe_events` table before dispatching the processing job. The job receives the `stripe_event_id` (the local database ID), not the parsed payload. If the job fails, the raw event is in the database — queryable, replayable, and auditable. The `firstOrCreate` on `stripe_event_id` also serves as the idempotency gate.

### Refactoring Strategy
1. Create a `stripe_events` migration with `stripe_event_id` (unique), `type`, `payload` (JSON), `status`, `processed_at`.
2. Create a `StripeEvent` model.
3. Update the webhook controller to `StripeEvent::firstOrCreate(['stripe_event_id' => $event->id], [...])` before dispatching.
4. Update the processing job to accept a `stripeEventId` (local DB ID) and fetch the `StripeEvent` in `handle()`.
5. Create a `billing:replay-webhook` artisan command that re-dispatches unprocessed `StripeEvent` records.

### Detection Checklist
- [ ] No `stripe_events` table in the database
- [ ] Processing job dispatched with parsed payload, not an event ID
- [ ] Failed webhooks require manual reconstruction from Stripe's API
- [ ] No queryable record of which webhooks were received
- [ ] No artisan command for replaying failed webhooks

### Related Rules
- Always Persist Raw Webhook Payload Before Processing

---

## AP-WQD-004: No Dead-Letter Table

### Category
Operations | Reliability

### Description
Relying solely on Laravel's `failed_jobs` table for permanent webhook processing failures. The `failed_jobs` table stores serialized job payloads — not ideal for manual inspection, filtering by event type, or replay. A dedicated `dead_letters` table with readable JSON, `stripe_event_id`, `team_id`, and `error_message` provides better operational visibility.

### Why It Happens
- The `failed_jobs` table seems sufficient — it's built into Laravel
- No awareness of the dead-letter pattern
- The team hasn't experienced a permanent failure yet
- Adding a dead-letter table feels like extra work for a rare scenario

### Warning Signs
- No `dead_letters` table in the database
- The `failed()` handler on webhook jobs is missing or only logs to the log file
- Support staff can't query "which webhooks failed permanently last week?"
- Failed jobs in the `failed_jobs` table are serialized blobs that require `php artisan queue:failed` to inspect
- No admin UI for viewing and replaying failed webhooks

### Why Harmful
The `failed_jobs` table stores serialized PHP objects — not human-readable JSON. To inspect a failed webhook, you must run `php artisan queue:failed` and read the serialized payload. You can't query by `event_type`, `team_id`, or `error_message`. Support staff can't use it for customer investigations. Without a dead-letter table, permanent failures are invisible until a customer reports a billing issue.

### Real-World Consequences
- A webhook for `customer.subscription.deleted` fails permanently because the customer was already deleted from the local database. The `failed()` handler logs to the log file but doesn't write to a dead-letter table. Three weeks later, the customer's card is still being charged (Stripe thinks the subscription is active; the local DB thinks the customer is deleted). The issue is discovered when the customer files a chargeback. If the dead-letter table had existed, the nightly reconciliation job would have flagged the unprocessed deletion event.

### Preferred Alternative
Implement a `dead_letters` table with `source` ('stripe_webhook'), `source_id` (stripe_event_id), `error`, `payload` (readable JSON), `attempts`, and `created_at`. The job's `failed()` handler writes to this table. Create an admin UI or artisan command to view and replay dead-lettered webhooks.

### Refactoring Strategy
1. Create a `dead_letters` migration with the fields described above.
2. Create a `DeadLetter` model.
3. Add a `failed()` handler to the `ProcessStripeWebhook` job that writes to `dead_letters`.
4. Create a `billing:replay-webhook {stripeEventId}` artisan command.
5. Add an admin UI action for support staff to view and replay dead-lettered events.

### Detection Checklist
- [ ] No `dead_letters` table in the database
- [ ] Job's `failed()` handler is missing or only logs to a file
- [ ] No way to query permanent failures by event type or team
- [ ] No artisan command or admin UI for replaying failed webhooks
- [ ] Support staff cannot investigate webhook failures without engineering help

### Related Rules
- Set a Finite Retry Limit with maxExceptions and a failed() Handler

---

## AP-WQD-005: Infinite Retries on Webhook Jobs

### Category
Reliability | Resource Management

### Description
Configuring webhook processing jobs with `tries=0` (infinite retries) or a very high retry count. Permanent failures (invalid payload, missing customer record, Stripe API auth error) retry forever, wasting worker resources and filling the failed_jobs table.

### Why It Happens
- The developer wants to be "safe" and never give up on a webhook
- No awareness that some failures are permanent and will never succeed
- The default `tries` in some queue configurations is 0 (infinite)
- The distinction between transient and permanent failures isn't considered

### Warning Signs
- `#[Tries(0)]` on webhook processing jobs
- Jobs in the failed_jobs table with 50+ attempts
- Worker CPU usage dominated by retrying doomed jobs
- The failed_jobs table grows continuously without cleanup
- No `maxExceptions` set on webhook jobs

### Why Harmful
A webhook referencing a customer that was deleted from Stripe will never succeed — no amount of retries will make the customer reappear. Infinite retries waste worker CPU on a job that will never complete. The worker is occupied and cannot process other webhooks. Under sustained permanent failures, the entire webhooks queue backs up with doomed retry jobs.

### Real-World Consequences
- A Stripe webhook for `invoice.payment_succeeded` references an invoice that was deleted from the local database during a cleanup job. The webhook job retries 100 times over 8 hours, each attempt failing with "Invoice not found." The worker is occupied 80% of the time by this doomed job. Other webhooks queue up behind it. 200 legitimate webhooks are delayed by 4 hours because one permanent failure is monopolizing the worker.

### Preferred Alternative
Set `#[Tries(5)]` with `#[Backoff([5, 15, 30, 60, 120])]` and `maxExceptions(5)`. After 5 attempts, the `failed()` handler fires, writes to the dead-letter table, and alerts the team. The worker is freed to process other webhooks. The permanent failure is visible for manual investigation and replay.

### Refactoring Strategy
1. Search for webhook jobs with `#[Tries(0)]` or no `#[Tries]` attribute.
2. Set `#[Tries(5)]` with exponential `#[Backoff]`.
3. Add `maxExceptions(5)` to prevent endless retry loops.
4. Implement a `failed()` handler that writes to the dead-letter table.
5. Monitor the failed_jobs table for jobs with high attempt counts.

### Detection Checklist
- [ ] Webhook jobs configured with `tries=0` or no retry limit
- [ ] Jobs in failed_jobs table with 50+ attempts
- [ ] No `maxExceptions` set on webhook jobs
- [ ] Worker CPU dominated by retrying doomed jobs
- [ ] No `failed()` handler to catch permanent failures

### Related Rules
- Set a Finite Retry Limit with maxExceptions and a failed() Handler
