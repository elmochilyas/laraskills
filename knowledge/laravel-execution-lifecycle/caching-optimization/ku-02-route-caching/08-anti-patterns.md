# ECC Anti-Patterns — Route Caching (ku-02)

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

1. Mixed Closure/Controller Routes
2. Route Cache in Development
3. Ignoring route:list Output
4. Caching Without Config Cache First
5. Stale Cache After Provider Change

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — route caching is concerned with registration, not queries
- Premature Caching — caching routes before all route files are finalized

---

## Anti-Pattern 1: Mixed Closure/Controller Routes

### Category
Performance

### Description
Having some routes use controller classes and others use Closures — still blocking route caching entirely.

### Why It Happens
Developers convert most routes to controllers but leave a few Closure routes for convenience, not realizing one Closure blocks caching for all routes.

### Warning Signs
- Most routes use controllers, but a few use `fn() => view(...)`
- `php artisan route:cache` throws `LogicException`
- Team assumes "most routes are cacheable" but caching still fails

### Why It Is Harmful
`route:cache` serializes the entire route collection. A single Closure route anywhere in any route file causes the entire caching operation to fail. The command throws `LogicException`.

### Real-World Consequences
An application has 498 controller-based routes and 2 Closure routes (dashboard and health-check). `route:cache` fails. The entire application pays 30ms route registration overhead per request. The team thinks "our routes are mostly controllers" and doesn't realize the 2 Closures are the problem.

### Preferred Alternative
All routes must use controller classes for `route:cache` to work. Convert Closure routes to invokable controllers or `Route::view()`.

### Refactoring Strategy
1. Find all Closure routes: `grep -r "Route::\(get\|post\|put\|patch\|delete\|any\)(" routes/ | grep "function"`  
2. Replace each with a controller class
3. For simple view routes, use `Route::view()`
4. Run `php artisan route:cache` to verify

### Detection Checklist
- [ ] Closure routes exist alongside controller routes
- [ ] `route:cache` throws `LogicException`
- [ ] Team not aware that one Closure blocks all caching

### Related Rules
ku-02 (04-standardized-knowledge.md): Use controller strings for all routes.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Route Cache in Development

### Category
Workflow

### Description
Running `route:cache` in local development and wondering why route changes don't take effect.

### Why It Happens
Developers run deployment commands locally without understanding caching behavior.

### Preferred Alternative
Never run `route:cache` in development. Use `route:clear` if it was accidentally run.

### Detection Checklist
- [ ] `bootstrap/cache/routes.php` exists in development
- [ ] Route changes not reflected immediately

### Related Rules
ku-02 (04-standardized-knowledge.md): Not for development.

---

## Anti-Pattern 3: Ignoring route:list Output

### Category
Reliability

### Description
Not running `php artisan route:list` to verify routes before caching — cache may capture incorrect state.

### Why It Happens
Developers cache routes without pre-validation, assuming all routes are correct.

### Preferred Alternative
Run `php artisan route:list` before caching to verify route registration order and handlers.

### Detection Checklist
- [ ] Routes cached without prior verification
- [ ] Broken routes after deployment

### Related Rules
ku-02 (04-standardized-knowledge.md): Validate routes before caching.

---

## Anti-Pattern 4: Caching Without Config Cache First

### Category
Reliability

### Description
Running `route:cache` before `config:cache`.

### Preferred Alternative
Always run `config:cache` before `route:cache`.

### Detection Checklist
- [ ] Route cache built before config cache
- [ ] Inconsistent route configuration

### Related Rules
ku-02 (04-standardized-knowledge.md): Cache after config:cache.

---

## Anti-Pattern 5: Stale Cache After Provider Change

### Category
Reliability

### Description
Adding a new provider with routes but not regenerating the route cache.

### Preferred Alternative
Regenerate route cache after any provider change that registers routes.

### Detection Checklist
- [ ] New provider routes not available
- [ ] Route not found errors after provider addition

### Related Rules
ku-02 (04-standardized-knowledge.md): Clear and regenerate cache after provider changes.
