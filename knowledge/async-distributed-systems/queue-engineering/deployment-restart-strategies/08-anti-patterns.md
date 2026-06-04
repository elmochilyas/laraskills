# Anti-Patterns — Deployment Restart Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Deployment Restart Strategies |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. No Worker Restart After Deploy
2. File Cache on Multi-Server Restart
3. Simultaneous Multi-Server Restart
4. No Drain Wait Before Deploy

---

## 1. No Worker Restart After Deploy

### Category
Reliability

### Description
Deploying code without running `php artisan queue:restart` (or `horizon:terminate`), leaving workers running old code indefinitely.

### Why It Happens
The deployment script focuses on files, dependencies, and migrations. The developer forgets to add the worker restart step because queue workers are out of sight. The daemon workers, booted days ago, continue running the old application code in memory, blissfully unaware of the deployment.

### Warning Signs
- Deployment script missing `queue:restart` or `horizon:terminate`
- Workers run for days without recycling
- Schema-related job failures after migration-heavy deploys
- Old code behavior persists in queue processing after deploy

### Why Harmful
A critical bug fix is deployed to the `ProcessRefund` job. The fix corrects a calculation error that was over-refunding customers. HTTP requests use the new code, but all queued refunds continue using the buggy calculation. Customers continue receiving excess refunds for hours until someone notices the worker hasn't been restarted.

### Consequences
- Workers silently run old code after deploy
- Bug fixes have no effect on queue processing
- Schema migrations cause failures in old-code workers
- Deploy effectiveness for queue jobs is zero

### Alternative
Always include `php artisan queue:restart` (or `horizon:terminate`) as the final step in every deployment script.

### Refactoring Strategy
1. Add `php artisan queue:restart` after `migrate --force` in deploy script
2. For Horizon: use `php artisan horizon:terminate`
3. Verify restart happens: check worker boot time after deploy
4. Add restart to CI/CD pipeline as a mandatory step

### Detection Checklist
- [ ] `queue:restart` in deployment script
- [ ] Workers restart with new code after deploy
- [ ] No old-code behavior post-deploy
- [ ] Post-deploy verification confirms fresh workers

### Related Rules
Always Restart Workers After Every Deploy

### Related Skills
Perform Zero-Downtime Queue Worker Restart on Deploy

### Related Decision Trees
Pre-Deploy vs Post-Deploy Worker Restart

---

## 2. File Cache on Multi-Server Restart

### Category
Reliability

### Description
Using `CACHE_DRIVER=file` with `queue:restart` across multiple servers, causing the restart signal to reach only one server's workers while others continue running old code.

### Why It Happens
`queue:restart` stores a timestamp in the cache under the key `illuminate:queue:restart`. Workers check this key on every loop iteration. With a file-based cache, the key is stored on the local filesystem — only workers on the same server as the `queue:restart` command can read it. Other servers never see the updated timestamp.

### Warning Signs
- `CACHE_DRIVER=file` in production
- `queue:restart` used on multi-server deployment
- Some servers' workers restart, others don't
- Mixed old/new code execution on different servers

### Why Harmful
A deployment rolls out across 4 servers. `queue:restart` is called on the deploy server. Server A's workers (same filesystem) see the restart signal and exit. Servers B, C, and D have file caches — they never see the updated timestamp. Three-quarters of the workers continue running old code. The deployment is effectively only 25% complete for queue processing.

### Consequences
- Partial worker restart across servers
- Mixed old/new code execution environment
- Undefined behavior from code version mismatch
- Debugging confusion about which code version runs

### Alternative
Use a shared cache driver (Redis, Memcached) so the restart signal propagates to all servers.

### Refactoring Strategy
1. Change `CACHE_DRIVER` from `file` to `redis` or `memcached`
2. Configure shared Redis/Memcached accessible from all worker servers
3. Test: call `queue:restart` from one server, verify all servers' workers restart
4. Verify cache driver is consistent across all environments

### Detection Checklist
- [ ] Shared cache driver (Redis/Memcached) configured
- [ ] `queue:restart` reaches all servers
- [ ] No mixed old/new code after deploy
- [ ] All workers restart within expected timeframe

