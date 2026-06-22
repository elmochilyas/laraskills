# Anti-Patterns for Queue Deployment Safety

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Queue Deployment Safety and Worker Lifecycle |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-QDS-001 | Kill -9 on Queue Workers | Critical | Medium |
| AP-QDS-002 | Migrations Before Code Deploy | Critical | Medium |
| AP-QDS-003 | Direct Class Rename Without Alias | High | Medium |
| AP-QDS-004 | queue:restart Exposed via HTTP | Critical | Low |
| AP-QDS-005 | Deploy and Forget | High | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-AC-001 (Stripe Charge Inside Transaction) — from After-Commit Events
- AP-WQD-005 (Infinite Retries on Webhook Jobs) — from Webhook Queue Design

---

## AP-QDS-001: Kill -9 on Queue Workers

### Category
Data Integrity | Deployment

### Description
Force-killing queue worker processes with `kill -9`, `pkill -9`, or `supervisorctl stop` (without graceful wait) during deployment. The current job is lost mid-execution with no retry and no record of what was being processed. In billing systems, a half-processed Stripe webhook results in billing state divergence.

### Why It Happens
- Impatience during deployment: graceful shutdown takes time
- The developer doesn't know about `queue:restart` or `horizon:terminate`
- A worker is hung and force-kill seems like the only option
- Container orchestrator (Docker, Kubernetes) sends SIGKILL on deploy

### Warning Signs
- Deployment scripts use `kill -9`, `pkill`, or `supervisorctl stop` on worker processes
- No `queue:restart` or `horizon:terminate` in the deployment script
- Workers are killed mid-job during deployments
- Intermittent "job processing incomplete" errors after deployments
- Container orchestrator `stop_grace_period` is too short for job completion

### Why Harmful
A force-killed worker loses the current job mid-execution. Database transactions roll back, but external side effects (Stripe API calls, emails sent, cache writes) may have already occurred. In billing systems, a half-processed Stripe webhook means the database transaction rolled back (subscription not updated) but a Stripe API call may have succeeded — state divergence with no record.

### Real-World Consequences
- A deployment script uses `pkill -9 -f "queue:work"` to stop workers. A worker is mid-processing a `customer.subscription.updated` webhook. It has already called Stripe's API to fetch the subscription details but hasn't yet updated the local database. The `kill -9` terminates the process. The local database still shows the old subscription status. The webhook is not retried (the worker was killed, not the job failed gracefully). The customer's subscription is active in Stripe but cancelled in the local DB. They lose access to premium features.

### Preferred Alternative
Always use `php artisan queue:restart` (for `queue:work` daemons) or `php artisan horizon:terminate` (for Horizon). These signal workers to finish their current job before exiting. Supervisor auto-restarts them with the new code. For container orchestrators, set `stop_grace_period` to exceed the longest job timeout.

### Refactoring Strategy
1. Search deployment scripts for `kill`, `pkill`, `supervisorctl stop` on worker processes.
2. Replace with `queue:restart` or `horizon:terminate`.
3. For container orchestrators, configure `stop_grace_period` or `terminationGracePeriodSeconds` to exceed the longest job timeout.
4. Test the graceful shutdown flow in staging before executing in production.

### Detection Checklist
- [ ] Deployment scripts use `kill -9`, `pkill`, or `supervisorctl stop` on workers
- [ ] No `queue:restart` or `horizon:terminate` in the deployment script
- [ ] Workers killed mid-job during deployments
- [ ] Container orchestrator `stop_grace_period` shorter than longest job timeout
- [ ] Intermittent billing state issues after deployments

### Related Rules
- Never Force-Kill Queue Workers (implied by graceful shutdown practices)

---

## AP-QDS-002: Migrations Before Code Deploy

### Category
Deployment Ordering | Data Integrity

### Description
Running database migrations that drop or modify columns before deploying the new application code. Old queue workers, still running pre-deploy code, crash when they encounter schema changes they don't understand. Serialized jobs referencing dropped columns fail permanently.

### Why It Happens
- CI/CD pipeline runs migrations as the first step (before code deploy)
- The developer assumes migrations should run first "to prepare the database"
- The deployment script was written without considering active queue workers
- Legacy deployment process that doesn't account for queues

### Warning Signs
- CI/CD pipeline runs `php artisan migrate` before deploying code
- Deployment script order: migrations → code deploy → restart workers
- Workers crash with "column not found" errors after migrations but before code deploy
- Serialized jobs fail with schema mismatch errors after deployment

