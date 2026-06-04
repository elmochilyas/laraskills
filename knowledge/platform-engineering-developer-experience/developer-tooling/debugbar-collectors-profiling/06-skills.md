# Skill: Configure Debugbar Collectors for Selective Profiling

## Purpose
Enable, disable, and customize Laravel Debugbar collectors to capture relevant debugging data (queries, views, events, timing) while minimizing overhead during development.

## When To Use
- Development debugging of database queries, view data, and request lifecycle
- Performance profiling during development (query count, memory, timing)
- Custom application-specific debugging data collection through custom collectors

## When NOT To Use
- Production environments (severe security risk, performance overhead)
- API/JSON responses (corrupts response format) — use Telescope instead
- Automated CI pipelines (no browser context)
- During performance testing (adds 50-200ms overhead)

## Prerequisites
- `barryvdh/laravel-debugbar` installed via Composer
- `APP_DEBUG=true` in local `.env`
- Access to `config/debugbar.php` (published via `php artisan vendor:publish --tag=debugbar`)

## Inputs
- `config/debugbar.php` — collector configuration
- `.env` — `DEBUGBAR_ENABLED`, `APP_DEBUG` settings
- Application code for custom collector registrations

## Workflow

1. **Publish and Review Config:** Run `php artisan vendor:publish --tag=debugbar` to publish `config/debugbar.php`. Review available collectors under the `collectors` array.

2. **Enable Selective Collectors:** In dev, enable only needed collectors (QueryCollector, TimeCollector, MemoryCollector). Disable ViewCollector and EventCollector unless actively debugging those areas. Set `stack` depth to 3-5 levels to identify query source with lower overhead.

3. **Disable for API Routes:** In API middleware or dedicated API routes, call `Debugbar::disable()` to prevent response corruption on JSON/API endpoints.

4. **Configure Environment-Based Settings:** Set `DEBUGBAR_ENABLED=false` in production. On staging, use IP whitelisting via `DEBUGBAR_ALLOWED_IPS` env var to restrict access.

5. **Create Custom Collectors (When Needed):** Extend `Debugbar\DataCollector\DataCollector` for app-specific data. Register via `Debugbar::addCollector()` in a service provider.

6. **Profile Performance:** Use the TimeCollector's timer API to instrument custom code sections. Review QueryCollector for N+1 patterns and slow queries during development.

## Validation Checklist

- [ ] Debugbar visible in browser toolbar in local dev
- [ ] Query tab shows SQL with bindings and duration
- [ ] Only enabled collectors appear in the toolbar
- [ ] API routes do not include Debugbar injection
- [ ] Debugbar disabled in production (`DEBUGBAR_ENABLED=false`)
- [ ] Custom collectors display app-specific data correctly

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Debugbar visible in production | Check `APP_DEBUG` or `DEBUGBAR_ENABLED` in production env |
| API response corrupted | Debugbar injection in JSON response; disable for API routes |
| Too much overhead | Enable only needed collectors; limit stack trace depth |
| Custom collector data missing | Verify collector registration in service provider |

## Decision Points

- **Debugbar vs Telescope:** Use Debugbar for real-time in-page debugging; use Telescope for API/JSON responses and historical analysis
- **Collector selection:** Enable all in dev; selective in staging; disabled in production
- **Stack trace depth:** 3-5 levels for identification; full trace only when needed

## Performance/Security Considerations

- **Overhead:** Each active collector adds processing time; Debugbar adds 50-200ms total
- **Production:** Must never be enabled — exposes DB queries with values, session data, app internals
- **Memory:** QueryCollector with many queries increases memory usage; enable only when profiling

## Related Rules

- DBGCOL-RULE-001: Disable in production
- DBGCOL-RULE-002: Disable for API routes
- DBGCOL-RULE-003: Selective collection
- DBGCOL-RULE-004: Limit stack trace depth
- DBGCOL-RULE-005: Custom collectors extend DataCollector

## Related Skills

- Install and Configure Laravel Debugbar
- Configure Laravel Telescope
- Debug with Log Viewer Patterns

## Success Criteria

- Debugbar toolbar shows only enabled collectors with relevant data
- No Debugbar output on API endpoints or in production
- Custom collectors provide app-specific debugging data on demand
