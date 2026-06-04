# Knowledge Unit: Laravel Telescope

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/laravel-telescope
- **Maturity:** Mature
- **Related Technologies:** Laravel Telescope, PHP, Laravel, Debugging

## Executive Summary

Laravel Telescope is an elegant debug assistant for Laravel applications, providing insight into incoming requests, database queries, queued jobs, scheduled tasks, cache operations, emitted events, logged exceptions, HTTP client calls, and dumped variables. Unlike Debugbar (browser toolbar), Telescope provides a full web dashboard at `/telescope` with detailed entries for each recorded event. It supports 18 built-in watchers covering all major Laravel subsystems. Telescope stores data in the database (or configurable storage), enabling historical review. It's designed as a development tool but can run in production with selective watchers for debugging specific issues. Telescope is an official Laravel package maintained by the Laravel team.

## Core Concepts

- **Watchers:** Individual data collectors: RequestWatcher, QueryWatcher, JobWatcher, CacheWatcher, EventWatcher, ExceptionWatcher, MailWatcher, NotificationWatcher, LogWatcher, DumpWatcher, GateWatcher, RedisWatcher, ScheduleWatcher, CommandWatcher, HttpClientWatcher, ViewWatcher, ModelWatcher, SessionWatcher
- **Dashboard:** Web UI at `/telescope` showing a summary of recent entries with filtering, search, and detail views for each entry type
- **Entries:** Individual records captured by watchers—an entry is one request, one query, one exception, etc. Each entry has metadata (timestamp, duration, caller, data).
- **Storage Drivers:** Database (default), Redis, or custom storage backends for Telescope entries
- **Entry Tags:** Automatic and manual tags on entries for filtering and organization (e.g., `auth:user`, `slow:true`)
- **Telescore Pruning:** Automatic cleanup of old entries via `telescope:prune` command to prevent database growth

## Mental Models

- **Telescope as Request Time Machine:** Telescope lets you go back in time and inspect the details of any past request, query, or job—like a DVR for your application
- **Telescope as Debugging Hub:** Where Debugbar shows the current request, Telescope shows the history of recent requests—switch between them, compare, and analyze patterns
- **Telescope as Laravel Event Recorder:** Each watcher is like an event recorder for a specific Laravel subsystem, capturing everything that happens as the application runs

## Internal Mechanics

1. **Service Provider Registration:** TelescopeServiceProvider registers middleware (for request capture) and watchers (for specific event capture) during Laravel's boot process
2. **Middleware Capture:** `TelescopeMiddleware` captures request/response data: method, URI, headers, payload, response status, duration, memory usage
3. **Watcher Event Listening:** Each watcher registers event listeners: QueryWatcher listens to `QueryExecuted`, JobWatcher listens to `JobProcessed`, MailWatcher listens to `MessageSent`
4. **Entry Recording:** Watchers create `EntryResult` objects and store them via the `TelescopeEntryRepository` (supports batch inserts)
5. **Dashboard Queries:** The Telescope dashboard queries stored entries with pagination, filtering (by watcher type, tag, date range), and search
6. **Pruning:** The `telescope:prune` command (scheduled daily by default) deletes entries older than the configured retention period (default: 24 hours)

## Patterns

- **Request Debugging Pattern:** After a problematic request, open Telescope, find the request by URI or time, inspect query details, view exceptions, and check the request/response data
- **Query Analysis Pattern:** Use the Query watcher to identify N+1 queries, slow queries (>100ms), duplicate queries, and query patterns across all recent requests
- **Queue Monitoring Pattern:** Use the Jobs watcher to track queue throughput, job failures, and job duration. Investigate failed jobs by viewing exception details in Telescope.
- **Mail/Notification Preview Pattern:** Use Mail and Notification watchers to preview sent emails and notifications without actually sending them (captures data before dispatch)
- **Dump Debugging Pattern:** Use `telescope()->dump($variable)` to inspect variables in the Telescope dashboard instead of `dd()`. Multiple dumps in a single request are grouped.
- **Selective Production Recording Pattern:** In production, enable only specific watchers (Exception, Slow Query) to capture critical issues without the overhead of full recording.
- **Tag-Based Filtering Pattern:** Add manual tags: `Telescope::tag('payment:failed')` to entries for filtering in the dashboard.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Watcher selection | All watchers vs selective | All in development; selective (Exception, SlowQuery, Mail) in production |
| Storage driver | Database vs Redis vs custom | Database for simplicity; Redis for high-traffic; custom for compliance |
| Retention period | Hours vs days vs weeks | 24 hours (default) for development; 7 days for staging; 1 hour for production |
| Recording mode | Immediate vs batch vs off | Immediate for development; batch for production (lower overhead) |
| Access control | Gate-based vs middleware vs public | Gate-based (authorization) for all environments |

