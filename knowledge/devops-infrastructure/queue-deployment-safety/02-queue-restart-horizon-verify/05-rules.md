# Rules — Queue Restart, Horizon Verification & Post-Deployment Monitoring

## Rule 1: Always Run config:cache Before queue:restart
| Field | Value |
|-------|-------|
| **Name** | Always Run config:cache Before queue:restart |
| **Category** | Deployment Ordering |
| **Rule** | `php artisan config:cache` must run before `php artisan queue:restart` or `php artisan horizon:terminate` in every deployment. Workers restart, load configuration, and if the config cache is stale, they continue using pre-deploy configuration values. The correct sequence is: config:cache → queue:restart → horizon:terminate. |
| **Reason** | Queue workers load configuration during bootstrap. If you restart workers before re-caching config, they load the stale cached config (from the previous deploy). New config values (queue topology changes, API keys, feature flags, retry settings) never take effect. Conversely, if you cache config after restart, the new workers have already booted with stale config — the cache is fresh but unused. Caching first ensures workers pick up new configuration on their next boot. |
| **Bad Example** | ```bash
php artisan queue:restart
php artisan horizon:terminate
php artisan config:cache # Too late — workers already restarted with stale config
``` |
| **Good Example** | ```bash
php artisan config:cache
php artisan route:cache
php artisan queue:restart
php artisan horizon:terminate
# Workers restart, load fresh config cache
``` |
| **Exceptions** | Deployments that don't change any configuration values (code-only deploys). Still, running config:cache is fast and safe — prefer to always include it in the deployment script. |
| **Consequences Of Violation** | Workers run with stale configuration indefinitely. Changed API keys cause authentication failures on external services. Modified queue topology is not applied — new queues not picked up, rebalanced supervisors not reflected. Feature flag changes in config don't take effect. Horizontal scaling changes (worker count adjustments) silently ignored. |

