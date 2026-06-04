# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Premature abstraction and YAGNI violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Abstract now vs wait for second implementation
* Decision 2: Accept duplication vs extract shared abstraction
* Decision 3: Repository pattern for every model vs selective application

---

# Architecture-Level Decision Trees

---

## Decision: Abstract Now vs Wait for Second Implementation

---

## Decision Context

Decide whether to introduce an abstraction (interface, factory, strategy) now or wait until a concrete second implementation exists.

---

## Decision Criteria

* performance considerations: premature abstraction adds code volume without value
* architectural considerations: abstractions at system boundaries are justified even with one implementation
* security considerations: security abstractions should be made early, not deferred
* maintainability considerations: each abstraction adds cognitive load; should pay for itself

---

## Decision Tree

Does the abstraction cross an architectural boundary as a hexagonal port?
↓
YES → Abstract now (port interface is justified even with one implementation)
NO → Is there a confirmed second implementation within the current release?
    YES → Abstract now (concrete need exists)
    NO → Is this a security-related abstraction?
        YES → Abstract now (security abstractions justify early investment)
        NO → Is the abstraction trivial (one interface, one implementation with negligible overhead)?
            YES → Abstract now (negligible cost, consistent convention)
            NO → Wait for second implementation (YAGNI)
                ↓
                Can the concrete code be refactored to the abstraction later?
                YES → Write concrete code now; extract when second variant emerges
                NO → Abstract now (hard to refactor later justifies early abstraction)

---

## Rationale

YAGNI says delay abstraction until concrete need emerges. Exceptions: hexagonal ports (always abstracted), security abstractions (early investment justified), and trivial abstractions (negligible cost). For everything else, write concrete code first and extract when the second implementation is confirmed.

---

## Recommended Default

**Default:** Write concrete code first; extract abstraction only when the second implementation is confirmed.

**Reason:** Most speculative abstractions are never used. Writing concrete code first is faster, simpler, and easier to change. Extract when real duplication or variation emerges.

---

## Risks Of Wrong Choice

Premature abstraction: unnecessary complexity, unused code paths, navigation overhead, slower delivery. Never abstracting: duplicated code, missed reuse opportunities, harder to add second variant.

---

## Related Rules

- Rule 1: Add abstraction only when a clear, concrete need for the second implementation exists
- Rule 3: Prefer duplication over the wrong abstraction

---

## Related Skills

- Avoid Premature Abstraction and YAGNI Violations
- Balance Interface Granularity

---

## Decision: Accept Duplication vs Extract Shared Abstraction

---

## Decision Context

When two pieces of code appear similar, decide whether to accept duplication or extract a shared abstraction.

---

## Decision Criteria

* performance considerations: shared abstraction adds indirection but reduces total code
* architectural considerations: sharing across bounded contexts creates coupling
* security considerations: security logic should be shared, not duplicated
* maintainability considerations: wrong abstraction is worse than duplication

---

## Decision Tree

Do the two pieces of code serve the same business purpose?
↓
YES → Will they evolve together (same rate and direction of change)?
    YES → Extract shared abstraction (they are the same concept)
    NO → Accept duplication (they will diverge; shared abstraction would be wrong)
NO → Do they serve different business purposes despite looking similar?
    YES → Accept duplication (similar code ≠ same concept)
    NO → Apply the "Rule of Three"
        ↓
        Has the pattern appeared three times?
        YES → Extract shared abstraction (three occurrences confirm the pattern)
        NO → Accept duplication (wait for third occurrence)

---

## Rationale

"Prefer duplication over the wrong abstraction" (Sandi Metz). Similar-looking code that serves different purposes will diverge over time. Premature unification creates a rigid abstraction that is wrong for both use cases. Wait for the third occurrence to confirm the pattern before extracting.

---

## Recommended Default

**Default:** Accept duplication until the "Rule of Three" confirms the pattern.

**Reason:** Two occurrences could be coincidental. Three occurrences strongly suggest a genuine reusable concept. Waiting for the third avoids premature abstraction while still capturing proven patterns.

---

## Risks Of Wrong Choice

Extracting from two occurrences: wrong abstraction, both consumers need workarounds. Never extracting: excessive duplication when the pattern is confirmed, missed reuse opportunity.

---

## Related Rules

- Rule 3: Prefer duplication over the wrong abstraction
- Rule 4: Wait for the third occurrence before extracting a generic solution

---

## Related Skills

- Avoid Premature Abstraction and YAGNI Violations
- Detect Premature Abstraction YAGNI Violations

---

## Decision: Repository Pattern for Every Model vs Selective Application

---

## Decision Context

Determine whether to use the Repository pattern for data access or use Eloquent models directly.

---

## Decision Criteria

* performance considerations: repository adds indirection; Eloquent direct access is faster
* architectural considerations: repository enables domain-to-infrastructure separation
* security considerations: repository can enforce data access policies
* maintainability considerations: repository every model adds overhead; selective application is balanced

---

## Decision Tree

Is the application using Hexagonal/Clean Architecture with a separate domain layer?
↓
YES → Repository for every aggregate root (domain-agnostic persistence is required)
NO → Does the model have complex business logic that needs to be testable without the database?
    YES → Repository for that model (testability justifies abstraction)
    NO → Is the model likely to need database migration (Eloquent → Doctrine) within 2 years?
        YES → Repository (persistence abstraction will pay off)
        NO → Does the model have non-standard persistence (file storage, external API, cache)?
            YES → Repository (hides persistence complexity behind consistent interface)
            NO → Use Eloquent directly (repository adds overhead without benefit)

---

## Rationale

Repository for every Eloquent model is a common premature abstraction in Laravel projects. In Hexagonal/Clean Architecture, repositories are required as domain ports. In conventional Laravel, repositories are justified only for models with complex testability needs, likely database migrations, or non-standard persistence.

---

## Recommended Default

**Default:** Use Eloquent directly for standard CRUD models; apply Repository pattern selectively for models with complex logic or non-standard persistence.

**Reason:** Most Eloquent models are straightforward CRUD where a repository layer adds unnecessary indirection without benefit. Reserve repositories for cases where the abstraction pays for itself.

---

## Risks Of Wrong Choice

Repository for every model: excessive abstraction, YAGNI violation, slower development, navigation overhead. Repository for no models: Eloquent models coupled to domain logic, testability requires database, hard to switch databases.

---

## Related Rules

- Rule 1: Add abstraction only when a clear, concrete need for the second implementation exists
- Rule 5: Remove an abstraction that is no longer pulling its weight

---

## Related Skills

- Avoid Premature Abstraction and YAGNI Violations
- Design a Rich Domain Model
- Design Hexagonal Architecture Ports and Adapters
