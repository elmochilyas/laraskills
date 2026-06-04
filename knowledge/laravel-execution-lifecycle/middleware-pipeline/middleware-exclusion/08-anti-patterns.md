# ECC Anti-Patterns — Middleware Exclusion

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Exclusion |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Exclude-and-Forget (No Documentation)
2. Using Alias Strings Instead of FQCN in withoutMiddleware()
3. Global-Plus-Exclude Pattern
4. Excluding Security Middleware for Development Convenience
5. Not Verifying Exclusion with route:list -v

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — exclusion is about middleware filtering, not queries
- Premature Caching — exclusion happens at pipeline construction time per request

---

## Anti-Pattern 1: Exclude-and-Forget (No Documentation)

### Category
Maintainability

### Description
Adding `->withoutMiddleware()` to a route without documenting why — future developers can't tell if the exclusion is intentional or accidental.

### Why It Happens
Developers add exclusion during debugging or for a quick fix and don't document the rationale. Over time, no one knows why the exclusion exists.

### Warning Signs
- `withoutMiddleware()` called without inline comment
- Old exclusions that no one can explain
- Security audit flags "why is auth excluded here?"

### Why It Is Harmful
Middleware exclusion bypasses security checks. An undocumented exclusion is indistinguishable from a mistake. Future developers may remove it (thinking it's an error) and break the integration, or leave it in place (thinking there's a reason) when the vulnerability is real.

### Preferred Alternative
Always add an inline comment explaining the legitimate reason for every exclusion.

### Detection Checklist
- [ ] `withoutMiddleware()` without comment
- [ ] Exclusion rationale unknown
- [ ] Security audit finding for undocumented bypass

### Related Rules
Document Every Middleware Exclusion with a Rationale Comment (05-rules.md)

---

## Anti-Pattern 2: Using Alias Strings Instead of FQCN in withoutMiddleware()

### Category
Reliability

### Description
Passing `'csrf'` or `'auth'` instead of the fully qualified class name — exclusion silently fails.

### Preferred Alternative
Always use FQCN with `::class` constant.

### Detection Checklist
- [ ] Alias string in `withoutMiddleware()`
- [ ] Exclusion silently ignored
- [ ] Middleware still runs despite `withoutMiddleware()`

---

## Anti-Pattern 3: Global-Plus-Exclude Pattern

### Category
Architecture

### Description
Adding middleware globally and then excluding it from most routes using `withoutMiddleware()` — fragile, error-prone.

### Preferred Alternative
Apply middleware directly to routes or groups that need it.

### Detection Checklist
- [ ] Global middleware excluded from 5+ routes
- [ ] New routes missing exclusion
- [ ] Unintended middleware on new routes

---

## Anti-Pattern 4: Excluding Security Middleware for Development Convenience

### Category
Security

### Description
Excluding auth or CSRF during development with intention to restore before deployment — frequently forgotten.

### Preferred Alternative
Use environment-based conditional middleware instead of exclusions.

### Detection Checklist
- [ ] Auth excluded from any route
- [ ] CSRF excluded from any route
- [ ] Temporary exclusion in production

---

## Anti-Pattern 5: Not Verifying Exclusion with route:list -v

### Category
Testing

### Description
Assuming `withoutMiddleware()` works without verifying — class name mismatch means exclusion silently fails.

### Preferred Alternative
Run `php artisan route:list -v` and confirm excluded middleware is absent from the resolved stack.

### Detection Checklist
- [ ] Exclusion not verified
- [ ] Middleware runs despite `withoutMiddleware()`
- [ ] Production deployment without verification
