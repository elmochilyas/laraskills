# Decision Trees for Queue Restart, Horizon Verification & Post-Deployment Monitoring

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Queue Restart, Horizon Verification & Post-Deployment Monitoring |
| Related KUs | Backward-Compatible Deployments, Queue Deployment Safety, Observability Monitoring |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-QRH-001 | What should the deployment restart sequence be? | P0 |
| DT-QRH-002 | Is Horizon healthy after deployment? | P0 |
| DT-QRH-003 | Should we roll back after seeing failed jobs? | P0 |
| DT-QRH-004 | What should the post-deploy monitoring window be? | P1 |

---

## DT-QRH-001: What Should the Deployment Restart Sequence Be?

### Decision Context
The order of operations during deployment matters. Running `config:cache` after `queue:restart` means workers load stale config. Running migrations before code deploy breaks old workers. The correct sequence prevents deployment-induced failures.

### Decision Criteria
- Does the deployment include code changes?
- Does the deployment include config changes?
- Does the deployment include database migrations?
- Are there active queue workers?

### Decision Tree

```
Are there active queue workers?
├── NO → Deploy code → run migrations → config:cache. No restart needed.
├── YES → Does the deployment include config changes?
    ├── YES → config:cache MUST run before queue:restart
    │   └── Sequence: deploy code → migrations → config:cache → route:cache → queue:restart → horizon:terminate
    └── NO → Does the deployment include code changes?
        ├── YES → Sequence: deploy code → migrations → config:cache (best practice) → queue:restart → horizon:terminate
        └── NO → Static assets only. No restart needed.
```

### Rationale
Workers load configuration during bootstrap. If `config:cache` runs after `queue:restart`, workers have already started with the old cached config. The new config is cached but unused until the next restart. Caching first ensures workers pick up fresh configuration on restart.

### Recommended Default
**Always: deploy code → migrations → config:cache → route:cache → queue:restart → horizon:terminate → verify → monitor.** Even for code-only deploys, running `config:cache` is fast and safe.

### Risks Of Wrong Choice
- **Config:cache after restart**: Workers use stale config. New API keys, queue topology, and feature flags don't take effect.
- **Migrations before code**: Old workers crash on new schema. Jobs fail silently.

### Related Rules
- Always Run config:cache Before queue:restart

---

## DT-QRH-002: Is Horizon Healthy After Deployment?

### Decision Context
After `horizon:terminate`, supervisor should auto-restart Horizon. But supervisor config errors, Redis connection issues, or bad `horizon.php` changes can prevent restart. Without verification, the team may not discover Horizon is down for hours.

### Decision Criteria
- Does `php artisan horizon:status` return exit code 0?
- Are all supervisors showing "Active" in the Horizon dashboard?
- Do worker counts match the configuration?
- Are the correct queues assigned to each supervisor?

### Decision Tree

```
Run: php artisan horizon:status
├── Exit code != 0 → HORIZON IS UNHEALTHY
│   ├── Check: supervisorctl status horizon (is the process running?)
│   │   ├── Not running → supervisorctl start horizon (or check autorestart config)
│   │   └── Running but unhealthy → Check Redis connection, horizon.php syntax
│   └── Do NOT proceed with monitoring until Horizon is healthy.
├── Exit code == 0 → Run: php artisan horizon:list
    ├── All supervisors active with correct worker counts? → HEALTHY. Proceed to monitoring.
    └── Missing supervisors or wrong worker counts? → PARTIALLY UNHEALTHY.
        ├── Check config/horizon.php for syntax errors
        ├── Check supervisor logs for restart failures
        └── Fix before proceeding.
```

### Rationale
Horizon can silently fail to restart. A bad supervisor configuration, a Redis connection issue, or a `horizon.php` syntax error can leave Horizon entirely down. Without verification, queue jobs pile up with no processing, and the team discovers the issue when customers report missing features hours later.

### Recommended Default
**Always verify Horizon health after every deployment. Never assume auto-restart succeeded.**

