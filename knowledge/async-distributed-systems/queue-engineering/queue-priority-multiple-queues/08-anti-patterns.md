# Anti-Patterns: Queue Priority via Multiple Queues

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K077 — Queue Priority via Multiple Queues |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | SQS with Comma-Separated --queue | Operational | Critical |
| 2 | Single Shared Supervisor for All Priority Tiers | Architecture | High |
| 3 | Too Many Priority Tiers | Design | Medium |
| 4 | Assuming Preemptive Priority | Design | High |
| 5 | Monitoring Aggregate Queue Depth Instead of Per-Queue | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| CPU-Intensive and Latency-Sensitive Jobs on Shared Pool | queue-priority-multiple-queues, queue-worker-management | High |
| No Priority Tiers at All | queue-priority-multiple-queues, queue-connections-vs-queues | Medium |
| Priority Names Based on Job Classes Not Workload | queue-priority-multiple-queues, queue-connections-vs-queues | High |

---

## Anti-Pattern 1: SQS with Comma-Separated --queue

### Category
Operational — Silent Misconfiguration

### Description
Using the comma-separated `--queue=critical,default,bulk` syntax with SQS workers. SQS queues are separate URLs — only the first URL in the comma-separated list is used. Remaining queue names are silently ignored.

### Why It Happens
The Redis pattern of comma-separated queue subscription works correctly — developers apply the same pattern to SQS without realizing the driver-specific behavior. The worker starts successfully but only processes the first queue.

### Warning Signs
- SQS worker command uses `--queue=high,default,low`
- Only jobs in the first queue name are processed
- Monitoring shows zero throughput on second and third queues
- Worker starts without errors but throughput is far below expectations
- Jobs dispatched to non-first queues accumulate indefinitely

### Why Harmful
Jobs dispatched to lower-priority queues are never processed. There is no error — the worker simply never polls those URLs. Email notifications, report generation, and other async processing silently stops.

### Real-World Consequences
An SQS-based system configures workers with `--queue=critical,default,bulk`. The `default` queue (order confirmations, password resets) is never polled. After 48 hours, 10,000 unprocessed emails accumulate. Customers have not received order confirmations, password reset requests time out, and the team has no alert because the worker appears healthy.

### Preferred Alternative
For SQS, create separate queue URLs for each priority tier with dedicated worker processes. Do not use comma-separated queue names.

### Refactoring Strategy
1. Create separate SQS queue URLs per priority tier
2. Configure independent worker daemons per SQS URL
3. Update dispatch calls to reference correct SQS URLs per tier
4. Remove comma-separated `--queue` from SQS worker commands
5. Implement per-queue monitoring and alerting

### Detection Checklist
- [ ] SQS worker uses `--queue` with comma-separated values
- [ ] Non-first queues show zero job processing
- [ ] Worker starts successfully but throughput is low
- [ ] Jobs accumulate in lower-priority SQS queues

### Related Rules/Skills/Decision Trees
- **Rule 2**: no-comma-queue-for-sqs (`05-rules.md`)
- **Decision 3**: SQS Priority Handling vs Redis (`07-decision-trees.md`)
- **Skill 1**: Configure Queue Priority via Multiple Queue Names (`06-skills.md`)

---

## Anti-Pattern 2: Single Shared Supervisor for All Priority Tiers

### Category
Architecture — Resource Starvation

### Description
Using one Horizon supervisor (or one worker pool) to process all priority tiers. A flood of high-priority jobs can consume all workers, starving low-priority tiers. CPU-intensive jobs on the shared pool block latency-sensitive jobs.

### Why It Happens
Simplest configuration — one supervisor with `--queue=critical,default,bulk`. Teams do not anticipate workload imbalance scenarios. Early-stage applications with low volume do not experience starvation, so the issue goes unnoticed until traffic spikes.

### Warning Signs
- Single supervisor in `config/horizon.php` serving all queue names
- During traffic spikes, low-priority queues make zero progress
- Bulk jobs (reports, cleanup) are delayed for hours during peak traffic
- CPU-intensive jobs on shared pool increase latency for all tiers
- Team manually restarts workers during priority flooding incidents

### Why Harmful
Low-priority jobs (report generation, data cleanup, export) can be starved indefinitely during high-priority traffic surges. Data cleanup jobs never run, causing database bloat. Reports are perpetually delayed, breaking SLAs.

