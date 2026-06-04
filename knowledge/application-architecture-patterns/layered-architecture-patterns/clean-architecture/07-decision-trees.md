# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Clean Architecture layers: Domain, Application, Infrastructure, Presentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Full Clean Architecture vs Clean Architecture Lite (Service Layer)
* Port-Adapter pattern vs direct interface-implementation
* Explicit mappers vs implicit Eloquent mapping

---

# Architecture-Level Decision Trees

---

## Full Clean Architecture vs Clean Architecture Lite (Service Layer)

---

## Decision Context

Full Clean Architecture includes Domain (pure PHP), Application (use cases, ports), Infrastructure (adapters), and Presentation (controllers). "Clean Architecture Lite" keeps Domain and Application layers but uses traditional Eloquent models instead of pure domain entities with mappers.

---

## Decision Criteria

* performance considerations — full CA adds mapping overhead; Lite skips mapping
* architectural considerations — full CA provides framework independence; Lite accepts Eloquent coupling
* security considerations — no difference
* maintainability considerations — full CA requires more files and discipline; Lite is more pragmatic

---

## Decision Tree

Clean Architecture implementation level?
↓
Business logic is complex enough to warrant framework independence?
YES → Full Clean Architecture — pure domain entities, explicit mappers, ports/adapters
NO → Application expected to outlive Laravel version?
    YES → Full Clean Architecture — future migration readiness
    NO → Need to test business logic without Laravel bootstrap?
        YES → Full Clean Architecture — independent domain testing
        NO → Clean Architecture Lite — accept Eloquent coupling

---

## Rationale

Full Clean Architecture provides the benefits of framework independence but at significant cost (2-4x files). Clean Architecture Lite (Application + Domain without full port-adapter) provides 80% of the benefit at 40% of the cost for most applications.

---

## Recommended Default

**Default:** Clean Architecture Lite for most applications; Full Clean Architecture for complex domains
**Reason:** Clean Architecture Lite provides structured layers without the full overhead of pure domain entities, mappers, and ports/adapters. Full independence is justified only for fintech, healthcare, or other complex domains.

---

## Risks Of Wrong Choice

Full Clean Architecture for simple CRUD creates unnecessary complexity and slows development. Clean Architecture Lite without enforcement degrades into architecture "theater" — directories say Clean but code is coupled.

---

## Related Rules

- Rule: Domain Layer Must Be Pure PHP (LAP-02/05-rules.md)
- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)

---

## Related Skills

- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Implement Three-Layer Architecture (LAP-01/06-skills.md)

---

## Port-Adapter Pattern vs Direct Interface-Implementation

---

## Decision Context

Clean Architecture defines ports (interfaces) in Application/Domain layers and adapters (implementations) in Infrastructure. The alternative is direct interface-implementation without the formal port-adapter terminology — Application defines the interface, Infrastructure implements it.

---

## Decision Criteria

* performance considerations — no difference in runtime performance
* architectural considerations — port-adapter formalizes the boundary; direct is lighter
* security considerations — no difference
* maintainability considerations — port-adapter provides clearer contracts; direct is simpler

---

## Decision Tree

Interface abstraction approach?
↓
Multiple implementations of same interface (production + test + alternative)?
YES → Formal Port-Adapter pattern — each port has documented contract tests
NO → Will the interface have multiple implementations in the future?
    YES → Port-Adapter pattern — worth the formality
    NO → Is the interface a boundary between Application and Infrastructure?
        YES → Port-Adapter pattern — clear architectural boundary
        NO → Direct interface-implementation is sufficient

---

## Rationale

The formal Port-Adapter pattern (with contract tests, multiple implementations) is justified when interfaces genuinely have multiple implementations or represent critical architectural boundaries. For simple interfaces with a single implementation, direct interface-implementation suffices.

---

## Recommended Default

**Default:** Port-Adapter pattern for architectural boundaries (repositories, event buses); direct interface for simpler abstractions
**Reason:** Critical infrastructure abstractions benefit from formal port-adapter with contract tests. Simpler interfaces don't need the ceremony.

---

## Risks Of Wrong Choice

Port-adapter everywhere creates unnecessary ceremony. Direct interface only (no formal adapter) for critical boundaries may miss contract testing benefits.

---

## Related Rules

- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)
- Rule: Bind Ports to Adapters in Service Providers (LAP-02/05-rules.md)

---

## Related Skills

- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

---

## Explicit Mappers vs Implicit Eloquent Mapping

---

## Decision Context

When Domain entities are pure PHP (not Eloquent models), they must be mapped to/from Eloquent models. Explicit mappers provide full control but require maintenance. Implicit mapping assumes domain entities ARE Eloquent models.

---

## Decision Criteria

* performance considerations — explicit mappers add per-operation object allocation overhead
* architectural considerations — explicit mappers maintain framework independence; implicit couples Domain to Eloquent
* security considerations — explicit mappers can prevent field exposure
* maintainability considerations — explicit mappers require tests and maintenance; implicit requires none

---

## Decision Tree

Domain-Entity mapping strategy?
↓
Domain entities are pure PHP (no Eloquent extends)?
YES → Use explicit mappers in Infrastructure layer
NO → Domain entities ARE Eloquent models?
    YES → No mapping needed — implicit mapping (accept Eloquent coupling)
    NO → Do domain entities significantly differ from database schema?
        YES → Use explicit mappers
        NO → Consider implicit — mapping overhead may not be justified

---

## Rationale

Explicit mappers maintain framework independence but add maintenance burden. If domain entities and Eloquent models are near-identical, the mapping layer adds cost without benefit. The decision should be documented and consistent across the codebase.

---

## Recommended Default

**Default:** Use explicit mappers only when pursuing full Clean Architecture with framework-independent domain
**Reason:** Mapping overhead is justified only when domain entities significantly differ from database schema or when framework independence is a priority. For most projects, implicit mapping (domain as Eloquent) is pragmatic.

---

## Risks Of Wrong Choice

Skipping mapping when domain and schema diverge creates coupling and inconsistent state. Adding mapping when domain and schema are identical creates ceremony without value.

---

## Related Rules

- Rule: Use Mappers for Domain-to-Eloquent Conversion (LAP-02/05-rules.md)
- Rule: No Eloquent Models in Domain or Application (LAP-02/05-rules.md)

---

## Related Skills

- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
