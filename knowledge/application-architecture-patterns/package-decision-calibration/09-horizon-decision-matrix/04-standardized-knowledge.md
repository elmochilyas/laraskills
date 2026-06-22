# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Horizon Decision Matrix |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Redis queue infrastructure, Laravel queue system, Supervisor configuration |
| Related KUs | Queue worker optimization, Package escape hatch strategy, Laravel queue architecture |
| Source | domain-analysis.md |

---

# Overview

Laravel Horizon is Laravel's first-party Redis queue monitoring and management dashboard. It provides a real-time UI for queue throughput, job metrics, failed job management, worker auto-balancing, and per-queue supervisor configuration. Horizon is Redis-only — it does not work with SQS, Beanstalkd, or database queues. It is the recommended monitoring solution for Redis-backed Laravel queues in production, providing visibility that `queue:work --daemon` alone cannot.

---

# Core Concepts

- **Supervisor configuration**: Horizon manages worker pools via a configuration file (`config/horizon.php`). Each supervisor controls how many worker processes serve which queues, with auto-balancing and memory/time limits.
- **Auto-balancing**: Horizon dynamically adjusts worker count per queue based on workload. `balance: 'auto'` scales workers up when a queue is busy and down when idle.
- **Job metrics**: Horizon tracks jobs per minute, failed jobs, timeout rate, runtime, and throughput per queue. Data is stored in Redis and visible in the Horizon dashboard.
- **Failed job management**: The Horizon dashboard allows viewing, retrying, and deleting failed jobs without CLI access.
- **Tags**: Jobs can be tagged (`->withTags(['podcast', 'processing'])`) and filtered in the Horizon dashboard by tag.
- **Redis-only**: Horizon uses Redis for job storage, metrics storage, and real-time communication. No part of Horizon works without Redis.

---

# When To Use

- Redis is the queue driver (not SQS, Beanstalkd, or database)
- Teams need a dashboard for queue health visibility (no Datadog/New Relic available or preferred)
- Auto-balancing worker pools across multiple queues is needed
- Job metrics (throughput, runtime, failure rate) need to be monitored per queue
- Failed jobs need to be managed via UI (retry, delete, inspect)
- Worker configuration is complex (different queues need different worker counts, timeouts, retry limits)

## When NOT To Use

- Queue driver is SQS, Beanstalkd, or database — Horizon is Redis-only (no supervisor config for non-Redis drivers)
- Datadog, New Relic, or similar APM is already providing queue monitoring
- Redis is already saturated with cache/session data — adding Horizon's metrics storage increases Redis load
- Single-queue, low-throughput app where `queue:work` is sufficient
- Queues are managed by a platform (Laravel Vapor, Envoyer) that provides its own monitoring
- Redis Cluster is in use but Horizon hasn't been tested against it (Redis Cluster support was added but verify compatibility)

---

# Best Practices

1. **Separate supervisors for different workload types** WHY: Webhook processing, notification sending, and default job processing have different requirements. A webhook supervisor needs fast timeout and high concurrency. A notification supervisor can be slow with low concurrency. Separate supervisors prevent one workload from starving another.

2. **Use `balance: 'auto'` for variable workloads, `balance: 'simple'` for steady workloads** WHY: `auto` balancing adds overhead (monitoring queue depth, adjusting workers). For steady, predictable workloads, `simple` is more efficient. Use `auto` for bursty queues (order processing during sales), `simple` for steady queues (email sending).

3. **Set `memory` and `timeout` limits that match your job characteristics** WHY: Memory leaks in job code will crash workers if no memory limit is set. A worker processing 100MB payloads needs a high memory limit. A worker processing lightweight jobs can have a low limit. `timeout` prevents stuck jobs from blocking a worker forever.

4. **Authenticate the Horizon dashboard in production** WHY: The Horizon dashboard exposes queue contents, failed job payloads, and provisioning configuration. Without authentication, anyone with the URL can view this data. Use `Horizon::auth()` to gate the dashboard behind a Gate or Policy.

5. **Use job tags for debugging and monitoring** WHY: Tags (`->withTags(['import', "user:{$userId}"])`) enable filtering jobs in the Horizon dashboard by user, feature, or operation. Without tags, finding a specific job among thousands is impossible.

---

# Architecture Guidelines

- **Supervisor separation example**:
  ```php
  // config/horizon.php
  'environments' => [
      'production' => [
          'supervisor-1' => [
              'connection' => 'redis',
              'queue' => ['webhooks'],
              'balance' => 'auto',
              'minProcesses' => 1,
              'maxProcesses' => 10,
              'tries' => 3,
              'timeout' => 30,   // Webhooks must be fast
          ],
          'supervisor-2' => [
              'connection' => 'redis',
              'queue' => ['notifications', 'emails'],
              'balance' => 'simple',
              'minProcesses' => 2,
              'maxProcesses' => 5,
              'tries' => 2,
              'timeout' => 120,  // Notifications can be slower
          ],
          'supervisor-3' => [
              'connection' => 'redis',
              'queue' => ['default', 'imports', 'exports'],
              'balance' => 'auto',
              'minProcesses' => 3,
              'maxProcesses' => 20,
              'tries' => 1,
              'timeout' => 600,  // Imports/exports are long-running
          ],
      ],
  ],
  ```

