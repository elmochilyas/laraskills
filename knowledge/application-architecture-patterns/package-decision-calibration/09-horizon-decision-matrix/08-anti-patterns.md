# Anti-Patterns for Laravel Horizon Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Horizon Decision Matrix |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-HZN-001 | Horizon as Primary Monitoring Tool | Medium | Medium |
| AP-HZN-002 | Horizon Dashboard Open to All Developers | Critical | High |
| AP-HZN-003 | Running Horizon Without Redis Memory Monitoring | Critical | Medium |
| AP-HZN-004 | Horizon for Cron-Based Tasks | Low | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-CPR-001 (Blind Defaultism) — from KU 01
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04

---

## AP-HZN-001: Horizon as Primary Monitoring Tool

### Category
Observability

### Description
Treating Horizon as the sole production monitoring solution — expecting it to provide exception tracking, APM, infrastructure monitoring, and alerting. Horizon shows queue metrics, not application metrics. It doesn't replace Sentry (error tracking), Datadog (APM), or Grafana (infrastructure). Teams that rely on Horizon alone have awareness without investigation capability.

### Why It Happens
- Horizon is free and built-in — "why pay for Sentry/Datadog when Horizon shows us everything?"
- Misunderstanding Horizon's scope: it shows queue metrics, not application health
- Small teams deferring observability investment: "Horizon is enough for now" (and "now" extends indefinitely)
- Horizon's UI looks comprehensive (graphs, metrics, job lists) — creates a false sense of coverage

### Warning Signs
- "We have Horizon, so we have production monitoring covered" — said without irony
- No Sentry, Bugsnag, Datadog, or New Relic configured
- When exceptions spike, the team sees the count in Horizon but cannot view stack traces or affected users
- Production incidents are discovered by customers, not by monitoring alerts
- "Horizon doesn't show that" is a recurring gap during incident investigations

### Why Harmful
Horizon shows aggregate queue metrics — throughput, failure rate, slow jobs. When an incident occurs, Horizon tells you THAT something is wrong (job failure rate spiked), but not WHAT is wrong (which exception, which release, which users are affected) or WHY (which database host is the bottleneck). Without Sentry for exception details and Datadog for infrastructure correlation, the team knows there's a problem but cannot investigate it effectively. Mean time to resolution (MTTR) increases because every investigation starts from scratch.

### Real-World Consequences
- A team deploys a buggy release. Horizon shows job failure rate spiking from 0.1% to 15%. The team knows jobs are failing but cannot see stack traces (no Sentry) or correlate the spike to the deploy (no Datadog). They spend 45 minutes debugging by SSH-ing into production to read log files. A Sentry integration would have shown the exact stack trace and the release that introduced it within 30 seconds.

### Preferred Alternative
Horizon + Sentry (exception tracking) + optional Datadog/New Relic (APM) = layered observability. Horizon provides queue awareness ("job throughput dropped 50%"). Sentry provides investigation capability ("the drop is because Exception X in release Y"). Datadog provides root cause analysis ("the database read replica is at 95% CPU"). Each layer answers a different question. Horizon alone answers "is something wrong?" but not "what?" or "why?"

### Refactoring Strategy
1. Configure Sentry (or Bugsnag) for exception tracking immediately. This is the highest-impact addition to Horizon.
2. Evaluate Datadog/New Relic based on infrastructure complexity. For single-server apps, Horizon + Sentry may be sufficient.
3. Document the observability stack: what each tool provides and what gaps remain.
4. Set up alerting: Horizon dashboard is reactive (you must look at it). Sentry/Datadog alerts are proactive (they notify you).

### Detection Checklist
- [ ] Horizon is the only monitoring tool in the production stack
- [ ] No exception tracking service (Sentry, Bugsnag) is configured
- [ ] "Horizon doesn't show that" is a recurring gap in incident post-mortems
- [ ] MTTR for production incidents exceeds 30 minutes because investigation tools are absent

### Related Rules
- Start Pulse with 3-4 Cards — Add More Only When the Team Acts on Them (from KU 10)

### Related Skills
- Telescope & Pulse Relevance (KU 10)

---

## AP-HZN-002: Horizon Dashboard Open to All Developers

### Category
Security

### Description
Deploying Horizon with default or permissive authentication: `Horizon::auth(fn () => true)` or gating behind a simple "is logged in" check. The dashboard exposes queue contents, failed job payloads (which may contain PII, API tokens, or internal configuration), and provisioning settings to anyone who can access the URL.

