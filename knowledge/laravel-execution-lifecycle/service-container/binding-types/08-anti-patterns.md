# ECC Anti-Patterns — Binding Types

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Binding Types |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Singleton with Mutable Internal State
2. Using singleton() for Request-Scoped State (Octane Data Leak)
3. Using instance() for Production Binding Registration
4. Mixing Binding Types in a Singleton's Dependency Graph
5. Using bind() Where singleton() Was Intended

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — binding types affect instance lifecycle, not query execution
- Premature Caching — singleton caching is about instance reuse, not performance data caching

---

## Anti-Pattern 1: Singleton with Mutable Internal State

### Category
Reliability

### Description
Registering a singleton that holds mutable state accumulated across consumers — state changes by one consumer affect all others.

### Why It Happens
Developers register services as singletons for performance without considering whether the service holds mutable state.

### Warning Signs
- Singleton service with setter methods that modify internal state
- Consumer A's configuration affects Consumer B's results
- Intermittent test failures from shared state

### Why It Is Harmful
A singleton serves the same instance to every consumer. If Consumer A calls `$service->setFormat('pdf')` and Consumer B calls `$service->generate()`, Consumer B gets a PDF output unexpectedly. The state accumulates across all consumers, creating non-deterministic behavior that is impossible to reproduce in isolation.

### Preferred Alternative
Use immutable data structures in singletons. Use `bind()` (transient) for services with mutable state.

### Detection Checklist
- [ ] Singleton with mutable properties
- [ ] Setter methods on singleton
- [ ] Cross-consumer state contamination

### Related Rules
Default to bind() for Stateless Services (05-rules.md)

---

## Anti-Pattern 2: Using singleton() for Request-Scoped State (Octane Data Leak)

### Category
Security

### Description
Registering services holding per-request state (auth user, tenant, locale) as `singleton()` — leaks data between requests under Octane.

### Preferred Alternative
Use `scoped()` for any service holding per-request mutable state.

### Detection Checklist
- [ ] Singleton holding auth user
- [ ] Singleton holding tenant context
- [ ] Octane deployment without singleton audit

---

## Anti-Pattern 3: Using instance() for Production Binding Registration

### Category
Framework Usage

### Description
Using `$app->instance()` in production service providers — bypasses extenders and resolution callbacks.

### Preferred Alternative
Use `singleton()` or `scoped()` with closure factories for production bindings.

### Detection Checklist
- [ ] `instance()` in production provider
- [ ] Service cannot be decorated
- [ ] Resolution callbacks don't fire

---

## Anti-Pattern 4: Mixing Binding Types in a Singleton's Dependency Graph

### Category
Reliability

### Description
Singleton depends on a transient service — transient is resolved once and held forever, becoming stale.

### Preferred Alternative
Inject a factory or use `scoped()` for the entire dependency graph.

### Detection Checklist
- [ ] Singleton depending on transient
- [ ] Stale dependency in singleton
- [ ] Hard-to-reproduce bugs

---

## Anti-Pattern 5: Using bind() Where singleton() Was Intended

### Category
Performance

### Description
Registering expensive-to-construct services as `bind()` (transient) when they could be shared — multiplied construction cost.

### Preferred Alternative
Profile construction cost and use `singleton()` or `scoped()` for expensive services.

### Detection Checklist
- [ ] Expensive service as transient
- [ ] Resolved multiple times per request
- [ ] High allocation overhead
