# Knowledge Unit: Debugbar Collectors and Profiling

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/debugbar-collectors-profiling
- **Maturity:** Mature
- **Related Technologies:** Laravel Debugbar, PHP, Laravel, Profiling

## Executive Summary

Laravel Debugbar's collectors are modular components that capture and display specific categories of debugging information: queries, routes, views, events, mail, logs, requests, session data, cache operations, and authentication state. Each collector is a PHP class that hooks into Laravel's lifecycle to gather data during a request. Collectors can be enabled/disabled individually via configuration, and custom collectors can be created for application-specific debugging needs. The profiling collectors (queries, timing, memory) provide performance metrics essential for identifying bottlenecks. Debugbar ships with ~20 built-in collectors covering common debugging needs, organized by tabs in the Debugbar interface. The configuration file (`config/debugbar.php`) controls which collectors are active and their specific settings.

## Core Concepts

- **Collectors:** Individual data sources (QueryCollector, RouteCollector, ViewCollector, EventCollector, MailCollector, LogCollector, RequestCollector, SessionCollector, CacheCollector, AuthCollector)
- **QueryCollector:** Captures all Eloquent and raw SQL queries with bindings, duration, and stack trace; identifies N+1 queries and slow queries
- **TimeCollector:** Records timing measurements via Debugbar's timer API; tracks total request time and custom time intervals
- **MemoryCollector:** Tracks peak memory usage during the request lifecycle
- **ViewCollector:** Lists rendered views with passed data, view composers, and render time per view
- **ExceptionCollector:** Catches and displays PHP exceptions and errors during the request
- **Custom Collectors:** Extend `Debugbar\DataCollector\DataCollector` to capture application-specific data

## Mental Models

- **Collectors as Debug Dashboard Widgets:** Each collector is a widget on a dashboard—queries show SQL, views show templates, events show listeners
- **Collectors as AOP Hooks:** Collectors use Aspect-Oriented Programming principles—they hook into Laravel's lifecycle (query execution, view rendering, event dispatch) to collect data transparently
- **Profiling Collectors as Performance Probes:** Query, Time, and Memory collectors are like surgical probes that measure specific parts of the request lifecycle without modifying application code

## Internal Mechanics

1. **Service Provider Registration:** DebugbarServiceProvider registers all active collectors in the IoC container; each collector implements `DataCollectorInterface` with `collect()` and `getName()` methods
2. **Lifecycle Hooking:** Collectors hook into Laravel events and middleware: QueryCollector listens to `Illuminate\Database\Events\QueryExecuted`; ViewCollector hooks into `composing:*` events
3. **Data Aggregation:** During the request, each collector accumulates data in internal arrays; QueryCollector stores each query with binding values, duration, and caller stack trace
4. **Output Rendering:** After the response is generated, Debugbar aggregates all collector data, serializes it to JSON, and injects it into the response (as a toolbar or via AJAX)
5. **Custom Collector Registration:** Custom collectors implement `collect()` and are registered via `Debugbar::addCollector()` or through the debugbar config's `collectors` array

## Patterns

- **Selective Collector Pattern:** Enable only needed collectors in production/staging (`'collectors' => ['queries' => true, 'views' => true]`) to minimize overhead
- **Query Analysis Pattern:** Use QueryCollector to identify N+1 queries (same query repeated with different bindings) and slow queries (duration highlighted in red)
- **Custom Timing Pattern:** Use `Debugbar::startMeasure('operation')` and `Debugbar::stopMeasure('operation')` to profile specific code sections
- **Custom Collector Pattern:** Create a collector for application-specific data: `class CustomDataCollector extends DataCollector { public function collect() { return ['data' => MyService::getDebugInfo()]; } }`
- **Environment-Based Configuration Pattern:** Enable Debugbar with all collectors in local/development; use selective enabling in staging; disable completely in production

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Collector selection | All vs selective vs custom | All in development; selective in staging; custom for production debugging |
| Data capture depth | Full data vs summary vs stack traces | Full in development; stack traces only for slow queries in staging |
| Custom collector scope | Per-request vs per-interval vs cumulative | Per-request for request-specific debugging; cumulative for cross-request analysis |
| Profiling API | Debugbar timing vs dd() vs custom logging | Debugbar timing for real-time feedback; custom logging for persistent profiling |

## Tradeoffs

