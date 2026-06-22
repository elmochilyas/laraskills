# Rules — Billing Queue Topology and Separation by Concern

## Rule 1: Separate Webhooks Queue from Notifications Queue
| Field | Value |
|-------|-------|
| **Name** | Separate Webhooks Queue from Notifications Queue |
| **Category** | Queue Topology |
| **Rule** | Webhook processing jobs and notification jobs must never share the same queue. A notification backlog (thousands of welcome emails during a marketing campaign) must not delay webhook processing, which directly affects billing state. |
| **Reason** | Webhooks are the critical integration point between Stripe and your application's billing state. A delay in webhook processing means subscription statuses, payment confirmations, and cancellation events are not reflected in your database. Notifications (emails, Slack messages, push notifications) are operationally less critical — a delayed welcome email is an annoyance; a delayed `invoice.payment_failed` webhook is a revenue incident. |
| **Bad Example** | ```php
// All jobs on 'default' queue
ProcessStripeWebhook::dispatch($eventId);
SendWelcomeEmail::dispatch($user);
GenerateReport::dispatch($reportId);
``` |
| **Good Example** | ```php
#[Queue('webhooks')]
class ProcessStripeWebhook implements ShouldQueue { ... }

#[Queue('notifications')]
class SendWelcomeEmail implements ShouldQueue { ... }

#[Queue('default')]
class GenerateReport implements ShouldQueue { ... }
``` |
| **Exceptions** | Applications with fewer than 100 jobs/day total. At this volume, queue contention is theoretical rather than practical. Calibrate queue topology to application scale. |
| **Consequences Of Violation** | A marketing campaign of 10,000 welcome emails blocks Stripe webhook processing for minutes or hours. Subscription state diverges from Stripe. Customers on paid plans lose access. Revenue-impacting outage from a non-critical notification backlog. |

## Rule 2: Declare Queue in Job Class via Attribute, Not Only at Dispatch Time
| Field | Value |
|-------|-------|
| **Name** | Declare Queue in Job Class via Attribute, Not Only at Dispatch Time |
| **Category** | Code Organization |
| **Rule** | Always declare the queue on the job class using the `#[Queue('webhooks')]` attribute. Do not rely solely on runtime `->onQueue('webhooks')` calls. The attribute makes the job's queue assignment discoverable at the class level and prevents misrouting when dispatched from multiple locations. |
| **Reason** | When a job is dispatched from multiple places (controller, another job, artisan command), it's easy to forget the `->onQueue()` call in one location. The `#[Queue]` attribute ensures the job always routes to the correct queue regardless of where it's dispatched from. It also serves as documentation — someone reading the job class immediately knows which queue it uses. |
| **Bad Example** | ```php
// In controller:
ProcessStripeWebhook::dispatch($eventId)->onQueue('webhooks');
// In another job:
ProcessStripeWebhook::dispatch($eventId); // forgot onQueue() — goes to 'default'
``` |
| **Good Example** | ```php
#[Queue('webhooks')]
#[Tries(5)]
class ProcessStripeWebhook implements ShouldQueue { ... }
// dispatch() anywhere automatically routes to 'webhooks'
``` |
| **Exceptions** | When the same job class legitimately needs to run on different queues in different contexts (rare — usually a sign the job should be split into two classes). Also, when using legacy code that doesn't support PHP 8 attributes. |
| **Consequences Of Violation** | Jobs silently routed to the wrong queue. Webhook processing jobs end up on the `default` queue behind report generation and email sending. Queue-based monitoring shows incorrect metrics. Hard to debug because the error is invisible — jobs still process, just with wrong priority. |

## Rule 3: Use balance=simple or balance=false for Critical Queues, Not balance=auto
| Field | Value |
|-------|-------|
| **Name** | Use balance=simple or balance=false for Critical Queues, Not balance=auto |
| **Category** | Horizon Configuration |
| **Rule** | For critical queues (webhooks, billing), use `balance=simple` or `balance=false` to ensure a minimum number of dedicated workers are always available. Never use `balance=auto` for the webhooks queue — during a notification flood, auto-balancing may redirect all workers to the overloaded notification queue, starving webhooks. |
| **Reason** | `balance=auto` dynamically allocates workers based on queue depth. When the notifications queue has 5,000 pending jobs and the webhooks queue has 2, Horizon may decide to move all workers to notifications. The 2 pending webhooks are now delayed, potentially for minutes. `balance=simple` ensures webhooks always get at least one worker per scheduling round regardless of other queue depths. |
| **Bad Example** | Horizon supervisor for webhooks with `balance=auto` — during a notification storm, webhook processing stops because all workers migrated to notifications. |
| **Good Example** | Horizon supervisor for webhooks with `balance=simple` and `maxProcesses=2, minProcesses=1` — webhooks always have at least one dedicated worker. |
| **Exceptions** | Low-traffic applications where all queues combined have fewer than 10 pending jobs at any time. Auto-balancing works well when no queue is critically important. Dev/staging environments where worker efficiency matters more than priority guarantees. |
| **Consequences Of Violation** | During high-traffic periods, critical billing webhooks are starved of workers. Stripe webhook redelivery storms compound the problem. Subscription state divergence during peak usage hours — the worst time for billing issues. |

