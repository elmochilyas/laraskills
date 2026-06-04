# Skill: Configure Event Listener Order and Registration

## Purpose
Register event listeners in the correct order using the `$listen` array, `Event::listen()`, subscribers, and priority — ensuring deterministic execution order while leveraging event caching.

## When To Use
- Registering listeners for application or package events
- Setting up `EventServiceProvider` with static listener mappings
- Adding listeners that must execute in a specific order relative to other listeners
- Configuring event caching for production performance

## When NOT To Use
- For listeners that are order-independent — registration order does not matter
- For listener logic that should be merged into a single handler when order dependencies exist
- For runtime-dynamic listeners that cannot be expressed in the `$listen` array
- In `register()` methods — listeners should be registered in `boot()`

## Prerequisites
- Understanding that listeners execute in registration order (at the same priority level)
- Knowledge of the `$listen` array, `$subscribe` property, and `Event::listen()` priority parameter
- Familiarity with the event caching mechanism (`event:cache`)

## Inputs
- Current `EventServiceProvider` configuration
- List of events and their listeners
- Ordering requirements (which listeners must run first/last)

## Workflow
1. Declare all static event-to-listener mappings in the `$listen` array on `EventServiceProvider`
2. Order listeners within each event's array by intended execution order (first = runs first at same priority)
3. Use `$subscribe` for subscriber classes that group multiple related event-handler mappings
4. For conditional or runtime-dependent listener registration, use `Event::listen()` in `boot()`
5. Set `$priority` on `Event::listen()` only when listeners from different providers must be ordered (higher = runs first)
6. Run `php artisan event:cache` for production — this caches all `$listen` mappings
7. Run `php artisan event:clear && php artisan event:cache` after any listener changes
8. Verify listener order with `php artisan event:list`

## Validation Checklist
- [ ] All static listeners use the declarative `$listen` array (not `Event::listen()` in `boot()`)
- [ ] Listeners within each event array are ordered by intended execution order
- [ ] Subscribers are used for groups of related listeners
- [ ] Priority is used sparingly and documented
- [ ] `event:cache` is part of the production deployment pipeline
- [ ] Event cache is regenerated after every listener change
- [ ] No listener is registered twice (via both `$listen` and auto-discovery)
- [ ] No listener order dependencies exist between independent listeners

## Common Failures
- Using `Event::listen()` in `boot()` instead of `$listen` array — listeners are not captured by `event:cache`, adding 10-30ms runtime discovery overhead
- Priority confusion — higher priority number runs first (not last), which is counterintuitive
- Duplicate listeners — listener registered via both `$listen` and auto-discovery executes twice per event dispatch
- Package listeners always run after application listeners at the same priority — relying on implicit ordering is fragile
- Stale event cache after listener changes — new listeners never fire; old ones still execute

## Decision Points
- Use `$subscribe` for related listeners grouped by feature (e.g., `BillingEventSubscriber` handles all billing events)
- Use `Event::listen()` with priority when a package listener must run before or after application listeners without modifying the `$listen` array
- If listener A must always run before listener B and they are in different providers, set priority explicitly and document it
- If listeners are order-dependent, consider merging them into a single listener that sequences operations internally

## Performance Considerations
- Auto-discovery adds 10-30ms to bootstrap by reflecting on listener `handle()` methods — cache or use explicit `$listen`
- Event caching reduces listener registration to a single `require` of the manifest file (~1ms)
- Each listener callback adds ~1-5µs dispatch overhead — 50 listeners per event = ~250µs
- Wildcard listeners (`Event::listen('event.*', ...)`) are slower — the dispatcher must match against patterns

## Security Considerations
- Listeners may receive sensitive event data — ensure listeners that log or transmit data have proper permission checks
- Event caching serializes listener class names — ensure listener classes exist after deployment (cache invalidation)
- Do not register listeners that execute destructive operations before validation listeners
- Package listeners registered via auto-discovery may process sensitive events — audit package listeners

## Related Rules
- Event Listener Registration Order Rule 1: Use $listen Array for Static, Cacheable Mappings
- Event Listener Registration Order Rule 2: Avoid Listener Order Dependency
- Event Listener Registration Order Rule 5: Use Explicit Priority Only When Semantically Required

## Related Skills
- Order Routes Correctly for First-Match Routing (ku-07-route-registration-order)
- Order Middleware for Correct Request Processing (ku-06-middleware-registration-order)
- Defer Service Providers Safely (ku-03-deferred-providers)

## Success Criteria
- All static listeners are declared in the `$listen` array
- `php artisan event:cache` succeeds and lists all expected mappings
- Listeners execute in the intended order at the same priority level
- No listener is registered twice or silently skipped
- Event cache is regenerated after every listener change in deployment
