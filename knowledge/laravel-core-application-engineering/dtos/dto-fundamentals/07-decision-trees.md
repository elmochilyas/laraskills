# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO vs Raw Array (2-3 Layer Threshold)
* Per-Entity vs Per-Operation DTO
* Class-Level Readonly vs Individual Readonly Properties

---

# Architecture-Level Decision Trees

---

## Decision 1: DTO vs Raw Array (2-3 Layer Threshold)

---

## Decision Context

Whether to introduce a typed DTO or pass data as a raw array between application layers.

---

## Decision Criteria

* Number of application layers the data crosses
* Number of entry points that produce the same data shape
* Whether type safety and IDE autocompletion are needed
* Whether the data is a pass-through with no transformation

---

## Decision Tree

How many application layers does this data cross?
↓
1-2 layers (controller → service only)?
YES → Does the same data shape come from 2+ entry points (HTTP + CLI + queue)?
    YES → DTO recommended for consistent contract
    NO → Does the data have 3+ fields or any transformation?
        YES → DTO adds value for self-documenting signature
        NO → Use validated array — DTO adds ceremony without value
NO → 2-3+ layers (controller → service → action → repository)?
    YES → DTO recommended — type safety across multiple boundaries pays off
NO → Does the data cross a system boundary (package, API, microservice)?
    YES → DTO required — typed contract is the integration API
    NO → Use validated array

---

## Rationale

Every DTO adds ceremony: a class file, factory methods, serialization logic, tests. This ceremony is justified when data crosses multiple layers or entry points that benefit from a shared typed contract. For a simple controller-to-service pass-through, the validated array provides sufficient type safety with zero overhead.

---

## Recommended Default

**Default:** Use validated arrays for 1-2 layer flows with a single entry point. Introduce a DTO when data crosses 3+ layers, has 2+ entry points, or requires type transformation.
**Reason:** The DTO threshold ensures ceremony is only introduced when it provides measurable value in type safety, contract enforcement, or decoupling.

---

## Risks Of Wrong Choice

* DTO for simple flow: File proliferation, ceremony without value, slower iteration
* Array for multi-layer flow: Hidden contract, runtime errors on key typos, no IDE autocompletion
* Array for multi-entry-point flow: Inconsistent data shapes across callers

---

## Related Rules

* Apply the 2-3 Layer Threshold Before Introducing a DTO (05-rules.md)
* Never Include Business Logic Methods in DTOs (05-rules.md)

---

## Related Skills

* Skill: Implement a Baseline DTO
* Skill: Decide Whether to Introduce a DTO for a Data Flow

---

## Decision 2: Per-Entity vs Per-Operation DTO

---

## Decision Context

Whether to use a single per-entity DTO (`UserDto` for everything) or separate per-operation DTOs (`CreateUserDto`, `UserListDto`, `UserDetailDto`).

---

## Decision Criteria

* Codebase size and team structure
* How many operations use the same entity
* Proportion of nullable fields in a shared DTO
* Whether input and output shapes diverge significantly

---

## Decision Tree

What is the codebase size and team structure?
↓
Small application (< 30k LOC, single team)?
YES → Per-entity DTO acceptable (`UserDto` used for all operations) — less file proliferation
NO → Medium-to-large application (50k+ LOC, multiple teams)?
    YES → Does a shared `UserDto` have 30%+ nullable fields?
        YES → Per-operation DTOs required — nullables indicate different data shapes per operation
        NO → Per-entity DTO with docblock annotations may still work, but per-operation is safer
NO → Does the entity serve both input (create/update) and output (list/detail)?
    YES → Do input and output shapes share less than 50% of fields?
        YES → Separate input and output DTOs required
        NO → Single DTO with nullable fields may work — monitor for growth
    NO → Per-operation DTO for the specific use case

---

## Rationale

Per-entity DTOs are simpler but accumulate nullable fields as operations diverge. Per-operation DTOs have exactly the fields each operation needs with no nullables. The tradeoff is file count vs contract precision. At 50k+ LOC or 30%+ nullable fields, per-operation DTOs pay off.

---

## Recommended Default

**Default:** Per-entity DTO for small apps (< 30k LOC); per-operation DTOs for larger codebases or when nullable fields exceed 30%
**Reason:** Per-operation DTOs have zero nullable fields — each contract is exact. Per-entity DTOs are simpler but become ambiguous as the application grows.

---

## Risks Of Wrong Choice

* Per-entity for large app: Accumulated nullables, ambiguous contracts, consumers don't know what data is guaranteed
* Per-operation for small app: File proliferation, over-engineering for simple CRUD

---

## Related Rules

* Use Per-Operation DTOs for Larger Codebases (05-rules.md)

---

## Related Skills

* Skill: Implement a Baseline DTO

---

## Decision 3: Class-Level Readonly vs Individual Readonly Properties

---

## Decision Context

Whether to enforce immutability at the class level (`readonly class`) or on individual properties (`public readonly`).

---

## Decision Criteria

* PHP version (8.2+ vs 8.1)
* Whether the DTO extends a non-readonly class
* Team convention and consistency

---

## Decision Tree

Is the project targeting PHP 8.2+?
↓
YES → Use `readonly class` for all DTOs — language-level enforcement, zero boilerplate
NO → PHP 8.1 only?
    YES → Use `public readonly` on every promoted constructor property
NO → Does the DTO need to extend a non-readonly class?
    YES → Use `public readonly` on individual properties (PHP 8.2 restriction)
    NO → `readonly class` is the default and preferred approach

---

## Rationale

`readonly class` (PHP 8.2+) makes every property implicitly readonly with a single keyword. Individual `public readonly` is needed for PHP 8.1 compatibility or when extending non-readonly classes. Class-level is always preferred when available — it enforces consistency and eliminates the risk of forgetting `readonly` on a property.

---

## Recommended Default

**Default:** `readonly class` for PHP 8.2+; individual `public readonly` properties for PHP 8.1
**Reason:** Class-level enforcement is more consistent and prevents accidental mutable properties. Individual properties increase the risk of oversight.

---

## Risks Of Wrong Choice

* No readonly at all: Accidental mutation by intermediate layers corrupts data silently
* Individual readonly with oversight: One property without `readonly` creates a mutation backdoor
* Class-level readonly with extension: Cannot extend non-readonly classes (rare limitation)

---

## Related Rules

* Declare All DTOs as `readonly class` (05-rules.md)
* Always Use Constructor Promotion — Never Manually Assign Properties (05-rules.md)

---

## Related Skills

* Skill: Implement a Baseline DTO
* Skill: Apply Readonly Enforcement to a DTO

