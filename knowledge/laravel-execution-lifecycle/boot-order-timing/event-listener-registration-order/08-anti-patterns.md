# ECC Anti-Patterns — Event Listener Registration Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Event Listener Registration Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Listener State Sharing
2. Events Registered in Controllers
3. Non-Deterministic Ordering via Auto-Discovery
4. Using Event::listen() Instead of $listen Array
5. Stale Event Cache After Listener Changes

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — listeners that perform database writes on event dispatch
- Premature Caching — caching event listener mappings before all listeners are registered

---

## Anti-Pattern 1: Listener State Sharing

### Category
Architecture

### Description
Two or more listeners for the same event that depend on each other's side effects or execution order to function correctly.

### Why It Happens
Developers split what should be a single logical operation into multiple listeners, each performing one step, and rely on registration order to sequence them.

### Warning Signs
- Listener A modifies shared state that Listener B reads
- Removing or reordering listeners causes business logic failures
- Comments like "must run after CalculateTax" on listeners

### Why It Is Harmful
Order-dependent listeners share implicit state, creating a fragile chain where changing one listener's order breaks another. This violates the observer pattern principle that events should broadcast to independent observers.

### Real-World Consequences
Three listeners handle `OrderPlaced`: `CalculateTax(1)`, `ApplyDiscount(2)`, `SendConfirmation(3)`. A developer adds `LogOrder(1.5)` between CalculateTax and ApplyDiscount. The new listener doesn't modify state — but `ApplyDiscount` now runs at position 3 instead of 2. No actual breakage occurs here, but the ordering fragility is introduced. Six months later, someone removes `LogOrder` and `ApplyDiscount` shifts to position 2 — silently changing behavior.

### Preferred Alternative
Design all listeners to be order-independent. If order matters, merge into a single listener that sequences operations internally.

### Refactoring Strategy
1. Identify listeners that share state or depend on order
2. Merge them into a single listener class that sequences operations
3. Or use a shared service that both listeners call, eliminating the implicit dependency

### Detection Checklist
- [ ] Two listeners for the same event modify shared state
- [ ] Listener order dependency documented in comments
- [ ] Reordering listeners breaks business logic

### Related Rules
Event Listener Registration Order Rule 2 (05-rules.md): Avoid Listener Order Dependency.

### Related Skills
Configure Event Listener Order and Registration (06-skills.md).

### Related Decision Trees
Listener Order Dependency (07-decision-trees.md).

---

## Anti-Pattern 2: Events Registered in Controllers

### Category
Framework Usage

### Description
Registering event listeners using `Event::listen()` inside controller methods or route closures rather than in a service provider's `boot()` method.

### Why It Happens
Developers need a listener to be active only for a specific request or controller action and register it inline without understanding the provider lifecycle.

### Warning Signs
- `Event::listen()` called in a controller method
- `Event::listen()` called in route closures or middleware
- Listeners that are registered multiple times (once per request)
- Same event with duplicate listeners accumulating over time

### Why It Is Harmful
Listeners registered in controllers are re-registered on every request, adding overhead and potentially creating duplicate listener entries. The `event:cache` command cannot capture them. Listener registration belongs in provider `boot()` methods where it runs once per lifecycle.

### Real-World Consequences
A controller registers `Event::listen(OrderPlaced::class, LogOrder::class)` at the start of its method. On every request to that controller (1000 req/s), the listener is re-registered. After 60 seconds, 60,000 duplicate listeners are queued for `OrderPlaced`. When a real `OrderPlaced` event fires, `LogOrder` executes 60,000 times. The database is flooded with identical log entries.

### Preferred Alternative
Register all listeners in `EventServiceProvider`'s `$listen` array or in a provider's `boot()` method. Never register listeners in controllers, middleware, or routes.

### Refactoring Strategy
1. Find all `Event::listen()` calls outside of service providers
2. Move each to the `$listen` array of `EventServiceProvider` or to a provider's `boot()`
3. Run `php artisan event:cache` to verify the new mappings

### Detection Checklist
- [ ] `Event::listen()` called in controller methods
- [ ] `Event::listen()` in route closures or middleware
- [ ] Listeners that execute multiple times per event dispatch

### Related Rules
Event Listener Registration Order (04-standardized-knowledge.md): Do not register listeners in `register()` methods — listeners should be registered in `boot()`.

### Related Skills
Configure Event Listener Order and Registration (06-skills.md).

### Related Decision Trees
Listener Registration Method (07-decision-trees.md).

---

## Anti-Pattern 3: Non-Deterministic Ordering via Auto-Discovery

### Category
Reliability

### Description
Relying on auto-discovery to register listeners without explicit `$listen` array or priority, leading to unpredictable execution order.

### Why It Happens
Developers use auto-discovery for convenience, not realizing that the order of discovered listeners is not guaranteed and depends on file system iteration order.

### Warning Signs
- No `$listen` array on `EventServiceProvider`
- Listeners discovered automatically via directory scanning
- Listener execution order changes between environments or deployments
- Tests pass in development but fail in CI due to different file system order

### Why It Is Harmful
Auto-discovered listeners are appended to the listener list after explicitly registered ones. Their order depends on file system traversal order, which is not guaranteed to be consistent across platforms, file systems, or deployments. This creates non-deterministic listener execution.

