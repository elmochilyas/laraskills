# Skill: Cache Event Listeners for Production

## Purpose
Generate a cached event-listener manifest (`bootstrap/cache/events.php`) to eliminate Reflection-based listener discovery overhead, saving 10-30ms per request.

## When To Use
- Applications with event-driven architecture and 50+ event-listener pairs
- Production deployments where every millisecond of bootstrap time matters
- Octane deployments where event discovery runs once per worker start

## When NOT To Use
- Applications with few events (<10 listeners) — optimization gain is negligible
- Local development — listener changes require cache rebuild
- When listeners are registered dynamically via closures or runtime conditions

## Prerequisites
- Event listeners defined in `EventServiceProvider::$listen` array (not Closures)
- `config:cache` run first (event caching may depend on resolved config)
- Event listeners use class references, not anonymous functions

## Inputs
- `app/Providers/EventServiceProvider.php` with `$listen` and `$subscribe` arrays
- Listener classes in `app/Listeners/` or package directories

## Workflow
1. Define all event-to-listener mappings in `EventServiceProvider::$listen` array using class strings
2. Run `php artisan event:clear` to remove any stale cache file
3. Run `php artisan event:cache` to generate the listener manifest
4. Run `php artisan event:list` to verify all expected listeners are registered
5. Include `event:cache` in deployment script after `optimize`
6. Document wildcard listeners (`Event::listen('event.*')`) as explicitly uncached

## Validation Checklist
- [ ] `php artisan event:cache` runs without errors
- [ ] `bootstrap/cache/events.php` exists and contains expected listener map
- [ ] `php artisan event:list` output matches expected event-to-listener mappings
- [ ] All listeners use class references, not Closures
- [ ] Wildcard listeners documented as uncached
- [ ] Event cache regenerated after any listener additions, removals, or modifications
- [ ] `event:cache` included in deployment script as separate step after `optimize`

## Common Failures
- Closure listeners not in `$listen` array — silently omitted from cache
- Stale cache after listener removal — `ClassNotFoundException` on dispatch
- Assuming `optimize` includes `event:cache` — not included in most Laravel versions
- Auto-discovery runs on every request when event cache is missing
- Wildcard listeners expected to be cached — they are inherently uncached

## Decision Points
- **$listen array vs auto-discovery**: Explicit `$listen` is always preferred for performance; auto-discovery adds Reflection overhead
- **Class listeners vs Closures**: Always use classes for cacheable listeners; Closures bypass caching entirely

## Performance Considerations
- Uncached discovery: 10-30ms for 50+ listener files with Reflection
- Cached: single `require` — ~1ms
- Cache file size: 5-50KB for medium applications
- OpCache further optimizes the cached file after first request

## Security Considerations
- Cached event listeners run with full application permissions — ensure input validation
- All cached listeners execute regardless of environment
- Third-party package listeners are cached — audit before deployment
- Stale cache may reference removed listener classes

## Related Rules
- Define event listeners in `$listen` array as classes
- Run `event:cache` explicitly after `php artisan optimize`
- Clear event cache before regenerating
- Verify listener registration after caching
- Prefer explicit `$listen` over auto-discovery
- Document wildcard listeners as uncached

## Related Skills
- Execute Optimize in Deployment Sequence
- Cache Routes for Production

## Success Criteria
- Listener discovery reduced from 10-30ms to <1ms per request
- All static listeners captured in the cached manifest
- No `ClassNotFoundException` from stale event cache after deployment
- Event cache is always regenerated during deployment when events change
