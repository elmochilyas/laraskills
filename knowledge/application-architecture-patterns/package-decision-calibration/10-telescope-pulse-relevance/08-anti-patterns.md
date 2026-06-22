# Anti-Patterns for Telescope & Pulse Relevance

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Telescope & Pulse Relevance |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-TLP-001 | Telescope in Production | Critical | High |
| AP-TLP-002 | Pulse as Replacement for Sentry/Datadog | Critical | High |
| AP-TLP-003 | Telescope for Long-Term Data Retention | Medium | Medium |
| AP-TLP-004 | Both Telescope and Pulse Without Pruning | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-HZN-001 (Horizon as Primary Monitoring Tool) — from KU 09 (same "one tool for everything" fallacy)
- AP-CPR-004 (Tradeoff Denial) — from KU 01 (same "ignoring the operational cost" problem)

---

## AP-TLP-001: Telescope in Production

### Category
Security | Performance

### Description
Deploying Laravel Telescope to a production environment — even with authentication — causing 10-30ms per-request overhead, storing customer PII in Telescope tables, filling the production database with debugging data, and potentially exposing an unauthenticated dashboard with sensitive operational intelligence.

### Why It Happens
- Forgetting to add the `APP_ENV=production` guard in TelescopeServiceProvider
- "We need it for debugging a production issue" — enabling temporarily but never disabling
- Installing Telescope as a production dependency (`composer require` without `--dev`)
- Assuming authentication is sufficient protection — ignoring the performance and data storage implications
- CI/CD pipeline deploys everything in composer.json without distinguishing dev dependencies

### Warning Signs
- Telescope tables (`telescope_entries`, `telescope_monitoring`) exist in the production database
- Application response times increased by 10-30ms after a deploy
- Production database disk usage growing faster than expected (100MB+/day from Telescope alone)
- `/telescope` is accessible from the public internet (even if "authenticated")
- Production `.env` has `TELESCOPE_ENABLED=true`

### Why Harmful
Telescope's fundamental design is incompatible with production. It records every HTTP request (including headers, payloads, session data), every database query (including bindings with PII), every sent email (including recipient addresses and body content), every cache operation, every queued job, and every log entry. In production, this means: (a) customer PII stored in plaintext in Telescope database tables, (b) 10-30ms added to every request for every user, (c) database growth of 100MB-1GB per day, and (d) an operational intelligence dashboard that could expose system internals. This is simultaneously a data breach, a performance incident, and a security vulnerability.

### Real-World Consequences
- A team deploys Telescope to production "just for launch week." The Telescope dashboard is gated behind admin login. A misconfigured load balancer exposes the Telescope route without authentication. A security researcher discovers it and finds: all customer email addresses, password reset tokens in query bindings, internal API URLs, and server configuration details. The company must report a data breach covering all customers who used the application during launch week. The incident costs: forensic investigation, customer notification, and regulatory reporting.

### Preferred Alternative
Telescope must be disabled in production unconditionally. The guard in `TelescopeServiceProvider::register()` must return early if `$this->app->environment('production')`. This guard must run before any Telescope registration — not just gating the dashboard. For production debugging, use: structured logging (ELK, Papertrail), error tracking (Sentry, Bugsnag), query logging via database slow query log, and Laravel Pulse for aggregate metrics. None of these store raw request/response data per request.

### Refactoring Strategy
1. Add the production guard to TelescopeServiceProvider IMMEDIATELY: `if ($this->app->environment('production')) { return; }`.
2. Remove Telescope tables from the production database.
3. Ensure Telescope is in `require-dev` in composer.json, not `require`.
4. Add a CI check: fail the build if Telescope is not gated behind a production environment check.
5. Verify the guard by attempting to access `/telescope` in production — it should 404 or not register the routes at all.

### Detection Checklist
- [ ] Telescope tables exist in the production database
- [ ] `TELESCOPE_ENABLED=true` in production `.env`
- [ ] Telescope is listed under `require` (not `require-dev`) in composer.json
- [ ] No production guard exists in `TelescopeServiceProvider::register()`
- [ ] `/telescope` is accessible (even if authenticated) from the production URL
- [ ] Production request latency has unexplained 10-30ms overhead

### Related Rules
- Telescope Must Never Run in Production

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)

---

## AP-TLP-002: Pulse as Replacement for Sentry/Datadog

### Category
Observability

### Description
Deploying Laravel Pulse and believing it replaces the need for exception tracking (Sentry, Bugsnag) and/or APM (Datadog, New Relic). Pulse shows aggregate counts — exception frequency, slow query trends — but does not provide the stack traces, affected user details, release correlation, or infrastructure-level visibility needed to investigate and resolve incidents.