### Risks Of Wrong Choice
- **No verification**: Horizon is down for hours. All queued jobs pile up. Stripe webhook redelivery storms begin. Revenue-impacting delay.
- **Verification but no action on failure**: The check passes but nobody acts on the result. Same outcome as no verification.

### Related Rules
- Verify Horizon Health After Every Deployment

---

## DT-QRH-003: Should We Roll Back After Seeing Failed Jobs?

### Decision Context
After deployment, failed jobs may appear in the first 15 minutes. Not all failures require rollback — some are transient (network blip) or pre-existing. The decision tree determines when to roll back vs. when to investigate and retry.

### Decision Criteria
- How many failed jobs appeared in the first 5 minutes?
- Are the failures from a single job class or multiple?
- Are the failures serialization-related (ClassNotFoundException, column not found)?
- Were the same jobs failing before the deployment?

### Decision Tree

```
How many failed jobs appeared in the first 5 minutes after deploy?
├── 0 → Continue monitoring to 15 minutes. Likely a clean deploy.
├── 1-5 → Are they from a single job class?
    ├── YES → Is the failure serialization-related (ClassNotFoundException, column not found)?
        ├── YES → ROLLBACK. This is a deployment compatibility issue.
        └── NO → Investigate. May be transient. Retry the jobs.
    └── NO → Multiple job classes failing. ROLLBACK. Broad issue.
├── 5+ → ROLLBACK. Significant deployment issue.
└── After rollback: retry failed jobs, fix root cause, re-deploy with fix.
```

### Rationale
Serialization failures (ClassNotFoundException, column not found) are deployment-related and won't resolve with retries. Transient failures (network timeout, rate limit) may resolve with retries. A broad failure across multiple job classes suggests a systemic issue (config change, Redis connection) that requires rollback.

### Recommended Default
**When in doubt, roll back.** The cost of a rollback is minutes; the cost of a billing incident from a bad deploy is hours of reconciliation and customer trust erosion.

### Risks Of Wrong Choice
- **Rollback when not needed**: 10-15 minutes of deployment delay. Minor cost.
- **No rollback when needed**: Failed jobs accumulate. Billing state diverges. Customers affected. Hours of recovery.

### Related Rules
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment

---

## DT-QRH-004: What Should the Post-Deploy Monitoring Window Be?

### Decision Context
The standard monitoring window is 15 minutes, but some deployments need longer monitoring. Changes to long-running jobs, billing logic, or queue topology may require extended monitoring to catch regressions that appear after the initial window.

### Decision Criteria
- Does the deployment change long-running jobs (timeout > 5 minutes)?
- Does the deployment change billing logic?
- Does the deployment change queue topology?
- Are there scheduled jobs (cron) that run at specific intervals?

### Decision Tree

```
Does the deployment change long-running jobs (timeout > 5 minutes)?
├── YES → MONITOR FOR 30+ MINUTES. Long-running jobs may not complete within the 15-minute window.
├── NO → Does the deployment change billing logic?
    ├── YES → MONITOR FOR 30+ MINUTES. Billing bugs may not surface until the next billing cycle.
    ├── NO → Does the deployment change queue topology?
        ├── YES → MONITOR FOR 30+ MINUTES. Worker rebalancing may take time to stabilize.
        └── NO → STANDARD 15-MINUTE MONITORING is sufficient.
```

### Rationale
Most deployment-related failures appear within the first 5-15 minutes. But long-running jobs may not complete within that window, and billing logic changes may not trigger failures until the next billing cycle. Extended monitoring catches these later-appearing regressions.

### Recommended Default
**Default to 15 minutes. Extend to 30+ minutes for deployments that change long-running jobs, billing logic, or queue topology.**

### Risks Of Wrong Choice
- **15 minutes when 30 was needed**: Long-running job failures appear after monitoring stops. Discovered by customer reports.
- **30 minutes when 15 was sufficient**: 15 extra minutes of monitoring. Negligible cost.

### Related Rules
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment
