# Anti-Patterns: Queue Driver Architecture

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K002 — Queue Driver Architecture |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Queue and Cache Sharing Redis | Reliability | Critical |
| 2 | Database Driver for Moderate Volume | Performance | High |
| 3 | sync Driver in Production | Performance | Critical |
| 4 | retry_after Shorter Than Job Runtime | Reliability | Critical |
| 5 | Missing after_commit Configuration | Data Integrity | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Composite Index on jobs Table | queue-driver-architecture, queue-connections-vs-queues | High |
| Missing QUEUE_CONNECTION in Production .env | queue-driver-architecture, queue-worker-management | Critical |
| SQS Without retry_after Alignment | queue-driver-architecture, amazon-sqs | High |

---

## Anti-Pattern 1: Queue and Cache Sharing Redis

### Category
Reliability — Silent Data Loss

### Description
Using the same Redis instance for both queues and cache. When memory pressure triggers eviction, `allkeys-lru` or `allkeys-lfu` policies delete queue keys — job payloads disappear with no alert, no failed entry, and no trace.

### Why It Happens
Default Laravel configuration uses a single Redis instance. Development environments handle low volume without issues. Teams prioritize infrastructure simplicity over isolation, not realizing that cache eviction policies do not distinguish between cache keys and queue keys.

### Warning Signs
- Single Redis connection in `config/database.php` serving both cache and queue
- Redis memory usage consistently above 70% of maxmemory
- Jobs disappear without appearing in failed_jobs table
- Cache hit ratio drops correlate with missing job processing
- Redis eviction policy is `allkeys-lru` or `allkeys-lfu`

### Why Harmful
Silent job loss is the most dangerous kind — there is no error, no log entry, and no failed job record. A payment processing job, email delivery, or data export disappears forever. The first indication is a customer complaint or a missed SLA.

### Real-World Consequences
A SaaS platform shares Redis between cache and queues. During a marketing campaign, cache usage spikes, triggering `allkeys-lru` eviction. 200 subscription renewal emails and 50 invoice generation jobs are silently deleted. The finance team notices missing invoices 3 days later — the jobs cannot be replayed because they left no trace.

### Preferred Alternative
Always use a separate Redis instance for queues. Configure distinct connections in `config/database.php` with separate hosts or database numbers.

### Refactoring Strategy
1. Provision a dedicated Redis instance for queues (or configure a separate database number)
2. Update `config/queue.php` to use the dedicated queue Redis connection
3. Update `config/cache.php` to keep using the original (now cache-only) connection
4. Deploy and verify queue workers connect to the new instance
5. Monitor both Redis instances for memory usage patterns

### Detection Checklist
- [ ] Single Redis instance serves both `QUEUE_CONNECTION` and `CACHE_DRIVER`
- [ ] Redis `maxmemory-policy` is volatile (allkeys-lru, allkeys-lfu)
- [ ] Jobs go missing without failed_jobs entries
- [ ] No alerting on Redis memory pressure

### Related Rules/Skills/Decision Trees
- **Rule 1**: separate-queue-redis-from-cache (`05-rules.md`)
- **Decision 2**: Redis Queue vs Cache Isolation (`07-decision-trees.md`)
- **Skill 1**: Select and Configure the Right Queue Driver (`06-skills.md`)

---

## Anti-Pattern 2: Database Driver for Moderate Volume

### Category
Performance — Contention at Scale

### Description
Using the `database` queue driver for moderate-to-high volume workloads (>100 jobs/hour). The polling query (`SELECT ... FOR UPDATE SKIP LOCKED`) becomes a contention point on the application database, degrading all database operations.

### Why It Happens
The database driver works fine in development where volume is low. Teams already have a database — adding Redis seems like unnecessary infrastructure. The polling query performs adequately until job volume crosses the contention threshold.

### Warning Signs
- `QUEUE_CONNECTION=database` in production
- Application database CPU spikes correlate with queue worker polling
- Query latency increases for application queries during queue processing
- Jobs table grows beyond 10,000 rows
- `SHOW PROCESSLIST` shows frequent `SELECT ... FOR UPDATE SKIP LOCKED` queries