### Why It Happens
- Pulse is free and built-in — "why pay for Sentry when Pulse shows exceptions?"
- Confusing aggregate awareness with investigation capability: Pulse shows THAT exceptions spiked, not WHY
- Small teams with limited observability budget using Pulse as a "good enough" substitute
- Never having experienced a production incident with Pulse alone — the gap becomes visible only during an actual outage

### Warning Signs
- Pulse is the only tool showing exception data in production
- When an exception spike occurs, the team cannot view individual stack traces without SSH access to log files
- Post-mortems include "we could see the spike in Pulse but couldn't identify the root cause"
- No alerting is configured — Pulse is a dashboard the team checks proactively, not a system that alerts on incidents
- Mean time to resolution (MTTR) exceeds 30 minutes for most production incidents

### Why Harmful
When a production incident occurs, Pulse tells you "exception count up 500%." That's awareness, not investigation. To fix the incident, the team needs: the exact stack trace (Sentry), the release that introduced the bug (Sentry release tracking), which users are affected (Sentry user context), and potentially which database host is the bottleneck (Datadog infrastructure metrics). Without these, the team knows something is wrong but must manually investigate — SSH to servers, grep log files, check git history. The first 15-30 minutes of every incident are wasted on manual investigation that Sentry/Datadog would answer in seconds.

### Real-World Consequences
- A team deploys a buggy release at 5 PM on Friday. Pulse shows exception count spiking. There's no Sentry, so nobody is alerted. At 9 PM, a customer reports an issue. The on-call engineer opens Pulse, sees the spike, but cannot view stack traces. They spend 45 minutes SSH-ing to production servers, grepping log files, and git-bisecting to find the bad commit. The bug is fixed at 11 PM. With Sentry, the on-call engineer would have been alerted at 5:05 PM with the exact stack trace and release that introduced it. MTTR would have been 15 minutes instead of 6 hours.

### Preferred Alternative
Pulse is the awareness layer ("something is wrong"). Sentry is the investigation layer ("here's exactly what's wrong"). Both are needed; neither replaces the other. Minimum production stack: Pulse (aggregate trends) + Sentry (exception details + alerting). Extended stack: + Datadog/New Relic (infrastructure correlation + distributed tracing). Pulse without Sentry is awareness without the ability to act — the worst of both worlds: you know there's a problem but can't fix it efficiently.

### Refactoring Strategy
1. Configure Sentry (or Bugsnag) immediately. This is non-negotiable for any application with users.
2. Verify Sentry is capturing exceptions, release tracking is configured, and alerting rules are set.
3. Keep Pulse for aggregate trending — it complements Sentry, it doesn't compete with it.
4. Document the observability stack and the role of each tool for the on-call team.

### Detection Checklist
- [ ] Pulse is the only tool providing exception visibility in production
- [ ] No exception tracking service (Sentry, Bugsnag) is configured
- [ ] "We can see the spike in Pulse" is stated in post-mortems without being able to identify root cause
- [ ] On-call engineers SSH into production servers to grep log files during incidents
- [ ] Pulse dashboard is checked proactively rather than generating alerts on anomalies

### Related Rules
- Pulse + Sentry/Datadog — Not Pulse Instead of Sentry/Datadog

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)

---

## AP-TLP-003: Telescope for Long-Term Data Retention

### Category
Data Management

### Description
Using Telescope as an audit log, analytics store, or long-term data warehouse. Telescope prunes old data by design — it's a debugging tool, not a retention system. Teams that rely on Telescope for historical data discover that their data has been pruned when they need it most.

### Why It Happens
- "Telescope already records everything — let's use it for analytics too" — convenience over correctness
- Not having a separate audit log or analytics pipeline, so Telescope becomes the default data store
- Disabling Telescope pruning to "keep all the data" — then discovering the database has filled
- Misunderstanding Telescope's purpose: it's a real-time debugging window, not a historical record

### Warning Signs
- Telescope pruning is disabled (`TELESCOPE_DATA_PRUNE_ENABLED=false`)
- Business questions are answered by querying Telescope tables: "how many users registered last month?"
- Telescope tables are included in analytics ETL pipelines
- "We need to check Telescope for that" — for data older than 48 hours
- Telescope database size exceeds application data size

### Why Harmful
Telescope is not designed for data retention. Its schema is optimized for real-time debugging queries, not analytical queries. Its pruning system exists specifically because Telescope data volume is unsustainable without it. Disabling pruning to use Telescope as a data store results in: (a) database disk filling within weeks, (b) slow analytical queries on unindexed Telescope tables, and (c) data loss when pruning is eventually re-enabled to reclaim disk space. Telescope data is debugging exhaust — treat it as ephemeral.

