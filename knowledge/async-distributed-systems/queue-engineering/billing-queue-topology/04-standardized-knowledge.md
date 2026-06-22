# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Billing queue topology and separation by concern |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Queues, Horizon, Queue worker configuration |
| Related KUs | Webhook queue design, Queue deployment safety, After-commit events and jobs |
| Source | domain-analysis.md |

# Overview

Separate queues when jobs have different retry behavior, latency requirements, or operational priority. A well-designed SaaS billing topology isolates webhook processing, billing operations, and notifications into dedicated queues — each with independent worker pools, retry policies, and failure handling. This prevents a backlog of low-priority work from blocking critical billing operations. Calibrate: small SaaS applications can start with a single queue and split only when separation of concern becomes operationally necessary.

# Core Concepts

- **Queue separation principle**: Split queues when jobs differ in: retry behavior (billing jobs retry 5x, notification jobs retry 3x), latency requirements (webhooks need sub-second pickup, reports can wait minutes), or operational priority (billing failures wake up on-call, notification failures do not).
- **SaaS billing topology**: `webhooks` (Stripe events, high priority), `billing` (invoice generation, subscription sync, reconciliation), `notifications` (emails, Slack, in-app), `default` (everything else), `critical` (only for truly p0 operations).
- **Horizon supervisor configuration**: Each queue gets its own supervisor with independent `maxProcesses`, `balance`, `tries`, `timeout`, and `retry_after`.
- **Queue balancing**: `balance=auto` distributes workers across queues proportionally. `balance=simple` assigns workers round-robin. `balance=false` dedicates workers to a specific queue.
- **Tagging**: Use Horizon tags to filter and monitor billing vs webhook jobs in the dashboard.

# When To Use

- When you have jobs with different retry behavior (webhooks retry 5x, notifications retry 3x)
- When you have jobs with different latency requirements (webhooks must process in <5s, reports can take 5 minutes)
- When you have jobs with different operational priority (billing failure alerts on-call, notification failure is non-critical)
- When a backlog in one job type must not block another (email blast must not delay webhook processing)
- When you need independent worker scaling per job type

# When NOT To Use

- For small applications with <100 jobs/day (a single `default` queue suffices)
- When all jobs share the same retry behavior, latency requirements, and priority
- When you don't use Horizon (basic queue workers can only listen on a single or named set of queues)
- When creating queues just for organizational aesthetics without operational justification

# Best Practices (WHY)

- **Separate webhooks from notifications**: Reason: A notification backlog (thousands of welcome emails during a marketing campaign) must never delay webhook processing. Webhooks directly affect billing state; notifications do not.
- **Give webhooks their own workers**: Reason: 1-2 dedicated workers for webhooks ensure they are always picked up immediately. They don't compete with 10 workers processing report generation.
- **Use `balance=auto` for non-critical queues**: Reason: Horizon dynamically allocates workers based on queue depth. Critical queues get more workers when they're busy; idle queues release workers.
- **Use `balance=simple` or `balance=false` for critical queues**: Reason: Webhooks should always have at least 1 worker available, even if the queue is empty. Don't let auto-balancing move all workers elsewhere.
- **Calibrate to your scale**: Reason: Don't create 5 queues for 10 jobs/day. Start with one queue and split when you observe contention. Premature queue topology adds operational complexity with no benefit.

# Architecture Guidelines

- **Queue naming convention**: Use lowercase, descriptive names: `webhooks`, `billing`, `notifications`, `default`, `critical`. Avoid vague names like `queue1`, `priority`.
- **Supervisor naming convention**: `{queue}-supervisor`: `webhooks-supervisor`, `billing-supervisor`, `notifications-supervisor`.
- **Worker count guidelines**: `webhooks`: 1-2 workers. `billing`: 1-3 workers. `notifications`: 2-5 workers. `default`: 3-10 workers. These scale with application size.
- **Queue-to-supervisor mapping**: Each queue has exactly one supervisor. One supervisor may manage multiple queues using `balance=auto`.
- **Environment-based configuration**: Dev/staging use reduced workers (all queues share 1-2 workers). Production uses full topology.

# Performance Considerations

- Each Horizon worker consumes ~20-50MB RAM. A 5-queue topology with 10 total workers uses ~200-500MB RAM for workers alone. Size your server accordingly.
- Idle workers consume CPU for polling. Use `sleep=3` or higher on low-traffic queues to reduce polling overhead.
- Queue depth monitoring: track `queue_size` per queue. A growing webhooks queue means workers can't keep up — add workers or optimize processing.
- Redis memory: each queued job consumes Redis memory. A backlog of 10,000 notification jobs is cheap (~10MB); a backlog of 10,000 billing jobs with large payloads may consume significantly more.

# Security Considerations

- Queue names are visible in Horizon dashboard. Don't embed sensitive information in queue names.
- Horizon dashboard should be behind authentication in production. Use `Horizon::auth()` callback.
- Redis connection for queues should use a dedicated Redis instance or at minimum a separate database number. Don't share queue Redis with session or cache Redis in production at scale.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Putting webhooks on the default queue | Simple single-queue setup | Email blast of 10,000 notifications blocks webhook processing; billing state diverges | Dedicated webhooks queue with 1-2 workers |
| Creating too many queues for low volume | Over-engineering | Operational complexity with zero benefit; workers idle on empty queues wasting resources | Start with single queue; split only when contention is observed |
| Same retry config across all queues | Convenience of default Horizo​​n config | Webhook jobs retry 3x (not enough for transient Stripe errors); notification jobs retry 10x (unnecessary) | Per-queue retry configuration based on job type characteristics |
| No monitoring per queue | Horizon dashboard shows aggregate stats | Cannot detect that the webhooks queue is growing while the overall system looks fine | Monitor queue depth per queue; alert on webhooks queue depth > 10 |
| Using `balance=auto` for webhooks queue | Default Horizon configuration | During notification backlog, workers migrate away from webhooks, delaying billing processing | `balance=false` or `balance=simple` for critical queues like webhooks |
| Notifications on the same queue as billing | Convenience | Billing reconciliation job queued behind 5,000 emails takes 30 minutes to even start | `notifications` queue is always separate from `billing` and `webhooks` |

# Anti-Patterns

- **Everything on default**: All jobs on one queue. A single type of job backlog blocks everything else. This is the most common queue topology anti-pattern.
- **Notifications on webhooks queue**: Sending "Welcome to our platform" email via a job on the webhooks queue. The webhooks queue is for Stripe events only.
- **Billing on notifications queue**: Subscription sync jobs competing with email sending. Subscription sync should be on its own `billing` queue or at minimum not on `notifications`.
- **One supervisor for all queues with `balance=auto`**: During a notification flood, Horizon moves all workers to notifications, starving webhooks. Critical queues need dedicated supervisors.
- **Queue per micro-domain**: Creating `user-emails`, `order-emails`, `billing-emails` as separate queues. Group by concern (notifications), not by domain (users vs orders). One `notifications` queue is sufficient. Split only when one notification type blocks another.

# Examples

**Horizon configuration for SaaS billing topology**
```php
// config/horizon.php
return [
    'environments' => [
        'production' => [
            // Webhooks: critical, always 2 workers available
            'webhooks-supervisor' => [
                'connection' => 'redis',
                'queue' => ['webhooks'],
                'balance' => 'simple',
                'maxProcesses' => 2,
                'minProcesses' => 1,
                'tries' => 5,
                'timeout' => 300,
                'retry_after' => 300,
                'sleep' => 1,
            ],

            // Billing: moderate priority, 3 workers
            'billing-supervisor' => [
                'connection' => 'redis',
                'queue' => ['billing'],
                'balance' => 'auto',
                'maxProcesses' => 3,
                'minProcesses' => 1,
                'tries' => 5,
                'timeout' => 600,
                'retry_after' => 600,
                'sleep' => 3,
            ],

            // Notifications: can be delayed, 5 workers for bursts
            'notifications-supervisor' => [
                'connection' => 'redis',
                'queue' => ['notifications'],
                'balance' => 'auto',
                'maxProcesses' => 5,
                'minProcesses' => 2,
                'tries' => 3,
                'timeout' => 60,
                'retry_after' => 120,
                'sleep' => 3,
            ],

            // Default: everything else, 10 workers
            'default-supervisor' => [
                'connection' => 'redis',
                'queue' => ['default'],
                'balance' => 'auto',
                'maxProcesses' => 10,
                'minProcesses' => 3,
                'tries' => 3,
                'timeout' => 120,
                'retry_after' => 180,
                'sleep' => 3,
            ],
        ],

        // Dev/staging: reduced resources
        'local' => [
            'default-supervisor' => [
                'connection' => 'redis',
                'queue' => ['webhooks', 'billing', 'notifications', 'default'],
                'balance' => 'auto',
                'maxProcesses' => 3,
                'tries' => 3,
                'timeout' => 120,
            ],
        ],
    ],
];
```

**Dispatching to specific queues**
```php
// Webhook processing → webhooks queue
ProcessStripeWebhook::dispatch($stripeEventId)->onQueue('webhooks');

// Invoice generation → billing queue
GenerateInvoice::dispatch($subscriptionId)->onQueue('billing');

// Send notification → notifications queue
SendWelcomeEmail::dispatch($user)->onQueue('notifications');

// Everything else → default queue
GenerateReport::dispatch($reportId);
```

**Job queue declaration in job class**
```php
use Illuminate\Queue\Attributes\Queue;

#[Queue('webhooks')]
#[Tries(5)]
class ProcessStripeWebhook implements ShouldQueue
{
    // ...
}

#[Queue('billing')]
#[Tries(5)]
class SyncSubscription implements ShouldQueue
{
    // ...
}

#[Queue('notifications')]
#[Tries(3)]
class SendOrderConfirmation implements ShouldQueue
{
    // ...
}
```

# Related Topics

- Webhook queue design (dedicated webhook queue with idempotency and retry)
- Queue deployment safety (worker lifecycle during deploys)
- After-commit events and jobs (deferring dispatch until transaction commits)
- Horizon supervisor configuration
- Queue monitoring and alerting
- Job batching and chaining across queues

# AI Agent Notes

- When generating a Horizon configuration for a billing system, always include at minimum: `webhooks`, `billing`, `notifications`, and `default` queues with appropriate worker counts.
- Calibrate queue topology to application scale. For a new SaaS app, recommend starting with `webhooks` + `default`. Add `billing` and `notifications` when job volume justifies it.
- When a user asks about queue configuration, first ask about job types, volumes, and retry behavior before recommending a topology.
- Always set `tries=5` for webhooks and billing jobs, `tries=3` for notifications. Never recommend `tries=0` (infinite) for any billing-related queue.
- When generating job classes, always include the `#[Queue]` attribute to declare which queue the job belongs to. Do not rely solely on runtime `->onQueue()`.

# Verification

- [ ] `webhooks` queue exists with dedicated 1-2 workers
- [ ] `billing` queue exists for invoice generation, subscription sync, reconciliation
- [ ] `notifications` queue exists, separate from webhooks and billing
- [ ] `default` queue exists for miscellaneous jobs
- [ ] Webhook jobs never dispatched to `notifications` or `billing` queues
- [ ] Notification jobs never dispatched to `webhooks` queue
- [ ] Per-queue retry configuration matches job type characteristics (webhooks: 5, notifications: 3)
- [ ] Horizon supervisor `balance` is `simple` or `false` for critical queues
- [ ] Dev/staging uses reduced worker configuration
- [ ] Queue depth monitoring configured per queue (not just aggregate)
- [ ] `#[Queue]` attribute present on all job classes declaring their queue
