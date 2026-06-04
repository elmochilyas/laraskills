# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Framework Decoupling
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Decouple Domain from Framework vs Stay Coupled
* Decision 2: DateTimeImmutable vs Carbon in Domain Code
* Decision 3: Native PHP Arrays vs Eloquent Collection in Domain Returns
* Decision 4: Domain-Owned Port vs Infrastructure-Owned Interface

---

# Architecture-Level Decision Trees

---

## Decision 1: Decouple Domain from Framework vs Stay Coupled

---

## Decision Context

Determine whether to isolate domain code from Laravel framework dependencies using ports and adapters, or keep the domain layer framework-coupled for simplicity.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the application have complex, valuable business logic?
↓
YES → Does the application need to be testable without loading Laravel's kernel?
    YES → Decouple
    NO → Is the team size > 5 with multiple teams owning different parts?
        YES → Decouple
        NO → Does the application need to outlive the current framework choice?
            YES → Decouple
            NO → Stay Coupled
NO → Is the application simple CRUD with minimal business rules?
    YES → Stay Coupled
    NO → Stay Coupled (over-engineering risk)

---

## Rationale

Framework decoupling protects domain logic from framework churn, enables pure unit tests, and supports framework migration. However, it introduces indirection (interfaces, adapters, mapping) that is unjustified for simple CRUD applications or small teams where delivery speed outweighs architectural purity.

---

## Recommended Default

**Default:** Stay coupled for simple CRUD applications. Decouple when domain complexity justifies the abstraction overhead.
**Reason:** Premature decoupling adds interfaces, mappers, and indirection before the domain rules exist to justify them. Let domain complexity drive the architectural decision, not architectural fashion.

---

## Risks Of Wrong Choice

* Decoupling without need: interface proliferation, mapping hell, developer resistance, slower feature delivery
* Staying coupled with complex domain: framework lock-in, slow tests (require kernel bootstrap), impossible framework migration, hidden framework dependencies in business logic

---

## Related Rules

* Rule 1: Define domain ports in domain layer, not infrastructure (`05-rules.md`)
* Rule 3: Enforce domain purity with static analysis rules (`05-rules.md`)

---

## Related Skills

* Define a Domain Port and Wire an Adapter (`06-skills.md` Skill 1)
* Add PHPStan Rules for Domain Purity (`06-skills.md` Skill 3)

---

## Decision 2: DateTimeImmutable vs Carbon in Domain Code

---

## Decision Context

Choose between native PHP `DateTimeImmutable` and Laravel's `Carbon`/`CarbonImmutable` for representing time values in domain models and services.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the code in the domain layer (Domain/ namespace)?
↓
YES → DateTimeImmutable
NO → Is the code in a view, Blade template, or front-end layer?
    YES → Carbon (for diffForHumans, format helpers)
    NO → Is the code in an adapter that bridges domain and infrastructure?
        YES → Convert at the boundary: use DateTimeImmutable internally, Carbon when needed
        NO → Carbon (if in framework layer with no domain purity requirement)

---

## Rationale

`DateTimeImmutable` is framework-agnostic, guarantees immutability, and keeps domain code portable. Carbon is convenient but couples domain code to Laravel and its mutable default API can introduce subtle time-mutation bugs. Conversion between the two should happen only at adapter boundaries.

---

## Recommended Default

**Default:** `DateTimeImmutable` in domain code. Carbon in Blade templates and framework-layer presentation code.
**Reason:** Immutability prevents time-based defects, and the framework-agnostic type keeps the domain portable and testable without Laravel.

---

## Risks Of Wrong Choice

* Carbon in domain: Laravel coupling, mutation bugs from `->addDay()` modifying the original, domain tests require Carbon package
* DateTimeImmutable in views: missing `diffForHumans()`, `toDayDateTimeString()` helpers, more verbose formatting

---

## Related Rules

* Rule 2: Use `DateTimeImmutable` not `Carbon` in domain models and services (`05-rules.md`)
* Rule 3: Enforce domain purity with static analysis rules (`05-rules.md`)

---

## Related Skills

* Refactor Domain Code to Remove Framework Dependencies (`06-skills.md` Skill 2)
* Add PHPStan Rules for Domain Purity (`06-skills.md` Skill 3)

---

## Decision 3: Native PHP Arrays vs Eloquent Collection in Domain Returns

---

## Decision Context

Choose whether domain methods and services should return native PHP arrays or `Illuminate\Support\Collection` for their results.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the code returning data from a domain service or domain method?
↓
YES → Return native PHP array (`array<int, T>`)
NO → Is the code in a controller or view composing view data?
    YES → Collection (for chaining helper methods)
    NO → Is the code in an adapter that calls an Eloquent query?
        YES → Convert Collection to array before crossing into domain
        NO → Return type depends on context

---

## Rationale

Native arrays are universally understood, serializable without conversion, and framework-agnostic. `Collection` couples callers to Laravel's API surface, making the domain's contract dependent on a framework class. Collection helpers are valuable in view/presentation layers but should not appear in domain return types.

---

## Recommended Default

**Default:** Native `array` types in domain code. `Collection` only in framework-layer code.
**Reason:** Arrays are the universal PHP data structure with zero coupling. The domain's public API should not require consumers to know Laravel's collection API.

---

## Risks Of Wrong Choice

* Collection in domain returns: domain API requires Laravel to use; serialization requires `->toArray()`; PHPStan type precision is reduced
* Array-only everywhere: losing collection helper methods in presentation layers adds boilerplate

---

## Related Rules

* Rule 8: Use native PHP arrays over Eloquent `Collection` in domain returns (`05-rules.md`)

---

## Related Skills

* Refactor Domain Code to Remove Framework Dependencies (`06-skills.md` Skill 2)

---

## Decision 4: Domain-Owned Port vs Infrastructure-Owned Interface

---

## Decision Context

Decide whether a port (interface) should be defined in the domain layer or the infrastructure layer.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the interface express a domain need (persist invoices, send mail, get current time)?
↓
YES → Define in domain layer
NO → Is the interface a framework contract (ShouldQueue, ShouldBeUnique)?
    YES → Use framework contract directly in infrastructure; do not wrap in domain
    NO → Does the interface describe infrastructure capability (cache driver, HTTP client)?
        YES → Define in domain layer as a domain-owned abstraction of that capability
        NO → Question whether the interface is needed at all

---

## Rationale

Domain-owned ports express what the domain needs from the outside world in business language. Infrastructure-owned interfaces force domain code to depend on infrastructure concepts, violating the Dependency Inversion Principle. Framework contracts belong in the framework layer, not the domain.

---

## Recommended Default

**Default:** Define all interfaces that express domain needs in `Domain\Contracts\`. Never define interfaces in infrastructure for the domain to implement.
**Reason:** Port ownership determines dependency direction. Domain-owned ports keep abstractions aligned with business language and infrastructure swappable.

---

## Risks Of Wrong Choice

* Infrastructure-owned port: domain depends on infrastructure; interface language reflects database concerns; architecture boundary is inverted
* Domain port for every framework contract: unnecessary wrapping; domain polluted with framework concepts even when abstracted

---

## Related Rules

* Rule 1: Define domain ports in domain layer, not infrastructure (`05-rules.md`)
* Rule 4: Keep domain services using only domain-defined interfaces and native PHP types (`05-rules.md`)
* Rule 6: Question every domain interface — only abstract when variation exists (`05-rules.md`)

---

## Related Skills

* Define a Domain Port and Wire an Adapter (`06-skills.md` Skill 1)
* Set Up Service Provider Wiring (`06-skills.md` Skill 3, Ports and Adapters subdomain)
