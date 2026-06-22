# Anti-Patterns for Queue Restart, Horizon Verification & Post-Deployment Monitoring

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Queue Restart, Horizon Verification & Post-Deployment Monitoring |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-QRH-001 | Config:cache After queue:restart | High | Medium |
| AP-QRH-002 | Force-Killing Workers Instead of Graceful Shutdown | Critical | Medium |
| AP-QRH-003 | Deploy and Forget (No Post-Deploy Monitoring) | High | High |
| AP-QRH-004 | Skipping Horizon Health Check | High | Medium |
| AP-QRH-005 | stopwaitsecs Shorter Than Longest Job Timeout | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-QDS-001 (Kill -9 on Queue Workers) — from Queue Deployment Safety
- AP-QDS-005 (Deploy and Forget) — from Queue Deployment Safety

---

## AP-QRH-001: Config:cache After queue:restart

### Category
Deployment Ordering | Configuration

### Description
Running `php artisan config:cache` after `php artisan queue:restart`. Workers restart and load the stale cached config from the previous deploy. New config values (API keys, queue topology, feature flags) never take effect until the next restart.

### Why It Happens
- The deployment script has the steps in the wrong order
- The developer doesn't know that workers load config during bootstrap
- Config:cache is treated as a "cleanup" step rather than a pre-restart step
- Copy-paste from a deployment script with incorrect ordering

### Warning Signs
- Deployment script: `queue:restart` → `config:cache` (wrong order)
- New config values don't take effect after deployment
- Workers use old API keys or old queue names after deploy
- Feature flag changes in config don't take effect

### Why Harmful
Workers load configuration during bootstrap. If they restart before `config:cache` runs, they load the stale cached config. The new config is cached but unused — workers won't pick it up until the next restart. This means new API keys cause authentication failures, new queue topology is not applied, and feature flag changes don't take effect. The deployment appears to succeed but the new configuration is silently ignored.

### Real-World Consequences
- A team deploys new Stripe API keys via a config change. The deployment script runs `queue:restart` first, then `config:cache`. Workers restart and load the old cached config with the old Stripe keys. All Stripe API calls fail with authentication errors. The new keys are in the cache but workers won't use them until the next restart. The team must run `queue:restart` again after `config:cache` — a second deployment step that was supposed to be unnecessary.

### Preferred Alternative
Always run `config:cache` before `queue:restart` or `horizon:terminate`. The correct sequence: deploy code → migrations → `config:cache` → `route:cache` → `queue:restart` → `horizon:terminate`. Workers restart and load the fresh cached config.

### Refactoring Strategy
1. Review the deployment script for the order of `config:cache` and `queue:restart`.
2. Move `config:cache` before `queue:restart` if it's after.
3. Test: change a config value, deploy, verify workers use the new value.
4. Document the correct sequence in the deployment runbook.

### Detection Checklist
- [ ] Deployment script runs `config:cache` after `queue:restart`
- [ ] New config values don't take effect after deployment
- [ ] Workers use old API keys or old queue names after deploy
- [ ] Feature flag changes in config don't take effect
- [ ] No documentation of the correct deployment sequence

### Related Rules
- Always Run config:cache Before queue:restart

---

## AP-QRH-002: Force-Killing Workers Instead of Graceful Shutdown

### Category
Data Integrity | Deployment

### Description
Using `kill -9`, `pkill`, `supervisorctl stop` (without graceful wait), or container force-stop to terminate queue workers during deployment. The current job is lost mid-execution — database transactions roll back, but external side effects (Stripe calls, emails) may have already occurred.

### Why It Happens
- Impatience: graceful shutdown takes time (workers finish current job)
- The developer doesn't know about `queue:restart` or `horizon:terminate`
- Container orchestrator sends SIGKILL with a short grace period
- A worker is hung and force-kill seems like the only option

### Warning Signs
- Deployment scripts use `kill -9`, `pkill`, or `supervisorctl stop` on workers
- No `queue:restart` or `horizon:terminate` in the deployment script
- Container orchestrator `stop_grace_period` is shorter than the longest job timeout
- Intermittent billing state issues after deployments

### Why Harmful
A force-killed worker loses the current job mid-execution. In billing systems, a half-processed Stripe webhook means the database transaction rolled back (subscription not updated) but a Stripe API call may have succeeded — state divergence with no record. The job may or may not be retried depending on `tries` config and whether the job had marked itself as attempted.

