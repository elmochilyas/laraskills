# Decision Trees for Laravel Horizon Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Horizon Decision Matrix |
| Related KUs | 01-calibrated-package-recommendation, 02-package-fit-non-fit-analysis, 04-package-escape-hatch-strategy |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-HZN-001 | Horizon or queue:work + supervisor directly? | P0 |
| DT-HZN-002 | How should supervisors be organized? | P0 |
| DT-HZN-003 | Which balance strategy should each supervisor use? | P1 |
| DT-HZN-004 | Where should job retries be configured? | P1 |

---

## DT-HZN-001: Horizon or queue:work + Supervisor Directly?

### Decision Context
Horizon provides a dashboard, auto-balancing, failed job UI, and per-queue metrics — at the cost of Redis memory overhead and an additional process to manage. `queue:work` + system supervisor is simpler but provides no visibility or auto-balancing.

### Decision Criteria
- Is Redis the queue driver? (Horizon is Redis-only)
- Does the team need a dashboard for queue health visibility?
- Are there multiple queues with different workload characteristics?
- Is there existing APM (Datadog, New Relic) covering queue monitoring?
- What is the expected job volume?

### Decision Tree

```
Is Redis the queue driver?
├── NO → USE queue:work + SUPERVISOR. Horizon supervisor config is Redis-only.
│   └── For SQS: use CloudWatch + ECS auto-scaling. For Beanstalkd: use queue:work + supervisor.
├── YES → Does the team need queue health visibility (dashboard, metrics, failed job UI)?
    ├── NO (simple single-queue app, low volume) → USE queue:work + SUPERVISOR. Simpler is better.
    ├── YES → Are there multiple queues with different workload requirements?
        ├── YES → USE HORIZON. Separate supervisors per queue type with auto-balancing.
        ├── NO → Is Datadog/New Relic already providing queue monitoring?
            ├── YES → queue:work + EXISTING APM may suffice. Horizon duplicates monitoring.
            └── NO → USE HORIZON. It's the lightest-weight way to get queue visibility.
```

### Rationale
Horizon's value is proportional to queue complexity. A single-queue app processing 100 jobs/day doesn't need auto-balancing, per-queue metrics, or a failed job UI — `queue:work` + supervisor is simpler and sufficient. A multi-queue app processing 50K jobs/day with different workload profiles (webhooks need 30s timeout, imports need 600s) desperately needs Horizon's supervisor separation and auto-balancing. The dashboard and metrics become critical operational tools, not nice-to-haves.

### Recommended Default
**Use queue:work + supervisor for single-queue, low-volume apps. Use Horizon for multi-queue apps or any app where the team needs queue visibility.**

### Risks Of Wrong Choice
- **Horizon for simple app**: Added Redis memory overhead, additional process to manage, dashboard authentication to configure — for an app that could use `queue:work` with zero additional setup.
- **queue:work for complex app**: No visibility into queue health. Workers not auto-balanced. Failed jobs managed via CLI. Incident response requires SSH access to production.

### Related Rules
- Separate Supervisors for Different Workload Types

### Related Skills
- Telescope & Pulse Relevance (KU 10)

---

## DT-HZN-002: How Should Supervisors Be Organized?

### Decision Context
Horizon supervisors manage worker pools. The organizational model — one supervisor for all queues vs. separate supervisors per workload type — determines whether fast jobs are starved by slow jobs and whether timeout/memory settings are appropriate for each workload.

### Decision Criteria
- How many distinct workload types exist? (webhooks, notifications, imports, default)
- Do workloads have different timeout requirements? (webhooks: 30s, imports: 600s)
- Do workloads have different burst patterns? (webhooks burst, notifications steady)
- What is the expected throughput per workload type?

### Decision Tree

```
How many distinct workload types exist?
├── 1 → SINGLE SUPERVISOR. No separation needed.
├── 2-3 → Do the workloads have DIFFERENT timeout requirements?
│   ├── YES → SEPARATE SUPERVISORS. Matching timeout to workload prevents slow-job starvation.
│   └── NO (all jobs have similar timeouts) → SINGLE SUPERVISOR with balance: 'auto'.
├── 4+ → SEPARATE SUPERVISORS.
    └── Group related workloads: webhooks + real-time, notifications + emails, imports + exports, default.
    └── Each supervisor gets its own: queue list, timeout, retry count, balance strategy, worker pool size.
```

### Rationale
The primary driver of supervisor separation is timeout mismatch. If webhooks need 30s timeout but import jobs need 600s, a single supervisor must use 600s timeout — meaning a stuck webhook blocks a worker for 10 minutes instead of 30 seconds. Separate supervisors allow each workload type to have: appropriate timeout, appropriate retry count (webhooks: 3 retries; imports: 1 retry), appropriate worker pool (webhooks: high concurrency; imports: low concurrency), and appropriate balance strategy.

### Recommended Default
**Separate supervisors per workload type when timeout requirements differ by >2x. Minimum 2 supervisors for any app with both real-time and batch processing queues.**

### Risks Of Wrong Choice
- **Single supervisor for mixed workloads**: Slow imports consume all workers, starving webhooks. Webhook timeout forces fast timeout for all jobs, killing legitimate long-running imports.
- **Too many supervisors**: 10 supervisors for 10 queues when 4 workload types would suffice. Operational complexity without benefit.

