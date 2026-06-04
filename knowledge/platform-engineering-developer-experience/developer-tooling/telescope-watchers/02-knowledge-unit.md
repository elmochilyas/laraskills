# Knowledge Unit: Telescope Watchers

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/telescope-watchers
- **Maturity:** Mature
- **Related Technologies:** Laravel Telescope, PHP, Laravel, Debugging

## Executive Summary

Telescope watchers are individual data collectors that capture specific categories of debugging information in Laravel Telescope. The 18 built-in watchers cover: requests, queries, jobs, events, cache operations, exceptions, mail, notifications, logs, dumped variables, gate/authorization checks, Redis commands, scheduled tasks, Artisan commands, HTTP client calls, views, models, and sessions. Each watcher extends `Telescope\Watchers\Watcher` and listens to specific Laravel events or hooks into request lifecycle middleware. Watchers can be individually enabled, disabled, or configured (recording thresholds, filters) via the `config/telescope.php` configuration file. Custom watchers can be created for application-specific debugging data. Watcher configuration determines Telescope's storage usage and performance overhead.

## Core Concepts

- **Watcher Registration:** Each watcher is registered in `config/telescope.php` under the `watchers` array; watchers can be enabled/disabled with boolean values
- **Data Capture Events:** Watchers listen to Laravel events: `QueryExecuted`, `JobProcessed`, `MessageSent`, `NotificationSent`, `CacheHit`, `CacheMissed`, `RedisCommandExecuted`
- **Entry Recording:** Watchers create `EntryResult` objects from captured data and record them via `Telescope::record()`
- **Watcher Configuration:** Individual watchers may have configuration options: `RequestWatcher` has `size_limit` (ignore large requests), `QueryWatcher` has `slow` (slow query threshold)
- **Filtering:** Watchers support filtering via `Telescope::filter()` to exclude certain entries (e.g., health check requests, sensitive data)
- **Tags:** Watchers add automatic tags to entries (e.g., `auth:user-{id}`, `slow:true`) for dashboard filtering and search

## Mental Models

- **Watchers as Surveillance Cameras:** Each watcher is a camera monitoring a specific part of the application (queries, jobs, mail, cache)—recording everything that happens
- **Watchers as Selective Recorders:** Like a DVR that records multiple channels simultaneously—watchers record parallel streams of debugging data, all accessible in the Telescope dashboard
- **Watchers as Event Tracers:** Each watcher follows a specific trail of events through the application, capturing the data that flows through that subsystem

## Internal Mechanics

1. **Service Provider Registration:** TelescopeServiceProvider reads the watchers configuration and instantiates each enabled watcher, registering their event listeners
2. **Event Listener Registration:** Watchers use `Event::listen()` to hook into Laravel events. Each watcher registers listeners only for events it needs.
3. **Data Capture:** When a listened event fires, the watcher extracts relevant data (query SQL, job payload, mail recipient, exception trace) and creates an `EntryResult`
4. **Entry Tagging:** Watchers add automatic tags (`auth:user-1`, `slow:true`, `client:127.0.0.1`) and process any custom tags added via `Telescope::tag()`
5. **Batch Recording:** Entries are batched and recorded to storage (database, Redis) via `TelescopeEntryRepository::store()` for efficient writes
6. **Filter Application:** Before recording, entries pass through `Telescope::filter()` callback (if configured) to exclude matching entries

## Patterns

- **Selective Watcher Pattern:** In development, enable all watchers for comprehensive debugging. In production, enable only ExceptionWatcher, SlowQueryWatcher, and FailedJobWatcher for targeted observation.
- **Request Size Filtering Pattern:** Configure `RequestWatcher` with `size_limit` to exclude large request bodies (file uploads): `'RequestWatcher' => ['enabled' => true, 'size_limit' => 100]` (KB)
- **Slow Query Detection Pattern:** Configure `QueryWatcher` with `slow` threshold: `'QueryWatcher' => ['enabled' => true, 'slow' => 100]` (ms). Slow queries are tagged for easy filtering.
- **Sensitive Data Filter Pattern:** Use `Telescope::filter()` to exclude entries containing sensitive data: `Telescope::filter(fn ($entry) => !str_contains($entry->content['uri'] ?? '', 'admin/login'))`
- **Custom Watcher Pattern:** Create a custom watcher for application-specific debugging: extend `Watcher` class, implement `register()` to listen to custom events, capture data, and record entries
- **Tag-Based Organization Pattern:** Add custom tags via `Telescope::tag()` in middleware or service providers to categorize entries for dashboard filtering: `Telescope::tag(['payment:process'])`
- **Environment-Specific Watcher Config Pattern:** Use separate Telescope configs for each environment: all watchers in development, selective watchers in staging, minimal watchers in production

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Watcher coverage | All vs selective vs custom | All in development; selective (Exception, SlowQuery) in production; custom for business debugging |
| Recording threshold | No limit vs size limit vs count limit | Size limit for requests (100KB); count limit for queries (1000 per request) |
| Filter strategy | Include vs exclude vs tag-and-ignore | Exclude noise (health checks, static assets); tag important entries for easy search |
| Storage cleanup | Prune by age vs prune by count vs manual | Prune by age (24h default) for continuous development; prune by count for high-traffic apps |

## Tradeoffs

