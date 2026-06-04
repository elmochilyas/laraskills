# Anti-Patterns: `failed_jobs` Table and DynamoDB Storage

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K020 — failed_jobs Storage |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Never Pruning Failed Jobs | Performance | High |
| 2 | No Dedicated Database Connection for High-Volume Failures | Reliability | Medium |
| 3 | Storing Sensitive Data in Payload | Security | Critical |
| 4 | Using DynamoDB for Complex Failure Analytics | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Unbounded failed_jobs Table Growth | failed-jobs-storage, pruning-failed-jobs | High |
| Sensitive Data Leak via Serialized Payload | failed-jobs-storage, job-serialization-payload-envelope | Critical |
| No Archive Strategy for Compliance Retention | failed-jobs-storage | Medium |

---

## Anti-Pattern 1: Never Pruning Failed Jobs

### Category
Performance — Table Bloat

### Description
Not scheduling regular pruning of the `failed_jobs` table. Every failure adds kilobytes of payload + stack trace. The table grows unbounded, slowing down `queue:retry`, `queue:retry-batch`, and any manual queries against `failed_jobs`.

### Why It Happens
The `failed_jobs` table is out of sight, out of mind. Teams configure the table migration but never set up the cleanup schedule. The pruning command (`queue:prune-failed`) exists but must be explicitly scheduled.

### Warning Signs
- `failed_jobs` table has 10K+ rows
- `queue:retry` command takes seconds or minutes to run
- Horizon's failure display is slow to load
- Database backup size increases due to `failed_jobs`
- Team has never run `queue:prune-failed`

### Why Harmful
An unpruned `failed_jobs` table with 100K+ rows makes every operation that scans it slow. `queue:retry` loads all matching rows — a full table scan on 100K rows takes seconds. The `exception` column stores 2-10KB of text per row — 100K rows = 200MB-1GB of unnecessary storage.

### Real-World Consequences
A production system has 200K rows in `failed_jobs` (accumulated over 18 months). The team needs to retry all failed jobs from a specific queue. `queue:retry --queue=emails` takes 45 seconds to complete because it scans all 200K rows. The database backup is 3GB instead of 1GB due to failed_jobs payloads. The on-call engineer needs to check recent failures but the query times out.

### Preferred Alternative
Schedule `queue:prune-failed` to run daily, retaining only the most recent failures.

### Refactoring Strategy
1. Add to `schedule()`: `$schedule->command('queue:prune-failed --hours=168')->daily()`
2. Set retention period based on investigation window (7-30 days typical)
3. For compliance: archive to cold storage before pruning
4. Monitor `failed_jobs` table size — alert if >10K rows
5. Run initial manual prune to clean up existing backlog

### Detection Checklist
- [ ] No pruning scheduled
- [ ] `failed_jobs` table has 10K+ rows
- [ ] `queue:retry` is slow
- [ ] Backup size inflated by failed_jobs

### Related Rules/Skills/Decision Trees
- **Rule 1**: prune-failed-jobs-regularly (`05-rules.md`)
- **Skill**: Configure failed_jobs Storage (`06-skills.md`)
- **Decision**: Failed Job Retention Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: No Dedicated Connection for High-Volume Failures

### Category
Reliability — DB Contention

### Description
Using the same database connection for `failed_jobs` storage as the main application database in high-volume failure scenarios. The `INSERT INTO failed_jobs` on every failure competes with regular application queries — a cascading performance degradation from errors.

### Why It Happens
The default configuration uses the primary database connection for `failed_jobs`. Teams don't separate failure storage until it becomes a problem.

### Warning Signs
- High failure rate (>100/day) with shared DB connection
- Application query performance degrades during failure bursts
- DB CPU/IO spikes correlate with failure events
- Deadlocks or lock contention on `failed_jobs` table
- Team observes "everything is slow" when failures spike

### Why Harmful
Errors create more errors. When failures spike, each failure writes to `failed_jobs`. The write contends with application queries. Application queries slow down, increasing the likelihood of timeouts and further errors. The `failed_jobs` writes compound the problem.

### Real-World Consequences
A database has 1000 QPS normal load. A bug causes 500 job failures per minute. Each failure inserts into `failed_jobs` on the same connection. The 500 inserts add 50% more write load. The DB struggles with the extra load. Application queries now take 2x normal time. Application response times increase, causing more context/connection errors. More jobs fail. The cascading failure continues until the bug is fixed or the DB is scaled.

### Preferred Alternative
Use a dedicated database connection for `failed_jobs` in high-volume systems.

### Refactoring Strategy
1. Create a separate database (or use a different DB host) for failure storage
2. Configure `config/queue.php`: `'failed' => ['driver' => 'database-connection', 'database' => 'mysql_failed', 'table' => 'failed_jobs']`
3. Create the `failed_jobs` table on the dedicated connection
4. Verify failure writes don't affect application query performance
5. For DynamoDB: no dedicated connection needed — it scales independently

### Detection Checklist
- [ ] Shared DB connection for app + failed_jobs
- [ ] Failure rate >100/day
- [ ] Performance degradation during failure bursts
- [ ] No dedicated failure storage infrastructure

