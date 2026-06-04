# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Aggregate Boundary Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Aggregate root identification
* Child entity access pattern
* Aggregate loading strategy

---

# Architecture-Level Decision Trees

---

## Aggregate Root Identification

---

## Decision Context

Identifying which model in a cluster of related models should serve as the aggregate root.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the model act as the entry point for all writes to related models?
↓
YES → Is the model responsible for enforcing invariants across related models?
    YES → This model is the aggregate root
    NO → The model may be a child entity within another's aggregate
NO → Are there models that cannot exist without this model?
    YES → This model is likely the aggregate root
    NO → This model may be a separate standalone aggregate

---

## Rationale

The aggregate root is the consistency guardian. It enforces invariants that span its children and is the only object external code can reference when modifying the aggregate. Children are internal implementation details.

---

## Recommended Default

**Default:** The "parent" in a HasMany relationship is the aggregate root
**Reason:** Parents naturally enforce invariants that span children (e.g., Order controls OrderItems).

---

## Risks Of Wrong Choice

Choosing the wrong aggregate root leads to invariant enforcement in the wrong place, scattered business logic, and inconsistent data when related models are modified independently.

---

## Related Rules

* Identify aggregate root for consistency
* Writes go through the aggregate root

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries

---

## Child Entity Access Pattern

---

## Decision Context

Determining how child entities within an aggregate are accessed and modified.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the access for reading or modifying child entities?
↓
Reading → Can the data be loaded via the root's relationship methods (e.g., `$order->items`)?
    YES → Load through root — standard access
    NO → Consider a dedicated read model or query
Modifying → Is the modification going through a root domain method?
    YES → Correct — root enforces invariants
    NO → Is direct child modification allowed?
        YES → WRONG — bypasses root invariants
        NO → Enforce modification through root methods only

---

## Rationale

Children should only be modified through aggregate root methods that enforce invariants. Direct child modification (e.g., `OrderItem::where(...)->update(...)`) bypasses the root's consistency guarantees.

---

## Recommended Default

**Default:** Modify children only through aggregate root domain methods
**Reason:** Ensures all invariants are enforced consistently.

---

## Risks Of Wrong Choice

Direct child modification leads to inconsistent aggregate state, duplicated invariant enforcement, and scattered business logic.

---

## Related Rules

* No direct API endpoints for child CRUD

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries

---

## Aggregate Loading Strategy

---

## Decision Context

Choosing how to load aggregate data from the database — loading the full aggregate vs partial loading.

---

## Decision Criteria

* performance

---

## Decision Tree

Is the operation a read or a write?
↓
Read → Is partial data sufficient for the read use case?
    YES → Load only required fields (select constraints, pagination)
    NO → Load the aggregate — but consider a dedicated read model for complex views
Write → Are invariants checked across the entire aggregate?
    YES → Load the full aggregate — all children needed for consistency checks
    NO → Can the write be scoped to a subset?
        YES → Load only what's needed for the specific domain method
        NO → Load the full aggregate

---

## Rationale

Write operations must load enough of the aggregate to enforce invariants. Read operations can optimize by loading only what the view needs.

---

## Recommended Default

**Default:** Load the full aggregate for writes
**Reason:** You cannot enforce invariants on data you haven't loaded.

---

## Risks Of Wrong Choice

Not loading enough data for write operations risks missing invariant violations. Loading too much for read operations wastes memory and query time.

---

## Related Rules

* Load entire aggregate for writes

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries
