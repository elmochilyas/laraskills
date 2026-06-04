# ECC Anti-Patterns — Pre-and-Post-Middleware Code

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Pre-and-Post-Middleware Code |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Modifying Response in Pre-Middleware Code
2. Placing All Logic After $next() (Post-Code Bypass)
3. Heavy Work in Pre-Middleware
4. Heavy Work in Post-Middleware
5. Splitting Logically Coupled Pre/Post Across Two Middleware

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — pre/post placement affects whether DB queries block the request or response
- Premature Caching — pre/post execution order is runtime behavior

---

## Anti-Pattern 1: Modifying Response in Pre-Middleware Code

### Category
Reliability

### Description
Accessing or modifying the response object before calling `$next($request)` — the response doesn't exist yet.

### Why It Happens
Developers don't understand that the response is only available after `$next($request)` executes and returns it.

### Warning Signs
- `$response->headers->set()` before `$next($request)`
- Undefined variable `$response` error
- Response modifications that never take effect

### Why It Is Harmful
Before `$next($request)` executes, no response exists — the variable `$response` is not assigned. Attempting to access `$response` before `$next()` either references an undefined variable (error) or the closure itself (if stored earlier). Modifications before `$next()` are silently ignored — the developer thinks they're modifying the response but the change never reaches the client.

### Preferred Alternative
Always call `$response = $next($request)` first, then modify the response in post-middleware code.

### Detection Checklist
- [ ] Response access before `$next($request)`
- [ ] Response modifications not taking effect
- [ ] Undefined variable errors

### Related Rules
Never Modify or Access the Response in Pre-Middleware Code (05-rules.md)

---

## Anti-Pattern 2: Placing All Logic After $next() (Post-Code Bypass)

### Category
Reliability

### Description
Putting all middleware logic after `$next($request)` — post-code never runs when upstream middleware short-circuits.

### Preferred Alternative
Place guard logic (auth, validation) before `$next()` as pre-middleware. Only put non-critical observation in post-code.

### Detection Checklist
- [ ] Auth check after `$next()`
- [ ] Logging after `$next()` misses short-circuited requests
- [ ] Post-code depends on successful completion

---

## Anti-Pattern 3: Heavy Work in Pre-Middleware

### Category
Performance

### Description
Database queries or API calls in pre-middleware code — blocks TTFB for every request.

### Preferred Alternative
Defer heavy work to post-middleware or lazy-load in the controller.

### Detection Checklist
- [ ] DB queries before `$next($request)`
- [ ] API calls before `$next($request)`
- [ ] High TTFB on middleware-heavy routes

---

## Anti-Pattern 4: Heavy Work in Post-Middleware

### Category
Performance

### Description
Response compression or transformation in post-middleware — blocks TTLB.

### Preferred Alternative
Use middleware compression at the web server level or keep post-middleware lightweight.

### Detection Checklist
- [ ] Response compression in post-middleware
- [ ] Heavy transformations after `$next($request)`
- [ ] High TTLB on middleware-heavy routes

---

## Anti-Pattern 5: Splitting Logically Coupled Pre/Post Across Two Middleware

### Category
Maintainability

### Description
Separating CORS origin check (pre) and CORS header setting (post) into two middleware classes — relationship is invisible.

### Preferred Alternative
Keep logically coupled pre/post pairs in one middleware class.

### Detection Checklist
- [ ] CORS check and header set in different middleware
- [ ] Related pre/post logic across separate classes
- [ ] Must keep two middleware in sync