### Why It Happens
- "It's just an internal dashboard" — underestimating the sensitivity of queue data
- "Only our team knows the URL" — security through obscurity
- Default Horizon configuration doesn't require authentication — teams deploy defaults without reviewing
- "All developers should see queue health" — conflating visibility with unrestricted access

### Warning Signs
- `Horizon::auth(fn () => true)` or `Horizon::auth(fn ($user) => $user !== null)` in production
- `/horizon` is accessible without authentication
- Failed job payloads contain email addresses, user IDs, API tokens, or internal URLs
- Any developer can view any failed job payload, regardless of data sensitivity

### Why Harmful
Failed job payloads contain the full job data. A failed "send welcome email" job contains the user's email address and name. A failed "sync to CRM" job contains customer data. A failed "process payment" job may contain payment tokens (if not properly scrubbed). Exposing this data to every developer — or worse, to anyone who guesses the URL — is a data breach waiting to happen. In regulated environments (GDPR, HIPAA, SOC2), unrestricted Horizon access is an audit finding.

### Real-World Consequences
- A Horizon dashboard is deployed with `auth(fn () => true)` on a publicly accessible subdomain. A security researcher discovers it during reconnaissance. The failed job payloads contain customer email addresses and internal API endpoint URLs. The researcher responsibly discloses the finding. The company must report a data exposure incident to customers.

### Preferred Alternative
Gate Horizon behind role-based authentication: `Horizon::auth(fn ($user) => $user->hasRole('admin') || $user->can('viewHorizon'))`. Restrict to senior engineers who understand data sensitivity. Add IP whitelisting as defense in depth: only allow access from the office VPN or bastion host. In staging/development environments, less restrictive access is acceptable. In production, default to deny.

### Refactoring Strategy
1. Implement role-based authentication on `Horizon::auth()` immediately.
2. Audit failed job payloads for sensitive data. Scrub PII and secrets from job payloads where possible.
3. Add IP whitelisting if the dashboard must be accessible outside the VPN.
4. Document who has Horizon access and review quarterly.

### Detection Checklist
- [ ] `Horizon::auth(fn () => true)` or equivalent permissive check in production config
- [ ] `/horizon` accessible without authentication from public internet
- [ ] Failed job payloads contain email addresses, user IDs, or API tokens
- [ ] No access review process for Horizon dashboard users

### Related Rules
- Authenticate the Horizon Dashboard in Production

### Related Skills
- Telescope & Pulse Relevance (KU 10)

---

## AP-HZN-003: Running Horizon Without Redis Memory Monitoring

### Category
Reliability | Infrastructure

### Description
Enabling Horizon in production without monitoring Redis memory usage. Horizon stores metrics, recent jobs, and dashboard data in Redis. In high-volume apps, this data can grow to hundreds of megabytes, eventually causing Redis OOM errors that also affect cache and session storage.

### Why It Happens
- "Redis is just a cache — it can handle Horizon data" — without checking actual memory usage
- Horizon's memory footprint isn't visible in the Horizon dashboard itself (ironic but true)
- Deploying Horizon and forgetting about it — metrics accumulate silently
- Not setting `maxmemory` and eviction policy in Redis configuration

### Warning Signs
- Redis `used_memory_rss` grows steadily after Horizon is enabled
- No Redis memory monitoring (Grafana, CloudWatch, Redis INFO) is configured
- Redis OOM errors appear in application logs
- Cache keys mysteriously disappear (evicted by Redis when memory limit is hit)
- "Redis is slow" — actually Redis is swapping to disk because memory is full

### Why Harmful
When Redis hits its memory limit without an eviction policy, it stops accepting writes. Horizon can't store new metrics. Queue jobs can't be pushed (if using Redis queues). Cache operations fail. Session storage fails. The entire application degrades because Redis — the shared infrastructure for queues, cache, and sessions — is saturated with Horizon metric data. Horizon, meant to provide visibility, becomes the cause of an outage.

### Real-World Consequences
- A production app processes 200K jobs/day. Horizon stores metrics in Redis with default retention (24 hours). Over 3 days, Horizon's Redis footprint grows to 1.2GB. Redis hits its 2GB `maxmemory` limit with `noeviction` policy. Queue pushes start failing. Cache misses spike. Sessions can't be stored. The outage lasts 45 minutes while the team diagnoses Redis OOM. Root cause: Horizon metrics filled Redis.

