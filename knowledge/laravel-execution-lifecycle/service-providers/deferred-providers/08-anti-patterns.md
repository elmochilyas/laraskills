# ECC Anti-Patterns — Deferred Providers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Deferred Providers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Deferring Everything
2. Stale Manifest After Deployment
3. Partial provides()
4. Deferred Provider with Boot-Time Side Effects
5. Missing Manifest After Changes

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — deferred providers are about bootstrap optimization, not queries
- Premature Caching — manifest must reflect current provider state

---

## Anti-Pattern 1: Deferring Everything

### Category
Performance

### Description
Making every provider deferred without considering boot-time registration requirements.

### Why It Happens
Developers see deferred = faster and apply it universally.

### Warning Signs
- Providers that register routes are deferred
- Providers that register event listeners are deferred
- Routes, listeners, or middleware not registered until a service is resolved

### Why It Is Harmful
If a deferred provider registers routes or event listeners in `boot()`, those routes/listeners are NOT registered at boot time — they only register when the provider's service is first resolved. Until then, the routes don't exist, the listeners don't fire.

### Preferred Alternative
Only defer providers whose `boot()` has no side effects needed at startup. Keep providers with route/listener/view registration as eager.

### Detection Checklist
- [ ] Deferred provider with `loadRoutesFrom()`, `loadViewsFrom()` in `boot()`
- [ ] Event listeners registered in deferred provider
- [ ] Routes not available until first service resolution

### Related Rules
Deferred Providers (05-rules.md): N/A

### Related Skills
Deferred Providers (06-skills.md): N/A

### Related Decision Trees
Deferred Providers (07-decision-trees.md): D01 — Deferred vs Eager Decision.

---

## Anti-Pattern 2: Stale Manifest After Deployment

### Category
Reliability

### Description
Deploying code changes without regenerating `bootstrap/cache/services.php`.

### Preferred Alternative
Always run `php artisan optimize` in deployment.

### Detection Checklist
- [ ] Old manifest after new provider added
- [ ] Services silently unavailable

### Related Rules
Deferred Providers (05-rules.md): N/A

### Related Skills
Deferred Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Partial provides()

### Category
Reliability

### Description
Listing some but not all registered services in `provides()`.

### Preferred Alternative
List every service identifier registered in `register()`.

### Detection Checklist
- [ ] `provides()` missing some bindings
- [ ] Some deferred services never resolve

### Related Rules
Deferred Providers (05-rules.md): N/A

### Related Skills
Deferred Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Deferred Provider with Boot-Time Side Effects

### Category
Architecture

### Description
Provider has `boot()` side effects (routes, listeners, views) but is marked deferred.

### Preferred Alternative
Split into eager provider (for boot-time registration) and deferred provider (for service bindings).

### Detection Checklist
- [ ] Deferred provider with boot-time registration
- [ ] Side effects delayed until first resolution

### Related Rules
Deferred Providers (05-rules.md): N/A

### Related Skills
Deferred Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Missing Manifest After Changes

### Category
Reliability

### Description
Not rebuilding the deferred manifest after adding/changing a deferred provider.

### Preferred Alternative
Rebuild manifest after every provider change.

### Detection Checklist
- [ ] Manifest not regenerated
- [ ] Chanages not reflected

### Related Rules
Deferred Providers (05-rules.md): N/A

### Related Skills
Deferred Providers (06-skills.md): N/A

### Related Decision Trees
N/A