- **Comprehensive vs Selective Collection:** Enabling all collectors provides maximum debugging information but adds overhead (15-50ms per request). Selective collection targets specific concerns with minimal overhead.
- **Stack Trace Depth:** Deep stack traces (showing full call chain) help identify query sources but increase memory usage. Shallow traces (3-5 levels) identify the source with lower overhead.
- **Data Capture vs Performance:** Debugbar's data collection adds overhead proportional to the number of collectors enabled. In development this is acceptable; in production it can cause timing fluctuations.

## Performance Considerations

- **Query Collection Overhead:** Each captured query adds 0.1-0.5ms for binding formatting and stack trace generation. For pages with 100 queries, this adds 10-50ms.
- **Memory Usage:** Debugbar stores all collected data in memory until the response is sent. A page with 500 queries and large view data may use 5-10MB of additional memory.
- **Stack Trace Generation:** PHP's `debug_backtrace()` is called for each query when stack traces are enabled. This is the most expensive operation—disable stack traces in production.
- **Response Injection:** Debugbar modifies the response to inject its toolbar. This can interfere with JSON APIs, file downloads, and streamed responses.

## Production Considerations

- **Disable in Production:** Debugbar should never be enabled in production by default. Configure `APP_DEBUG=false` to auto-disable Debugbar. Use `DEBUGBAR_ENABLED=null` (auto-detect from APP_DEBUG).
- **Selective Production Debugging:** If debugging is needed in production (staging, troubleshooting), enable selectively: enable specific collectors, disable stack traces, and set `'capture_ajax' => false`.
- **Security Implications:** Debugbar exposes sensitive information: database queries with data, session contents, environment configuration, and application internals. Never expose to non-admin users.
- **API Response Interference:** Debugbar's response injection breaks JSON APIs, API resource collections, and binary responses. Disable Debugbar for API routes or use `Debugbar::disable()` in API middleware.

## Common Mistakes

- **Enabling Debugbar in production:** Exposing database queries, session data, and environment variables to end users; a severe security risk
- **Not disabling for API routes:** Debugbar injects its toolbar into JSON responses, breaking API clients that expect pure JSON
- **Ignoring Debugbar overhead in performance testing:** Debugbar adds 50-200ms to request time; performance benchmarks run with Debugbar enabled show inaccurate results
- **Not using custom collectors:** Relying solely on built-in collectors when application-specific debugging data is needed
- **Stack trace overhead on slow pages:** Enabling query stack traces on pages that already have performance issues makes them even slower due to debug_backtrace() cost

## Failure Modes

- **Memory Exhaustion with Large Datasets:** A page that loads thousands of records triggers Debugbar to capture extensive data, exhausting PHP memory. Mitigate: limit query capture count; disable in memory-intensive operations.
- **JSON Response Corruption:** Debugbar's toolbar injection corrupts JSON API responses. Mitigate: disable Debugbar in API middleware or use `Debugbar::disable()` before API responses.
- **Redirection Loop Interference:** Debugbar data accumulates across redirects, causing memory growth. Mitigate: clear Debugbar data on redirect or disable for redirect-heavy flows.
- **Third-Party Package Conflict:** A package adds its own Debugbar collector that conflicts with built-in collectors (duplicate tab, excessive data). Mitigate: disable third-party collectors in config.

## Ecosystem Usage

- **Laravel Developers:** Debugbar is the most popular debugging tool in the Laravel ecosystem, used by nearly all developers during local development
- **Laravel Teams:** Teams use Debugbar with custom collectors for application-specific debugging data that's not covered by built-in collectors
- **Laravel Package Developers:** Package developers use Debugbar custom collectors to expose package debugging data (API calls, caching operations, queued jobs)
- **Bug Fixing Workflows:** Debugbar collectors are the first tool used when investigating performance issues (query count, view render time, memory usage)

## Related Knowledge Units

- laravel-debugbar
- telescope-watchers
- log-viewer-debugging-patterns
- xdebug-integration-sail

## Research Notes

- Debugbar's collector architecture is inspired by the Symfony Web Profiler toolbar; each collector follows the same `DataCollectorInterface` pattern
- The QueryCollector can capture database queries from multiple connections simultaneously, showing connection name alongside each query
- Debugbar v4.x (for Laravel 11+) improved custom collector registration with auto-discovery
- The `TimeCollector` uses Debugbar's built-in timer, which is independent of Laravel's request lifecycle timing
