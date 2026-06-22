# Anti-Patterns for Billing Queue Topology

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Billing Queue Topology and Separation by Concern |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-BQT-001 | Everything on Default | Critical | High |
| AP-BQT-002 | Notifications on Webhooks Queue | High | Medium |
| AP-BQT-003 | Premature Queue Proliferation | Medium | Medium |
| AP-BQT-004 | balance=auto for Critical Queues | High | Medium |
| AP-BQT-005 | Queue Per Micro-Domain | Medium | Low |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-WQD-002 (Single Queue for Everything) — from Webhook Queue Design
- AP-QDS-001 (Kill -9 on Queue Workers) — from Queue Deployment Safety

---

## AP-BQT-001: Everything on Default

### Category
Queue Topology | Billing

### Description
All jobs — Stripe webhook processing, email notifications, report generation, image processing — are dispatched to the single `default` queue with no separation. A backlog of any one job type blocks all others. This is the most common queue topology anti-pattern in billing systems.

### Why It Happens
- Default Laravel configuration uses a single `default` queue
- The developer hasn't configured Horizon with multiple supervisors
- Adding queues feels like premature optimization early in the project
- The impact of contention isn't visible until production traffic spikes

### Warning Signs
- All jobs dispatched without `->onQueue()` or `#[Queue]` attribute
- Only a `default` queue in `config/horizon.php`
- Webhook processing delays during notification bursts or report generation
- Stripe dashboard shows webhook delivery delays during marketing campaigns
- No per-queue monitoring — all metrics are aggregate

### Why Harmful
Webhooks are the critical integration point between Stripe and billing state. When they share a queue with 10,000 notification emails, they sit behind those emails for minutes or hours. A delayed `invoice.payment_failed` webhook means the customer doesn't receive a payment failure notification until it's too late. A delayed `customer.subscription.deleted` webhook means a cancelled customer retains access to premium features. Revenue-impacting outage from a non-critical backlog.

### Real-World Consequences
- A SaaS platform runs a Black Friday email campaign: 50,000 promotional emails dispatched to the `default` queue. During the 2 hours it takes to process the emails, 200 Stripe webhooks sit in the queue behind them. 30 customers' `invoice.payment_succeeded` webhooks are delayed by 90+ minutes. Those customers see "Your subscription is pending" instead of "Your subscription is active." Support receives 30 tickets in 2 hours.

### Preferred Alternative
Separate queues by concern: `webhooks` (1-2 workers, `balance=simple`), `billing` (1-3 workers), `notifications` (2-5 workers, `balance=auto`), `default` (3-10 workers). Each queue has its own Horizon supervisor with appropriate retry configuration. Webhooks are never blocked by notification or report backlogs.

### Refactoring Strategy
1. Inventory all `ShouldQueue` job classes and categorize by concern.
2. Add `#[Queue]` attributes to each job class.
3. Configure Horizon supervisors for each queue.
4. Deploy the new topology and monitor per-queue depth for contention.
5. Document the queue topology and which jobs belong on which queue.

### Detection Checklist
- [ ] All jobs dispatched to the `default` queue
- [ ] No `#[Queue]` attribute on job classes
- [ ] Only one supervisor in `config/horizon.php`
- [ ] Webhook processing delays during notification or report bursts
- [ ] No per-queue monitoring or alerting

### Related Rules
- Separate Webhooks Queue from Notifications Queue

---

## AP-BQT-002: Notifications on Webhooks Queue

### Category
Queue Topology | Billing

### Description
Sending notification jobs (welcome emails, order confirmations, Slack messages) to the `webhooks` queue instead of a dedicated `notifications` queue. The webhooks queue is for Stripe events only — notification jobs compete with critical webhook processing for worker time.

### Why It Happens
- The developer dispatches a notification job with `->onQueue('webhooks')` by mistake
- No `#[Queue]` attribute on the notification job class, and the dispatch site specifies `webhooks`
- Copy-paste from webhook processing code without changing the queue
- The team hasn't created a `notifications` queue yet

### Warning Signs
- Notification job classes with `#[Queue('webhooks')]` attribute
- `SendWelcomeEmail::dispatch($user)->onQueue('webhooks')` in controller code
- Horizon dashboard shows notification jobs on the webhooks queue
- Webhook processing latency increases when notifications are dispatched

### Why Harmful
The webhooks queue is sized for 1-2 workers to serialize webhook processing per entity. Adding notification jobs to this queue means the 1-2 workers are processing emails instead of webhooks. A burst of 100 welcome emails delays webhook processing by minutes. The serialization benefit of a small worker pool is lost.

