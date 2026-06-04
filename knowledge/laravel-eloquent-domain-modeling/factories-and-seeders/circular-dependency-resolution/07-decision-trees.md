# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Circular Dependency Resolution
**Generated:** 2026-06-03

---

# Decision Inventory

* recycle() vs afterCreating() for cycle breaking
* Nullable FK vs recycle() approach
* Documentation strategy

---

# Architecture-Level Decision Trees

---

## recycle() vs afterCreating() for Cycle Breaking

---

## Decision Context

Choosing between `recycle()` and `afterCreating()` callback to break circular factory dependencies.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the cycle between exactly 2 models where one can exist independently?
↓
YES → Use `recycle()` — pre-create independent side, reuse across dependents
NO → Is the cycle across 3+ models where none can be pre-created?
    YES → Use `afterCreating()` — defer relationship creation to post-persistence callback
    NO → Is the circular appearance a bug (unidirectional relationship)?
        YES → Fix the relationship design — no cycle-breaking needed

---

## Recommended Default

**Default:** `recycle()` for 2-model cycles
**Reason:** Simpler, cleaner, avoids afterCreating callbacks.

---

## Risks Of Wrong Choice

Using `afterCreating()` when `recycle()` would work adds callback complexity. Using `recycle()` with 3+ model interdependent cycles still causes recursion.

---

## Related Rules

* Use recycle() to Break Circular Dependencies
* Defer the Dependent Side of a Cycle to afterCreating

---

## Related Skills

* Resolve Circular Factory Dependency with recycle()

---

## Nullable FK vs recycle() Approach

---

## Decision Context

Choosing between making a foreign key nullable to break a cycle vs using `recycle()`.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the domain allow the foreign key to be nullable (is the relationship optional)?
↓
YES → Prefer nullable FK design — cleaner architecture, no factory workaround needed
NO → Is the FK required for domain invariants?
    YES → Use `recycle()` — preserves domain integrity while breaking the cycle
    NO → Make FK nullable — simplifies both domain and factory

---

## Recommended Default

**Default:** Nullable FK when domain allows it
**Reason:** Cleaner domain model, no factory cycle-breaking needed.

---

## Risks Of Wrong Choice

Making a required FK nullable to solve a factory problem weakens domain integrity. Using `recycle()` when a nullable FK is domain-appropriate adds unnecessary factory complexity.

---

## Related Rules

* Break Every Circular Factory Dependency Before Seeding

---

## Related Skills

* Resolve Circular Factory Dependency with recycle()

---

## Documentation Strategy

---

## Decision Context

Deciding how to document circular dependency resolutions for future maintainers.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Has a circular dependency been resolved in the factory?
↓
YES → Is the resolution documented in the factory class docblock?
    YES → Also trace the cycle path — show which factory creates which
    NO → Add documentation — without it, maintainers may reintroduce the cycle
NO → No documentation needed

---

## Recommended Default

**Default:** Document cycle path and resolution in factory docblock
**Reason:** Prevents regression where a new developer inadvertently reintroduces the cycle by adding a reciprocal relationship.

---

## Risks Of Wrong Choice

Undocumented cycle resolutions are easily reintroduced when factories or relationships are modified.

---

## Related Rules

* Document Circular Dependency Resolutions in Factory DocBlocks

---

## Related Skills

* Resolve Circular Factory Dependency with recycle()