### Related Rules
Use Shared Cache for Multi-Server queue:restart

### Related Skills
Perform Zero-Downtime Queue Worker Restart on Deploy

### Related Decision Trees
Pre-Deploy vs Post-Deploy Worker Restart

---

## 3. Simultaneous Multi-Server Restart

### Category
Scalability

### Description
Restarting workers on all servers simultaneously during deployment, causing zero processing capacity during the restart window and a queue backlog spike.

### Why It Happens
The deployment script runs `queue:restart` across all servers in parallel. All workers finish their current jobs and exit within seconds. For a brief window — the time between old workers exiting and new workers starting — there are zero workers processing jobs. Queues accumulate, and processing takes time to recover.

### Warning Signs
- Deployment script restarts all servers' workers simultaneously
- Queue depth spikes at every deployment
- Processing latency increases immediately after deployments
- Backlog takes minutes to normalize after restart

### Why Harmful
With 5 servers each running 4 workers (20 total workers), simultaneously restarting all 20 causes a complete processing halt for 10-30 seconds. At 100 jobs/second throughput, 1,000-3,000 jobs queue up. After restart, workers need time to drain the backlog. User-facing operations that depend on queue processing (notifications, webhooks) experience a delay.

### Consequences
- Zero processing capacity during restart window
- Queue backlog spike at every deployment
- Processing latency increase post-deploy
- User-facing delays for queue-dependent operations

### Alternative
Use rolling restart: restart workers on one server at a time, maintaining N-1 capacity during each server's restart.

### Refactoring Strategy
1. Modify deployment script to restart workers sequentially per server
2. Add sleep between server restarts (e.g., 30 seconds)
3. Monitor queue depth during rolling restart
4. Verify N-1 capacity is maintained throughout

### Detection Checklist
- [ ] Rolling restart across servers
- [ ] N-1 processing capacity maintained during deploy
- [ ] No zero-capacity window
- [ ] Queue depth stable during deployments

### Related Rules
Use Rolling Restart for Zero-Downtime Multi-Server Deploy

### Related Skills
Perform Zero-Downtime Queue Worker Restart on Deploy

### Related Decision Trees
Drain-and-Deploy vs Deploy-and-Restart

---

## 4. No Drain Wait Before Deploy

### Category
Reliability

### Description
Deploying new code immediately after `queue:restart` without waiting for old workers to finish their current jobs, risking old-code execution against new database schemas.

### Why It Happens
The deployment script calls `queue:restart` and immediately proceeds to `git pull`, `composer install`, and `migrate`. The developer assumes restart is instant. But workers finish their current jobs before exiting — this can take up to the job's execution time. Old workers may still be running old code when the migration runs.

### Warning Signs
- `queue:restart` immediately followed by `migrate --force`
- No sleep or drain check between restart and deploy
- Schema-related job failures during deployment
- Workers processing old code after migration completes

### Why Harmful
`queue:restart` signals workers to exit after finishing their current job. A slow job takes 120 seconds. The deployment script runs the migration 5 seconds after `queue:restart`. The old worker, still processing with old code, reads the migrated schema — column renamed, old code references old column name, query fails. The job fails permanently because it can't handle the new schema with old code.

### Consequences
- Old workers execute old code against new schema
- Job failures from schema incompatibility during deploy
- Permanent job failures from version mismatch
- Deployment window needs to account for longest job

### Alternative
Wait for worker drain after `queue:restart` before deploying code or running migrations.

### Refactoring Strategy
1. Call `queue:restart` first in deployment script
2. Sleep for max(worker `--timeout`, longest job `$timeout`) + 10 seconds
3. Verify drain: check that no old worker PIDs remain
4. Only then proceed with code deploy and migration
5. For Horizon: use `horizon:terminate` and wait for `stopwaitsecs`

### Detection Checklist
- [ ] Drain wait period after `queue:restart`
- [ ] No old workers running during migration
- [ ] No schema-related job failures during deploy
- [ ] Deployment timing accounts for longest job

### Related Rules
Always Restart Workers After Every Deploy

### Related Skills
Perform Zero-Downtime Queue Worker Restart on Deploy

### Related Decision Trees
Drain-and-Deploy vs Deploy-and-Restart
