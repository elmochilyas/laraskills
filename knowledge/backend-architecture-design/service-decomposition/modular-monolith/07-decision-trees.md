# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Styles
**Knowledge Unit:** Modular monolith as starting architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Module organization — domain-based vs layer-based structure
* Decision 2: Module communication — interface vs direct model access
* Decision 3: Module granularity — feature module vs domain module

---

# Architecture-Level Decision Trees

---

## Decision: Module Organization — Domain-Based vs Layer-Based Structure

---

## Decision Context

Choose how to organize code within the monolith — by domain concept or by technical layer.

---

## Decision Criteria

* performance considerations: both have negligible performance difference
* architectural considerations: domain-based aligns with bounded contexts and future extraction
* security considerations: domain-based naturally isolates cross-cutting concerns per module
* maintainability considerations: domain-based keeps related code together; layer-based scatters domain logic

---

## Decision Tree

Are you organizing code by technical layer (Controllers, Models, Services)?
↓
YES → Consider domain-based instead for better modularity
    ↓
    Does this approach make it hard to find files related to a single feature?
    YES → Definitely switch to domain-based (test: can you delete one feature without affecting others?)
    NO → Layer-based may work for simple CRUD apps, but domain-based scales better
NO → Does each domain module have its own routes, controllers, models, services?
    YES → Domain-based organization is implemented correctly
    ↓
    Does each module have its own database schema/tables (prefixed or separate)?
    YES → Strong domain isolation (ideal)
    NO → Can modules share tables without coupling?
        YES → If tables are clearly owned by one module, prefix the tables
        NO → Not truly domain-modular — tables must be assigned to owners
    NO → Are modules organized in folders but share models across modules?
        YES → This is pseudo-modular — shared models couple modules
        NO → Domain-based is correct
↓
Is extraction to microservices a possible future need?
YES → Domain-based organization is mandatory (layer-based makes extraction impossible)
NO → Domain-based is still preferred (cleaner, more maintainable)

---

## Rationale

Domain-based organization (by bounded context or business capability) keeps related code together and makes extraction straightforward. Layer-based organization (Controllers/, Models/, Services/) scatters domain logic across folders, making it impossible to extract a feature without touching every folder. In Laravel, each domain module should be a self-contained directory with routes, controllers, models, and services.

---

## Recommended Default

**Default:** Domain-based organization (`app/Modules/Orders/`, `app/Modules/Payments/`) with each module having its own controllers, models, routes, and services.

**Reason:** Domain-based organization keeps related code together, enables independent module evolution, and preserves the option to extract modules into services later.

---

## Risks Of Wrong Choice

Layer-based: scattered domain logic, impossible to extract a single feature, high cognitive load for large codebases. Pseudo-modular (folders but shared models): gives illusion of modularity without actual isolation.

---

## Related Rules

- Rule 2: Each module owns its database tables (prefix or separate schema)
- Rule 3: Modules have their own routes, controllers, models, and services
- Rule 1: Organize modules by domain/bounded context, not by technical layer

---

## Related Skills

- Structure Laravel Monolith by Domain
- Design Module Boundaries

---

## Decision: Module Communication — Interface vs Direct Model Access

---

## Decision Context

Choose how modules communicate with each other — through interfaces or by referencing each other's models directly.

---

## Decision Criteria

* performance considerations: interfaces add negligible overhead; direct model access is faster but couples
* architectural considerations: interfaces decouple modules; direct access creates tight coupling
* security considerations: interfaces can enforce authorization at the boundary; direct access bypasses it
* maintainability considerations: interfaces enable independent module evolution and testing

---

## Decision Tree