### Real-World Consequences
Two auto-discovered listeners handle `UserRegistered`: `SendWelcomeEmail` and `CheckFraud`. On the developer's Mac (APFS, alphabetical order), `CheckFraud` runs first. On the Linux production server (ext4, inode order), `SendWelcomeEmail` runs first. Fraud checks run after the welcome email is sent, allowing fraudulent registrations to receive welcome emails before being flagged.

### Preferred Alternative
Use the explicit `$listen` array on `EventServiceProvider` for all listener mappings. Reserve auto-discovery for packages that cannot modify the application's provider.

### Refactoring Strategy
1. List all events and their expected listeners
2. Populate the `$listen` array with explicit mappings in the desired order
3. Disable auto-discovery for application listeners
4. Run `php artisan event:cache` to lock in the order

### Detection Checklist
- [ ] No `$listen` array on `EventServiceProvider`
- [ ] Reliance on auto-discovery for listener registration
- [ ] Listener order varies between environments

### Related Rules
Event Listener Registration Order Rule 1 (05-rules.md): Use $listen Array for Static, Cacheable Mappings.
Event Listener Registration Order Rule 3 (05-rules.md): Use Event Caching in Production.

### Related Skills
Configure Event Listener Order and Registration (06-skills.md).

### Related Decision Trees
Listener Discovery (07-decision-trees.md).

---

## Anti-Pattern 4: Using Event::listen() Instead of $listen Array

### Category
Code Organization

### Description
Registering all event listeners programmatically via `Event::listen()` in `boot()` instead of using the declarative `$listen` array.

### Why It Happens
Developers are more familiar with `Event::listen()` from documentation examples and do not know about the `$listen` property.

### Warning Signs
- `Event::listen()` calls for every listener in `boot()`
- Empty or missing `$listen` array on `EventServiceProvider`
- `php artisan event:cache` provides no performance improvement

### Why It Is Harmful
Listeners registered via `Event::listen()` in `boot()` are not captured by `event:cache`. Without caching, every request pays 10-30ms runtime discovery overhead to build the event-to-listener map. The `$listen` array is declarative, visible at a glance, and cacheable.

### Real-World Consequences
An application registers 20 listeners via `Event::listen()` in `boot()`. `event:cache` provides no benefit — the listeners are re-registered on every request. Bootstrap time includes 15ms of listener registration overhead. After refactoring to `$listen`, caching reduces this to <1ms and eliminates runtime discovery entirely.

### Preferred Alternative
Use the `$listen` array for all static, unconditional listener mappings. Reserve `Event::listen()` for conditional registrations that depend on runtime configuration.

### Refactoring Strategy
1. Collect all `Event::listen()` calls from `boot()` methods
2. Add each mapping to the `$listen` array in the desired order
3. Remove the `Event::listen()` calls from `boot()`
4. Run `php artisan event:cache` and verify the manifest

### Detection Checklist
- [ ] `Event::listen()` used for static mappings in `boot()`
- [ ] Empty `$listen` array on `EventServiceProvider`
- [ ] No improvement from `event:cache`

### Related Rules
Event Listener Registration Order Rule 1 (05-rules.md): Use $listen Array for Static, Cacheable Mappings.

### Related Skills
Configure Event Listener Order and Registration (06-skills.md).

### Related Decision Trees
Listener Registration Method (07-decision-trees.md).

---

## Anti-Pattern 5: Stale Event Cache After Listener Changes

### Category
Maintainability

### Description
Adding, removing, or modifying event listeners without regenerating the event cache, causing the stale cache to be used in production.

### Why It Happens
Developers change listener code and forget to run `event:clear && event:cache`. The deployment pipeline does not include event cache regeneration.

### Warning Signs
- New listeners added to `$listen` but never firing
- Removed listeners still executing
- `ClassNotFoundException` for deleted listener classes
- No `event:cache` in deployment pipeline

### Why It Is Harmful
The event cache manifest hard-codes event-to-listener mappings. A stale cache after listener changes means new listeners never fire, removed listeners still execute, or the cache references deleted classes causing fatal errors.

### Real-World Consequences
A developer removes `OldListener::class` from `$listen` and deploys without running `event:clear`. The stale cache still references `OldListener`. If the class was also deleted, every event dispatch throws `ClassNotFoundException`. The application is down until someone runs `event:clear` manually.

### Preferred Alternative
Always regenerate the event cache after any listener changes. Include `event:cache` in the deployment pipeline.

### Refactoring Strategy
1. Add `php artisan event:clear && php artisan event:cache` to the deployment script
2. After every listener change locally, run the same commands
3. Verify with `php artisan event:list` that current mappings match expectations

### Detection Checklist
- [ ] New listeners added but not firing in production
- [ ] Removed listeners still executing
- [ ] `ClassNotFoundException` for deleted listener classes
- [ ] No event cache regeneration in deploy pipeline

### Related Rules
Event Listener Registration Order Rule 4 (05-rules.md): Clear Event Cache After Listener Changes.

### Related Skills
Configure Event Listener Order and Registration (06-skills.md).

### Related Decision Trees
Listener Registration Method (07-decision-trees.md).
