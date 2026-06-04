# ECC Anti-Patterns — Middleware Configuration in Bootstrap

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Configuration in Bootstrap |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hybrid Configuration (Kernel + Bootstrap)
2. Not Re-Caching After Changes
3. Using Global append() When Group-Specific Is Needed
4. Forgetting the Middleware use Statement
5. Using remove() + append() Instead of replace()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — bootstrap configuration runs once, not per-request
- Premature Caching — middleware config is cached; stale cache after changes is the real risk

---

## Anti-Pattern 1: Hybrid Configuration (Kernel + Bootstrap)

### Category
Architecture

### Description
Splitting middleware configuration between old `App\Http\Kernel` properties and new `withMiddleware()` in `bootstrap/app.php` in Laravel 11+.

### Why It Happens
Developers migrating from Laravel 10 to 11 gradually move configuration but leave some behind. Laravel 11 silently ignores kernel properties — middleware never runs.

### Warning Signs
- Middleware defined in kernel properties
- Some middleware works, some doesn't
- `withMiddleware()` partially configured

### Why It Is Harmful
Laravel 11 no longer reads `$middleware`, `$middlewareGroups`, or `$routeMiddleware` from `App\Http\Kernel`. Any middleware still configured in the kernel is silently ignored — it never runs. This creates security gaps (removed but forgotten auth middleware) and debugging nightmares ("I added it but it doesn't work").

### Preferred Alternative
Use `->withMiddleware()` exclusively in `bootstrap/app.php` for Laravel 11+. Remove all middleware properties from kernel on migration.

### Detection Checklist
- [ ] Kernel properties still populated
- [ ] Middleware not running despite being "configured"
- [ ] Inconsistent middleware behavior

### Related Rules
Always Use `withMiddleware()` for Laravel 11+ Middleware Configuration (05-rules.md)

---

## Anti-Pattern 2: Not Re-Caching After Changes

### Category
Reliability

### Description
Modifying middleware configuration in `bootstrap/app.php` without running `php artisan optimize` — stale config persists in production.

### Preferred Alternative
Run `php artisan optimize` after every `bootstrap/app.php` change.

### Detection Checklist
- [ ] Middleware changes not reflected in production
- [ ] Old middleware still running after deployment
- [ ] New middleware silently ignored

---

## Anti-Pattern 3: Using Global append() When Group-Specific Is Needed

### Category
Architecture

### Description
Adding application middleware via `$middleware->append()` (global stack) instead of `$middleware->web(append: [...])` — affects health checks, API routes, and everything else.

### Preferred Alternative
Use group-specific methods for application middleware. Reserve global `append()` for infrastructure middleware.

### Detection Checklist
- [ ] Localization middleware on API routes
- [ ] Session middleware on health checks
- [ ] Global stack has 10+ entries

---

## Anti-Pattern 4: Forgetting the Middleware use Statement

### Category
Reliability

### Description
Missing `use Illuminate\Foundation\Configuration\Middleware;` in `bootstrap/app.php` — runtime class not found error.

### Preferred Alternative
Always include the import. Check the boilerplate in new Laravel 11 projects for reference.

### Detection Checklist
- [ ] `Class "Middleware" not found` error
- [ ] Missing use statement in bootstrap/app.php

---

## Anti-Pattern 5: Using remove() + append() Instead of replace()

### Category
Maintainability

### Description
Manually removing a default middleware and re-adding a custom version — risks missing a group where the middleware also appears.

### Preferred Alternative
Use `$middleware->replace(OldClass::class, NewClass::class)` — handles all groups automatically.

### Detection Checklist
- [ ] Manual `remove()` + `append()` for middleware swap
- [ ] Old middleware still running in some groups
- [ ] Inconsistent behavior across groups
