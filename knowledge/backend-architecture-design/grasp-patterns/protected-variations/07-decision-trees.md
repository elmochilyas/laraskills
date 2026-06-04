# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Protected Variations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Identify which variation points need protection
* Decision 2: Protection mechanism (interface, adapter, ACL, data mapper)
* Decision 3: Protection level (complete vs partial shielding)

---

# Architecture-Level Decision Trees

---

## Decision: Identify Which Variation Points Need Protection

---

## Decision Context

Choose which variation points in the system warrant protection via stable interfaces.

---

## Decision Criteria

* performance considerations: each protection layer adds indirection overhead
* architectural considerations: protecting volatile points prevents change propagation; over-protecting adds needless complexity
* security considerations: external integrations are security-sensitive and benefit from protection
* maintainability considerations: documented variation points prevent accidental bypass of protection

---

## Decision Tree

Is the dependency external (third-party API, database, file system, external service)?
↓
YES → Is the external dependency likely to change (API version, vendor switch, protocol change)?
    YES → Protect with interface (shield domain from external volatility)
    NO → Is the external dependency a commodity (well-established, unlikely to change)?
        YES → Low priority for protection (monitor; protect if change patterns emerge)
        NO → Protect with adapter (unknown volatility justifies protection)
NO → Is the dependency internal but volatile (frequent API changes, different team ownership)?
    YES → Protect with interface (internal volatility also benefits from protection)
NO → Is the dependency a technology/framework (ORM, message broker, cache)?
    YES → Protect at architectural boundaries (domain depends on interface; framework is implementation)
    ↓
    Is this a known instance of variation (multiple payment gateways, multiple storage backends)?
    YES → Protect now (known variation point; protection is justified)
    ↓
    Is there a history of breaking changes from this dependency?
    YES → Protect (past breakage is a strong predictor of future breakage)
    ↓
    Document: what varies, how it's protected, why
    Create or update ADR for each protected variation point

---

## Rationale

Not all variation points need protection. Protect when: the dependency is external, likely to change, has multiple implementations, or has a history of breaking changes. Don't protect stable dependencies (core PHP functions, well-established libraries with stable APIs).

---

## Recommended Default

**Default:** Protect all external integrations (payment, email, SMS, storage). Protect internal cross-team dependencies. Don't protect stable, same-team dependencies.

**Reason:** External integrations are the most volatile and expensive to change. Cross-team dependencies benefit from contract stability. Same-team dependencies can be changed with good communication.

---

## Risks Of Wrong Choice

Under-protecting: external API change breaks domain logic; vendor switch requires rewriting core code. Over-protecting: unnecessary interfaces for stable dependencies, YAGNI violation, navigation overhead.

---

## Related Rules

- Rule 1: Shield stable core from volatile external dependencies via interfaces
- Rule 5: Identify and document all protected variation points in an ADR

---

## Related Skills

- Apply the Protected Variations GRASP Pattern
- Implement Adapter Pattern

---

## Decision: Protection Mechanism (Interface, Adapter, ACL, Data Mapper)

---

## Decision Context

Choose the appropriate mechanism for protecting a variation point.

---

## Decision Criteria

* performance considerations: adapter adds translation overhead; interface has minimal cost
* architectural considerations: each mechanism serves a different protection purpose
* security considerations: ACL and adapters can sanitize data crossing boundaries
* maintainability considerations: choosing the right mechanism avoids confusion about intent

---

## Decision Tree

Does the variation point involve a change in technology or infrastructure (database, cache, search)?
↓
YES → Data Mapper or Repository interface (protect domain from persistence/technology changes)
NO → Does the variation point involve an external system with an incompatible interface?
    YES → Does the external system have a very different domain model or language?
        YES → Anti-Corruption Layer (full translation between domain and external model)
        NO → Adapter (translates external interface to a clean domain interface)
NO → Does the variation point involve multiple implementations of the same behavior?
    YES → Interface with Strategy pattern (stable contract, switchable implementations)
