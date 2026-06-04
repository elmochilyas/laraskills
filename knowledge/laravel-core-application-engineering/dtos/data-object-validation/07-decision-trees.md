# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Data Object Validation
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO Validation vs FormRequest Validation
* Constructor Validation vs Declarative `rules()` Method
* Database Queries in Validation vs Defer to Service Layer

---

# Architecture-Level Decision Trees

---

## Decision 1: DTO Validation vs FormRequest Validation

---

## Decision Context

Which layer owns validation rules — the DTO (validating at the data contract boundary) or the FormRequest (validating at the HTTP boundary).

---

## Decision Criteria

* Whether the data enters through multiple entry points (HTTP + CLI + queue)
* Whether the rules are domain-level or HTTP-specific
* Whether the project uses spatie/laravel-data
* Whether authorization is required (FormRequest has richer authorization context)

---

## Decision Tree

Is the entry point HTTP?
↓
YES → Does the same data shape enter through other entry points (CLI, queue)?
    YES → DTO validation for domain rules (consistent across all entry points), FormRequest for HTTP-specific rules
    NO → Is authorization needed (route params, headers, resource relationships)?
        YES → FormRequest validation — has access to route parameters and headers that DTO lacks
        NO → Either layer — choose based on team convention
NO → CLI or queue entry point?
    YES → DTO validation is the sole validation layer — FormRequests don't apply
NO → Is the project using spatie/laravel-data with `rules()` support?
    YES → Data object validation recommended — runs through the pipeline automatically
    NO → Plain DTOs with `fromArray()` validation for non-HTTP entry points

---

## Rationale

DTO validation applies to all entry points automatically — one definition, universal enforcement. FormRequest validation has richer context (route parameters, headers, authorization) but only works for HTTP. For multi-entry-point applications, DTO validation for domain rules with FormRequest for HTTP-specific rules is the correct separation. Rules must never be duplicated in both layers.

---

## Recommended Default

**Default:** FormRequest for HTTP-specific rules (authorization, input format); DTO for domain-level rules (applies everywhere); never duplicate the same rule in both
**Reason:** Each layer owns its concerns. FormRequest validates HTTP boundary; DTO validates data contract. No overlap, no divergence.

---

## Risks Of Wrong Choice

* DTO validation for HTTP-only flow: Extra validation overhead when FormRequest already validates
* FormRequest validation for multi-entry-point: CLI/queue entry points bypass validation entirely
* Duplicate rules in both: Always diverge — one layer updated, the other forgotten

---

## Related Rules

* Use DTO Validation for Domain-Level Rules Only (05-rules.md)
* Choose One Validation Layer — Never Validate the Same Rules in Both FormRequest and DTO (05-rules.md)
* Never Use Database Queries in DTO Validation Rules (05-rules.md)

---

## Related Skills

* Skill: Add Domain-Level Validation to a DTO

---

## Decision 2: Constructor Validation vs Declarative `rules()` Method

---

## Decision Context

Whether to place validation logic in the DTO's constructor (inline) or in a declarative static `rules()` method called from `fromArray()`.

---

## Decision Criteria

* Whether validation should be bypassable for pre-validated data
* Whether validation rules need to be inspected or tested independently
* Whether the DTO uses spatie/laravel-data (which requires `rules()` method)
* Whether the DTO is a Value Object with intrinsic invariants

---

## Decision Tree

Is this a Value Object with intrinsic invariants (email, money, date range)?
↓
YES → Constructor validation is appropriate — the invariant is inherent to the value type
NO → Is this a DTO (data carrier, not a value)?
    YES → Does the DTO use spatie/laravel-data?
        YES → Use declarative `rules()` static method — the pipeline calls it automatically
        NO → Is validation pre-populated at the FormRequest layer (HTTP entry point)?
            YES → Declarative `rules()` method — callers with pre-validated data can construct DTO directly
            NO → Declarative `rules()` method preferred — called from `fromArray()`; tests can construct DTO directly for valid-data scenarios
NO → Does the DTO have multiple construction paths with different validation needs?
    YES → Declarative `rules()` method — different factory methods can call different validation
    NO → Declarative `rules()` method still preferred — separation of concerns

---

## Rationale

Constructor validation couples validation execution to construction — the constructor cannot be called without running validation, even when the caller already has validated data. Declarative `rules()` methods allow validation to be inspected, reused, and tested independently of construction. Value Objects are the exception because their invariants are intrinsic to the value type.

---

## Recommended Default

**Default:** Declarative `rules()` method for DTOs (called from `fromArray()`); constructor validation for Value Objects with intrinsic invariants
**Reason:** Declarative rules are testable, reusable, and allow construction bypass for pre-validated data. Constructor validation couples validation to construction.

---

## Risks Of Wrong Choice

* Constructor validation on DTO: Tests must always provide valid data, cannot test with intentionally invalid input
* Constructor validation without bypass: Pre-validated data pays validation cost again
* `rules()` method on VO: Invariant enforcement is split between constructor and method — weakened

---

## Related Rules

* Do Not Define DTO Validation in the Constructor — Prefer Declarative `rules()` Methods (05-rules.md)
* Keep Validation Pure — No Side Effects in Validation Rules (05-rules.md)

---

## Related Skills

* Skill: Add Domain-Level Validation to a DTO

---

## Decision 3: Database Queries in Validation vs Defer to Service Layer

---

## Decision Context

Whether to include database-dependent validation rules (`unique:users,email`) in DTO validation or defer uniqueness/existence checks to the service layer.

---

## Decision Criteria

* Whether the DTO is constructed in batch operations (queues, imports)
* Whether the database dependency would prevent unit testing
* Whether uniqueness checks must run before persistence
* Whether performance of batch construction matters

---

## Decision Tree

Is the DTO constructed in batch operations (100+ items per request)?
↓
YES → Defer to service layer — database queries in DTO validation at scale cause N+1 query explosion
NO → Is the DTO constructed in non-HTTP contexts (CLI, queue)?
    YES → Defer to service layer — CLI/queue may not have database connectivity during DTO construction
NO → Is the rule an existence/availability check (unique:users,email, exists:products,id)?
    YES → Defer to service layer — these are persistence-level constraints, not data format rules
NO → Is the rule a format or domain rule that does not require database?
    YES → DTO validation is appropriate (e.g., `required`, `email`, `min:18`, `regex:/^[A-Z]+$/`)
    NO → Is the rule critical for data integrity and cannot be checked elsewhere?
        YES → Cache the database state and use a cached rule — avoid direct database query
        NO → Always defer to service layer

---

## Rationale

Database queries in DTO validation couple data transport to infrastructure, prevent unit testing, and cause N+1 query explosions in batch operations. Format validation (required, email format, string length) belongs in the DTO. Persistence-level constraints (uniqueness, existence) belong in the service layer. This separation keeps DTOs testable and fast.

---

## Recommended Default

**Default:** Format/domain rules on DTO (required, email, length); persistence constraints (unique, exists) in service layer
**Reason:** Format rules are intrinsic to the data shape and can be checked without infrastructure. Persistence constraints require database access and belong in the orchestration layer.

---

## Risks Of Wrong Choice

* `unique` in DTO: Database query on every construction, batch operations cause N+1, unit tests need database
* No validation in DTO at all: Invalid formats reach the service layer unchecked
* Deferred everything: DTO accepts invalid data that could have been caught early

---

## Related Rules

* Never Use Database Queries in DTO Validation Rules (05-rules.md)
* Audit All DTO Construction Points for Validation Bypass (05-rules.md)

---

## Related Skills

* Skill: Add Domain-Level Validation to a DTO

