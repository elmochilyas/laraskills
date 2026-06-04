# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Construction Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Named Static Factories vs Generic `from()` Method
* Manual Mapping vs Spread Operator
* DTO-Owned vs FormRequest-Owned Factories

---

# Architecture-Level Decision Trees

---

## Decision 1: Named Static Factories vs Generic `from()` Method

---

## Decision Context

Whether to provide per-source named static factory methods (`fromRequest()`, `fromModel()`, `fromArray()`) or a single generic `from()` method that dispatches internally based on parameter type.

---

## Decision Criteria

* Number of source types the DTO is constructed from
* Whether source types have different risks (unvalidated input, lazy loading)
* Whether the codebase is production-grade vs prototype
* Whether using spatie/laravel-data (which provides `Data::from()`)

---

## Decision Tree

How many source types does this DTO support?
↓
Single source type → Single `fromArray()` factory is sufficient — no dispatch needed
2-3 source types (array + request + model)?
YES → Are source-specific risks different?
    YES → Named factories required: `fromRequest()` uses `validated()`, `fromModel()` eager-loads
    NO → Named factories still preferred for clarity and documentation
NO → Using spatie/laravel-data?
    YES → Use package's built-in `Data::from()` and `Data::fromRequest()` — they handle dispatch
    NO → Always use named static factories — never a single generic `from()` dispatcher

---

## Rationale

Each source type has different risks and requirements. A `fromModel()` factory must prevent lazy loading. A `fromRequest()` factory must use validated data. A `fromArray()` factory must handle missing keys. Named factories make these contracts explicit. A single generic `from()` method obscures these differences and can accept unvalidated input silently.

---

## Recommended Default

**Default:** Named static factories (`fromArray()`, `fromRequest()`, `fromModel()`) for all plain DTOs; use spatie/laravel-data's built-in `Data::from()` for Data objects
**Reason:** Named factories document the source type and enforce source-specific safety guarantees. Generic dispatchers hide risks.

---

## Risks Of Wrong Choice

* Generic `from()`: Accepts unvalidated request data, triggers lazy loading, obscures source-specific risks
* Named factories for single source: Unnecessary method proliferation — one `fromArray()` is sufficient
* Missing `fromArray()`: Every caller duplicates mapping logic

---

## Related Rules

* Use Named Static Factories for Each Source Type (05-rules.md)
* Always Construct DTOs from Validated Data — Never from `$request->all()` (05-rules.md)

---

## Related Skills

* Skill: Add Named Static Factories to a DTO

---

## Decision 2: Manual Mapping vs Spread Operator

---

## Decision Context

Whether to use explicit key-to-property mapping or the PHP spread operator (`...$data`) inside factory methods.

---

## Decision Criteria

* Whether source keys are guaranteed to match parameter names exactly
* Whether the DTO has optional/nullable fields
* Whether the codebase is production-grade
* Number of consumers of the factory method

---

## Decision Tree

Are source array keys guaranteed to match parameter names exactly?
↓
YES (e.g., `$request->validated()` after FormRequest validation)?
NO → Always use manual mapping — keys may differ, be missing, or contain extras
YES → Does the DTO have optional/nullable fields with defaults?
    YES → Manual mapping with `?? null` for explicit null handling — spread silently skips
    NO → Is the factory used by 3+ consumers?
        YES → Manual mapping for safety — spread breaks all consumers if a key is renamed
        NO → Spread operator is acceptable for simple, stable internal factories
NO → Is the factory in production code with multiple consumers?
    YES → Manual mapping required — safety outweighs verbosity
    NO → Spread may be acceptable for prototype or private/internal factories

---

## Rationale

The spread operator silently ignores extra keys and fatally errors on missing keys. It provides no protection against source data shape changes. Manual mapping catches key renames at compile time, documents which source keys map to which DTO properties, and handles null defaults explicitly. The safety of manual mapping is worth the verbosity for production codebases.

---

## Recommended Default

**Default:** Manual mapping in all production factory methods; spread operator only in test code or private internal factories with guaranteed key matching
**Reason:** Manual mapping provides compile-time safety and explicit null handling. Spread operator is concise but fragile.

---

## Risks Of Wrong Choice

* Spread with mismatched keys: Fatal error on missing keys, silent pass-through of extra keys
* Spread with nullable fields: Properties may be left uninitialized if key is missing
* Manual mapping everywhere: Verbose, but safety tradeoff is worth it for production

---

## Related Rules

* Use Manual Mapping Over Spread Operator in Production Factories (05-rules.md)
* Keep Factory Methods Free of Service Dependencies (05-rules.md)

---

## Related Skills

* Skill: Add Named Static Factories to a DTO

---

## Decision 3: DTO-Owned vs FormRequest-Owned Factories

---

## Decision Context

Whether the bridge between FormRequest and DTO lives on the DTO (`fromRequest()`) or on the FormRequest (`payload()` method).

---

## Decision Criteria

* Team organizational preference (HTTP-centric vs data-centric)
* Whether the same DTO is used across multiple FormRequests
* Whether mapping logic is simple or complex

---

## Decision Tree

Is the same DTO used across multiple FormRequests?
↓
YES → DTO-owned `fromRequest()` — one factory on the DTO, multiple FormRequests pass themselves in
NO → Single FormRequest → DTO pair?
    YES → Either pattern works — choose based on team preference:
        FormRequest-owned `payload()`: Mapping lives close to HTTP layer (HTTP-centric teams)
        DTO-owned `fromRequest()`: Mapping lives on data carrier (data-centric teams)
NO → Is the mapping logic complex (field renames, type transformations, computed values)?
    YES → DTO-owned `fromRequest()` — keeps mapping logic centralized on the data object
    NO → Either — mapping is trivial, so organizational preference is the deciding factor
NO → Is the project using spatie/laravel-data?
    YES → `Data::fromRequest()` serves as the bridge automatically — no decision needed

---

## Rationale

FormRequest-owned `payload()` keeps mapping close to the HTTP layer, which is intuitive for HTTP-centric teams. DTO-owned `fromRequest()` centralizes mapping on the data object, which is consistent across all entry points (HTTP, CLI, queue). Both are valid — the key is choosing one convention and applying it consistently.

---

## Recommended Default

**Default:** DTO-owned `fromRequest()` for data-centric teams; FormRequest-owned `payload()` for HTTP-centric teams. Apply the chosen convention consistently across the project.
**Reason:** Consistency matters more than which pattern is chosen. Either pattern provides the explicit bridge that prevents inline DTO construction in controllers.

---

## Risks Of Wrong Choice

* Mixed patterns: Some controllers use `payload()`, others use `fromRequest()` — inconsistency
* Inline construction in controller: No bridge at all — mapping logic duplicated across controllers
* FormRequest-owned for shared DTO: DTO used by multiple FormRequests requires multiple `payload()` implementations

---

## Related Rules

* Use the Bridging Pattern — `payload()` on FormRequest or `fromRequest()` on DTO (05-rules.md)
* Never Pass FormRequest Instances to Services (05-rules.md)

---

## Related Skills

* Skill: Bridge FormRequest to DTO via payload() or fromRequest()

