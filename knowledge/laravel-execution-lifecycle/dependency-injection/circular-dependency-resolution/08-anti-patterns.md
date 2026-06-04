# ECC Anti-Patterns — Circular Dependency Resolution (ku-09)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Circular Dependency Resolution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Locator to Break Cycles
2. Setter Injection for Cycles
3. Lazy Resolution as Default Fix
4. Ignoring the Exception Message
5. Interface Abstraction Without Refactoring

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — circular deps are about class design, not queries
- Premature Caching — cycles are design issues, not cache issues

---

## Anti-Pattern 1: Service Locator to Break Cycles

### Category
Architecture

### Description
Using `app(Service::class)` inside a method to "avoid" the container's circular dependency detection.

### Why It Happens
Developers see the `CircularDependencyException` and use `app()` as a quick workaround.

### Warning Signs
- `app()` calls in methods to resolve services that are also in the constructor
- Circular dependency originally existed, but "fixed" with service locator
- Tests cannot easily mock the resolved service

### Why It Is Harmful
ku-09 states: "Service locator to break cycles... the dependency is still circular, just hidden." The cycle still exists at the architectural level. The service locator just bypasses the container's detection, hiding the problem until runtime failures occur.

### Preferred Alternative
Extract the shared dependency into a third class that both A and B depend on, eliminating the cycle.

### Detection Checklist
- [ ] `app()` used to resolve cycle-prone dependencies
- [ ] Original cycle still exists in design
- [ ] Tests require mocking `app()`

### Related Rules
ku-09 (05-rules.md): N/A

### Related Skills
ku-09 (06-skills.md): N/A

### Related Decision Trees
ku-09 (07-decision-trees.md): D01 — Structural Refactor vs Lazy Resolution.

---

## Anti-Pattern 2: Setter Injection for Cycles

### Category
Architecture

### Description
Removing the circular dependency from the constructor and using setter injection to "break" the cycle.

### Why It Happens
Developers think moving the dependency from constructor to setter breaks the cycle.

### Warning Signs
- Classes with required setter methods called after construction
- Circular dependency moved from constructor to setter
- Incomplete object state after construction (requires setter call)

### Why It Is Harmful
ku-09 explicitly calls out: "Setter injection for cycles... still a cycle, just deferred." The setter is called after construction — the cycle still exists in the object graph. The class has incomplete state after construction, violating the principle of valid object state on instantiation.

### Preferred Alternative
Extract the shared concern into a third class or use event-driven decoupling.

### Detection Checklist
- [ ] Required setters on injected services
- [ ] Circular dependency moved from constructor to setter
- [ ] Incomplete state after construction

### Related Rules
ku-09 (05-rules.md): N/A

### Related Skills
ku-09 (06-skills.md): N/A

### Related Decision Trees
ku-09 (07-decision-trees.md): D01 — Structural Refactor vs Lazy Resolution.

---

## Anti-Pattern 3: Lazy Resolution as Default Fix

### Category
Architecture

### Description
Wrapping all circular dependencies in Closures instead of structurally fixing the cycle.

### Why It Happens
Lazy resolution is easier than refactoring.

### Preferred Alternative
Use lazy resolution only when structural refactoring is truly impossible.

### Detection Checklist
- [ ] All cycles wrapped in Closures
- [ ] No structural refactoring attempted

### Related Rules
ku-09 (05-rules.md): N/A

### Related Skills
ku-09 (06-skills.md): N/A

### Related Decision Trees
ku-09 (07-decision-trees.md): D01 — Structural Refactor vs Lazy Resolution.

---

## Anti-Pattern 4: Ignoring the Exception Message

### Category
Workflow

### Description
Not reading the full `CircularDependencyException` message, which includes the complete resolution chain.

### Preferred Alternative
Read the full exception stack trace — it shows exactly where the cycle forms.

### Detection Checklist
- [ ] Teammates ask "where is the cycle?"
- [ ] Exception message contains the answer

### Related Rules
ku-09 (05-rules.md): N/A

### Related Skills
ku-09 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Interface Abstraction Without Refactoring

### Category
Architecture

### Description
Creating an interface for one side of a circular dependency but not refactoring the actual cycle.

### Preferred Alternative
Interface abstraction alone does not break a cycle — restructure the dependency graph.

### Detection Checklist
- [ ] Interface created but cycle still exists
- [ ] Both A and B still depend on each other's interfaces

### Related Rules
ku-09 (05-rules.md): N/A

### Related Skills
ku-09 (06-skills.md): N/A

### Related Decision Trees
ku-09 (07-decision-trees.md): D01 — Structural Refactor vs Lazy Resolution.
