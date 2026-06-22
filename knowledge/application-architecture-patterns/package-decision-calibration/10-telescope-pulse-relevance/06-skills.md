# Skill: Telescope & Pulse Observability Implementation

## Purpose
Deploy Laravel Telescope for local/staging debugging and Laravel Pulse for production aggregate monitoring — with correct environment gating, data pruning, card selection, and integration with exception tracking — so the team has the right tool for each stage of the observability lifecycle.

## When To Use Each

### Telescope
- Local development: debugging N+1 queries, mail preview, cache inspection, exception traces
- Staging/testing: verifying behavior before production deploy, debugging CI test failures
- Code review: checking that new features don't introduce unexpected queries or mail sends

### Pulse
- Production monitoring of aggregate metrics (throughput, slow queries, slow jobs, cache hit rates)
- Detecting performance regressions after deployments (slow query trend spikes)
- Monitoring queue health and cache efficiency over time
- Lightweight APM alternative when Datadog/New Relic is not available or budgeted

## When NOT To Use Each

### Telescope: When NOT To Use
- Production environments — Telescope records every request, query, mail, and log entry, adding 10-30ms overhead and storing sensitive data
- As a replacement for structured logging (Telescope UI is for debugging, not long-term log aggregation)
- As a long-term data store (Telescope prunes old data by design)

### Pulse: When NOT To Use
- Debugging individual requests or queries (use Telescope in staging)
- Exception alerting and deduplication (use Sentry/Bugsnag alongside Pulse)
- Distributed tracing across microservices (use Datadog/New Relic)
- Custom business metrics (revenue, conversion rate — use a BI tool)
- Infrastructure monitoring beyond basic CPU/memory (use Grafana/CloudWatch)

## Prerequisites
- Laravel 13+ with PHP 8.3+
- Telescope: understanding that it must NEVER run in production
- Pulse: understanding that it complements, not replaces, exception tracking and APM
- Database capacity planning for Pulse's aggregate data storage

## Inputs
- Environment configuration (local, staging, production)
- The metrics the team actually monitors and acts on (to configure Pulse cards)
- Exception tracking service (Sentry, Bugsnag) — must be configured alongside Pulse
- Server names for Pulse's server monitoring (optional)

## Workflow

### Telescope Setup
1. **Install as dev dependency** — `composer require laravel/telescope --dev`. Telescope should never be a production dependency.
2. **Add production guard** — In `TelescopeServiceProvider::register()`, add `if ($this->app->environment('production')) { return; }`. This is the single most important line of Telescope configuration.
3. **Configure aggressive pruning** — Set `TELESCOPE_DATA_PRUNE_ENABLED=true`. Set `TELESCOPE_DATA_PRUNE_HOURS=1` for local, `48` for staging. Without pruning, Telescope tables grow 100MB-1GB per day.
4. **Add data scrubbing filters** — If staging uses production-like data, configure `Telescope::filter()` to scrub sensitive fields from query bindings, email recipients, and request payloads.
5. **Gate the dashboard in staging** — Even in staging, restrict Telescope access to engineers via `Gate::define('viewTelescope', fn ($user) => in_array($user->email, $allowedEmails))`.

### Pulse Setup
6. **Install Pulse** — `composer require laravel/pulse`. Run migrations for Pulse's aggregate tables.
7. **Start with 4 recorders** — `SlowQueries`, `SlowJobs`, `Exceptions`, `CacheInteractions`. Do NOT enable all recorders blindly. Start with the 4 the team will actually act on.
8. **Set appropriate thresholds** — `SlowQueries::threshold => 100` (100ms). `SlowJobs::threshold => 500` (500ms). Adjust based on your application's performance profile.
9. **Configure retention** — Set `PULSE_TRIM_LOTTERY` to control how long Pulse data is retained. Default keeps ~7 days of data.
10. **Integrate with Sentry** — Pulse shows exception count trends; Sentry shows stack traces and affected users. Both must be configured. Neither replaces the other.

## Validation Checklist

### Telescope
- [ ] Telescope is disabled in production (gated by environment check, not just authentication)
- [ ] Telescope dashboard is authenticated in staging
- [ ] Telescope data pruning is enabled and running with appropriate retention
- [ ] Sensitive data filters are configured for staging environments with realistic data
- [ ] Telescope is installed as a `--dev` dependency

### Pulse
- [ ] Pulse is configured with 3-4 relevant recorders (not all available recorders blindly)
- [ ] Pulse is NOT the sole exception tracking solution (Sentry/Bugsnag is also configured)
- [ ] Pulse dashboard shows metrics the team actually monitors and acts on
- [ ] Pulse database retention is configured (`PULSE_TRIM_LOTTERY`)
- [ ] Production database has capacity for Pulse's data volume
- [ ] Team understands: Telescope = debugging, Pulse = trending, Sentry = alerting

## Common Failures
- Deploying Telescope to production — the cardinal sin of Laravel observability
- Expecting Pulse to replace Sentry for exception tracking — aggregate counts without stack traces
- Running Telescope AND Pulse in production — combined database write volume saturates capacity
- Adding 15+ Pulse cards nobody monitors — dashboard noise buries important signals
- Not pruning Telescope data — database disk fills within days in active development
- Configuring Telescope without data filters in staging — exposing PII to developers

## Performance Considerations
- Telescope overhead: ~10-30ms per request in local/staging (recording queries, mail, cache, logs)
- Telescope database growth: 100MB-1GB per day in active development without pruning
- Pulse overhead: ~1-3ms per request (records aggregate counters, not full request data)
- Pulse database growth: 10-50MB per day for a busy app with 4 recorders
- Both use separate database tables by default — they can coexist but should never both run in production

## Security Considerations
- Telescope stores request payloads, email bodies, session data, and query bindings — this is PII
- Telescope must NEVER be accessible in production, even with authentication
- Pulse stores aggregate counters, not individual records — safer for production than Telescope
- Telescope data filters must scrub passwords, tokens, and PII in staging environments
- Pulse's exception recorder stores exception counts, not stack traces — but job payloads in slow job recorder may contain PII

## Related Rules (from 05-rules.md)
- Telescope Must Never Run in Production
- Pulse + Sentry/Datadog — Not Pulse Instead of Sentry/Datadog
- Configure Telescope Pruning Aggressively
- Start Pulse with 3-4 Cards — Add More Only When the Team Acts on Them
- Add Telescope Filters to Scrub Sensitive Data

## Related Skills
- Laravel Horizon Decision Matrix (KU 09)
- Calibrated Package Recommendation Writing (KU 01)
- Package Escape Hatch Strategy (KU 04)

## Success Criteria
- Telescope runs in local and staging only — never in production. Staging data is scrubbed and pruned. Pulse runs in production with 4 actionable cards. Sentry is configured alongside Pulse. No developer has ever asked "why is production so slow?" because Telescope was accidentally deployed. No disk has ever filled with unpruned Telescope data.
