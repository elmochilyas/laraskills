# ECC Anti-Patterns — Pipeline Pattern Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Pipeline Pattern Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Forgetting `return $next($request)`
2. Closure Middleware on Production Routes
3. Multi-Concern Middleware
4. Pipeline for Single-Step Processing
5. Forgetting Short-Circuit Safety

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — pipeline handles request flow, not data access
- Premature Caching — pipeline executes on every request

---

## Anti-Pattern 1: Forgetting `return $next($request)`

### Category
Reliability

### Description
Not returning the result of `$next($request)` — breaks the response chain.

### Warning Signs
- `$next($request);` without `return`
- Middleware runs but controller response is empty
- Downstream middleware never sees the response

### Why It Is Harmful
The pipeline chains closures via return values. A missing `return` drops the downstream response — the controller runs, but its return value is lost, resulting in an empty response.

### Preferred Alternative
Always `return $next($request);`.

### Detection Checklist
- [ ] `$next($request)` not returned
- [ ] Empty responses from controller
- [ ] Downstream middleware skipped

### Related Rules
Pipeline Pattern (05-rules.md): N/A

---

## Anti-Pattern 2: Closure Middleware on Production Routes

### Category
Performance

### Description
Using closures in `Route::middleware()` — blocks route caching entirely.

### Preferred Alternative
Use class-based middleware for all routes.

### Detection Checklist
- [ ] Closure middleware on routes
- [ ] Route caching not possible

---

## Anti-Pattern 3: Multi-Concern Middleware

### Category
Architecture

### Description
Middleware handling multiple concerns (e.g., auth + logging + rate limiting).

### Preferred Alternative
One concern per middleware class.

### Detection Checklist
- [ ] Middleware with multiple responsibilities
- [ ] Hard to test or reorder

---

## Anti-Pattern 4: Pipeline for Single-Step Processing

### Category
Architecture

### Description
Using Pipeline class when a simple function call suffices.

### Preferred Alternative
Use a direct function call or method invocation.

### Detection Checklist
- [ ] Pipeline with one pipe
- [ ] Unnecessary abstraction

---

## Anti-Pattern 5: Forgetting Short-Circuit Safety

### Category
Security

### Description
Auth middleware placed after logging middleware — auth can short-circuit before log runs.

### Preferred Alternative
Order security-critical middleware before logging/analytics.

### Detection Checklist
- [ ] Logging before auth
- [ ] Auth bypass via short-circuit