### Real-World Consequences
- A developer dispatches `SendWelcomeEmail` to the `webhooks` queue because it was copy-pasted from webhook processing code. During a registration spike (500 new users), 500 welcome emails flood the webhooks queue. The 2 webhook workers spend 10 minutes processing emails. During those 10 minutes, 15 Stripe webhooks are delayed. A customer's payment failure webhook is delayed by 8 minutes — they don't update their card in time, and their subscription is cancelled.

### Preferred Alternative
Every notification job must have `#[Queue('notifications')]`. The `notifications` queue has 2-5 workers with `balance=auto` and `tries=3`. Notification jobs never touch the `webhooks` queue. Verify queue assignments in code review and via Horizon dashboard monitoring.

### Refactoring Strategy
1. Search for notification job classes with `#[Queue('webhooks')]` or dispatches with `->onQueue('webhooks')`.
2. Change the queue to `notifications` on all notification jobs.
3. Verify no notification jobs remain on the webhooks queue via Horizon dashboard.
4. Add a code review checklist item: "Notification jobs must use the notifications queue."

### Detection Checklist
- [ ] Notification job classes with `#[Queue('webhooks')]` attribute
- [ ] `->onQueue('webhooks')` on notification job dispatches
- [ ] Horizon dashboard shows notification jobs on the webhooks queue
- [ ] Webhook processing latency correlates with notification dispatch volume
- [ ] No `notifications` queue configured in Horizon

### Related Rules
- Separate Webhooks Queue from Notifications Queue

---

## AP-BQT-003: Premature Queue Proliferation

### Category
Complexity Management | Queue Topology

### Description
Creating 5+ queues (webhooks, billing, notifications, default, critical, reports, imports, exports, emails...) for an application with low job volume. Each queue requires its own supervisor, monitoring, and worker provisioning. The operational overhead exceeds the benefit of isolation.

### Why It Happens
- The team wants to be "thorough" and plan for future scale
- Each developer creates a queue for their feature area
- Over-engineering: more queues feels more "professional"
- No calibration to actual job volume or contention patterns

### Warning Signs
- 5+ queues in `config/horizon.php` for an application with <500 jobs/day
- Queues with 0 jobs most of the time (visible in Horizon dashboard)
- Workers idle on empty queues, consuming RAM
- The team spends more time managing queue infrastructure than the queues save in contention
- No observed contention that justified the queue creation

### Why Harmful
Each queue with 2 workers consumes ~40-100MB RAM and requires monitoring, alerting, and supervisor management. For a small SaaS with 50 jobs/day, a 2-queue setup (webhooks + default) is functionally equivalent to a 6-queue setup — but the 6-queue version costs 3x the RAM and 3x the monitoring overhead. The team manages infrastructure instead of building features.

### Real-World Consequences
- A startup with 20 users creates 6 queues (webhooks, billing, notifications, default, critical, reports). Each queue has 2 workers (12 total). The server has 4GB RAM. Workers consume 600MB (50MB x 12). The application itself needs 2GB. The server is memory-constrained and the team upgrades to an 8GB server — doubling their infrastructure cost for queues that process 30 jobs/day. A 2-queue setup with 4 total workers would have been sufficient.

### Preferred Alternative
Start with `webhooks` + `default`. Monitor queue depth. Add `billing` when billing jobs contend with default jobs. Add `notifications` when notification backlogs delay other work. Each split is justified by observed contention, not by anticipated future needs.

### Refactoring Strategy
1. List all queues and their average daily job count.
2. For queues with <10 jobs/day, consider merging into `default`.
3. Keep `webhooks` as a dedicated queue regardless of volume (billing isolation).
4. Consolidate low-volume queues into the closest-matching active queue.
5. Re-evaluate the topology quarterly as volume changes.

### Detection Checklist
- [ ] 5+ queues configured for <500 jobs/day total
- [ ] Queues with 0 jobs most of the time
- [ ] Workers idle on empty queues consuming significant RAM
- [ ] No observed contention that justified queue creation
- [ ] Server RAM constrained by worker processes

### Related Rules
- Calibrate Queue Topology to Application Scale

---

## AP-BQT-004: balance=auto for Critical Queues

### Category
Horizon Configuration | Billing

### Description
Using `balance=auto` for the `webhooks` or `billing` queue in Horizon. During a notification flood, `auto` dynamically moves workers to the busiest queue, starving the critical webhooks queue. Webhook processing stops during high-traffic periods — the worst time for billing issues.

### Why It Happens
- `balance=auto` is the Horizon default
- The developer doesn't understand the difference between `auto`, `simple`, and `false`
- The critical queue shares a supervisor with non-critical queues
- No testing of queue behavior under load

