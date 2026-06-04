# Skill: Configure Laravel Telescope for Debugging

## Purpose
Install and configure Laravel Telescope for comprehensive request debugging, post-mortem analysis, and selective production observation.

## When To Use
- Development debugging of complex request flows
- Post-mortem analysis of failed requests or exceptions
- Queue/job debugging with detailed execution data
- API development where Debugbar's toolbar injection doesn't work
- Staging environments with selective watchers for pre-production validation

## When NOT To Use
- Production without selective watchers (full capture adds overhead and storage)
- Real-time monitoring (use Pulse for aggregate live data)
- Simple debugging needs (Debugbar provides faster in-page feedback)

## Prerequisites
- `laravel/telescope` installed via Composer
- Database (or Redis) for entry storage
- Telescope service provider registered

## Inputs
- `config/telescope.php` — watcher configuration
- `.env` — `TELESCOPE_ENABLED` setting
- Application code for custom watcher and filter registrations

## Workflow

1. **Install Telescope:** Run `composer require --dev laravel/telescope` for development. For production observation, use `composer require laravel/telescope`.

2. **Publish Assets:** Run `php artisan vendor:publish --provider="Laravel\Telescope\TelescopeServiceProvider"` to publish config and migrate.

3. **Run Migration:** Execute `php artisan migrate` to create Telescope entries tables.

4. **Configure Watchers:** In `config/telescope.php`, enable all watchers for development. For production, enable only ExceptionWatcher, SlowQueryWatcher, and FailedJobWatcher to limit overhead.

5. **Secure the Dashboard:** Gate-based authorization in `Telescope::auth()` callback. Never expose `/telescope` without authentication.

6. **Configure Pruning:** Schedule `php artisan telescope:prune --hours=48` to run daily. Prevents unbounded database growth.

7. **Filter Health Checks:** Use `Telescope::filter()` in `AppServiceProvider` to exclude health check endpoints and reduce noise.

8. **Add Tags:** Tag entries for organized filtering: `Telescope::tag(['payment:failed'])` in relevant code paths.

9. **Use Redis for High-Traffic:** For production with selective watchers, configure Redis storage to reduce database write load.

## Validation Checklist

- [ ] Telescope dashboard accessible at `/telescope` with authentication
- [ ] All watchers enabled and capturing data in development
- [ ] Production watchers limited to Exception, SlowQuery, FailedJob
- [ ] Health check endpoints filtered out
- [ ] Pruning scheduler configured and running
- [ ] Tags visible in dashboard filtering

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Dashboard exposed without auth | Unauthenticated access to app internals |
| Database growth unbounded | No pruning configured; table size grows |
| Performance impact in production | Too many watchers enabled; limit to critical ones |
| Health check noise | Filter not configured; dashboard cluttered |

## Decision Points

- **Telescope vs Debugbar:** Telescope for API/JSON and historical debugging; Debugbar for faster in-page feedback
- **Telescope vs Pulse:** Telescope for individual request debugging; Pulse for real-time aggregate monitoring
- **Production watchers:** Exception, SlowQuery, FailedJob only; never full capture in production

## Performance/Security Considerations

- **Telescope must be secured:** Route should only be accessible by authorized developers
- **Storage growth:** Each request creates multiple entries; database grows quickly without pruning
- **Production overhead:** Only enable essential watchers; use Redis storage for high-traffic apps

## Related Rules

- TELESCOPE-RULE-001: Selective watchers in production
- TELESCOPE-RULE-002: Secure /telescope route
- TELESCOPE-RULE-003: Schedule pruning
- TELESCOPE-RULE-004: Filter health checks
- TELESCOPE-RULE-005: Use tags
- TELESCOPE-RULE-006: Redis storage for high-traffic

## Related Skills

- Configure Telescope Watchers
- Develop Custom Pulse Cards
- Install and Configure Laravel Debugbar

## Success Criteria

- Telescope dashboard provides comprehensive debugging data during development
- Production captures only critical entries (exceptions, slow queries, failed jobs)
- Pruning prevents unbounded storage growth
- Team uses Telescope for post-mortem analysis of failed requests and queue debugging
