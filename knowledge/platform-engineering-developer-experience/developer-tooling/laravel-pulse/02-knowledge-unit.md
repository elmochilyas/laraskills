# Knowledge Unit: Laravel Pulse

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/laravel-pulse
- **Maturity:** Mature
- **Related Technologies:** Laravel Pulse, PHP, Laravel, Real-Time Monitoring

## Executive Summary

Laravel Pulse is a real-time application performance monitoring dashboard built into Laravel, providing a live view of: request throughput and response times, slow database queries and N+1 detection, queue job throughput and failures, cache operations (hits/misses/exceptions), HTTP client call performance, and exception rates. Pulse runs on your own infrastructure (no external services required) and displays data as a dashboard card interface. It uses a database driver (SQLite, MySQL, PostgreSQL) to store aggregated metrics with minimal overhead. Pulse is designed for "at-a-glance" monitoring—you open the dashboard to see what's happening right now, not historical analysis. It's installed via Composer, publishes assets and migrations, and is accessible at `/pulse` after configuration. Pulse supports custom cards for application-specific metrics.

## Core Concepts

- **Pulse Cards:** Individual dashboard widgets displaying specific metrics: Servers (system resources), Application (throughput/response time), Queues (job throughput), Slow Queries, Slow Jobs, Exceptions, Cache, HTTP Clients
- **Ingester:** The data collection component that captures metrics from Laravel events (RequestHandled, QueryExecuted, JobProcessed, CacheHit, CacheMissed)
- **Recorders:** Pulse recorders (classes extending `Record`) that listen to events and record entries to the Pulse data store
- **Dashboard:** The web UI at `/pulse` that renders Pulse cards with live-updating charts and tables using Server-Sent Events (SSE) for real-time updates
- **Metric Aggregation:** Pulse aggregates metrics by minute, hour, and day buckets to provide different time range views without storing raw data indefinitely
- **Custom Cards:** Extend `Pulse\Card` to create application-specific dashboard cards with custom data sources and visualizations

## Mental Models

- **Pulse as Server Dashboard:** Like a car's dashboard (speedometer, tachometer, fuel gauge)—Pulse shows the current state of your application's health at a glance
- **Pulse as Aggregate Monitor:** Where Debugbar shows individual request details, Pulse shows aggregate metrics across all traffic—forest, not trees
- **Pulse as Low-Overhead Observability:** Pulse is designed to run in production with minimal overhead—it records aggregated counts and timings, not full request dumps

## Internal Mechanics

1. **Event Listening:** Pulse recorders listen to Laravel events: `RequestHandled` (throughput/response time), `QueryExecuted` (slow queries), `JobProcessed` (queue metrics), `CacheHit/CacheMissed` (cache performance)
2. **Data Recording:** Each event triggers a recorder that writes an entry to the Pulse data store (database table `pulse_entries`). Entries are lightweight (event type, timestamp, value, key).
3. **Aggregation:** A scheduled command (`pulse:check`) runs every minute to aggregate raw entries into buckets (per-minute, per-hour, per-day) and prune old data
4. **Dashboard Querying:** The Pulse dashboard queries aggregated data for display; SSE connections provide real-time updates as new data arrives
5. **Pruning:** Pulse automatically prunes raw entries after they've been aggregated, keeping the data store manageable (typically <100MB for the database)
6. **Custom Card Registration:** Custom cards are registered in `config/pulse.php` and rendered on the dashboard alongside built-in cards

## Patterns

- **Real-Time Monitoring Pattern:** Keep Pulse open on a secondary monitor during deployments to watch for issues (spike in slow queries, increased error rate, queue backlog)
- **Post-Deployment Validation Pattern:** After deploying, watch Pulse for 5-10 minutes to verify the deployment hasn't introduced performance regressions (response time increase, new slow queries)
- **Capacity Planning Pattern:** Use Pulse's throughput and resource cards to identify peak usage times and plan capacity upgrades before performance degrades
- **Custom Card Pattern:** Create application-specific Pulse cards for business metrics: user registrations per minute, order throughput, API endpoint usage
- **Slow Query Investigation Pattern:** When Pulse shows a slow query, click through to see the query text; use the information to add indexes or optimize the query
- **Alert Integration Pattern:** Combine Pulse with a heartbeat service (OhDear, Freshping) that checks the Pulse dashboard for critical condition indicators

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Data store | SQL (SQLite/MySQL/PostgreSQL) vs Redis | SQL for persistence; Redis for real-time only (no historical data) |
| Dashboard access | Middleware-gated vs public vs IP-restricted | Middleware-gated (authentication required) |
| Card layout | Default vs custom order vs custom cards | Custom order for team priorities; custom cards for business metrics |
| Data pruning | 1 hour raw vs 24 hours raw vs no prune | 1 hour raw (default); 24 hours for debugging intermittent issues |

## Tradeoffs

