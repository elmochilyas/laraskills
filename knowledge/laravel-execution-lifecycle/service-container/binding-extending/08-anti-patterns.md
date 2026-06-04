# ECC Anti-Patterns — Binding Extending

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Binding Extending |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using extend() on a Binding That Doesn't Exist Yet
2. Modifying Original Object State Instead of Wrapping in extend()
3. Order-Dependent Extenders (extend() Depends on Registration Order)
4. Using extend() for Cross-Cutting Concerns That Need Decorator Pattern
5. Not Using extend() When Third-Party Binding Needs Modification

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — extend() decorates instances, not queries
- Premature Caching — extend() runs after instance creation, not for performance

---

## Anti-Pattern 1: Using extend() on a Binding That Doesn't Exist Yet

### Category
Reliability

### Description
Registering `extend('service', fn(...))` before the service binding is registered — extender is silently discarded.

### Why It Happens
Service providers run in registration order (determined by `$app->register()` call order). An extender registered in an early provider for an abstract bound in a later provider is applied to an empty list and discarded.

### Warning Signs
- Extender callback never executed
- Service doesn't have expected decoration
- Provider dependency on registration order

### Why It Is Harmful
The container stores extenders internally per abstract. When `extend('X', $callable)` is called and no binding for 'X' exists yet, the extender is still stored — but if a binding is later registered via `bind()` or `singleton()` inside a service provider that hasn't booted yet AND that provider registers the binding inside `register()`, the extender may not fire. The behavior depends on provider ordering and registration vs. boot timing. The extender silently does nothing, and the service behaves as if the extender was never registered.

### Preferred Alternative
Register extend() in the same provider as the binding, or in a boot() method that runs after all register() calls. Always verify with a contract test.

### Detection Checklist
- [ ] Extender not firing
- [ ] Service missing expected decoration
- [ ] Provider requires specific registration order

### Related Rules
Register extend() After the Target Binding (05-rules.md)

---

## Anti-Pattern 2: Modifying Original Object State Instead of Wrapping in extend()

### Category
Reliability

### Description
Using `extend()` to call setter methods on the original resolved instance rather than returning a decorator/proxy.

### Preferred Alternative
Return a new decorator that wraps the original. Avoid mutating the original instance.

### Detection Checklist
- [ ] Setter calls on the resolved instance in extend()
- [ ] Shared state contamination
- [ ] Decorator pattern not used

---

## Anti-Pattern 3: Order-Dependent Extenders (extend() Depends on Registration Order)

### Category
Maintainability

### Description
Two extenders for the same abstract where one depends on the other running first.

### Preferred Alternative
Make extenders independent. Combine into one extender if they must run in sequence.

### Detection Checklist
- [ ] Two extenders for the same abstract
- [ ] Results differ by registration order
- [ ] Extender order test required

---

## Anti-Pattern 4: Using extend() for Cross-Cutting Concerns That Need Decorator Pattern

### Category
Architecture

### Description
Repeated extend() calls to add logging, caching, or metrics to individual services instead of using AOP or middleware.

### Preferred Alternative
Use Laravel middleware for HTTP-level concerns. Use dedicated decorator classes for service-level concerns.

### Detection Checklist
- [ ] Logging added via extend() on many services
- [ ] Cross-cutting concern repeated N times
- [ ] Middleware pattern more appropriate

---

## Anti-Pattern 5: Not Using extend() When Third-Party Binding Needs Modification

### Category
Framework Usage

### Description
Extending third-party classes through inheritance (subclassing) when extend() could decorate the binding.

### Preferred Alternative
Use `extend()` in a service provider to wrap or modify the third-party binding without changing third-party files.

### Detection Checklist
- [ ] Subclassing third-party service
- [ ] Overriding third-party provider
- [ ] extend() available but unused
