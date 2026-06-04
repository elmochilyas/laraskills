# ECC Anti-Patterns — Production Queue Deployment Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | async-distributed-systems |
| **Subdomain** | 11-production-patterns |
| **Knowledge Unit** | Production Queue Deployment Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Skipping horizon:terminate on Deploy — Old Code Runs Indefinitely
2. Not Testing Queue Jobs in Staging — CLI vs Web Context Mismatch
3. Global Rollout of Destructive Job Changes — Mass Data Corruption
4. No Post-Deploy Monitoring — Silent Failure Blindness
5. Deploying During Queue Processing Peak — Maximum Impact
6. stopwaitsecs Too Short — Workers Killed Mid-Job

---

## Repository-Wide Anti-Patterns

- Assuming HTTP Tests Cover Queue Behavior
- No Rollback Plan for Queue-Breaking Deploys

---

## Anti-Pattern 1: Skipping horizon:terminate on Deploy — Old Code Runs Indefinitely

### Category
Deployment | Reliability

### Description
Deploying new code without calling `php artisan horizon:terminate` (or `queue:restart`), causing workers to continue running old code until the next manual restart.

### Why It Happens
Deploy script focuses on HTTP server restart. Team forgets that workers run as long-running processes that don't pick up new code until restarted.

### Warning Signs
- Deploy script doesn't call `horizon:terminate` or `queue:restart`
- Bug fixes for queue jobs don't take effect after deploy
- Workers show old code behavior hours after deploy
- Manual worker restart fixes the issue

### Why It Is Harmful
Code changes for queue jobs don't take effect. Critical bug fixes, security patches, and feature changes are ignored by running workers. Deploy provides false confidence.

### Real-World Consequences
A critical bug fix is deployed for `ProcessOrder` — but all existing workers run the old code. Orders continue processing incorrectly for hours until a manual restart. Customer charges are wrong, and 500 orders must be reprocessed.

### Preferred Alternative
Always run `php artisan horizon:terminate` during deployment, before or after code update. Configure supervisor with `autorestart=true` so workers restart automatically after termination.

### Refactoring Strategy
1. Add `php artisan horizon:terminate` to the deploy script
2. Configure supervisor `autorestart=true` and appropriate `stopwaitsecs`
3. Test deploy process by verifying workers run new code after deploy
4. Add a post-deploy check that verifies worker process start time
5. Document the deployment checklist

### Detection Checklist
- [ ] Deploy script doesn't include `horizon:terminate` or `queue:restart`
- [ ] Worker processes show old start time after deploy
- [ ] Queue job fixes don't take effect until manual restart
- [ ] No supervisor `autorestart=true` configured

