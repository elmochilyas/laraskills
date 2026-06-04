# Anti-Patterns — Worker Daemon Architecture

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Worker Daemon Architecture |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Production `queue:listen` Performance Waste
2. Unsupervised Daemon Worker
3. Missing Recycling Limits — Unbounded Memory Growth
4. No Post-Deploy Worker Restart

---

## 1. Production `queue:listen` Performance Waste

### Category
Performance

### Description
Using `php artisan queue:listen` instead of `queue:work` in production, spawning a new PHP process per job and wasting 5-10x throughput on repeated framework bootstrapping.

### Why It Happens
`queue:listen` is simpler conceptually — it spawns a new process per job, similar to how HTTP requests work. It's the default in older documentation and tutorials. The developer uses it locally for debugging and deploys it to production without considering the performance difference.

### Warning Signs
- `queue:listen` used in production Supervisor config
- High CPU usage attributed to PHP process spawning
- Job throughput significantly lower than expected
- Each job's execution time includes 50-200ms of boot time

### Why Harmful
`queue:listen` boots the Laravel framework from scratch for every single job. A job that takes 100ms of business logic incurs 50-200ms of boot overhead — 33-66% waste. At 10,000 jobs/day, that's 8-33 minutes of pure overhead per day. `queue:work` boots once and reuses the container, eliminating this waste. The performance cost is direct and measurable.

### Consequences
- 5-10x throughput reduction compared to daemon mode
- Unnecessary CPU waste from repeated PHP process spawning
- Higher infrastructure costs for same throughput
- Longer queue backlog during traffic spikes

### Alternative
Always use `php artisan queue:work` (daemon mode) in production.

### Refactoring Strategy
1. Replace `queue:listen` with `queue:work` in Supervisor configuration
2. Add recycling limits: `--max-jobs=500 --max-time=3600`
3. Add `--memory` limit for safety
4. Verify throughput improvement after switch
5. Keep `queue:listen` only in local development

### Detection Checklist
- [ ] `queue:work` used in all production Supervisor configs
- [ ] No `queue:listen` in production
- [ ] Recycling limits set on all daemon workers
- [ ] Throughput measured after daemon switch

### Related Rules
Always Use queue:work Over queue:listen in Production

### Related Skills
Configure and Run Laravel Queue Workers in Daemon Mode

### Related Decision Trees
queue:work vs queue:listen

---

## 2. Unsupervised Daemon Worker

### Category
Reliability

### Description
Running `queue:work` directly without a process supervisor (Supervisor/systemd), allowing a single worker exit to stop all queue processing until manual restart.

### Why It Happens
In development, `php artisan queue:work` runs in a terminal and stays up. The developer deploys the same command in production without realizing that daemon workers are designed to exit (after `--max-jobs`, `--max-time`, or `--memory`). Without Supervisor, each exit permanently stops processing.

### Warning Signs
- Queue workers running via `nohup` or `screen` instead of Supervisor
- Queue processing stops after worker recycling
- `queue:work` process not managed by Supervisor/systemd
- Backlog growth after deployments or max-jobs thresholds

### Why Harmful
A daemon worker processes 500 jobs, hits `--max-jobs`, and exits gracefully. Without Supervisor, no new process replaces it. The queue accumulates jobs silently. The operations team doesn't notice until users complain about delayed emails or unprocessed webhooks. The backlog grows for hours before detection.

### Consequences
- Queue processing halts on worker exit
- Silent backlog growth until manual intervention
- No automatic recovery from crashes or recycling
- Operations team discovers issue through user complaints

### Alternative
Always run daemon workers under Supervisor or systemd with `autorestart=true` or `Restart=always`.

### Refactoring Strategy
1. Install Supervisor: `apt-get install supervisor`
2. Create worker configuration with `autorestart=true`
3. Replace direct `queue:work` command with Supervisor-managed processes
4. Test: kill worker process, verify Supervisor restarts it
5. Add `queue:restart` to deployment script

### Detection Checklist
- [ ] Workers managed by Supervisor or systemd
- [ ] `autorestart=true` or `Restart=always` configured
- [ ] Worker exit detected and restarted automatically
- [ ] No silent backlog growth from worker exits

