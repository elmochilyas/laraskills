---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K041 — Horizon Supervisor Configuration
Knowledge ID: K041
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | One Giant Supervisor for All Queues | Architecture | High |
| 2 | Missing `maxJobs`/`maxTime` — Memory Leak Accumulation | Operations | High |
| 3 | No `horizon:terminate` in Deploy Script | Operations | Critical |
| 4 | Hardcoding Server-Specific Paths in Supervisor Config | Architecture | Low |
| 5 | Missing Environment Config — Horizon Refuses to Start | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Monolithic Supervisor | High — one workload starves others | Per-queue-type supervisor isolation |
| Missing Worker Recycling | Critical — OOM crashes from unbounded memory growth | Always set `maxJobs` and `maxTime` |
| Deploy Without Graceful Restart | Critical — workers run old code indefinitely | Add `horizon:terminate` to every deploy script |

---

## 1. One Giant Supervisor for All Queues

### Category
Architecture

### Description
Defining a single supervisor that processes all queue types (webhooks, emails, reports, default) with the same configuration. Each workload type has different requirements for timeout, retries, concurrency, and memory — but they all share one config.

### Why It Happens
- Starting with a single queue and never splitting as the application grows
- Not knowing Horizon supports multiple supervisors
- Assuming one supervisor is simpler to manage
- Copying minimal Horizon config from documentation examples
- No clear ownership of different queue workloads

### Warning Signs
- A single supervisor in `config/horizon.php` processing `['webhooks', 'emails', 'reports', 'default']`
- Timeout setting is a compromise: too short for reports, too long for webhooks
- A report job blocks a worker for 5 minutes, reducing webhook capacity
- Retry count is wrong for all queue types (emails should not retry, webhooks need retries)
- Cannot tune worker count per queue type

### Why Harmful
Different job types have different resource requirements — a report generation job (timeout 600s) and a webhook job (timeout 60s) share the same supervisor. A report job takes 300 seconds and blocks a worker, reducing capacity for webhooks. The shared timeout setting causes premature termination of report jobs (if too low) or delayed webhook failure detection (if too high). One workload's characteristics negatively affect all others sharing the supervisor.

### Consequences
- Webhook processing delays caused by report job blocking workers
- Report jobs terminated prematurely (timeout too low for reports)
- Retry configuration wrong for all queue types
- Cannot scale worker counts independently per queue type
- One misbehaving job (memory leak, infinite loop) affects all queue types
- Troubleshooting complexity: which workload is causing the issue?

### Alternative
- Define one supervisor per queue type with tuned configuration:
  ```php
  'supervisor-webhooks' => [
      'queue' => ['webhooks'], 'timeout' => 60,  'tries' => 3, 'nice' => 0,
  ],
  'supervisor-emails' => [
      'queue' => ['emails'],   'timeout' => 120, 'tries' => 1, 'nice' => 10,
  ],
  'supervisor-reports' => [
      'queue' => ['reports'],  'timeout' => 600, 'tries' => 1, 'nice' => 19,
  ],
  ```

### Refactoring Strategy
1. Audit all queue types in the application
2. Define a separate supervisor for each queue type with tuned config
3. Set `minProcesses >= 1` for each supervisor
4. Tune `timeout`, `tries`, `nice`, and balancing per queue type
5. Deploy and monitor — each queue type should have independent worker pools
6. Remove the old monolithic supervisor

### Detection Checklist
- [ ] Each queue type has its own supervisor (no sharing)
- [ ] Timeout, tries, nice tuned per queue type
- [ ] Worker counts can be scaled independently per queue type
- [ ] No worker blocking across different queue types
- [ ] Queue type isolation documented

### Related Rules
- isolate-queue-types-in-supervisors

### Related Skills
- Configure Horizon Supervisors for Queue Workers

### Related Decision Trees
- Horizon Supervisor Process Count and Balance Strategy
- Auto-Balancing vs Fixed Process Count

---

## 2. Missing `maxJobs`/`maxTime` — Memory Leak Accumulation

### Category
Operations

### Description
Omitting `maxJobs` and `maxTime` on supervisor configurations. Workers process jobs indefinitely without restarting — PHP memory accumulates over time, eventually exceeding the `memory_limit` and causing the worker to crash mid-job.

### Why It Happens
- Not knowing `maxJobs` and `maxTime` options exist
- Assuming PHP memory is stable (no leaks in well-written code)
- Focusing only on `minProcesses`/`maxProcesses` for capacity
- Copying Horizon config without worker recycling
- Not monitoring per-worker memory utilization

### Warning Signs
- Worker processes grow from 20MB to 200MB over hours of operation
- PHP `memory_limit` errors in Horizon logs
- Workers crash mid-job with "Allowed memory size exhausted" errors
- Failed jobs increasing over time as workers age
- No `maxJobs` or `maxTime` in any supervisor config

