# Production Queue Deployment Patterns

## Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** 11-production-patterns
**Knowledge Unit:** Production Queue Deployment Patterns
**Difficulty:** Advanced
**Category:** Operations
**Last Updated:** 2026-06-04

## Overview

Production Queue Deployment Patterns encompass the operational procedures for safely deploying code changes that affect queue jobs. Unlike HTTP requests, which are handled by short-lived processes that pick up new code immediately on restart, queue workers are long-running daemon processes that continue executing old code until explicitly terminated.

This gap between HTTP deployment and queue worker code refresh is the primary source of queue-related deployment incidents. A deployment may appear successful from the HTTP side while workers silently run old code, process data with the wrong schema, or crash due to incompatible changes.

Engineers should care because queue deployment failures are among the hardest to detect. The website loads fine, API endpoints respond correctly — but orders are not processing, emails are not sending, and background jobs are failing silently. By the time someone notices, thousands of jobs may have failed, and data may be inconsistent.

## Core Concepts

**Graceful Worker Termination:** Workers must be told to stop gracefully (finish current job, don't pick up new ones) before new code is deployed. `php artisan horizon:terminate` sends a signal that causes Horizon workers to stop accepting new jobs after finishing their current one. `php artisan queue:restart` does the same for standard queue workers.

**Supervisor Auto-Restart:** Process managers like Supervisor must have `autorestart=true` configured. When a worker process terminates (after `horizon:terminate`), Supervisor automatically restarts it. The new worker process loads the new code. This is the restart mechanism — not the workers restarting themselves.

**Canary Deployment:** Deploying to a subset of workers first, monitoring for issues, then rolling to the remaining workers. This limits the blast radius of buggy job changes. Only one server (or worker pool) runs the new code while the rest continue with the old.

**CLI vs Web SAPI Context:** Queue jobs execute in PHP CLI context, not web SAPI context. Environment variables, PHP configuration (`php.ini`), and available extensions can differ between the two. A job that works in a controller may fail in a worker due to these differences.

**Post-Deploy Monitoring Window:** The first 30 minutes after deployment is the critical window for detecting queue job failures. Most bugs manifest within this window. After 30 minutes, successful processing indicates the deployment is stable.

## When To Use

- Every production deployment that modifies job classes, listeners, or subscribed events
- Any deploy where queue workers run continuously (daemon mode)
- Destructive job changes requiring staged rollout (data migrations, schema changes)
- Teams using Horizon or Supervisor for worker management
- Applications with separate queue infrastructure from web servers

## When NOT To Use

- Development environments (workers can restart manually or be left running)
- Trivial infrastructure-only changes (server upgrades, dependency updates without code changes)
- Emergency hotfixes requiring immediate global rollout (accept the risk of canary skip)
- Serverless queue processing (SQS + Lambda) where worker lifecycle is managed by the cloud provider

## Best Practices

**Always Run `horizon:terminate` During Deploy:** Make this a mandatory step in every deployment script. Use a deployment hook that cannot be skipped.

**Test Queue Jobs in Staging:** Dispatch and verify at least one job per queue type in staging before production deployment. Catch CLI-context issues before they reach production.

**Use Canary Deploys for Destructive Changes:** Classify job changes as destructive (data-modifying) or safe (display, logging, non-data operations). Destructive changes always go through canary rollout.

**Monitor Failed Jobs for 30 Minutes Post-Deploy:** Check the `failed_jobs` table, Pulse dashboard, or Horizon metrics actively for 30 minutes after each deploy. Set up alerts on failed job count increase.

**Configure `stopwaitsecs` Properly:** Set Supervisor's `stopwaitsecs` to `retry_after + 10` seconds to give workers enough time to finish the current job before being killed.

**Deploy During Low-Traffic Periods:** Schedule queue-related deploys during the lowest queue throughput window. Analyze traffic patterns to identify the optimal window.

## Architecture Guidelines

**Separate Queue and Web Infrastructure:** Workers should run on dedicated servers or containers, separate from web servers. This prevents resource contention and allows independent deployment and scaling.

**One Worker Pool Per Queue Type:** High-priority queues need different worker configurations (concurrency, timeout) than batch processing queues. Maintain separate Supervisor programs or Horizon supervisors per queue type.

**Use Horizon for Production:** Horizon provides process management, monitoring, and balancing for Redis-backed queues. Its `horizon:terminate` command supports graceful restarts. For non-Redis drivers, use Supervisor with `queue:restart`.

**Automate Deployment Verification:** Add a post-deploy script that dispatches a test job, waits for its completion, and verifies successful processing. Fail the deployment if the test job fails.

**Document the Runbook:** Write a deployment runbook that covers: pre-deploy checks, termination procedure, canary steps, monitoring plan, rollback procedure, and post-deploy verification.

**Version Compatibility Matrix:** When deploying across multiple environments, ensure queue job serialization format is compatible. A job serialized by new code cannot be deserialized by old code during rolling deploys.

## Performance Considerations

- `horizon:terminate` completion time depends on the longest-running job's remaining execution time. Budget 30-60 seconds for termination completion.
- During termination, workers stop accepting new jobs. Queue backlog grows during deployment. Ensure backlog can be cleared within acceptable time after workers restart.
- Multiple simultaneous worker restarts create a spike in database/API connections. Consider staggering restarts for large worker pools.
- Canary deployments reduce throughput proportionally (1 out of 10 workers = 10% reduced capacity) during the monitoring window.

## Security Considerations

- `horizon:terminate` and `queue:restart` should be restricted to deployment users/scripts. Protect these commands with appropriate authentication.
- Worker processes run with full application permissions. Restrict worker server access to only necessary systems.
- Failed job storage contains serialized data including potentially sensitive information. Ensure storage is encrypted and access-controlled.
- Post-deploy monitoring should not expose sensitive data in error logs or dashboards.
- Emergency hotfix deploys should follow the same security procedures as standard deploys, not bypass them.

## Common Mistakes

**Skipping Worker Termination:** Deploying without `horizon:terminate` or `queue:restart`. Workers continue running old code until the next restart, which may be days or weeks later.

**Why developers make it:** The deployment script focuses on web server restart. Queue worker termination is an "extra step" that is forgotten.

**Consequences:** Code changes for queue jobs don't take effect. Critical bug fixes are ignored by running workers. Deploy provides false confidence.

**Better approach:** Make `horizon:terminate` a mandatory, automated step in every deployment. Use deployment hooks or CI pipeline checks that verify termination was called.

**Not Testing in Staging:** Only testing HTTP endpoints in staging, not queue job execution.

**Why developers make it:** Testing queue job execution requires setting up workers in staging, which is perceived as effort.

**Consequences:** Context differences between web and CLI cause failures that are only discovered in production — env variables, PHP config, working directory differences.

**Better approach:** Add a staging step that dispatches a test job and verifies its successful processing through the queue system.

**Global Rollout of Destructive Changes:** Deploying data-modifying job changes to all workers simultaneously.

**Why developers make it:** The deploy process treats all code changes equally. No differentiation between safe and destructive changes.

**Consequences:** A bug in a queue job affects all data within minutes. Blast radius is the entire dataset. Rollback is complex because data is already modified.

**Better approach:** Classify changes. Use canary rollout for destructive changes. Monitor before expanding.

**No Post-Deploy Monitoring:** Deploying and walking away without checking queue health.

**Why developers make it:** Deploy verification checks website health but not queue processing. Queue issues are invisible from the HTTP side.

**Consequences:** Queue bugs go undetected for hours while the backlog grows. By discovery time, thousands of jobs have failed.

**Better approach:** Set up failed job alerting. Add queue health to the deployment dashboard. Monitor actively for 30 minutes.

**Incorrect stopwaitsecs:** Setting `stopwaitsecs` too short, causing workers to be killed mid-job.

**Why developers make it:** Default or arbitrary value is set without considering job execution times.

**Consequences:** Workers killed mid-processing cause partially completed side effects. Job failures with no error messages.

**Better approach:** Set `stopwaitsecs` to `retry_after + 10` seconds. Document that this must be updated when long jobs are added.

## Anti-Patterns

**Silent Draining:** Calling `queue:restart` without monitoring that workers actually terminated. Old workers may continue running due to misconfiguration. Verify via Horizon dashboard or process list.

**Deploy During Peak:** Scheduling queue deploys during peak business hours. This maximizes blast radius and recovery time. Schedule during the measured low-traffic window.

**Manual Worker Management:** Restarting workers by hand instead of automating through deployment scripts. Human forgetfulness is the primary cause of missed worker restarts.

**One-Size-Fits-All Deploy:** Using the same deployment procedure for all job changes. Safe changes (logging, formatting) don't need canary rollout. Destructive changes always do.

**No Rollback Plan:** Deploying queue changes without a tested rollback procedure. If the deploy breaks processing, workers must be reverted to old code and failed jobs must be replayed.

## Examples

### Horizon Deploy Script
```bash
#!/bin/bash
# Pre-deploy: graceful termination
php artisan horizon:terminate

# Wait for workers to drain (monitor via Horizon)
sleep 30

# Deploy code
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force

# Clear caches
php artisan optimize:clear

# Post-deploy verification
php artisan queue:monitor --queue=high,default,low
echo "Deploy complete. Monitor Horizon for failed jobs."
```

### Supervisor Configuration
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=forge
numprocs=8
redirect_stderr=true
stdout_logfile=/var/log/worker.log
stopwaitsecs=100  ; retry_after(90) + 10
```

### Post-Deploy Monitoring Script
```bash
#!/bin/bash
echo "Monitoring queue for 30 minutes..."
for i in $(seq 1 30); do
    FAILED=$(php artisan queue:failed-table | wc -l)
    echo "Minute $i: $FAILED failed jobs"
    if [ "$FAILED" -gt "$BASELINE" ]; then
        echo "ALERT: Failed job spike detected!"
        # Trigger alert
    fi
    sleep 60
done
echo "Post-deploy monitoring complete."
```

## Related Topics

**Prerequisites:**
- Queue Worker Architecture (ku-ads-001)
- Supervisor Configuration
- Horizon Scaling & Monitoring (ku-ads-007)

**Closely Related:**
- Queue Deployment Restart Strategies
- Worker Graceful Shutdown Patterns
- Job Batching Deployment Hazards (ku-ads-002)

**Advanced Follow-Up:**
- Blue-Green Deployment for Queue Workers
- Queue Migration Strategies
- Disaster Recovery for Queue Infrastructure

**Cross-Domain Connections:**
- CI/CD Pipeline Integration
- Observability for Queue Health
- Infrastructure as Code for Worker Configuration
