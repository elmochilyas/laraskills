# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Clean / Onion / Hexagonal Architecture
**Knowledge Unit:** Vertical Slice Architecture as emerging alternative
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Vertical Slices vs Layered Architecture choice per project
* Decision 2: What goes in Shared Kernel vs duplicated per slice
* Decision 3: Slice granularity — feature vs sub-feature vs operation

---

# Architecture-Level Decision Trees

---

## Decision: Vertical Slices vs Layered Architecture Choice Per Project

---

## Decision Context

Choose between organizing code by feature (Vertical Slices) or by technical layer (Layered Architecture).

---

## Decision Criteria

* performance considerations: controlled duplication in slices increases code volume
* architectural considerations: slices enable feature autonomy; layers enable cross-cutting consistency
* security considerations: slices can enforce security per feature; layers enforce security per layer
* maintainability considerations: slices improve feature cohesion; layers improve infrastructure consistency

---

## Decision Tree

Are features developed by independent teams with different release schedules?
↓
YES → Vertical Slice Architecture (feature autonomy, independent deployability)
NO → Does the team strongly prioritize DRY principles across all features?
    YES → Layered Architecture (shared services, less duplication overall)
    NO → Is the system a monolith preparing for service extraction?
        YES → Vertical Slice Architecture (natural extraction boundaries)
        NO → Is the business logic highly interconnected across features?
            YES → Layered Architecture (shared domain model across features)
            NO → Does the system have 5+ loosely related business capabilities?
                YES → Vertical Slices (clear feature boundaries reduce cognitive load)
                NO → Either; choose based on team preference

---

## Rationale

Vertical Slices trade duplication for autonomy. They excel when features are loosely related, developed by different teams, or likely to be extracted as services. Layered architecture excels when features share significant domain logic and DRY consistency is paramount.

---

## Recommended Default

**Default:** Start with Layered Architecture; adopt Vertical Slices when feature autonomy becomes a measurable need.

**Reason:** Layered Architecture is the safer default with fewer unknowns. Vertical Slices require tolerance of controlled duplication and a feature-team mindset.

---

## Risks Of Wrong Choice

Vertical Slices for tightly coupled features: excessive duplication, shared logic replicated inconsistently. Layered Architecture for loosely related features: unrelated features become coupled through shared infrastructure, hard to extract.

---

## Related Rules

- Rule 1: Each vertical slice is autonomous — no cross-slice sharing of models or services
- Rule 2: Slice by business capability, not by technical layer

---

## Related Skills

- Implement Vertical Slice Architecture
- Implement a Layered Architecture

---

## Decision: What Goes in Shared Kernel vs Duplicated Per Slice

---

## Decision Context

Determine which code belongs in a shared kernel (cross-slice) and which should be duplicated within each vertical slice.

---

## Decision Criteria

* performance considerations: duplicated code increases codebase size but reduces coupling
* architectural considerations: shared kernel creates coupling but prevents inconsistency
* security considerations: shared authentication logic must not be duplicated
* maintainability considerations: shared kernel changes affect all slices; duplicated changes affect one

---

## Decision Tree

Does the code represent a fundamental domain concept (Money, Email, OrderId)?
↓
YES → Shared Kernel (value objects must be consistent across slices)
NO → Does the code change at the same rate across all features?
    YES → Is the code stable (changes less than once per quarter)?
        YES → Shared Kernel (stable enough that coupling is safe)
        NO → Duplicate per slice (frequent shared changes cause coordination overhead)
    NO → Is the code infrastructure-level (HTTP client, cache implementation)?
        YES → Shared Kernel infrastructure (consistent tooling, one upgrade path)
        NO → Is duplication overhead (lines of code) > 10x the coordination overhead?
            YES → Shared Kernel (worth the coupling)
            NO → Duplicate per slice (controlled duplication)

---

## Rationale

Domain value objects belong in the Shared Kernel because inconsistency would be semantically incorrect. Infrastructure utilities are also good candidates. Everything else should be duplicated per slice unless the cost of duplication demonstrably exceeds the cost of coupling.

---

## Recommended Default

**Default:** Shared Kernel for domain value objects and stable infrastructure; duplicate everything else per slice.

**Reason:** Domain value objects must be consistent. Infrastructure duplication creates maintenance burden. Feature-level logic duplication provides autonomy at acceptable cost.

---

## Risks Of Wrong Choice

Too much in Shared Kernel: cross-slice coupling, coordinated changes needed, loss of slice autonomy. Too little in Shared Kernel: inconsistent value objects, duplicated infrastructure logic with drift.

---

## Related Rules

- Rule 1: Each vertical slice is autonomous — no cross-slice sharing of models or services
- Rule 4: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure

---

## Related Skills

- Implement Vertical Slice Architecture
- Decompose by Business Capability

---

## Decision: Slice Granularity — Feature vs Sub-Feature vs Operation

---

## Decision Context

Determine how fine-grained vertical slices should be — whether a slice represents a full feature, a sub-feature, or a single operation.

---

## Decision Criteria

* performance considerations: too many slices increase navigation overhead
* architectural considerations: proper granularity balances cohesion with slice count
* security considerations: each slice authenticates independently; reasonable count
* maintainability considerations: too coarse slices grow unmanageable; too fine create navigation chaos

---

## Decision Tree

Does the feature have multiple distinct sub-features with different stakeholders?
↓
YES → One slice per sub-feature (aligns with team ownership)
NO → Does the feature represent a single business capability?
    YES → Does the feature have more than 10 operations (endpoints)?
        YES → Split by sub-feature (10+ operations in one slice is too coarse)
        NO → One slice per feature (appropriate granularity)
    NO → Is the operation independently deployable or replaceable?
        YES → One slice per operation (fine-grained independence)
        NO → Is the operation part of a closely related group of operations?
            YES → One slice for the group
            NO → One slice per operation

---

## Rationale

Slice granularity should align with business capabilities and team ownership. A good rule of thumb: a slice should be understandable by reading one directory of fewer than 10 files. If a slice grows beyond that, consider splitting by sub-feature.

---

## Recommended Default

**Default:** One slice per business capability (e.g., Checkout, Returns, Inventory, Payments).

**Reason:** Business capability alignment provides natural boundaries that match team ownership and stakeholder concerns. This level of granularity balances autonomy with manageability.

---

## Risks Of Wrong Choice

Too coarse (entire module as one slice): slice complexity grows unmanageable, loss of feature isolation benefit. Too fine (one slice per HTTP method): excessive navigation, lost ability to understand related operations.

---

## Related Rules

- Rule 2: Slice by business capability, not by technical layer
- Rule 1: Each vertical slice is autonomous

---

## Related Skills

- Implement Vertical Slice Architecture
- Decompose by Business Capability
- Implement a Modular Monolith
