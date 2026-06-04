---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K025 — Event Auto-Discovery via Directory Scanning
Knowledge ID: K025
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Skipping `event:cache` in Production for "Convenience" | Performance | High |
| 2 | Giant Listener Handling Multiple Events | Design | Medium |
| 3 | Using Auto-Discovery for Package Listeners | Architecture | High |
| 4 | Not Regenerating Cache After Listener Changes | Operational | High |
| 5 | Listeners Outside `app/Listeners` Without Configuration | Configuration | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Magical Registration (hidden dependencies) | High — auto-discovery registers all found listeners without explicit approval | Use `ShouldBeDiscovered` or `event:list` to audit active listeners |
| Caching Blindness (deploying without cache regeneration) | Critical — new listeners silently disabled after deploy | Enforce `event:cache` in CI/CD pipeline |
| Discovery Overhead in Hot Paths | Medium — filesystem scanning on every request/worker boot | Cache in production, audit with boot time metrics |

---

## 1. Skipping `event:cache` in Production for "Convenience"

### Category
Performance

### Description
Relying on uncached auto-discovery in production under the assumption that filesystem scanning overhead is negligible. The developer skips `php artisan event:cache` in the deployment pipeline because "auto-discovery works fine without it."

### Why It Happens
- Developers test locally without caching and don't notice the 5-15ms overhead
- Deployment scripts are copied from development setups that omit caching
- Misunderstanding that OPcache alone eliminates filesystem I/O
- Belief that filesystem scanning is "fast enough" without measuring

### Warning Signs
- Boot time degradation of 5-15ms per request in production
- `bootstrap/cache/events.php` missing from production server
- Deployment pipeline lacks `event:cache` step
- `php artisan event:list` shows "discovered" instead of "cached" in production

### Why Harmful
- Every request pays 5-15ms filesystem scanning overhead
- At 1000 req/s, this is 5-15 seconds of CPU per second wasted on file I/O
- Scaling horizontally multiplies the waste across all servers
- The overhead is invisible until measured — most teams don't notice until traffic grows

### Consequences
- Unnecessary CPU consumption under load
- Reduced request throughput per server
- Higher infrastructure costs for same traffic volume
- Harder to debug performance issues (overhead is attributed to other causes)

### Alternative
- Always run `php artisan event:cache` in production deployment
- Include cache step after code deploy and before container restart
- Verify cache with `php artisan event:list` confirming "cached" status

### Refactoring Strategy
1. Add `php artisan event:cache` to deployment script (after code deploy, before restart)
2. Verify cache file exists at `bootstrap/cache/events.php`
3. Confirm `php artisan event:list` shows cached mapping
4. Monitor boot time reduction (expect <1ms after caching)
5. Set cache file permissions to read-only for web server

### Detection Checklist
- [ ] `bootstrap/cache/events.php` exists in production
- [ ] Deployment script includes `event:cache` step
- [ ] `event:list` output shows cached mapping (not "discovered")
- [ ] Boot time profiling confirms <1ms event discovery
- [ ] CI/CD pipeline enforces cache generation

### Related Rules
- run-event-cache-in-production
- add-event-cache-to-deployment

### Related Skills
- Run `event:cache` in Production for Auto-Discovery

### Related Decision Trees
- event:cache vs Uncached Discovery

---

## 2. Giant Listener Handling Multiple Events

### Category
Design

### Description
A single listener class contains multiple `handle()` methods or a single `handle()` method that tries to process different event types based on runtime checks. This violates the auto-discovery contract where one listener maps to exactly one event.

### Why It Happens
- Developer wants to reduce the number of listener classes
- Misunderstanding that auto-discovery maps method signatures, not class names
- Copy-paste from event subscriber patterns where one class handles multiple events
- Belief that "related" event handling should live in the same class

### Warning Signs
- Listener class with multiple `handle()` methods (only first is discovered)
- Listener with `handle($event)` that type-checks with `instanceof`
- Listener name implies multiple responsibilities (e.g., `OrderAndPaymentListener`)
- Class exceeds 200 lines with unrelated event handling logic

### Why Harmful
- Only one event mapping is registered (first discovered `handle()` or `__invoke()`)
- Other events silently go unhandled — no error or warning
- Violates Single Responsibility Principle
- Harder to test individual event handling paths
- Makes the listener undiscoverable — its method is too long to map cleanly

