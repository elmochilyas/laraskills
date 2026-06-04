# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K046 — Silenced Jobs and Silenced Tags
- **Knowledge ID:** K046
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Silencing Jobs
  - Laravel Source — `Laravel\Horizon\Contracts\ShouldBeSilenced`

---

# Overview

Horizon's silencing feature hides specific jobs or tagged jobs from the dashboard's "completed" and "failed" lists, reducing noise from expected, high-frequency jobs (health checks, scheduled maintenance tasks). Jobs are silenced by implementing the `ShouldBeSilenced` interface or by configuring silenced tags in `config/horizon.php`. Silenced jobs are still processed normally — they just don't appear in the default dashboard view. They ARE counted in metrics.

---

# Core Concepts

- **`ShouldBeSilenced` interface:** Marker interface on a job class. Job processes normally but is not displayed in Horizon's recent job lists.
- **Silenced tags:** Configure `horizon.silenced` array in config. Jobs with matching tags are hidden from default view.
- **Dashboard filter:** Horizon dashboard has a "silenced" toggle to show/hide silenced jobs.
- **Metrics inclusion:** Silenced jobs still count toward throughput, runtime, and failure metrics.
- **`Silenced` trait:** Convenience trait that implements `ShouldBeSilenced`.

---

# When To Use

- High-frequency expected jobs — health checks, heartbeat jobs, scheduled maintenance
- Infrastructure jobs that run every minute and almost always succeed
- Cross-cutting job categories via tag-based silencing (e.g., all `type:monitoring` jobs)
- Reducing dashboard noise so operators can focus on application-meaningful jobs

---

# When NOT To Use

- Critical jobs whose failures must be immediately visible in the default dashboard view
- Jobs that rarely fail but are catastrophic when they do (payment reconciliation)
- Silencing without setting up alerting for failures — failures become invisible
- All jobs — dashboard appears empty, defeating monitoring purposes

---

# Best Practices

- **Never silence failures without alerting.** A silenced job that fails doesn't appear in the default view — without alerting, the failure goes unnoticed. *Why: Silencing only hides dashboard entries — you must have external alerting (email, Slack, PagerDuty) for failures in silenced jobs.*
- **Use `Silenced` trait for per-job silencing.** Simpler and more explicit than tag-based silencing for individual job classes. *Why: The trait makes silencing visible in the job class itself — no need to cross-reference config file.*
- **Use tag-based silencing for cross-cutting categories.** When many different job classes share a characteristic, silencing by tag is more maintainable than modifying each class. *Why: Adding `silenced` config entries avoids touching multiple job classes — useful for third-party package jobs.*
- **Document silenced jobs in team runbooks.** Operators must know which jobs are silenced and how to check them. *Why: Without documentation, operators may miss important failure signals in silenced jobs during incident response.*

---

# Architecture Guidelines

- `ShouldBeSilenced` sets a `silenced` flag on the job's Redis entry at completion time.
- Horizon's dashboard query excludes silenced entries by default.
- Silencing happens at the Redis storage layer, not at the worker level.
- Metrics aggregation includes silenced jobs — they are not excluded from throughput/timing calculations.
- Silencing does not affect the `failed_jobs` table — all failures are stored regardless of silencing.

---

# Performance Considerations

- Silencing adds a boolean flag to the job's Redis entry — negligible overhead.
- Tag matching for silenced tags runs at job completion, not dispatch.
- No extra Redis operations for silenced entries beyond the flag.

---

# Security Considerations

- Silencing does not affect job execution — silenced jobs are processed with the same permissions and access as non-silenced jobs.
- The `silenced` config can be modified by anyone with write access to the Horizon config file — restrict access appropriately.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Silencing without alerting | Assuming dashboard is the only monitoring channel | Failures in silenced jobs go undetected | Set up alerting before silencing any job |
| Using `ShouldBeSilenced` for throttling | Confusing silencing with execution control | Job still runs — only hidden from dashboard | Use middleware for execution control |
| Over-silencing | Silencing too many job categories | Dashboard appears empty — operators miss context | Only silence truly noisy expected jobs |
| No team documentation | Team unaware of silencing policy | Operators may think jobs aren't running | Document silenced jobs in runbooks |

---

# Anti-Patterns

- **Silencing all infrastructure jobs:** Health checks, cache warmers, and cleanup jobs all silenced — when one fails, it's invisible until users report issues.
- **Tag-based silencing with generic tags:** `silenced: ['*']` — silences everything. Dashboard is permanently empty.
- **Silencing during incidents without removing:** Temporarily silencing non-critical jobs to reduce noise during an incident, but forgetting to unsilence afterward.

---

# Examples

```php
// Using the Silenced trait
use Laravel\Horizon\Contracts\Silenced;

class HealthCheckJob implements ShouldQueue
{
    use Silenced; // implements ShouldBeSilenced

    public function handle(): void
    {
        // This job runs every minute and is silenced from dashboard
    }
}

// config/horizon.php — tag-based silencing
'silenced' => [
    'type:healthcheck',
    'type:heartbeat',
    'type:cleanup',
],
```

---

# Related Topics

- **K045 Job Tags (K045)** — Tag mechanism that silencing uses
- **K047 Horizon Metrics (K047)** — Silenced jobs in metrics
- **K048 Horizon Notifications (K048)** — Alerting for silenced job failures

---

# AI Agent Notes

- When generating silenced jobs, always include a comment that alerting should be configured separately.
- Use the `Silenced` trait for individual job silencing — it's simpler than implementing the interface manually.
- For package development, do NOT silence jobs by default — let the consuming application decide via config.
- Document that silenced jobs still appear in the `failed_jobs` table and generate failure events.

---

# Verification

- [ ] `ShouldBeSilenced` job hidden from default dashboard view — toggle "show silenced" to verify
- [ ] Tag-based silencing works — verify jobs with matching tags are hidden
- [ ] Silenced jobs counted in metrics — verify throughput/runtime includes silenced jobs
- [ ] Silenced failure still generates event — verify `Queue::failing` fires for silenced failed jobs
- [ ] Failed_jobs table includes silenced failures — verify failed silenced jobs appear in the database