### Why Harmful
The application database becomes the bottleneck for both application queries and queue operations. A queue backlog slows down the application, and application traffic slows down queue processing — a cascading failure pattern.

### Real-World Consequences
An e-commerce site uses the database driver. During a flash sale, 5,000 order processing jobs queue up. Workers poll the jobs table every second, causing table-level contention. Product page queries slow from 50ms to 2 seconds, and checkout queries time out. The site becomes unusable during peak traffic.

### Preferred Alternative
Use Redis for moderate-to-high volume workloads (<100 jobs/hour → database; 100-10K → Redis; >10K → Redis or SQS).

### Refactoring Strategy
1. Set up a Redis instance (or SQS queue)
2. Migrate `QUEUE_CONNECTION` to `redis` in production `.env`
3. Drain any existing jobs from the database table
4. Update worker commands to use the new connection
5. Benchmark application query latency before and after migration

### Detection Checklist
- [ ] `database` driver in production
- [ ] Job volume exceeds 100 jobs/hour
- [ ] Database CPU correlates with queue polling
- [ ] Application query latency increases during queue processing

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-database-driver-for-production-volume (`05-rules.md`)
- **Decision 1**: Queue Driver Selection Strategy (`07-decision-trees.md`)
- **Skill 1**: Select and Configure the Right Queue Driver (`06-skills.md`)

---

## Anti-Pattern 3: sync Driver in Production

### Category
Performance — Blocking Async Execution

### Description
Setting `QUEUE_CONNECTION=sync` in production, causing every job dispatch to execute synchronously within the HTTP request. This defeats the entire purpose of async processing — response times include the full execution time of every dispatched job.

### Why It Happens
Configuration oversight — the `.env` file from local development is deployed without updating `QUEUE_CONNECTION`. Developers test with sync for simplicity and forget to switch. Team does not have a deployment checklist for production configuration.

### Warning Signs
- `QUEUE_CONNECTION=sync` in production `.env`
- Job execution time directly added to HTTP response time
- Queue worker processes show zero job processing
- No jobs appear in Redis/DB queue storage
- `php artisan queue:work` reports "nothing to process" immediately

### Why Harmful
Every job dispatch adds its full execution time to the HTTP response. A 2-second job turns a 200ms response into a 2.2s response. Multiple dispatches compound — three 500ms jobs add 1.5 seconds to every response.

### Real-World Consequences
A team deploys to production with `QUEUE_CONNECTION=sync`. Image processing jobs that resize uploaded images execute synchronously — users uploading 10MB images wait 8 seconds for the upload to complete. The support team receives complaints about slow uploads, but the issue is invisible in queue monitoring because no queue is used.

### Preferred Alternative
Always configure `QUEUE_CONNECTION=redis` (or appropriate driver) in production. Keep `sync` for local development and testing only.

### Refactoring Strategy
1. Set `QUEUE_CONNECTION=redis` in production `.env`
2. Start queue worker processes (`php artisan queue:work redis`)
3. Verify jobs appear in queue storage and workers process them
4. Measure response time improvement
5. Add `QUEUE_CONNECTION` to deployment checklist

### Detection Checklist
- [ ] `QUEUE_CONNECTION=sync` in production
- [ ] No queue worker processes running
- [ ] Job-heavy routes show correlated response time increases
- [ ] No jobs in queue storage

### Related Rules/Skills/Decision Trees
- **Rule 6**: no-sync-driver-in-production (`05-rules.md`)
- **Decision 1**: Queue Driver Selection Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 4: retry_after Shorter Than Job Runtime

### Category
Reliability — Double Processing

### Description
Setting `retry_after` to a value shorter than the longest expected job runtime. When a job exceeds `retry_after`, the queue backend releases it to another worker while the first is still running — causing two workers to process the same job simultaneously.

### Why It Happens
Default `retry_after` values (60s for Redis) are reasonable for typical jobs but too short for file processing, API calls with slow responses, or image manipulation. Developers do not audit job runtimes before configuring the timeout.