### Why Harmful
Between the migration and the code deploy, old workers are running old code against the new schema. If the migration dropped a column that old code references, every job processed during this window fails. If the migration added a NOT NULL column without a default, old code that doesn't set the column fails on INSERT. The window between migration and code deploy is a zone of incompatibility.

### Real-World Consequences
- A CI/CD pipeline runs `php artisan migrate` (drops the `status` column from `subscriptions`) before deploying code that uses `new_status`. During the 3-minute window between migration and code deploy, 20 Stripe webhooks are processed by old workers. All 20 fail with "column not found: status." The failed jobs are unrecoverable — the column is gone. 20 customers' subscription updates are lost. Manual replay from Stripe's API is required.

### Preferred Alternative
Deploy code first. The new code handles both old and new schema (nullable columns). Run migrations that add columns. Restart workers with new code. In the next deploy cycle, after all old jobs have drained, drop the old columns.

### Refactoring Strategy
1. Review the CI/CD pipeline and deployment script ordering.
2. Move code deploy before migrations: deploy code → run migrations → restart workers.
3. For destructive migrations (column drops), split across two deploys: add nullable in N, drop in N+1.
4. Test the deployment sequence in staging with active queue workers.

### Detection Checklist
- [ ] CI/CD pipeline runs migrations before code deploy
- [ ] Deployment script order: migrations → code → restart
- [ ] Workers crash with "column not found" errors during deploy window
- [ ] Serialized jobs fail with schema mismatch after deployment
- [ ] No consideration of active queue workers in deployment ordering

### Related Rules
- Deploy Code Before Running Destructive Migrations

---

## AP-QDS-003: Direct Class Rename Without Alias

### Category
Backward Compatibility | Deployment

### Description
Renaming a queued job class (e.g., `ProcessOrder` → `ProcessOrderJob`) without keeping the old class as a transition alias. All jobs serialized with the old fully-qualified class name fail to deserialize — PHP can't find the old class.

### Why It Happens
- The developer renames the class for cleanliness and deletes the old file
- No awareness that serialized jobs store the fully-qualified class name
- The queue appears empty in development, so the issue isn't caught
- Refactoring cleanup removes "unused" class files

### Warning Signs
- Job class renamed and old file deleted in the same commit
- `ClassNotFoundException` errors in failed_jobs table after deployment
- Failed jobs with the old class name in the payload
- No transition alias (`class OldName extends NewName {}`) in the codebase

### Why Harmful
PHP serialization stores the fully-qualified class name. Jobs queued as `App\Jobs\ProcessOrder` cannot be revived as `App\Jobs\ProcessOrderJob`. The autoloader can't find `ProcessOrder` — the file was deleted. The job fails permanently with `ClassNotFoundException`. In billing systems, this means lost webhooks, lost invoice processing, and lost notifications.

### Real-World Consequences
- A developer renames `ProcessStripeWebhook` to `HandleStripeEvent` for naming consistency. The old file is deleted. After deployment, 15 webhook jobs that were queued before the deploy fail with `ClassNotFoundException: App\Jobs\ProcessStripeWebhook`. The 15 webhooks are permanently lost — they can't be retried because the class doesn't exist. The team must re-fetch the 15 events from Stripe's API and re-process them manually.

### Preferred Alternative
Create the new class with the new name. Keep the old class as an empty alias: `class ProcessStripeWebhook extends HandleStripeEvent {}`. Add a comment: "// Remove in next deploy cycle after all old jobs drain." Remove the alias in the next deployment after verifying the queue is empty.

### Refactoring Strategy
1. Before renaming a job class, check if the queue has pending instances.
2. Create the new class with the new name and new logic.
3. Keep the old class file as `class OldName extends NewName {}` with a removal comment.
4. Deploy with both classes present.
5. In the next deploy cycle, verify queue is empty, then remove the old class file.

### Detection Checklist
- [ ] Job class renamed and old file deleted in the same commit
- [ ] `ClassNotFoundException` errors in failed_jobs table after deployment
- [ ] No transition alias for renamed job classes
- [ ] Failed jobs with old class names in the payload
- [ ] No verification of queue emptiness before removing old class files

### Related Rules
- Keep Old Job Class as a Transition Alias When Renaming

---

## AP-QDS-004: queue:restart Exposed via HTTP

### Category
Security | Deployment

### Description
Creating an HTTP endpoint (e.g., `POST /api/admin/queue/restart`) that triggers `php artisan queue:restart`. This allows an attacker with admin credentials (or via SSRF) to disrupt the entire asynchronous processing pipeline by repeatedly triggering worker restarts.

### Why It Happens
- The team wants a "convenient" way to restart workers without SSH access
- An admin panel has a "Restart Queues" button that calls Artisan
- The developer doesn't realize `queue:restart` is a deployment operation, not a runtime operation
- No awareness of the denial-of-service potential

