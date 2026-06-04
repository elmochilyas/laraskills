# ECC Anti-Patterns — Middleware vs Route Binding Ordering

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware vs Route Binding Ordering |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Accessing Route Models Before SubstituteBindings
2. Manually Resolving Bindings in Middleware Instead of Fixing Order
3. Placing Auth After SubstituteBindings Without Need
4. Not Testing Both Authenticated and Unauthenticated Paths
5. One-Size-Fits-All Middleware Ordering

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — binding order determines when models are loaded
- Premature Caching — binding behavior is runtime, not cacheable

---

## Anti-Pattern 1: Accessing Route Models Before SubstituteBindings

### Category
Reliability

### Description
Inspecting `$request->route('user')` in middleware that runs before `SubstituteBindings` — receives a raw string ID, not a model instance.

### Why It Happens
Developers don't realize binding happens mid-pipeline and assume route parameters are always model instances.

### Warning Signs
- `Call to a member function on string` errors in middleware
- `$request->route('post')` is a string instead of a Post model
- Null model instances in authorization gates

### Why It Is Harmful
Before `SubstituteBindings` executes, `$request->route('post')` returns the raw string ID from the URL. Calling `$post->user_id` on a string throws a fatal error. The middleware crashes on every request, or worse — silently treats a string as a model and produces incorrect behavior.

### Preferred Alternative
Place model-accessing middleware after `SubstituteBindings` in the group array or priority list.

### Detection Checklist
- [ ] Middleware accesses `$request->route('param')` as model
- [ ] Middleware runs before `SubstituteBindings`
- [ ] String errors when accessing route parameters

### Related Rules
Place Model-Accessing Middleware After `SubstituteBindings` in the Group Array (05-rules.md)

---

## Anti-Pattern 2: Manually Resolving Bindings in Middleware Instead of Fixing Order

### Category
Architecture

### Description
Duplicating `SubstituteBindings` logic inside middleware because ordering is wrong — fragile, bypasses explicit binding callbacks.

### Preferred Alternative
Fix the middleware ordering so `SubstituteBindings` runs first.

### Detection Checklist
- [ ] Manual `Model::findOrFail()` in middleware
- [ ] Manual `$request->route()->setParameter()` in middleware
- [ ] Bypassed explicit binding callbacks

---

## Anti-Pattern 3: Placing Auth After SubstituteBindings Without Need

### Category
Performance

### Description
Auth middleware runs after route model binding — loads models for every unauthenticated request.

### Preferred Alternative
Keep auth before `SubstituteBindings` so rejected requests skip model loading.

### Detection Checklist
- [ ] Auth after binding without reason
- [ ] Unauthenticated requests trigger DB queries
- [ ] High model loading cost on auth failures

---

## Anti-Pattern 4: Not Testing Both Authenticated and Unauthenticated Paths

### Category
Testing

### Description
Only testing binding-aware middleware with authenticated requests — unauthenticated path may crash.

### Preferred Alternative
Test both paths: authenticated (model bound) and unauthenticated (auth rejects before binding).

### Detection Checklist
- [ ] No test for unauthenticated path
- [ ] Middleware crashes on unauthenticated requests
- [ ] Only actingAs() tests exist

---

## Anti-Pattern 5: One-Size-Fits-All Middleware Ordering

### Category
Architecture

### Description
Placing all custom middleware before or after `SubstituteBindings` without considering each middleware's dependency.

### Preferred Alternative
Order each middleware individually: auth before, resource-check after, infrastructure at either end.

### Detection Checklist
- [ ] All custom middleware on one side of binding
- [ ] No consideration of per-middleware needs
- [ ] Inconsistent behavior across middleware