### Why Harmful
A worker processes 5000 jobs over 8 hours — PHP's memory grows from 20MB to 200MB. Even without application-level memory leaks, PHP frameworks accumulate memory (query logs, cached objects, etc.). Eventually, the process hits the `memory_limit` (typically 128MB-256MB) and is killed mid-job. The job fails, may need retry, and the worker must be restarted. Without `maxJobs`/`maxTime`, this happens at unpredictable intervals, usually during peak traffic when the worker has processed the most jobs.

### Consequences
- Unpredictable worker crashes during peak processing
- Jobs failed mid-process (may cause duplicate processing on retry)
- Increased failed job count
- Worker restart overhead during busy periods
- Memory exhaustion affects other processes on the same server
- Debugging is confusing: "why did my job fail?" — memory limit, not application error

### Alternative
- Always set `maxJobs` and `maxTime` on all supervisors:
  ```php
  'supervisor-default' => [
      'maxJobs' => 500,  // Restart after 500 jobs
      'maxTime' => 3600, // Restart after 1 hour
  ],
  ```
- Monitor worker memory growth to tune the values
- 500 jobs or 1 hour is standard for most applications

### Refactoring Strategy
1. Add `maxJobs` (e.g., 500) and `maxTime` (e.g., 3600) to all supervisors
2. Deploy and verify workers restart after processing 500 jobs or 1 hour
3. Monitor memory usage — expect stable memory footprint per worker
4. Tune values if workers restart too frequently (higher maxJobs) or too rarely (lower)
5. Check failed job count — expect reduction in memory-related failures

### Detection Checklist
- [ ] `maxJobs` set on every supervisor
- [ ] `maxTime` set on every supervisor
- [ ] Worker memory footprint is stable (no unbounded growth)
- [ ] No "Allowed memory size exhausted" errors in Horizon logs
- [ ] Failed job count from memory exhaustion is zero
- [ ] Restart frequency matches configured values

### Related Rules
- set-max-jobs-and-max-time

### Related Skills
- Configure Horizon Supervisors for Queue Workers

### Related Decision Trees
- Horizon Supervisor Process Count and Balance Strategy

---

## 3. No `horizon:terminate` in Deploy Script

### Category
Operations

### Description
Deploying new code without running `php artisan horizon:terminate` in the deployment script. Workers continue running the old version's code indefinitely, ignoring newly deployed queue job logic until manually restarted.

### Why It Happens
- Not knowing `horizon:terminate` exists (or confusing it with `queue:restart`)
- Deploy script focuses on application code, not queue workers
- Assuming Horizon auto-detects code changes (it does not)
- Manual restart habit: "I'll restart Horizon after deploy" — often forgotten
- No deploy checklist that includes Horizon termination

### Warning Signs
- New queue job logic deployed but old behavior persists
- Workers continue processing with pre-deploy code for hours
- `ps aux` shows worker start times predating the deploy
- "But I deployed the fix!" — job still runs old code
- No `horizon:terminate` in deployment script

### Why Harmful
New queue job logic is deployed — but workers continue running the old version's code for hours. Users report features not working as expected, but code inspection shows the new logic is correct. Debugging time is wasted checking code, config, and Redis before someone realizes the workers haven't restarted. The deploy is effectively incomplete — queue processing is running a different version of the application.

### Consequences
- Deploy rollback confusion: new code deployed, old code running
- Users experience stale behavior for hours
- Production hotfixes for queue jobs don't take effect
- Debugging time wasted on "code change not working"
- Inconsistent state: web requests use new code, queue processing uses old code

### Alternative
- Always add `horizon:terminate` to deployment scripts:
  ```bash
  # After code deploy and config cache
  php artisan horizon:terminate
  ```
- This sends SIGTERM to workers, allowing them to finish current job and restart
- New workers pick up the new code automatically (Horizon master restarts them)

### Refactoring Strategy
1. Add `php artisan horizon:terminate` to deployment script (after code deploy)
2. Test deploy: verify workers show new start time after deploy
3. Verify old jobs complete (graceful termination) and new jobs use new code
4. Document in deploy runbook: "always run horizon:terminate"
5. Add post-deploy check: worker start times should be after deploy timestamp

### Detection Checklist
- [ ] `horizon:terminate` in deployment script
- [ ] Workers restart after deploy with new code
- [ ] No stale workers running pre-deploy code
- [ ] Graceful termination: jobs in progress complete before restart
- [ ] Deploy runbook includes Horizon termination step

### Related Rules
- add-horizon-terminate-to-deploy

### Related Skills
- Configure Horizon Supervisors for Queue Workers

### Related Decision Trees
- Horizon Supervisor Process Count and Balance Strategy
- Auto-Balancing vs Fixed Process Count

---

## 4. Hardcoding Server-Specific Paths in Supervisor Config

### Category
Architecture

