# Production Queue Deployment Patterns

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Production Patterns
- **Knowledge Unit:** Production Queue Deployment Patterns
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Production Queue Deployment Patterns cover the operational procedures for safely deploying code changes that affect queue jobs. Unlike HTTP requests handled by short-lived processes that pick up new code immediately on restart, queue workers are long-running daemon processes that continue executing old code until explicitly terminated. This gap is the primary source of queue-related deployment incidents — the website loads fine while workers silently run old code, process data with the wrong schema, or crash due to incompatible changes. By the time someone notices, thousands of jobs may have failed and data may be inconsistent.

---

## Core Concepts
- **Graceful Worker Termination**: Tell workers to stop accepting new jobs (finish current job, don't pick up new ones) before deploying. `php artisan horizon:terminate` for Horizon workers; `php artisan queue:restart` for standard workers
- **Supervisor Auto-Restart**: Process managers with `autorestart=true` automatically restart terminated workers, which then load the new code
- **Canary Deployment**: Deploy to a subset of workers first, monitor for issues, then roll to remaining workers — limits blast radius of buggy changes
- **CLI vs Web SAPI Context**: Queue jobs execute in PHP CLI context — environment variables, php.ini, and available extensions can differ from web SAPI; a job that works in a controller may fail in a worker
- **Post-Deploy Monitoring Window**: The first 30 minutes after deployment is the critical window for detecting queue job failures — most bugs manifest within this window

---

## Mental Models
1. **Queue Workers as Sleeping Giants**: HTTP servers are like light sleepers — they wake up (restart) immediately and see new code. Queue workers are deep sleepers — a deployment is a whisper they might not hear. You must shake them awake (terminate) for them to see new code. Without explicitly terminating workers, they dream on with old code for days or weeks.
2. **Canary Deployment as Mine Canary**: Before releasing miners (all workers) into a potentially dangerous environment (new code), send one canary (a single worker pool) first. If the canary stops singing (jobs fail), you know the environment is unsafe. If the canary thrives, the remaining miners can safely enter.

---

## Internal Mechanics
When `php artisan horizon:terminate` is called, Horizon sends a SIGTERM to each worker process. Workers finish their current job (respecting `retry_after`) and do not pick up new ones. The Horizon master process then exits. Supervisor (with `autorestart=true`) detects the process exit and starts a new Horizon master process, which loads the new code from disk. The entire cycle takes `retry_after + overhead` seconds per worker. During this window, no workers are processing that queue — the backlog grows.

---

## Patterns
### Mandatory Termination in Deploy Script
- **Purpose**: Ensure workers always restart during deployment
- **Mechanism**: Include `php artisan horizon:terminate` as a mandatory, non-skippable step in every deployment script
- **Benefits**: Eliminates the most common queue deployment failure

### Canary Rollout for Destructive Changes
- **Purpose**: Limit blast radius of data-modifying job changes
- **Mechanism**: Deploy to 10% of workers (1 out of 10), monitor for 30 minutes, then deploy to remaining 90%
- **Benefits**: Buggy changes affect only 10% of data; rollback is straightforward

---

## Architectural Decisions
- **Use Horizon for production** Redis-backed queues — `horizon:terminate` provides graceful restarts with monitoring
- **Use Supervisor for non-Redis** drivers — `queue:restart` with Supervisor auto-restart
- **Separate queue and web infrastructure** — dedicated servers/containers for workers prevent resource contention and allow independent deployment
- **One worker pool per queue type** — different configurations for high-priority vs batch queues

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Guaranteed worker code refresh | Queue backlog grows during termination window | Budget `retry_after + overhead` seconds |
| Limited blast radius with canary | Reduced throughput during monitoring (10% capacity) | Acceptable for critical changes |
| Automated, repeatable deploys | Requires deployment infrastructure investment | Set up CI/CD pipeline with hooks |

---

## Performance Considerations
`horizon:terminate` completion time depends on the longest-running job's remaining time — budget 30-60 seconds. Backlog grows during termination; ensure it can be cleared within acceptable time after workers restart. Multiple simultaneous worker restarts create a spike in database/API connections — consider staggering restarts for large pools. Canary deployments reduce throughput proportionally during the monitoring window.

---

## Production Considerations
Always run `horizon:terminate` during deploy. Test queue jobs in staging (catch CLI-context issues). Classify changes as safe or destructive — canary only destructive ones. Monitor failed jobs for 30 minutes post-deploy. Configure Supervisor `stopwaitsecs = retry_after + 10` seconds. Deploy during low-traffic periods. Automate deployment verification with a post-deploy script that dispatches a test job and verifies successful processing.

---

## Common Mistakes
1. **Skipping worker termination**: Workers continue running old code — the most common queue deployment failure. Fix: automate termination in CI/CD.
2. **Not testing in staging**: Only HTTP endpoints tested, CLI context differences cause production failures. Fix: dispatch test jobs in staging.
3. **Global rollout of destructive changes**: Bug affects all data within minutes. Fix: canary rollout for destructive changes.
4. **No post-deploy monitoring**: Queue bugs invisible from the HTTP side. Fix: failed job alerting, 30-minute monitoring window.
5. **Incorrect `stopwaitsecs`**: Workers killed mid-job, partially completed side effects. Fix: `stopwaitsecs = retry_after + 10`.

---

## Failure Modes
- **Silent draining**: `queue:restart` called but workers don't actually terminate due to misconfiguration — verify via Horizon dashboard or process list
- **Deploy during peak**: Maximizes blast radius and recovery time — schedule during measured low-traffic window
- **No rollback plan**: If deploy breaks processing, workers must be reverted and failed jobs replayed — document rollback procedure before deploying
- **Version incompatibility**: Job serialized by new code can't be deserialized by old code during rolling deploys — maintain version compatibility matrix

---

## Ecosystem Usage
Horizon provides `horizon:terminate` for graceful restarts with monitoring. Supervisor manages worker processes with `autorestart=true` for auto-restart. Deployment scripts should include pre-deploy termination, code deployment, cache clearing, and post-deploy verification steps. Pulse and Horizon dashboards provide post-deploy monitoring visibility.

---

## Related Knowledge Units
### Prerequisites
- Queue Worker Architecture — Worker daemon lifecycle and signaling
- Supervisor Configuration — Process management fundamentals
- Horizon Scaling & Monitoring — Horizon architecture and features

### Related Topics
- Worker Graceful Shutdown Patterns — SIGTERM handling and job completion
- Job Batching Deployment Hazards — Batch-specific deployment risks
- Deployment Restart Strategies — Deployment timing and canary patterns

### Advanced Follow-up Topics
- Blue-Green Deployment for Queue Workers — Zero-downtime worker switching
- Queue Migration Strategies — Schema changes and job replay
- Disaster Recovery for Queue Infrastructure — Failover and backup procedures
