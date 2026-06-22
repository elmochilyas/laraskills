# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Telescope & Pulse Relevance |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel debugging, Production monitoring concepts, APM fundamentals |
| Related KUs | Package fit/non-fit analysis, Horizon decision matrix, Observability architecture |
| Source | domain-analysis.md |

---

# Overview

Laravel Telescope and Laravel Pulse serve different stages of the observability lifecycle. Telescope is a local/staging debugging tool for inspecting individual requests, queries, mail, exceptions, and cache operations. Pulse is a production aggregate monitoring dashboard showing throughput, slow queries, slow jobs, cache hit rates, and exception counts over time. Neither replaces dedicated APM (Datadog, New Relic), exception tracking (Sentry, Bugsnag), or custom business metrics. Understanding what each tool is — and is not — prevents observability gaps and tool overlap.

---

# Core Concepts

## Telescope (Local/Staging Debugging)

- **Request inspection**: View every HTTP request: headers, payload, response, middleware stack, session data.
- **Query inspection**: View every database query: raw SQL, bindings, execution time, calling location.
- **Mail inspection**: View every sent email: recipients, subject, body preview, attachments.
- **Exception inspection**: View every exception: stack trace, request context, user context, occurred-at timestamp.
- **Cache inspection**: View every cache operation: key, value, hit/miss, TTL.
- **Job inspection**: View every dispatched job: payload, queue, delay, attempts.
- **Real-time logging**: View application log entries in the Telescope dashboard.
- **NOT for production**: Telescope records all data, which fills the database rapidly and adds overhead to every request. It is a debugging tool, not a monitoring tool.

## Pulse (Production Monitoring)

- **Throughput**: Request rate, job processing rate, queue throughput — aggregate counts over time windows.
- **Slow queries**: Queries exceeding a configurable threshold (default 100ms), with frequency and trend lines.
- **Slow jobs**: Jobs exceeding a configurable threshold, with per-job-class breakdown.
- **Cache hit rates**: Hit/miss ratios per cache store, trending over time.
- **Exception counts**: Exception frequency trending, with per-exception-class breakdown.
- **Server load**: CPU, memory, and disk usage from the servers running the app.
- **Card-based dashboard**: Customizable cards showing different metrics. Each card is independently configured.
- **Aggregate only**: Pulse doesn't show individual requests or queries — only aggregates. For individual details, use Telescope (staging) or logs (production).

---

# When To Use Each

## Telescope: When To Use

- Local development: debugging N+1 queries, mail preview, cache inspection
- Staging/testing: verifying behavior before production deploy
- During code review: checking that a new feature doesn't introduce unexpected queries
- Debugging a CI test failure: inspecting what the app did during the failed test

## Telescope: When NOT To Use

