# Anti-Patterns — Queue Deployment Safety Operations

## Metadata
| Field | Value |
|-------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Queue Deployment Safety Operations |
| Version | 1.0 |
| Last Updated | 2026-06-22 |

## Anti-Pattern Inventory

1. Deploy-and-Forget (No queue:restart)
2. Constructor Signature Break
3. Migration Before Code Deploy
4. Hard Kill Horizon Workers
5. No Post-Deploy Monitoring
6. Direct Deployment of High-Risk Job Changes
7. Full Model Serialization (No SerializesModels)
8. Config Cache Clearing Without Worker Restart

---

## 1. Deploy-and-Forget (No queue:restart)

### Category
Reliability

### Description
Deploying new code but forgetting (or not knowing) to execute `php artisan queue:restart`, leaving workers running old code indefinitely.

### Why It Happens
The developer deploys via `git pull` + `composer install`. The HTTP layer picks up new code on the next request because PHP-FPM re-reads files. But queue workers are long-running processes that loaded the old code into memory at startup. They don't know new code exists. Without `queue:restart` (which writes a restart signal to cache), workers process old code for hours or days.

### Warning Signs
- Bug fixes "not working" for queue jobs but working for HTTP requests
- Horizon shows workers with old start times (unchanged after deploy)
- Cache key `illuminate:queue:restart` has an old timestamp
- Deploy script lacks `queue:restart` command

### Why Harmful
A critical bug fix deploys to production. HTTP endpoints serve the fix. But queue workers continue running the buggy code for hours. Orders are processed incorrectly. Customers receive wrong confirmations. The team believes the fix is deployed because HTTP works — the queue failure goes undetected until customer complaints arrive.

### Consequences
- Bug fixes don't reach queue workers for hours/days
- Old code processes against potentially new database schemas — runtime errors
- Security patches not applied to worker processes
- Deploy/rollback confidence eroded ("was the fix deployed?")

### Alternative
Always include `php artisan queue:restart` in the deployment script. Verify workers restart via Horizon status check.

### Refactoring Strategy
1. Add `php artisan queue:restart` to deploy script (CI pipeline, Forge, Envoyer)
2. Add post-deploy verification: `php artisan horizon:status`
3. Monitor worker start times in Horizon after deploy
4. Add deploy hook that alerts if workers haven't restarted within 5 minutes

### Detection Checklist
- [ ] Deploy script includes `queue:restart` command
- [ ] Worker start times update after each deploy
- [ ] Horizon shows new worker PIDs after restart
- [ ] Cache key `illuminate:queue:restart` updates after deploy

### Related Rules
restart-queue-after-every-deploy

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Worker Restart Strategy: Graceful vs Hard

---

## 2. Constructor Signature Break

### Category
Reliability

### Description
Changing a job constructor by removing parameters or adding required parameters without defaults, breaking deserialization of in-flight jobs with old payloads.

### Why It Happens
The developer refactors the job constructor — adding a new required parameter or removing an old one. The code deploys. In-flight jobs (dispatched before the deploy) have old payloads matching the old constructor. When workers with new code try to deserialize old payloads, PHP throws `ArgumentCountError` or type mismatches. The jobs fail permanently.

### Warning Signs
- Jobs failing immediately after deploy with deserialization errors
- `failed_jobs` table spike with `unserialize()` errors
- "Too few arguments to function __construct()" in failed_jobs exception
- Constructor parameter list changed in the diff

### Why Harmful
A chain of 50,000 `ProcessOrder` jobs is dispatched before the deploy. The deploy changes `__construct(int $userId)` to `__construct(int $userId, string $priority)`. All 50,000 jobs fail deserialization. They are moved to `failed_jobs` without processing. Orders are not processed. Revenue is lost. Recovery requires manually re-dispatching all 50,000 jobs — hours of work.

### Consequences
- All in-flight jobs with the old constructor signature permanently fail
- Business operations interrupted
- Manual job re-dispatch required (time-consuming, error-prone)
- Lost revenue, customer impact

### Alternative
Add new parameters with default values: `__construct(int $userId, ?string $priority = null)`. Never remove parameters without a compatibility window.

### Refactoring Strategy
1. Add new parameter with a default value (backward compatible)
2. Deploy code
3. Wait for all old-payload jobs to drain (monitor queue depth)
4. After old payloads are processed, make the parameter required in a future deploy
5. For parameter removal: deprecate first (stop using in new dispatches), then remove in a future deploy

