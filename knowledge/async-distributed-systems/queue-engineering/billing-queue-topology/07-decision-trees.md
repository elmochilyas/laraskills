# Decision Trees for Billing Queue Topology

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Billing Queue Topology and Separation by Concern |
| Related KUs | Webhook queue design, Queue deployment safety, After-commit events and jobs |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-BQT-001 | How many queues does this application need? | P0 |
| DT-BQT-002 | Which Horizon balance strategy should each queue use? | P0 |
| DT-BQT-003 | What retry configuration should each queue have? | P1 |
| DT-BQT-004 | Should a new job type get its own queue or use an existing one? | P1 |

---

## DT-BQT-001: How Many Queues Does This Application Need?

### Decision Context
Too few queues means critical billing jobs are blocked by non-critical work. Too many queues means operational complexity (supervisor management, monitoring, worker provisioning) with no benefit. The decision calibrates the number of queues to actual contention patterns and application scale.

### Decision Criteria
- Total job volume per day at peak
- Number of distinct job types with different retry behavior or latency requirements
- Whether any job type is significantly more critical than others (billing vs. notifications)
- Whether queue contention has been observed in production

### Decision Tree

```
Is this a billing/SaaS application with Stripe webhooks?
├── NO → Single 'default' queue is likely sufficient for most apps.
│   └── Add a second queue only if contention is observed.
├── YES → Start with: webhooks + default (2 queues)
    └── Have you observed contention between billing jobs and default jobs?
        ├── NO → 2 queues (webhooks + default) is sufficient for now.
        │   └── Re-evaluate when job volume grows or contention appears.
        ├── YES → Add 'billing' queue for invoice generation, subscription sync, reconciliation (3 queues)
        └── Have you observed notification backlogs delaying other work?
            ├── NO → 3 queues is sufficient.
            └── YES → Add 'notifications' queue (4 queues: webhooks, billing, notifications, default)
                └── Do you have P0 operations that must never wait behind any other job?
                    ├── NO → 4 queues is the standard SaaS billing topology.
                    └── YES → Add 'critical' queue for P0 operations only (5 queues)
```

### Rationale
Queue topology should be driven by observed or anticipated contention, not by aesthetics. A 2-queue setup (webhooks + default) handles most early-stage SaaS billing apps. As the app grows, `billing` separates from `default` when invoice generation contends with miscellaneous jobs. `notifications` separates when email bursts delay other work. Each split is justified by a concrete operational reason, not by "it feels more organized."

### Recommended Default
**For billing SaaS: start with `webhooks` + `default`. Add `billing` and `notifications` when job volume or contention justifies.** Don't create 5 queues for 50 jobs/day. Don't keep 1 queue for 5000 jobs/day with billing webhooks.

### Risks Of Wrong Choice
- **Too many queues for low volume**: Idle workers consuming RAM. More supervisors to monitor. Operational overhead with zero benefit. Team spends time managing infrastructure instead of building features.
- **Too few queues for billing**: Notification backlogs delay webhook processing. Billing state diverges from Stripe. Revenue-impacting outage from a non-critical job backlog.

### Related Rules
- Calibrate Queue Topology to Application Scale
- Separate Webhooks Queue from Notifications Queue

---

## DT-BQT-002: Which Horizon Balance Strategy Should Each Queue Use?

### Decision Context
Horizon offers three balance strategies: `auto` (dynamically allocates workers based on queue depth), `simple` (round-robin assignment), and `false` (dedicated workers). The wrong choice for critical queues can starve them of workers during non-critical queue floods.

### Decision Criteria
- Is the queue critical (webhooks, billing) or non-critical (notifications, default)?
- Can a non-critical queue flood cause worker migration away from critical queues?
- Does the queue need guaranteed minimum worker availability?
- Is the application using a single supervisor with multiple queues, or separate supervisors?

### Decision Tree

```
Is this a critical queue (webhooks, billing)?
├── YES → Use balance=simple or balance=false
│   └── Is the queue on its own dedicated supervisor?
│       ├── YES → balance=false (workers are dedicated to this queue)
│       └── NO → balance=simple (round-robin ensures this queue gets a turn)
├── NO → Is the queue on a shared supervisor with other queues?
    ├── YES → balance=auto (efficiently shares workers based on demand)
    └── NO → balance=auto or balance=simple (both work for non-critical queues)
```

### Rationale
`balance=auto` dynamically moves workers to the busiest queue. During a notification flood (10,000 pending emails), `auto` may move all workers to the `notifications` queue, starving the `webhooks` queue. `balance=simple` ensures every queue gets a turn in round-robin order — the webhooks queue always gets at least one worker per scheduling cycle. `balance=false` dedicates workers to a single queue, providing the strongest isolation.

### Recommended Default
**Critical queues (webhooks, billing): `balance=simple` on dedicated supervisors. Non-critical queues (notifications, default): `balance=auto`.** This ensures critical queues always have workers while non-critical queues efficiently share resources.

### Risks Of Wrong Choice
- **`balance=auto` for webhooks**: During a notification flood, workers migrate away from webhooks. Webhook processing stops. Subscription state diverges. Revenue-impacting.
- **`balance=false` for all queues**: No dynamic allocation. Non-critical queues may have idle workers while other queues back up. Inefficient resource use.

### Related Rules
- Use balance=simple or balance=false for Critical Queues

---

## DT-BQT-003: What Retry Configuration Should Each Queue Have?

### Decision Context
Different job types have fundamentally different failure modes. A Stripe webhook failure is often transient (network blip, rate limit) and benefits from more retries. A notification failure is rarely transient (invalid email address is permanent) — more retries waste resources. Using the same retry config across all queues under-protects critical jobs and over-protects non-critical ones.

### Decision Criteria
- Are failures likely to be transient (network, rate limit) or permanent (invalid data)?
- How long does the job take to process (affects timeout)?
- What's the maximum acceptable delay for this job type?
- Is the job idempotent (affects whether retries are safe)?

### Decision Tree

```
Is this a webhook queue (Stripe events)?
├── YES → tries=5, timeout=300, retry_after=300, backoff=[5, 15, 30, 60, 120]
├── NO → Is this a billing queue (invoice generation, subscription sync)?
    ├── YES → tries=5, timeout=600, retry_after=600, backoff=[10, 30, 60, 120, 300]
    ├── NO → Is this a notifications queue (emails, Slack, push)?
        ├── YES → tries=3, timeout=60, retry_after=120, backoff=[1, 5, 15]
        └── NO → Default queue: tries=3, timeout=120, retry_after=180, backoff=[1, 5, 15]
```

### Rationale
Webhook failures are often transient (Stripe API rate limit, brief network timeout) — 5 retries with exponential backoff gives them multiple chances. Billing failures may involve Stripe API calls that take 30+ seconds — longer timeout. Notification failures are usually permanent (invalid email, bounced recipient) — 3 retries is sufficient. Default jobs vary — moderate config is a safe middle ground.

### Recommended Default
**Webhooks: 5 tries, 300s timeout. Billing: 5 tries, 600s timeout. Notifications: 3 tries, 60s timeout. Default: 3 tries, 120s timeout.** Never use `tries=0` (infinite) for any billing-related queue.

### Risks Of Wrong Choice
- **Same config everywhere**: Webhooks under-retry (transient failures become permanent). Notifications over-retry (invalid emails retried 5 times). Billing jobs timeout before completing large operations.
- **tries=0 (infinite) on any queue**: Permanent failures retry forever. Workers permanently occupied. Failed jobs table fills.

### Related Rules
- Per-Queue Retry Configuration Must Match Job Type Characteristics

---

## DT-BQT-004: Should a New Job Type Get Its Own Queue or Use an Existing One?

### Decision Context
When adding a new job type to the application, the developer must decide: create a new queue or route the job to an existing queue. Creating too many queues adds operational complexity; routing a critical job to a non-critical queue causes contention.

### Decision Criteria
- Does the new job have different retry behavior than existing queues?
- Does the new job have different latency requirements?
- Is the new job more or less critical than the jobs on existing queues?
- Will the new job's volume cause contention on the existing queue?

### Decision Tree

```
Does the new job have different retry behavior than existing queues?
├── YES → Does it have different latency requirements too?
    ├── YES → Consider a new queue if volume justifies it
    └── NO → Route to the closest-matching existing queue
├── NO → Is the new job's criticality different from the existing queue's jobs?
    ├── YES → Route to the queue matching its criticality level
    └── NO → Route to the closest existing queue
└── Volume check: will the new job's volume cause contention on the target queue?
    ├── YES → Consider splitting the queue
    └── NO → Route to the existing queue
```

### Rationale
Queues should be split by concern (criticality, retry behavior, latency), not by domain. A "generate user report" job and a "generate order report" job both belong on the `default` queue — they share the same retry behavior and criticality. Splitting them into `user-reports` and `order-reports` queues adds supervisors without operational benefit.

### Recommended Default
**Route new jobs to the closest-matching existing queue. Create a new queue only when the new job has materially different retry behavior, latency requirements, or criticality that no existing queue satisfies.**

### Risks Of Wrong Choice
- **New queue when existing suffices**: More supervisors, more monitoring, more complexity. Idle workers on the new queue.
- **Routing critical job to non-critical queue**: The critical job is blocked by non-critical work. Billing impact.

### Related Rules
- Calibrate Queue Topology to Application Scale
