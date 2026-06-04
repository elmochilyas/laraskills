# ECC Anti-Patterns — Middleware Priority

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Priority |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Not Adding Custom Middleware to Priority
2. Using Priority Instead of Group Ordering
3. Changing Default Priority
4. Stale Priority List After Middleware Removal
5. Missing Priority Entry for Dependent Middleware

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — priority controls execution order, not data access
- Premature Caching — priority sorting happens every request

---

## Anti-Pattern 1: Not Adding Custom Middleware to Priority

### Category
Reliability

### Description
Custom middleware that depends on session or auth but not added to priority — may run before dependency.

### Why It Happens
Developers assume array order in group definitions controls execution order.

### Warning Signs
- Custom middleware accesses `auth()->user()` but user is null
- Middleware relies on route model bindings but receives raw IDs
- Works intermittently depending on route file ordering

### Why It Is Harmful
Middleware from different sources (global, group, route) is merged before pipeline execution. Priority is the only mechanism that ensures cross-source ordering. Without it, custom middleware may run before session starts or auth resolves.

### Preferred Alternative
Add custom middleware to the priority array, positioned after its dependencies.

### Detection Checklist
- [ ] Custom middleware accessing auth/bindings/session
- [ ] Intermittent null values
- [ ] Not in priority array

### Related Rules
Middleware Priority (05-rules.md): N/A

---

## Anti-Pattern 2: Using Priority Instead of Group Ordering

### Category
Architecture

### Description
Using global priority to fix ordering that should be resolved in group arrays.

### Preferred Alternative
Order middleware correctly in group arrays first.

### Detection Checklist
- [ ] Priority array longer than 10 entries
- [ ] Group ordering would suffice

---

## Anti-Pattern 3: Changing Default Priority

### Category
Reliability

### Description
Reordering default priority entries — breaks framework middleware ordering.

### Preferred Alternative
Extend priority array, don't reorder defaults.

### Detection Checklist
- [ ] Default priority order changed
- [ ] Session/auth/CORS broken

---

## Anti-Pattern 4: Stale Priority List After Middleware Removal

### Category
Maintainability

### Description
Leaving priority entries for removed middleware classes.

### Preferred Alternative
Clean up priority list when removing middleware.

### Detection Checklist
- [ ] Priority entry referencing deleted class
- [ ] Harmless but misleading

---

## Anti-Pattern 5: Missing Priority Entry for Dependent Middleware

### Category
Reliability

### Description
Middleware that needs to run before SubstituteBindings but not prioritized.

### Preferred Alternative
Add to priority after SubstituteBindings if accessing bindings.

### Detection Checklist
- [ ] Null model instances in middleware
- [ ] Binding-dependent middleware not prioritized