- **Pulse vs Telescope:** Pulse is for "what's happening now" (aggregate, real-time, low overhead). Telescope is for "what happened in this specific request" (detailed, persistent, higher overhead). Use Pulse for production monitoring; Telescope for local debugging.
- **Pulse vs Debugbar:** Pulse shows aggregate metrics across all traffic (production). Debugbar shows individual request details (local). Both serve different purposes and are complementary.
- **Built-in Cards vs Custom Cards:** Built-in cards cover the most common monitoring needs with zero configuration. Custom cards provide application-specific visibility but require development effort. Start with built-in cards; add custom cards for business-critical metrics.
- **SQL vs Redis Storage:** SQL storage persists data across restarts and enables historical queries. Redis storage is faster and simpler but data is lost on restart. SQL is recommended for production.

## Performance Considerations

- **Collection Overhead:** Pulse adds <1ms per request for metric recording. The recorder writes a single row per event with minimal data (key, value, timestamp, type).
- **Database Impact:** A busy application (100 req/s) creates ~6000 entries per minute for all recorders. The `pulse:check` aggregation command prunes these efficiently.
- **Dashboard Impact:** The Pulse dashboard queries aggregate tables which are small (binned data by minute/hour/day). Dashboard queries run in <10ms.
- **SSE Connection Impact:** Each Pulse dashboard tab maintains an SSE connection. For teams with 5 developers watching Pulse simultaneously, this is negligible overhead.
- **Data Store Size:** Typical Pulse database size is 50-200MB for a busy application with 1-hour raw retention. This is manageable for most database servers.

## Production Considerations

- **Access Control:** Secure the `/pulse` route with middleware. Use Laravel's built-in auth or gate-based authorization. Never expose Pulse publicly without authentication.
- **Data Sensitivity:** Pulse stores route names (which may contain identifiers), query texts (which may contain data), and job class names. Consider data sensitivity before deploying.
- **Database Sizing:** Ensure the Pulse database has adequate size and performance. Pulse writes are frequent (each request generates multiple entries); use a database that handles write throughput.
- **Scheduled Task:** The `pulse:check` command must run every minute via Laravel's scheduler: `$schedule->command('pulse:check')->everyMinute()`. Without this, data won't aggregate and the database grows unbounded.
- **Queue Worker:** Pulse ingestion works with or without queues; if using job batching, ensure the queue worker is running for Pulse's data ingestion.

## Common Mistakes

- **Not running pulse:check scheduler:** Forgetting to add `pulse:check` to the schedule; raw entries accumulate indefinitely and the database grows unbounded
- **Exposing Pulse publicly:** Not securing the `/pulse` route with authentication; anyone can view application performance data and slow query texts
- **Too much raw retention:** Setting raw retention to 24 hours on high-traffic apps; the database grows to gigabytes. Keep raw retention at 1 hour (default).
- **Ignoring Pulse during deployments:** Deploying without checking Pulse for regressions; a performance regression goes unnoticed until users report it
- **Not adding custom cards:** Running Pulse with default cards only; custom cards for business-specific metrics provide additional value

## Failure Modes

- **Pulse Database Growth:** If `pulse:check` fails (scheduler not running, aggregation error), the Pulse database grows unbounded and may exhaust disk space. Mitigate: monitor Pulse database size; set up disk space alerts.
- **Record Overload:** An extremely high-traffic application overwhelms Pulse's database write capacity. Mitigate: use Redis as the Pulse store for high-throughput scenarios.
- **SSE Connection Issues:** The Pulse dashboard's SSE connections may be blocked by proxies, load balancers, or CDN configurations. Mitigate: ensure SSE works in your infrastructure; use the refresh button as fallback.
- **Dashboard Page Slow:** With many cards (20+), the Pulse dashboard may render slowly. Mitigate: limit custom cards; optimize card queries.

## Ecosystem Usage

- **Laravel Teams:** Pulse is the standard production monitoring dashboard for Laravel teams, often used alongside Telescope (development) and Nightwatch (enterprise APM)
- **Laravel Forge:** Forge's dashboard can be configured to point to Pulse for application-level monitoring alongside Forge's server-level monitoring
- **Laravel Cloud:** Pulse is available as a built-in monitoring option for Laravel Cloud deployments
- **Laravel Package Developers:** Package developers create Pulse cards for their packages, providing in-dashboard visibility for package performance
- **Open Source Laravel Projects:** Pulse is included in Laravel's skeleton, making it the default monitoring choice for new Laravel projects

## Related Knowledge Units

- pulse-cards-custom-development
- laravel-telescope
- laravel-debugbar
- laravel-nightwatch

## Research Notes

- Laravel Pulse was released in 2024 as part of Laravel 11.x, providing first-party real-time monitoring
- Pulse uses Server-Sent Events (not WebSockets) for real-time updates, making it compatible with most hosting infrastructure without needing a WebSocket server
- The pulse:check command aggregates raw entries using configurable retention periods; default is 1 hour raw, 24 hours hourly buckets, 2 months daily buckets
- Pulse cards are Livewire components; custom cards use Livewire's component architecture and can be distributed as Composer packages