Does module A need data from module B?
↓
YES → Should A access B's Eloquent models directly?
    NO (prevent coupling) → Use a module interface
    ↓
    Does module B already expose a service/interface for this data?
    YES → Use B's interface (A calls B's public API)
    NO → Create an interface in B for A's consumption
        ↓
        Is this a read-only operation?
        YES → A can query B's data via B's interface (repository or query service)
        NO → A sends a command to B via B's interface (not direct model mutation)
    ↓
    Would extracting B into a separate service break A?
    YES → Interface pattern is working correctly (minimal change needed)
    NO → Direct model access is being used — refactor to interfaces
NO → No inter-module communication needed (module is self-contained)

---

## Rationale

Modules must never access each other's Eloquent models directly. Direct model access creates tight coupling at the persistence level — changing a model in module B can break module A. Module communication should happen through well-defined interfaces (services, repositories, DTOs). This preserves the option to extract a module into a service later.

---

## Recommended Default

**Default:** Every module exposes public interfaces (service classes or repositories). Other modules communicate through these interfaces only — never through direct model references.

**Reason:** Interface-based communication decouples modules, enables independent testing, and preserves extraction options. Direct model access creates the tight coupling that prevents modular extraction.

---

## Risks Of Wrong Choice

Direct model access: changing one module's schema breaks other modules, extraction requires rewriting all model references, impossible to test modules independently. Interface explosion: every insignificant data transfer needs an interface, excessive abstraction.

---

## Related Rules

- Rule 5: Module communication occurs through interfaces — not by importing each other's models
- Rule 2: Each module owns its database tables

---

## Related Skills

- Design Module Interfaces
- Apply Facade/Service Pattern for Inter-Module Communication

---

## Decision: Module Granularity — Feature Module vs Domain Module

---

## Decision Context

Choose how granular each module should be — one per feature or one per domain/bounded context.

---

## Decision Criteria

* performance considerations: feature modules may duplicate domain logic; domain modules centralize it
* architectural considerations: feature modules are more granular; domain modules align with DDD
* security considerations: feature modules allow per-feature access control; domain modules need per-use-case auth
* maintainability considerations: feature modules are easier to delete/replace; domain modules reduce duplication

---

## Decision Tree

Does this functionality represent a complete business concept (e.g., Orders, Payments)?
↓
YES → Domain module (aligns with bounded context)
    ↓
    Does the domain module have more than 15-20 files?
    YES → Can it be split into sub-modules within the domain?
        YES → Sub-modules (e.g., Orders/Creation, Orders/Fulfillment, Orders/Returns)
        NO → Keep as one domain module (size is acceptable for complex domains)
    NO → Keep as one domain module (appropriate size)
NO → Is it a single use case or feature (e.g., Export Orders to CSV)?
    YES → Feature module only if it spans multiple domains
    ↓
    Does the feature touch multiple domain modules?
    YES → Feature module as an orchestrator (keeps orchestration separate from domain)
    NO → Keep as a use case inside the relevant domain module
NO → Does it represent shared infrastructure (logging, caching, mailing)?
    YES → Shared infrastructure module (not a domain module)
    NO → Evaluate if this belongs in an existing domain module

---

## Rationale

Domain modules (one per bounded context) are the default granularity. Feature modules are only useful for orchestration use cases that span multiple domains. The goal is to keep domain logic in domain modules and orchestration in thin feature modules. Overly fine-grained feature modules duplicate domain logic and create cross-cutting concerns.

---

## Recommended Default

**Default:** One module per bounded context/domain concept (Orders, Payments, Inventory). Feature modules only for cross-domain orchestration.

**Reason:** Domain modules align with business concepts and extraction boundaries. Feature modules should be thin — they orchestrate but don't own domain logic.

---

## Risks Of Wrong Choice

Feature modules for everything: duplication of domain logic across features, scattered business rules, hard to maintain. Single giant module: no modularity benefit, defeats the purpose of modular monolith.

---

## Related Rules

- Rule 4: Modules should be large enough to have meaning but small enough to be replaced or extracted
- Rule 1: Organize modules by domain/bounded context

---

## Related Skills

- Structure Laravel Monolith by Domain
- Design Module Granularity