### Consequences
- Unhandled events in production
- Debugging nightmares — event is dispatched but nothing happens
- Code review misses silent failure (no error raised)
- Wasted time investigating why "the handler doesn't fire"

### Alternative
- One listener class per event with single `handle(EventType $event)` method
- Use event subscribers for intentional multi-event handling
- Name listeners after the single event they handle (e.g., `SendShipmentNotification`, not `OrderListener`)

### Refactoring Strategy
1. Identify all events the listener is supposed to handle
2. Create one listener class per event (e.g., `OrderShippedHandler`, `OrderPaidHandler`)
3. Move each `handle()` method to its respective class
4. Remove duplicate `handle()` methods from original class
5. Register new listeners (auto-discovery picks them up from `app/Listeners/`)
6. Verify each handler fires independently
7. Delete original multi-handle class

### Detection Checklist
- [ ] No listener class has multiple `handle()` or both `handle()` and `__invoke()`
- [ ] No `instanceof` checks inside `handle()` method
- [ ] Listener class name singular (one event)
- [ ] `event:list` shows one event per listener
- [ ] Coverage tests confirm each event handler fires independently

### Related Rules
- one-event-per-listener

### Related Skills
- Run `event:cache` in Production for Auto-Discovery

### Related Decision Trees
- Auto-Discovery vs Manual Registration

---

## 3. Using Auto-Discovery for Package Listeners

### Category
Architecture

### Description
Package developers rely on auto-discovery to register listeners in consuming applications, placing listener classes in the package's `src/Listeners` directory expecting them to be auto-discovered.

### Why It Happens
- Auto-discovery is the default Laravel pattern, so package authors assume it works
- Lack of awareness that discovery only scans `app/Listeners` (application directory)
- Desire to reduce boilerplate documentation for manual registration steps
- Copying patterns from application development into package development

### Warning Signs
- Package README instructs users to "just place this in `app/Listeners`"
- Package has no service provider for event registration
- Package listeners are never triggered in consuming apps
- Issues reported: "the event listener doesn't work after installing package"

### Why Harmful
- Creates hidden dependency on the app's directory structure
- Package listeners silently don't work without user action
- Violates package encapsulation — listeners should be self-registering
- Users must manually modify `app/Listeners` to use package features
- Complicates updates — users forget to update manually placed listeners

### Consequences
- Package features relying on listeners appear broken
- Increased support burden for package maintainers
- Users create workarounds that may conflict with updates
- Package cannot guarantee its event handling works out of the box

### Alternative
- Register listeners via package service provider's `boot()` method
- Use `$this->app['events']->listen(Event::class, Listener::class)` in provider
- Document manual registration for users who want explicit control
- Provide artisan command to auto-register if needed

### Refactoring Strategy
1. Create or update package service provider
2. Move listener registrations from `app/Listeners` dependency to provider's `boot()`
3. Use `$dispatcher->listen()` or `Event::listen()` in provider
4. Remove instructions asking users to copy files to `app/Listeners`
5. Test package in fresh Laravel installation without manual steps

### Detection Checklist
- [ ] Package has service provider for event registration
- [ ] No `app/Listeners` path dependency in package code
- [ ] Package listeners work in fresh installation without manual steps
- [ ] README documents registration, not file-copy steps
- [ ] Package tests verify listener fires on event dispatch

### Related Rules
- run-event-cache-in-production

### Related Skills
- Run `event:cache` in Production for Auto-Discovery

### Related Decision Trees
- Auto-Discovery vs Manual Registration

---

## 4. Not Regenerating Cache After Listener Changes

### Category
Operational

### Description
Adding or modifying listeners in `app/Listeners` without re-running `php artisan event:cache`. The cached mapping remains stale, and new/updated listeners never fire.

### Why It Happens
- Developer adds a listener and assumes auto-discovery works without cache
- Deployment pipeline lacks automation for cache regeneration on listener changes
- Team is unaware that `event:cache` pre-compiles the mapping
- Developer environment uses uncached discovery, so the issue only appears in production