### Real-World Consequences
During a holiday sale, `critical` order-processing jobs surge. The shared supervisor allocates all 20 workers to `critical`. Reports, data exports, and database cleanup (`bulk` tier) make zero progress for 8 hours. The cleanup job backlog grows to 50K records, and next month's data retention compliance report shows PII was not purged on time.

### Preferred Alternative
Use separate Horizon supervisors per priority tier with independent `minProcesses`, `maxProcesses`, and `balance` settings.

### Refactoring Strategy
1. Define separate supervisor configurations per tier in `config/horizon.php`
2. Assign `critical` supervisor: `minProcesses=2, maxProcesses=10`
3. Assign `bulk` supervisor: `minProcesses=1, maxProcesses=3`
4. Deploy and verify each supervisor only processes its assigned queues
5. Monitor per-supervisor throughput to validate tier isolation

### Detection Checklist
- [ ] Single supervisor in Horizon config for all queue names
- [ ] Low-priority jobs stall during traffic spikes
- [ ] CPU-intensive and latency-sensitive jobs share the pool
- [ ] No `minProcesses` guarantee for critical tier

### Related Rules/Skills/Decision Trees
- **Rule 3**: separate-supervisors-per-tier (`05-rules.md`)
- **Decision 2**: Dedicated vs Shared Supervisor per Tier (`07-decision-trees.md`)
- **Skill 1**: Configure Queue Priority via Multiple Queue Names (`06-skills.md`)

---

## Anti-Pattern 3: Too Many Priority Tiers

### Category
Design — Operational Complexity

### Description
Defining more than 3 priority tiers (e.g., critical, high, medium, normal, low, bulk). Each tier adds worker configuration, monitoring, and operational overhead with diminishing latency returns.

### Why It Happens
Teams try to optimize for every possible latency scenario. Product requirements specify fine-grained SLAs. The temptation to create a dedicated tier for every job type leads to 5-6+ tiers.

### Warning Signs
- 5+ queue names in the `--queue` subscription
- Horizon config has 4+ supervisor entries
- Monitoring dashboard has dozens of queue panels
- Team cannot explain the difference between adjacent tiers (e.g., "high" vs "medium")
- Most tiers process < 100 jobs/day

### Why Harmful
Operational complexity grows linearly with tier count. Each tier needs worker configuration, monitoring thresholds, alerting rules, and documentation. The marginal latency benefit of each additional tier approaches zero — two tiers with the same latency behavior are just two sources of operational overhead.

### Real-World Consequences
A team creates 6 priority tiers. Configuring Horizon supervisors takes 2 hours. The monitoring dashboard has 30 panels. When a new team member asks which queue to use for a new job type, a 30-minute discussion ensues. Two tiers ("high" and "medium") have identical latency requirements and identical worker configurations — they are effectively the same tier with different names.

### Preferred Alternative
Limit to 3 priority tiers (critical, default, bulk). For extreme workload diversity, up to 5 may be justified but requires careful operational investment.

### Refactoring Strategy
1. Audit all existing queue names and their latency requirements
2. Consolidate tiers with identical latency profiles
3. Update dispatch calls to use consolidated tier names
4. Drain and remove unused queue definitions
5. Simplify Horizon config and monitoring dashboards

### Detection Checklist
- [ ] More than 3 queue names for priority
- [ ] Adjacent tiers with similar or identical latency profiles
- [ ] Most queues process < 100 jobs/day
- [ ] Team cannot clearly differentiate tier purposes

### Related Rules/Skills/Decision Trees
- **Rule 5**: limit-priority-tiers (`05-rules.md`)
- **Decision 1**: Number of Priority Tiers (`07-decision-trees.md`)

---

## Anti-Pattern 4: Assuming Preemptive Priority

### Category
Design — Incorrect Mental Model

### Description
Believing that queue priority is preemptive — that a high-priority job arriving during low-priority job processing will interrupt the current job. In reality, priority is polling-order only: the current job finishes before the next pop respects priority ordering.

### Why It Happens
Developers are familiar with preemptive priority from operating systems and programming language schedulers. The term "priority" naturally suggests preemptive behavior. Documentation emphasizes the polling-order mechanism, but developers skip the fine print.

