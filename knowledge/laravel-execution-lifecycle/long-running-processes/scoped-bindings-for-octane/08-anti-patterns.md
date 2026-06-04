# ECC Anti-Patterns — Scoped Bindings for Octane

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Scoped Bindings for Octane |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Blind Singleton-to-Scoped Mass Conversion
2. Scoped-as-IO-Expensive-Catch-All
3. Registering Scoped in `register()` Without Sandbox Awareness
4. Using Scoped for Per-Coroutine State
5. Expecting Per-Coroutine Isolation from Scoped

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — scoped bindings address state isolation, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Blind Singleton-to-Scoped Mass Conversion

### Category
Performance

### Description
Converting every singleton to scoped without analyzing which need persistence.

### Why It Happens
Overreaction to singleton leak warnings during audit.

### Warning Signs
- All bindings registered as `scoped()`
- Connection pools, config readers, loggers converted
- Sandbox creation time increased 10-20ms

### Why It Is Harmful
Scoped adds overhead. Safe singletons (HTTP clients, config readers, loggers) should remain singleton. Blind conversion breaks lazy-loaded singletons that need persistence (connection pools).

### Preferred Alternative
Audit each binding individually. Only convert singletons with mutable per-request state.

### Detection Checklist
- [ ] Infrastructure services converted to scoped
- [ ] Sandbox overhead increased
- [ ] Connection pools not persisting

### Related Rules
Scoped Bindings (05-rules.md): N/A

### Related Skills
Scoped Bindings (06-skills.md): N/A

### Related Decision Trees
Scoped Bindings (07-decision-trees.md): D01 — Singleton vs Scoped Decision.

---

## Anti-Pattern 2: Scoped-as-IO-Expensive-Catch-All

### Category
Performance

### Description
Registering every service as scoped because "it might have state."

### Preferred Alternative
Use singleton for stateless services. Only use scoped for services with per-request mutable state.

### Detection Checklist
- [ ] All services scoped by default
- [ ] Unnecessary memory churn

### Related Rules
Scoped Bindings (05-rules.md): N/A

### Related Skills
Scoped Bindings (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Registering Scoped in `register()` Without Sandbox Awareness

### Category
Reliability

### Description
Registering scoped bindings in master container's `register()` without `OctaneSandbox` contract.

### Preferred Alternative
Implement `OctaneSandbox` contract or register per-request.

### Detection Checklist
- [ ] Scoped in `register()` without sandbox contract
- [ ] Scoped lifecycle never activates

### Related Rules
Scoped Bindings (05-rules.md): N/A

### Related Skills
Scoped Bindings (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Using Scoped for Per-Coroutine State

### Category
Architecture

### Description
Using scoped bindings for state that varies between coroutines within the same request.

### Preferred Alternative
Use `Swoole\Coroutine::getuid()` for coroutine-specific state.

### Detection Checklist
- [ ] Per-coroutine state in scoped binding
- [ ] Shared across coroutines in same request

### Related Rules
Scoped Bindings (05-rules.md): N/A

### Related Skills
Scoped Bindings (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Expecting Per-Coroutine Isolation from Scoped

### Category
Knowledge

### Description
Assuming scoped provides isolation between coroutines in Swoole.

### Preferred Alternative
Understand scoped = per-request, not per-coroutine.

### Detection Checklist
- [ ] Scoped shared across coroutines
- [ ] Coroutine-specific data mixed

### Related Rules
Scoped Bindings (05-rules.md): N/A

### Related Skills
Scoped Bindings (06-skills.md): N/A

### Related Decision Trees
N/A
