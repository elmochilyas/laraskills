# Anti-Patterns: Queue Connections vs. Queues Distinction

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K001 — Queue Connections vs. Queues Distinction |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | One Connection Per Queue | Infrastructure | Critical |
| 2 | Naming Queues by Job Class | Design | High |
| 3 | Queue Topology Deployed Ad-Hoc | Operational | High |
| 4 | Missing after_commit at Connection Level | Data Integrity | High |
| 5 | SQS Workers with Comma-Separated Queues | Operational | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Documented Queue Topology | queue-connections-vs-queues, queue-priority-multiple-queues | High |
| Hardcoded Queue Names in Job Classes | queue-connections-vs-queues, pending-dispatch-lifecycle | Medium |
| Workers Running Without Explicit Queue Subscription | queue-connections-vs-queues, queue-worker-management | High |

---

## Anti-Pattern 1: One Connection Per Queue

### Category
Infrastructure — Resource Multiplication

### Description
Creating a separate queue connection (and often a separate Redis instance) for each queue name. This multiplies infrastructure costs and operational complexity for what should be logical partitions within a single connection.

### Why It Happens
Developers confuse the concept of a connection (a backend service instance) with a queue (a named channel within that service). Configuration examples that show separate connections for different drivers are misapplied to queue name separation.

### Warning Signs
- Multiple connections in `config/queue.php` that all use the same driver with the same credentials
- Infrastructure costs scale linearly with number of queue names
- Deployment scripts create new Redis instances when adding a new queue name
- Team cannot articulate the difference between a connection and a queue
- Worker commands specify `--connection=` more often than `--queue=`

### Why Harmful
Each new queue name requires infrastructure provisioning instead of just a code change. Redis connection pools multiply, increasing memory overhead. Configuration complexity grows — every connection must be monitored, tuned, and documented.

### Real-World Consequences
A team creates `orders-connection`, `emails-connection`, and `media-connection` — each pointing to a separate Redis instance. When a new `reports` queue is needed, DevOps provisions a fourth Redis instance (2 days lead time). The infrastructure bill doubles. Meanwhile, a team using the same Redis instance with multiple queue names would add the queue in 5 minutes with zero infrastructure changes.

### Preferred Alternative
Use one connection per driver type with multiple named queues. Create separate connections only for different drivers (Redis + SQS), isolated Redis instances (queue vs cache), or environment separation.

### Refactoring Strategy
1. Consolidate same-driver connections into one connection in `config/queue.php`
2. Update dispatch calls to use `->onQueue('name')` instead of `->onConnection('name')`
3. Drain and delete the redundant connections' infrastructure
4. Update worker commands to use the consolidated connection with `--queue=` subscription
5. Document the new topology

### Detection Checklist
- [ ] Multiple connections with same driver and credentials
- [ ] Infrastructure provisioned per queue name
- [ ] Dispatch calls use `onConnection()` for same-driver queues
- [ ] No clear connection vs queue distinction in team understanding

### Related Rules/Skills/Decision Trees
- **Rule 3**: no-separate-connections-per-queue (`05-rules.md`)
- **Rule 5**: one-connection-many-queues (`05-rules.md`)
- **Decision 1**: Single Connection vs Multiple Connections (`07-decision-trees.md`)

---

## Anti-Pattern 2: Naming Queues by Job Class

### Category
Design — Operational Overhead

### Description
Naming queues after job classes (e.g., `ProcessOrderQueue`, `SendEmailQueue`) instead of workload characteristics. This creates a proliferation of single-job-type queues, each requiring separate worker configuration, monitoring, and operational overhead — while sharing identical processing requirements.

### Why It Happens
Intuitive naming — developers name the queue after the job it contains because it is the most obvious label. Teams do not consider that queue names describe processing requirements, not the types of jobs within them.

### Warning Signs
- Queue names match job class names: `ProcessOrderQueue`, `SendEmailQueue`, `GenerateReportQueue`
- 20+ queue names for 20+ job types
- Workers configured with long `--queue=` lists
- Queue monitoring dashboard shows many queues with very low throughput
- Queue names include verbs (Process, Send, Generate) instead of characteristics

