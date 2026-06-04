# Laravel Pulse

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 07-dashboards-visualization
- **Knowledge Unit:** laravel-pulse
- **Difficulty Level:** Beginner
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Pulse is a first-party, real-time application monitoring dashboard included with Laravel. It provides immediate, zero-configuration visibility into application performance — a `composer require` and route registration give you a production dashboard in minutes, showing server metrics, slow requests, slow jobs, slow queries, and exceptions.

---

## Core Concepts

- **Card:** A single metric display — Servers, Slow Requests, Slow Jobs, Exceptions, Cache, Queues
- **Recorder:** Component capturing and recording metrics via Laravel lifecycle events
- **Cache Driver:** Pulse uses the application's cache store (Redis recommended) for recorded metrics
- **Dashboard:** Main Pulse UI at `/pulse` with configurable cards in an auto-refreshing grid
- **Filter:** Time-based and severity-based filters — last hour, 24 hours, or 7 days
- **Authorization:** Pulse requires authorization — restricted to local by default, configure gate for production

---

## Mental Models

- **Car Dashboard Model:** Pulse is the speedometer and fuel gauge on your car's dashboard — easy to read, real-time, zero configuration. Not a diagnostic computer (that's Nightwatch/Grafana)
- **Snapshot Model:** Pulse shows the last hour's data — like a security camera showing recent footage. It doesn't record everything forever, just enough for immediate situational awareness
- **Vital Signs Monitor Model:** Pulse is a hospital vital signs monitor — it shows current metrics (heart rate, blood pressure) in real-time. For long-term charts and trends, you need a different tool

---

## Internal Mechanics

Pulse is entirely self-contained within the Laravel application. The Recorder captures request, query, job, and cache events via middleware and listeners during the request lifecycle. Data is aggregated in memory and flushed to the cache store after the response is sent. The dashboard (Livewire-powered) reads aggregated entries from the cache store and renders them. Pulse aggregates data into time buckets and prunes old entries automatically based on configured limits (not time-based).

---

## Patterns

- **Redis Cache Driver:** Use Redis as the Pulse cache driver. Benefit: better performance under load, more accurate real-time data. Tradeoff: requires Redis infrastructure.
- **Customized Dashboard Cards:** Remove cards for unused features (Horizon, Octane), add custom cards for business-specific metrics. Benefit: relevant metrics only. Tradeoff: requires development effort for custom cards.
- **Pulse:ignore Patterns:** Use `Pulse::ignore()` or ignore patterns to filter noisy entries from high-volume but uninteresting endpoints. Benefit: cleaner dashboard signal. Tradeoff: ignored entries are invisible if they become relevant.

---

## Architectural Decisions

**Use Redis as the cache driver for Pulse.** The database cache driver introduces latency and contention. Redis Pulse performs better under load and provides more accurate real-time data.

**Configure Pulse authorization for production.** Pulse reveals application performance data. By default it's local-only. Add a gate or middleware to restrict access in production.

**Use Pulse alongside Nightwatch or Grafana.** Pulse is real-time focused (last hour). For longer retention and historical analysis, complement with Nightwatch or Grafana.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-configuration — running in minutes | Real-time only (last hour) — no historical trends | Complement with Nightwatch/Grafana |
| Minimal overhead (<1ms per request) | Cache driver choice affects performance | Use Redis for production, database for testing |
| Built-in authorization system | Must configure for production access | Dashboard reveals endpoint names and query details |

---

## Performance Considerations

Recording overhead is minimal — Pulse records in memory and flushes after response. <1ms overhead per request. Cache writes increase with each recordable event — Redis handles this well. Dashboard load via Redis is <50ms. Pulse automatically prunes old entries during recording, not as a separate task.

---

## Production Considerations

Configure Pulse gate for production — Pulse data includes endpoint names, query details, and error messages. Pulse data in the cache store is accessible to anything with cache access — ensure cache access is restricted. Dashboard shows slowest endpoints — if endpoint names include PII, configure exclusion patterns.

---

## Common Mistakes

**Using database cache driver for Pulse** — under load, database cache contention slows both recording and dashboard rendering. Use Redis for production.

**No production authorization** — deploying Pulse without configuring authorization. The dashboard is publicly accessible by default if route is registered.

**Forgetting to register Pulse routes** — Pulse route must be registered. Without it, `/pulse` returns 404.

**Not customizing the cards** — default dashboard includes all cards, including Horizon and Octane cards that may not be relevant.

---

## Failure Modes

**Cache store exhaustion:** Pulse data fills the Redis cache store. Detection: Redis memory alarms. Mitigation: configure pruning; monitor cache size.

**Dashboard performance degradation:** Large Pulse dataset causes slow dashboard rendering. Detection: Pulse pages load slowly. Mitigation: reduce retention; use filters; upgrade cache driver.

**Authorization bypass:** Missing or misconfigured Pulse gate exposes dashboard publicly. Detection: anyone can access `/pulse`. Mitigation: configure Pulse gate in production; test access restrictions.

---

## Ecosystem Usage

Pulse is a first-party Laravel package included with the framework. It complements Laravel Nightwatch (longer retention) and Laravel Telescope (development debugging). Pulse uses the application's cache driver for storage. Custom Pulse cards can be developed for business-specific metrics.

---

## Related Knowledge Units

### Prerequisites
- Laravel cache configuration

### Related Topics
- Laravel Nightwatch (complementary, longer retention)
- Laravel Telescope (debug toolbar, development-focused)

### Advanced Follow-up Topics
- Custom Pulse card development
- Pulse recording customization

---

## Research Notes

Real-time dashboard for last hour — not for historical analysis. Use Redis cache driver for production performance. Configure authorization for production — dashboard reveals performance data. Pulse complements Nightwatch/Grafana, does not replace them. Minimal overhead (<1ms per request). Customize cards to match application's features.
