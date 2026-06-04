# Skill: Register Event Subscribers via `$subscribe` Array

## Purpose
Create event subscriber classes that group multiple related event handlers in a single `subscribe()` method, registered via `EventServiceProvider::$subscribe`.

## When To Use
Grouping related event handlers for a bounded context (e.g., `OrderSubscriber`); conditional subscription based on configuration; subscribers with shared dependency injection.

## When NOT To Use
Simple one-to-one event→listener mapping (use `$listen` or auto-discovery instead); subscriber handling >7 events (split by domain); package listeners that should be individually overridable.

## Prerequisites
- Subscriber class with `subscribe(Dispatcher $events)` method
- `EventServiceProvider` access

## Inputs
- Event-to-handler mappings to group
- Public handler methods for each event

## Workflow
1. Create subscriber class with `subscribe(Dispatcher $events): void` method
2. Register handlers: `$events->listen(OrderShipped::class, [$this, 'onOrderShipped'])`
3. Make all handler methods `public`
4. Register subscriber in `EventServiceProvider::$subscribe` array — NOT `$listen`
5. Run `event:cache` after adding or modifying subscriber
6. Keep subscriber focused on one domain
7. Use closures inside `subscribe()` if handler doesn't need separate method

## Validation Checklist
- [ ] Subscriber in `$subscribe` array, not `$listen`
- [ ] All handler methods `public`
- [ ] `event:cache` run after subscriber change
- [ ] Subscriber focused on one domain
- [ ] No duplicate registration (subscriber + auto-discovery)
- [ ] `subscribe()` method signature correct: `subscribe(Dispatcher $events): void`
- [ ] Handler methods fire for their respective events

## Common Failures
- Subscriber in `$listen` array — `subscribe()` never called
- Private handler methods — PHP callable error
- Not caching after subscriber change — handlers don't fire
- Duplicate registration — same handler in subscriber and auto-discovery

## Decision Points
- Domain grouping: one subscriber per bounded context
- Conditional registration: evaluate inside `subscribe()`
- Selective queueing: dispatch queued job inside handler

## Related Rules
- Rule 1: subscribers-in-subscribe-array
- Rule 2: subscriber-handlers-public
- Rule 3: recache-after-subscriber-change
- Rule 4: keep-subscribers-domain-focused

## Related Skills
- Run `event:cache` in Production for Auto-Discovery
- Implement `ShouldBeDiscovered` on Listeners
- Use Wildcard Event Listener Discovery

## Success Criteria
Subscribers are registered correctly via `$subscribe`, handler methods are public and fire on dispatch, `event:cache` includes subscriber mappings, and each subscriber handles a single domain.
