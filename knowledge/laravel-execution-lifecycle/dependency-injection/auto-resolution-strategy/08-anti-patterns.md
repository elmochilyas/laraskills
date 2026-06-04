# ECC Anti-Patterns — Auto-Resolution Strategy

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Auto-Resolution Strategy |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Auto-Resolution as Architecture Strategy
2. No Primitives Resolution Path
3. Hot-Path Auto-Resolution
4. Interface Without Binding
5. Constructor Changes Break Silently

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — auto-resolution addresses object construction, not queries
- Premature Caching — auto-resolution is the fallback, not a caching concern

---

## Anti-Pattern 1: Auto-Resolution as Architecture Strategy

### Category
Architecture

### Description
Relying entirely on auto-resolution for all dependency management without any explicit bindings.

### Warning Signs
- No `bind()` calls in any service provider
- Team cannot explain where dependencies come from
- Constructor changes cascade into runtime errors

### Why It Is Harmful
Auto-resolution is a fallback mechanism, not an architecture strategy. Without explicit bindings, the dependency graph is invisible and brittle.

### Preferred Alternative
Use explicit bindings for architectural boundaries (interfaces, services). Let auto-resolution handle only concrete utility classes.

### Detection Checklist
- [ ] Zero explicit bindings
- [ ] Relying on "magic" resolution

### Related Rules
Auto-Resolution Strategy (04-standardized-knowledge.md): Bind interfaces explicitly.

---

## Anti-Pattern 2: No Primitives Resolution Path

### Category
Reliability

### Description
Constructor has primitive parameters (int, string) without defaults or bindings — `BindingResolutionException` at runtime.

### Preferred Alternative
Provide default values for optional primitives or use contextual binding.

### Detection Checklist
- [ ] Primitive params without defaults
- [ ] `BindingResolutionException` on resolution

### Related Rules
Auto-Resolution Strategy (04-standardized-knowledge.md): Default optional dependencies.

---

## Anti-Pattern 3: Hot-Path Auto-Resolution

### Category
Performance

### Description
Using auto-resolution (Reflection-based) for classes resolved on every request.

### Preferred Alternative
Register explicit singleton bindings for hot-path classes.

### Detection Checklist
- [ ] High-traffic classes use auto-resolution
- [ ] Reflection overhead visible in profiling

### Related Rules
Auto-Resolution Strategy (04-standardized-knowledge.md): Pre-resolve hot paths.

---

## Anti-Pattern 4: Interface Without Binding

### Category
Reliability

### Description
Type-hinting an interface without registering an explicit binding.

### Preferred Alternative
Always register interface-to-concrete bindings in service providers.

### Detection Checklist
- [ ] Interface type-hinted without binding
- [ ] `TargetInterfaceNotInstantiableException`

### Related Rules
Auto-Resolution Strategy (04-standardized-knowledge.md): Bind interfaces explicitly.

---

## Anti-Pattern 5: Constructor Changes Break Silently

### Category
Reliability

### Description
Adding a new constructor parameter to a class that is auto-resolved — the change breaks all resolution points silently.

### Preferred Alternative
Add defaults for new parameters or use explicit bindings to catch issues early.

### Detection Checklist
- [ ] Constructor changes in auto-resolved class
- [ ] Runtime failures from missing parameters

### Related Rules
Auto-Resolution Strategy (04-standardized-knowledge.md): N/A
