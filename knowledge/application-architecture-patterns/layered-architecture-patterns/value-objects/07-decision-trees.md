# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Value Objects in Laravel
**Generated:** 2026-06-04

---

# Decision Inventory

* Value Object vs primitive for domain concept
* Value Object vs Entity for domain concept
* PHP readonly class vs final class with readonly properties
* Named constructor vs plain constructor for creation
* Explicit mapping vs Eloquent casts for persistence

---

# Architecture-Level Decision Trees

---

## Value Object vs Primitive for Domain Concept

---

## Decision Context

Every domain attribute can be represented as a primitive (string, int) or as a Value Object. The choice affects type safety, validation, and code clarity.

---

## Decision Criteria

* performance considerations — Value Objects add allocation overhead (negligible)
* architectural considerations — Value Objects provide type safety and self-validation
* security considerations — Value Object validation is defense-in-depth
* maintainability considerations — Value Objects reduce scattered validation

---

## Decision Tree

Does the attribute have validation rules or business meaning beyond "it's a string/int"?
↓
YES → Is the validation rule used in multiple places?
    YES → Value Object — encapsulate validation once
    NO → Will the attribute benefit from type safety in signatures?
        YES → Value Object — Email $email vs string $email
        NO → Primitive — no validation, no type safety benefit
NO → Primitive is sufficient (simple IDs, basic names)

---

## Rationale

Value Objects earn their keep when they eliminate scattered validation logic. If a primitive is validated in 5 places, a single Value Object with constructor validation eliminates 4 of those checks.

---

## Recommended Default

**Default:** Value Object when validation exists; primitive when it does not.
**Reason:** Value Object overhead is minimal. The safety benefit of constructor validation outweighs the allocation cost in all but the most performance-critical paths.

---

## Risks Of Wrong Choice

Over-Value-Object-ing creates unnecessary classes. Under-Value-Object-ing leaves validation scattered.

---

## Related Rules

- Rule: Validate on Construction (LAP-07/05-rules.md)
- Rule: Use Value Objects as Type Hints (LAP-07/05-rules.md)

---

## Related Skills

- Implement Value Objects (LAP-07/06-skills.md)

---

## Value Object vs Entity

---

## Decision Context

Some domain concepts could be modeled as either Value Objects (immutable, value equality) or Entities (identity tracked, mutable). The choice affects how data is persisted, compared, and updated.

---

## Decision Criteria

* performance considerations — Entities are more expensive to persist
* architectural considerations — Entities require Repositories; VOs do not
* security considerations — VOs are safer due to immutability
* maintainability considerations — VOs are simpler; Entities require identity management

---

## Decision Tree

Does the concept have a thread of identity that persists over time?
↓
YES → Entity — identity matters when attributes change
    Example: User, Invoice (same identity even when all attributes change)
NO → Can two instances with the same values be swapped without consequence?
    YES → Value Object — defined by value
    NO → Entity — identity distinguishes instances with same values

---

## Rationale

If the business distinguishes between two objects with the same data (e.g., two payments of the same amount on the same day but one was refunded), use Entity. If they are interchangeable, use Value Object.

---

## Recommended Default

**Default:** Value Object unless identity tracking is explicitly required.
**Reason:** Value Objects are simpler to implement, test, and persist.

---

## Risks Of Wrong Choice

VO where Entity needed: inability to track separate lifecycles. Entity where VO needed: unnecessary identity management overhead.

---

## Related Rules

- Rule: Value Objects Are Readonly and Immutable (LAP-07/05-rules.md)
- Rule: Implement Equality Comparison (LAP-07/05-rules.md)

---

## Related Skills

- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)

---

## Explicit Mapping vs Eloquent Casts for Persistence

---

## Decision Context

Value Objects stored in the database must be converted between PHP objects and database values. The choice is between explicit mapping in Repository code and Eloquent cast classes.

---

## Decision Criteria

* performance considerations — casting is more efficient; mapping adds overhead
* architectural considerations — casting couples Value Object to Eloquent; mapping keeps them separate
* security considerations — casting adds a validation layer at the ORM boundary
* maintainability considerations — casting is simpler; mapping is more explicit

---

## Decision Tree

Value Object is simple (single property, single table column)?
↓
YES → Does the project use DDD with strict Domain/Infrastructure separation?
    YES → Explicit mapping in Infrastructure Repository
        Keeps Domain pure; no Eloquent dependency in VO
    NO → Eloquent custom cast
        Simpler; acceptable for non-DDD projects
NO → Value Object is complex (multiple properties, multiple columns)?
    YES → Explicit mapping — cast handles simple cases only

---

## Rationale

Eloquent casts are convenient but couple the Value Object or cast class to Eloquent. For DDD projects with strict layer separation, explicit mapping in Infrastructure is preferred. For simpler projects, casts are acceptable.

---

## Recommended Default

**Default:** Eloquent custom cast for simple VOs; explicit mapping for complex ones.
**Reason:** Simpler is better unless layer separation demands explicit mapping.

---

## Risks Of Wrong Choice

Cast for complex VOs: hard to maintain. Explicit mapping for simple VOs: unnecessary boilerplate.

---

## Related Rules

- Rule: Value Objects Are Readonly and Immutable (LAP-07/05-rules.md)

---

## Related Skills

- Implement Value Objects (LAP-07/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
