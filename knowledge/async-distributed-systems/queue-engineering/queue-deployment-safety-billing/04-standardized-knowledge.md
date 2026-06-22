# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Queue deployment safety and worker lifecycle |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Queues, Horizon, Deployment pipelines, Database migrations |
| Related KUs | Webhook queue design, Billing queue topology, After-commit events and jobs |
| Source | domain-analysis.md |

# Overview

Deploying code changes to a system with active queue workers requires careful ordering: deploy code before destructive schema changes, restart workers with `queue:restart`, verify Horizon supervisor configuration, and monitor failed jobs after deployment. Serialized job payloads from old code can break when deserialized by new code — renamed classes, removed constructor parameters, or changed model relationships all cause deserialization failures. In billing systems, a failed job during deployment can mean a missed Stripe webhook, a lost invoice, or an unsent notification. Plan your deployment to keep workers running safely during and after schema changes.

# Core Concepts

- **Deploy code before destructive schema changes**: Old queue workers must still be able to process jobs with the post-deployment schema. Add nullable columns before removing old ones. Add new tables before dropping old ones.
- **Serialized job payload compatibility**: When a job class is renamed, any jobs serialized with the old class name fail to deserialize. Mitigation: keep old class as an alias extending the new class, or add a deployment transition phase where both old and new jobs can coexist.
- **`php artisan queue:restart`**: Signals workers to restart gracefully after finishing their current job. Does NOT kill running jobs mid-execution. Each worker checks a `illuminate:queue:restart` cache key between jobs.
- **`php artisan horizon:terminate`**: Immediately terminates all Horizon workers and the Horizon supervisor process. Workers finish current jobs. Supervisor restarts workers with new code.
- **Post-deploy monitoring**: Watch the failed jobs table for 15 minutes after deployment. Any spike in failures indicates a serialization or compatibility issue.
- **Feature flags for risky changes**: Use Laravel Pennant or env-based feature flags to gate new billing behavior. Enable gradually, not all at once on deploy.
- **Phased migrations for large tables**: Don't block deployment on million-row ALTER TABLE operations. Use batched migrations, queue the data migration, or use tools like `pt-online-schema-change` for MySQL.
- **Config and route cache**: Run `php artisan config:cache && php artisan route:cache` after every production deploy.

# When To Use

- Every production deployment to a system with active queue workers
- Before any schema change that modifies columns, tables, or constraints used by queued jobs
- Before renaming or refactoring job classes, models, or events referenced in serialized payloads
- When deploying infrastructure changes (Redis migration, queue driver switch)
- When scaling Horizon supervisors (adding/removing workers)

# When NOT To Use

- For deployments that don't change code processed by queue workers (static assets only)
- For deployments to environments without active queue workers (dev, local)
- When the deployment system already handles queue worker lifecycle (Laravel Forge, Envoyer, Laravel Vapor handle restart automatically)

# Best Practices (WHY)

- **Deploy code, then run migrations, then restart workers**: Reason: Workers running old code should see the new schema (nullable columns are safe). Workers running new code see new schema. The reverse order (migrations before code deploy) causes old workers to break on new schema constraints.
- **Add nullable columns; don't remove columns immediately**: Reason: Old job payloads may reference columns that the new code doesn't need. Keep columns for one deployment cycle, then remove in the next deploy.
- **Monitor failed jobs for 15 minutes post-deploy**: Reason: Most serialization failures appear within the first few minutes as workers pick up jobs queued before the deploy. Catch them before they accumulate.
- **Use feature flags for risky billing changes**: Reason: If the new billing code has a bug, you can disable it via flag without rolling back the entire deploy. Isolate the blast radius.
- **Never kill workers mid-billing-job**: Reason: A half-processed Stripe webhook results in billing state divergence. Always let `queue:restart` finish gracefully.
- **Keep old job class as alias when renaming**: Reason: Jobs serialized with the old class name can still be deserialized. The old class simply extends the new one.

# Architecture Guidelines

