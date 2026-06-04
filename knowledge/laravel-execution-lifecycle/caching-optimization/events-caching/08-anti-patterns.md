# ECC Anti-Patterns — Events Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Events Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Dynamic Listener Registration as Default
2. Closure-Heavy Event Handling
3. Stale Cache in Production
4. Not Running event:cache After Configuration Changes
5. Mixed $listen and Auto-Discovery

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — event discovery Reflection costs on every request when uncached
- Premature Caching — caching event mappings before all listeners are finalized

---

## Anti-Pattern 1: Dynamic Listener Registration as Default

### Category
Performance

### Description
Registering most listeners via `Event::listen()` in `boot()` instead of the declarative `$listen` array, bypassing the event cache.

### Why It Happens
Developers are more familiar with `Event::listen()` syntax and don't realize it prevents caching.

### Warning Signs
- `Event::listen()` calls for every listener in `boot()`
- Empty `$listen` array on `EventServiceProvider`
- `php artisan event:cache` shows no improvement in bootstrap time

### Why It Is Harmful
Listeners registered via `Event::listen()` in `boot()` are not captured by `event:cache`. Without caching, every request pays 10-30ms runtime discovery overhead to build the event-to-listener map via Reflection.

### Real-World Consequences
An application registers 30 event listeners via `Event::listen()` in `boot()`. `event:cache` provides no benefit — the listeners are re-registered on every request. Bootstrap time includes 15ms of listener registration overhead. After refactoring to `$listen`, caching reduces this to <1ms.

### Preferred Alternative
Use the `$listen` array for all static, unconditional listener mappings. Reserve `Event::listen()` for runtime-conditional registrations.

### Refactoring Strategy
1. Collect all `Event::listen()` calls from `boot()` methods
2. Add each mapping to the `$listen` array
3. Run `php artisan event:cache` and verify the manifest
4. Measure bootstrap time before and after

### Detection Checklist
- [ ] `Event::listen()` used for static mappings
- [ ] Empty `$listen` array
- [ ] No improvement from `event:cache`

### Related Rules
Events Caching (04-standardized-knowledge.md): Use listener classes, not Closures, for cacheable events.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Closure-Heavy Event Handling

### Category
Performance

### Description
Using anonymous functions (Closures) as event listeners instead of dedicated listener classes.

### Why It Happens
Closures are convenient for quick prototyping and remain in the codebase as "temporary" solutions.

### Warning Signs
- `Event::listen(Event::class, fn() => ...)` patterns
- No dedicated listener classes for event handling
- `php artisan event:cache` throws or produces incomplete output

### Why It Is Harmful
Closure listeners cannot be serialized — `event:cache` does not capture them. They must be re-registered on every request, bypassing the caching benefit entirely.

### Real-World Consequences
An application handles 10 events via Closure listeners. `event:cache` is enabled but only captures 3 out of 13 listeners (the 3 in `$listen`). The 10 Closure listeners are re-registered on every request via `Event::listen()` in `boot()`. Bootstrap time is 12ms instead of the expected <1ms.

### Preferred Alternative
Define listeners as classes in the `$listen` array. Use `Artisan::make:listener` to generate listener classes.

### Refactoring Strategy
1. Replace each `Event::listen(Event::class, fn() => ...)` with a listener class
2. Add the mapping to `$listen` array
3. Run `php artisan event:cache` to verify

### Detection Checklist
- [ ] Closure listeners in `boot()`
- [ ] `event:cache` output doesn't match expected listeners
- [ ] Bootstrap time higher than expected with event cache enabled

### Related Rules
Events Caching (04-standardized-knowledge.md): Use listener classes, not Closures.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Stale Cache in Production

### Category
Reliability

### Description
Deploying with an events cache that doesn't match the deployed code — listeners may be missing or wrong.

### Why It Happens
Deployment scripts run `event:cache` before code changes are in place, or don't run it at all.

### Warning Signs
- New listeners never fire
- Removed listeners still execute on event dispatch
- `ClassNotFoundException` for deleted listener classes
- No `event:cache` in deployment script