- **Dashboard authentication**:
  ```php
  // app/Providers/HorizonServiceProvider.php
  Horizon::auth(function (Request $request) {
      return $request->user()?->hasRole('admin')
          || $request->user()?->can('viewHorizon');
  });
  ```

- **Redis memory allocation**: Horizon stores metrics in Redis. In high-volume apps, Horizon data can grow to hundreds of MB. Monitor Redis memory usage after enabling Horizon and adjust `maxmemory` if needed.

---

# Performance Considerations

- **Redis memory overhead**: Horizon stores job metrics, recent jobs, failed jobs, and dashboard data in Redis. At 100K jobs/day, Horizon's Redis footprint is ~50-100MB. At 1M jobs/day, budget 200-400MB for Horizon data in Redis.
- **Auto-balancing overhead**: `balance: 'auto'` requires Horizon to periodically poll queue depth and adjust worker counts. This adds ~5-10 Redis commands per poll interval (default every 5 seconds). For high-throughput apps with stable loads, `balance: 'simple'` reduces this overhead.
- **Dashboard polling**: The Horizon dashboard polls Redis for updated metrics. This is lightweight (~2-5ms per poll) but adds constant Redis traffic. Only the open dashboard pages poll — no background polling occurs when nobody is viewing the dashboard.

---

# Security Considerations

- **Dashboard authentication is mandatory in production**: Horizon's dashboard exposes queue data, failed job payloads (which may contain PII), and configuration. Either gate the entire `/horizon` path behind authentication or disable the dashboard in production.
- **Failed job payloads**: Failed jobs stored in Horizon include their full payload. If a job payload contains email addresses, payment tokens, or PII, those are visible in the Horizon dashboard. Consider trimming sensitive payload data in failed jobs or restricting dashboard access to senior engineers only.
- **Horizon prefix isolation**: Horizon uses a Redis key prefix (default `horizon:`). If multiple Laravel apps share a Redis instance, use different prefixes to isolate Horizon data.

---

# Common Mistakes

**Mistake: Using Horizon with non-Redis queues expecting supervisor configuration**
- Description: Configuring Horizon with `'connection' => 'sqs'` expecting worker auto-balancing
- Cause: "Horizon is the queue dashboard, it should work with any queue"
- Consequence: Horizon runs but doesn't manage SQS workers. Queue monitoring is partial (some metrics work, but supervisor config is ignored).
- Better: Horizon is Redis-only for supervisor management. For SQS, use CloudWatch or Datadog for monitoring, and configure worker scaling through infrastructure (ECS auto-scaling, Lambda).

**Mistake: Not configuring Horizon authentication in production**
- Description: Deploying Horizon with the default `Gate::define('viewHorizon', fn () => true)`
- Cause: "Nobody knows the URL" or "It's just internal"
- Consequence: The Horizon dashboard is publicly accessible. Failed job payloads, queue contents, and configuration are exposed.
- Better: Gate Horizon behind role-based access (`$user->hasRole('admin')`) and IP whitelisting.

**Mistake: One supervisor for all queues**
- Description: A single supervisor handling webhooks, notifications, imports, and default jobs
- Cause: "It's simpler to manage one supervisor"
- Consequence: A slow-running import job consumes all workers, starving webhooks and notifications. Timeout must be set to the highest value (600s), so stuck jobs block workers for 10 minutes.
- Better: Separate supervisors per workload type. Each supervisor can have its own timeout, retry count, and worker pool size.

**Mistake: Setting `tries` in Horizon config AND on the job class**
- Description: `tries` set to 3 in Horizon config and `#[Tries(5)]` on the job class
- Cause: "More retries are safer"
- Consequence: The job retries are unpredictable. Horizon retries based on its config, the attribute retries based on its value. The actual behavior depends on which layer processes the retry.
- Better: Use ONE retry mechanism. Prefer the job attribute (`#[Tries(3)]`) for per-job configurability. Only set `tries` in Horizon config as a default fallback.

---

# Anti-Patterns

- **Horizon as primary monitoring tool**: Horizon shows queue metrics, not application metrics. It doesn't replace Sentry (error tracking), Datadog (APM), or Grafana (infrastructure). Horizon + another tool is the right combination.
- **Horizon dashboard open to all developers**: The dashboard exposes PII in failed job payloads. Restrict to senior engineers who understand data sensitivity.
- **Running Horizon without Redis memory monitoring**: Horizon silently consumes Redis memory. Without memory monitoring, Horizon will eventually cause Redis OOM errors that also affect cache and session storage.
- **Horizon for cron-based tasks**: Using Horizon-monitored queues for jobs that run once per day. Horizon metrics are designed for continuous throughput, not daily batch jobs. The metrics dashboard will show misleadingly low throughput.

