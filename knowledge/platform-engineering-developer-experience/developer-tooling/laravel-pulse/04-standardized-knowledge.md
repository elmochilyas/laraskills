# 04-Standardized Knowledge: Laravel Pulse

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | laravel-pulse |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | pulse-cards-custom-development, laravel-telescope, laravel-debugbar |
| **Framework/Language** | Laravel Pulse, PHP, Laravel, Livewire |

## Overview

Laravel Pulse is a real-time APM dashboard built into Laravel, providing live views of: request throughput/response times, slow queries/N+1 detection, queue throughput/failures, cache operations, HTTP client performance, and exception rates. Runs on own infrastructure (no external services). Dashboard card interface using database storage (SQLite, MySQL, PostgreSQL). Installed via Composer, accessible at `/pulse`. Supports custom cards for app-specific metrics.

## Core Concepts

- **Pulse Cards**: dashboard widgets: Servers, Application, Queues, Slow Queries, Slow Jobs, Exceptions, Cache, HTTP Clients
- **Ingester**: data collection from Laravel events (`RequestHandled`, `QueryExecuted`, `JobProcessed`)
- **Recorders**: classes extending `Record` that listen to events and record to Pulse data store
- **Dashboard**: web UI at `/pulse` with live-updating charts via Server-Sent Events (SSE)
- **Metric Aggregation**: per-minute, per-hour, per-day buckets for efficient historical queries
- **Custom Cards**: extend `Pulse\Card` for app-specific dashboard widgets

## When to Use

- Production monitoring of Laravel applications
- Real-time visibility into application health during deployments
- Quick identification of slow queries, N+1, queue backlogs
- Capacity planning via throughput/resource cards

## When NOT to Use

- Historical analysis beyond 24 hours (use Nightwatch or external APM)
- Individual request debugging (use Telescope or Debugbar)
- Extremely high-traffic apps requiring advanced APM (use Nightwatch)

## Best Practices (WHY)

- **Secure `/pulse` route**: use middleware authentication — never expose Pulse publicly
- **Run `pulse:check` scheduler**: `$schedule->command('pulse:check')->everyMinute()` prevents unbounded DB growth
- **Monitor during deployments**: keep Pulse open for 5-10min post-deploy to catch regressions
- **Start with built-in cards**: add custom cards only for business-critical metrics
- **Use SQL storage**: persists data across restarts (vs Redis which loses data)
- **Keep raw retention at 1 hour**: default balances debugging needs with storage

## Architecture Guidelines

- Secure with authorization gate — route `pulse.*` should require authentication
- Configure `config/pulse.php` for card layout, storage driver, retention
- Use separate Pulse database for high-traffic apps to isolate monitoring from application data
- Add custom cards in `config/pulse.php` `cards` array with display order

## Performance Considerations

- Collection overhead: <1ms per request (single row write per event)
- Database: 100 req/s = ~6000 entries/min; aggregation prunes efficiently
- Dashboard queries: <10ms on aggregate tables
- SSE per dashboard tab: negligible overhead
- Data store size: 50-200MB typical for busy app with 1-hour raw retention

## Security Considerations

- Pulse stores route names (may contain identifiers), query texts (may contain data)
- Secure `/pulse` with authentication — application performance data is sensitive
- Use gate-based authorization to restrict access

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Not running `pulse:check` | Raw entries accumulate | Unbounded DB growth | Add to scheduler |
| Exposing Pulse publicly | Anyone can view performance data | Data exposure | Secure with middleware |
| Too much raw retention | 24h on high-traffic apps | Gigabyte DB growth | Default 1 hour retention |
| Not monitoring during deploys | Regression unnoticed | User-facing issues | Watch Pulse post-deploy |
| No custom cards | Generic metrics only | Missed business insights | Add critical business cards |

## Anti-Patterns

- **Using Pulse for debugging**: Pulse shows aggregate data, not request details; use Telescope for debugging
- **Pulse without scheduler**: the dashboard shows no data if `pulse:check` isn't running

## Examples

```php
// config/pulse.php
return [
    'storage' => [
        'driver' => 'database',
        'database' => env('DB_CONNECTION', 'mysql'),
    ],
];
```

## Related Topics

- pulse-cards-custom-development — creating custom dashboard cards
- laravel-telescope — request-level debugging
- laravel-nightwatch — enterprise APM alternative

## AI Agent Notes

- When scaffolding Laravel projects, include Pulse setup with scheduler configuration
- Pulse is included in Laravel's skeleton by default

## Verification

- [ ] Pulse installed and accessible
- [ ] `/pulse` route secured with authentication
- [ ] `pulse:check` in scheduler
- [ ] Storage driver configured
- [ ] Cards ordered for team priorities
- [ ] Custom cards created for business metrics if needed
