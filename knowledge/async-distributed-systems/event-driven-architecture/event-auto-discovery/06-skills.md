# Skill: Run `event:cache` in Production for Auto-Discovery

## Purpose
Cache the event-listener mapping via `php artisan event:cache` to eliminate filesystem scanning overhead on every request and ensure consistent listener binding.

## When To Use
Every production deployment. Essential for any Laravel app using event auto-discovery (default behavior).

## When NOT To Use
Development environments where frequent listener changes make caching impractical.

## Prerequisites
- Listener classes in `app/Listeners` with `handle()` or `__invoke()` methods with type-hinted event parameters
- Deployment script with cache regeneration step

## Inputs
- Listener classes in `app/Listeners` directory
- Optional `$listen` array in `EventServiceProvider`

## Workflow
1. Run `php artisan event:cache` as part of deployment script
2. Cache generates `bootstrap/cache/events.php` with pre-computed mapping
3. Include `event:cache` after code deployment and before container/process restart
4. After adding/removing listeners: re-run `event:cache` in next deployment
5. Run `php artisan event:clear` only in local/dev for debugging
6. Verify with `php artisan event:list` to confirm cached mapping is active

## Validation Checklist
- [ ] `event:cache` in deployment script
- [ ] Cache file generated at `bootstrap/cache/events.php`
- [ ] Non-writable by web server in production
- [ ] Re-generated after any listener change
- [ ] `event:list` confirms cached mapping active
- [ ] New listeners fire after deployment with cache regeneration
- [ ] `__invoke()` listeners also discovered

## Common Failures
- Not running `event:cache` in production — 5-15ms boot time overhead per request
- Not regenerating cache after changes — new listeners silently don't fire
- Skipping `event:cache` for convenience — every request pays filesystem scanning cost
- Multiple `handle()` methods — only first discovered method binds

## Decision Points
- Standard: `event:cache` with default `app/Listeners` directory
- Custom paths: register via `withEvents()` then cache
- Disable discovery: set `$discoverEvents = []` and use `$listen` array

## Related Rules
- Rule 1: run-event-cache-in-production
- Rule 2: add-event-cache-to-deployment
- Rule 3: one-event-per-listener
- Rule 4: no-skip-event-cache-for-convenience

## Related Skills
- Configure Custom Listener Directories with `withEvents()`
- Implement `ShouldBeDiscovered` on Listeners
- Use Wildcard Event Listener Discovery

## Success Criteria
Event caching is part of every deployment, boot time overhead is eliminated, listener changes are always followed by cache regeneration, and new listeners work immediately after deploy.
