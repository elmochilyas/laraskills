# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Organizing by domain: app/Domains/{Domain} structure
**Generated:** 2026-06-03

---

# Decision Inventory

* Full domain isolation vs hybrid domain-layer approach
* Domain events vs service contracts for cross-domain communication
* Domain-scoped models vs shared models across domains

---

# Architecture-Level Decision Trees

---

## Full Domain Isolation vs Hybrid Domain-Layer Approach

---

## Decision Context

Full domain isolation (`app/Domains/Billing/`, each with own routes, providers, and namespace) provides genuine bounded context isolation. Hybrid keeps domain subdirectories within technical layers (`app/Models/Billing/`, `app/Http/Controllers/Billing/`). The choice has significant setup and enforcement cost differences.

---

## Decision Criteria

* performance considerations — full isolation adds boot-time overhead from multiple providers (50-100ms with 10+ domains)
* architectural considerations — full isolation enables extraction; hybrid preserves framework compatibility
* security considerations — neither provides security boundaries
* maintainability considerations — full isolation requires PSR-4 configuration; hybrid requires no configuration

---

## Decision Tree

Domain isolation level?
↓
Team ownership maps to domains with formal contracts?
YES → Full domain isolation with per-domain providers
NO → Anticipate module extraction to microservices?
    YES → Full domain isolation for extraction readiness
    NO → Team 5-15 engineers with multiple domains?
        YES → Hybrid — domain subdirectories within layers
        NO → Layer-based organization with defaults

---

## Rationale

Full domain isolation is the most common enterprise deviation from defaults. It creates genuine domain isolation but adds setup and enforcement costs. The hybrid approach is the recommended intermediate step — it preserves framework compatibility and requires no PSR-4 changes.

---

## Recommended Default

**Default:** Hybrid approach (domain subdirectories within standard layers)
**Reason:** Preserves framework convention compatibility while introducing domain grouping. No PSR-4 changes needed. Evolve to full isolation when module extraction or contract boundaries become necessary.

---

## Risks Of Wrong Choice

Full isolation without enforcement degrades into hybrid anyway — domains with crossed boundaries. Hybrid without evolution path remains in a half-state — domain grouping but no enforcement.

---

## Related Rules

- R01: Never Access Another Domain's Eloquent Models Directly (COS-06/05-rules.md)
- R02: Give Each Domain Its Own Service Provider (COS-06/05-rules.md)

---

## Related Skills

- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

---

## Domain Events vs Service Contracts for Cross-Domain Communication

---

## Decision Context

When Domain A needs to communicate with Domain B, two patterns exist: dispatch a domain event (fire-and-forget) or call a service contract (request-response). The choice affects coupling, testability, and workflow complexity.

---

## Decision Criteria

* performance considerations — events are async-capable; contracts are synchronous with latency
* architectural considerations — events decouple domains; contracts create direct dependency
* security considerations — both require careful data exposure management
* maintainability considerations — events require listener registration; contracts require interface maintenance

---

## Decision Tree

Cross-domain communication type?
↓
Does Domain A need an immediate response from Domain B?
YES → Use service contract (interface) — request-response pattern
NO → Is the communication a notification that something happened?
    YES → Use domain event — fire-and-forget
    NO → Does Domain A need to query data from Domain B?
        YES → Use service contract with query method
        NO → Use domain event

---

## Rationale

Service contracts are for request-response patterns where Domain A needs an immediate result. Domain events are for fire-and-forget notification where Domain A doesn't need a response. Using contracts for notification adds unnecessary coupling. Using events for queries creates complexity.

---

## Recommended Default

**Default:** Use domain events for notification; use service contracts for request-response
**Reason:** Events decouple domains and enable async processing. Contracts are necessary when immediate response is required but create direct dependencies.

---

## Risks Of Wrong Choice

Using contracts for fire-and-forget notification adds unnecessary coupling and synchronous latency. Using events for request-response patterns creates workflow complexity — the calling domain must wait for a response via a separate mechanism.

---

## Related Rules

- R04: Use Domain Events for Cross-Domain Communication (COS-06/05-rules.md)
- R06: Enforce Domain Isolation via Automated Checks (COS-06/05-rules.md)

---

## Related Skills

- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Handle Cross-Domain Query Patterns (DBC-07/06-skills.md)

---

## Domain-Scoped Models vs Shared Models Across Domains

---

## Decision Context

Some entities (like User) naturally span multiple domains. Teams must decide whether to create domain-scoped models (each domain has its own User model reflecting its view) or share a single model across all domains. The choice affects coupling and consistency.

---

## Decision Criteria

* performance considerations — domain-scoped models may duplicate data access; shared models create query bottlenecks
* architectural considerations — shared models create coupling point; scoped models preserve isolation
* security considerations — shared models may expose data across security contexts
* maintainability considerations — shared models require coordinated changes; scoped models may drift

---

## Decision Tree

Model used across domains?
↓
Is the concept the same in all domains (identical fields, behavior)?
YES → Use shared model in shared kernel — document as application-wide concept
NO → Does each domain have a different view of the same concept?
    YES → Create domain-scoped models — each domain owns its representation
    NO → Is the model truly cross-cutting (Tenant, AuditLog)?
        YES → Use shared model
        NO → Place in the owning domain; other domains access via contract

---

## Rationale

If a model represents the same concept identically across all domains (e.g., `Tenant`, `AuditLog`), a shared model is appropriate. If each domain has a different view (e.g., `User` in Identity vs `User` in Billing), domain-scoped models preserve isolation.

---

## Recommended Default

**Default:** Domain-scoped models for each bounded context
**Reason:** Each domain's model reflects the domain's view of the data. Shared models create a single coupling point — changing them requires coordinated changes across all domains.

---

## Risks Of Wrong Choice

Shared models create coupling — schema changes affect all domains. Domain-scoped models may drift apart, requiring cross-domain data synchronization logic.

---

## Related Rules

- R03: Use Domain-Scoped Eloquent Models for Each Domain (COS-06/05-rules.md)
- R01: Never Access Another Domain's Eloquent Models Directly (COS-06/05-rules.md)

---

## Related Skills

- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Identify Bounded Contexts for Domain Isolation (DBC-01/06-skills.md)