## Tradeoffs

- **Telescope vs Debugbar:** Telescope stores entries persistently (database) with a full web dashboard for browsing history. Debugbar shows data inline in the current page. Telescope is better for post-mortem debugging; Debugbar is better for real-time development feedback.
- **Full Recording vs Selective Recording:** Full recording captures all data but adds overhead (10-50ms per request) and database storage. Selective recording targets specific watchers for lower overhead. Use selective recording in production.
- **Database Storage vs Redis Storage:** Database storage persists data and enables querying but adds write load. Redis storage is faster and doesn't add database load but data is lost on restart.

## Performance Considerations

- **Recording Overhead:** Full Telescope recording adds 10-50ms per request (query capture, entry writing, tag processing). Selective recording with only Exception watcher adds <5ms.
- **Database Write Load:** Each request generates multiple entries (request, queries, events, etc.). A busy app (100 req/s) may write 500-1000 entries/second. Consider Redis storage for high-traffic applications.
- **Database Growth:** Telescope entries consume database storage proportional to request volume. With default 24-hour retention, a busy app may store 1-5GB of Telescope data.
- **Dashboard Query Performance:** The Telescope dashboard queries can be slow with large datasets (millions of entries). Use pruning, indexing, and pagination to maintain dashboard responsiveness.

## Production Considerations

- **Access Control:** Secure `/telescope` with authorization gates. Telescope exposes request data, queries with values, and application internals. Never expose without authentication.
- **Production Recording:** Enable only non-sensitive watchers in production (Exception, SlowQuery, Mail). Never enable DumpWatcher or RequestWatcher (captures request data including passwords).
- **Data Sensitivity:** Telescope records request data which may include PII, passwords, API tokens, and other sensitive information. Consider data protection regulations (GDPR, HIPAA).
- **Scheduled Pruning:** Ensure `telescope:prune` is running in the scheduler to prevent database growth. Configure retention based on compliance requirements.
- **Storage Driver Selection:** For production, consider Redis storage (faster, lower database load) or a dedicated Telescope database to isolate monitoring data from application data.

## Common Mistakes

- **Running Telescope in production with default config:** Full recording in production adds overhead, fills the database, and exposes sensitive request data; always use selective production configuration
- **Not securing the dashboard:** Exposing `/telescope` without authentication; anyone can view sensitive application data and debugging information
- **Not pruning entries:** Forgetting to schedule `telescope:prune`; the database grows unbounded and may exhaust storage
- **Enabling DumpWatcher in production:** The DumpWatcher captures `telescope()->dump()` calls, which may contain sensitive data; enable only in development
- **Using Telescope with high-traffic applications:** Without Redis storage or selective watchers, Telescope adds significant database write load on high-traffic apps

## Failure Modes

- **Database Write Exhaustion:** High-traffic application overwrites Telescope database, consuming all available database write capacity. Mitigate: use Redis storage; enable selective watchers; reduce retention period.
- **Entry Count Explosion:** A loop or repeated operation creates millions of Telescope entries, exhausting storage. Mitigate: enable rate limiting on entry recording; set entry count limits.
- **Dashboard Unresponsive:** Millions of Telescope entries make the dashboard queries slow or unresponsive. Mitigate: prune aggressively; add database indexes; use pagination.
- **Sensitive Data Leakage:** Telescope records sensitive data (passwords, tokens) that is exposed via the dashboard. Mitigate: use `Telescope::filter()` to exclude sensitive data from recording.

## Ecosystem Usage

- **Laravel Development:** Telescope is the standard debugging tool for complex Laravel applications, recommended in the Laravel documentation
- **API Development:** Telescope is particularly valuable for API development, where Debugbar's toolbar injection doesn't work with JSON responses
- **Queue Debugging:** Telescope is the primary tool for debugging queue issues, providing detailed job execution data and failure tracking
- **Laravel Package Development:** Package developers use Telescope to verify their packages' interaction with Laravel's subsystems
- **Laravel Teams:** Teams use Telescope in staging environments with selective watchers to catch issues before production deployment

## Related Knowledge Units

- telescope-watchers
- laravel-debugbar
- laravel-pulse
- debugbar-collectors-profiling

## Research Notes

- Laravel Telescope was created by the Laravel team (Mohamed Said, Taylor Otwell) and is maintained as an official Laravel package
- Telescope's watcher architecture is extensible; custom watchers can be created by extending `Telescope\Watchers\Watcher` and registering via `Telescope::watcher()`
- Telescope v5.x (Laravel 11+) improved performance with batch entry recording and optimized database queries
- The `telescope:prune` command uses chunked deletion to avoid long-running transactions and table locks when pruning large datasets
