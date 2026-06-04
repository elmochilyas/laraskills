# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO vs Form Request
**Generated:** 2026-06-03

---

# Decision Inventory

* FormRequest Only vs DTO Only vs Both
* `payload()` vs `fromRequest()` Bridge Pattern
* FormRequest Authoritative vs DTO Authoritative Validation

---

# Architecture-Level Decision Trees

---

## Decision 1: FormRequest Only vs DTO Only vs Both

---

## Decision Context

Whether to use a FormRequest alone, a DTO alone, or both sequentially for an entry point.

---

## Decision Criteria

* Whether the entry point is HTTP, CLI, or queue
* Whether data crosses multiple application layers
* Whether the same data shape is used across entry points
* Whether HTTP-specific concerns (authorization, input format) exist

---

## Decision Tree

What type of entry point is this?
↓
CLI command or queue job?
YES → DTO only — FormRequests are HTTP-specific and do not apply
NO → HTTP endpoint?
    YES → Does the data cross 2-3+ application layers (controller → service → action)?
        YES → Does the same data shape come from other entry points (CLI, queue)?
            YES → Both FormRequest + DTO — FormRequest for HTTP, DTO for shared contract
            NO → Both still recommended for typed service contract, but DTO-only may suffice
        NO → Is there HTTP-specific authorization or input preparation needed?
            YES → FormRequest only — validated array sufficient for simple flows
            NO → Is the data flow trivial (controller → model directly)?
                YES → FormRequest only — no DTO needed
                NO → DTO only — typed contract without FormRequest overhead
    NO → Non-HTTP entry point not covered above?
        YES → DTO only — FormRequests never apply outside HTTP

---

## Rationale

FormRequests and DTOs serve sequential roles: FormRequest handles HTTP boundary concerns (authorization, input format), DTO handles cross-layer data transport (typed properties, domain validation). For simple flows, FormRequest alone is sufficient. For CLI/queue, DTO alone is the only option. For complex multi-layer flows, both provide complementary value.

---

## Recommended Default

**Default:** FormRequest + DTO for complex multi-layer HTTP endpoints; FormRequest only for simple CRUD; DTO only for CLI/queue entry points
**Reason:** Each combination matches the complexity of the data flow. The two-layer approach (FormRequest validates, DTO transports) provides the clearest separation of concerns.

---

## Risks Of Wrong Choice

