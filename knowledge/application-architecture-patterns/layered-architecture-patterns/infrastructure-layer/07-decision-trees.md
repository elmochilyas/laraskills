# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Infrastructure layer: Eloquent implementations, external adapters
**Generated:** 2026-06-03

---

# Decision Inventory

* Explicit repository with mapping vs Eloquent direct in Infrastructure
* Single adapter per interface vs multi-implementation adapters
* Interface for every infrastructure class vs interface for variation points only

---

# Architecture-Level Decision Trees

---

## Explicit Repository with Mapping vs Eloquent Direct in Infrastructure

---

## Decision Context

Repository implementations can use explicit mapping (domain entity ↔ Eloquent model conversion) or use Eloquent models directly as the data representation. The choice affects framework independence and maintenance burden.

---

## Decision Criteria

* performance considerations — mapping adds object allocation overhead per operation
* architectural considerations — explicit mapping maintains Domain purity; direct Eloquent is simpler
* security considerations — explicit mapping can prevent field over-exposure
* maintainability considerations — explicit mapping requires bidirectional mapping tests; direct Eloquent requires none

---

## Decision Tree

Repository implementation approach?
↓
Domain entities are pure PHP (not Eloquent models)?
YES → Use explicit mapping in repository — convert between domain and Eloquent
NO → Domain entities are Eloquent models (partial independence)?
    YES → Use Eloquent directly — no mapping needed
    NO → Does the application require framework independence?
        YES → Use explicit mapping
        NO → Use Eloquent directly — simpler and pragmatic

---

## Rationale

Explicit mapping maintains framework independence at the cost of code volume. Direct Eloquent is simpler but couples the Domain to Laravel's ORM. The choice depends on whether framework independence is an explicit goal or a pragmatic tradeoff.

---

## Recommended Default

**Default:** Direct Eloquent in Infrastructure (accept partial coupling) for most projects
**Reason:** Mapping layers add significant code volume without proportional benefit for most applications. Direct Eloquent is pragmatic, testable, and framework-aligned. Reserve explicit mapping for projects pursuing full framework independence.

---

## Risks Of Wrong Choice

Mapping without justification adds overhead — each aggregate needs mapper + roundtrip tests. Direct Eloquent without boundaries becomes indistinguishable from default Laravel — Domain purity is lost.

---

## Related Rules

- Rule: Map Domain Entities to Eloquent Models Explicitly (LAP-07/05-rules.md)
- Rule: Avoid Leaking Eloquent Return Types from Repositories (LAP-07/05-rules.md)

---

## Related Skills

- Apply Infrastructure Layer Adapters (LAP-07/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)

---

## Single Adapter per Interface vs Multi-Implementation Adapters

---

## Decision Context

Interfaces can have a single implementation (production only) or multiple (production + test + caching + alternative providers). The choice affects whether interfaces provide abstraction benefit or ceremony.

---

## Decision Criteria

* performance considerations — multiple implementations add no runtime cost
* architectural considerations — multiple implementations justify interface abstraction; single implementation may not
* security considerations — multiple implementations can segregate security contexts
* maintainability considerations — multiple implementations require maintenance; single implementation is simpler

---

## Decision Tree

Adapter implementations?
↓
Do you need more than one implementation (production + test + caching)?
YES → Interface is justified — multiple adapters for same port
NO → Is a second implementation planned within 6 months?
    YES → Interface now — avoid refactoring later
    NO → Is the interface a critical architectural boundary?
        YES → Interface even with single implementation — documents the boundary
        NO → Single concrete class — interface adds ceremony without benefit

---

## Rationale

Interfaces (ports) provide the most value when they have multiple implementations — production, test, caching, alternative providers. A single-implementation interface may still be justified if it represents a critical architectural boundary or if a second implementation is planned.

---

## Recommended Default

**Default:** Add interface only when a second implementation is needed or planned
**Reason:** Interface-per-class without multiple implementations adds ceremony without benefit. Start with concrete classes; extract interface when variation emerges. Critical boundaries (repositories, event buses) may justify interfaces even with single implementation.

---

## Risks Of Wrong Choice

Interfaces for every class create abstraction overhead without benefit. No interfaces at critical boundaries make testing and swapping implementations harder.

---

## Related Rules

- Rule: Never Place Business Logic in Infrastructure (LAP-07/05-rules.md)
- Rule: Write Integration Tests for Infrastructure Code (LAP-07/05-rules.md)

---

## Related Skills

- Apply Infrastructure Layer Adapters (LAP-07/06-skills.md)
- Design Repository Contracts (SLP-15/06-skills.md)

---

## Interface for Every Infrastructure Class vs Interface for Variation Points Only

---

## Decision Context

Teams can create interfaces for every Infrastructure class (maximum abstraction) or only for points where variation is expected (pragmatic abstraction). The choice affects code volume and flexibility.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — interfaces everywhere provides maximum flexibility; variation-only is pragmatic
* security considerations — interfaces for security-critical boundaries are essential
* maintainability considerations — interfaces everywhere creates more files; variation-only is simpler

---

## Decision Tree

Interface strategy?
↓
Is this infrastructure class a variation point (multiple implementations possible)?
YES → Create interface — caching, testing, or alternative providers
NO → Is this infrastructure class a critical architectural boundary?
    YES → Create interface — documents the boundary
    NO → Is this class consumed by inner layers (Application/Domain)?
        YES → Create interface — satisfies Dependency Rule
        NO → Concrete class — no interface needed

---

## Rationale

Interfaces are required at architectural boundaries where inner layers depend on Infrastructure — this satisfies the Dependency Rule. For Infrastructure-internal classes (not consumed by inner layers), interfaces add ceremony without benefit. The rule: interface where inner layers depend; concrete where only Infrastructure uses.

---

## Recommended Default

**Default:** Create interfaces only where inner layers depend on Infrastructure
**Reason:** Interfaces at architectural boundaries satisfy the Dependency Rule. Infrastructure-internal classes don't need interfaces — they add ceremony without providing abstraction benefit.

---

## Risks Of Wrong Choice

Interfaces everywhere creates maximum flexibility but maximum file count. No interfaces at boundaries violates the Dependency Rule — inner layers depend on concrete Infrastructure classes.

---

## Related Rules

- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)
- Rule: Never Place Business Logic in Infrastructure (LAP-07/05-rules.md)

---

## Related Skills

- Apply Infrastructure Layer Adapters (LAP-07/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