- **Full Capture vs Selective Capture:** All watchers enabled captures everything (comprehensive) but uses more storage and adds overhead. Selective capture reduces overhead but may miss issues in unmonitored subsystems.
- **Detailed vs Aggregated Watchers:** Some watchers capture each event individually (QueryWatcher captures every query); others aggregate (ModelWatcher captures model operations at a higher level). Individual capture is more detailed but more data-intensive.
- **Automatic vs Custom Watchers:** Built-in watchers cover standard Laravel subsystems with zero configuration. Custom watchers cover application-specific concerns but require development effort. Use built-in for standard coverage; custom for unique application patterns.

## Performance Considerations

- **Per-Watcher Overhead:** Each enabled watcher adds overhead proportional to its data capture. QueryWatcher (captures SQL text, bindings, call stack) adds the most overhead. DumpWatcher (captures variable dumps) adds overhead only when `telescope()->dump()` is called.
- **Storage Write Load:** Each enabled watcher writes entries to storage. 18 watchers on a page with 50 queries writes 18+50 = 68 entries per request. For 10 req/s, that's 680 writes/second.
- **Memory Impact:** Watchers accumulate data during a request; each watcher holds its data until the response is sent. With all watchers enabled, peak memory per request increases by 1-5MB.
- **Call Stack Generation:** The QueryWatcher generates call stacks for each query via `debug_backtrace()`, which is CPU-intensive. Disable call stacks in production.

## Production Considerations

- **Production Watcher Selection:** Enable only ExceptionWatcher (captures exceptions), QueryWatcher with `slow` threshold only (slow queries), and JobWatcher (failed jobs). Disable RequestWatcher (captures request data, PII risk) and DumpWatcher (development only).
- **Data Sensitivity:** RequestWatcher captures request bodies, headers, and session data which may include passwords, tokens, and PII. In production, use `Telescope::filter()` to scrub sensitive data.
- **Storage Management:** Production Telescope with selective watchers still generates data. Configure appropriate retention (1 hour for production) and ensure `telescope:prune` is scheduled.
- **Authorization:** Secure Telescope's dashboard with gates. Production Telescope should only be accessible to developers with explicit authorization, never to end users or automated systems.
- **Impact on Error Monitoring:** If using an error tracker (Sentry, Bugsnag), Telescope's ExceptionWatcher may double-capture exceptions. Configure ExceptionWatcher to ignore exceptions handled by the error tracker.

## Common Mistakes

- **Enabling all watchers in production:** Full Telescope capture in production adds significant overhead, fills the database with debugging data, and may capture sensitive information
- **Not configuring the QueryWatcher slow threshold:** The QueryWatcher captures ALL queries by default, not just slow ones; in production, this records every query to Telescope's storage
- **Enabling DumpWatcher in production:** DumpWatcher captures `telescope()->dump()` calls; if any dump calls are accidentally left in code, they capture data in production
- **Not filtering health check requests:** Health check endpoints (used by load balancers) create Telescope entries on every check (often every 10 seconds); filter them out with `Telescope::filter()`
- **Ignoring storage cleanup:** Not pruning Telescope entries; the database grows unbounded and may exhaust storage

## Failure Modes

- **Watcher Overload:** A single request with thousands of events (e.g., processing 10,000 items in a loop) generates too many entries for a watcher, causing memory issues. Mitigate: configure watch to ignore high-volume loops; batch entry recording.
- **QueryWatcher Memory Spike:** A page with 500+ queries causes QueryWatcher to store all query data (SQL, bindings, call stack) in memory. Mitigate: reduce query count on the page; disable call stacks.
- **Filter Expression Error:** An error in the `Telescope::filter()` callback prevents all entries from being recorded (silent failure). Mitigate: log filter callback errors; test filters thoroughly.
- **Custom Watcher Crash:** A bug in a custom watcher crashes the request handler. Mitigate: wrap watcher logic in try-catch; test custom watchers thoroughly before production deployment.

## Ecosystem Usage

- **Laravel Development:** All 18 watchers are enabled by default in development, providing comprehensive debugging data for every request
- **Laravel Teams:** Teams configure watchers per environment: all in development, selective in staging, minimal in production (Exception + SlowQuery + FailedJob)
- **Laravel Package Development:** Package developers use Telescope's custom watcher API to provide debugging data for their packages
- **API Development:** RequestWatcher, QueryWatcher, and ExceptionWatcher are the primary watchers used during API development and debugging
- **Queue/Job Development:** JobWatcher and RedisWatcher are essential for debugging queue workflows and Redis interactions

## Related Knowledge Units

- laravel-telescope
- debugbar-collectors-profiling
- laravel-debugbar
- log-viewer-debugging-patterns

## Research Notes

- Telescope 18 watchers: RequestWatcher, QueryWatcher, JobWatcher, EventWatcher, CacheWatcher, ExceptionWatcher, MailWatcher, NotificationWatcher, LogWatcher, DumpWatcher, GateWatcher, RedisWatcher, ScheduleWatcher, CommandWatcher, HttpClientWatcher, ViewWatcher, ModelWatcher, SessionWatcher
- Watchers can be ordered in the configuration file; the order determines the tab order in the Telescope dashboard
- Each watcher can have a `enabled` boolean and watcher-specific options defined in its config array
- Custom watchers are registered via `Telescope::watcher()` in the `TelescopeServiceProvider::register()` method; they follow the same pattern as built-in watchers
