# ECC Anti-Patterns — Action vs Service vs Use Case

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action vs Service vs Use Case |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. One-Size-Fits-All Pattern (All Operations Forced Into One Pattern)
2. God Service (Entity Service with 30+ Methods)
3. Action Applied to Pure Orchestration (Missing the Service Tier)
4. Use Case Applied When Action Would Suffice (Over-Engineering)
5. Missing DTO Boundary (Pattern by Convention, Not by Contract)

---

## Repository-Wide Anti-Patterns

- God Services (entity service with 30+ unrelated methods)
- Premature Abstraction (use case when action suffices)
- Overengineering (DTO boundary for every operation)
- Fat Controllers (no pattern applied at all)

---

## Anti-Pattern 1: One-Size-Fits-All Pattern

### Category
Architecture | Design

### Description
Forcing every business operation into a single pattern — all services, all actions, or all use cases — regardless of the operation's complexity, reuse requirements, or framework coupling tolerance.

### Why It Happens
Teams adopt one pattern early (often "we use services") and never reconsider. The pattern becomes dogma. "This is how we do things here."

### Warning Signs
- Every operation is a Service (30+ methods per file) OR every operation is an Action (200+ action files, 80% are CRUD pass-through)
- No one can explain why a particular pattern was chosen for a specific operation
- Pattern choice is based on "what we've always done" rather than operation characteristics

### Why It Is Harmful
Simpler operations get over-engineered (DTO/use case for a single model create). Complex operations outgrow the pattern (service with 30 methods). The codebase has no architectural flexibility.

### Real-World Consequences
A simple CRUD operation requires a DTO, use case interface, and repository — 4 files for one model create. Meanwhile, the billing service has 40 methods and is impossible to test.

### Preferred Alternative
Apply the three-tier decision framework: Service for entity-related operations, Action for single operations, Use Case for framework-agnostic contracts.

### Refactoring Strategy
1. Audit all operations in the codebase.
2. Apply the three-tier decision framework to each.
3. Extract operations that don't fit the current pattern.
4. Document the framework and criteria.

### Detection Checklist
- [ ] Are all operations in the same pattern regardless of complexity?
- [ ] Are there services with 20+ unrelated methods?
- [ ] Are there actions with zero business logic?

### Related Rules
- Rule: Apply the Three-Tier Decision Framework to Each Operation Individually

### Related Skills
- Skill: Choose the Right Pattern for a Business Operation

### Related Decision Trees
- Decision: Service vs Action vs Use Case

---

## Anti-Pattern 2: God Service (Entity Service with 30+ Methods)

### Category
Architecture | Maintainability

### Description
An entity service (e.g., `UserService`) with 30+ unrelated methods covering creation, validation, email sending, CSV export, password resets, and analytics — everything related to "User" in one file.

### Why It Happens
Entity-oriented grouping encourages adding every user-related operation to the same service. The file grows incrementally; no single addition seems problematic.

### Warning Signs
- Single service file exceeds 500 lines
- Service has 15+ public methods
- Methods have no clear grouping or shared context
- Single service file causes merge conflicts

### Why It Is Harmful
Impossible to test in isolation. Every test must mock 5+ dependencies even for a simple method. Merge conflicts are constant. The file becomes a bottleneck.

### Real-World Consequences
Two developers work on different user features. Both modify `UserService`. Merge conflict. The service has 40 methods and takes 2 seconds to load in the IDE.

### Preferred Alternative
Extract unrelated operations to action classes. The service retains only cohesive operations that share dependencies.

### Refactoring Strategy
1. Identify which methods share constructor dependencies.
2. Extract methods with unique dependencies to action classes.
3. Replace extracted method calls in callers with action invocations.
4. Reduce the service to its cohesive core.

### Detection Checklist
- [ ] Does a single service file have >500 lines or >15 methods?
- [ ] Do all methods share the same constructor dependencies?

### Related Rules
- Rule: Extract Non-Shared Operations from Entity Services to Actions

### Related Skills
- Skill: Choose the Right Pattern for a Business Operation