### Description
Including server-specific paths, IP addresses, or credentials directly in `config/horizon.php`. The config file is version-controlled and deployed across environments — server-specific values cause failures when the config is used on a different server.

### Why It Happens
- Convenience during development (hardcode local paths)
- Not using environment variables for server-specific settings
- Copying config from one server without adjusting for the target
- Assuming everyone has the same filesystem layout
- Not testing Horizon config across all deployment environments

### Warning Signs
- Hardcoded paths like `/home/deploy/app/storage/logs/` in config
- IP addresses instead of environment variables
- Absolute filesystem paths in supervisor config
- Config works on one server but fails on another
- `APP_ENV` specific config references local paths

### Why Harmful
A hardcoded path that exists on the developer's machine doesn't exist on the production server — Horizon fails to start or, worse, fails silently during runtime. Config that includes server names or IPs means the same config file cannot be deployed across staging and production without modification. Version control history contains environment-specific secrets (paths may leak directory structure).

### Consequences
- Horizon fails to start on specific servers
- Config must be manually modified per deployment environment
- Version control contains environment-specific artifacts
- Deploy process requires config file patching
- Security: server directory structure exposed in code repository

### Alternative
- Use environment variables for server-specific values:
  ```php
  'environments' => [
      'production' => [
          'supervisor-default' => [
              'queue' => [env('HORIZON_QUEUE', 'default')],
              // Other settings...
          ],
      ],
  ],
  ```
- Keep config server-agnostic — deploy the same file everywhere
- Use `.env` files for per-server overrides

### Refactoring Strategy
1. Audit `config/horizon.php` for hardcoded paths, IPs, or server names
2. Replace with `env()` calls or configuration variables
3. Update `.env` files on each server with appropriate values
4. Delete environment-specific config variants
5. Test Horizon start on all environments with the unified config

### Detection Checklist
- [ ] No hardcoded paths in `config/horizon.php`
- [ ] All server-specific values use `env()` or config variables
- [ ] Same config file works across all environments
- [ ] No environment-specific config variants in version control
- [ ] Deploy process does not modify config file

### Related Rules
- isolate-queue-types-in-supervisors

### Related Skills
- Configure Horizon Supervisors for Queue Workers

### Related Decision Trees
- Horizon Supervisor Process Count and Balance Strategy
- Auto-Balancing vs Fixed Process Count

---

## 5. Missing Environment Config — Horizon Refuses to Start

### Category
Operations

### Description
Deploying to an environment that is not listed in the `environments` array of `config/horizon.php`. Horizon refuses to start with an error if the current `APP_ENV` doesn't match a defined environment key.

### Why It Happens
- Adding a new environment (staging, review apps, CI) without updating Horizon config
- Not including the environment in the PR that creates it
- Copying `.env.example` without checking Horizon environment mapping
- Assuming Horizon falls back to a default config (it does not)
- Not testing Horizon start in the new environment

### Warning Signs
- `php artisan horizon` returns an error on the new environment
- Error message: "No supervisor configuration found for environment [staging]"
- Deploy pipeline fails at the Horizon start step
- New team members can't start Horizon in their local environment
- Environment list in `horizon.php` doesn't match actual deployment environments

### Why Harmful
Horizon will not start — no queue processing, no dashboard, no metrics. If the environment is production-like (staging, pre-prod), the error may go unnoticed until someone checks queue processing. The deploy to a new environment requires an emergency code change to add the environment mapping, potentially delaying the release.

### Consequences
- Horizon fails to start on deploy
- Queue processing is down until config is updated
- Emergency hotfix needed for a config-only change
- Deployment pipeline blocked
- No queue processing means: delayed emails, unprocessed webhooks, stalled batch jobs
- Confusing error for operators unfamiliar with Horizon config

### Alternative
- Always include all deployment environments in `horizon.php`:
  ```php
  'environments' => [
      'production' => [...],
      'staging' => [...],
      'local' => [...],
  ],
  ```
- Add environment mapping as part of environment creation checklist
- Use a wildcard or default if environments share config (not recommended — be explicit)

### Refactoring Strategy
1. Audit all deployment environments against `horizon.php` environment keys
2. Add missing environments with appropriate supervisor config
3. Verify `php artisan horizon` starts on each environment
4. Add environment creation checklist: "Add environment to horizon.php"
5. Consider a CI check that validates Horizon config for each environment

### Detection Checklist
- [ ] All deployment environments listed in `horizon.php` `environments` array
- [ ] `php artisan horizon` starts successfully on each environment
- [ ] New environment checklist includes Horizon config update
- [ ] No "No supervisor configuration found" errors in deployment history
- [ ] CI validates Horizon config environment completeness

### Related Rules
- set-max-jobs-and-max-time, add-horizon-terminate-to-deploy

### Related Skills
- Configure Horizon Supervisors for Queue Workers

### Related Decision Trees
- Horizon Supervisor Process Count and Balance Strategy