### Warning Signs
- Duplicate order processing, duplicate email sends, or duplicate charges
- Job logs show overlapping execution times for the same job ID
- `retry_after` is set to the default (60s) with known long-running jobs
- Worker logs show "Job released" followed by same job processing on another worker
- Sentry/Datadog shows overlapping job traces for the same job ID

### Why Harmful
Double-processing has severe business consequences — duplicate charges to credit cards, duplicate confirmation emails, duplicate file uploads. For non-idempotent jobs, the second execution corrupts data or produces incorrect results.

### Real-World Consequences
An `InvoicePdfGeneration` job takes 120 seconds for large invoices. `retry_after` is set to the 60s default. Worker A picks up the job at 0s, Worker B picks up the same job at 61s. Both generate and store the PDF. Worker B overwrites Worker A's file with partial content, and the customer receives a corrupted invoice.

### Preferred Alternative
Always configure `retry_after` to at least 2x the longest expected job runtime. For SQS, set it 5-10s less than the visibility timeout.

### Refactoring Strategy
1. Audit job execution times (p99 and max)
2. Set `retry_after` to 2x the maximum expected runtime
3. For SQS: set `retry_after` = visibility timeout - 10s
4. Monitor for job overlaps in logs
5. Implement idempotency on all job handlers as defense in depth

### Detection Checklist
- [ ] Default `retry_after` (60s) with known long-running jobs
- [ ] Overlapping job execution in logs
- [ ] Duplicate side-effects observed
- [ ] No idempotency mechanism on job handlers

### Related Rules/Skills/Decision Trees
- **Rule 3**: retry-after-exceeds-longest-job (`05-rules.md`)
- **Decision 3**: retry_after Configuration Timing (`07-decision-trees.md`)

---

## Anti-Pattern 5: Missing after_commit Configuration

### Category
Data Integrity — Transaction Safety

### Description
Failing to set `after_commit=true` on queue connections. Jobs dispatched inside database transactions may process before the transaction commits, causing workers to read stale or missing data.

### Why It Happens
The default value for `after_commit` is `false`. Developers are unaware of the configuration option or assume transactions commit quickly enough that the race condition never occurs in practice.

### Warning Signs
- `after_commit` not set in `config/queue.php` connection config (defaults to `false`)
- Intermittent "Model not found" errors in queue workers for newly-created records
- Jobs retried with "model not found" that resolve on retry
- Workers process jobs referencing data that exists in the database by the time the developer checks

### Why Harmful
A worker processes a job before the dispatching transaction commits — the record the job depends on may not exist yet. The job fails, is retried, and may succeed on the second attempt (after the transaction commits), but the delay and failure risk are unnecessary.

### Real-World Consequences
An `OrderConfirmationMail` job dispatches inside a checkout transaction. The queue worker picks up the job before the transaction commits — the order record does not exist yet. The job fails with "Model not found", is retried 3 times with backoff, and the email arrives 60 seconds late. During high traffic, retries compound and the mail queue backs up.

### Preferred Alternative
Always set `after_commit=true` at the connection level. Override per-dispatch with `afterCommit: false` only for jobs that must dispatch immediately (logging, analytics).

### Refactoring Strategy
1. Add `'after_commit' => true` to each connection in `config/queue.php`
2. Identify jobs that must dispatch immediately (logging, analytics, audit trail)
3. Override those dispatches with `->afterCommit(false)`
4. Test transactional scenarios where jobs should wait for commit
5. Monitor for race condition errors in queue workers

### Detection Checklist
- [ ] `after_commit` not set or `false` in queue connection config
- [ ] "Model not found" errors in queue workers
- [ ] Jobs retried successfully without code changes
- [ ] Dispatches occur inside DB::transaction() blocks

### Related Rules/Skills/Decision Trees
- **Rule 2**: set-after-commit-per-connection (`05-rules.md`)
- **Decision 2**: Redis Queue vs Cache Isolation (`07-decision-trees.md`)
- **Skill 1**: Select and Configure the Right Queue Driver (`06-skills.md`)
