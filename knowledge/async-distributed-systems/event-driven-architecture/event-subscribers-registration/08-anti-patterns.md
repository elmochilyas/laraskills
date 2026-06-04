---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K027 — Event Subscribers and Manual Registration
Knowledge ID: K027
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Subscriber in `$listen` Array Instead of `$subscribe` | Configuration | High |
| 2 | Giant Subscriber Handling 15+ Unrelated Events | Design | Medium |
| 3 | Private Handler Methods in Subscribers | Implementation | High |
| 4 | Conditional Subscription Based on Runtime State | Architecture | Medium |
| 5 | Not Regenerating Cache After Subscriber Changes | Operational | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Registration Confusion (`$listen` vs `$subscribe`) | High — wrong array silently disables all subscriber handlers | Add static analysis rule to detect subscriber classes in `$listen` |
| Subscriber Explosion (one subscriber per event) | Medium — negates the grouping purpose of subscribers | Use individual listeners for trivial one-to-one mappings |
| Cache Blindness After Subscriber Changes | Critical — subscriber handlers disabled until cache regenerated | Enforce `event:cache` in deployment pipeline |

---

## 1. Subscriber in `$listen` Array Instead of `$subscribe`

### Category
Configuration

### Description
Registering an event subscriber class in the `EventServiceProvider::$listen` array instead of the `$subscribe` array. The dispatcher treats `$listen` entries as direct listener classes, calling `handle()` or `__invoke()` instead of the `subscribe()` method.

### Why It Happens
- Developer confuses the purpose of `$listen` and `$subscribe` arrays
- Similar syntax between listener and subscriber registration
- Documentation examples that show both arrays can be confused
- Copy-paste error when refactoring from listeners to subscribers

### Warning Signs
- Subscriber class placed in `protected $listen = [Subscriber::class]`
- `subscribe()` method is never called
- Event handler methods in subscriber don't fire
- No error — the dispatcher instantiates the subscriber as a listener silently

### Why Harmful
- The subscriber's `subscribe()` method is never called
- All handlers registered via `$events->listen()` inside `subscribe()` are lost
- Complete silent failure — no error, no warning, no log
- Debugging is confusing: the subscriber class exists and is registered, but handlers don't fire

### Consequences
- All events the subscriber was supposed to handle are silently unhandled
- Hours of debugging trying to figure out why "the subscriber doesn't work"
- Developers may add workarounds that further confuse the registration
- Production incidents from unhandled events

### Alternative
Always register subscribers in the `$subscribe` array:
```php
protected $subscribe = [
    OrderEventSubscriber::class,
];
```

### Refactoring Strategy
1. Move subscriber class from `$listen` to `$subscribe` array
2. Remove any event→subscriber mapping in `$listen`
3. Run `php artisan event:cache`
4. Verify with `php artisan event:list` that subscriber handlers are registered
5. Test each handler fires on event dispatch

### Detection Checklist
- [ ] All subscriber classes are in `$subscribe`, never in `$listen`
- [ ] `php artisan event:list` shows subscriber-registered handlers
- [ ] No duplicate registration (subscriber in both arrays)
- [ ] Static analysis rule prevents subscriber-in-`$listen`
- [ ] Tests confirm each subscriber handler fires

### Related Rules
- subscribers-in-subscribe-array

### Related Skills
- Register Event Subscribers via `$subscribe` Array

### Related Decision Trees
- Event Subscriber vs Individual Listener Classes

---

## 2. Giant Subscriber Handling 15+ Unrelated Events

### Category
Design

### Description
A single subscriber class handling events from multiple, unrelated domains (e.g., orders, users, inventory, billing) with 15+ handler methods. This violates the cohesion principle of subscribers and creates a maintenance bottleneck.

### Why It Happens
- Developer wants "one place to see all event handling"
- Organic growth — subscriber starts with 3-4 related events and accretes more over time
- Misunderstanding that subscribers are for domain grouping, not global event hubs
- Convenience — adding one more handler to an existing subscriber is easier than creating a new one

### Warning Signs
- Subscriber name is generic (e.g., `AllEventsSubscriber`, `GlobalEventHandler`)
- Subscriber handles events from 3+ different domains
- More than 7-10 handler methods in a single subscriber
- Handler methods reference different model types, services, and repositories
- Single test file for the subscriber exceeds 300 lines