## Rule 4: Calibrate Queue Topology to Application Scale — Don't Prematurely Split
| Field | Value |
|-------|-------|
| **Name** | Calibrate Queue Topology to Application Scale — Don't Prematurely Split |
| **Category** | Complexity Management |
| **Rule** | Start with a minimal queue topology (webhooks + default) and split into webhooks/billing/notifications/default only when contention is observed. Do not create 5 queues for 10 jobs/day. Premature queue topology adds operational complexity (supervisor configuration, monitoring, worker provisioning) with no benefit. |
| **Reason** | Each queue requires its own Horizon supervisor, monitoring dashboards, alert thresholds, and worker processes. A 4-queue topology with 10 workers uses ~200-500MB RAM for idle workers alone. For a small SaaS with 50 jobs/day, a single queue with 2 workers is operationally simpler and functionally equivalent. Split when you observe: (1) notifications backlog delaying webhooks, (2) billing jobs contending with default jobs, or (3) different retry behavior becoming necessary. |
| **Bad Example** | A brand-new SaaS with 20 users deploys `webhooks-supervisor`, `billing-supervisor`, `notifications-supervisor`, `default-supervisor`, and `critical-supervisor` — 5 supervisors, 15 workers, for 30 jobs/day. |
| **Good Example** | Start with `webhooks-supervisor` (1-2 workers) + `default-supervisor` (for everything else). Monitor queue depths. Add `billing-supervisor` and `notifications-supervisor` when job volume warrants it. |
| **Exceptions** | Applications that are pre-revenue but have known high volume from a previous platform migration. Also, when compliance or security isolation requires separate queues regardless of volume (e.g., PCI-scoped billing jobs). |
| **Consequences Of Violation** | Operational overhead without benefit. Idle workers consuming server resources. More configuration to maintain, more dashboards to monitor, more things that can break during deployments. Team spends time managing queue infrastructure instead of building product features. |

## Rule 5: Per-Queue Retry Configuration Must Match Job Type Characteristics
| Field | Value |
|-------|-------|
| **Name** | Per-Queue Retry Configuration Must Match Job Type Characteristics |
| **Category** | Resilience |
| **Rule** | Configure `tries`, `timeout`, `retry_after`, and `sleep` per queue based on the characteristics of the job types that use that queue. Webhook jobs need `tries=5` with long `timeout=300` for transient Stripe API delays. Notification jobs usually need `tries=3` with short `timeout=60`. Never use the same retry configuration across all queues. |
| **Reason** | Different job types have fundamentally different failure modes. A Stripe webhook failure is often transient (network blip, rate limit) and benefits from more retries. A notification failure is rarely transient (invalid email address is permanent) — more retries waste resources. Webhook processing involves Stripe API calls that may take 30+ seconds; email sending takes under 5 seconds. Matching retry config to job characteristics optimizes both reliability and resource usage. |
| **Bad Example** | All Horizon supervisors configured with `tries=3, timeout=60` — webhook jobs fail prematurely when Stripe API is slow, notification jobs retry unnecessarily for invalid emails. |
| **Good Example** | Webhooks supervisor: `tries=5, timeout=300`. Billing supervisor: `tries=5, timeout=600`. Notifications supervisor: `tries=3, timeout=60`. Default supervisor: `tries=3, timeout=120`. |
| **Exceptions** | Dev/staging environments where reduced resource usage is prioritized over proper retry behavior. All queues can share conservative retry config (`tries=3, timeout=120`) in non-production. |
| **Consequences Of Violation** | Webhook jobs fail without sufficient retry attempts — transient Stripe API issues become permanent processing failures. Notification jobs waste worker time retrying invalid email addresses. Billing reconciliation jobs timeout before completing large operations. |