### Warning Signs
- `webhooks-supervisor` configured with `balance=auto`
- Webhook processing latency spikes during notification bursts
- Horizon dashboard shows workers migrating away from the webhooks queue during floods
- Intermittent webhook processing delays that correlate with high notification volume

### Why Harmful
During a notification flood (5,000 pending emails), `balance=auto` sees the `notifications` queue has 5,000 pending jobs and the `webhooks` queue has 2. It moves workers to `notifications`. The 2 pending webhooks are delayed for minutes. If one of those webhooks is `invoice.payment_failed`, the customer's payment failure isn't processed until after their subscription is cancelled by Stripe.

### Real-World Consequences
- A SaaS platform configures all Horizon supervisors with `balance=auto` (the default). During a product launch, 10,000 notification emails are dispatched. `balance=auto` moves 8 of 10 workers to the `notifications` queue. The `webhooks` queue, with 1 remaining worker, falls behind on 50 pending Stripe webhooks. 20 customers' subscription updates are delayed by 15 minutes. 5 customers experience "subscription pending" errors during checkout because their `invoice.payment_succeeded` webhook hasn't been processed.

### Preferred Alternative
Use `balance=simple` or `balance=false` for critical queues (webhooks, billing). `balance=simple` ensures round-robin scheduling — the webhooks queue always gets at least one worker per cycle. `balance=false` dedicates workers exclusively to the queue. Non-critical queues (notifications, default) can use `balance=auto`.

### Refactoring Strategy
1. Identify all Horizon supervisors for critical queues (webhooks, billing).
2. Change `balance` from `auto` to `simple` (or `false` for dedicated supervisors).
3. Test under load: dispatch a notification flood and verify webhook processing is not delayed.
4. Document the balance strategy for each queue and the rationale.

### Detection Checklist
- [ ] `webhooks-supervisor` configured with `balance=auto`
- [ ] `billing-supervisor` configured with `balance=auto`
- [ ] Webhook processing latency spikes during notification bursts
- [ ] Workers migrate away from critical queues during non-critical floods
- [ ] No load testing of queue behavior under contention

### Related Rules
- Use balance=simple or balance=false for Critical Queues

---

## AP-BQT-005: Queue Per Micro-Domain

### Category
Queue Topology | Complexity

### Description
Creating separate queues for every micro-domain or feature area: `user-emails`, `order-emails`, `billing-emails`, `user-reports`, `order-reports`, `billing-reports`. Grouping by domain instead of by concern creates an explosion of queues with minimal operational benefit.

### Why It Happens
- Each developer creates a queue for their feature area without considering existing queues
- The team organizes queues by domain (users, orders, billing) instead of by concern (notifications, reports, webhooks)
- No guidelines for when to create a new queue
- "More specific is better" mentality

### Warning Signs
- Queue names that include domain prefixes: `user-`, `order-`, `billing-` for the same job type
- 10+ queues in Horizon, many with <5 jobs/day
- Multiple queues with the same retry config and criticality — only the domain differs
- Horizon dashboard is cluttered with near-empty queues

### Why Harmful
Queues should be grouped by concern (retry behavior, latency, criticality), not by domain. A `user-emails` queue and an `order-emails` queue have the same retry behavior, latency requirements, and criticality — they should both be on `notifications`. Splitting by domain doubles the supervisors, workers, and monitoring without any isolation benefit.

### Real-World Consequences
- A team creates `user-emails`, `order-emails`, `billing-emails`, and `admin-emails` queues. Each has 2 workers (8 total). All 4 queues have `tries=3, timeout=60` — identical config. The application sends 40 emails/day across all 4 queues. Each queue averages 10 jobs/day. 8 workers are running for 40 jobs/day — 95% idle. The team could have used 1 `notifications` queue with 2 workers.

### Preferred Alternative
Group queues by concern, not by domain. One `notifications` queue handles all email/Slack/push jobs. One `default` queue handles all reports and miscellaneous jobs. Split by concern only when one job type's retry behavior, latency, or criticality materially differs from the existing queue's jobs.

### Refactoring Strategy
1. List all queues and their job types.
2. Identify queues that share the same retry config, timeout, and criticality — candidates for merging.
3. Merge domain-specific queues into their concern-level queue (e.g., `user-emails` → `notifications`).
4. Update `#[Queue]` attributes on job classes.
5. Remove unnecessary supervisors from `config/horizon.php`.

### Detection Checklist
- [ ] Queue names include domain prefixes for the same job type
- [ ] Multiple queues with identical retry, timeout, and criticality config
- [ ] 10+ queues with many averaging <5 jobs/day
- [ ] Horizon dashboard cluttered with near-empty queues
- [ ] Workers idle on multiple near-empty queues

### Related Rules
- Calibrate Queue Topology to Application Scale
