# Skill: Install and Configure Laravel Debugbar

## Purpose
Install, configure, and securely deploy Laravel Debugbar for development debugging with DB queries, views, events, mail, cache, logs, session data, and timing profiling.

## When To Use
- Development debugging of database queries, view data, request lifecycle
- Identifying N+1 queries and slow operations during development
- Inspecting data flow through views and events
- Quick performance profiling of individual requests

## When NOT To Use
- Production environments (security risk, performance overhead)
- JSON/API responses (corrupts response format)
- Automated testing/CI (no browser toolbar context)
- When historical/deferred debugging is needed (use Telescope instead)

## Prerequisites
- `barryvdh/laravel-debugbar` installed via Composer
- Browser with JavaScript enabled (required for toolbar rendering)
- `APP_DEBUG=true` in local `.env`

## Inputs
- `composer.json` — package dependency
- `config/debugbar.php` — published configuration
- `.env` — environment-specific settings (`DEBUGBAR_ENABLED`, `APP_DEBUG`)

## Workflow

1. **Install Package:** Run `composer require --dev barryvdh/laravel-debugbar`. Laravel automatically discovers the service provider.

2. **Publish Configuration:** Run `php artisan vendor:publish --tag=debugbar` to publish `config/debugbar.php` for customization.

3. **Configure Environment:** Ensure `APP_DEBUG=true` in local `.env`. Debugbar auto-enables when `APP_DEBUG=true`. For staging, use `DEBUGBAR_ENABLED=true` with `DEBUGBAR_ALLOWED_IPS` whitelist.

4. **Disable for Production:** Verify `APP_DEBUG=false` or explicitly set `DEBUGBAR_ENABLED=false` in production environments. Debugbar exposes DB queries with values, session data, and app internals.

5. **Disable for API Routes:** Add `Debugbar::disable()` in API middleware or route groups to prevent JSON response corruption.

6. **Review Toolbar:** In the browser, verify the Debugbar toolbar appears at the bottom of HTML pages showing configured collectors.

## Validation Checklist

- [ ] Debugbar toolbar visible in browser on local dev pages
- [ ] Query tab shows SQL queries with bindings and duration
- [ ] Route/request details display correctly
- [ ] Mail tab shows captured email previews
- [ ] All collector tabs toggle correctly
- [ ] Debugbar NOT visible in production
- [ ] API routes do not include toolbar injection

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Debugbar visible in production | Check `APP_DEBUG` env; set `DEBUGBAR_ENABLED=false` |
| Toolbar not showing | Check `APP_DEBUG=true`; verify middleware not excluded |
| API/JSON response corrupted | Disable Debugbar for API routes via middleware |
| AJAX requests not captured | Enable AJAX debugging in config |

## Decision Points

- **Debugbar vs Telescope:** Debugbar for real-time in-page feedback; Telescope for API/JSON backends and historical analysis
- **Debugbar vs Pulse:** Pulse for production real-time monitoring; Debugbar is development-only
- **IP whitelisting:** Use on staging for access control without disabling entirely

## Performance/Security Considerations

- **Never enable in production:** Exposes DB queries with values, session data, authentication state, app internals
- **Performance overhead:** Adds 50-200ms per request; avoid during performance testing
- **Storage:** Debugbar does not persist data (unlike Telescope); data is in-memory per request

## Related Rules

- DBG-RULE-001: Disable in production
- DBG-RULE-002: Disable for API routes
- DBG-RULE-003: Use IP whitelisting
- DBG-RULE-004: Avoid during performance testing

## Related Skills

- Configure Debugbar Collectors for Selective Profiling
- Configure Laravel Telescope for Debugging
- Configure Laravel Pulse for Monitoring

## Success Criteria

- Debugbar toolbar provides accurate debugging data during development
- Production environments never expose Debugbar
- API responses remain clean and uncorrupted
- Team uses Debugbar for quick feedback on queries, views, and events