### Preferred Alternative
Monitor Redis memory before AND after enabling Horizon. Track `used_memory_rss` and `used_memory_dataset`. Set `maxmemory` with an appropriate eviction policy (`allkeys-lru` for cache, `noeviction` for queue data). Configure Horizon's metrics retention (default 24 hours) appropriately for your data volume. For high-volume apps, reduce retention to 6-12 hours. For extreme volume, export Horizon metrics to an external time-series database and keep only recent data in Redis.

### Refactoring Strategy
1. Check current Redis memory usage: `redis-cli INFO memory | grep used_memory`.
2. Estimate Horizon's additional memory footprint based on job volume.
3. Set `maxmemory` with a 20-30% buffer above peak usage.
4. Configure `maxmemory-policy` appropriate for the Redis instance's role.
5. Add Redis memory monitoring to the operations dashboard.

### Detection Checklist
- [ ] Redis `maxmemory` is not configured
- [ ] No Redis memory monitoring is in place
- [ ] Horizon has been enabled but Redis memory growth hasn't been tracked
- [ ] Redis OOM errors have occurred after Horizon deployment
- [ ] Horizon metrics retention is at default (24 hours) without evaluation

### Related Rules
- Separate Supervisors for Different Workload Types

### Related Skills
- Telescope & Pulse Relevance (KU 10)

---

## AP-HZN-004: Horizon for Cron-Based Tasks

### Category
Architecture | Observability

### Description
Using Horizon-monitored queues for jobs that run once per day (daily reports, nightly syncs, weekly emails). Horizon's metrics dashboard is designed for continuous throughput — jobs/minute, average runtime, throughput trends. When a queue processes one job per day, the metrics are misleading: "0 jobs/minute" looks broken when it's actually working as designed.

### Why It Happens
- All queues go through Horizon by default — "we use Horizon for everything"
- Not considering whether the queue pattern matches Horizon's monitoring design
- Creating a dedicated queue for a daily job and routing it through Horizon without evaluating dashboard impact
- "More metrics are better" — even when the metrics are meaningless

### Warning Signs
- A queue in the Horizon dashboard consistently shows 0 throughput
- Dashboard shows "0 jobs/minute" for hours/days, with occasional spikes
- Team members ask "is the daily report queue broken?" because the dashboard shows no activity
- A dedicated supervisor exists for a queue that processes <10 jobs/day

### Why Harmful
Horizon's value is proportional to throughput. For a queue processing 1 job/day, the dashboard provides no useful information — the metrics are always zero, the trend lines are flat, and the "recent jobs" view shows one job from 23 hours ago. The dashboard noise (zero metrics that look like failures) trains the team to ignore real zeros (queues that actually ARE broken). The Redis memory overhead for storing metrics for this queue is entirely wasted.

### Real-World Consequences
- A team uses Horizon for a "daily-reports" queue that processes 4 jobs/day. The Horizon dashboard perpetually shows "0 jobs/minute" for this queue. A real outage in the webhook queue also shows "0 jobs/minute" — but the team ignores it because "the dashboard always shows zeros." The webhook outage lasts 2 hours before anyone investigates. The dasbhoard's false-zero signal masked a real-zero signal.

### Preferred Alternative
For cron-based tasks (daily, weekly), use Laravel's scheduler (`app/Console/Kernel.php`) with `$schedule->command()` or `$schedule->job()` directly — not a queue worker. If the job must be queued (long-running), use a dedicated queue but do NOT create a Horizon supervisor for it. Monitor cron-based jobs through: (a) scheduler output logging, (b) a "last run" timestamp in the database, or (c) a dead man's switch monitoring service. Horizon is for continuous throughput queues, not batch/cron queues.

### Refactoring Strategy
1. Identify Horizon supervisors managing queues with <100 jobs/day.
2. For queues with <10 jobs/day: remove from Horizon, use scheduler + direct execution or a basic queue worker.
3. For queues with 10-100 jobs/day: keep in Horizon but consolidate into a shared "low-volume" supervisor instead of a dedicated one.
4. Set minimum meaningful throughput thresholds: if a queue processes <1 job/minute on average, Horizon metrics are not useful.

### Detection Checklist
- [ ] Horizon dashboard shows queues with 0 throughput for >90% of the day
- [ ] A supervisor exists exclusively for a queue processing <10 jobs/day
- [ ] Team members regularly ask "is this queue broken?" because of persistent zero metrics
- [ ] Cron-based tasks are routed through Horizon queues instead of the scheduler

### Related Rules
- Separate Supervisors for Different Workload Types

### Related Skills
- Telescope & Pulse Relevance (KU 10)