### Why Harmful
- Violates Single Responsibility Principle — subscriber touches multiple domains
- Any change to the subscriber risks breaking unrelated event handling paths
- Testing becomes complex (mocking multiple domains)
- New developers cannot understand the event flow from the subscriber alone
- Refactoring is risky — extracting handlers requires touching a central class

### Consequences
- Increased bug rate from cross-domain changes
- Merge conflicts from multiple developers editing the same subscriber
- Code review fatigue — reviewers must understand all domains in one class
- Event flow is obscured — "which subscriber handles what?" becomes unclear

### Alternative
- One subscriber per bounded context (e.g., `OrderEventSubscriber`, `PaymentEventSubscriber`)
- Individual listeners for events that don't fit a domain group
- Infrastructure subscribers (logging, metrics) are the only acceptable cross-domain exception

### Refactoring Strategy
1. List all events handled by the subscriber, grouped by domain
2. Create one subscriber per domain group
3. Copy relevant handler methods to each new subscriber
4. Remove handlers from original subscriber
5. Register new subscribers in `$subscribe` array
6. Run `php artisan event:cache`
7. Test each domain subscriber independently
8. Delete original subscriber once all handlers are migrated

### Detection Checklist
- [ ] Subscriber handler methods cover only one domain
- [ ] Fewer than 7-10 handler methods per subscriber
- [ ] Subscriber name matches domain (e.g., `OrderSubscriber`, not `AllEventsSubscriber`)
- [ ] No cross-model/service dependencies within subscriber
- [ ] Test file scope matches single domain

### Related Rules
- keep-subscribers-domain-focused

### Related Skills
- Register Event Subscribers via `$subscribe` Array

### Related Decision Trees
- Event Subscriber vs Individual Listener Classes

---

## 3. Private Handler Methods in Subscribers

### Category
Implementation

### Description
Declaring subscriber handler methods as `private` or `protected`. The dispatcher calls handler methods using PHP's `callable` type — only `public` methods are accessible this way.

### Why It Happens
- Default visibility in PHP is `public`, but developers may change it for "encapsulation"
- Misunderstanding that the dispatcher uses reflection (which can access private methods)
- Copying patterns from other frameworks where private event handlers are allowed
- IDE auto-generates methods with wrong visibility

### Warning Signs
- Subscriber handler methods marked `private` or `protected`
- PHP "Callable" error when event is dispatched
- Handler silently fails with no error in production (if error reporting is suppressed)
- Developer adds `@throws` annotations instead of fixing visibility

### Why Harmful
- PHP throws a "Callable" error when the dispatcher tries to invoke the private method
- In production with debug disabled, this may result in a silent 500 or unhandled event
- No log entry indicating the subscriber failed — just a missing response
- The `subscribe()` method runs fine — only the handler invocation fails

### Consequences
- Production incidents from unhandled events
- Confusing error traces that point to dispatcher internals
- Developer time wasted debugging callable resolution
- Workarounds like wrapping in closures (which works but is unnecessary)

### Alternative
Always make subscriber handler methods `public`:
```php
public function onOrderShipped(OrderShipped $event): void
{
    // handler logic
}
```

### Refactoring Strategy
1. Identify all non-public handler methods in subscriber classes
2. Change visibility from `private`/`protected` to `public`
3. Run `php artisan event:cache`
4. Test each handler fires on event dispatch
5. Consider adding coding standard rule (`SlevomatCodingStandard.Classes.RequirePublicProperty`) for handler methods

### Detection Checklist
- [ ] All subscriber handler methods are `public`
- [ ] No `private` or `protected` handler methods in any subscriber
- [ ] PHPStan/PsychoCS rule enforces public visibility for handler methods
- [ ] Tests confirm handlers can be called as callables
- [ ] Event dispatch tests pass without callable errors

### Related Rules
- subscriber-handlers-public

### Related Skills
- Register Event Subscribers via `$subscribe` Array

### Related Decision Trees
- Event Subscriber vs Individual Listener Classes

---

## 4. Conditional Subscription Based on Runtime State

### Category
Architecture

### Description
Using runtime state (e.g., database values, request data, user session) inside the `subscribe()` method to conditionally register handlers. The `subscribe()` method is called at boot time — runtime state may change by the time events fire.

### Why It Happens
- Developer wants dynamic event handling based on application state
- Misunderstanding that `subscribe()` is called at boot, not at dispatch time
- Pattern copied from other frameworks where subscription is evaluated per-event
- Convenience of centralizing conditional logic in one place

