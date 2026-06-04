# Skill: Configure Laravel Pulse for Production Monitoring

## Purpose
Install and configure Laravel Pulse for real-time production monitoring of request throughput, slow queries, queue health, cache operations, HTTP client performance, and exception rates using the built-in dashboard.

## When To Use
- Production monitoring of Laravel applications
- Real-time visibility into application health during deployments
- Quick identification of slow queries, N+1, queue backlogs
- Capacity planning via throughput/resource cards

## When NOT To Use
- Historical analysis beyond 24 hours (use Nightwatch or external APM)
- Individual request debugging (use Telescope or Debugbar)
- Extremely high-traffic apps requiring advanced APM (use Nightwatch)

## Prerequisites
- Laravel application on Laravel 11+
- Composer access
- Database (SQLite, MySQL, or PostgreSQL) for Pulse data storage

## Inputs
- `composer.json` — Pulse package requirement
- `config/pulse.php` — published configuration
- `.env` — Pulse storage configuration

## Workflow

1. **Install Pulse:** Run `composer require laravel/pulse` followed by `php artisan vendor:publish --provider="Laravel\Pulse\PulseServiceProvider"` to publish config and migration.

2. **Run Migration:** Execute `php artisan migrate` to create Pulse data tables.

3. **Configure Authentication:** Secure the `/pulse` route using middleware. Typically restrict to admin users via Pulse's built-in authentication callback in `config/pulse.php`.

4. **Set Up Scheduler:** Add `$schedule->command('pulse:check')->everyMinute()` to `routes/console.php`. This prunes old data and prevents unbounded database growth.

5. **Choose Storage Driver:** Use SQL storage (default) for persistence across restarts. Configure retention settings: keep raw data for 1 hour, hourlies for 2 weeks.

6. **Configure Recorders:** In `config/pulse.php`, enable relevant recorders: Servers, Application, Queues, Slow Queries, Slow Jobs, Exceptions, Cache, HTTP Clients.

7. **Review Dashboard:** Access `/pulse` (protected route) and verify real-time data visualization for each enabled card.

## Validation Checklist

- [ ] Pulse installed and migrated
- [ ] `/pulse` route accessible only by authorized users
- [ ] `pulse:check` scheduler command active
- [ ] Built-in cards show live data (servers, queries, queues, exceptions)
- [ ] SQL storage configured for persistence
- [ ] Raw retention set to 1 hour default

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Scheduler not running | Data not pruned; unbounded DB growth |
| Pulse route exposed | Unauthenticated access to app metrics |
| No data appearing | Recorders not configured; scheduler not running |

## Decision Points

- **Pulse vs Nightwatch:** Pulse for self-hosted real-time monitoring; Nightwatch for long-term APM with trends
- **Pulse vs Telescope:** Pulse for aggregate production monitoring; Telescope for individual request debugging
- **Storage driver:** SQL for persistence; Redis loses data on restart

## Performance/Security Considerations

- **Pulse route must be secured:** Authenticate via middleware; never expose publicly
- **Storage growth:** Scheduler prunes old data; monitor table size in high-traffic apps
- **Overhead:** Minimal; recorders aggregate data efficiently with per-minute bucketing

## Related Rules

- PULSE-RULE-001: Secure /pulse route
- PULSE-RULE-002: Run pulse:check scheduler
- PULSE-RULE-003: Monitor during deployments
- PULSE-RULE-005: Use SQL storage
- PULSE-RULE-006: Keep raw retention at 1 hour

## Related Skills

- Develop Custom Pulse Cards
- Integrate Laravel Nightwatch for Production APM
- Configure Laravel Telescope for Debugging

## Success Criteria

- Pulse dashboard shows real-time production metrics for servers, queries, queues, and exceptions
- Route is secured and only accessible by authorized team members
- Data is pruned automatically preventing storage exhaustion
- Team uses Pulse during deployments to catch regressions within minutes