### Why Harmful
Each queue name requires worker configuration, monitoring dashboard entry, and operational documentation. When 15 queues have the same latency and resource requirements, they should be one queue — the operational overhead is multiplied by 15x for no benefit.

### Real-World Consequences
A team has 30 job classes and 30 queue names. Setting up a new staging environment requires configuring 30 queue definitions in Horizon. The monitoring dashboard has 30 panels showing near-zero throughput. When the team needs to add a new worker pool, they must decide which of the 30 queues to subscribe to, rather than thinking about latency tiers.

### Preferred Alternative
Name queues by workload characteristic: `critical` (user-facing, <1s), `default` (general, <30s), `bulk` (batch processing, >30s), `media` (file processing), `webhooks` (outbound calls).

### Refactoring Strategy
1. Categorize all job classes by latency requirements and resource intensity
2. Define 3-5 queue tiers (e.g., critical, default, bulk, media, reports)
3. Update dispatch calls to use the tier-based queue names
4. Drain old per-class queues
5. Update Horizon/supervisor configuration for the new tiers

### Detection Checklist
- [ ] Queue names match job class names
- [ ] More queue names than queue tiers (critical/default/bulk)
- [ ] Workers have long `--queue=` subscription lists
- [ ] Most queues process <100 jobs/day

### Related Rules/Skills/Decision Trees
- **Rule 2**: name-queues-by-workload-characteristic (`05-rules.md`)
- **Decision 2**: Queue Naming Strategy: Workload vs Job Class (`07-decision-trees.md`)
- **Skill 1**: Design Queue Topology with Connections and Queues (`06-skills.md`)

---

## Anti-Pattern 3: Queue Topology Deployed Ad-Hoc

### Category
Operational — Retroactive Migration Cost

### Description
Deploying queue infrastructure without upfront topology planning. Queue names and connection assignments evolve organically as job classes are added, resulting in an inconsistent topology that is expensive to refactor.

### Why It Happens
Greenfield projects start with simple defaults. Teams plan to "fix it later" but the migration cost increases with every deployed job. By the time the topology is clearly wrong, draining and migrating queues is disruptive.

### Warning Signs
- Queue names are inconsistent: some by job class, some by workload, some by feature
- Some jobs dispatch to `default` queue while similar jobs dispatch to named queues
- Team avoids queue reconfiguration because "too many jobs are in production"
- Migration scripts exist for retroactive queue splitting
- New team members cannot describe the queue topology

### Why Harmful
Retroactively splitting queue names or connections requires draining all jobs from the old queue, processing them, reconfiguring workers, and carefully monitoring — during which jobs may queue up with no workers. The cost grows with queue depth.

### Real-World Consequences
A team needs to split a `default` queue into `critical` and `bulk` tiers. They must stop workers on the `default` queue, wait for all jobs to drain (6 hours for bulk jobs), reconfigure workers for the new queues, and restart. During migration, the `critical` jobs must wait behind bulk jobs — violating the SLA for order processing.

### Preferred Alternative
Define queue topology before deploying the first job. Start with 3 queue tiers (critical, default, bulk) and refine as workload patterns emerge.

### Refactoring Strategy
1. Document current queue topology (connection, queue, job class mapping)
2. Define target topology based on workload characteristics
3. Create a migration plan: add new queues alongside existing ones
4. Update dispatch calls to use new queue names
5. Drain old queues by processing remaining jobs
6. Remove old queue definitions and worker configurations

### Detection Checklist
- [ ] No queue topology documentation exists
- [ ] Queue names use multiple naming conventions
- [ ] Similar job classes dispatch to different queues
- [ ] Team avoids queue changes due to migration cost
- [ ] No queue naming convention is enforced in code review

### Related Rules/Skills/Decision Trees
- **Rule 1**: define-topology-before-deploying (`05-rules.md`)
- **Decision 1**: Single Connection vs Multiple Connections (`07-decision-trees.md`)
- **Skill 1**: Design Queue Topology with Connections and Queues (`06-skills.md`)

---

## Anti-Pattern 4: Missing after_commit at Connection Level

### Category
Data Integrity — Transaction Safety

### Description
Failing to set `after_commit=true` at the queue connection level. Jobs dispatched inside database transactions may process before the transaction commits, causing workers to read stale or missing data.