### Related Rules
Always Run Workers Under a Process Supervisor

### Related Skills
Configure and Run Laravel Queue Workers in Daemon Mode

### Related Decision Trees
queue:work vs queue:listen

---

## 3. Missing Recycling Limits

### Category
Performance

### Description
Running daemon workers without `--max-jobs` or `--max-time`, allowing memory to grow unbounded until the process OOMs.

### Why It Happens
The defaults for both limits are 0 (unlimited). The developer sets up `queue:work` without these flags, focusing on the queue connection and worker count. The daemon runs fine for hours, but memory slowly accumulates due to PHP's zend_mm allocator not returning memory to the OS, cached data, and connection handles.

### Warning Signs
- Worker command missing `--max-jobs` and `--max-time` flags
- Worker RSS grows over time (visible in `top` or `ps`)
- Workers crash with OOM after hours or days
- Memory graphs show steady growth trend

### Why Harmful
PHP's zend_mm allocator does not return freed memory chunks to the OS — RSS stays high even after garbage collection. A worker that starts at 20MB RSS grows to 200MB+ over hours or days. When it hits the system's OOM killer, it's killed forcibly, potentially corrupting the current job. Without recycling, every worker eventually OOMs.

### Consequences
- Unbounded memory growth until OOM
- Workers force-killed by system OOM killer
- Potential job corruption from force-kill
- Regular worker crashes requiring manual restart

### Alternative
Always set both `--max-jobs` (e.g., 500) and `--max-time` (e.g., 3600) for defense-in-depth memory management.

### Refactoring Strategy
1. Add `--max-jobs=500` and `--max-time=3600` to all worker commands
2. Verify Supervisor `autorestart=true` handles recycling exits
3. Monitor RSS over worker lifetime to confirm limits are effective
4. Tune limits based on observed memory growth

### Detection Checklist
- [ ] Both `--max-jobs` and `--max-time` set on all workers
- [ ] RSS stays below configured `--memory` limit
- [ ] Workers recycle before OOM
- [ ] No memory-related worker crashes

### Related Rules
Set Both --max-jobs and --max-time for Defense in Depth

### Related Skills
Configure and Run Laravel Queue Workers in Daemon Mode

### Related Decision Trees
Worker Recycling Limits: max-jobs vs max-time

---

## 4. No Post-Deploy Worker Restart

### Category
Reliability

### Description
Deploying new code without running `php artisan queue:restart`, causing daemon workers to continue processing with old code against potentially migrated database schemas.

### Why It Happens
The deployment script includes `git pull`, `composer install`, and `migrate` — but no `queue:restart`. The developer tests the HTTP endpoints (which use fresh process-per-request code) and assumes everything works. The daemon workers, booted hours ago, continue running the old code.

### Warning Signs
- Deployment script missing `queue:restart` command
- Workers run for days without restarting
- Jobs fail after deploy with schema-related errors
- Old code behavior observed in queued tasks

### Why Harmful
A migration renames the `status` column to `state` on the orders table. HTTP requests work fine (new code). Daemon workers still run old code that references `status`. Every queued OrderProcessing job fails with "Column not found: status". Thousands of orders fail before someone notices. The jobs exhaust their retry attempts and land in `failed_jobs`.

### Consequences
- Workers process jobs with old application code
- Schema mismatches cause job failures after migration
- Business logic defects from code/schema version mismatch
- jobs exhaust retry attempts due to undetected worker stale code

### Alternative
Always add `php artisan queue:restart` as the final step in every deployment script.

### Refactoring Strategy
1. Add `php artisan queue:restart` to deployment script after all other steps
2. For Horizon: use `php artisan horizon:terminate`
3. Wait briefly for workers to drain (graceful shutdown)
4. Verify workers pick up new code by checking worker boot time

### Detection Checklist
- [ ] `queue:restart` in deployment script
- [ ] Workers restart with new code after deploy
- [ ] No schema-related job failures after deploy
- [ ] Post-deploy monitoring confirms fresh worker code

### Related Rules
Always Run queue:restart After Every Deploy

### Related Skills
Configure and Run Laravel Queue Workers in Daemon Mode

### Related Decision Trees
queue:work vs queue:listen