### Warning Signs
- A route like `Route::post('/api/admin/queue/restart', ...)` exists
- `Artisan::call('queue:restart')` in a controller method
- An admin UI button that triggers queue restart
- No audit logging on queue restart triggers

### Why Harmful
A queue restart causes all workers to exit after their current job. While supervisor restarts them, there's a brief window where workers are unavailable. A malicious actor could repeatedly trigger restarts to create a denial-of-service condition on billing processing. Combined with other vulnerabilities, this could mask fraudulent activity by disrupting audit trail processing.

### Real-World Consequences
- An attacker gains access to an admin account (via credential stuffing). They discover the `/api/admin/queue/restart` endpoint. They script it to call restart every 10 seconds. Workers constantly cycle, never processing more than one job per cycle. All queue processing halts — webhooks pile up, notifications aren't sent, billing state diverges. The team discovers the issue 2 hours later when customers report missing features.

### Preferred Alternative
`queue:restart` must only be executable via CLI during authorized deployments. No HTTP route should exist for it. If an emergency restart is needed, it should be via SSH access to the server, not via an API endpoint. If an internal admin endpoint is absolutely necessary, it must be behind VPN, strong authentication, audit logging, and rate limiting.

### Refactoring Strategy
1. Search for routes that call `Artisan::call('queue:restart')` or `Artisan::call('horizon:terminate')`.
2. Remove the HTTP endpoint.
3. Move queue restart to the deployment script only.
4. If emergency restart is needed, document the SSH procedure instead of exposing an API.

### Detection Checklist
- [ ] HTTP route exists that triggers `queue:restart` or `horizon:terminate`
- [ ] `Artisan::call('queue:restart')` in a controller method
- [ ] Admin UI button that restarts queues without SSH
- [ ] No audit logging on queue restart triggers
- [ ] No rate limiting on the restart endpoint

### Related Rules
- Never Expose queue:restart via HTTP Endpoint

---

## AP-QDS-005: Deploy and Forget

### Category
Operations | Post-Deployment

### Description
Deploying code and immediately moving on to the next task without monitoring the system for regressions. The first 15 minutes after deploy are when most serialization failures, configuration mismatches, and new bugs surface. Without monitoring, failures accumulate for hours before discovery.

### Why It Happens
- The deploy script doesn't include a monitoring step
- The developer trusts the test suite and doesn't expect failures
- No automated post-deploy monitoring tool exists
- The team has a "deploy and move on" culture

### Warning Signs
- No post-deploy monitoring step in the deployment script
- Failed jobs discovered hours after deployment by customer reports
- No `deploy:monitor` or equivalent artisan command
- No alerting on failed job count after deployment
- The deploying engineer leaves immediately after the deploy completes

### Why Harmful
Most deployment-related job failures appear within the first few minutes as workers restart and pick up jobs queued before the deploy. These failures are silent — no HTTP 500, no user-facing error. The only evidence is the failed_jobs table growing. Without monitoring, the team discovers the issue hours later when customers report billing problems. Recovery requires retroactively replaying hours of failed jobs.

### Real-World Consequences
- A team deploys at 2 PM and moves on. At 6 PM, a support ticket arrives: "Customer's payment didn't process." The team checks failed_jobs and finds 450 failed billing jobs accumulated over 4 hours. The root cause: a class rename without a transition alias. 450 webhooks need manual replay from Stripe's API. 4 hours of billing state is inconsistent. Several customers were charged by Stripe but their local subscriptions weren't updated.

### Preferred Alternative
After every deployment, monitor the failed jobs table for 15 minutes. Check at 5, 10, and 15 minutes. Any new failed jobs in this window indicate a deployment issue. Use an automated `deploy:monitor` command that checks failed_jobs every 60 seconds and alerts via Slack/PagerDuty if failures appear.

### Refactoring Strategy
1. Add a post-deploy monitoring step to the deployment script.
2. Create a `deploy:monitor` artisan command that checks failed_jobs for 15 minutes.
3. Configure alerts (Slack, PagerDuty) for failed job spikes after deployment.
4. Make post-deploy monitoring a mandatory step — the deploying engineer must stay for 15 minutes.

### Detection Checklist
- [ ] No post-deploy monitoring step in the deployment script
- [ ] Failed jobs discovered hours after deployment by customer reports
- [ ] No `deploy:monitor` or equivalent command
- [ ] No alerting on failed job count after deployment
- [ ] Deploying engineer leaves immediately after deploy

### Related Rules
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment
