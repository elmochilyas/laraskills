# 04-Standardized Knowledge: Laravel Telescope

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | laravel-telescope |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | telescope-watchers, laravel-debugbar, laravel-pulse |
| **Framework/Language** | Laravel Telescope, PHP, Laravel |

## Overview

Laravel Telescope is an official debug assistant providing insight into: requests, DB queries, queued jobs, scheduled tasks, cache operations, events, exceptions, HTTP client calls, and dumped variables. Full web dashboard at `/telescope` with detailed entries. 18 built-in watchers covering all major Laravel subsystems. Stores data in database (or configurable storage) for historical review. Development tool that can run in production with selective watchers.

## Core Concepts

- **Watchers**: 18 data collectors (Request, Query, Job, Cache, Event, Exception, Mail, Notification, Log, Dump, Gate, Redis, Schedule, Command, HttpClient, View, Model, Session)
- **Dashboard**: web UI at `/telescope` with summary, filtering, search, detail views
- **Entries**: individual records captured by watchers (request, query, exception) with metadata
- **Storage Drivers**: Database (default), Redis, or custom backends
- **Entry Tags**: automatic and manual tags for filtering (`auth:user`, `slow:true`)
- **Pruning**: `telescope:prune` command for automatic cleanup

## When to Use

- Development debugging of complex request flows
- Post-mortem analysis of failed requests or exceptions
- Queue/job debugging with detailed execution data
- API development where Debugbar's toolbar injection doesn't work
- Staging environments with selective watchers for pre-production validation

## When NOT to Use

- Production without selective watchers (full capture adds overhead and storage)
- Real-time monitoring (use Pulse for aggregate live data)
- Simple debugging needs (Debugbar provides faster in-page feedback)

## Best Practices (WHY)

- **Selective watchers in production**: enable only Exception, SlowQuery, FailedJob watchers
- **Secure `/telescope` route**: gate-based authorization — never expose without authentication
- **Schedule pruning**: `telescope:prune` prevents unbounded database growth
- **Filter health checks**: exclude health check endpoints via `Telescope::filter()` to reduce noise
- **Use tags**: add `Telescope::tag(['payment:failed'])` for organized filtering
- **Redis storage for high-traffic**: reduces database write load

## Architecture Guidelines

- All watchers in development; selective (Exception, SlowQuery, FailedJob) in production
- Storage: Database for simplicity; Redis for high-traffic; custom for compliance
- Retention: 24h default for development; 7 days staging; 1 hour production
- Access control: gate-based with authorization policy
- Never enable DumpWatcher in production

## Performance Considerations

- Full recording overhead: 10-50ms per request
- Selective recording (Exception only): <5ms
- Database write: 100 req/s = 500-1000 entries/second
- Database growth: 1-5GB with 24h retention for busy apps
- Dashboard queries: use pruning, indexing, pagination for responsiveness

## Security Considerations

- Telescope records request data including PII, passwords, API tokens
- Secure dashboard with authorization gates
- Filter sensitive data via `Telescope::filter()`
- Never expose `/telescope` without authentication
- Consider GDPR/HIPAA compliance for recorded request data

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Full recording in production | Overhead, storage, sensitive data | Performance hit, data exposure | Selective watchers only |
| Unsecured dashboard | Anyone can view app internals | Data breach | Gate-based auth |
| No pruning | Database grows unbounded | Storage exhaustion | Schedule telescope:prune |
| DumpWatcher in production | Captures debug dumps | Sensitive data capture | Dev-only watcher |
| No health check filter | Every check creates entries | Dashboard noise | Filter via Telescope::filter() |

## Anti-Patterns

- **Telescope as real-time monitor**: Pulse is better for real-time; Telescope is for historical debugging
- **Unlimited retention**: storing Telescope data forever; prune aggressively based on needs

## Examples

```php
// config/telescope.php production watchers
'watchers' => [
    RequestWatcher::class => false,
    QueryWatcher::class => ['enabled' => true, 'slow' => 100],
    ExceptionWatcher::class => true,
    JobWatcher::class => ['enabled' => true, 'failed' => true],
],
```

## Related Topics

- telescope-watchers — detailed watcher configuration
- laravel-debugbar — real-time browser-based debugging
- laravel-pulse — aggregate real-time monitoring

## AI Agent Notes

- Include Telescope in `require-dev` for new Laravel projects
- Default production config should disable all but Exception and FailedJob watchers

## Verification

- [ ] Telescope installed in `require-dev`
- [ ] Production watcher config limits to Exception/SlowQuery/FailedJob
- [ ] `/telescope` route secured
- [ ] Pruning scheduled
- [ ] Health check requests filtered
- [ ] DumpWatcher disabled in production
