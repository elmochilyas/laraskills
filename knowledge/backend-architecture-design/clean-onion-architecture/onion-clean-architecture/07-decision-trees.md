# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Clean / Onion / Hexagonal Architecture
**Knowledge Unit:** Onion Architecture / Clean Architecture dependency rule
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Three rings vs four rings in Clean Architecture
* Decision 2: Where DTOs and request/response objects live
* Decision 3: Clean Architecture vs Hexagonal Architecture choice

---

# Architecture-Level Decision Trees

---

## Decision: Three Rings vs Four Rings in Clean Architecture

---

## Decision Context

Choose the number of concentric rings in Clean Architecture, balancing granularity vs simplicity.

---

## Decision Criteria

* performance considerations: more rings = more indirection
* architectural considerations: 4 rings provide finer separation; 3 rings are simpler
* security considerations: more rings provide more boundary checkpoints
* maintainability considerations: fewer rings reduce cognitive overhead

---

## Decision Tree

Does the application have distinct application-layer orchestration logic separate from domain rules?
↓
YES → Does the team need clear separation between use-case orchestration and domain logic?
    YES → 4 rings (Domain, Application, Infrastructure, Presentation) — full Clean Architecture
    NO → 3 rings (Domain, Application+Infrastructure combined, Presentation) — simpler variant
NO → Is the application logic primarily CRUD with thin orchestration?
    YES → 3 rings (combined Application/Infrastructure, less ceremony)
    NO → Is there significant infrastructure complexity (multiple databases, queues, caches)?
        YES → 4 rings (separate Infrastructure ring for clarity)
        NO → 3 rings

---

## Rationale

Four rings provide the clearest separation when both application orchestration and infrastructure complexity exist. Three rings reduce ceremony for simpler applications where the distinction between Application and Infrastructure is less important.

---

## Recommended Default

**Default:** Four rings (Domain, Application, Infrastructure, Presentation) for most Clean Architecture projects.

**Reason:** The additional ring provides clearer separation and is relatively cheap. It's easier to merge rings later than to split them.

---

## Risks Of Wrong Choice

4 rings for simple app: unnecessary ceremony, more files, team confusion. 3 rings for complex app: Application and Infrastructure logic mixed, harder to maintain and test independently.

---

## Related Rules

- Rule 1: Dependencies point inward — domain core must never reference outer layers
- Rule 3: Outer circles must communicate via ports and adapters, not direct instantiation

---

## Related Skills

- Design a Clean Architecture Application
- Implement a Layered Architecture

---

## Decision: Where DTOs and Request/Response Objects Live

---

## Decision Context

Determine which ring should own Data Transfer Objects and request/response models.

---

## Decision Criteria

* performance considerations: DTOs add memory overhead but cross boundaries cleanly
* architectural considerations: DTOs must not carry framework-specific code across rings
* security considerations: DTOs should not expose internal domain state
* maintainability considerations: DTO location affects coupling between rings

---

## Decision Tree

Does the DTO cross a ring boundary (e.g., Application → Presentation)?
↓
YES → Does the DTO contain only data (no behavior)?
    YES → Place in the Application ring (shared boundary object)
    NO → Is the DTO a domain concept (e.g., OrderSummary)?
        YES → Place in Domain ring as value object
        NO → Is the DTO framework-specific (e.g., FormRequest)?
            YES → Keep in Presentation ring (never cross boundary)
            NO → Application ring
NO → Is the DTO specific to a single use case output?
    YES → Application ring (use case output port)
    NO → Is the DTO shared across multiple use cases?
        YES → Application ring or Domain ring if it's domain concept
        NO → Application ring

---

## Rationale

DTOs that cross ring boundaries belong in the Application ring (not Domain) to avoid coupling domain to presentation concerns. Framework-specific request/response objects must stay in the outer Presentation ring and never leak inward.

---

## Recommended Default

**Default:** Place boundary DTOs in the Application ring; place framework-specific request/response in the Presentation ring.

**Reason:** Application ring DTOs are framework-agnostic and can cross boundaries safely. Presentation ring objects contain framework-specific code that would violate the Dependency Rule if passed inward.

---

## Risks Of Wrong Choice

Domain DTOs: domain model polluted with presentation concerns. Presentation DTOs passed to Application: framework coupling in use cases. No DTOs: exposing domain entities directly to presentation (violates encapsulation).

---

## Related Rules

- Rule 1: Dependencies point inward — domain core must never reference outer layers
- Rule 4: Keep domain entities pure and use application services for use-case orchestration

---

## Related Skills

- Design a Clean Architecture Application
- Apply the Dependency Inversion Principle

---

## Decision: Clean Architecture vs Hexagonal Architecture Choice

---

## Decision Context

Choose between Clean Architecture (concentric rings) and Hexagonal Architecture (ports and adapters) for a given application.

---

## Decision Criteria

* performance considerations: both add similar indirection overhead
* architectural considerations: Clean emphasizes ring boundaries; Hexagonal emphasizes port/adapter pattern
* security considerations: both provide equivalent boundary isolation
* maintainability considerations: both have similar maintenance overhead; pick one and be consistent

---

## Decision Tree

Does the team prefer explicit layer rings with defined boundaries?
↓
YES → Clean Architecture (concentric rings with strict dependency rule)
NO → Does the team prefer interface-driven design with ports and adapters?
    YES → Hexagonal Architecture (ports define boundaries; adapters implement)
    NO → Is the primary goal framework independence for the domain?
        YES → Either works; pick based on team preference
        NO → Is the primary goal testability of business logic?
            YES → Hexagonal (test doubles for ports = natural testing strategy)
            NO → Choose based on which mental model fits the team better

---

## Rationale

Clean Architecture and Hexagonal Architecture are more similar than different. Both enforce the Dependency Inversion Principle and achieve framework independence. The choice is primarily about team familiarity and mental model. Hexagonal's port/adapter terminology maps well to Laravel's service container.

---

## Recommended Default

**Default:** Hexagonal Architecture for Laravel projects (ports and adapters map naturally to Laravel's contracts/service container pattern).

**Reason:** Hexagonal's port/adapter terminology aligns well with Laravel's interface-bind-resolution pattern. Developers naturally understand the distinction between ports (interfaces) and adapters (implementations).

---

## Risks Of Wrong Choice

Forcing Clean Architecture's ring terminology: may confuse Laravel developers who think in terms of contracts/implementations. Forcing Hexagonal where team understands ring model: unnecessary mental translation.

---

## Related Rules

- Rule 1: Dependencies point inward — domain core must never reference outer layers
- Rule 2: Define repository interfaces in the domain, implement in infrastructure

---

## Related Skills

- Design a Clean Architecture Application
- Design a Hexagonal Architecture (Ports and Adapters)