### Why It Is Harmful
The event cache manifest is a snapshot. If new listeners were added to `$listen` but the cache wasn't regenerated, those listeners never fire. If a listener class was deleted but the cache still references it, every dispatch throws `ClassNotFoundException`.

### Real-World Consequences
A developer removes `OldListener::class` from `$listen` and removes the file. Deployment runs without `event:clear`. The next event dispatch attempts to instantiate the deleted listener class. `ClassNotFoundException` crashes the request.

### Preferred Alternative
Always regenerate the event cache after any listener changes. Include `event:clear && event:cache` in deployment scripts.

### Refactoring Strategy
1. Add `php artisan event:clear && php artisan event:cache` to deployment script
2. After listener changes locally, run the same commands
3. Verify with `php artisan event:list`

### Detection Checklist
- [ ] New listeners not firing in production
- [ ] Removed listeners still executing
- [ ] `ClassNotFoundException` for deleted listener classes

### Related Rules
Events Caching (04-standardized-knowledge.md): Cache after event changes.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Not Running event:cache After Configuration Changes

### Category
Reliability

### Description
Changing config values that affect event listener registration without regenerating the event cache.

### Why It Happens
Developers do not realize that `event:cache` reads configuration values at build time, and changed config may alter which listeners are registered.

### Warning Signs
- Conditional listener registration in `$listen` based on config
- Config changes that affect event registration without subsequent `event:cache`
- Listeners appearing/disappearing after config change

### Why It Is Harmful
`event:cache` bootstraps the application and collects listeners from registered event providers. If config values determine which providers are registered (via `config/app.php`), changing config without re-caching means the manifest reflects the old provider list.

### Real-World Consequences
An application registers `AnalyticsEventProvider` conditionally based on `config('services.analytics.enabled')`. A developer disables analytics in `.env` and runs `config:cache`. The event cache was not regenerated — it still includes the analytics event listeners. Analytics events continue firing despite being disabled.

### Preferred Alternative
Run `php artisan event:cache` after any configuration change that affects event listener registration.

### Refactoring Strategy
1. After `config:cache`, always run `event:cache`
2. If event registration depends on config, document this dependency
3. Verify with `php artisan event:list` that listener mappings match expectations

### Detection Checklist
- [ ] Config-dependent listener registration
- [ ] Event cache not regenerated after config change
- [ ] Listener mappings don't match current config

### Related Rules
Events Caching (04-standardized-knowledge.md): Run after config:cache.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Mixed $listen and Auto-Discovery

### Category
Reliability

### Description
Registering the same listener both via `$listen` array and via auto-discovery, causing duplicate execution on event dispatch.

### Why It Happens
Developers add listeners to `$listen` but don't disable auto-discovery, or auto-discovery picks up listeners that are also in `$listen`.

### Warning Signs
- Listeners executing twice for a single event dispatch
- Side effects in listeners happening twice
- `event:list` output shows duplicate entries for the same event

### Why It Is Harmful
Auto-discovery scans `app/Listeners/` and mirrors listeners registered in `$listen`. If a listener is in both, it registers twice. On each event dispatch, the listener executes twice — duplicating side effects, doubling database writes, and sending duplicate emails.

### Real-World Consequences
A `SendWelcomeEmail` listener is in `$listen` for `UserRegistered`. Auto-discovery also finds it in `app/Listeners/`. Every user registration sends TWO welcome emails. Users complain about spam. Marketing is blamed.

### Preferred Alternative
Use either explicit `$listen` or auto-discovery, not both. Disable auto-discovery if using `$listen`.

### Refactoring Strategy
1. Check `php artisan event:list` for duplicate listener entries
2. Remove listeners from `$listen` if auto-discovery is active
3. Or disable auto-discovery in `EventServiceProvider` if using `$listen`
4. Run `php artisan event:cache` to lock in the single registration

### Detection Checklist
- [ ] Listener executes twice per event dispatch
- [ ] Duplicate entries in `event:list` output
- [ ] Both `$listen` and auto-discovery active

### Related Rules
Events Caching (04-standardized-knowledge.md): Use explicit $listen to avoid auto-discovery overhead.

### Related Skills
N/A

### Related Decision Trees
N/A
