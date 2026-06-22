# Skill: Laravel Horizon Queue Monitoring Implementation

## Purpose
Deploy Laravel Horizon for Redis queue monitoring, worker auto-balancing, and failed job management — with proper supervisor separation, dashboard authentication, job tagging, and deployment integration — so the team has production visibility into queue health without Redis OOM surprises.

## When To Use
- Redis is the queue driver (Horizon is Redis-only for supervisor management)
- The team needs a dashboard for queue health visibility (no Datadog/New Relic available or preferred)
- Auto-balancing worker pools across multiple queues is needed
- Different queue types (webhooks, notifications, imports) need different worker configurations
- Job metrics (throughput, runtime, failure rate) need to be monitored per queue
- Failed jobs need to be managed via UI (retry, delete, inspect payload)

## When NOT To Use
- Queue driver is SQS, Beanstalkd, or database — Horizon supervisor configuration is Redis-only
- Datadog, New Relic, or similar APM is already providing queue monitoring
- Redis is already saturated with cache/session data — Horizon adds data storage to Redis
- Single-queue, low-throughput app where `queue:work` is sufficient
- Queues are managed by a platform (Laravel Vapor, Envoyer) that provides its own monitoring
- Redis Cluster in use without verified Horizon compatibility

## Prerequisites
- Redis installed and configured as the Laravel queue driver
- Supervisor (systemd or supervisord) for keeping the Horizon process alive
- Understanding of queue worker concepts (timeout, retries, memory limits)
- Access to Redis memory monitoring (`used_memory_rss`)

## Inputs
- Queue structure: list of all queues and their workload types (webhooks, notifications, default, imports)
- Workload characteristics per queue (expected throughput, typical job runtime, burst patterns)
- Team access model: who should view the Horizon dashboard in production
- Deployment pipeline configuration (to add `horizon:terminate`)

## Workflow
1. **Verify Redis is the queue driver** — Horizon supervisor management is Redis-only. If the queue driver is SQS, Beanstalkd, or database, Horizon won't manage workers. Stop here and use alternative monitoring.
2. **Design supervisor separation** — Group queues by workload type. Webhooks need fast timeout (30s), high concurrency. Notifications can be slower (120s), lower concurrency. Imports need long timeout (600s), low concurrency. Each group gets its own supervisor.
3. **Choose balance strategy** — `balance: 'auto'` for bursty queues (webhooks, order processing). `balance: 'simple'` for steady queues (notifications, emails). `auto` has overhead; use only where burst handling justifies it.
4. **Set memory and timeout limits per supervisor** — Match limits to job characteristics. Webhooks: `timeout=30, memory=128`. Notifications: `timeout=120, memory=256`. Imports: `timeout=600, memory=512`. Memory limits prevent worker memory leaks from crashing the process.
5. **Authenticate the dashboard** — Use `Horizon::auth()` to gate `/horizon` behind an admin role check. Never allow public access. Failed job payloads may contain PII. Add IP whitelisting for defense in depth.
6. **Add job tags to all jobs** — Implement `tags()` on every job class. Tags enable filtering in the Horizon dashboard by domain, feature, or user. `['podcast', 'processing', "user:{$userId}"]` makes debugging possible.
7. **Integrate with deployment** — Add `php artisan horizon:terminate` to the deployment script BEFORE restarting Horizon. This gracefully stops workers (finish current job, then exit). Without it, running jobs are killed mid-execution.

## Validation Checklist
- [ ] Redis is the queue driver (Horizon doesn't manage non-Redis queues)
- [ ] Supervisors are separated by workload type (webhooks, notifications, default)
- [ ] Horizon dashboard is authenticated in production (`Horizon::auth()`)
- [ ] `balance` strategy matches workload pattern (`auto` for bursty, `simple` for steady)
- [ ] Redis memory usage is monitored after Horizon is enabled
- [ ] `horizon:terminate` is called during deployment before restarting workers
- [ ] Job `tries` is set in ONE place (job attribute or Horizon config, not both)
- [ ] All significant job classes implement `tags()` for dashboard filtering
- [ ] Escape hatch plan exists for non-Redis queue migration (documented)
- [ ] Failed job payloads don't contain unprotected PII or secrets

## Common Failures
- One supervisor for all queues — slow imports consume all workers, starving webhooks
- Not authenticating Horizon dashboard — publicly accessible queue data and failed job payloads
- Setting `tries` in both Horizon config AND job attribute — unpredictable retry behavior
- Running Horizon without Redis memory monitoring — Horizon silently fills Redis, causing OOM
- Forgetting `horizon:terminate` on deploy — running jobs killed mid-execution
- Using `balance: 'auto'` for steady workloads — unnecessary polling overhead
- Skipping job tags — impossible to find specific jobs in a busy dashboard

## Decision Points
- **Supervisor granularity**: Separate per workload type (webhooks, notifications, imports, default) vs. one per queue
- **Balance strategy**: `auto` for bursty workloads, `simple` for steady, `false` for manual scaling
- **Retry configuration**: Job attribute (`#[Tries(3)]`) for per-job retry control; Horizon config as default fallback
- **Dashboard access**: Admin role only vs. admin role + IP whitelisting

## Performance Considerations
- Horizon metrics in Redis: ~50-100MB at 100K jobs/day, ~200-400MB at 1M jobs/day
- `balance: 'auto'` adds ~5-10 Redis commands per poll interval (every 5 seconds default)
- Dashboard polling only occurs when the dashboard is open — no background polling
- Monitor `used_memory_rss` in Redis after enabling Horizon; set `maxmemory` with eviction policy

## Security Considerations
- Failed job payloads are visible in the Horizon dashboard — they may contain PII (email addresses, user IDs)
- Gate the dashboard behind authentication and restrict to senior engineers who understand data sensitivity
- Horizon uses a Redis key prefix (default `horizon:`) — use different prefixes if multiple apps share Redis
- Job payloads sent to queues may contain sensitive data — consider encrypting sensitive job properties

## Related Rules (from 05-rules.md)
- Separate Supervisors for Different Workload Types
- Authenticate the Horizon Dashboard in Production
- Use Tags on Jobs for Dashboard Filtering
- Set Retries in One Place — Job Attribute or Horizon Config, Not Both
- Call horizon:terminate During Deployment

## Related Skills
- Package Escape Hatch Strategy (KU 04)
- Telescope & Pulse Relevance (KU 10)

## Success Criteria
- Each queue type has its own supervisor with matching timeout/retry/memory settings. The dashboard is authenticated. Failed jobs are tagged and filterable. `horizon:terminate` runs on every deploy. Redis memory usage is monitored and has headroom. No production deploy has killed a running job mid-execution.
