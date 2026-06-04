# ECC Anti-Patterns — Constructor Injection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Constructor Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Injection (Too Many Parameters)
2. Impure Constructors with I/O
3. Not Using Interface Type-Hints
4. Mixing Constructor Injection with `app()`
5. Missing Optional Defaults

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — constructors should not perform I/O
- Premature Caching — N/A

---

## Anti-Pattern 1: Over-Injection (Too Many Parameters)

### Category
Architecture

### Description
Constructor accepts 5+ dependencies — the class violates Single Responsibility Principle.

### Warning Signs
- Constructor with 5+ parameters
- Test setup requires excessive mock creation

### Preferred Alternative
Split the class into smaller, focused classes.

### Detection Checklist
- [ ] 5+ constructor parameters
- [ ] Multiple responsibilities in one class

### Related Rules
Constructor Injection (04-standardized-knowledge.md): Keep constructors pure; one dependency per parameter.

---

## Anti-Pattern 2: Impure Constructors with I/O

### Category
Reliability

### Description
Performing database queries, HTTP calls, or logging in the constructor.

### Preferred Alternative
Move I/O to dedicated methods or boot hooks.

### Detection Checklist
- [ ] `DB::query()` in constructor
- [ ] HTTP calls in constructor

### Related Rules
Constructor Injection (04-standardized-knowledge.md): Keep constructors pure — no I/O.

---

## Anti-Pattern 3: Not Using Interface Type-Hints

### Category
Architecture

### Description
Type-hinting concrete classes instead of interfaces in constructor parameters.

### Preferred Alternative
Type-hint interfaces; bind them in service providers.

### Detection Checklist
- [ ] Constructor params use concrete classes
- [ ] Interface exists but not used

### Related Rules
Constructor Injection (04-standardized-knowledge.md): Type-hint interfaces, not concretions.

---

## Anti-Pattern 4: Mixing Constructor Injection with `app()`

### Category
Architecture

### Description
Some dependencies injected via constructor, others resolved via `app()` in methods.

### Preferred Alternative
Inject all dependencies via constructor.

### Detection Checklist
- [ ] `app()` calls in method bodies
- [ ] Mixed resolution patterns

### Related Rules
Constructor Injection (04-standardized-knowledge.md): Prefer constructor injection over app().

---

## Anti-Pattern 5: Missing Optional Defaults

### Category
Reliability

### Description
Optional dependencies without `= null` defaults — resolution fails when the dependency isn't bound.

### Preferred Alternative
Use `?Type $dep = null` for optional dependencies.

### Detection Checklist
- [ ] Optional deps without defaults
- [ ] `BindingResolutionException` for non-critical deps

### Related Rules
Constructor Injection (04-standardized-knowledge.md): N/A
