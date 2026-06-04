# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request DTO Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO from validated() vs DTO from Request Directly
* toDto() on FormRequest vs fromRequest() on DTO
* DTO Bridge Always vs Only When Crossing Layers

---

# Architecture-Level Decision Trees

---

## Decision 1: DTO from validated() vs DTO from Request Directly

---

## Decision Context

Whether to build a DTO from `$request->validated()` (validated-only data) or from the raw request object.

---

## Decision Criteria

* Whether the data has been validated by a FormRequest
* Whether unvalidated fields should be able to reach the DTO
* Whether the DTO is used in contexts where the request is not available (queue, CLI)
* Whether the DTO needs data that was transformed during validation

---

## Decision Tree

Is the DTO being constructed in an HTTP context with a FormRequest present?
↓
YES → Use `$request->validated()` — only data that passed validation reaches the domain
NO → Are you constructing the DTO from a non-HTTP source (queue payload, CLI args)?
    YES → Accept raw array — validate at the boundary, build DTO from validated result
    NO → Use `validated()` — the only safe source for HTTP-sourced DTOs
NO → Does the DTO need data that was added in `prepareForValidation()`?
    YES → Use `validated()` — `prepareForValidation` adds data before validation, so it's in validated output
    NO → Use `validated()` — always prefer validated data over raw request data

---

## Rationale

`validated()` returns only data that passed all validation rules. Using it as the DTO source guarantees that invalid, unvalidated, or malicious data never reaches the domain layer. Using `all()` or `input()` bypasses the validation boundary.

---

## Recommended Default

**Default:** Always use `$request->validated()` as the source for DTO construction in HTTP contexts.
**Reason:** `validated()` is the guarantee that only validated data enters the domain. Any other source is a security gap.

---

## Risks Of Wrong Choice

* DTO from `all()`: Unvalidated extra fields injected into DTO — mass assignment, logic bypass
* DTO from `input()`: Same risk as `all()` — no validation guarantee
* DTO from individual `$request->get()` fields: Easy to forget validation for one field
* Hardcoded array in non-HTTP context: No validation at all — invalid data reaches domain

---

## Related Rules

* Build DTOs from validated() — Never from all()

---

## Related Skills

* Bridge FormRequest to Typed DTO Using validated()

---

---

## Decision 2: toDto() on FormRequest vs fromRequest() on DTO

---

## Decision Context

Whether to convert a FormRequest to a DTO via a method on the FormRequest (`$request->toDto()`) or a static factory on the DTO (`UserDto::fromRequest($request)`).

---

## Decision Criteria

* Whether the DTO is used in non-HTTP contexts (needs multiple factory methods)
* Whether there are multiple request types that create the same DTO
* Whether the team prefers DTO-centric or Request-centric design
* Whether the DTO has multiple sources (request, queue, array, CLI)

---

## Decision Tree

Does the DTO have multiple sources (HTTP request + queue payload + array)?
↓
YES → Use static factory methods on the DTO — `UserDto::fromRequest($request)`, `UserDto::fromArray($data)`
NO → Does the FormRequest have a strong relationship with the DTO (one-to-one)?
    YES → Use `toDto()` on the FormRequest — `$dto = $request->toDto()`, simple and direct
    NO → Is there a single clear direction (Request → DTO is the only flow)?
        YES → Use `toDto()` on FormRequest — keeps it simple, no static factory overhead
        NO → Use static factory on DTO — more flexible for future sources

---

## Rationale

Static factory methods on the DTO (`UserDto::fromRequest($request)`) keep the conversion logic with the DTO. `toDto()` on the FormRequest keeps the conversion with the request. The choice reflects whether the DTO or the request is the design center. For DTOs with multiple sources, static factories are essential.

---

## Recommended Default

**Default:** Use static factory methods on the DTO (`fromRequest()`, `fromArray()`). This keeps conversion logic with the DTO and accommodates multiple sources.
**Reason:** DTOs commonly need to be constructed from different sources. Static factories on the DTO centralize construction and make the DTO self-contained.

---

## Risks Of Wrong Choice

* `toDto()` on request with multiple sources: Must add `toDto()` to every source — scattered construction logic
* Static factory for single-source DTO: Boilerplate — `fromRequest()` when constructor would suffice
* No factory at all: Manual construction in every controller — `new UserDto(...)` repeated in 5 places
* Mixed approaches: Some DTOs use `toDto()`, others use `fromRequest()` — inconsistent, confusing

---

## Related Rules

* DTO Factory Method Convention

---

## Related Skills

* Bridge FormRequest to Typed DTO Using validated()

---

---

## Decision 3: DTO Bridge Always vs Only When Crossing Layers

---

## Decision Context

Whether to always convert FormRequest to DTO before passing to services, or only when the data crosses multiple layers.

---

## Decision Criteria

* Number of layers the data crosses (controller → service → action → repository)
* Whether the action is simple CRUD with direct Eloquent interaction
* Whether the project enforces a strict anti-corruption layer between HTTP and domain
* Whether the team values type safety vs development speed

---

## Decision Tree

Does the data cross 3+ layers (controller → service → action → repository)?
↓
YES → Always use DTO bridge — type safety across multiple boundaries justifies the ceremony
NO → Is the action simple CRUD (controller passes directly to Eloquent create/update)?
    YES → DTO adds ceremony without benefit — use `$request->validated()` directly
    NO → Is the project's architectural standard to decouple HTTP from domain?
        YES → Always use DTO bridge — architectural consistency is the priority
        NO → Is the service layer expected to grow in complexity?
            YES → Use DTO bridge — future-proof the interface
            NO → Skip DTO — direct validated data is fine for simple flows

---

## Rationale

DTOs are an anti-corruption layer that decouples domain code from HTTP concepts. They add ceremony (class, factory, mapping) in exchange for type safety and decoupling. For simple CRUD flows with 1-2 layers, the ceremony outweighs the benefit. For multi-layer flows, the type safety across boundaries is essential.

---

## Recommended Default

**Default:** Use DTO bridge for data crossing 3+ layers. Use `$request->validated()` directly for simple controller-to-Eloquent flows.
**Reason:** The 3-layer threshold identifies where type safety across boundaries provides measurable benefit. Below that, the array from `validated()` is sufficient.

---

## Risks Of Wrong Choice

* DTO for simple CRUD: File and factory overhead for no benefit — `$request->validated()` would work
* No DTO for multi-layer flow: Hidden contract — service expects specific keys that aren't enforced
* DTO but no `validated()`: Unvalidated data in DTO — security gap
* No DTO in API application: Every endpoint returns raw arrays — no consistent response structure

---

## Related Rules

* Build DTOs from validated() — Never from all()
* DTO Crossing Layer Threshold

---

## Related Skills

* Bridge FormRequest to Typed DTO Using validated()