- Production environments (performance overhead + data privacy)
- As a replacement for structured logging (Telescope UI is for debugging, not log aggregation)
- As a long-term data store (Telescope's database grows unbounded if not pruned)

## Pulse: When To Use

- Production monitoring of aggregate metrics (throughput, errors, slow operations)
- Detecting performance regressions after deployments (slow query trends)
- Monitoring queue health (throughput, failure rate, slow jobs)
- Cache efficiency monitoring (hit rate trends)
- Lightweight APM alternative when Datadog/New Relic is not available

## Pulse: When NOT To Use

- Debugging individual requests (Telescope does this)
- Exception alerting and deduplication (Sentry/Bugsnag does this)
- Distributed tracing across microservices (Datadog/New Relic does this)
- Custom business metrics (revenue, conversion rate, signups — use a BI tool)
- Infrastructure monitoring (server CPU/memory is basic — use Grafana/CloudWatch)

---

# Best Practices

1. **Use Telescope ONLY in local and staging environments** WHY: Telescope records every request, query, mail, cache operation, and log entry. In production, this adds 10-30ms+ to every request, fills the database with sensitive data (request payloads, email bodies, user PII), and exposes internal application state if the dashboard is accessible. Use `Telescope::night()` or disable via `APP_ENV=production` guard.

2. **Use Pulse for production aggregate monitoring, not individual request debugging** WHY: Pulse is designed for trend analysis — "slow queries increased 40% after deploy." Telescope is designed for single-request debugging — "why did this specific request take 3 seconds?" Don't expect Pulse to replace Telescope for debugging or Telescope to replace Pulse for trending.

3. **Pulse + Sentry/Datadog, not Pulse instead of Sentry/Datadog** WHY: Pulse shows you that exception count spiked. Sentry shows you the exact stack traces, affected users, and release correlation. Pulse shows you slow queries are up. Datadog shows you which database host is the bottleneck. Pulse is the canary; Sentry/Datadog is the investigation.

4. **Configure Telescope pruning aggressively** WHY: Telescope's database tables grow rapidly. A single request with 50 queries, 10 cache operations, and 3 mail sends records 60+ Telescope entries. Set `TELESCOPE_DATA_PRUNE_ENABLED=true` and a short retention period (24-48 hours for staging, 1 hour for local).

5. **Use Pulse cards to surface the metrics your team actually acts on** WHY: Pulse's dashboard shows what you configure. If your team doesn't care about server CPU (because you're on serverless), don't add that card. Add cards for slow queries, slow jobs, and cache hit rates — metrics that trigger real actions.

---

# Architecture Guidelines

- **Telescope gate in production**: Even if Telescope IS installed in production (not recommended), gate it:
  ```php
  // app/Providers/TelescopeServiceProvider.php
  Gate::define('viewTelescope', fn ($user) => in_array($user->email, [
      'admin@example.com',
  ]));
  ```

- **Telescope disabled in production**:
  ```php
  // app/Providers/TelescopeServiceProvider.php
  public function register(): void
  {
      if ($this->app->environment('production')) {
          return; // Telescope never boots in production
      }
      // Local/staging: register Telescope
  }
  ```

- **Pulse configuration**:
  ```php
  // config/pulse.php
  return [
      'enabled' => env('PULSE_ENABLED', true),
      'ingest' => [
          'driver' => env('PULSE_INGEST_DRIVER', 'database'), // or 'redis'
      ],
      'cache' => env('PULSE_CACHE_DRIVER', 'database'),
      'recorders' => [
          Pulse\Recorders\SlowQueries::class => ['threshold' => 100],
          Pulse\Recorders\SlowJobs::class => ['threshold' => 500],
          Pulse\Recorders\Exceptions::class => ['enabled' => true],
          Pulse\Recorders\Server::class => ['server_name' => env('PULSE_SERVER_NAME')],
      ],
  ];
  ```

- **Data storage separation**: Telescope and Pulse use separate database tables by default (`telescope_*` and `pulse_*`). They can coexist on the same database but should not share tables.

---

# Performance Considerations

- **Telescope overhead per request**: ~10-30ms in local (recording queries, mail, cache, logs). This is why Telescope should never run in production. In staging, the overhead is acceptable for debugging.
- **Pulse overhead per request**: Minimal (~1-3ms) because Pulse records aggregate counters, not full request data. Pulse is designed to be production-safe.
- **Telescope database growth**: Unpruned Telescope tables grow 100MB-1GB per day in active development environments. Pruning is essential.
- **Pulse database growth**: Pulse stores pre-aggregated data (counts per time bucket). A busy app adds ~10-50MB per day. Configure retention via `PULSE_TRIM_LOTTERY`.

---

# Security Considerations

- **Telescope exposes sensitive data**: Request payloads, email bodies, session data, and query bindings (including passwords if not properly hashed in code). Telescope must NEVER be accessible in production. Even in staging, restrict access to engineers.
- **Pulse exposes aggregate data, not PII**: Pulse shows counts and trends, not individual records. Exception counts don't include stack traces. Slow query records don't include query bindings. Pulse is safer for production.
- **Telescope + PII**: If Telescope MUST be used in a staging environment with production-like data, scrub sensitive fields in `Telescope::filter()` or use `Telescope::tag()` to exclude tables/requests.

---

# Common Mistakes

**Mistake: Deploying Telescope to production**
- Description: Installing Telescope as a dev dependency but forgetting to gate it, so it runs in production
- Cause: Not adding `APP_ENV=production` guard or `Gate::define('viewTelescope')`
- Consequence: 10-30ms request overhead. Database fills with request data including PII. Telescope dashboard is publicly accessible if not gated.
- Better: Add `if (app()->environment('production')) { return; }` in TelescopeServiceProvider. Or require `laravel/telescope` as `--dev` only.

**Mistake: Expecting Pulse to replace Sentry for exception tracking**
- Description: Deploying Pulse and thinking "now we have production monitoring" — then missing critical exception alerts
- Cause: Underestimating the difference between aggregate metrics and real-time alerting
- Consequence: Exceptions spike to 500/min but no team member is alerted. Pulse shows the spike, but by the time someone checks the dashboard, 100K errors have occurred.
- Better: Pulse for trends + Sentry for alerting. Both are needed. Neither replaces the other.

**Mistake: Running Telescope AND Pulse in production without understanding the cumulative database load**
- Description: "We'll run both to be safe"
- Cause: Not calculating database write volume
- Consequence: Telescope writes 100+ rows per request. Pulse writes aggregate rows every N seconds. Combined, they can saturate the database write capacity.
- Better: Telescope for local/staging only. Pulse for production. Never both in production.

**Mistake: Adding Pulse cards for metrics nobody monitors**
- Description: Configuring every Pulse recorder and displaying 20 cards on the dashboard
- Cause: "More information is always better"
- Consequence: Dashboard clutter. Important signals (slow queries spiking) are buried among noise (server CPU at 12%). Nobody checks the dashboard because it's overwhelming.
- Better: Start with 3-4 Pulse cards: slow queries, slow jobs, exception count, cache hit rate. Add more only when the team regularly acts on a new metric.

---

# Anti-Patterns

- **Telescope in production**: The cardinal anti-pattern. Telescope is a debugging tool, not a monitoring tool. Running it in production is equivalent to running `dd()` on every request.
- **Pulse as APM**: Expecting Pulse to provide distributed tracing, service maps, or infrastructure monitoring. Pulse is a Laravel-level aggregate dashboard, not an APM.
- **Telescope for long-term data**: Using Telescope as an audit log or analytics store. Telescope prunes old data. It's not designed for long-term retention.
- **Both Telescope and Pulse without pruning**: Telescope and Pulse tables grow unbounded. Without pruning, they will fill the database disk within weeks.

---

# Escape Hatch

| Tool | Escape Hatch |
|------|-------------|
| Telescope | `php artisan telescope:prune` to clear all data. Uninstall via `composer remove laravel/telescope --dev`. Replace with Laravel Debugbar for lighter-weight debugging, or IDE xdebug for step debugging. |
| Pulse | Disable via `PULSE_ENABLED=false`. Replace with Datadog/New Relic for APM, Sentry for exceptions, Grafana for custom dashboards. Pulse data is pre-aggregated — if you migrate to Datadog, you lose historical Pulse data (no migration path). |

---

# Pulse for Billing: Specific Guidance

- **Slow webhook processing alerts**: Configure Pulse's `SlowJobs` recorder with a lower threshold for the `webhooks` queue. Slow webhook processing = delayed subscription state sync.
- **Subscription sync job monitoring**: Tag subscription sync jobs and monitor their throughput in Pulse. A drop in throughput indicates webhook processing is bottlenecked.
- **Cache hit rate for plan data**: If plan entitlements are cached, monitor the cache hit rate for the plan cache store. Low hit rate = cache misconfiguration or invalidation storm.
- **Exception trending for payment failures**: Payment failures (card declines, insufficient funds) are expected exceptions. Trend them in Pulse to detect payment provider issues or fraud spikes.

---

# AI Agent Notes

- Never generate Telescope configuration that allows Telescope to run in production. Always include an `APP_ENV=production` guard.
- When generating Pulse configuration, start with 4 recorders: slow queries, slow jobs, exceptions, cache. Only add server monitoring if the team needs it.
- Never recommend Pulse as a replacement for Sentry, Bugsnag, or Datadog. Pulse is complementary, not a replacement.
- When generating Telescope pruning config, set `TELESCOPE_DATA_PRUNE_ENABLED=true` and prune interval to 1 hour for local, 24 hours for staging.
- If generating a project that doesn't need queue monitoring (no queues or sync-only), Pulse may have low value. Recommend it only when queues are in use.

---

# Verification

- [ ] Telescope is disabled in production (gated by environment check)
- [ ] Telescope dashboard is authenticated in staging
- [ ] Telescope data pruning is configured and running
- [ ] Pulse is configured with relevant recorders (not all available recorders blindly)
- [ ] Pulse is NOT the sole exception tracking solution (Sentry/Bugsnag is also configured)
- [ ] Pulse dashboard shows metrics the team actually monitors and acts on
- [ ] Pulse database retention is configured (`PULSE_TRIM_LOTTERY`)
- [ ] Telescope and Pulse data storage is separated (different tables)
- [ ] Production database has capacity for Pulse's data volume (monitored)
- [ ] Team understands the difference: Telescope = debugging, Pulse = trending, Sentry = alerting
