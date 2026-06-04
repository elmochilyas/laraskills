# ECC Anti-Patterns — View Composers and Creators

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | View Composers and Creators |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Uncached Database Queries in Wildcard Composers (N+1 on Every Render)
2. Silent Data Override Between Composer and Controller
3. Creators for Request-Scoped Data (Stale Auth Data)
4. Wildcard Composer for Data Most Views Don't Use
5. Closure-Based Composers in Service Provider (Untestable)

---

## Repository-Wide Anti-Patterns

- Composers with Business Logic (Writing to Database)
- Generic Variable Names in Composers (`$data`, `$items`, `$info`)
- Multiple Composers Competing for the Same Variable
- Composer Registration Scattered Across Providers
- Composers Replacing Component Constructor Injection

---

## Anti-Pattern 1: Uncached Database Queries in Wildcard Composers

### Category
Performance

### Description
Registering a composer with `View::composer('*', ...)` that performs uncached database queries, executing those queries on every view render — including partials, components, and emails.

### Why It Happens
Developers register a wildcard composer for convenience without realizing it runs on every single render, not per-page but per-view-instance.

### Warning Signs
- A page with 50 components executes 50 identical queries from the wildcard composer
- Debug toolbar shows queries multiplied by the number of partials/components
- Same query appears 20+ times in the query log for a single page
- Performance monitoring shows high DB load across all pages

### Preferred Alternative
Scope composers to specific views or namespaces. Cache expensive queries with `cache()->remember()`.

### Related Rules
- Rule: Cache Expensive Queries in Wildcard Composers
- Rule: Avoid Wildcard Composers for Global Data That Most Views Do Not Use

---

## Anti-Pattern 2: Silent Data Override Between Composer and Controller

### Category
Reliability

### Description
A composer sets a variable with the same name as a controller-passed variable, silently overriding the controller's data because composers run after controller data binding.

### Why It Happens
No naming convention distinguishes composer-provided data from controller data. Both use generic names like `$users`.

### Warning Signs
- Composer sets `$users` and controller also passes `$users` — template gets composer's data
- Refactoring a controller to pass different data has no effect — composer overrides it
- Debugging requires understanding composer execution order
- "Controller data is correct but view shows different data"

### Preferred Alternative
Use prefixed variable names for composer data (e.g., `$recentUsers`, `$currentUser` instead of `$users`).

### Related Rules
- Rule: Prevent Silent Data Override Between Composers and Controllers

---

## Anti-Pattern 3: Creators for Request-Scoped Data

### Category
Reliability

### Description
Using `View::creator()` instead of `View::composer()` for auth-dependent or request-scoped data (current user, notifications, permissions).

### Why It Happens
Developers confuse "creators run once" (per instance) with "once per request" without considering view reuse scenarios.

### Warning Signs
- Creator sets `$currentUser = auth()->user()` or `$notifications = auth()->user()->notifications`
- View cached or reused within a request shows stale auth data
- After logout, cached views still show previous user's data
- No understanding of the creator-vs-composer lifecycle difference

### Preferred Alternative
Use creators only for truly static config data (app name, locale). Use composers for data that varies per request.

### Related Rules
- Rule: Use Creators Only for Truly Static Configuration Data

---

## Anti-Pattern 4: Wildcard Composer for Data Most Views Don't Use

### Category
Performance

### Description
Registering a wildcard composer (`*`) for data that is only needed by a small subset of views, computing unnecessary data on every render.

### Why It Happens
Developers default to `*` because it's "easier than listing specific views" without considering the performance impact.

### Warning Signs
- Composer sets `$adminMenu` but it's only used in admin views
- Public pages, auth pages, and partials all execute composer code they don't need
- Profiling shows composer data preparation in views where the data is never accessed
- Wildcard composer list grows to 5+ composers, each running on every render

### Preferred Alternative
Scope composers to specific views or namespaces where the data is actually needed. Use `*` only for truly universal data (current user, app name).

### Related Rules
- Rule: Avoid Wildcard Composers for Global Data That Most Views Do Not Use

---

## Anti-Pattern 5: Closure-Based Composers in Service Provider

### Category
Maintainability | Testing

### Description
Writing composer logic directly as closures inside the service provider's `boot()` method instead of extracting to dedicated composer classes.

### Why It Happens
Developers find inline closures "simpler" than creating a separate class file.

### Warning Signs
- `View::composer('*', function (View $view) { ... })` with 10+ lines of logic
- Closure calls `app()->make()` to resolve dependencies
- Cannot unit-test the composer logic in isolation
- Same closure logic duplicated if needed for multiple view registrations
- Service provider grows to 100+ lines of composer logic

### Preferred Alternative
Use class-based composers with constructor dependency injection. Reserve closures only for trivial single-line data binding (e.g., `$view->with('key', config('value'))`).

### Related Rules
- Rule: Prefer Class-Based Composers Over Closures