### Real-World Consequences
- A team uses Telescope to track registration analytics for 3 months (pruning disabled). The `telescope_entries` table grows to 15GB. Database performance degrades across all queries because Telescope writes compete with application reads/writes. The team re-enables pruning and loses all historical analytics data. The 3 months of "analytics" are gone because they were stored in a tool designed to delete them.

### Preferred Alternative
For audit logs: use a dedicated audit log package or a custom `audit_logs` table with appropriate retention and indexing. For analytics: use an analytics database (separate from the application database), a data warehouse, or a BI tool. For request/query debugging: Telescope with aggressive pruning (1 hour local, 48 hours staging). Each use case has a purpose-built tool. Telescope is exclusively for real-time debugging — it should not be the source of truth for any long-term data.

### Refactoring Strategy
1. Identify any business processes that read from Telescope tables. Migrate them to dedicated data stores.
2. Re-enable Telescope pruning with appropriate retention (1 hour local, 48 hours staging).
3. Build the dedicated audit log, analytics pipeline, or data warehouse needed for business data.
4. Verify that no application code queries Telescope tables directly (they're Telescope's internal tables).

### Detection Checklist
- [ ] Telescope pruning is disabled
- [ ] Business metrics or reports query Telescope tables
- [ ] Telescope database is larger than the application database
- [ ] "Check Telescope" is the answer to questions about data older than 48 hours
- [ ] Telescope tables appear in analytics or ETL pipeline configurations

### Related Rules
- Configure Telescope Pruning Aggressively

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)

---

## AP-TLP-004: Both Telescope and Pulse Without Pruning

### Category
Data Management | Performance

### Description
Running both Telescope AND Pulse — especially with Telescope pruning disabled or misconfigured. Telescope writes 60+ rows per request (queries, cache, mail, logs). Pulse writes aggregate data every N seconds. Combined, they can saturate the database write capacity, fill the disk, and degrade application performance. Running both in production is catastrophic; running both in staging without pruning is problematic.

### Why It Happens
- "More observability is better" — installing both without calculating the combined data volume
- Staging environment with both tools and default (disabled) pruning
- CI pipeline that runs both tools during test suites, accumulating data across test runs
- No database capacity planning for observability data

### Warning Signs
- Both Telescope and Pulse installed and enabled in the same environment
- Database write IOPS spiking without corresponding application traffic increase
- Database disk usage growing faster than expected
- Telescope pruning disabled (or retention too long) AND Pulse retention at default
- "The database is slow" — write capacity consumed by observability tools, not application logic

### Why Harmful
Telescope writes per-request (60+ rows per request). Pulse writes per-time-interval (aggregate counters every N seconds). The combined write volume can exceed the application's own write volume. In a staging environment with 10 requests/second, Telescope writes 600+ rows/second. In production (where Telescope should never be), the combined write volume would be catastrophic. Even in staging, unpruned data accumulates: a CI test suite running 500 tests per run with Telescope enabled adds thousands of rows per run, filling CI disk over time.

### Real-World Consequences
- A staging environment has both Telescope and Pulse enabled. Telescope pruning is at default (disabled). Over 2 weeks of development activity, the staging database grows to 5GB — 90% Telescope data. The CI pipeline slows because database migrations run against a bloated database. The staging environment becomes unusably slow. The team spends a day diagnosing "why is staging so slow" — it's Telescope data bloat.

### Preferred Alternative
Telescope and Pulse should never run in the same environment in production — Telescope should never run in production at all. In staging: Telescope can be enabled (for debugging) with aggressive 48-hour pruning. Pulse should be disabled in staging (aggregate metrics from staging traffic are not actionable). They use separate database tables by default — they can technically coexist but should not both be active in any single environment without understanding the combined data volume.

### Refactoring Strategy
1. In production: disable Telescope immediately. Keep Pulse with appropriate card selection.
2. In staging: keep Telescope with aggressive pruning. Disable Pulse.
3. In local: keep Telescope with 1-hour pruning. Disable Pulse.
4. Verify database sizes after configuration: ensure observability data is <20% of total database size.
5. Add CI disk cleanup: truncate Telescope tables after test suite runs in CI.

### Detection Checklist
- [ ] Both Telescope and Pulse are enabled in the same environment
- [ ] Telescope pruning is not configured or has retention >48 hours
- [ ] Database disk usage is dominated by Telescope or Pulse tables
- [ ] CI environment accumulates Telescope/Pulse data across runs without cleanup
- [ ] Database write throughput significantly exceeds application request throughput

### Related Rules
- Configure Telescope Pruning Aggressively
- Start Pulse with 3-4 Cards — Add More Only When the Team Acts on Them

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)
