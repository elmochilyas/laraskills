# Metadata

- **Domain:** DevOps & Infrastructure
- **Subdomain:** Queue Deployment Safety
- **Knowledge Unit:** Queue Deployment Safety Operations
- **Knowledge ID:** KXXX-queue-deployment-safety-operations
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-22
- **Source References:**
  - Laravel Docs — Queues: Running the Queue Worker, Horizon
  - Laravel Source — `Illuminate\Queue\Console\RestartCommand`, `Laravel\Horizon\Console\TerminateCommand`

---

# Overview

Deploying code changes to a production Laravel application with active queue workers requires specific safety procedures: `php artisan queue:restart` to signal workers to reload, `horizon:terminate` for graceful worker shutdown, backward-compatible job payloads via `SerializesModels` to survive constructor signature changes, pre-deploy code deployment (code before schema changes), feature flags for risky rollout, and post-deploy `failed_jobs` monitoring. Without these, in-flight jobs fail with deserialization errors, workers process old code against new schemas, and locks go stale from hard-killed workers.

---

# Core Concepts

- **`queue:restart`**: Writes a timestamp to cache. Workers poll this between jobs. If changed, the worker dies after current job. Supervisor restarts with new code. Does NOT interrupt in-flight jobs.
- **`horizon:terminate`**: Gracefully stops Horizon master + workers. Workers finish current jobs, then exit. Configurable timeout before SIGKILL. Supervisor restarts Horizon.
- **`SerializesModels` trait**: Stores only model class + ID in job payload. Worker re-fetches `Model::findOrFail($id)` on deserialization. Ensures fresh data, protects against constructor signature changes.
- **Backward-compatible payloads**: New job constructor parameters must have default values. Removed parameters break old payloads. Added nullable columns need code to handle both states.
- **Deploy ordering**: Deploy code first (handles old + new schema), verify workers restart, then run migrations. Never run migrations before code deploy.
- **Feature flags**: Gate new job logic behind `Feature::active('new-payment-flow')`. Instant rollback by disabling the flag. No redeploy, no queue:restart needed.
- **Staggered worker groups**: Deploy to Worker Group A, verify, then deploy to Worker Group B. Both groups must handle each other's payloads during the transition.
- **Phased migrations**: For large tables: add nullable column → deploy code that handles null → backfill → add NOT NULL constraint → remove old column. Multiple deploys, zero table locks.

---

# When To Use

- Every production deployment with active queue workers
- When job constructor signatures change
- When database schema changes affect tables referenced by jobs
- When deploying risky job logic changes (use feature flags)
- When running large-scale database migrations alongside queue processing

---

# When NOT To Use

- Serverless environments (Vapor) — no persistent workers, no `queue:restart` needed
- Local development — workers are restarted manually; deployment safety is a production concern
- Single-server setups with zero-downtime not required (though practices are still beneficial)

---

# Best Practices

- **Always call `queue:restart` after every production deploy.** Old code continues processing indefinitely without this signal. *Why: Workers only check for the restart signal between jobs. Without it, yesterday's code processes today's jobs.*
- **Always use `SerializesModels` on queued jobs that reference Eloquent models.** Never store full model objects in job payloads. *Why: Without `SerializesModels`, the full model state is frozen at dispatch time. Changes to the database after dispatch are invisible. Constructor signature changes during deploys break deserialization.*
- **Deploy code before running destructive migrations.** New code should handle both old and new schema states. *Why: Running `DROP COLUMN` before deploying code that still references that column causes runtime errors on in-flight workers.*
- **Set `horizon:terminate` timeout to exceed p99 job execution time.** Prevent SIGKILL on legitimate slow jobs. *Why: The default 60-second timeout kills jobs that legitimately take 90 seconds. Configure the timeout to 2× p99 job duration.*
- **Use feature flags for job logic changes with a risk profile of Medium or higher.** Instant rollback, no redeploy. *Why: If the new payment logic is buggy, disabling the flag restores the old path in seconds — no queue:restart, no deploy needed.*
- **Monitor `failed_jobs` growth rate during the first 15 minutes post-deployment.** This is the critical window for detecting payload incompatibility. *Why: Incompatible job payloads are discovered on first deserialization — which happens immediately after workers restart. A spike in `failed_jobs` within 15 minutes of deploy indicates a payload compatibility issue.*

---

# Performance Considerations

- `queue:restart` adds ~1ms per job (cache read). Negligible overhead.
- Worker restart: cold PHP bootstrap (~100-500ms). First few jobs after restart may be slower.
- `horizon:terminate` timeout: if too long, deployment pipeline waits. If too short, jobs are killed.
- `SerializesModels` adds a `findOrFail()` DB query per model per job execution. This is a feature (fresh data), not just overhead.
- Phased migrations involve multiple deploy cycles — each cycle requires a `queue:restart` and brief worker downtime.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Skipping `queue:restart` after deploy | Deploy script omission | Old code processes jobs against new schema — runtime errors | Always include `queue:restart` in deploy script |
| Removing constructor parameters | Signature change | Old payloads fail deserialization — jobs lost | Add optional parameters with defaults; never remove without compatibility window |
| Running migrations before code deploy | Deploy ordering reversed | Old workers can't handle new schema | Deploy code first, verify, then run migrations |
| No `horizon:terminate` timeout tuning | Default 60s timeout | Long-running jobs are SIGKILL'd mid-execution | Set timeout to 2× p99 job duration |
| Not monitoring `failed_jobs` post-deploy | Deploy-and-forget | Payload incompatibility discovered hours/days later via customer complaints | Active monitoring for first 15 minutes post-deploy |
| Clearing config cache during deploy without `queue:restart` | Config cache cleared | Workers load stale config after cache clear; restart signal missed | Always pair config cache operations with `queue:restart` |
| Feature flag cleanup forgotten | Flag stays after safe rollout | Code bloat, branching complexity accumulates | Schedule flag removal in the next sprint; use code annotations |

---

# Examples

```php
// Backward-compatible job constructor: add parameter with default
// Old payload (before deploy): {userId: 42, priority: null}
// New payload (after deploy):  {userId: 42, priority: "high"}

class ProcessOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public ?string $priority = null,  // New parameter with default — backward compatible
    ) {}

    public function handle(): void
    {
        // Handle both: old jobs (priority=null) and new jobs (priority="high")
        $priority = $this->priority ?? 'normal';
    }
}
```

```php
// Feature-flagged job logic
class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(PaymentGateway $gateway): void
    {
        if (Feature::active('new-payment-flow')) {
            $gateway->processV2($this->paymentId);
        } else {
            $gateway->processV1($this->paymentId);
        }
    }
}
```

```php
// Deployment script (Enovy/Forge/CI)
// 1. Deploy new code
// 2. Restart workers
// 3. Verify Horizon is running
// 4. Run migrations
// 5. Monitor failed_jobs

php artisan queue:restart                    // Signal workers to reload
php artisan horizon:terminate                // Graceful Horizon restart
php artisan horizon                          // Start Horizon with new code
sleep(5)                                     // Wait for workers to start
php artisan migrate --force                  // Run schema changes
php artisan horizon:status                   // Verify Horizon is healthy
```

---

# Related Topics

- **K046 `$tries` and `$maxExceptions`** — Retry behavior during deploy transitions
- **K052 `WithoutOverlapping`** — Lock safety during worker restart
- **K055 `ShouldBeUnique`** — Unique lock safety across deploys
- **Database migration KUs** — Schema change patterns for zero-downtime
- **Laravel Forge/Envoyer** — Automated deployment with queue:restart hooks
