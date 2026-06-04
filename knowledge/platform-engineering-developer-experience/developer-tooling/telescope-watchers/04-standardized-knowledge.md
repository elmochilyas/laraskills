# 04-Standardized Knowledge: Telescope Watchers

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | telescope-watchers |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-telescope, debugbar-collectors-profiling, laravel-debugbar |
| **Framework/Language** | Laravel Telescope, PHP, Laravel |

## Overview

Telescope's 18 built-in watchers capture specific debugging data: requests, queries, jobs, events, cache, exceptions, mail, notifications, logs, dumps, gate checks, Redis commands, scheduled tasks, Artisan commands, HTTP client calls, views, models, sessions. Each watcher extends `Telescope\Watchers\Watcher`, listens to Laravel events, creates `EntryResult` objects. Individually configurable (enabled, thresholds, filters) via `config/telescope.php`. Custom watchers for app-specific debugging.

## Core Concepts

- **18 Watchers**: Request, Query, Job, Event, Cache, Exception, Mail, Notification, Log, Dump, Gate, Redis, Schedule, Command, HttpClient, View, Model, Session
- **Event Listening**: watchers hook into `QueryExecuted`, `JobProcessed`, `MessageSent`, `NotificationSent`, `CacheHit`, `RedisCommandExecuted`
- **Entry Recording**: watchers create `EntryResult` objects via `Telescope::record()`
- **Watcher Configuration**: per-watcher options: `RequestWatcher` `size_limit`, `QueryWatcher` `slow` threshold
- **Filtering**: `Telescope::filter()` to exclude entries (health checks, sensitive data)
- **Tags**: automatic tags (`auth:user-{id}`, `slow:true`) for dashboard filtering

## When to Use

- Development: enable all watchers for comprehensive debugging
- Production: enable only Exception, SlowQuery, FailedJob for targeted observation
- Custom debugging: create custom watchers for app-specific data capture

## When NOT to Use

- Production without selective enabling (full capture = performance hit, storage growth)
- Real-time monitoring needs (Pulse is better for aggregate live data)

## Best Practices (WHY)

- **Production watchers only**: ExceptionWatcher, QueryWatcher (slow only), JobWatcher (failed only)
- **Filter health checks**: use `Telescope::filter()` to exclude health check endpoints (every 10s creates noise)
- **Configure slow query threshold**: `'QueryWatcher' => ['slow' => 100]` — captures only queries > 100ms
- **Disable DumpWatcher in production**: if `telescope()->dump()` calls remain in code, they capture data
- **Set request size limit**: `'RequestWatcher' => ['size_limit' => 100]` (KB) to exclude uploads
- **Use tags**: `Telescope::tag(['payment:process'])` for organized filtering

## Architecture Guidelines

- Development: all 18 watchers enabled
- Staging: selective (Exception, SlowQuery, Mail, FailedJob)
- Production: minimal (Exception, SlowQuery > 100ms, FailedJob)
- Custom watchers: extend `Watcher`, implement `register()`, register via `Telescope::watcher()`
- Environment-specific configs via `config/telescope.php` with env variable overrides

## Performance Considerations

- QueryWatcher (with call stacks): highest overhead — disable call stacks in production
- Each enabled watcher adds proportional overhead
- 18 watchers on page with 50 queries = ~68 entries/request
- 10 req/s = ~680 writes/second to storage
- Memory: 1-5MB peak per request with all watchers

## Security Considerations

- RequestWatcher captures request bodies, headers, session data (passwords, tokens, PII)
- DumpWatcher captures variable contents — dangerous in production
- Use `Telescope::filter()` to scrub sensitive data
- Secure dashboard with authorization gates

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| All watchers in production | Full capture adds overhead, fills DB | Performance hit, storage | Selective (Exception, SlowQuery, FailedJob) |
| No slow query threshold | ALL queries captured | DB filled with normal queries | Set `slow => 100` |
| DumpWatcher in production | Captures debug dumps | Data exposure | Production: disabled |
| No health check filter | Every check creates entry | Dashboard noise | Filter via Telescope::filter() |
| No pruning | Entries accumulate | DB growth | Schedule telescope:prune |

## Anti-Patterns

- **Full capture as default**: enabling all watchers without considering environment needs
- **Ignoring request size limits**: capturing large file uploads in RequestWatcher

## Examples

```php
// config/telescope.php - production watchers
'watchers' => [
    RequestWatcher::class => false,
    QueryWatcher::class => ['enabled' => true, 'slow' => 100],
    ExceptionWatcher::class => true,
    JobWatcher::class => ['enabled' => true, 'failed' => true],
    DumpWatcher::class => false,
],
```

## Related Topics

- laravel-telescope — Telescope overview
- debugbar-collectors-profiling — Debugbar's collector system
- laravel-debugbar — browser-based debugging alternative

## AI Agent Notes

- Default watcher config for new projects: all in development, Exception+FailedJob in production
- Filter out health check routes automatically in generated Telescope configs

## Verification

- [ ] Production watcher config limits to Exception/SlowQuery/FailedJob
- [ ] Slow query threshold configured
- [ ] Health check requests filtered
- [ ] DumpWatcher disabled in production
- [ ] Request size limit set
- [ ] Pruning scheduled