### Warning Signs
- `subscribe()` method reads from database or session
- `subscribe()` method checks `request()` helper or `auth()->user()`
- Conditional `$events->listen()` calls that depend on runtime data
- Confusing behavior — handler fires sometimes but not others, depending on timing

### Why Harmful
- The condition is evaluated once at boot — subsequent state changes are ignored
- In long-running processes (queue workers), the boot-time condition is stale
- Handler registration is permanent for the lifecycle of the request/worker
- Testing is difficult — must control boot-time state

### Consequences
- Handlers don't fire when expected (state changed after boot)
- Handlers fire when not expected (state at boot was different than at dispatch)
- Non-deterministic behavior that's hard to reproduce
- Long-running workers use stale conditions for hours

### Alternative
- Always register all handlers; put conditional logic inside the handler method
- Use listener-level checks: `if ($this->shouldHandle($event)) { ... }`
- For configuration-based conditions, use config files (boot-time constant, not runtime state)

### Refactoring Strategy
1. Identify all runtime state checks inside `subscribe()` methods
2. Move conditional logic from `subscribe()` into each handler method
3. Replace `subscribe()` condition with unconditional `$events->listen()` calls
4. Add `shouldHandle()` method to subscriber for clarity
5. Run `php artisan event:cache`
6. Test with varying runtime conditions

### Detection Checklist
- [ ] `subscribe()` doesn't read from database, session, or request
- [ ] All conditional logic is inside handler methods, not `subscribe()`
- [ ] No `auth()`, `request()`, `DB::` calls in `subscribe()`
- [ ] Handler behavior adapts to runtime state, not boot-time snapshot
- [ ] Tests verify handler behavior under different states

### Related Rules
- subscribers-in-subscribe-array

### Related Skills
- Register Event Subscribers via `$subscribe` Array

### Related Decision Trees
- Event Subscriber vs Individual Listener Classes

---

## 5. Not Regenerating Cache After Subscriber Changes

### Category
Operational

### Description
Adding, modifying, or removing a subscriber without re-running `php artisan event:cache`. The cached event mapping remains stale — subscriber handlers are compiled into the cache and won't reflect changes until the cache is rebuilt.

### Why It Happens
- Developer assumes auto-discovery applies to subscribers (it applies to listeners, but subscriber mappings are also cached)
- Deployment pipeline lacks cache regeneration step
- Team unaware that `event:cache` includes subscriber-registered mappings
- Local development environment uses uncached mode, so the issue only appears in production

### Warning Signs
- New subscriber deployed but handlers don't fire
- `php artisan event:list` shows old mapping without subscriber handlers
- Cache file timestamp predates subscriber change
- QA reports: "works locally, not in staging"

### Why Harmful
- Subscriber handlers are completely invisible to the cached dispatcher
- No error or warning — cache just doesn't include the new handlers
- Features depending on subscriber event handling silently fail
- Debugging is confusing: subscriber class exists and is registered, but nothing happens

### Consequences
- Production incidents from missing event handling
- Rolled-back deployments that were actually correct
- Developer time wasted investigating queue/database/network issues
- Trust erosion in deployment process

### Alternative
- Run `php artisan event:cache` after any subscriber change
- Include cache regeneration in CI/CD deployment pipeline
- Verify with `php artisan event:list` after deployment
- Add post-deploy smoke test for subscriber handlers

### Refactoring Strategy
1. Add `php artisan event:cache` to deployment script (after code deploy)
2. Include subscriber change detection in deployment checks
3. Verify `event:list` output includes subscriber handlers post-deploy
4. Add CI/CD rule: fail if cache not regenerated when subscribers change
5. Consider `event:cache` in pre-commit hook for subscriber changes

### Detection Checklist
- [ ] Deployment script includes `event:cache`
- [ ] `event:list` shows subscriber-registered handlers post-deploy
- [ ] Cache file timestamp matches deploy timestamp
- [ ] Post-deploy smoke test verifies subscriber handler execution
- [ ] CI/CD pipeline errors if subscriber changes without cache regeneration

### Related Rules
- recache-after-subscriber-change
- add-event-cache-to-deployment

### Related Skills
- Register Event Subscribers via `$subscribe` Array

### Related Decision Trees
- Event Subscriber vs Individual Listener Classes