- **Deployment order**: (1) Deploy new code, (2) Run `php artisan migrate`, (3) Run `php artisan queue:restart` or `php artisan horizon:terminate`, (4) Run `php artisan config:cache && php artisan route:cache`, (5) Monitor failed jobs for 15 minutes.
- **Schema change compatibility**: Add nullable columns in deploy N. Populate them with a background job. Remove old columns in deploy N+1. Never drop a column that serialized jobs reference.
- **Class rename transition**: Deploy N: create new class, keep old class as alias. Deploy N+1: remove old class after all existing jobs have been processed or failed.
- **Horizon supervisor verification**: After deploy, verify `config/horizon.php` matches the running supervisor configuration. `php artisan horizon:publish` may need to be re-run.
- **Blue-green deployment**: Blue environment has old workers on old code. Green environment has new workers on new code. After green is healthy, drain blue's queue before terminating.

# Performance Considerations

- `queue:restart` is instant (sets a cache key). Workers check the key on their next iteration (after current job + `sleep` delay). Workers restart within `sleep` seconds after finishing current job.
- `horizon:terminate` may take up to `timeout` seconds if a job is long-running. The terminate signal waits for the current job to finish.
- Config/route caching reduces application boot time for workers. Uncached config adds ~50-200ms to each job's startup time.
- Migrations that run while workers are active must not lock tables for extended periods. Use non-blocking migration strategies for large tables.

# Security Considerations

- Feature flags controlling billing behavior must be auditable. Log every flag change with the actor and timestamp.
- Queue restart signals should not be triggerable by unauthenticated requests. The `queue:restart` command should only be run during deployment, never exposed via HTTP.
- The failed jobs table may contain serialized model data. Restrict access to the Horizon dashboard and `queue:failed` command output.
- Worker restarts during a deployment should not invalidate active sessions or user tokens (workers are backend processes, not user sessions).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running destructive migrations before code deploy | CI/CD pipeline runs migrations first | Old workers crash trying to INSERT into columns that no longer exist | Deploy code first, then run migrations that add columns. Remove columns in the next deploy cycle |
| Renaming a job class without keeping an alias | Cleanup during refactoring | All jobs serialized with the old class name fail to deserialize permanently | Keep `OldJobName extends NewJobName {}` as an empty class for one deployment cycle |
| Not monitoring failed jobs after deploy | Assumption that tests catch everything | Billing webhook failures accumulate silently; discovered days later | Add post-deploy monitoring step: check failed_jobs table after 5, 10, 15 minutes |
| Killing workers with `pkill` or `supervisorctl stop` mid-job | Impatience during deployment | Half-processed Stripe webhook; subscription state in database diverges from Stripe | Always use `queue:restart` or `horizon:terminate` which wait for current job completion |
| Not clearing config cache after deploy | Forgotten step in deploy script | Workers use stale configuration (old queue topology, old API keys, old feature flags) | `php artisan config:cache` always runs after `php artisan migrate` in deployment |
| Deploying without feature flags for risky billing code | Full rollout on deploy | Bug in new billing code affects all customers simultaneously | Gate new billing behavior behind `Pennant::feature('new-billing-flow')`; enable for 1% then gradually increase |

# Anti-Patterns

- **Kill -9 on queue workers**: Force-killing workers with `pkill -9`. The current job is lost mid-execution with no retry and no record of failure.
- **Migrations before code deploy**: CI pipeline runs `php artisan migrate` then deploys code. Old workers referencing old columns break on the new schema. Always deploy code first.
- **Direct class rename without alias**: Renaming `ProcessStripeWebhook` to `HandleStripeEvent` without keeping `ProcessStripeWebhook extends HandleStripeEvent {}`. All queued instances of the old job class fail permanently.
- **`queue:restart` exposed via HTTP**: A `/api/queue/restart` endpoint. Attackers can disrupt the entire queue system. `queue:restart` is a CLI-only maintenance command.
- **No post-deploy monitoring**: Deploy and walk away. Failed jobs accumulate for hours or days before anyone notices. Always check `queue:failed` after deploy.

# Examples

**Deployment script with proper ordering**
```bash
#!/bin/bash
set -e

echo "=== Phase 1: Deploy code ==="
git pull origin main
composer install --no-dev --optimize-autoloader --no-interaction

echo "=== Phase 2: Run reversible migrations ==="
php artisan migrate --force

echo "=== Phase 3: Cache configuration and routes ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "=== Phase 4: Restart queue workers ==="
php artisan queue:restart

# Or for Horizon:
php artisan horizon:terminate

echo "=== Phase 5: Monitor failed jobs ==="
for i in 5 10 15; do
    sleep $((i * 60))
    FAILED_COUNT=$(php artisan queue:failed | grep -c "|")
    if [ "$FAILED_COUNT" -gt 0 ]; then
        echo "WARNING: $FAILED_COUNT failed jobs detected $i minutes after deploy"
        php artisan queue:failed
    fi
done

echo "=== Deployment complete ==="
```