### Warning Signs
- New listener is merged and deployed but events remain unhandled
- `php artisan event:list` shows old mapping without new listener
- QA reports: "feature works locally but not in staging/production"
- `bootstrap/cache/events.php` timestamp predates the deploy

### Why Harmful
- New features depending on event handling silently fail
- No error or warning — event dispatches successfully, but handler never runs
- Debugging is confusing: the listener class exists, the event is dispatched, but no response
- Time wasted investigating queue, database, or network issues when the root cause is stale cache

### Consequences
- Production incidents from unhandled events
- Rollback of features that are actually implemented correctly
- Developer frustration from non-deterministic behavior
- Trust erosion in the deployment process

### Alternative
- Always run `event:cache` as part of deployment pipeline
- Include cache regeneration in your CI/CD script
- Run `event:cache` after any change that adds/modifies listeners
- Monitor cache file timestamp vs deploy timestamp

### Refactoring Strategy
1. Add `php artisan event:cache` to deployment script (after `git pull`/code deploy)
2. Set up CI/CD check: verify `event:list` matches expected listeners
3. Add post-deploy smoke test: dispatch test event and verify handler fires
4. Consider `event:cache` in pre-commit hook for local development
5. Document cache regeneration in deployment runbook

### Detection Checklist
- [ ] Deployment script includes `event:cache`
- [ ] `event:list` output matches expected listener count
- [ ] Cache file timestamp matches deploy timestamp
- [ ] Post-deploy smoke test passes for listener execution
- [ ] CI/CD pipeline errors if cache not regenerated

### Related Rules
- add-event-cache-to-deployment
- run-event-cache-in-production

### Related Skills
- Run `event:cache` in Production for Auto-Discovery

### Related Decision Trees
- event:cache vs Uncached Discovery

---

## 5. Listeners Outside `app/Listeners` Without Configuration

### Category
Configuration

### Description
Placing listener classes outside the `app/Listeners` directory without configuring `withEvents()` in the `EventServiceProvider` or using manual registration. These listeners are silently ignored by auto-discovery.

### Why It Happens
- Modular application structure with listeners in module directories
- Developer assumes auto-discovery scans the entire application
- Refactoring existing listeners into domain directories without updating registration
- Copying module-based architecture patterns without adapting event configuration

### Warning Signs
- Listeners exist in non-standard directories (e.g., `app/Modules/Order/Listeners/`)
- `php artisan event:list` doesn't show expected listeners
- Events dispatched but no response
- Custom directory structures without corresponding `withEvents()` calls

### Why Harmful
- Listeners are completely invisible to the framework
- No error or warning — discovery silently skips unrecognized directories
- Breaks the convention-over-configuration promise of auto-discovery
- Creates disconnect between directory structure and runtime behavior
- Harder to onboard new developers who expect standard discovery paths

### Consequences
- Unhandled events in production
- Workarounds like copying listeners into `app/Listeners` creating duplication
- Confusion during debugging ("the listener is there, why isn't it running?")
- Architecture drift — directory structure diverges from actual registration

### Alternative
- Use `withEvents()` in `EventServiceProvider` to register custom directories:
  ```php
  public function boot(): void
  {
      parent::boot();

      $this->withEvents([
          'app/Modules/Order/Listeners',
      ]);
  }
  ```
- Or use manual `$listen` registration for non-standard paths
- Or refactor listeners into `app/Listeners` for standard discovery

### Refactoring Strategy
1. Identify all listener directories outside `app/Listeners`
2. Decide: refactor into `app/Listeners` or register custom paths
3. If custom paths: add `withEvents()` in `EventServiceProvider`
4. Run `php artisan event:cache` to compile new mappings
5. Verify with `php artisan event:list`
6. Consider listener auto-discovery caching impact for custom paths

### Detection Checklist
- [ ] All listener classes are in `app/Listeners` or registered via `withEvents()`
- [ ] `event:list` shows all expected listeners
- [ ] Custom directories have corresponding `withEvents()` calls
- [ ] No duplicate listeners (same handler in custom path and `app/Listeners`)
- [ ] `event:cache` includes custom directory mappings

### Related Rules
- add-event-cache-to-deployment

### Related Skills
- Run `event:cache` in Production for Auto-Discovery

### Related Decision Trees
- Auto-Discovery vs Manual Registration
