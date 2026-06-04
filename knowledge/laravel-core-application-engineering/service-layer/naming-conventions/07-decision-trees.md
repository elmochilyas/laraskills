# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Naming Conventions
**Generated:** 2026-06-03

---

# Decision Inventory

* Entity-Oriented Names vs Capability-Oriented Names
* Business Verb Methods vs HTTP Verb Methods
* Domain Subdirectories vs Flat Service Directory
* Service Suffix vs Abstract/Manager/Helper Names

---

# Architecture-Level Decision Trees

---

## Decision 1: Entity-Oriented Names vs Capability-Oriented Names

---

## Decision Context

Whether to name the service class after the entity it operates on (`UserService`) or the capability it provides (`AuthenticationService`).

---

## Decision Criteria

* Whether the service maps primarily to a single business entity
* Whether the service is cross-cutting (not tied to one entity)
* Whether the application is entity-heavy or capability-heavy

---

## Decision Tree

Does the service operate primarily on a single business entity?
↓
YES → Entity-oriented name — `UserService`, `OrderService`, `InvoiceService`
NO → Does the service span multiple entities or provide a cross-cutting capability?
    ↓
    YES → Capability-oriented name — `AuthenticationService`, `NotificationService`, `PaymentService`
    NO → Does the service implement a domain computation not tied to an entity?
        ↓
        YES → Capability-oriented name — `PricingService`, `TaxCalculator`, `ShippingCostService`
        NO → Entity-oriented name — default to entity naming; use capability naming for exceptions
NO → Is the service utility/helper-like (no clear entity or capability)?
    ↓
    YES → Reconsider the service design — utility services are an anti-pattern
    NO → Entity-oriented name — default choice

---

## Rationale

Entity-oriented names (`UserService`) are predictable — developers looking for user-related logic go to `UserService`. Capability-oriented names (`AuthenticationService`) are needed when the capability spans multiple entities (auth involves users, roles, tokens). Entity naming should be the default; capability naming is for cross-cutting concerns.

---

## Recommended Default

**Default:** Entity-oriented names (`{Entity}Service`) for most services.
**Reason:** Entity names are stable and universally understood. Developers can find the service for any entity without documentation.

---

## Risks Of Wrong Choice

* Entity name for cross-cutting service: `UserService` containing authentication, notification, and billing logic — god service
* Capability name for entity-specific service: `RegistrationService` instead of `UserService` — hard to find; `UserService` would need to be created anyway
* `HelperService` or `ManagerService`: Generic name masks unclear responsibility; always rewrites to entity or capability naming
* Mixed naming conventions: `UserService` and `UserManager` both exist — developers don't know which to use

---

## Related Rules

* Enforce Entity-Oriented Names for Most Services
* Enforce Business Verb Methods (Not HTTP Verbs)

---

## Related Skills

* Name Services After Their Primary Entity
* Name Services After Their Capability for Cross-Cutting Operations

---

---

## Decision 2: Business Verb Methods vs HTTP Verb Methods

---

## Decision Context

Whether service methods should use business verbs (`register()`, `suspend()`) or HTTP verbs (`store()`, `update()`).

---

## Decision Criteria

* Whether the service method name should express domain meaning
* Whether the service could be called from non-HTTP contexts (CLI, queue, tests)
* Whether the team is migrating from controller-style naming

---

## Decision Tree

Does the method represent a business operation with domain meaning?
↓
YES → Business verb — `register()`, `place()`, `suspend()`, `activate()`, `refund()`
NO → Is the method a generic CRUD operation?
    ↓
    YES → Is the CRUD operation called from non-HTTP contexts?
        ↓
        YES → Business verb — `createUser()`, `deleteOrder()` — more descriptive than `store()`, `destroy()`
        NO → Business verb — still prefer `create()` over `store()`; consistency across all methods
    NO → Business verb — all service methods should express domain meaning
NO → Is the method called from HTTP contexts only?
    ↓
    YES → Business verb still preferred — even if only called from HTTP, domain meaning is clearer
    NO → Business verb — HTTP coupling is always undesirable; services should not know about transport

---

## Rationale

HTTP verb names (`store`, `update`, `destroy`) are controller concerns. Services should not know about HTTP. Business verb names (`register`, `suspend`, `refund`) express the domain meaning of the operation. This decouples the service from the transport layer and makes method calls readable in any context (CLI command, queue job, test assertion).

---

## Recommended Default

**Default:** Always use business verbs for service method names.
**Reason:** Business verbs express domain meaning. HTTP verbs couple the service to the transport layer.

---

## Risks Of Wrong Choice

* HTTP verb method name: `$userService->store($data)` — unclear what "store" means in a business context
* Business verb for CRUD: `$userService->create($data)` is clear; `$userService->persist($data)` is overly abstract
* Mixed verb conventions: Some methods named `store()`, others `register()` — inconsistent and confusing
* HTTP verb in queue job: `UserService::store()` called from a job — makes the job read like an HTTP request

---

## Related Rules

* Enforce Entity-Oriented Names for Most Services
* Enforce Business Verb Methods (Not HTTP Verbs)

---

## Related Skills

