# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Silenced Jobs and Silenced Tags
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Horizon's silencing feature hides specific jobs or tagged jobs from the dashboard's "completed" and "failed" lists, reducing noise from expected, high-frequency jobs (health checks, scheduled maintenance tasks). Jobs are silenced by implementing the `ShouldBeSilenced` interface or by configuring silenced tags in `config/horizon.php`. Silenced jobs are still processed normally — they just don't appear in the default dashboard view. They ARE counted in metrics.

# Core Concepts
- **`ShouldBeSilenced` interface**: Marker interface on a job class. The job processes normally but is not displayed in Horizon's recent job lists.
- **Silenced tags**: Configure `horizon.silenced` array in `config/horizon.php`. Jobs with matching tags are hidden from default view.
- **Dashboard filter**: The Horizon dashboard has a "silenced" toggle to show/hide silenced jobs.
- **Metrics inclusion**: Silenced jobs still count toward throughput, runtime, and failure metrics.
- **`Silenced` trait**: Convenience trait that implements `ShouldBeSilenced`.

# Mental Models
- **Mute button**: Silencing is like muting a noisy channel in a group chat. The messages (jobs) still arrive — you just don't see them in the main feed. You can unmute to see them.
- **Expected noise filter**: The server room has a hum from cooling fans (expected noise = health check jobs). Silencing filters out the expected noise so you can hear the unexpected alarm.

# Internal Mechanics
- `ShouldBeSilenced` implementors cause Horizon to set a `silenced` flag on the job entry in Redis.
- Horizon's dashboard query excludes `silenced` entries by default. The user can toggle visibility.
- Tag-based silencing: when Horizon indexes a job's tags, it checks `horizon.silenced` config for matching patterns and sets the `silenced` flag.
- Silencing happens at the Redis storage layer (when the job completes/fails), not at the worker level.
- Metrics aggregation includes silenced jobs — they are not excluded from throughput or timing calculations.

# Patterns
## Infrastructure Job Silencing
- **Purpose**: Silence jobs like health checks, cache warmers, and scheduled maintenance.
- **Benefit**: Dashboard shows only application-meaningful jobs.
- **Tradeoff**: Noise reduction at the cost of hiding legitimate failures in infrastructure jobs.

## Tag-Selective Silencing
- **Purpose**: Silence jobs with specific tags (e.g., `type:healthcheck`).
- **Benefit**: Centralized control without modifying job classes.
- **Tradeoff**: Tag naming convention must be consistent; job must set the tag.

## Temporary Silencing During Incidents
- **Purpose**: Silence non-critical jobs during an incident to reduce dashboard noise.
- **Benefit**: Operators focus on incident-relevant jobs.
- **Tradeoff**: Requires horizon config change (potentially a deploy).

# Architectural Decisions
- **Silence high-frequency expected jobs**: Jobs that run every minute and almost always succeed don't need dashboard visibility.
- **Don't silence failed job visibility**: Even silenced jobs' failures are visible if you toggle silenced view. But don't rely on operators to toggle — use alerting for failures.
- **Use `Silenced` trait for code-level silencing**: Simple, explicit per-job.
- **Use tag-based silencing for cross-cutting silence**: When many different jobs share a characteristic (e.g., all from a package).

# Tradeoffs
`ShouldBeSilenced` interface | Per-job control, explicit | Must modify job class; can't silence third-party jobs
Tag-based silencing | Centralized, no code changes | Requires consistent tagging; config-managed
No silencing | Full visibility, no filtering risk | Dashboard noise; important signals buried

# Performance Considerations
- Silencing adds a boolean flag to the job's Redis entry. Negligible overhead.
- Tag matching for silenced tags runs at job completion, not dispatch.
- No extra Redis operations for silenced entries beyond the flag.

# Production Considerations
- Silenced jobs that fail still generate failure events (`Queue::failing`). Alerting should not depend on dashboard visibility.
- Auditors looking for all job activity should toggle "show silenced" in the dashboard.
- Silencing does not affect `failed_jobs` table — all failures are stored regardless of silencing.
- If all jobs are silenced, the dashboard appears empty. Not helpful for debugging.

# Common Mistakes
- **Silencing failures without alerting**: A silenced job that fails doesn't appear in the default dashboard view. Without alerting, the failure goes unnoticed.
- **Using `ShouldBeSilenced` for throttling**: Silencing doesn't affect execution. The job still runs and consumes resources. Silencing only hides dashboard output.
- **Silencing without dashboard toggle awareness**: Operators who don't know about the toggle may think jobs aren't running when the dashboard looks empty.
- **Silencing jobs that need failure visibility**: Jobs that rarely fail but are critical when they do (payment reconciliation) should not be silenced.

# Failure Modes
- **Over-silencing creates blind spots**: Too many silenced jobs means failures in those jobs are invisible unless specifically monitored.
- **Config-level silenced tag interferes with debugging**: Temporarily silencing during an incident may accidentally silence relevant jobs.
- **Misleading dashboard during incident**: Operator checks "recent jobs" and sees nothing failing — fails to notice silenced jobs are failing underneath.
- **Forgetting silenced jobs in post-mortem**: Post-incident analysis that only looks at default dashboard misses silenced job failures.

# Ecosystem Usage
- **Laravel Horizon**: Silencing is a Horizon-specific feature. Not available with `queue:work`.
- **Laravel Forge**: Forge Horizon UI doesn't expose silencing configuration but the parameter works when set in horizon.php.
- **Spatie packages**: Package jobs that run frequently (like webhook status checks) may benefit from silencing.

# Related Knowledge Units
- K045 Job Tags (tag mechanism) | K047 Horizon Metrics (silenced jobs in metrics)

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
