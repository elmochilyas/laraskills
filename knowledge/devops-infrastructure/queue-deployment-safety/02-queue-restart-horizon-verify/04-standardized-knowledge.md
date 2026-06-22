# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Queue Restart, Horizon Verification & Post-Deployment Monitoring |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Horizon, Laravel Queues, Supervisor, Deployment Strategies |
| Related KUs | Backward-Compatible Deployments, CI/CD Pipeline Structure, Observability Monitoring |
| Source | domain-analysis.md |

# Overview

A deployment is not complete when code reaches the server — it's complete when workers have picked up the new code, Horizon is healthy, queues are draining normally, and no failed jobs have appeared. The queue restart and Horizon verification process ensures zero-downtime worker updates and provides the post-deployment monitoring checklist to catch regressions within the critical first 15 minutes.

# Core Concepts

- **`php artisan queue:restart`**: Signals all `queue:work` daemon workers to gracefully exit after finishing their current job. The supervisor then restarts them, picking up the new code.
- **`php artisan horizon:terminate`**: Gracefully shuts down Horizon, allowing current jobs to finish before exiting. Supervisor restarts Horizon with the new code.
- **Graceful shutdown**: Workers complete their current job before exiting. No job is killed mid-processing.
- **Post-deploy verification window**: The first 15 minutes after deployment — monitor failed jobs, queue wait times, worker CPU/memory, and job throughput for regressions.
- **Supervisor auto-restart**: `autorestart=true` in supervisor config means workers automatically restart after exiting.
- **Config cache**: `php artisan config:cache` must be run before queue restart so workers pick up fresh configuration.

# When To Use

- Every production deployment that changes application code
- After any deployment that modifies queued job classes, event listeners, or service providers
- After configuration changes that affect queue workers
- During rollback procedures

# When NOT To Use