### Related Rules
- Separate Supervisors for Different Workload Types
- Set Retries in One Place — Job Attribute or Horizon Config, Not Both

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-HZN-003: Which Balance Strategy Should Each Supervisor Use?

### Decision Context
Horizon offers three balance strategies: `auto` (dynamically scales workers based on queue depth), `simple` (fixed worker count, distributes evenly across queues), and `false` (manual scaling only). Choosing the right strategy per supervisor optimizes resource usage and responsiveness.

### Decision Criteria
- Is the workload bursty (spikes and lulls) or steady (consistent throughput)?
- How critical is latency for this queue type? (webhooks: sub-second; notifications: minutes)
- What is the cost of idle workers? (server cost vs. burst handling capability)
- Are there downstream rate limits that constrain throughput?

### Decision Tree

```
Is the workload bursty (traffic spikes followed by lulls)?
├── YES → USE AUTO BALANCE. Auto-balancing scales workers up during spikes and down during lulls.
│   └── Best for: webhooks, order processing, event-driven workloads.
│   └── Set minProcesses to handle base load, maxProcesses to handle peak.
├── NO (steady, predictable throughput) → Is latency critical (sub-second response needed)?
    ├── YES → USE SIMPLE BALANCE with sufficient fixed workers to meet latency SLO.
    │   └── Steady workload + fixed worker pool = predictable latency.
    └── NO → USE SIMPLE BALANCE. No need for auto-scaling overhead.
        └── Best for: notifications, emails, daily report generation.
        └── Set the worker count to match throughput with ~20% headroom.
```

### Rationale
Auto-balancing adds overhead (5-10 Redis commands per poll interval) and introduces latency during scale-up (new workers take seconds to spawn). For bursty workloads where the cost of delayed processing is high (webhooks, order confirmations), the overhead and scale-up latency are justified. For steady workloads, fixed workers are more efficient and provide predictable latency without the polling overhead.

### Recommended Default
**`balance: 'auto'` for webhooks and bursty processing queues. `balance: 'simple'` for notifications, emails, and steady-throughput queues. Never use `balance: 'false'` in production unless you have external auto-scaling.**

### Risks Of Wrong Choice
- **Auto for steady workloads**: Unnecessary polling overhead. Workers scaling up and down when throughput is constant. Wasted Redis commands.
- **Simple for bursty workloads**: Workers overwhelmed during spikes. Queue depth grows. Processing latency spikes. The queue backs up while workers sit at fixed count.

### Related Rules
- Separate Supervisors for Different Workload Types

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-HZN-004: Where Should Job Retries Be Configured?

### Decision Context
Job retries can be set in the Horizon supervisor config AND on the job class via `#[Tries(N)]`. Setting both creates ambiguity about which value controls retry behavior. This decision tree determines the single source of truth per supervisor.

### Decision Criteria
- Do jobs in this queue have uniform retry requirements? (all jobs retry 3 times)
- Or do jobs have per-class retry requirements? (webhooks retry 3 times, notifications retry 2 times)
- Does the team prefer retry configuration close to the job logic or centralized in queue config?

### Decision Tree

```
Do all jobs in this supervisor's queues have uniform retry requirements?
├── YES → SET IN HORIZON CONFIG ONLY. Simpler, centralized, one place to check.
│   └── Do NOT add #[Tries] attribute to any job class.
├── NO → Do jobs have per-class retry requirements?
    ├── YES → SET ON JOB CLASS VIA #[Tries] ATTRIBUTE ONLY. Per-job configurability.
    │   └── Do NOT set 'tries' in Horizon config for this supervisor.
    └── NO → Do some jobs need different retries AND others use the default?
        ├── YES → HYBRID: set default in Horizon config, override on specific jobs via #[Tries].
        │   └── DOCUMENT which mechanism is authoritative. The attribute overrides the config.
        └── NO → SET IN HORIZON CONFIG. Uniform approach is simpler.
```

### Rationale
The ambiguity of dual configuration causes production bugs. A developer sets `#[Tries(5)]` on a job, but the Horizon config has `tries => 3`. The actual retry count depends on the Laravel version and queue configuration — sometimes the attribute wins, sometimes the config wins. This ambiguity is eliminated by choosing ONE mechanism per supervisor and documenting it. The job attribute is preferred for per-job configurability (the job author knows best how many retries are appropriate). The Horizon config is preferred for uniform workloads (all jobs in this queue get the same treatment).

### Recommended Default
**Prefer `#[Tries]` attribute on job classes for per-job configurability. Only set `tries` in Horizon config as a default fallback for jobs without the attribute. Document which mechanism is authoritative for each supervisor.**

### Risks Of Wrong Choice
- **Both set**: Unpredictable retry counts. A job retries 5 times instead of 3, delaying failure detection. A job retries 1 time instead of 3, causing premature failure.
- **Neither set**: Laravel's default retry (1) applies. Jobs fail on first transient error instead of retrying.

### Related Rules
- Set Retries in One Place — Job Attribute or Horizon Config, Not Both

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)