### Real-World Consequences
- A Kubernetes deployment terminates a Horizon pod with a 30-second grace period. A webhook processing job has a 60-second timeout. At 30 seconds, Kubernetes sends SIGKILL. The job is mid-processing: it has fetched the subscription from the database and called Stripe's API to update the payment method, but hasn't yet updated the local database. The SIGKILL terminates the process. The local database still shows the old payment method. Stripe shows the new one. The customer's next payment fails because the local system tries to charge the old (expired) card.

### Preferred Alternative
Always use `php artisan queue:restart` (for `queue:work` daemons) or `php artisan horizon:terminate` (for Horizon). These signal workers to finish their current job before exiting. For container orchestrators, set `stop_grace_period` / `terminationGracePeriodSeconds` to exceed the longest job timeout.

### Refactoring Strategy
1. Search deployment scripts for `kill`, `pkill`, `supervisorctl stop` on worker processes.
2. Replace with `queue:restart` or `horizon:terminate`.
3. For containers, set `terminationGracePeriodSeconds` to exceed the longest job timeout.
4. Test the graceful shutdown flow in staging.

### Detection Checklist
- [ ] Deployment scripts use `kill -9` or `pkill` on worker processes
- [ ] No `queue:restart` or `horizon:terminate` in the deployment script
- [ ] Container `stop_grace_period` shorter than longest job timeout
- [ ] Intermittent billing state issues after deployments
- [ ] Workers killed mid-job during deployment

### Related Rules
- Never Force-Kill Queue Workers — Always Use Graceful Shutdown

---

## AP-QRH-003: Deploy and Forget (No Post-Deploy Monitoring)

### Category
Operations | Post-Deployment

### Description
Deploying code and immediately moving on without monitoring the system for regressions. The first 15 minutes after deploy are when most serialization failures, config mismatches, and new bugs surface. Without monitoring, failures accumulate for hours.

### Why It Happens
- The deploy script doesn't include a monitoring step
- The developer trusts the test suite and doesn't expect failures
- No automated post-deploy monitoring tool exists
- "Deploy and move on" culture

### Warning Signs
- No post-deploy monitoring step in the deployment script
- Failed jobs discovered hours after deployment by customer reports
- No `deploy:monitor` or equivalent command
- No alerting on failed job count after deployment
- Deploying engineer leaves immediately after deploy

### Why Harmful
Most deployment-related job failures appear within the first few minutes as workers restart and pick up old-serialized jobs. These failures are silent — no HTTP 500, no user-facing error. The only evidence is the failed_jobs table growing. Without monitoring, the team discovers the issue hours later when customers report billing problems. Recovery requires retroactively replaying hours of failed jobs.

### Real-World Consequences
- A team deploys at 2 PM and moves on. At 6 PM, support reports "customer's payment didn't process." The team checks failed_jobs: 450 failed billing jobs accumulated over 4 hours. Root cause: a class rename without transition alias. 450 webhooks need manual replay. 4 hours of billing state is inconsistent. Multiple customers were charged by Stripe but their local subscriptions weren't updated. The team works until midnight reconciling state.

### Preferred Alternative
After every deployment, monitor failed jobs for 15 minutes. Use an automated `deploy:monitor` command that checks failed_jobs every 60 seconds and alerts via Slack/PagerDuty. The deploying engineer stays for 15 minutes. Any failure spike triggers rollback investigation.

### Refactoring Strategy
1. Create a `deploy:monitor` artisan command that checks failed_jobs for 15 minutes.
2. Add it to the deployment script as the final step.
3. Configure alerts (Slack, PagerDuty) for failed job spikes.
4. Make post-deploy monitoring mandatory — the deploying engineer must stay.

### Detection Checklist
- [ ] No post-deploy monitoring step in the deployment script
- [ ] Failed jobs discovered hours after deployment
- [ ] No `deploy:monitor` or equivalent command
- [ ] No alerting on failed job count after deployment
- [ ] Deploying engineer leaves immediately after deploy

### Related Rules
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment

---

## AP-QRH-004: Skipping Horizon Health Check

### Category
Operations | Post-Deployment

### Description
Running `horizon:terminate` and assuming supervisor auto-restart succeeds without verifying. A bad supervisor config, Redis connection issue, or `horizon.php` syntax error can leave Horizon entirely down. Without verification, the team discovers the issue hours later.

### Why It Happens
- "It always works" — the team has never seen Horizon fail to restart
- The deployment script doesn't include a verification step
- No awareness that supervisor auto-restart can fail
- Time pressure: verification adds 30 seconds to the deploy

### Warning Signs
- No `horizon:status` or `horizon:list` in the deployment script
- No dashboard check after deployment
- Horizon discovered down hours after deployment by customer reports
- Supervisor config with `autorestart=false` or missing `stopwaitsecs`

