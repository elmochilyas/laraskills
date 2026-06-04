# ECC Anti-Patterns — Kernel Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Kernel Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fat Kernel (Business Logic in Kernel Classes)
2. Middleware Duplication Across Registration Points
3. Missing Explicit Middleware Priority
4. Not Migrating Kernel Config on Laravel 10→11 Upgrade

---

## Repository-Wide Anti-Patterns

- Schedule Overload (too many scheduled tasks without execution monitoring)
- Missing Route/Config Cache in Production
- `withoutMiddleware()` in Production Routes

---

## Anti-Pattern 1: Fat Kernel

### Category
Architecture

### Description
Adding business logic, database queries, or complex orchestration directly to the HTTP or Console kernel class.

### Why It Happens
The kernel is the first class called on each request. Developers add logic there because "it needs to run before anything else."

### Warning Signs
- Kernel class has methods other than `schedule()` that contain business logic
- Kernel class references domain models or services directly
- Kernel `handle()` method is overridden with custom logic
- Console kernel's `schedule()` contains non-scheduling logic

### Preferred Alternative
The kernel should orchestrate infrastructure only (middleware pipeline, bootstrappers, schedule). Business logic belongs in controllers, services, and commands.

### Related Rules
- Rule: Never Put Business Logic in Kernel Classes

---

## Anti-Pattern 2: Middleware Duplication Across Registration Points

### Category
Reliability

### Description
Registering the same middleware class in both global (`$middleware`) and group (`$middlewareGroups['web']`) arrays, causing it to run twice per request.

### Why It Happens
The middleware was initially global, then also added to a group without removing it from global.

### Warning Signs
- Same middleware class appears in both `$middleware` and a group list
- Middleware side effects (logging, rate limiting, session start) happen twice per request
- Execution time doubles for routes in that group

### Preferred Alternative
Each middleware appears in exactly one registration location: global, group, or route alias.

### Related Rules
- Rule: Never Duplicate Middleware Across Registration Points

---

## Anti-Pattern 3: Missing Explicit Middleware Priority

### Category
Reliability

### Description
Leaving `$middlewarePriority` empty and relying on framework defaults for middleware execution order.

### Why It Happens
The application works in the current version, so priority seems irrelevant.

### Warning Signs
- `$middlewarePriority = []` or never set
- Custom middleware must run between framework middleware (e.g., auth after session)
- Laravel version upgrade causes middleware to run in wrong order
- Authentication fails after version upgrade because session middleware runs after auth

### Preferred Alternative
Always define explicit middleware priority when custom middleware interleaves with framework middleware.

### Related Rules
- Rule: Keep Middleware Priority Explicit

---

## Anti-Pattern 4: Not Migrating Kernel Config on Laravel 10→11 Upgrade

### Category
Maintainability

### Description
After upgrading from Laravel 10 to 11, still using `app/Http/Kernel.php` properties for middleware instead of the `bootstrap/app.php` fluent API.

### Why It Happens
The Laravel 10 approach still works (Kernel class properties are not removed), but new features are only available in the fluent API.

### Warning Signs
- Laravel 11+ project still has `app/Http/Kernel.php` with `$middleware` properties
- `bootstrap/app.php` has no `->withMiddleware()` call
- New 11+ middleware features (remove, append/prepend per group, closure-based) are unavailable

### Preferred Alternative
Migrate middleware, exception handling, and routing configuration to `bootstrap/app.php` fluent API after upgrading to Laravel 11+.

### Related Rules
- Rule: Enable All Caches in Production