* Name Services After Their Primary Entity
* Name Services After Their Capability for Cross-Cutting Operations

---

---

## Decision 3: Domain Subdirectories vs Flat Service Directory

---

## Decision Context

Whether to organize service classes into domain subdirectories (`Services/Sales/`, `Services/Billing/`) or keep them flat in `App/Services/`.

---

## Decision Criteria

* Whether the number of service classes exceeds 20
* Whether the application has clearly defined bounded contexts or domains
* Whether the team is organized around domain teams

---

## Decision Tree

Does the application have more than 20 service classes?
↓
YES → Domain subdirectories — flat directory is unmanageable beyond 20-30 files
NO → Is the application expected to grow to 20+ services?
    ↓
    YES → Domain subdirectories — set up the structure before growth makes it painful
    NO → Flat directory — 5-15 services are manageable in a flat list
YES → Does the application have clearly defined bounded contexts (Sales, Billing, Inventory)?
    ↓
    YES → Domain subdirectories — each context gets its own subdirectory
    NO → Is the team organized around domain teams?
        ↓
        YES → Domain subdirectories — team ownership maps to directory ownership
        NO → Flat directory — bounded contexts are not well-defined; flat organization is simpler
NO → Do domain services share cross-cutting naming (PricingService used across domains)?
    ↓
    YES → Consider cross-domain location — `App/Services/Shared/` or capability-based naming
    NO → Domain subdirectories — clean organization within each domain

---

## Rationale

A flat `App/Services/` directory with 40 files is hard to navigate. Developers must scan the entire list to find the relevant service. Domain subdirectories (`App/Services/Sales/OrderService`, `App/Services/Billing/InvoiceService`) provide clear ownership and navigation. The threshold is ~20 services — below that, flat is simpler.

---

## Recommended Default

**Default:** Flat `App/Services/` for applications with <20 services. Domain subdirectories for larger applications.
**Reason:** Flat is simpler for small applications. Domain subdirectories prevent navigation overhead at scale.

---

## Risks Of Wrong Choice

* Flat directory at 50 services: Impossible to navigate; services from different domains mixed together
* Domain subdirectories at 10 services: Over-engineered; unnecessary nesting for a small application
* Wrong domain assignment: `UserService` in `Sales/` instead of `Identity/` — confusing; use domain mapping documentation
* Mixed flat and domain: Some services in `App/Services/`, others in `App/Services/Sales/` — inconsistent

---

## Related Rules

* Enforce Entity-Oriented Names for Most Services
* Enforce Business Verb Methods (Not HTTP Verbs)

---

## Related Skills

* Name Services After Their Primary Entity
* Name Services After Their Capability for Cross-Cutting Operations

---

---

## Decision 4: Service Suffix vs Abstract/Manager/Helper Names

---

## Decision Context

Whether to use the `Service` suffix (`OrderService`) or alternative suffixes like `Manager`, `Helper`, `Handler`, or abstract names.

---

## Decision Criteria

* Whether the class performs business operations on an entity
* Whether the class has a single responsibility
* Whether the suffix convention is consistent across the codebase

---

## Decision Tree

Does the class perform business operations on one or more entities?
↓
YES → `Service` suffix — the standard Laravel convention
NO → Does the class manage configuration or initialization?
    ↓
    YES → Consider `Manager` — `CacheManager`, `AuthManager` — but these are Laravel internal patterns
    NO → Is the class a collection of static utility functions?
        ↓
        YES → Do NOT use `Service` — `Helper` or `Util` is more accurate; but reconsider if a class is needed
        NO → Does the class process a single operation?
            ↓
            YES → `Handler` — `WebhookHandler`, `FileUploadHandler` — single-responsibility processor
            NO → `Service` — default to Service; other suffixes add confusion
NO → Is there an existing convention in the codebase?
    ↓
    YES → Follow the existing convention — consistency is more important than suffix choice
    NO → Use `Service` — it's the most widely understood convention in Laravel

---

## Rationale

The `Service` suffix is universally understood in Laravel. Alternatives like `Manager`, `Helper`, `Handler` have specific meanings but are inconsistently applied across codebases. `Helper` is particularly problematic — it's often used for god classes that collect unrelated utilities. `Service` is the safest default because it's the standard Laravel convention.

---

## Recommended Default

**Default:** `Service` suffix for all business operation classes. Avoid `Helper`, `Manager`, or other generic suffixes.
**Reason:** Consistent `Service` suffix is predictable and widely understood. Alternatives like `Helper` mask unclear responsibilities.

---

## Risks Of Wrong Choice

* `Helper` suffix: Becomes a dumping ground for unrelated utilities; no clear responsibility
* `Manager` suffix: Implies state management; services should be stateless
* No suffix: `User` instead of `UserService` — conflicts with the Eloquent model; confusing
* Inconsistent suffixes: `UserService`, `OrderManager`, `InvoiceHelper` — no pattern; developers can't predict class names

---

## Related Rules

* Enforce Entity-Oriented Names for Most Services
* Enforce Business Verb Methods (Not HTTP Verbs)

---

## Related Skills

* Name Services After Their Primary Entity
* Name Services After Their Capability for Cross-Cutting Operations