* DTO only for HTTP: Missing authorization and input preparation (FormRequest's role)
* FormRequest only for complex flow: Service receives array instead of typed DTO, hidden contract
* FormRequest passed to service: Permanently couples service layer to HTTP

---

## Related Rules

* Never Pass FormRequest Instances to Services (05-rules.md)
* Use the Sequential Flow — FormRequest → DTO → Service (05-rules.md)
* Use DTO Validation as the Sole Validation Layer for CLI and Queue Entry Points (05-rules.md)

---

## Related Skills

* Skill: Bridge FormRequest to DTO via payload() or fromRequest()

---

## Decision 2: `payload()` vs `fromRequest()` Bridge Pattern

---

## Decision Context

Whether to place the FormRequest-to-DTO mapping on the FormRequest (`payload()` method) or on the DTO (`fromRequest()` static method).

---

## Decision Criteria

* Whether the same DTO is consumed by multiple FormRequests
* Team organizational preference (HTTP-centric vs data-centric)
* Complexity of the mapping logic

---

## Decision Tree

Is the same DTO used by 2+ FormRequests?
↓
YES → DTO-owned `fromRequest()` — one mapping on the DTO, all FormRequests pass themselves as argument
NO → Single FormRequest → DTO pair?
    YES → Team preference governs:
        HTTP-centric team → FormRequest-owned `payload()` (mapping lives near HTTP)
        Data-centric team → DTO-owned `fromRequest()` (mapping lives on data carrier)
NO → Is the mapping logic complex (field renaming, type transformation, computed values)?
    YES → DTO-owned `fromRequest()` — centralizes complex mapping on the data object
    NO → Either pattern — trivial mapping can live in either location
NO → Using spatie/laravel-data?
    YES → `Data::fromRequest()` is automatic — no manual bridge needed

---

## Rationale

FormRequest-owned bridges feel natural for HTTP-centric thinking. DTO-owned bridges are more consistent across entry points (HTTP, CLI, queue both use DTO factories). The key is picking one convention and applying it consistently — mixed usage creates confusion.

---

## Recommended Default

**Default:** FormRequest-owned `payload()` for HTTP-centric teams; DTO-owned `fromRequest()` for teams that value cross-entry-point consistency
**Reason:** Either pattern provides the explicit bridge. Consistency across the project matters more than which convention is chosen.

---

## Risks Of Wrong Choice

* Mixed patterns: Some controllers use `payload()`, others use `fromRequest()` — no single source of truth
* Inline mapping in controller: No bridge at all — mapping logic scattered across controllers
* `payload()` on shared DTO: Multiple FormRequests each implement their own `payload()`, duplicating mapping logic

---

## Related Rules

* Use the Bridging Pattern — `payload()` on FormRequest or `fromRequest()` on DTO (05-rules.md)
* DTOs Must Transform Data, Not Mirror HTTP Structure (05-rules.md)

---

## Related Skills

* Skill: Bridge FormRequest to DTO via payload() or fromRequest()

---

## Decision 3: FormRequest Authoritative vs DTO Authoritative Validation

---

## Decision Context

Which layer owns validation rules — the FormRequest (validating all at the HTTP boundary) or the DTO (validating at the data contract layer).

---

## Decision Criteria

* Whether the same data shape enters through multiple entry points
* Whether domain-level rules apply across all entry points
* Whether the project uses spatie/laravel-data
* Team preference for validation layer

---

## Decision Tree

Does the same data shape enter through multiple entry points (HTTP + CLI + queue)?
↓
YES → DTO authoritative — rules on the DTO apply to all entry points automatically
NO → HTTP-only data flow?
    YES → FormRequest authoritative — validate everything at the HTTP boundary, DTO has no rules
NO → Does the project use spatie/laravel-data?
    YES → Data object authoritative recommended — rules on Data objects run through the pipeline
    NO → Does the application have domain-level rules that must apply everywhere?
        YES → DTO authoritative for domain rules, FormRequest for HTTP-specific rules (non-overlapping)
        NO → FormRequest authoritative — simple validation at HTTP boundary suffices

---

## Rationale

Validation rules must live in exactly one layer to prevent divergence. FormRequest authoritative keeps validation at the HTTP boundary — simple and predictable. DTO authoritative ensures consistency across all entry points. The choice depends on whether the data enters through multiple channels and whether domain rules must apply universally.

---

## Recommended Default

**Default:** FormRequest authoritative for HTTP-only applications with a single entry point; DTO authoritative for multi-entry-point applications or spatie/laravel-data projects
**Reason:** Single-entry-point apps benefit from HTTP boundary validation. Multi-entry-point apps need validation consistency across channels.

---

## Risks Of Wrong Choice

* Duplicate rules in both layers: Always diverge over time — one is updated, the other forgotten
* FormRequest authoritative with CLI/queue: CLI entry points bypass FormRequest validation entirely
* DTO authoritative without CLI/queue: DTO validation overhead for HTTP-only flows where FormRequest already validates

---

## Related Rules

* Define Validation Rules in Exactly One Layer (05-rules.md)
* DTOs Must Transform Data, Not Mirror HTTP Structure (05-rules.md)
* Use DTO Validation as the Sole Validation Layer for CLI and Queue Entry Points (05-rules.md)

---

## Related Skills

* Skill: Bridge FormRequest to DTO via payload() or fromRequest()
* Skill: Add Domain-Level Validation to a DTO

