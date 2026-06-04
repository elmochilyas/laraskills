# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Information Expert
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Method on domain model vs domain service
* Decision 2: Information Expert vs Low Coupling when they conflict
* Decision 3: Anemic domain model vs rich domain model

---

# Architecture-Level Decision Trees

---

## Decision: Method on Domain Model vs Domain Service

---

## Decision Context

Choose whether a responsibility belongs on a domain model (entity/value object) or in a separate domain service.

---

## Decision Criteria

* performance considerations: model method has zero overhead; service call adds dispatch
* architectural considerations: model method keeps behavior with data; service coordinates across models
* security considerations: model methods can enforce security at the entity level
* maintainability considerations: model methods are easier to find; services are better for cross-model logic

---

## Decision Tree

Does the operation require data from only one domain object?
↓
YES → Is that domain object the natural owner of the required data?
    YES → Method on the domain model (Information Expert: the model has the data)
    NO → Would adding the data to the model violate its cohesion?
        YES → Domain service (data doesn't belong in this model)
        NO → Add the data to the model and put the method there
NO → Does the operation require data from multiple domain objects?
    YES → Does one of the objects have all the data it needs internally?
        YES → Check if that object can request additional data via dependencies
        NO → Domain service (coordinates across multiple models)
    ↓
    Does the operation involve infrastructure (persistence, HTTP, file system)?
    YES → Application service, not domain service (infrastructure doesn't belong in domain layer)
    ↓
    Would the model need to depend on something domain-foreign (database, external API)?
    YES → Pure Fabrication or Application Service (model shouldn't know about infrastructure)
    NO → Domain method or domain service (keep in domain layer)

---

## Rationale

The Information Expert pattern says: assign the responsibility to the class that has the data needed to fulfill it. When the data lives in one model, put the method there. When data spans models, use a domain service. When infrastructure is involved, use an application service or Pure Fabrication.

---

## Recommended Default

**Default:** Method on the domain model if it uses only that model's data. Domain service for cross-model logic. Application service for infrastructure coordination.

**Reason:** Keeping behavior with data (rich domain model) is the ideal. Domain services handle operations that don't naturally belong on any single entity. Application services are for infrastructure orchestration.

---

## Risks Of Wrong Choice

Method on wrong model: model accumulates unrelated logic, low cohesion. Domain service for single-model logic: anemic domain model, scattered business rules.

---

## Related Rules

- Rule 1: Assign responsibility to the class that has the information needed to fulfill it
- Rule 2: Avoid "get-then-operate" patterns—move the operation to the data holder

---

## Related Skills

- Apply the Information Expert GRASP Pattern
- Design a Rich Domain Model

---

## Decision: Information Expert vs Low Coupling When They Conflict

---

## Decision Context

Choose between placing a method where the data lives (Information Expert) and placing it where coupling is minimized (Low Coupling).

---

## Decision Criteria

* performance considerations: coupling to infrastructure for data access is slow; coupling to domain objects is fast
* architectural considerations: Information Expert improves cohesion; Low Coupling improves change isolation
* security considerations: coupling to infrastructure expands the security perimeter
* maintainability considerations: both choices have maintenance costs; coupling to stable interfaces is acceptable

---

## Decision Tree

Would placing the method on the Information Expert introduce coupling to infrastructure (database, external API)?
↓
YES → Does the infrastructure dependency change often?
    YES → Privilege Low Coupling: move method to a Pure Fabrication (service, repository)
        ↓
        Can the data needed be passed as parameters to the service?
        YES → Service receives data as parameters (no coupling from the expert)
        NO → Service depends on the expert's interface (acceptable coupling to domain)
    NO → Would coupling to this specific infrastructure prevent reuse?
        YES → Privilege Low Coupling (different deployments may use different infrastructure)
        NO → Information Expert acceptable (infrastructure is stable enough)
NO → Would placing the method on the Information Expert create a circular dependency?
    YES → Privilege Low Coupling (circular coupling makes classes inseparable)
    ↓
    Would placing the method on the Information Expert increase its constructor dependencies beyond 5?
    YES → Privilege Low Coupling (too many dependencies makes the class fragile)
    ↓
    Does the method need to call multiple domain objects in sequence?
    YES → Domain service (coordinates; coupling to each domain service is acceptable)

---

## Rationale

Low Coupling generally trumps Information Expert when the choice is between them. A method that's slightly less local but keeps coupling low is better than perfectly local behavior that creates tight coupling. However, coupling to domain interfaces (not infrastructure) is acceptable and expected.

---

## Recommended Default

**Default:** Privilege Low Coupling over Information Expert when infrastructure is involved. For pure domain logic, keep Information Expert.

**Reason:** Coupling to infrastructure is the most expensive kind — it prevents testing, reuse, and portability. Coupling between domain objects through their interfaces is natural and manageable.

---

## Risks Of Wrong Choice

Information Expert with infrastructure coupling: model becomes untestable, vendor-locked, hard to port. Low Coupling without Information Expert: anemic domain model, scattered business logic.

---

## Related Rules

- Rule 3: Information Expert often conflicts with Low Coupling—privilege the latter

---

## Related Skills

- Apply the Information Expert GRASP Pattern
- Apply Low Coupling GRASP Pattern
- Apply Pure Fabrication GRASP Pattern

---

## Decision: Anemic Domain Model vs Rich Domain Model

---

## Decision Context

Choose between putting business logic in domain models (rich) or in services (anemic).

---

## Decision Criteria

* performance considerations: rich model has fewer indirections; anemic model requires coordination
* architectural considerations: rich model encapsulates behavior with data; anemic model scatters logic
* security considerations: rich model enforces invariants internally; anemic model relies on external enforcement
* maintainability considerations: rich model reduces duplication; anemic model is simpler for CRUD operations

---

## Decision Tree

Does the application domain have complex business rules (calculations, validations, state transitions)?
↓
YES → Rich domain model (complex rules belong with the data they operate on)
    ↓
    Does the team have the discipline to keep logic in models?
    YES → Rich domain model (requires discipline to resist putting logic in services)
    NO → Consider training and code review enforcement (rich model fails without discipline)
NO → Is the application primarily CRUD with minimal business logic?
    YES → Anemic style acceptable (simple data in/out; domain models as data containers)
    ↓
    Could the application evolve into having more complex rules?
    YES → Start with rich model (harder to migrate anemic to rich later)
    NO → Anemic model is appropriate
    ↓
    Does the business logic operate on data from a single entity?
    YES → Rich domain model (put the method on the entity)
    NO → Does the logic need data from multiple entities?
        YES → Domain service (if pure domain) or Application service (if infrastructure)
    ↓
    Is the model testable in isolation (no framework dependencies)?
    YES → Rich domain model is viable
    NO → Extract infrastructure dependencies to make model testable, then make it rich

---

## Rationale

A rich domain model keeps behavior with data, following the Information Expert pattern. This reduces logic duplication and makes the domain explicit in code. An anemic model is simpler for CRUD but becomes problematic as complexity grows — business rules end up scattered across services.

---

## Recommended Default

**Default:** Rich domain model for any application with meaningful business rules. Anemic model only for simple CRUD with no business logic.

**Reason:** Rich models are more maintainable as complexity grows. Migrating from anemic to rich is expensive and rarely done comprehensively.

---

## Risks Of Wrong Choice

Anemic for complex domain: scattered business rules, logic duplication, missed invariants. Rich for simple CRUD: over-engineered domain objects with behavior that's never used.

---

## Related Rules

- Rule 1: Assign responsibility to the class that has the information needed to fulfill it
- Rule 4: Different operations have different Information Experts—do not force all into one class

---

## Related Skills

- Apply the Information Expert GRASP Pattern
- Design a Rich Domain Model
- Detect and Refactor God Classes
