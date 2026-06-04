# ECC Anti-Patterns — Route Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Route Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Closure Routes Blocking Cache
2. Route Cache Deployed Without Regeneration
3. Not Clearing Cache on Route Change
4. Caching Before All Route Files Load
5. Route Cache Without Config Cache

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — route caching does not affect database
- Premature Caching — caching routes before they are finalized

---

## Anti-Pattern 1: Closure Routes Blocking Cache

### Category
Performance

### Description
Having even one Closure-based route, which prevents `route:cache` from working entirely.

### Why It Happens
Developers don't know that Closure routes are unserializable.

### Warning Signs
- `php artisan route:cache` throws `LogicException`
- Some routes use Closures, most use controllers
- Team assumes partial caching works

### Why It Is Harmful
A single Closure route in any file causes `route:cache` to fail entirely. All routes — including controller-based ones — remain uncached.

### Preferred Alternative
Convert all Closure routes to controller classes or `Route::view()`.

### Detection Checklist
- [ ] Closure routes exist
- [ ] `route:cache` fails with LogicException
- [ ] All routes uncached despite mostly controllers

### Related Rules
Route Caching (04-standardized-knowledge.md): Use controller classes for all routes.

---

## Anti-Pattern 2: Route Cache Deployed Without Regeneration

### Category
Reliability

### Description
Deploying with a route cache file from a previous build — routes don't match current code.

### Preferred Alternative
Always regenerate route cache on the deploy target.

### Detection Checklist
- [ ] Route cache in deployment artifact
- [ ] Routes don't match deployed code

### Related Rules
Route Caching (04-standardized-knowledge.md): Regenerate on deploy.

---

## Anti-Pattern 3: Not Clearing Cache on Route Change

### Category
Reliability

### Description
Adding or modifying routes without clearing the route cache.

### Preferred Alternative
Always run `route:clear && route:cache` after route changes.

### Detection Checklist
- [ ] Route changes not reflected
- [ ] 404 errors on new routes

### Related Rules
Route Caching (04-standardized-knowledge.md): Clear and regenerate after route changes.

---

## Anti-Pattern 4: Caching Before All Route Files Load

### Category
Reliability

### Description
Running `route:cache` before all service providers have registered their routes.

### Preferred Alternative
Run `route:cache` after all providers are loaded — typically at the end of deployment.

### Detection Checklist
- [ ] Routes missing after cache generation
- [ ] Provider-added routes not registered

### Related Rules
Route Caching (04-standardized-knowledge.md): Cache after all providers.

---

## Anti-Pattern 5: Route Cache Without Config Cache

### Category
Reliability

### Description
Caching routes before caching config — routes may read config values that change.

### Preferred Alternative
Always cache config before routes: `config:cache && route:cache`.

### Detection Checklist
- [ ] Routes cached before config
- [ ] Route behavior inconsistent with current config

### Related Rules
Route Caching (04-standardized-knowledge.md): Cache config first.
