# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Domain-Driven Design Tactical Patterns in Laravel
**Generated:** 2026-06-04

---

# Decision Inventory

* DDD tactical patterns vs Active Record (Eloquent) for business logic
* Aggregate boundary identification
* Entity vs Value Object decision
* Synchronous vs deferred Domain Event dispatch

---

# Architecture-Level Decision Trees

---

## DDD Tactical Patterns vs Active Record (Eloquent)

---

## Decision Context

DDD adds significant structure: separate Domain classes, mapping code, Repository interfaces. Eloquent's Active Record pattern is simpler but couples business logic to the database. The choice affects testability, framework independence, and long-term maintainability.

---

## Decision Criteria

* performance considerations — DDD adds mapping overhead; AR is faster for simple cases
* architectural considerations — DDD provides framework independence; AR couples to Eloquent
* security considerations — DDD provides defense-in-depth through Domain validation
* maintainability considerations — DDD is more complex; AR is simpler

---

## Decision Tree

Business logic complexity?
↓
Simple CRUD — create, read, update, delete with no invariants?
YES → Active Record (Eloquent models)
    Business rules = 0; DDD adds ceremony without value
NO → Business logic has invariants (state machines, validations)?
    YES → DDD tactical patterns
        Aggregates protect invariants; Value Objects validate data
    NO → Team size > 5 and long project lifespan?
        YES → DDD (long-term maintainability benefit)
        NO → Active Record (simpler, faster)

---

## Rationale

DDD tactical patterns are justified when business invariants exist and must be protected. For simple CRUD, Active Record is sufficient. The decision is driven by invariant complexity, not codebase size.

---

## Recommended Default

**Default:** Active Record for CRUD; DDD for complex business rules.
**Reason:** DDD ceremony is only justified when business invariants exist. Active Record handles the majority of Laravel use cases.

---

## Risks Of Wrong Choice

DDD for simple CRUD: 2-4x file count, mapping complexity, developer frustration. Active Record for complex domains: untestable business logic, framework coupling, inability to extract domain.

---

## Related Rules

- Rule: Aggregate Root Enforces Invariants (LAP-06/05-rules.md)
- Rule: Domain Classes Have No Framework Dependencies (LAP-06/05-rules.md)

---

## Related Skills

- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Implement Three-Layer Architecture (LAP-01/06-skills.md)

---

## Aggregate Boundary Identification

---

## Decision Context

Identifying Aggregate boundaries is the most difficult DDD tactical decision. The boundary determines what consistency guarantees are enforced and what operations are transactional.

---

## Decision Criteria

* performance considerations — large Aggregates increase transaction contention
* architectural considerations — Aggregate boundary determines module cut
* security considerations — invariants enforced at Aggregate boundary
* maintainability considerations — smaller Aggregates are easier to maintain

---

## Decision Tree

Identify business invariants:
↓
Do entities A and B have an invariant that spans both?
YES → A and B are in the same Aggregate
    Invariant: "Order total must equal sum of line item totals"
NO → Does entity A reference entity B by identity only?
    YES → Different Aggregates (reference by ID, not object)
    NO → Are A and B always loaded and modified together?
        YES → Same Aggregate
        NO → Different Aggregates

---

## Rationale

The single deciding factor for Aggregate boundaries is consistency invariants. If two entities have an invariant that must be maintained atomically, they belong in the same Aggregate. If they can be eventually consistent, they are separate Aggregates.

---

## Recommended Default

**Default:** Smaller Aggregates (3-5 entities). Split when in doubt.
**Reason:** Small Aggregates reduce contention and are easier to refactor. Merging Aggregates is easier than splitting them.

---

## Risks Of Wrong Choice

Large Aggregates cause transaction contention and performance problems. Too-small Aggregates may miss consistency guarantees.

---

## Related Rules

- Rule: Keep Aggregates Small (LAP-06/05-rules.md)
- Rule: One Repository Per Aggregate Root (LAP-06/05-rules.md)

---

## Entity vs Value Object

---

## Decision Context

Every domain concept must be classified as Entity (has identity) or Value Object (defined by attributes). The classification affects equality semantics, mutability, and persistence strategy.

---

## Decision Criteria

* performance considerations — Value Objects are cheaper to create and compare
* architectural considerations — Entities require Repositories; Value Objects do not
* security considerations — Value Object immutability provides safety guarantees
* maintainability considerations — Value Objects are simpler; Entities require identity management

---

## Decision Tree

Does the concept have a thread of identity that persists over time?
↓
YES → Entity
    Identity matters even when all attributes change
    Examples: User, Invoice, Order (identity persists regardless of attribute changes)
NO → Is the concept defined entirely by its attributes? Would swapping two instances be meaningless?
    YES → Value Object
        Immutable, defined by attributes, interchangeable when values match
        Examples: Email, Address, Money, PhoneNumber
    NO → Re-evaluate modeling — most concepts are clearly Entity or Value Object

---

## Rationale

The Entity vs Value Object distinction is fundamental to domain modeling. Entities track identity over time. Value Objects describe characteristics. Getting this wrong creates equality bugs and confusion about mutability.

---

## Recommended Default

**Default:** Value Object unless identity tracking is required.
**Reason:** Value Objects are simpler (immutable, no identity management). Default to Value Object and upgrade to Entity only when identity is needed.

---

## Risks Of Wrong Choice

Value Object where Entity needed: inability to track history, identity confusion. Entity where Value Object needed: unnecessary identity management, mutable state bugs.

---

## Related Rules

- Rule: Implement Entities with Identity (LAP-06/05-rules.md)
- Rule: Value Objects Are Readonly and Immutable (LAP-06/05-rules.md)

---

## Related Skills

- Implement Value Objects (LAP-07/06-skills.md)
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
