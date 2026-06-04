# ECC Anti-Patterns — Contextual Binding

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Contextual Binding |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Overusing Contextual Bindings for Simple Constructor Injection
2. Using Contextual Binding with Primitive Values When Named Resolution Works
3. Contextual Binding on Classes That Should Share a Single Implementation
4. Not Testing Contextual Bindings With Contract Tests
5. Using Contextual Binding as a Substitute for Factory Pattern

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — contextual bindings configure dependencies, not queries
- Premature Caching — contextual bindings are stored per class, not performance caches

---

## Anti-Pattern 1: Overusing Contextual Bindings for Simple Constructor Injection

### Category
Maintainability

### Description
Registering `give()` for every class variation when simple constructor parameters would suffice — creates configuration noise in providers.

### Why It Happens
Developers reach for contextual binding as the first solution when two classes need different implementations of the same interface.

### Warning Signs
- Dozens of `when(ClassA)->needs(InterfaceB)->give(...)` in a single provider
- Many contextual bindings for the same abstract
- Configuration scattered across providers

### Why It Is Harmful
Contextual bindings are not visible at the call site — you must read the service provider to understand which implementation a class receives. Every `when()->needs()->give()` line adds a lookup that the container performs at resolution time. When the binding list grows large (50+), the mental model of the dependency graph becomes opaque. Tests require reading provider configuration to know which implementation to mock.

### Preferred Alternative
Use explicit dependency injection with concrete classes, or create separate service classes. Use contextual binding only when two consumers genuinely need different implementations of the same interface.

### Detection Checklist
- [ ] 10+ contextual bindings in one provider
- [ ] Simple alternative injection pattern available
- [ ] Hard to trace which class gets which dependency

### Related Rules
Prefer Constructor Injection Over Contextual Binding (05-rules.md)

---

## Anti-Pattern 2: Using Contextual Binding with Primitive Values When Named Resolution Works

### Category
Framework Usage

### Description
`when(A)->needs('$limit')->give(100)` instead of letting the caller pass the value.

### Preferred Alternative
Use `makeWith()` with named parameters, or use configuration for defaults.

### Detection Checklist
- [ ] Contextual binding for primitive values
- [ ] Values could be passed directly
- [ ] Unnecessary provider complexity

---

## Anti-Pattern 3: Contextual Binding on Classes That Should Share a Single Implementation

### Category
Architecture

### Description
Giving different implementations to different consumers for what is conceptually the same dependency.

### Preferred Alternative
Re-examine the architecture. If consumers need different behavior, consider Strategy pattern.

### Detection Checklist
- [ ] Same interface, different implementations
- [ ] Conceptual dependency mismatch
- [ ] Confusing team conventions

---

## Anti-Pattern 4: Not Testing Contextual Bindings With Contract Tests

### Category
Testing

### Description
No tests verifying that each consumer receives the intended implementation.

### Preferred Alternative
Write a contract test: `make(Consumer::class)` and assert the dependency type.

### Detection Checklist
- [ ] No resolution contract test
- [ ] Contextual binding changed without test failure
- [ ] Implementation mismatch at runtime

---

## Anti-Pattern 5: Using Contextual Binding as a Substitute for Factory Pattern

### Category
Architecture

### Description
Using contextual binding to pass different configuration to 10+ consumers when a factory with runtime parameters is more appropriate.

### Preferred Alternative
Use Factory pattern. Inject the factory, not the configured dependency.