### Detection Checklist
- [ ] New constructor parameters have default values
- [ ] No constructor parameters removed without compatibility window
- [ ] `failed_jobs` monitored for deserialization errors post-deploy
- [ ] Parameter changes documented in deployment notes

### Related Rules
backward-compatible-constructor-changes, use-serializes-models-on-all-jobs

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Staggered vs Single-Group Worker Deployment

---

## 3. Migration Before Code Deploy

### Category
Reliability

### Description
Running database migrations before deploying application code, causing old workers to encounter unknown schema states.

### Why It Happens
The deployment pipeline is configured as: `migrate → deploy → restart`. The reasoning is "apply schema first, then code can use it." But old workers are still running and suddenly encounter missing columns (dropped), new NOT NULL columns (can't insert), or renamed columns (referenced by old name).

### Warning Signs
- Deploy script runs migrations before code deploy
- "Column not found" errors in worker logs immediately after migrations run
- "Column doesn't have a default value" for new NOT NULL columns
- Failed jobs spike DURING migration, before code deploy completes

### Why Harmful
A migration drops the `legacy_status` column and adds a `status_enum` column. Old workers are still processing `UpdateOrderStatus` jobs that reference `legacy_status`. They crash with "Column not found: legacy_status." The migration window (30 seconds) sees 500 failed jobs. The column is gone — old workers will never recover. The fix: deploy code, wait for old workers to restart, THEN run the migration.

### Consequences
- Old workers crash with schema errors during migration
- Jobs fail that would have succeeded with new code
- Data integrity issues from partial writes (new column not populated by old code)
- Unable to rollback: column is dropped, old code is gone

### Alternative
Deploy code first (handles both old and new schema). Verify workers restart. Then run migrations.

### Refactoring Strategy
1. Reorder deploy script: code → restart → verify → migrate
2. Write code to handle both schema states during the transition
3. For destructive changes (DROP COLUMN): add column deprecation comment, wait one deploy cycle, then drop
4. Document deployment ordering in team playbook

### Detection Checklist
- [ ] Deploy script runs code deploy before migrations
- [ ] Code handles both old and new schema states during transition
- [ ] Destructive schema changes have a deprecation cycle
- [ ] No runtime errors from schema-code mismatch during deploy

### Related Rules
deploy-code-before-migrations

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Code vs Migration Deployment Order

---

## 4. Hard Kill Horizon Workers

### Category
Reliability

### Description
Hard-killing Horizon workers (`kill -9`, `systemctl stop` with short timeout) instead of using `horizon:terminate` for graceful shutdown.

### Why It Happens
The deployment pipeline uses `sudo systemctl restart horizon` which sends SIGTERM with a default 90s timeout. If jobs take longer, SIGKILL is sent. The team didn't configure the timeout. Alternatively, a CI pipeline runs `kill -9` to speed up deployments — "a few failed jobs are acceptable."

### Warning Signs
- `systemctl stop horizon` in deploy script instead of `php artisan horizon:terminate`
- Horizon timeout shorter than average job execution time
- Stale `ShouldBeUnique` locks persisting after deploy
- `WithoutOverlapping` locks orphaned
- Partial database transactions visible in logs

### Why Harmful
A payment processing job holds a `WithoutOverlapping` lock and is inside a DB transaction. `kill -9` terminates the process mid-transaction. The transaction is rolled back by the database, but the `WithoutOverlapping` lock key in Redis is never released. No other worker can process payments for that key until the lock expires (minutes/hours). The payment gateway was already charged, but the database shows no record. Reconciliation is a manual nightmare.

### Consequences
- Stale locks (WithoutOverlapping, ShouldBeUnique) persist indefinitely
- Partial database transactions (some side effects committed, others rolled back)
- External API side effects without corresponding database records
- Manual lock clearing and transaction reconciliation required

### Alternative
Always use `php artisan horizon:terminate` with a timeout exceeding p99 job duration.

### Refactoring Strategy
1. Replace `systemctl stop horizon` with `php artisan horizon:terminate`
2. Set `timeout` in `config/horizon.php` to 2× p99 job duration
3. For CI: use the `--wait` flag on `horizon:terminate` to block until all workers exit
4. Add lock cleanup job as safety net: periodically scan for stale locks and release them

### Detection Checklist
- [ ] Deploy script uses `horizon:terminate`, not `kill` or `systemctl stop`
- [ ] Horizon timeout > p99 job execution time
- [ ] No stale locks after deploy (monitor lock keys in Redis)
- [ ] Graceful shutdown verified: all in-flight jobs completed before restart

### Related Rules
graceful-horizon-terminate-with-timeout

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Worker Restart Strategy: Graceful vs Hard

---

## 5. No Post-Deploy Monitoring

### Category
Observability

### Description
Deploying without actively monitoring `failed_jobs` for payload incompatibility, schema mismatches, or other deployment-induced failures.

### Why It Happens
The team deploys, sees Horizon is "green," and moves on. There's no automated check for `failed_jobs` growth. Payload incompatibility is discovered hours later when customers report issues. The `failed_jobs` table has accumulated thousands of entries that must be manually reviewed and re-dispatched.

### Warning Signs
- No post-deploy monitoring step in deploy pipeline
- No alert on `failed_jobs` count increase
- Failed jobs discovered via customer reports, not monitoring
- No runbook for "failed_jobs spike after deploy"

### Why Harmful
A deploy introduces a constructor incompatibility. 10,000 jobs fail in the first 15 minutes. No alert fires. The team starts their weekend. Monday morning: customers report missing data. The `failed_jobs` table has 50,000 entries. Each must be reviewed for re-dispatch eligibility. The business lost 48 hours of processing. The recovery effort takes days.

### Consequences
- Delayed detection of deployment-induced failures
- Accumulated failed jobs requiring manual review
- Extended business impact before detection
- Eroded trust in deployment process

### Alternative
Add automated `failed_jobs` monitoring to the deployment pipeline. Alert on >10% growth within 15 minutes of deploy.

### Refactoring Strategy
1. Add post-deploy monitoring step: `php artisan queue:failed --count`
2. Store pre-deploy `failed_jobs` count
3. Compare post-deploy count after 5, 10, and 15 minutes
4. Alert (Slack, PagerDuty) if growth > 10% or absolute count > 100
5. Document runbook: if alert fires, investigate top failure exceptions, potentially rollback

### Detection Checklist
- [ ] Post-deploy monitoring step exists in deploy pipeline
- [ ] `failed_jobs` count tracked before and after deploy
- [ ] Alert configured for unexpected growth
- [ ] Runbook documented for deployment-induced failure spikes

### Related Rules
monitor-failed-jobs-post-deploy

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Feature Flag vs Direct Deployment for Risky Changes

---

## 6. Direct Deployment of High-Risk Job Changes

### Category
Architecture

### Description
Deploying high-risk job logic changes directly (without feature flags), making rollback require a full code redeploy + `queue:restart` cycle.

### Why It Happens
The team is confident the change works. Feature flags "add complexity." The change deploys directly. A bug is discovered. Rollback requires: revert code, push, `queue:restart`, wait for workers to restart — 10-15 minutes minimum. During that time, the buggy code processes thousands of jobs.

### Warning Signs
- High-risk job changes deployed without feature flags
- Rollback procedure takes 10+ minutes
- No instant "off switch" for new job behavior
- Previous incidents where rollback was slow

### Why Harmful
A new payment processing flow is deployed directly. A bug causes double charges. The bug is detected after 2 minutes. Rollback requires: git revert, CI build (3 min), deploy (1 min), queue:restart (workers finish current jobs — up to 5 min for long-running jobs). Total: 10+ minutes. During that window, the buggy code processes 500 more payments. 500 customers are double-charged. With a feature flag, the bug would be disabled in 5 seconds.

### Consequences
- Extended damage window during rollback (10-15 minutes)
- Customer impact compounds during rollback
- Support team overwhelmed
- Financial loss from prolonged bug exposure

### Alternative
Gate high-risk changes behind feature flags. Rollback = disable flag (seconds). No redeploy. No queue:restart.

### Refactoring Strategy
1. Before deploying risky job change, wrap new logic in `if (Feature::active('new-payment-flow'))`
2. Deploy with flag disabled
3. Enable flag for 5% of traffic, monitor
4. Gradually increase to 100%
5. After 1 week of stable operation, remove feature flag in a cleanup deploy

### Detection Checklist
- [ ] High-risk job changes gated behind feature flags
- [ ] Flag disabled by default on first deploy
- [ ] Gradual rollout documented (5% → 25% → 100%)
- [ ] Rollback procedure: disable flag (seconds, no deploy)
- [ ] Flag cleanup scheduled (remove after 1 week of stability)

### Related Skills
Execute Safe Queue Deployments

### Related Decision Trees
Feature Flag vs Direct Deployment for Risky Changes

---

## 7. Full Model Serialization (No SerializesModels)

### Category
Reliability

### Description
Omitting the `SerializesModels` trait from job classes, causing full Eloquent model objects to be serialized in job payloads.

### Why It Happens
The developer creates a job class, uses `Dispatchable, InteractsWithQueue, Queueable` but forgets `SerializesModels`. The job accepts an Eloquent model in the constructor. The full model (all columns, all loaded relations) is serialized into the job payload. The payload is now a multi-KB JSON blob instead of `{class: "...", id: 42}`.

### Warning Signs
- `SerializesModels` missing from job `use` statement
- Large job payloads in `jobs` table (multiple KB instead of ~100 bytes)
- Jobs fail deserialization when model columns change
- "No query results for model" errors when model was deleted between dispatch and execution

### Why Harmful
A `ProcessOrder` job is dispatched with a full `Order` model (50 columns, loaded relations). The payload is 8KB. The queue has 500,000 jobs — 4GB of storage. During deploy, the `Order` model gains a new column. Old payloads have the old column set — deserialization fails because the new column is missing. Without `SerializesModels`, every schema change risks breaking in-flight jobs.

### Consequences
- Bloated queue storage (full models instead of IDs)
- Job deserialization breaks on model schema changes
- Stale model data (changes after dispatch invisible to worker)
- Slower job serialization/deserialization

### Alternative
Always include `SerializesModels` in the `use` statement of job classes that accept Eloquent models.

### Refactoring Strategy
1. Audit all job classes: ensure `SerializesModels` is in the `use` statement
2. Add PHPStan/Psalm rule to flag jobs with model params but missing `SerializesModels`
3. For existing in-flight jobs without `SerializesModels`: wait for them to drain, then deploy the fix
4. Monitor job payload sizes — large payloads indicate missing `SerializesModels`

### Detection Checklist
- [ ] All job classes with Eloquent model parameters include `SerializesModels`
- [ ] Job payload sizes are small (< 500 bytes) — otherwise investigate
- [ ] Static analysis rule flags missing `SerializesModels`
- [ ] No "full model serialization" in code review findings

### Related Rules
use-serializes-models-on-all-jobs

### Related Skills
Execute Safe Queue Deployments

---

## 8. Config Cache Clearing Without Worker Restart

### Category
Reliability

### Description
Clearing or rebuilding the config cache during deployment without subsequently restarting queue workers, leaving workers with stale configuration.

### Why It Happens
The deployment pipeline runs `php artisan config:cache` but doesn't call `queue:restart`. Queue workers loaded config at startup. The config cache file changes on disk, but workers have the old config in memory. Database connections, API keys, queue connections — all stale.

### Warning Signs
- `config:cache` in deploy script without subsequent `queue:restart`
- Workers using old database connection strings after config change
- API key rotation not taking effect for queue jobs
- Config changes reflected in HTTP but not in queue workers

### Why Harmful
A database password is rotated. `config:cache` updates the cached config. HTTP requests use the new password. But queue workers loaded the old password at startup. They continue using the old password. Two hours later, the old password is revoked. Workers crash with "Access denied for user." All queue processing stops. The on-call engineer doesn't connect "password rotation" to "workers crashing" for 30 minutes.

### Consequences
- Workers use stale configuration after config changes
- Security credential rotations don't take effect on workers
- Configuration drift between HTTP and queue layers
- Hard-to-debug failures (works locally, works in HTTP, fails in queue)

### Alternative
Always pair `config:cache` or `config:clear` with `queue:restart` in deployment scripts.

### Refactoring Strategy
1. Ensure deploy script runs `queue:restart` AFTER `config:cache`
2. If config changes require immediate restart (credential rotation), use `horizon:terminate` for faster worker cycling
3. Add monitoring: compare config values used by workers vs HTTP layer
4. Document: "config changes require worker restart"

### Detection Checklist
- [ ] `queue:restart` always follows `config:cache` in deploy scripts
- [ ] Workers restarted after credential rotations
- [ ] No config drift between HTTP and queue layers
- [ ] Post-deploy verification: workers using new config values

### Related Rules
restart-queue-after-every-deploy

### Related Skills
Execute Safe Queue Deployments
