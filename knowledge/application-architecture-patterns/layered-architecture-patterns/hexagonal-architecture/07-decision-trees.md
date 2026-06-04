# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Hexagonal/Ports and Adapters architecture concept
**Generated:** 2026-06-03

---

# Decision Inventory

* Hexagonal Architecture vs Clean Architecture for Laravel
* Primary (driving) vs secondary (driven) adapter strategy
* Port granularity: one port per aggregate vs one port per use case

---

# Architecture-Level Decision Trees

---

## Hexagonal Architecture vs Clean Architecture for Laravel

---

## Decision Context

Hexagonal Architecture treats all external systems symmetrically (web, database, queues are equally "outside"). Clean Architecture layers by conceptual distance from business rules. Both use ports and adapters but differ in how they model the outside world — Clean's layering is more structured, Hexagonal is more symmetric.

---

## Decision Criteria

* performance considerations — no significant difference between either approach
* architectural considerations — Hexagonal treats all I/O symmetrically; Clean layers by conceptual distance
* security considerations — neither provides inherent security boundaries
* maintainability considerations — Hexagonal is more intuitive for systems with many external integrations; Clean is better for complex business logic

---

## Decision Tree

Architecture choice?
↓
Application has many symmetric external integrations (web + queue + CLI + API)?
YES → Hexagonal Architecture — all external systems treated equally
NO → Primary value is complex business logic with minimal external I/O?
    YES → Clean Architecture — layering by business distance
    NO → Need to swap infrastructure components independently?
        YES → Hexagonal — symmetric adapter swapping
        NO → Three-layer architecture is sufficient

---

## Rationale

Hexagonal Architecture excels when the application has multiple, equally-important external interfaces (web, CLI, queue, external APIs). Clean Architecture excels when the primary complexity is in business rules. The choice depends on where the complexity lies — I/O symmetry or business logic layering.

---

## Recommended Default

**Default:** Clean Architecture for business-logic-heavy apps; Hexagonal for integration-heavy apps
**Reason:** Clean's layered model maps better to business rule separation. Hexagonal's symmetric model maps better to systems with many equal-priority external integrations. For most Laravel apps, Clean Architecture is more natural.

---

## Risks Of Wrong Choice

Hexagonal for business-heavy apps may over-abstract external interfaces that are trivial. Clean for integration-heavy apps may create unnecessary layering for simple external interactions.

---

## Related Rules

- Rule: Keep Ports Pure — No Framework Types in Method Signatures (LAP-03/05-rules.md)
- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)

---

## Related Skills

- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

---

## Primary (Driving) vs Secondary (Driven) Adapter Strategy

---

## Decision Context

Primary adapters (controllers, commands) initiate interaction with the application. Secondary adapters (repositories, mailers) are initiated by the application. The distinction affects testing strategy and adapter structure.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — primary adapters call in; secondary adapters are called
* security considerations — primary adapters handle authentication; secondary handle data access
* maintainability considerations — each adapter type has different testing needs

---

## Decision Tree

Adapter type?
↓
Does the adapter initiate interaction with the application?
YES → Primary (Driving) adapter — Controller, CLI Command, Queue Listener
    Test: Use contract/integration tests for full request cycle
NO → Does the application initiate interaction with this adapter?
    YES → Secondary (Driven) adapter — Repository, Mailer, API Client
        Test: Use contract tests with mock adapter
    NO → Neither? Investigate — may not need adapter pattern

---

## Rationale

Primary adapters are the entry points — they convert external input into application calls. Secondary adapters are the exit points — they implement interfaces defined by the application. Testing strategy differs: primary adapters need integration tests through the full stack; secondary adapters need contract tests against mock implementations.

---

## Recommended Default

**Default:** Distinguish primary vs secondary adapters in directory structure and testing strategy
**Reason:** The distinction clarifies testing approach (integration for primary, contract for secondary) and architectural role. All adapters of the same type follow the same pattern.

---

## Risks Of Wrong Choice

Treating all adapters the same leads to inappropriate testing strategies. Not distinguishing the two can cause confusion about where authentication (primary) vs data access (secondary) concerns belong.

---

## Related Rules

- Rule: Test Adapters Against Contract Tests (LAP-03/05-rules.md)
- Rule: Validate Adapter Symmetry (LAP-03/05-rules.md)

---

## Related Skills

- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

---

## Port Granularity: One Port per Aggregate vs One Port per Use Case

---

## Decision Context

Port interfaces can be coarse (one repository port per aggregate root with all operations) or fine (one port per use case). The choice affects interface stability, implementation complexity, and testability.

---

## Decision Criteria

* performance considerations — no performance impact from granularity
* architectural considerations — coarse ports are more stable; fine ports provide clearer contracts
* security considerations — fine ports can expose only needed operations
* maintainability considerations — coarse ports collect unrelated methods; fine ports create many interfaces

---

## Decision Tree

Port granularity?
↓
Multiple use cases share the same data access operations?
YES → One port per aggregate (InvoiceRepository with find/save/delete)
NO → Each use case has unique data needs?
    YES → One port per use case or per use case group
    NO → Default: one port per aggregate with focused methods
        Avoid god ports with 20+ methods

---

## Rationale

Coarse ports (per aggregate) are more stable — adding a new use case doesn't require a new interface. Fine ports (per use case) follow Interface Segregation Principle but create many interfaces. The sweet spot is per-aggregate ports with focused method groups that don't become god interfaces.

---

## Recommended Default

**Default:** One port per aggregate root with focused read/write operations
**Reason:** Balances stability (aggregate-level) with clarity (focused methods). Avoids both god ports (20+ methods) and interface proliferation (one per use case).

---

## Risks Of Wrong Choice

Too coarse: god ports with unrelated methods that violate Interface Segregation. Too fine: interface proliferation that makes code navigation harder.

---

## Related Rules

- Rule: Avoid Fat Ports — Separate Read and Write Ports (LAP-03/05-rules.md)
- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)

---

## Related Skills

- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Design Repository Contracts (SLP-15/06-skills.md)
