# ECC Anti-Patterns — Service Locator Anti-Pattern

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Service Locator Anti-Pattern |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. `app()` in Business Logic
2. Container as Dependency
3. `resolve()` in Domain Classes
4. Mixed Injection: Constructor + app()
5. Facades Replacing Constructor Injection

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — service locator hides all dependency types
- Premature Caching — N/A

---

## Anti-Pattern 1: `app()` in Business Logic

### Category
Architecture

### Description
Using `app(Service::class)` inside services, repositories, or domain action classes.

### Why It Happens
Convenience — `app()` works without changing constructor signatures during prototyping.

### Warning Signs
- `app()` calls in method bodies
- Class signature hides actual dependencies
- Tests require container configuration before every test

### Why It Is Harmful
Hidden dependencies: the class's requirements are invisible — they only surface in method bodies. Testing becomes harder because every test must configure the container rather than passing constructor arguments.

### Real-World Consequences
A `ReportGenerator` calls `app(PdfEngine::class)`, `app(Cache::class)`, and `app(Logger::class)` in different methods. A developer adding a new feature doesn't know these dependencies exist. A test cannot simply instantiate `new ReportGenerator($engine)` — it must bootstrap the container.

### Preferred Alternative
Inject all dependencies via constructor. Reserve `app()` for service providers and top-level route files.

### Detection Checklist
- [ ] `app()`, `resolve()`, or `App::make()` in business classes
- [ ] Constructor injection not used despite multiple deps
- [ ] Tests require container setup for simple unit tests

### Related Rules
Service Locator Anti-Pattern (05-rules.md): Never Call `app()` in Business Logic.

### Related Skills
Service Locator Anti-Pattern (06-skills.md): Refactor `app()` to Constructor Injection.

### Related Decision Trees
Service Locator Anti-Pattern (07-decision-trees.md): D01 — app() vs Constructor Injection.

---

## Anti-Pattern 2: Container as Dependency

### Category
Architecture

### Description
Injecting `Container $container` and calling `$container->make()` in methods.

### How To Detect
- Constructor type-hints `Container`
- `->make()` called in methods
- No explicit dependency parameters

### Preferred Alternative
Inject each dependency explicitly.

### Detection Checklist
- [ ] Container type-hinted in constructor
- [ ] `->make()` calls in methods

### Related Rules
Service Locator Anti-Pattern (05-rules.md): N/A

### Related Skills
Service Locator Anti-Pattern (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: `resolve()` in Domain Classes

### Category
Architecture

### Description
Using the `resolve()` helper in domain logic — equivalent to `app()`.

### Preferred Alternative
Use constructor injection exclusively in domain classes.

### Detection Checklist
- [ ] `resolve()` in domain classes
- [ ] Hidden dependencies

### Related Rules
Service Locator Anti-Pattern (05-rules.md): N/A

### Related Skills
Service Locator Anti-Pattern (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Mixed Injection: Constructor + app()

### Category
Architecture

### Description
Some deps injected via constructor, others pulled via `app()` — inconsistent pattern.

### Preferred Alternative
All deps should be injected via constructor.

### Detection Checklist
- [ ] Both `app()` and constructor injection in same class
- [ ] Inconsistent dependency management

### Related Rules
Service Locator Anti-Pattern (05-rules.md): N/A

### Related Skills
Service Locator Anti-Pattern (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Facades Replacing Constructor Injection

### Category
Architecture

### Description
Relying entirely on facades in business logic instead of constructor injection.

### Preferred Alternative
Use constructor injection for domain dependencies. Use facades only in controllers and views.

### Detection Checklist
- [ ] Facades in domain services
- [ ] No constructor injection despite many facade calls

### Related Rules
Service Locator Anti-Pattern (05-rules.md): N/A

### Related Skills
Service Locator Anti-Pattern (06-skills.md): N/A

### Related Decision Trees
N/A
