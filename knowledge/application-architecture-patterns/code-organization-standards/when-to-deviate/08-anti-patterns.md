# ECC Anti-Patterns — When to Deviate from Defaults

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | When to deviate from defaults: decision criteria |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Architecture Fashion-Following
2. Pre-Emptive Abstraction
3. Half-Migration
4. Deviation Without Enforcement

---

## Repository-Wide Anti-Patterns

- Overengineering
- Premature Abstraction
- Premature Optimization

---

## Anti-Pattern 1: Architecture Fashion-Following

### Category
Architecture

### Description
Adopting architectural patterns (Clean Architecture, DDD, Hexagonal) because they're popular, not because the project has measurable pain that these patterns solve. Building elaborate structures for a CRUD app with no complex business rules.

### Why It Happens
External influence (blog posts, conferences, thought leaders) without internal justification. Fear of being seen as "not doing real architecture."

### Warning Signs
- Cannot articulate the specific problem the deviation solves
- Architectural decisions precede any written feature code
- Pattern names used as justification ("because Clean Architecture")
- Abstractions with no concrete benefit

### Preferred Alternative
Start with Laravel defaults. Deviate only when specific, recurring friction is identified. Document the pain point before proposing the solution.

### Related Rules
R08: Start With Defaults, Evolve With Demonstrated Pain (COS-01/05-rules.md)

### Related Skills
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

---

## Anti-Pattern 2: Pre-Emptive Abstraction

### Category
Architecture

### Description
Building interfaces, repositories, and layers for "future needs" that may never materialize. Creating `PaymentServiceInterface` (with one implementation), `UserRepositoryInterface` (with one implementation), and repository layers before any multi-source data requirement exists.

### Why It Happens
Belief that interfaces always improve testability. Fear of future refactoring costs. Following enterprise Java patterns in PHP.

### Warning Signs
- Interface has exactly one implementation
- No second implementation is planned within 6 months
- Repository wraps Eloquent without adding behavior
- Tests mock the interface but the real implementation just calls Eloquent

### Preferred Alternative
Add interfaces only when a second implementation exists or is definitively planned. Use Eloquent directly. Extract interfaces when the need for abstraction is proven.

### Related Rules
R06: Never Create Repository-Wrapper Service Classes (COS-02/05-rules.md)

### Related Skills
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

---

## Anti-Pattern 3: Half-Migration

### Category
Code Organization

### Description
Some code in the new structure, some still in the old — neither consistently applied. Files for the same domain are split between flat and domain directories. The worst outcome because neither structure is complete.

### Why It Happens
Starting migration without completing it. Assuming incremental adoption works without a plan. Underestimating migration scope.

### Warning Signs
- Both old and new structures contain active code
- No migration timeline exists
- New files go to old structure because "that's where the other files are"
- Team isn't sure which structure is current

### Preferred Alternative
Complete migration or don't start. If incremental, plan phases with specific completion dates. Move all code for a domain at once, not file by file.

### Related Skills
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

---

## Anti-Pattern 4: Deviation Without Enforcement

### Category
Architecture

### Description
Creating a new directory structure but not enforcing it with architecture tests or code review rules. The new structure exists but files continue to be placed in old locations because there's no consequence for doing so.

### Why It Happens
Assuming directory structure alone provides organization. Belief that conventions will be followed without enforcement.

### Warning Signs
- New structure exists but old locations still receive new files
- No architecture tests check namespace placement
- Code review doesn't verify file placement
- "We switched to domain structure 6 months ago" but half the code is still flat

### Preferred Alternative
Every structural deviation must be backed by automated enforcement. Architecture tests should fail CI on placement violations.

### Related Skills
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)