### Warning Signs
- Team expresses surprise that a critical job waited behind a bulk job
- Code review comments suggest priority should interrupt current processing
- Tests assume critical jobs complete before bulk jobs regardless of start time
- SLA violations for critical jobs that arrived while a long bulk job was processing
- Documentation or comments refer to "preemptive priority"

### Why Harmful
A long-running bulk job (45 minutes) can delay a critical job (password reset) by up to 45 minutes — the user experiences a timeout. Teams design around incorrect assumptions, and SLAs are violated unexpectedly.

### Real-World Consequences
A UserDataExport job (bulk, processing 500K records, 30 min runtime) starts at 14:00. At 14:15, a PasswordReset job (critical, 500ms) is dispatched. The developer expected the PasswordReset to preempt, but it waits in the `critical` queue until the bulk job finishes at 14:30. The user's password reset link expires, and a support ticket is created.

### Preferred Alternative
Design for polling-order priority. Use separate Horizon supervisors per tier to guarantee minimum resources for critical jobs. Accept that priority affects queue selection order, not in-progress job preemption.

### Refactoring Strategy
1. Identify long-running jobs and move them to a dedicated `bulk` supervisor
2. Configure separate supervisors with guaranteed min processes for critical tier
3. Set timeouts on all jobs to prevent runaway processing
4. Educate the team on polling-order vs preemptive priority
5. Monitor oldest-job-age per queue to detect priority inversion

### Detection Checklist
- [ ] Team believes priority is preemptive
- [ ] Critical jobs delayed behind long-running bulk jobs
- [ ] Single shared supervisor for all tiers
- [ ] No timeouts configured on long-running jobs

### Related Rules/Skills/Decision Trees
- **Decision 2**: Dedicated vs Shared Supervisor per Tier (`07-decision-trees.md`)
- **Rule 3**: separate-supervisors-per-tier (`05-rules.md`)

---

## Anti-Pattern 5: Monitoring Aggregate Queue Depth Instead of Per-Queue

### Category
Observability — Missing Starvation Detection

### Description
Alerting on total queue depth across all queues instead of monitoring per-queue oldest-job-age. Aggregate metrics hide per-queue starvation — a `bulk` queue could have 10K jobs while `critical` is empty, but total depth tells the wrong story.

### Why It Happens
Default monitoring tools show aggregate metrics. Setting up per-queue monitoring requires additional configuration. Teams prioritize getting any monitoring in place over granularity.

### Warning Signs
- Alerting rule: "total queue depth > 1000"
- Monitoring dashboard shows one queue depth panel for all queues
- No oldest-job-age metric per queue
- Bulk jobs have been stalled for hours but no alert fired
- Team discovers stalled queues only through manual dashboard inspection

### Why Harmful
Starvation of lower-priority queues goes undetected. Report generation, data exports, and cleanup jobs stop making progress — but no alert fires because the aggregate depth looks healthy. By the time someone notices, the backlog is hours deep.

### Real-World Consequences
A `bulk` queue stalls because all workers are consumed by `critical` jobs. Aggregate queue depth stays under 500 (most jobs are critical, which are processing fine). The `bulk` queue grows to 50K unprocessed data export jobs. After 3 days, a customer complains about missing monthly reports. The team had no alert because aggregate depth never crossed the threshold.

### Preferred Alternative
Monitor oldest-job-age per queue with tier-specific thresholds. Alert when `critical` jobs exceed 1 minute, `default` jobs exceed 10 minutes, or `bulk` jobs exceed 1 hour.

### Refactoring Strategy
1. Instrument per-queue oldest-job-age metrics
2. Set tier-specific alert thresholds
3. Replace aggregate queue depth alerts with per-queue staleness alerts
4. Create a dashboard panel per priority tier
5. Test alerting by simulating per-queue starvation

### Detection Checklist
- [ ] Alerting only on aggregate queue depth
- [ ] No oldest-job-age metric
- [ ] Per-queue monitoring not configured
- [ ] Stalled queues have previously gone undetected

### Related Rules/Skills/Decision Trees
- **Rule 4**: monitor-oldest-job-per-queue (`05-rules.md`)
- **Decision 1**: Number of Priority Tiers (`07-decision-trees.md`)
- **Skill 1**: Configure Queue Priority via Multiple Queue Names (`06-skills.md`)
