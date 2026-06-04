# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Job Tags for Filtering and Monitoring
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Horizon displays job tags in the dashboard for filtering and monitoring. Tags are short strings (typically model identifiers) returned by the job's `tags()` method. Built-in tags include the job class name and, when using `SerializesModels`, the Eloquent model's class and key (e.g., `App\Models\Order:42`). Tags enable operators to filter the dashboard by specific model, find all jobs related to a particular entity, and correlate failures across job types.

# Core Concepts
- **`tags()` method**: Return an array of strings from the job class. Horizon displays these in the dashboard.
- **Automatic tags**: Jobs using `SerializesModels` automatically get tags like `App\Models\Order:42`.
- **Filtering**: Horizon dashboard supports filtering by tag text. `tag:order` shows jobs tagged with "order".
- **Search**: Tags are indexed in Redis for search. Each tag is stored as a key in Horizon's Redis keyspace.
- **Silenced tags**: Jobs with certain tags can be silenced (hidden from dashboard). Useful for high-frequency expected failures.

# Mental Models
- **Luggage tags**: Job tags are like luggage tags at the airport. They identify the bag's owner (model), destination (queue), and contents (job type). The baggage handler (dashboard operator) can find all bags for a specific passenger.
- **Hashtags**: Like social media hashtags. Add `#order:42` to a job and you can search/filter for all jobs related to order 42.

# Internal Mechanics
- `tags()` method is called during job dispatch and the result is stored in the job payload's `tags` array.
- Horizon reads these tags when the job is dispatched and stores them in Redis: `horizon:tags:{tag_value}` as a sorted set with job IDs.
- The tags are purely for Horizon's dashboard. They have NO effect on job execution behavior.
- `SerializesModels` automatically adds model tags: `get_class($model) . ':' . $model->getKey()`.
- Tags can be any strings. Convention: `ModelType:{id}` and `job:ClassName`.
- Tags are stored in Redis indefinitely (no TTL). Pruning strategies are needed for high-volume applications.

# Patterns
## Entity-Based Correlation
- **Purpose**: Tag jobs with the entity they process.
- **Benefit**: Find all jobs for a specific order, user, or invoice.
- **Tradeoff**: Tag cardinality equals entity count. Many unique tags = high Redis memory.

## Workflow Tracking
- **Purpose**: Tag jobs with workflow or batch identifiers.
- **Benefit**: Filter all jobs belonging to a specific batch or pipeline.
- **Tradeoff**: Tags persist in Redis; batch completion doesn't clean them.

## Environment/Version Tags
- **Purpose**: Tag jobs with deployment version or environment.
- **Benefit**: Distinguish jobs from different deploys in the dashboard.
- **Tradeoff**: High cardinality per deploy; memory overhead.

# Architectural Decisions
- **Use tags for operational monitoring**: Filters for specific entities speed up debugging.
- **Keep tag cardinality reasonable**: Tens of thousands of unique tags is fine. Millions may affect Redis memory.
- **Don't put sensitive data in tags**: Tags are visible in the Horizon dashboard to anyone with access.
- **Avoid very long tags (>100 chars)**: Tags are stored in Redis keys. Long tags waste memory and make for a poor dashboard experience.

# Tradeoffs
Entity-specific tags (user:42) | Instant filtering, fast debugging | High cardinality; Redis memory growth
Generic tags (queue:high) | Low cardinality, low memory | Less useful for entity-specific filtering
No custom tags | Zero memory overhead, simple | No filtering granularity

# Performance Considerations
- Each unique tag is stored as a Redis key. 100K unique tags = 100K Redis keys.
- Tags are written on job dispatch (not execution). No worker performance impact.
- Horizon dashboard tag filtering scans Redis sorted sets. At high tag volumes, filtering may be slow.
- Automatic model tags from `SerializesModels` are written on EVERY job dispatch for model-typed jobs. High job volume creates high tag write rate.

# Production Considerations
- Monitor Redis memory used by Horizon tags. If memory grows unbounded, implement a tag pruning strategy or avoid high-cardinality tags.
- Tag search in Horizon dashboard is Redis-backed — fast but not real-time indexed. May have delay for very recent jobs.
- Silenced tags don't reduce Redis storage — they only hide from the dashboard.
- Tags are included in the job payload envelope, increasing payload size marginally.
- The `tags()` method is called at dispatch time, in the dispatching process (web request). Keep it fast.

# Common Mistakes
- **Putting PII in tags**: Tags like `email:user@example.com` expose personal data to anyone with Horizon access.
- **Using high-cardinality unique values**: `Order:76428193` with 10M orders creates 10M unique tags. Redis memory grows accordingly.
- **Overriding `tags()` without calling parent**: If you override `tags()`, you lose the automatic model tags from `SerializesModels`. Call `parent::tags()` and merge.
- **Assuming tags affect job routing**: Tags are Horizon metadata. They don't change queue, connection, or job behavior.

# Failure Modes
- **Redis memory exhaustion from high-cardinality tags**: Every unique tag creates a Redis sorted set entry. At massive scale, this can contribute to Redis memory pressure.
- **Tag write contention at high dispatch rates**: Tag Redis writes are cheap but at 10K+ jobs/second, every job generates tag writes. May impact Horizon's Redis performance.
- **Dashboard query timeout**: Searching for a rare tag across millions of jobs may timeout the dashboard query.
- **Tag name collision**: Two different job types using the same tag value (e.g., order:42) merge their entries in the tag index. Not a problem for filtering, but tag count reflects combined.

# Ecosystem Usage
- **Laravel Horizon**: Tags are a core Horizon feature. Built-in `tags()` on the base job class.
- **Laravel framework**: The `Dispatchable` trait includes a `tags()` method that can be overridden.
- **Spatie packages**: Jobs dispatched by Spatie packages may include package-specific tags (e.g., `webhook-server:call:123`).

# Related Knowledge Units
- K046 Silenced Jobs and Silenced Tags | K047 Horizon Metrics

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