### Why It Happens
The default value is `false`. Developers are unaware the option exists, or assume the race condition is too rare to matter. Teams configure connections based on copy-pasted examples that omit `after_commit`.

### Warning Signs
- `after_commit` key absent from connection config (defaults to `false`)
- "Model not found" exceptions in queue workers for recently created records
- Jobs succeed on retry without code changes (because the transaction committed by then)
- Intermittent data races in integration tests involving dispatched jobs

### Why Harmful
A worker processes a job before the transaction commits — the record the job depends on does not exist. The job fails, is retried, and may succeed on the second attempt, but the delay causes user-facing latency and unnecessary retry overhead.

### Real-World Consequences
An order processing pipeline dispatches a `ChargeCustomer` job inside a `DB::transaction()`. The worker picks up the job before the transaction commits — the order record is missing, the payment gateway call fails with "no order reference", and the customer is charged after retry but the order confirmation is delayed by 30 seconds.

### Preferred Alternative
Always set `'after_commit' => true` on each queue connection. Override per-dispatch for logging/analytics jobs that must fire immediately.

### Refactoring Strategy
1. Add `'after_commit' => true` to all connections in `config/queue.php`
2. Identify jobs that require immediate dispatch (logging, analytics, audit)
3. Override those specific dispatches: `Job::dispatch()->afterCommit(false)`
4. Test transactional flows to verify jobs wait for commit
5. Monitor queue worker logs for eliminated race conditions

### Detection Checklist
- [ ] `after_commit` not configured or set to `false`
- [ ] "Model not found" errors in queue workers
- [ ] Dispatches occur inside `DB::transaction()` blocks
- [ ] Retries resolve failures without code changes

### Related Rules/Skills/Decision Trees
- **Rule 4**: set-after-commit-at-connection-level (`05-rules.md`)
- **Decision 3**: Worker Queue Subscription Priority Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 5: SQS Workers with Comma-Separated Queues

### Category
Operational — Silent Misconfiguration

### Description
Using the comma-separated `--queue=high,default` syntax with SQS workers. Laravel's queue worker only uses the first queue name when the driver is SQS because SQS queue resolution requires a full URL, not a simple key name.

### Why It Happens
Developers are familiar with the Redis comma-separated queue subscription pattern and apply it to SQS without realizing the driver-specific behavior. The worker appears to run normally but only processes the first queue — remaining queues are never polled.

### Warning Signs
- SQS worker command uses `--queue=critical,default,bulk`
- Only the first queue's messages are processed
- Monitoring shows zero throughput on second and third SQS queues
- "Queue [critical] not found" or similar SQS-specific errors
- Worker starts successfully but processes far fewer jobs than expected

### Why Harmful
Jobs dispatched to the second and third queue names are never processed. There is no error — the worker simply never polls those queues. Email sends, report generation, and other non-critical jobs pile up indefinitely.

### Real-World Consequences
A team configures an SQS worker with `--queue=critical,default,bulk`. The `critical` queue (order processing) works fine. The `default` queue (email notifications) and `bulk` queue (report generation) are never polled. After 3 days, 50,000 unprocessed emails and 200 ungenerated reports accumulate. Customers have not received order confirmations, and monthly reports are missing.

### Preferred Alternative
For SQS, use separate queue URLs with separate worker processes per queue. Do not use comma-separated queue names in the `--queue` option.

### Refactoring Strategy
1. Create separate SQS queue URLs for each queue name
2. Configure separate worker daemons per SQS URL
3. Update dispatch calls to use the correct SQS queue URL
4. Remove comma-separated `--queue=` from SQS worker commands
5. Implement dead-letter queues per SQS URL for failure isolation

### Detection Checklist
- [ ] SQS worker uses `--queue=` with comma-separated values
- [ ] Second and third SQS queues show zero throughput
- [ ] Worker starts without errors but jobs in non-first queues are unprocessed
- [ ] Jobs disappear from SQS queues after visibility timeout without processing

### Related Rules/Skills/Decision Trees
- **Rule 3**: no-separate-connections-per-queue (`05-rules.md`) — SQS exception
- **Decision 3**: Worker Queue Subscription Priority Strategy (`07-decision-trees.md`)
- **Skill 1**: Design Queue Topology with Connections and Queues (`06-skills.md`)