NO → Does the variation point involve complex subsystem interaction?
    YES → Facade (simplified interface over complex subsystem)
    ↓
    Does the protection need to add behavior (logging, caching, retry)?
    YES → Decorator (wraps the interface with additional behavior transparently)
    ↓
    Is the protection for a single stable implementation (no future swaps expected)?
    YES → Interface alone (minimal protection; extract implementations later if needed)
    ↓
    Document the mechanism choice in the ADR for this variation point

---

## Rationale

Interface: implementation swapping. Adapter: interface incompatibility. ACL: full model translation. Data Mapper: persistence protection. Facade: subsystem complexity. Decorator: adding behavior. Choose the mechanism that matches the type of variation.

---

## Recommended Default

**Default:** Interface for most variation points. Adapter for external systems with incompatible interfaces. Data Mapper for persistence.

**Reason:** Interface is the simplest protection — just a contract. Adapter is needed when the external system's interface doesn't match your domain. Data Mapper fully decouples domain from persistence schema.

---

## Risks Of Wrong Choice

Adapter when interface would suffice: unnecessary translation overhead, maps identical concepts. Interface when ACL is needed: leaks the external model through the interface. Data Mapper for simple CRUD: over-engineering when Eloquent is sufficient.

---

## Related Rules

- Rule 2: Encapsulate variation behind stable interfaces—interfaces change less than implementations
- Rule 3: Use configuration/adapter pattern for hardware or infrastructure dependencies
- Rule 4: Use data mappers to protect the domain from schema changes

---

## Related Skills

- Apply the Protected Variations GRASP Pattern
- Implement an Anti-Corruption Layer
- Implement Adapter Pattern

---

## Decision: Protection Level (Complete vs Partial Shielding)

---

## Decision Context

Choose how thoroughly to shield the domain from a variation point — full abstraction or partial leak.

---

## Decision Criteria

* performance considerations: complete abstraction adds more indirection; partial shielding is simpler
* architectural considerations: complete abstraction fully decouples; partial shielding is pragmatic
* security considerations: complete abstraction can filter sensitive data; partial may leak
* maintainability considerations: complete abstraction requires more code; partial is faster to implement

---

## Decision Tree

Does the variation point have a stable, well-defined protocol (API spec, standard protocol)?
↓
YES → Can the protocol be expressed as a clean domain interface (no leaky abstractions)?
    YES → Complete shielding through interface (abstract the protocol entirely)
    NO → Partial shielding (interface exposes some technical concepts; document the leak)
NO → Is the variation point likely to change fundamentally (not just implementation details)?
    YES → Complete shielding (the interface must survive a change in the underlying concept)
        ↓
        Does the complete abstraction lose important capabilities of the underlying system?
        YES → Partial shielding (leak essential capabilities through optional interface methods)
        NO → Complete shielding (no loss; abstract everything)
NO → Is the variation point simple (one method, few parameters)?
    YES → Partial shielding may be adequate (simple operations are easy to change)
    ↓
    Cost of protection vs risk of change:
    HIGH RISK, LOW COST → Complete shielding (change risk justifies full abstraction)
    LOW RISK, HIGH COST → Partial shielding (pragmatic; don't over-abstract)
    ↓
    Create two implementations of the protection to validate the interface
    Second implementation exposes gaps → increase protection level
    Second implementation fits cleanly → protection level is appropriate

---

## Rationale

Complete shielding fully decouples the domain from variation point specifics. Partial shielding accepts some leakage in exchange for simplicity. The right level depends on the volatility of the variation point and the cost of abstraction. When the interface itself would change with the variation, the protection is incomplete.

---

## Recommended Default

**Default:** Complete shielding for external integrations (payment, email, SMS). Partial shielding for internal infrastructure (cache, search).

**Reason:** External integrations cause the most expensive changes. Complete shielding justifies its cost. Internal infrastructure has more stable interfaces and is easier to update.

---

## Risks Of Wrong Choice

Complete shielding for everything: every variation point gets a full interface, high code volume, over-engineering. Partial shielding for external integrations: external API changes leak into domain code, defeating the protection.

---

## Related Rules

- Rule 1: Shield stable core from volatile external dependencies via interfaces
- Rule 5: Identify and document all protected variation points in an ADR

---

## Related Skills

- Apply the Protected Variations GRASP Pattern
- Design Hexagonal Architecture (Ports and Adapters)