- For deployments that only change static assets (CSS, JS, images)
- For deployments that only add new routes without modifying queue workers
- In local development (Horizon's `--watch` mode auto-restarts)
- For read-only maintenance that doesn't change worker code

# Deployment Sequence

## Standard Deployment Sequence

```
1. Deploy new code to server
2. php artisan config:cache && php artisan route:cache
3. php artisan queue:restart                    (for queue:work daemons)
4. php artisan horizon:terminate                (for Horizon — supervisor restarts it)
5. Verify Horizon dashboard: all supervisors active
6. Monitor failed jobs for 15 minutes
7. Check Horizon "Recent Jobs" for unexpected failures
```

```bash
# Complete deployment script example
#!/bin/bash
set -e

echo "=== Deploying new code ==="
git pull origin main
composer install --no-dev --optimize-autoloader --no-interaction

echo "=== Building caches ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Restarting queue workers ==="
php artisan queue:restart

echo "=== Terminating Horizon ==="
php artisan horizon:terminate

echo "=== Running migrations ==="
php artisan migrate --force

echo "=== Waiting for Horizon to restart ==="
sleep 30

echo "=== Verifying Horizon health ==="
php artisan horizon:status
# Returns 0 if healthy, 1 if not

echo "=== Monitoring for 15 minutes ==="
# Automated monitoring script or manual checks
```

## What Each Command Does

### `php artisan queue:restart`

- Writes a timestamp to the cache.
- Each `queue:work` daemon checks this timestamp between jobs.
- If the timestamp is newer than the worker's start time, the worker exits with status 0 after finishing its current job.
- Supervisor detects the exit and restarts the worker with fresh code.
- Does NOT kill running jobs — the current job completes before exit.

### `php artisan horizon:terminate`

- Equivalent to `queue:restart` but for Horizon-managed workers.
- Horizon receives the signal, waits for all current jobs to complete, then exits.
- Supervisor configuration (`autorestart=true`) restarts Horizon automatically.
- More graceful than killing the Horizon process — ensures no job loss.

### Why Restart BOTH `queue:work` and Horizon?

If you use Horizon for some queues and `queue:work` daemons for others, both need restarting. Running both commands is safe — each only affects the workers it manages. If you only use Horizon, `horizon:terminate` alone is sufficient.

# Horizon Supervisor Verification

After `horizon:terminate` and supervisor auto-restart, verify Horizon is healthy:

## What to Check in the Horizon Dashboard

| Check | Expected | Action if Failing |
|-------|----------|-------------------|
| All supervisors active | Status is "Active" with green indicator | Check supervisor logs; check `config/horizon.php` for errors |
| Worker count matches config | Each supervisor has the configured number of workers | Supervisor may not have restarted; check `supervisorctl status` |
| Correct queues are assigned | Workers match their queue assignments | Check `config/horizon.php` supervisor `queue` configuration |
| Auto-balancing is working | Horizontally scaled workers show balanced loads | Check Redis connection; Horizon may not be sharing load info |
| No "Master Supervisor" errors | No red indicators on supervisor list | Check Redis connection; Horizon may be unable to coordinate |

```bash
# CLI verification
php artisan horizon:status        # Returns exit code 0 if healthy
php artisan horizon:list          # List all supervisors and their statuses
php artisan horizon:supervisors   # Show active supervisors with worker counts
```

## Supervisor Configuration Verification

```ini
# /etc/supervisor/conf.d/horizon.conf
[program:horizon]
process_name=%(program_name)s
command=php /var/www/html/artisan horizon
autostart=true
autorestart=true           # CRITICAL — must be true for auto-restart
stopwaitsecs=3600          # Max time to wait for jobs to complete (match longest job timeout)
stopasgroup=true           # Kill child processes when stopping
user=forge
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/horizon.log
```

Run `supervisorctl reread && supervisorctl update` after changing supervisor config.

## Verification Commands

```bash
# Check supervisor status
supervisorctl status horizon

# Restart Horizon manually (if needed)
supervisorctl restart horizon

# Check worker processes
ps aux | grep horizon
ps aux | grep "queue:work"
```

# Post-Deploy Monitoring Checklist

The critical window is the first 15 minutes after deployment. Monitor these metrics:

| Metric | Expected | Alert If | Check Using |
|--------|----------|-----------|-------------|
| Failed job count | 0 | Any failed jobs in the first 5 minutes | Horizon "Failed Jobs" dashboard |
| Queue wait times | Return to normal within 1-2 min | Wait time exceeds baseline by 2x for > 5 min | Horizon "Queue" dashboard |
| Worker CPU usage | Within normal range (e.g., < 50%) | Sustained spike above 80% | Server monitoring or Horizon metrics |
| Worker memory usage | Stable or within normal range | Steady increase (potential memory leak) | Server monitoring |
| Job throughput (jobs/min) | Within 10% of pre-deploy baseline | 50% drop from baseline | Horizon "Metrics" dashboard |
| Exception rate | Within normal range | Spike > 2x baseline | Sentry/Bugsnag or application logs |
| Stripe API errors | None | Any rate limit errors or auth errors | Error tracking + Stripe dashboard |

## Monitoring Script Example

```php
// App\Console\Commands\PostDeployMonitor.php
class PostDeployMonitor extends Command
{
    protected $signature = 'deploy:monitor {--duration=15}';
    protected $description = 'Monitor system health for N minutes after deploy';

    public function handle(): int
    {
        $duration = (int) $this->option('duration');
        $endTime = now()->addMinutes($duration);

        $this->info("Monitoring for {$duration} minutes...");

        while (now()->lessThan($endTime)) {
            $failedJobs = DB::table('failed_jobs')
                ->where('failed_at', '>=', now()->subMinutes(5))
                ->count();

            if ($failedJobs > 0) {
                $this->error("ALERT: {$failedJobs} failed jobs in the last 5 minutes!");
                // Trigger alert (Slack, PagerDuty, etc.)
            }

            $horizonStatus = Artisan::call('horizon:status');
            if ($horizonStatus !== 0) {
                $this->error("ALERT: Horizon is not healthy!");
            }

            sleep(60); // Check every minute
        }

        $this->info('Monitoring complete. No critical issues detected.');
        return self::SUCCESS;
    }
}
```

# Rollback Procedure

If failed jobs spike after deployment:

```
1. Identify the failure — check Horizon "Failed Jobs" for the exception type
2. If root cause is the new code → rollback immediately
3. Rollback steps:
   a. Deploy previous code revision (git checkout {previous-commit})
   b. composer install --no-dev --optimize-autoloader
   c. php artisan config:cache && php artisan route:cache
   d. php artisan queue:restart && php artisan horizon:terminate
4. Wait for workers to restart with old code
5. Retry failed jobs:
   php artisan queue:retry all --queue=billing
6. Monitor for 15 minutes to confirm recovery
7. Investigate root cause before re-deploying
```

# Phased Migrations for Large Tables

For database migrations on large tables that would cause deployment downtime, use background migration queues:

```bash
# Run migration in the background
php artisan queue:work --queue=migrations --daemon

# Migration job example
class MigrateSubscriptionData implements ShouldQueue
{
    public function handle(): void
    {
        // Process in chunks to avoid locking the table
        Invoice::whereNull('stripe_charge_id')
            ->chunk(500, function ($invoices) {
                foreach ($invoices as $invoice) {
                    // Migrate data in small batches
                    $invoice->update([
                        'stripe_charge_id' => $invoice->extractChargeId(),
                    ]);
                }
                sleep(1); // Pause between chunks to reduce database load
            });
    }
}
```

Use a dedicated `migrations` queue so background migration jobs don't compete with user-facing billing or application jobs.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Skipping post-deploy monitoring | Deploying and walking away | Failed jobs accumulate for hours before detection | Always monitor for 15 minutes; set automated alerts for longer windows |
| Not verifying Horizon after terminate | Assuming supervisor always restarts correctly | Workers are down, queues pile up, no one notices until users report | Always run `php artisan horizon:status` after deployment |
| Using `php artisan horizon:terminate` without `autorestart=true` | Supervisor config is missing or has `autorestart=false` | Horizon stops and never restarts | Verify supervisor config before deployment |
| Killing Horizon process instead of terminating | Using `kill` or `supervisorctl stop` | Jobs mid-processing are lost; they may be retried based on `--tries` config | Always use `horizon:terminate` for graceful shutdown |
| Not running config:cache before queue restart | Workers restart with stale config | Workers use old config values; new config changes never take effect | Always `config:cache` before any worker restart |
| Monitoring only failed job count, not failed job types | A spam of the same job class failure looks like a count spike but is one bug | Missing that a single job class is failing repeatedly with the same error | Monitor both count AND classification — one bug job failing 100x is different from 100 different bugs |

# Anti-Patterns

- **"Deploy and forget"**: Deploying code then immediately moving on to the next task. The first 15 minutes after deploy are when most regressions surface. Stay and monitor.
- **Skipping Horizon health checks because "it always works"**: Supervisor config changes, Redis connection issues, or a bad deploy can silently break Horizon. Always verify.
- **Using `sudo kill` on Horizon processes**: This hard-kills mid-job processing. Always use `horizon:terminate` and let supervisor handle the restart.
- **Deploying without `autorestart=true` in supervisor**: If the supervisor config doesn't auto-restart, `horizon:terminate` stops workers permanently until manual intervention.

# Related Topics

- **Prerequisites**: Laravel Horizon, Supervisor, Deployment Basics
- **Closely Related**: Backward-Compatible Deployments, CI/CD Pipeline Structure, Observability Monitoring
- **Advanced**: Automated post-deploy canary analysis, Blue-green worker orchestration, Supervisor event hooks for deployment automation

# AI Agent Notes

- When writing deployment scripts, the sequence order matters: config:cache BEFORE queue:restart. Workers restart, load config, and if cache is stale they use old values.
- `horizon:terminate` takes time — the `stopwaitsecs` in supervisor config determines how long supervisor waits for jobs to complete. Set this to match your longest job timeout (e.g., 3600 for 1-hour jobs).
- If you're deploying to multiple servers, run queue:restart on ALL servers that run workers. A missed server continues running old code and may produce inconsistent behavior.
- The post-deploy monitoring script (`deploy:monitor`) should be non-blocking. Run it in the background and alert via Slack/PagerDuty, don't hold up the deployment pipeline.
- Always test `horizon:terminate` flow in staging before executing in production. A misconfigured supervisor means the first time you discover the bug is during a production deployment.

# Verification

- [ ] Deployment sequence documented and tested in staging
- [ ] `php artisan queue:restart` runs as part of every code deployment
- [ ] `php artisan horizon:terminate` runs for Horizon deployments
- [ ] Supervisor config has `autorestart=true` and appropriate `stopwaitsecs`
- [ ] `php artisan config:cache` runs before any queue restart
- [ ] Post-deploy monitoring covers: failed jobs, queue wait times, worker CPU/memory, job throughput
- [ ] Horizon dashboard verified after every deployment (all supervisors active, correct workers)
- [ ] Rollback procedure documented and tested
- [ ] Failed job alerts configured (Slack, PagerDuty, email)
- [ ] Phased migration strategy in place for large-table migrations
- [ ] Monitoring script (`deploy:monitor`) runs automatically after each production deploy