### Related Rules
Always run php artisan horizon:terminate during every deployment (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Not Testing Queue Jobs in Staging — CLI vs Web Context Mismatch

### Category
Testing | Reliability

### Description
Only testing HTTP endpoints in staging without testing queue job execution, missing differences between PHP CLI and web SAPI contexts.

### Why It Happens
Teams focus test efforts on HTTP endpoints. Queue jobs are assumed to work the same as web requests.

### Warning Signs
- Staging test suite covers HTTP endpoints only
- Queue jobs not dispatched or verified in staging
- Environment variables differ between web and CLI SAPI
- Job failures in production that were not reproducible in staging

### Why It Is Harmful
Context differences between web and CLI (environment variables, PHP config, memory limits, working directory) cause failures that are only discovered in production.

### Real-World Consequences
A merge request changes the `ProcessOrder` job to use `$_ENV['SECRET_KEY']` — the variable is available in web context but not in CLI via `php artisan queue:work`. All production orders fail with `Undefined array key SECRET_KEY`. No staging test caught this because queue jobs were not tested.

### Preferred Alternative
Dispatch and verify queue job execution in staging as part of the deployment pipeline. Use a test order or event to validate end-to-end processing.

### Refactoring Strategy
1. Add queue job testing to staging deployment script
2. Dispatch a known test job and verify its successful completion
3. Check Horizon dashboard or failed_jobs table post-dispatch
4. Verify environment variables and config are available in CLI context
5. Add CI step that runs queue worker and dispatches a test job

### Detection Checklist
- [ ] No queue job execution tested in staging
- [ ] No test order or event dispatched during staging verification
- [ ] Environment variables used in jobs not verified in CLI
- [ ] Production-only queue job failures

### Related Rules
Always test queue job execution in a staging environment before production (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Global Rollout of Destructive Job Changes — Mass Data Corruption

### Category
Risk Management | Reliability

### Description
Deploying destructive job changes (schema changes, data migrations, cancellation logic) to all workers simultaneously, maximizing blast radius of any bug.

### Why It Happens
Deploy process treats all code changes equally. Teams don't differentiate between display changes and data-modifying job changes.

### Warning Signs
- All workers restarted with new code simultaneously
- No canary or staged rollout for job changes
- Deploy script has no mechanism for partial rollout
- Rollback plan assumes full revert, not incremental

### Why It Is Harmful
A bug in a queue job affects all data within minutes. Blast radius is the entire dataset. Rollback is complex because data is already modified.

### Real-World Consequences
A bug in `CancelSubscription` causes it to cancel the user account instead of the subscription. Within 3 minutes, all 50 workers process 1500 jobs — 1500 users lose access to their accounts. Rollback requires restoring from backup because data is corrupted.

### Preferred Alternative
Use canary deployments for destructive job changes: roll out to one server first, monitor for 10-15 minutes, then roll to remaining servers.

### Refactoring Strategy
1. Classify job changes as "destructive" (data-modifying) vs "safe" (display, logging)
2. For destructive changes, deploy to one server only
3. Monitor failed jobs, data integrity, and error rates on canary server
4. If no issues after 15 minutes, terminate remaining workers
5. Document canary procedure in runbook

### Detection Checklist
- [ ] All workers restarted simultaneously for data-modifying job changes
- [ ] No canary deployment procedure documented
- [ ] Deploy script doesn't support selective worker restart
- [ ] Rollback plan assumes full database restore

### Related Rules
Use canary deployments for destructive job changes (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: No Post-Deploy Monitoring — Silent Failure Blindness

### Category
Observability | Operations

### Description
Not monitoring failed job counts, queue lag, or processing errors in the critical 30-minute window after deployment.

### Why It Happens
Post-deploy checklist focuses on HTTP endpoint health. Queue processing is not included in the deploy verification.

### Warning Signs
- Deploy verification checks website but not queue processing
- Post-deploy failed jobs discovered hours or days later
- No alerting configured on failed job count increase
- Queue dashboard checked only during incidents

### Why It Is Harmful
Queue-related bugs can go undetected for hours while the backlog grows. By the time someone notices, thousands of jobs have failed and data is inconsistent.

### Real-World Consequences
A schema migration renames a column — all `ProcessOrder` jobs fail with `Column not found`. The deployed website works fine (no HTTP endpoints affected), but orders silently stop processing for 45 minutes. By discovery time, 3,000 orders are stuck in the queue.

### Preferred Alternative
Monitor failed jobs count, queue lag, and processing errors intensively for 30 minutes after every deploy.

### Refactoring Strategy
1. Add post-deploy monitoring to deploy checklist
2. Set up alerts on failed_jobs table count increase
3. Add queue lag dashboard with historical comparison
4. Verify a test job processes successfully after deploy
5. Document expected failed job baseline vs alerting threshold

### Detection Checklist
- [ ] No failed job monitoring in post-deploy checklist
- [ ] No alerting on failed job count increase
- [ ] Queue health not verified after deploy
- [ ] Failed jobs discovered by customer support, not monitoring

### Related Rules
Monitor failed jobs intensively for 30 minutes after each deploy (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Deploying During Queue Processing Peak — Maximum Impact

### Category
Operations | Risk Management

### Description
Deploying queue-related changes during peak processing hours, maximizing the blast radius of any deployment issue.

### Why It Happens
Deploy schedule is driven by business hours or convenience, not queue traffic patterns.

### Warning Signs
- Deploys happen during business hours when queue throughput is highest
- Queue traffic charts show deploy times at peak processing periods
- Incidents from queue deploys correlate with peak hours
- No traffic-aware deployment scheduling

### Why It Is Harmful
Deploy issues affect the maximum number of jobs. Rollbacks during peak have the highest data integrity risk. Worker restart delays processing during the busiest period.

### Real-World Consequences
A deploy triggers `horizon:terminate` at 2 PM during peak order processing. Workers restart during the busiest hour — 500 orders are delayed by 5 minutes. The deploy has a bug, and rollback restarts workers again — another 5-minute delay. Peak hour throughput is halved.

### Preferred Alternative
Schedule queue-related deploys during low-traffic periods. Use traffic charts to identify the lowest-throughput window.

### Refactoring Strategy
1. Analyze queue traffic patterns to identify low-traffic windows
2. Schedule destructive queue deploys during low-traffic periods
3. Add deploy window documentation to runbook
4. Set up deploy freeze during known peak periods (Black Friday, etc.)
5. Monitor queue traffic patterns for optimal deploy timing

### Detection Checklist
- [ ] Deploys during peak queue traffic hours
- [ ] No traffic analysis used for deploy scheduling
- [ ] Deploy incidents correlate with peak processing times
- [ ] No deploy freeze for known peak periods

### Related Rules
Monitor failed jobs intensively for 30 minutes after each deploy (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)

---

## Anti-Pattern 6: stopwaitsecs Too Short — Workers Killed Mid-Job

### Category
Reliability | Data Integrity

### Description
Configuring supervisor `stopwaitsecs` shorter than the longest job's `retry_after`, causing workers to be killed mid-processing when `horizon:terminate` is called.

### Why It Happens
`stopwaitsecs` is set to a default or arbitrary value without considering job execution times.

### Warning Signs
- Jobs fail with no error message after deployment
- `failed_jobs` table shows jobs that were in progress during deploy
- Worker logs show SIGKILL during job processing
- `stopwaitsecs` value is not documented or reviewed

### Why It Is Harmful
Jobs killed mid-processing may have partially completed side effects. Without proper job idempotency, this causes data corruption. The job fails but may have already written data.

### Real-World Consequences
A 5-minute report generation job is running when `horizon:terminate` is called. Supervisor `stopwaitsecs` is set to 10 seconds — after 10 seconds, the worker is SIGKILL'd. The report is partially generated: the PDF file exists but is incomplete, and some data was sent to external services.

### Preferred Alternative
Set `stopwaitsecs` to `retry_after + 10` (or at least the longest job's timeout) to give workers enough time to finish the current job before being killed.

### Refactoring Strategy
1. Identify the longest job timeout in the system
2. Set supervisor `stopwaitsecs` to `max_retry_after + 10 seconds`
3. Document that `stopwaitsecs` must be updated when new long jobs are added
4. Test by terminating Horizon while a long job is running
5. Verify the job completes and is not killed mid-processing

### Detection Checklist
- [ ] `stopwaitsecs` value not documented or reviewed
- [ ] Jobs fail during deploy with no error trace
- [ ] SIGKILL signals in worker logs during deploy
- [ ] `stopwaitsecs` shorter than the longest job's retry_after

### Related Rules
Always run php artisan horizon:terminate during every deployment (05-rules.md)

### Related Skills
Deploy Queue Workers with Zero Downtime (06-skills.md)

### Related Decision Trees
Queue Deployment Strategy (07-decision-trees.md)
