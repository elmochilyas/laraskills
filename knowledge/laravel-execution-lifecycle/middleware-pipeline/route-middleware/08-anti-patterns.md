# ECC Anti-Patterns — Route Middleware

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Route Middleware |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Closure Middleware on Cached Routes
2. Controller Middleware Over Inline
3. Middleware Duplication
4. Priority Conflicts at Route Level
5. Not Using `only`/`except` for Resource Controllers

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — route middleware handles per-route concerns, not queries
- Premature Caching — route middleware benefits from route caching

---

## Anti-Pattern 1: Closure Middleware on Cached Routes

### Category
Performance

### Description
Using closures in `->middleware()` — blocks route caching.

### Why It Happens
Closures are convenient for quick prototyping and remain in production.

### Warning Signs
- `Route::get()->middleware(fn() => ...)`
- Route caching fails or produces incomplete cache
- High-traffic routes with closure middleware

### Why It Is Harmful
Route caching serializes middleware definitions. Closures are not serializable — `route:cache` throws `LogicException` if any route uses closure middleware. This prevents the entire route cache from working.

### Preferred Alternative
Use class-based middleware for all production routes.

### Detection Checklist
- [ ] Closure middleware in route definitions
- [ ] `route:cache` fails
- [ ] Route caching bypassed for all routes

### Related Rules
Route Middleware (05-rules.md): N/A

---

## Anti-Pattern 2: Controller Middleware Over Inline

### Category
Maintainability

### Description
Using `$this->middleware('auth')` in controller constructors instead of inline in route definitions.

### Preferred Alternative
Prefer inline middleware in route definitions for visibility.

### Detection Checklist
- [ ] All middleware in controller constructors
- [ ] Route files don't show full middleware stack

---

## Anti-Pattern 3: Middleware Duplication

### Category
Reliability

### Description
Adding same middleware at both route and group level — runs twice.

### Preferred Alternative
Check resolved stack with `route:list -v` to avoid duplicates.

### Detection Checklist
- [ ] Middleware running twice
- [ ] Duplicate entries in `route:list -v`

---

## Anti-Pattern 4: Priority Conflicts at Route Level

### Category
Reliability

### Description
Adding auth middleware at route level where it runs before session middleware from group.

### Preferred Alternative
Ensure priority ordering covers route-level middleware.

### Detection Checklist
- [ ] Auth before session on some routes
- [ ] No authenticated user despite auth middleware

---

## Anti-Pattern 5: Not Using `only`/`except` for Resource Controllers

### Category
Code Organization

### Description
Applying middleware to each resource controller method individually.

### Preferred Alternative
Use `$this->middleware('auth')->except('index', 'show')`.

### Detection Checklist
- [ ] Repeated middleware on controller methods
- [ ] Resource controller without `only`/`except`
