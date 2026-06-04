# ECC Anti-Patterns — Circular Dependency Detection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Circular Dependency Detection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Endless Constructor Recursion From Self-Referencing Binding
2. Crossing Singleton-Transient Boundaries Creates Hidden Circularity
3. Circular Dependency Only Visible Under Specific Resolution Order
4. Only Detecting at Runtime Instead of Development Time
5. Not Using Aliases to Break the Circle

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — circular detection uses recursion tracing, not queries
- Premature Caching — detection runs on every resolution to track recursion depth

---

## Anti-Pattern 1: Endless Constructor Recursion From Self-Referencing Binding

### Category
Reliability

### Description
A class's constructor requires itself — the container recurses until hitting the max depth limit.

### Why It Happens
Adding a dependency on a class that (directly or transitively) requires the original class.

### Warning Signs
- `CircularDependencyException: "Circular dependency detected"`
- Resolution hangs or hits recursion limit
- Constructor parameter references own class

### Why It Is Harmful
Laravel's container tracks resolution depth with a `$resolving` counter. When `make()` is called, it increments this counter. Each recursive `make()` call further increments. If the counter exceeds `$maxDepth` (default 100) or PHP's call stack overflows first, the container throws `CircularDependencyException`. The developer gets a runtime failure that is difficult to debug because the actual cycle may be 3+ levels deep with indirect dependencies.

### Preferred Alternative
Use setter injection or event-driven architecture for one direction of the circular relationship. Explicitly break the cycle with a factory or callback.

### Detection Checklist
- [ ] Class depends on itself directly or indirectly
- [ ] `CircularDependencyException` at runtime
- [ ] Resolution timeout or crash

### Related Rules
Use Setter Injection to Break Circular Dependencies (05-rules.md)

---

## Anti-Pattern 2: Crossing Singleton-Transient Boundaries Creates Hidden Circularity

### Category
Architecture

### Description
Singleton A depends on Transient B which depends on Singleton A — container cannot resolve either without circular detection.

### Preferred Alternative
Extract the shared state into a separate service that both can depend on.

### Detection Checklist
- [ ] Singleton-transient-singleton chain
- [ ] Circular dependency crossing lifecycle boundaries
- [ ] Extracting shared state resolves it

---

## Anti-Pattern 3: Circular Dependency Only Visible Under Specific Resolution Order

### Category
Reliability

### Description
Code works in development because resolution order avoids the cycle, but fails in production because of different provider ordering.

### Preferred Alternative
Break the cycle always, not just when it fails. Run static analysis to detect all potential cycles.

### Detection Checklist
- [ ] Cycle only reproduces with specific provider order
- [ ] Intermittent resolution failure
- [ ] Environment-dependent behavior

---

## Anti-Pattern 4: Only Detecting at Runtime Instead of Development Time

### Category
Testing

### Description
Waiting for `CircularDependencyException` in production instead of detecting cycles with static analysis.

### Preferred Alternative
Run a test that resolves every registered binding and catches circular dependencies.

### Detection Checklist
- [ ] No circular dependency test
- [ ] Detection only at runtime
- [ ] No static analysis or CI check

---

## Anti-Pattern 5: Not Using Aliases to Break the Circle

### Category
Architecture

### Description
Circular dependency between two classes where one could delay resolution via an interface alias.

### Preferred Alternative
Extract an interface. Have one side depend on a lazy-loadable proxy or interface alias.
