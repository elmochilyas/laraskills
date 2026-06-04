# 04-Standardized Knowledge: Debugbar Collectors and Profiling

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | debugbar-collectors-profiling |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-debugbar, telescope-watchers, log-viewer-debugging-patterns |
| **Framework/Language** | Laravel Debugbar, PHP, Laravel, Profiling |

## Overview

Laravel Debugbar's collectors are modular components capturing specific debugging info: queries, routes, views, events, mail, logs, requests, session data, cache, and auth state. Each collector is a PHP class hooking into Laravel's lifecycle. ~20 built-in collectors organized by toolbar tabs. Custom collectors extend `DataCollector` for app-specific needs. Profiling collectors (queries, timing, memory) provide performance metrics for bottleneck identification. Config in `config/debugbar.php` controls active collectors.

## Core Concepts

- **Collectors**: individual data sources (QueryCollector, RouteCollector, ViewCollector, EventCollector, MailCollector, LogCollector, RequestCollector, SessionCollector, CacheCollector, AuthCollector)
- **QueryCollector**: captures all Eloquent/raw SQL queries with bindings, duration, stack trace; identifies N+1 and slow queries
- **TimeCollector**: timing measurements via Debugbar's timer API; tracks total request time and custom intervals
- **MemoryCollector**: peak memory usage tracking
- **ViewCollector**: rendered views with passed data, composers, and render time per view
- **ExceptionCollector**: catches/displays PHP exceptions during request
- **Custom Collectors**: extend `Debugbar\DataCollector\DataCollector` for app-specific data

## When to Use

- Development debugging of database queries, view data, and request lifecycle
- Performance profiling during development (query count, memory, timing)
- Custom application-specific debugging data collection
- Post-mortem investigation of unexpected behavior

## When NOT to Use

- Production environments (severe security risk, performance overhead)
- API/JSON responses (corrupts response format)
- Automated CI pipelines (no browser context)
- When Telescope is already providing historical debugging data

## Best Practices (WHY)

- **Selective collection in staging**: enable only needed collectors to minimize overhead
- **Disable in production**: `DEBUGBAR_ENABLED=false` or `APP_DEBUG=false` auto-disables
- **Use custom collectors**: extend Debugbar for app-specific debugging beyond built-ins
- **Disable for API routes**: use `Debugbar::disable()` in API middleware to prevent response corruption
- **Limit stack trace depth**: 3-5 levels identifies query source with lower overhead than full traces
- **Environment-based configuration**: all collectors in development; selective in staging; disabled in production

## Architecture Guidelines

- Register custom collectors via `Debugbar::addCollector()` or config `collectors` array
- Disable Debugbar for non-HTML responses via middleware
- Use `Debugbar::startMeasure()`/`stopMeasure()` for custom timing
- Set `'capture_ajax' => false` in production/staging

## Performance Considerations

- Query collection: 0.1-0.5ms per query (100 queries = 10-50ms overhead)
- Memory: 5-10MB additional for pages with 500 queries + large view data
- Stack traces via `debug_backtrace()` are most expensive operation
- Response size inflation: 20-200KB added to HTML

## Security Considerations

- Debugbar exposes DB queries with values, session data, env config, app internals
- Never enable in production or expose to non-admin users
- Disable for API routes to prevent data leakage in JSON/XML responses

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Enabled in production | Exposes queries, session data to end users | Critical security breach | Auto-disable via APP_DEBUG=false |
| Not disabled for API routes | Toolbar injected into JSON | Broken API responses | Disable in API middleware |
| Enabled during perf testing | 50-200ms added overhead | Inaccurate benchmarks | Disable before performance runs |
| No custom collectors | Relying only on built-in | Missing app-specific data | Create custom collectors |
| Full stack traces on slow pages | debug_backtrace() cost | Even slower performance | Limit trace depth |

## Anti-Patterns

- **Permanent Debugbar in staging**: leaving Debugbar always enabled on staging servers; use IP whitelisting or disable by default
- **Over-collecting**: enabling every collector when only query data is needed; selectively enable only what you need

## Examples

```php
// Custom collector
class QueryMetricsCollector extends DataCollector
{
    public function collect()
    {
        return ['slow_queries' => QueryMonitor::getSlowQueries()];
    }
    public function getName()
    {
        return 'query_metrics';
    }
}
```

## Related Topics

- laravel-debugbar — Debugbar overview and installation
- telescope-watchers — Telescope's alternative collector system
- log-viewer-debugging-patterns — log-based debugging approach

## AI Agent Notes

- When generating code with Debugbar, add environment conditionals to disable in production
- Custom collectors should implement `collect()` and `getName()` methods

## Verification

- [ ] Debugbar disabled in production
- [ ] API routes excluded from Debugbar injection
- [ ] Collector selection matches environment needs
- [ ] Custom collectors registered and functional
- [ ] Stack trace depth configured
