# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Domain Entity to Eloquent Model Mapping
**Generated:** 2026-06-04

---

# Decision Inventory

* Explicit mapper class vs Eloquent custom casts
* Full replacement vs diff-based persistence for Aggregate updates
* Eager loading vs lazy loading in hydrators
* Identity type: UUID vs auto-increment

---

# Architecture-Level Decision Trees

---

## Explicit Mapper Class vs Eloquent Custom Casts

---

## Decision Context

Value Objects and simple conversions can be handled by Eloquent custom casts or by explicit mapper classes. The choice affects complexity, layer separation, and maintainability.

---

## Decision Criteria

* performance considerations — casts are slightly faster; mapper overhead is negligible
* architectural considerations — casts couple to Eloquent; mappers keep Domain pure
* security considerations — no difference
* maintainability considerations — casts are simpler; mappers are more explicit

---

## Decision Tree

Value Object is simple (single column, straightforward conversion)?
↓
YES → Does the project enforce strict Domain/Infrastructure separation?
    YES → Use explicit mapper — keeps Domain free of Eloquent dependency
    NO → Use Eloquent custom cast — simpler, less code
NO → Value Object is complex (multiple columns, nested objects, business logic in conversion)?
    YES → Use explicit mapper — casts are too limited
    NO → Use explicit mapper — if in doubt, explicit is safer

---

## Rationale

Eloquent casts are convenient for simple Value Objects (Email, Money as integer) but cannot handle complex conversions involving multiple columns or related entities. Mappers handle any complexity but require more code.

---

## Recommended Default

**Default:** Eloquent cast for simple VO; explicit mapper for complex.
**Reason:** Simpler is better for simple cases. Complex cases need the flexibility of mappers.

---

## Risks Of Wrong Choice

Casts for complex VOs: hard to maintain, limited by cast interface. Mappers for simple VOs: unnecessary boilerplate.

---

## Related Rules

- Rule: Mapper in Infrastructure Layer (LAP-10/05-rules.md)

---

## Related Skills

- Implement Value Objects (LAP-07/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)

---

## Full Replacement vs Diff-Based Persistence

---

## Decision Context

When persisting an Aggregate, changes can be applied by replacing all related data (delete + re-insert) or by computing a diff and applying only changed fields.

---

## Decision Criteria

* performance considerations — replacement is simpler but may be slower for large aggregates
* architectural considerations — diff requires change tracking; replacement is stateless
* security considerations — no difference
* maintainability considerations — replacement is simpler and less error-prone

---

## Decision Tree

Aggregate has few related entities (<10 per parent)?
↓
YES → Full replacement (delete all relations, re-insert)
    Simpler, less code, no change tracking needed
NO → Aggregate is performance-critical with frequent partial updates?
    YES → Diff-based persistence
        Track changes: new, modified, deleted entities
        Only persist changed fields
    NO → Full replacement
        Simpler, safer, and most aggregates are small

---

## Rationale

Full replacement is simpler and less error-prone. For small aggregates, the performance cost of delete+re-insert is negligible. Diff-based persistence is only justified for large aggregates where full replacement causes measurable performance impact.

---

## Recommended Default

**Default:** Full replacement for most aggregates.
**Reason:** Simple, stateless, no change tracking complexity. Diff only when profiling shows a problem.

---

## Risks Of Wrong Choice

Full replacement for large aggregates: unnecessary deletes and inserts. Diff for small aggregates: change tracking complexity without benefit.

---

## Related Rules

- Rule: Handle Nested Entities Recursively (LAP-10/05-rules.md)

---

## Related Skills

- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)

---

## Eager Loading vs Lazy Loading in Hydrators

---

## Decision Context

When hydrating a Domain Aggregate from Eloquent Models, related data can be eager-loaded (single query with joins) or lazy-loaded (query per relationship).

---

## Decision Criteria

* performance considerations — eager loading prevents N+1; lazy loading causes query explosion
* architectural considerations — eager loading requires knowing relationships upfront
* security considerations — no difference
* maintainability considerations — eager loading is explicit; lazy loading is implicit

---

## Decision Tree

Are all required relationships known when the Aggregate is loaded?
↓
YES → Use eager loading (Model::with(...))
    Single query, no N+1 risk
    Relationships explicitly documented in the load call
NO → Are some relationships conditionally needed?
    YES → Eager load always-needed relationships
        Lazy load conditional relationships if unavoidable
    NO → Could lazy loading cause N+1 query explosion?
        YES → Eager load everything — N+1 is unacceptable
        NO → Lazy loading is acceptable for simple cases

---

## Rationale

Eager loading prevents the N+1 query problem that plagues lazy-loaded relationships in hydrators. The cost of eager loading unused relationships is typically lower than the cost of N+1.

---

## Recommended Default

**Default:** Eager load ALL known relationships in Repository methods.
**Reason:** N+1 is the most common performance issue in hydrators. Eager loading prevents it at minimal cost.

---

## Risks Of Wrong Choice

Lazy loading: N+1 query explosion, slow page loads. Eager loading everything: potential data over-fetching for unused relationships.

---

## Related Rules

- Rule: Handle Nested Entities Recursively (LAP-10/05-rules.md)

---

## Related Skills

- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
