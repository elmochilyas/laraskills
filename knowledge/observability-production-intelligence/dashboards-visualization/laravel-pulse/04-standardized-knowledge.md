# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-pulse
**Difficulty:** Beginner
**Category:** Dashboard & Monitoring
**Last Updated:** 2026-06-03

# Overview

Laravel Pulse is a first-party, real-time application monitoring dashboard included with Laravel. It provides a configurable dashboard showing application health and performance metrics via a simple, opinionated UI.

Pulse focuses on real-time data — the dashboard automatically refreshes and shows metrics for the last hour by default. It captures server metrics, slow requests, slow jobs, slow queries, cache hits/misses, and exception trends without external dependencies.

Engineers should care because Pulse provides immediate, zero-configuration visibility into application performance. A `composer require` and a route registration give you a production dashboard in minutes.

# Core Concepts

**Card:** A single metric display on the Pulse dashboard. Examples: Servers, Slow Requests, Slow Jobs, Exceptions, Cache, Queues. Each card shows a specific aspect of application performance.

**Recorder:** The component that captures and records metrics. Pulse records data in a cache store (Redis, database) with configurable retention. The dashboard reads from the same store.

**Cache Driver:** Pulse uses the application's cache store (Redis recommended for performance) to store recorded metrics. The cache driver choice significantly affects Pulse's data freshness and scalability.

**Dashboard:** The main Pulse UI accessible at `/pulse`. The dashboard consists of configurable cards arranged in a grid. Each card auto-refreshes.

**Filter:** Time-based and severity-based filters on the dashboard. Operators can filter cards to show data for the last hour, 24 hours, or 7 days.

**Authorization:** Pulse requires authorization to view the dashboard. By default, it's restricted to local environment. For production, configure a gate or middleware.

# When To Use

- **All Laravel applications** as a quick-start observability dashboard
- **Teams wanting zero-configuration monitoring** — no external servers, no API keys
- **Development and staging environments** for immediate performance feedback

# When NOT To Use

- **Long-term trend analysis** — Pulse is designed for real-time (last hour), not historical queries
- **Detailed distributed tracing** — Pulse shows aggregate metrics, not individual request traces
- **Alerting** — Pulse is a dashboard, not an alerting system

# Best Practices

**Use Redis as the cache driver for Pulse.** The database cache driver works but introduces latency and contention. Redis Pulse performs better under load and provides more accurate real-time data.

**Configure Pulse authorization for production.** Pulse reveals application performance data. By default it's local-only. Add a gate or middleware to restrict access in production.

**Customize the dashboard cards.** Remove cards for features your app doesn't use (Horizon, Octane). Add custom cards for business-specific metrics.

**Monitor Pulse storage.** Pulse uses the cache store to persist metrics. For database-backed cache, ensure adequate space. For Redis, monitor memory usage.

**Use Pulse alongside Nightwatch or Grafana.** Pulse is real-time focused. For longer retention and historical analysis, complement with Nightwatch or a Grafana-based solution.

# Architecture Guidelines

Pulse is entirely self-contained within the Laravel application:
1. **Recorder:** Middleware and listeners capture request, query, job, and cache events
2. **Storage:** Recorded data is stored in the configured cache driver
3. **Dashboard UI:** Rendered via Livewire, reads data from the cache store

Data is recorded via Laravel lifecycle events (request handled, query executed, job processed) and stored aggregated in the cache. The dashboard reads aggregated entries and renders them.

Pulse aggregates data into time buckets. Older data is pruned based on configured retention (default: entries per bucket limit, not time-based).

# Performance Considerations

- **Recording overhead:** Minimal — Pulse records data in memory during request lifecycle and flushes to cache after response is sent. <1ms overhead per request
- **Cache writes:** Each recordable event writes to cache. High-traffic apps may see increased cache write load
- **Dashboard load:** Pulse dashboard makes several cache reads per refresh. With Redis, <50ms load time
- **Pruning:** Pulse automatically prunes old entries. Pruning runs during recording, not as a separate task

# Security Considerations

- **Dashboard authorization required:** Configure Pulse gate for production. Pulse data includes endpoint names, query details, and error messages
- **Cache store security:** Pulse data in the cache store is accessible to anything with cache access. Ensure cache access is restricted
- **Sensitive endpoint names:** Dashboard shows slowest endpoints. If endpoint names include PII, configure exclusion patterns

# Common Mistakes

**Using database cache driver for Pulse.** Database-backed Pulse uses the same database for storage and dashboard reads. Under load, database cache contention slows both recording and dashboard rendering.

**No production authorization.** Deploying Pulse without configuring authorization. The dashboard is publicly accessible by default in production if route is registered.

**Forgetting to register Pulse routes.** Pulse route must be registered in the application. Without it, `/pulse` returns 404.

**Not customizing the cards.** Default dashboard includes all available cards, including Horizon and Octane cards that may not be relevant. Customize cards to show only relevant metrics.

# Anti-Patterns

**Pulse as sole observability solution.** Pulse shows real-time data only. It does not provide historical trends, long-term retention, or alerting. Use Pulse alongside long-term storage solutions.

**Ignoring Pulse in high-traffic apps.** Pulse recording and dashboard performance degrade under very high traffic (>10K RPM). At scale, use dedicated observability infrastructure.

**No pulse:ignore patterns.** Queue jobs and routes with important but high-volume execution generate dashboard noise. Use `Pulse::ignore()` or ignore patterns to filter out noisy entries.

# Examples

**Registering Pulse:**
```php
// In AppServiceProvider:
\Laravel\Pulse\Facades\Pulse::user(fn ($user) => $user->isAdmin());
```

# Related Topics

**Prerequisites:**
- Laravel cache configuration

**Closely Related Topics:**
- Laravel Nightwatch (complementary, longer retention)
- Laravel Telescope (debug toolbar, development-focused)

**Advanced Follow-Up Topics:**
- Custom Pulse card development
- Pulse recording customization

**Cross-Domain Connections:**
- Performance Optimization — Pulse surfaces slow queries and N+1 issues

# AI Agent Notes

- Real-time dashboard for last hour. Not for historical analysis
- Use Redis cache driver for production performance
- Configure authorization for production — dashboard reveals performance data
- Pulse complements Nightwatch/Grafana, does not replace them
- Minimal overhead (<1ms per request)
- Customize cards to match application's features
- Use ignore patterns for high-volume but uninteresting endpoints