### Related Rules/Skills/Decision Trees
- **Rule 2**: dedicated-connection-for-high-volume-failures (`05-rules.md`)
- **Decision**: failed_jobs Table vs Custom Storage (`07-decision-trees.md`)

---

## Anti-Pattern 3: Storing Sensitive Data in Payload

### Category
Security — Data Leak

### Description
Passing sensitive data (PII, API keys, passwords) as constructor arguments to queued jobs. When the job fails, the full serialized payload — including sensitive data — is stored permanently in the `failed_jobs` table.

### Why It Happens
It's convenient to pass the full Eloquent model to a job: `dispatch(new ProcessOrder($order))`. The model is serialized into the job payload, including all its attributes — potentially including PII. Developers don't think about what gets stored on failure.

### Warning Signs
- Job constructor accepts Eloquent models (they serialize all attributes)
- Job payload contains customer name, email, address, or other PII
- API keys, tokens, or secrets passed as constructor arguments
- `failed_jobs.payload` column contains readable data (not encrypted)
- Compliance teams flag `failed_jobs` table in audits

### Why Harmful
A data breach that exposes the `failed_jobs` table reveals all serialized job payloads. For jobs that received full Eloquent models, the payload contains all model attributes — including PII, internal IDs, and potentially sensitive business data. This data is permanently stored (until pruning) and unencrypted by default.

### Real-World Consequences
A `ProcessOrder` job receives the full `$order` model: `public function __construct(public Order $order)`. The `Order` model has `customer_name`, `email`, `address`, `credit_card_last_four`, and `internal_notes`. When the job fails, all of these are serialized into the `failed_jobs.payload` column. A database backup is leaked. The backup contains 5,000 rows of `failed_jobs` with full order details — a massive PII breach.

### Preferred Alternative
Pass only the model ID (or a non-sensitive identifier) to the job. Re-fetch the model in `handle()`.

### Refactoring Strategy
1. Identify jobs that accept full Eloquent models in constructors
2. Replace with ID-based constructors: `public function __construct(public int $orderId)`
3. Re-fetch the model in `handle()`: `$order = Order::findOrFail($this->orderId)`
4. For jobs that must accept sensitive data: encrypt the payload
5. Review all job classes for sensitive data in serialized form

### Detection Checklist
- [ ] Job constructor accepts Eloquent models
- [ ] PII, API keys, or tokens in constructor arguments
- [ ] `failed_jobs.payload` contains readable sensitive data
- [ ] No encryption on failed job payload

### Related Rules/Skills/Decision Trees
- **Rule 3**: be-aware-of-sensitive-payload-data (`05-rules.md`)
- **Skill**: Configure failed_jobs Storage (`06-skills.md`)

---

## Anti-Pattern 4: Using DynamoDB for Complex Failure Analytics

### Category
Observability — Limited Query Capabilities

### Description
Using DynamoDB as the `failed_jobs` storage backend and attempting to run complex analytical queries (aggregations, full-text search, joins) against it. DynamoDB is optimized for key-value access patterns — complex queries are slow, expensive, or impossible.

### Why It Happens
DynamoDB is configured as the failure provider for its auto-scaling benefits. Teams then try to use it for failure analytics because the data is already there.

### Warning Signs
- DynamoDB as failed_jobs provider
- Team tries to "SELECT count(*) GROUP BY queue" type queries
- Query latency is high for simple analytical queries
- Scan operations consume high read capacity
- Team builds complex secondary indexes for analytical patterns
- Failure analysis is extracted to a separate store anyway

### Why Harmful
DynamoDB queries that scan the entire table for analytical purposes consume high read capacity units (RCUs) and are slow. A `Scan` on 1M DynamoDB items can take minutes and cost $5+. The team eventually builds a separate analytics pipeline anyway — the DynamoDB data was an unnecessary intermediate step.

### Real-World Consequences
A team stores failed jobs in DynamoDB. The on-call engineer wants to see "how many jobs failed per queue in the last hour." The DynamoDB query requires a full Scan with a filter. It takes 2 minutes and costs $3 in RCUs. The engineer writes a custom script that extracts data to S3 and queries with Athena. The DynamoDB store was an unnecessary step — the analytical data should have gone directly to a purpose-built store.

### Preferred Alternative
Use DynamoDB as the operational storage (fast lookups, retry). Stream failures to a separate analytical store for analytics.

### Refactoring Strategy
1. Keep DynamoDB for operational use: `find()`, `forget()`, `retry`
2. Stream failed job records to an analytics store (Elasticsearch, S3+Athena, ClickHouse)
3. Redirect analytical queries to the analytics store
4. Remove complex scan operations against DynamoDB
5. Set up DynamoDB TTL for automatic operational data cleanup

### Detection Checklist
- [ ] Complex analytical queries against DynamoDB
- [ ] High read capacity usage for analysis
- [ ] Slow analytical query performance
- [ ] No separate analytics store for failure data

### Related Rules/Skills/Decision Trees
- **Decision**: failed_jobs Table vs Custom Storage (`07-decision-trees.md`)
