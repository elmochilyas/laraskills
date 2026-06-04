# ECC Anti-Patterns — Default Middleware Members

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Default Middleware Members |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Blindly Removing Default Middleware
2. Adding Heavy Middleware to Default Groups
3. Not Verifying Middleware Composition After Upgrades
4. Modifying Default Groups Instead of Creating Custom Groups
5. Removing SubstituteBindings Without Knowing the Impact

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — default middleware semantics are about request flow, not queries
- Premature Caching — default middleware composition is stable; caching doesn't change it

---

## Anti-Pattern 1: Blindly Removing Default Middleware

### Category
Reliability

### Description
Removing default middleware like `StartSession`, `EncryptCookies`, or `VerifyCsrfToken` without understanding the full impact.

### Why It Happens
Developers assume all defaults are optional or remove them for "performance" without tracing the dependency chain.

### Warning Signs
- `ShareErrorsFromSession` removed — validation errors never show in views
- `StartSession` removed — `auth()->user()` returns null on all routes
- `EncryptCookies` removed — session ID lost, user logged out on next request

### Why It Is Harmful
The default middleware stack has a strict dependency chain: `EncryptCookies` → `AddQueuedCookiesToResponse` → `StartSession` → `ShareErrorsFromSession` → `VerifyCsrfToken` → `SubstituteBindings`. Removing any dependency silently breaks everything downstream. Session-based auth stops working. CSRF validation failures cascade into 419 errors. `SubstituteBindings` removal causes all route model binding to fail.

### Preferred Alternative
Research each default middleware's purpose before modifying. Document the rationale in code comments.

### Detection Checklist
- [ ] Default middleware removed from global or group
- [ ] Session/auth/CSRF not working
- [ ] No documented rationale for removal

### Related Rules
Audit Default Middleware for API-Only Applications (05-rules.md)

---

## Anti-Pattern 2: Adding Heavy Middleware to Default Groups

### Category
Performance

### Description
Appending DB-dependent or API-calling middleware to default `web` or `api` groups — affects every route in that group including package routes.

### Preferred Alternative
Create custom groups for application-specific middleware. Only add to default groups when the middleware genuinely applies to every route in that group.

### Detection Checklist
- [ ] Database queries in default group middleware
- [ ] HTTP calls in default group middleware
- [ ] Health check routes running heavy middleware

---

## Anti-Pattern 3: Not Verifying Middleware Composition After Upgrades

### Category
Maintainability

### Description
Assuming default middleware composition is the same across Laravel versions. Copying old kernel configuration into new projects without review.

### Preferred Alternative
Check the Laravel upgrade guide for middleware changes between major versions. Run `php artisan route:list -v` to verify the resolved stack.

### Detection Checklist
- [ ] Old kernel properties copied to new project
- [ ] New framework middleware silently missing
- [ ] `route:list -v` not run after upgrade

---

## Anti-Pattern 4: Modifying Default Groups Instead of Creating Custom Groups

### Category
Architecture

### Description
Appending custom middleware to default `web` or `api` groups as a shortcut instead of creating custom middleware groups.

### Preferred Alternative
Create custom groups for distinct route types (admin, tenant, analytics). Only modify default groups when the middleware genuinely applies to all routes in that group.

### Detection Checklist
- [ ] Custom middleware in default groups
- [ ] Custom groups not used
- [ ] Package routes running unintended middleware

---

## Anti-Pattern 5: Removing SubstituteBindings Without Knowing the Impact

### Category
Reliability

### Description
Removing `SubstituteBindings` from a group — every controller that type-hints models in route parameters receives raw IDs instead of model instances.

### Preferred Alternative
Keep `SubstituteBindings` in all groups that use route model binding. Only remove if models are resolved manually in every controller.

### Detection Checklist
- [ ] `SubstituteBindings` removed from group
- [ ] Controllers receiving raw IDs
- [ ] `findOrFail` scattered across controllers
