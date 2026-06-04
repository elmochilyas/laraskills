# ECC Anti-Patterns — Auto-Resolution via Reflection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Auto-Resolution via Reflection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Type-Hinting Interface Without Registered Binding
2. Required Primitive Parameters Without Defaults
3. Deep Constructor Dependency Chains
4. Relying on Auto-Resolution for Hot-Path Services
5. No Explicit Bindings for Interfaces at All

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — auto-resolution uses reflection on constructors, not queries
- Premature Caching — reflection metadata is not cached by default (caching available in Laravel 12+)

---

## Anti-Pattern 1: Type-Hinting Interface Without Registered Binding

### Category
Reliability

### Description
Adding an interface type-hint to a constructor without registering a binding for that interface — auto-resolution cannot instantiate interfaces.

### Why It Happens
Developers assume auto-resolution works for any type-hint, not realizing it only works for concrete, instantiable classes.

### Warning Signs
- `BindingResolutionException: "Target [Interface] is not instantiable"`
- Interface type-hint added during refactoring
- No `bind()` call for the interface

### Why It Is Harmful
The container's `build()` method calls `ReflectionClass::isInstantiable()` on each parameter's type-hint. For interfaces and abstract classes, this returns `false`. The container cannot create an instance and throws `BindingResolutionException` with the message "Target [Interface] is not instantiable." Every call to `make()` on a class with this dependency fails.

### Preferred Alternative
Register a binding for every interface used as a constructor type-hint.

### Detection Checklist
- [ ] Interface type-hint without binding
- [ ] "Target is not instantiable" error
- [ ] Abstract class type-hint without binding

### Related Rules
Register Bindings for Every Interface Type-Hint (05-rules.md)

---

## Anti-Pattern 2: Required Primitive Parameters Without Defaults

### Category
Reliability

### Description
Constructor has required string/int/array parameters without default values — auto-resolution cannot synthesize primitives.

### Preferred Alternative
Always provide default values for primitive constructor parameters, or register an explicit binding.

### Detection Checklist
- [ ] Required primitive without default
- [ ] `make()` fails with "Unresolvable dependency"
- [ ] All callers must use `makeWith()`

---

## Anti-Pattern 3: Deep Constructor Dependency Chains

### Category
Performance

### Description
5+ levels of auto-resolved constructor dependencies — each level adds recursive reflection overhead.

### Preferred Alternative
Flatten the dependency graph. Inject shared dependencies directly instead of through intermediaries.

### Detection Checklist
- [ ] 5+ levels of constructor nesting
- [ ] High resolution latency
- [ ] Hard-to-trace dependency graph

---

## Anti-Pattern 4: Relying on Auto-Resolution for Hot-Path Services

### Category
Performance

### Description
Services resolved on every request rely on auto-resolution instead of explicit bindings — reflection overhead on every call.

### Preferred Alternative
Pre-register hot-path bindings with explicit closures.

### Detection Checklist
- [ ] Hot-path service without explicit binding
- [ ] Reflection overhead measurable
- [ ] Octane worker start too slow

---

## Anti-Pattern 5: No Explicit Bindings for Interfaces at All

### Category
Architecture

### Description
Application has interfaces but zero bindings registered — assumes auto-resolution magically resolves them.

### Preferred Alternative
Register a binding for every interface. Use auto-resolution only for concrete classes.

### Detection Checklist
- [ ] Interfaces used without bindings
- [ ] Runtime "not instantiable" errors
- [ ] Missing composition root configuration