**Safe class rename: keep alias for one deploy cycle**
```php
// New class (deploy N)
namespace App\Jobs\Billing;

class HandleStripeWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private readonly string $stripeEventId,
    ) {}

    public function handle(): void
    {
        // New implementation
    }
}

// Keep old class as alias (deploy N)
// This prevents deserialization failures for jobs queued before the rename
namespace App\Jobs\Billing;

class ProcessStripeWebhook extends HandleStripeWebhook
{
    // Empty — just an alias for deserialization compatibility
    // Remove this class in deploy N+1 after all old jobs have been processed
}
```

**Safe column removal: phased across two deploys**
```php
// Deploy N: Add new nullable column, keep old column
Schema::table('subscriptions', function (Blueprint $table) {
    $table->string('new_status')->nullable()->after('status');
});

// Run a background job to populate new_status from status
// Do NOT drop 'status' yet — old job payloads still reference it

// Deploy N+1: Drop old column (after all old jobs are processed)
Schema::table('subscriptions', function (Blueprint $table) {
    $table->dropColumn('status');
    $table->renameColumn('new_status', 'status');
});
```

**Feature flag for risky billing change**
```php
use Laravel\Pennant\Feature;

class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(): void
    {
        $stripeEvent = StripeEvent::findOrFail($this->stripeEventId);

        if (Feature::active('new-subscription-sync')) {
            // New behavior: richer sync, may have bugs
            $this->syncSubscriptionV2($stripeEvent);
        } else {
            // Old behavior: proven, safe
            $this->syncSubscriptionV1($stripeEvent);
        }
    }
}
```

**Blue-green worker deployment strategy**
```bash
# Blue environment: old workers running old code
# Spawn green environment with new workers

# 1. Start green workers (new code, new supervisor)
php artisan horizon:terminate  # Blue workers gracefully stop
php artisan horizon             # Green workers start with new code

# 2. Verify green health
php artisan horizon:status

# 3. Drain blue queue (if any jobs remain)
php artisan queue:work --queue=webhooks,billing --stop-when-empty --env=blue

# 4. Decommission blue environment
```

# Related Topics

- Webhook queue design (dedicated webhook queue with idempotency)
- Billing queue topology (queue separation by concern)
- After-commit events and jobs (transaction safety for job dispatch)
- Laravel Forge / Envoyer (automated deployment with zero-downtime)
- Database migration strategies for large tables
- Feature flags with Laravel Pennant

# AI Agent Notes

- When generating deployment scripts or CI/CD pipelines for Laravel applications with queue workers, always include `queue:restart` or `horizon:terminate` after code deploy and migrations.
- When generating a class rename, always create the old class as an empty alias extending the new class. Include a comment noting it can be removed after one deployment cycle.
- When generating schema changes, always use the two-deploy cycle for column removals: add nullable + populate in deploy N, remove in deploy N+1.
- Never generate code that force-kills workers (`pkill`, `kill -9`, `supervisorctl stop` without graceful shutdown).
- When generating risky billing code, always gate it behind a feature flag with a safe fallback to the existing behavior.

# Verification

- [ ] Deployment script deploys code before running migrations
- [ ] Deployment script restarts queue workers after config cache
- [ ] All schema changes use phased approach (add column in N, remove in N+1)
- [ ] Renamed classes keep old class as alias for one deploy cycle
- [ ] Workers are restarted gracefully (`queue:restart` or `horizon:terminate`), not force-killed
- [ ] Post-deploy monitoring of failed jobs is automated or documented as manual step
- [ ] Risky billing changes are gated behind feature flags
- [ ] Config cache and route cache are refreshed on every deploy
- [ ] Blue-green or rolling deployment strategy is documented for production
- [ ] Horizon supervisor configuration is verified after deploy
- [ ] No synchronous HTTP endpoints trigger `queue:restart`