---

# Escape Hatch

Horizon's escape hatches are per concern:

| Concern | Escape Hatch |
|---------|-------------|
| Job monitoring | Use `queue:monitor` for CLI-based monitoring, or Datadog/New Relic for APM-based monitoring |
| Worker management | Use system-level supervisor (systemd, supervisord) directly, managing `queue:work` processes |
| Failed job management | Use the `failed_jobs` table directly with custom admin UI or CLI (`queue:failed`) |
| Queue metrics | Use Redis `INFO` command and custom metrics dashboard (Grafana + Prometheus Redis exporter) |

```php
// Escape: use queue:work directly with supervisor (systemd example)
// /etc/systemd/system/laravel-worker.service
[Service]
ExecStart=/usr/bin/php /var/www/html/artisan queue:work redis --queue=default --tries=3 --timeout=60
```

**When to escape**: Non-Redis queues, Redis saturation, existing APM coverage, single-queue simple workloads.

Escaping Horizon does not change job code — only how workers and monitoring are configured.

---

# Alternatives

| Alternative | Fits When | Tradeoff |
|-------------|-----------|----------|
| `queue:work` + supervisor | Simple queue setups, single queue, don't need dashboard | No metrics UI, no auto-balancing, CLI-based failed job management |
| Laravel Vapor queue | Serverless (Lambda), don't want to manage workers | Requires Vapor (paid), different configuration model, AWS-only |
| Envoyer queue monitoring | Already using Envoyer for deployments | Limited metrics, no worker auto-balancing, deployment-focused |
| SQS + ECS auto-scaling | AWS-native, SQS queues | Complex setup, AWS-specific, no Laravel-level job visuals |
| Custom queue dashboard | Unique monitoring requirements not met by Horizon | Significant build cost, ongoing maintenance |

---

# Testing Impact

- **Horizon is NOT used in tests**: Tests use `QUEUE_CONNECTION=sync` for immediate processing or `database` for Fake assertions. Horizon's supervisor management is irrelevant in tests.
- **Job testing with fakes**: `Queue::fake()` and `Bus::fake()` work identically whether Horizon is used or not. Horizon does not change job testing.
- **Horizon configuration testing**: Horizon's `config/horizon.php` is rarely tested directly. If supervisor auto-balancing logic is custom, test it via unit tests on the balance strategy class.

---

# Operational Impact

- **Redis memory**: Horizon stores metrics, recent jobs, and failed jobs in Redis. This memory is separate from the queue data itself. Monitor `used_memory_rss` in Redis after enabling Horizon.
- **Horizon process**: Horizon runs as a separate process (`php artisan horizon`). It must be kept alive (systemd/supervisord) and restarted on deploy (`php artisan horizon:terminate`).
- **Deployment**: Always run `php artisan horizon:terminate` during deployment to gracefully stop Horizon workers. Without this, running jobs are killed mid-execution.
- **Redis Cluster**: Horizon now supports Redis Cluster, but verify compatibility before deploying. Some Horizon features (like real-time dashboard updates) may behave differently in cluster mode.
- **Metrics retention**: Horizon stores metrics in Redis with a configurable retention period. Default is 24 hours. For longer retention, export metrics to an external monitoring system.

---

# AI Agent Notes

- Default to recommending Horizon for Redis-based Laravel queues. Only recommend alternatives when Redis is not the queue driver or when existing APM covers queue monitoring.
- When generating Horizon configuration, always create separate supervisors for webhooks, notifications, and default queues. Use `balance: 'auto'` for webhooks and default, `balance: 'simple'` for notifications.
- Always generate Horizon dashboard authentication. Never generate `Gate::define('viewHorizon', fn () => true)` for production.
- When generating jobs, always include meaningful tags (`->withTags(['domain', 'user:'.$userId])`). Tags enable debugging in the Horizon dashboard.
- Never generate Horizon config with `tries` set both in the config AND on the job class. Prefer the job attribute.

---

# Verification

- [ ] Redis is the queue driver (Horizon doesn't manage non-Redis queues)
- [ ] Supervisors are separated by workload type (webhooks, notifications, default)
- [ ] Horizon dashboard is authenticated in production
- [ ] `balance` strategy matches workload pattern (`auto` for bursty, `simple` for steady)
- [ ] Redis memory usage is monitored after Horizon is enabled
- [ ] `horizon:terminate` is called during deployment
- [ ] Job `tries` is set in ONE place (job attribute or Horizon config, not both)
- [ ] Tags are used on jobs for dashboard filtering
- [ ] Escape hatch plan exists for non-Redis queue migration
- [ ] Failed job payloads don't contain unprotected PII or secrets