### Why Harmful
Horizon can silently fail to restart. A syntax error in `horizon.php`, a Redis connection issue, or a supervisor daemon that crashed during restart can leave Horizon entirely down. All queued jobs pile up — webhook processing stops, notification dispatch halts. When Horizon is eventually restarted, it faces a massive backlog that takes hours to clear.

### Real-World Consequences
- A team deploys a change to `config/horizon.php` with a syntax error (missing comma). They run `horizon:terminate`. Supervisor tries to restart Horizon, but the syntax error causes it to crash immediately. Supervisor retries, crashes again, gives up. Horizon is down. The team doesn't notice — they didn't verify. Three hours later, a customer reports "my subscription is still pending." The team checks Horizon: it's down. 500 webhooks have piled up. Recovery takes 2 hours of processing the backlog.

### Preferred Alternative
After `horizon:terminate`, wait 30 seconds, then run `php artisan horizon:status`. If exit code is non-zero, investigate immediately. Check `supervisorctl status horizon`. Check Horizon dashboard for all supervisors active with correct worker counts.

### Refactoring Strategy
1. Add `php artisan horizon:status` to the deployment script after `horizon:terminate`.
2. Add a sleep 30 before the check to allow supervisor to restart.
3. If the check fails, alert the deploying engineer and halt the deployment.
4. Test in staging: introduce a syntax error in `horizon.php` and verify the check catches it.

### Detection Checklist
- [ ] No `horizon:status` or `horizon:list` in the deployment script
- [ ] No Horizon dashboard check after deployment
- [ ] Horizon discovered down hours after deployment
- [ ] Supervisor config with `autorestart=false`
- [ ] "It always works" attitude toward Horizon restarts

### Related Rules
- Verify Horizon Health After Every Deployment

---

## AP-QRH-005: stopwaitsecs Shorter Than Longest Job Timeout

### Category
Infrastructure Configuration | Data Integrity

### Description
Supervisor configuration's `stopwaitsecs` is set lower than the longest job `timeout` on any Horizon supervisor. When `horizon:terminate` is called, supervisor waits `stopwaitsecs` for the worker to exit. If a job takes longer, supervisor sends SIGKILL — the job is killed mid-execution.

### Why It Happens
- The default `stopwaitsecs` in many supervisor configs is 60 seconds
- The developer increased a job timeout to 600 seconds without updating `stopwaitsecs`
- No awareness of the relationship between `timeout` and `stopwaitsecs`
- Copy-paste from a template with short `stopwaitsecs`

### Warning Signs
- `stopwaitsecs=60` in supervisor config with job `timeout=600`
- Long-running jobs killed during deployment
- Intermittent "job processing incomplete" errors after deployments
- Jobs that should complete in 5+ minutes fail during deploy windows

### Why Harmful
During `horizon:terminate`, Horizon signals workers to finish their current job and exit. Supervisor waits `stopwaitsecs` for the process to exit. If a worker is processing a job that takes longer than `stopwaitsecs`, supervisor sends SIGKILL — defeating the purpose of graceful shutdown. The job is killed mid-execution: database transactions roll back, external side effects may have occurred.

### Real-World Consequences
- A team configures a billing reconciliation job with `timeout=600` (10 minutes). The supervisor config has `stopwaitsecs=60`. During a deployment, `horizon:terminate` is called. A reconciliation job is 3 minutes into processing. Supervisor waits 60 seconds, then sends SIGKILL. The job is killed mid-reconciliation: some subscriptions were synced, others weren't. The local database is in a partially-reconciled state. The job is retried, but the partial state causes confusing errors on the next attempt.

### Preferred Alternative
Set `stopwaitsecs` to match or exceed the longest `timeout` across all Horizon supervisors. If a job has `timeout=600`, set `stopwaitsecs=600` or higher. Document this dependency. When increasing a job's timeout, update `stopwaitsecs` in the same change.

### Refactoring Strategy
1. List all Horizon supervisors and their `timeout` values.
2. Find the maximum timeout.
3. Set `stopwaitsecs` in supervisor config to exceed the maximum timeout.
4. Document the dependency: "When changing job timeout, update stopwaitsecs."
5. Test: run a long job, call `horizon:terminate`, verify the job completes before the worker exits.

### Detection Checklist
- [ ] `stopwaitsecs` in supervisor config is less than the longest job `timeout`
- [ ] Long-running jobs killed during deployment
- [ ] Intermittent "job processing incomplete" errors after deploy
- [ ] No documentation of the `timeout` / `stopwaitsecs` dependency
- [ ] `stopwaitsecs` not updated when job timeouts are increased

### Related Rules
- Set supervisor stopwaitsecs to Match Your Longest Job Timeout