## Rule 2: Never Force-Kill Queue Workers — Always Use Graceful Shutdown
| Field | Value |
|-------|-------|
| **Name** | Never Force-Kill Queue Workers — Always Use Graceful Shutdown |
| **Category** | Data Integrity |
| **Rule** | Never use `kill -9`, `pkill -9`, `supervisorctl stop` (without graceful wait), or container orchestrator force-stop on queue worker processes. Always use `php artisan queue:restart` (for `queue:work` daemons) or `php artisan horizon:terminate` (for Horizon). These commands signal workers to finish their current job before exiting — no job is killed mid-execution. |
| **Reason** | A force-killed worker loses the current job mid-execution. Database transactions are rolled back (depending on your `DB::transaction()` usage), but external side effects (Stripe API calls, emails sent, cache writes) may have already occurred. The job may or may not be retried depending on the `--tries` configuration and whether the job had already marked itself as attempted. In billing systems, a half-processed Stripe webhook is particularly dangerous — the database transaction may have rolled back (the subscription wasn't updated), but a Stripe API call to create an invoice may have succeeded. This creates state divergence with no record of what happened. |
| **Bad Example** | ```bash
supervisorctl stop horizon # Hard stop, jobs killed mid-execution
kill -9 $(pgrep -f "queue:work") # Force kill — no chance to finish
``` |
| **Good Example** | ```bash
php artisan queue:restart # Workers exit after current job completes
php artisan horizon:terminate # Horizon exits gracefully, supervisor restarts
``` |
| **Exceptions** | Emergency situations where the worker process is hung (frozen, not responding to signals) and must be forcefully terminated. After force-killing, immediately check the failed jobs table and run reconciliation. |
| **Consequences Of Violation** | Lost or partially-processed billing webhooks. Subscription state divergence between database and Stripe. Jobs show as "attempted" but their side effects are incomplete. Failed jobs table may not even have a record of the job because the worker was killed before it could write to `failed_jobs`. Manual reconciliation required for every affected job. |

## Rule 3: Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment
| Field | Value |
|-------|-------|
| **Name** | Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment |
| **Category** | Post-Deployment Verification |
| **Rule** | After every production deployment that changes application code, actively monitor the failed jobs table for a minimum of 15 minutes. Check at 5-minute intervals. Any new failed jobs in this window indicate a serialization compatibility issue, a configuration mismatch, or a newly introduced bug in queue processing. Do not deploy and walk away. |
| **Reason** | Most deployment-related job failures appear within the first few minutes as workers restart and pick up jobs queued before the deploy. These failures are often silent — no exception is thrown to the user, no HTTP 500 appears. The only evidence is the failed_jobs table growing. The 15-minute window catches: (1) serialization failures from class renames, (2) configuration changes breaking job logic, (3) new code exceptions triggered by payloads from old code, and (4) database schema mismatches. Catching these immediately allows rollback before the backlog of failed jobs grows. |
| **Bad Example** | Deploy at 2 PM, move on to next task. At 6 PM, a support ticket: "Customer's payment didn't process." Check failed_jobs — 450 failed billing jobs accumulated over 4 hours. |
| **Good Example** | Automated monitoring script (`deploy:monitor`) that checks `failed_jobs` every 60 seconds for 15 minutes. If any failed job appears: fire a P1 alert, notify the deployer, and trigger rollback investigation. Alternatively, a manual checklist step verified by the deploying engineer. |
| **Exceptions** | Deployments with zero code changes to queue-related files (static assets only). Still, a quick check of failed jobs is cheap insurance. |
| **Consequences Of Violation** | Failed jobs accumulate silently for hours. Billing webhooks are lost — subscription state drifts. The incident is discovered by customers, not by the engineering team. Recovery requires retroactively replaying hours of failed jobs, which is slow and error-prone. Customer trust erodes. |

## Rule 4: Verify Horizon Health After Every Deployment
| Field | Value |
|-------|-------|
| **Name** | Verify Horizon Health After Every Deployment |
| **Category** | Post-Deployment Verification |
| **Rule** | After every deployment that includes `horizon:terminate`, verify that Horizon is healthy: all supervisors are active, worker counts match configuration, and queues are being processed. Use `php artisan horizon:status` (non-zero exit code = unhealthy) and `php artisan horizon:list` for detailed verification. Do not assume supervisor auto-restart succeeds. |
| **Reason** | Horizon can silently fail to restart. A bad supervisor configuration (syntax error in `horizon.php`), a Redis connection issue, or a supervisor daemon that crashed during the restart cycle can leave Horizon entirely down or partially degraded. Without verification, the team may not discover Horizon is down until customers report missing features hours later. The Horizon dashboard may also be inaccessible if the problem affects the Horizon HTTP listener. |
| **Bad Example** | Deploy script: `php artisan horizon:terminate`. No verification step. Supervisor configuration had `autorestart=false` — Horizon never restarted. Queue backlog discovered 3 hours later. |
| **Good Example** | ```bash
php artisan horizon:terminate
sleep 30 # Wait for supervisor to restart
php artisan horizon:status || { echo "Horizon unhealthy!"; exit 1; }
php artisan horizon:list # Visually verify supervisors and worker counts
``` |
| **Exceptions** | Deployments that don't involve queue workers (static assets, view changes). Still, a 2-second health check adds negligible time to the deploy. |
| **Consequences Of Violation** | Horizon is down for hours after deployment. All queued jobs pile up — webhook processing stops, email dispatch halts, report generation queues grow. Stripe webhook redelivery storms begin (Stripe retries failed deliveries). When Horizon is eventually restarted, it faces a massive backlog that takes hours to clear. Revenue-impacting delay on billing processing. |

## Rule 5: Set supervisor stopwaitsecs to Match Your Longest Job Timeout
| Field | Value |
|-------|-------|
| **Name** | Set supervisor stopwaitsecs to Match Your Longest Job Timeout |
| **Category** | Infrastructure Configuration |
| **Rule** | The supervisor configuration's `stopwaitsecs` value must be equal to or greater than the longest `timeout` configured on any Horizon supervisor for that process. If a job has a `timeout=600` (10 minutes), `stopwaitsecs` must be at least 600. Otherwise, supervisor will force-kill the worker while a long-running job is still processing. |
| **Reason** | When `horizon:terminate` is called, Horizon signals its workers to finish their current jobs and exit. Supervisor waits for `stopwaitsecs` seconds for the process to exit gracefully. If a worker is processing a job that takes longer than `stopwaitsecs`, supervisor sends a SIGKILL — the job is killed mid-execution. This defeats the purpose of graceful shutdown. The `stopwaitsecs` must accommodate the worst-case scenario: a job that reaches its full timeout duration. |
| **Bad Example** | Horizon supervisor configured with `timeout=600` (10 minutes), but `stopwaitsecs=60` in supervisor config. Any job running longer than 60 seconds is force-killed during deployment. |
| **Good Example** | Horizon supervisor: `timeout=600`. Supervisor config: `stopwaitsecs=600` (matching). Longest possible job (10 minutes) completes before supervisor force-kills. |
| **Exceptions** | If all your jobs have short timeouts (under 60 seconds), `stopwaitsecs=60` is sufficient. But as job complexity grows, the timeout and stopwaitsecs must grow together. Document this dependency. |
| **Consequences Of Violation** | Long-running jobs (large invoice generation, bulk data export, Stripe reconciliation) are killed mid-execution on every deployment. Database transactions roll back partially. Stripe API calls may have already succeeded while the local database update was rolled back — billing state divergence. The job is retried (if tries remain), and may be killed again on the next deploy — a cycle of partial execution. |
