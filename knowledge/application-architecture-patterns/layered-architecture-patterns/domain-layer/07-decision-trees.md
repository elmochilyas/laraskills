# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Domain layer: entities, value objects, domain services
**Generated:** 2026-06-03

---

# Decision Inventory

* Entity methods vs Domain Services for business logic placement
* Value objects vs primitive types for domain concepts
* Domain events as pure PHP objects vs framework Event classes

---

# Architecture-Level Decision Trees

---

## Entity Methods vs Domain Services for Business Logic Placement

---

## Decision Context

Business logic involving a single entity's state belongs on the entity. Logic involving multiple entities or external dependencies belongs in a Domain Service. Misplacement creates anemic entities or services with mixed responsibilities.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — entity methods enforce invariants; services coordinate across entities
* security considerations — entity methods encapsulate business rules; services orchestrate
* maintainability considerations — entity methods prevent logic scattering; services prevent entity bloat

---

## Decision Tree

Business logic placement?
↓
Logic involves only the entity's own state and parameters?
YES → Place as entity method: `$invoice->markAsPaid()`
NO → Logic requires coordination across multiple entities?
    YES → Domain Service: `PricingService.calculateTotal(invoice, customer)`
    NO → Logic requires external dependencies (repositories, APIs)?
        YES → Domain Service (with injected port interface)
        NO → Entity method — simplest location

---

## Rationale

Entity methods enforce invariants directly — `$invoice->markAsPaid()` checks that the invoice is in a payable state before changing it. Domain Services coordinate operations that span multiple entities. The distinguishing question: "Does this operation belong to a single entity's responsibility?"

---

## Recommended Default

**Default:** Entity methods for single-entity operations; Domain Services for multi-entity coordination
**Reason:** Entity methods keep business rules with the data they govern. Domain Services handle operations that don't naturally belong to any single entity. Default to entities first, extract to services when the entity grows beyond its responsibility.

---

## Risks Of Wrong Choice

All logic in entities creates giant entities with 50+ methods. All logic in services creates anemic domain models with property bags and no behavior.

---

## Related Rules

- Rule: Entities Enforce Their Own Invariants (LAP-05/05-rules.md)
- Rule: Use Domain Services for Multi-Entity Operations (LAP-05/05-rules.md)

---

## Related Skills

- Apply Domain Layer Entities and Value Objects (LAP-05/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

---

## Value Objects vs Primitive Types for Domain Concepts

---

## Decision Context

Domain concepts like email, money, or status can be represented as primitive types (string, int) or value objects (Email, Money, InvoiceStatus). Value objects provide type safety, validation, and behavior.

---

## Decision Criteria

* performance considerations — value objects allocate more memory than primitives
* architectural considerations — value objects encapsulate validation and behavior
* security considerations — value objects prevent invalid state by construction
* maintainability considerations — value objects centralize validation; primitives scatter it

---

## Decision Tree

Represent domain concept?
↓
Concept has validation rules (format, range, constraints)?
YES → Value object — validates on construction
NO → Concept has behavior (comparison, arithmetic, formatting)?
    YES → Value object — encapsulates behavior
    NO → Concept is used in multiple domain contexts?
        YES → Value object — provides type safety and consistency
        NO → Primitive (string, int) — simplest option

---

## Rationale

Value objects eliminate invalid state by construction — an `Email` value object validates format in its constructor, guaranteeing it's valid wherever used. Primitives scatter validation across code and risk invalid data. The cost is object allocation; the benefit is type safety and centralized validation.

---

## Recommended Default

**Default:** Value objects for domain concepts with validation or behavior; primitives for simple pass-through values
**Reason:** Value objects prevent invalid state by construction and encapsulate domain behavior. The object allocation cost is negligible and worth the type safety benefit.

---

## Risks Of Wrong Choice

Value objects for everything creates unnecessary object overhead for simple wrappers. Primitives for validated concepts scatter validation rules and risk invalid state.

---

## Related Rules

- Rule: Value Objects Validate on Construction (LAP-05/05-rules.md)
- Rule: Use Domain Services for Multi-Entity Operations (LAP-05/05-rules.md)

---

## Related Skills

- Apply Domain Layer Entities and Value Objects (LAP-05/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)

---

## Domain Events as Pure PHP Objects vs Framework Event Classes

---

## Decision Context

Domain events can be pure PHP objects (framework-independent, in Domain layer) or Laravel Event classes (framework-coupled, in Infrastructure). The choice affects framework independence and dispatch mechanism.

---

## Decision Criteria

* performance considerations — no significant performance difference
* architectural considerations — pure PHP events maintain Domain independence; framework events couple Domain to Laravel
* security considerations — no security impact
* maintainability considerations — pure PHP events require adapter for dispatch; framework events dispatch directly

---

## Decision Tree

Domain event representation?
↓
Is framework independence of Domain layer a priority?
YES → Pure PHP event objects in Domain layer — dispatch via port interface
NO → Would mapping pure PHP events to Laravel events add overhead?
    YES → Laravel Event classes — accept the coupling
    NO → Pure PHP events — maintain independence

---

## Rationale

Domain events represent business occurrences — they belong in the Domain layer as pure PHP objects. However, dispatching them requires an interface (port) with an Infrastructure adapter that calls `Event::dispatch()`. The overhead is minimal; the benefit is Domain independence.

---

## Recommended Default

**Default:** Pure PHP domain event objects in Domain layer with port-interface dispatch
**Reason:** Domain events are business concepts that should be framework-independent. The port-adapter approach for dispatch adds minimal code while maintaining the Dependency Rule.

---

## Risks Of Wrong Choice

Framework event classes in Domain violate the Dependency Rule and couple business events to Laravel's event system. Pure PHP events without a dispatch mechanism are useless — the port-adapter must exist.

---

## Related Rules

- Rule: Domain Layer Must Be Pure PHP (LAP-02/05-rules.md)
- Rule: Keep Domain Events as Pure PHP Objects in Domain (LAP-05/05-rules.md)

---

## Related Skills

- Apply Domain Layer Entities and Value Objects (LAP-05/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
