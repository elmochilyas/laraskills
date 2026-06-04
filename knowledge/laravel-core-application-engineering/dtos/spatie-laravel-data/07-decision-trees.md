# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Spatie/laravel-data Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* spatie/laravel-data vs Plain DTOs
* `Data::fromRequest()` vs `Data::from()` with Validated Data
* Validation in Data Object vs FormRequest

---

# Architecture-Level Decision Trees

---

## Decision 1: spatie/laravel-data vs Plain DTOs

---

## Decision Context

Whether to use the spatie/laravel-data package for DTO management or stick with plain PHP DTOs.

---

## Decision Criteria

* Number of endpoints and DTOs in the application
* Whether TypeScript type generation is needed
* Whether the application is a package/library (avoid external dependencies)
* Team preference for declarative vs explicit patterns
* Whether PHP 8.1+ is available

---

## Decision Tree

Is this a package or library distributed to external consumers?
↓
YES → Plain DTOs — avoid external dependencies in distributed code
NO → Is the project CRUD-heavy with many endpoints (20+)?
    YES → spatie/laravel-data saves significant boilerplate — automatic factories, casting, validation
    NO → Is there a TypeScript frontend consuming API types?
        YES → spatie/laravel-data strongly preferred — TypeScript generation is a unique value
        NO → Does the team prefer declarative over explicit?
            YES → spatie/laravel-data — automatic pipeline reduces manual code
            NO → Plain DTOs — more control, zero framework coupling, simpler debugging
NO → Is the project on PHP 8.0 or earlier?
    YES → Plain DTOs — spatie/laravel-data requires PHP 8.1+
    NO → spatie/laravel-data is an option — evaluate against other criteria

---

## Rationale

spatie/laravel-data eliminates boilerplate (factories, casters, serializers) through its declarative pipeline. For CRUD-heavy applications with many endpoints, this saves significant code. The TypeScript generation feature is unique and valuable for full-stack type safety. However, plain DTOs offer zero external dependencies, more explicit control, and simpler debugging. The choice depends on application complexity and team preferences.

---

## Recommended Default

**Default:** spatie/laravel-data for CRUD-heavy applications with 20+ endpoints or TypeScript frontends; plain DTOs for packages, simple applications, or teams preferring explicit control
**Reason:** spatie/laravel-data's boilerplate elimination pays off at scale. Plain DTOs are simpler for small applications and avoid external dependencies.

---

## Risks Of Wrong Choice

* spatie/laravel-data for package: External consumers forced to install the package
* Plain DTOs for CRUD-heavy app: Significant manual boilerplate for factories, casters, serializers
* spatie/laravel-data in legacy PHP: Incompatible with PHP 8.0

---

## Related Rules

* Use `Data::fromRequest()` Over `Data::from($request->all())` (05-rules.md)
* Never Add Business Logic or Persistence Code to Data Objects (05-rules.md)
* Never Use `Data::fromRaw()` or `new Data(...)` in Production Code (05-rules.md)

---

## Related Skills

* Skill: Define a Data Object with Spatie/laravel-data

---

## Decision 2: `Data::fromRequest()` vs `Data::from()` with Validated Data

---

## Decision Context

Whether to construct a Data object via `Data::fromRequest($request)` or via `Data::from($request->validated())` or `Data::from($request->all())`.

---

## Decision Criteria

* Whether a FormRequest exists with authorization and validation rules
* Whether the Data object has its own validation rules
* Whether the entry point is HTTP or non-HTTP
* Whether security (mass-assignment protection) is a concern

---

## Decision Tree

Is the entry point HTTP?
↓
YES → Does a FormRequest exist with authorization rules?
    YES → Use `Data::fromRequest($request)` — automatically uses `validated()` data, preserves authorization
    NO → Is there a FormRequest with validation rules?
        YES → `Data::fromRequest()` still preferred — uses validated data from the FormRequest
        NO → Use `Data::from($request->validated())` — but consider adding a FormRequest for authorization
NO → Is this a CLI command or queue job?
    YES → Use `Data::from($validatedArray)` where `$validatedArray` is explicitly validated input
    NO → Is this a test or internal code where the pipeline is needed?
        YES → `Data::from()` with a validated array — pipeline runs authorization → validation → casting
        NO → Always prefer `Data::fromRequest()` for HTTP, `Data::from()` with validated array otherwise
NO → Is the data coming from `$request->all()` (unvalidated)?
    YES → Never use this directly — always route through FormRequest's `validated()` or explicit validation
    NO → Use `Data::from()` with validated array

---

## Rationale

`Data::fromRequest()` automatically uses the FormRequest's `validated()` data, preserving authorization and input validation. `Data::from($request->all())` passes raw input to the Data pipeline, which has weaker authorization (no route parameters, no headers). `Data::fromRaw()` bypasses the pipeline entirely. Always prefer `Data::fromRequest()` for HTTP and `Data::from()` with a pre-validated array for non-HTTP.

---

## Recommended Default

**Default:** `Data::fromRequest($request)` for HTTP entry points; `Data::from($validatedArray)` for non-HTTP entry points; never `Data::from($request->all())` or `Data::fromRaw()`
**Reason:** `fromRequest()` preserves FormRequest authorization and validation. `from()` with validated array is safe for non-HTTP. `fromRaw()` and `from($request->all())` bypass security guarantees.

---

## Risks Of Wrong Choice

* `Data::from($request->all())`: Mass-assignment vulnerability, bypasses FormRequest authorization
* `Data::fromRaw()` in production: Entire pipeline bypassed — no authorization, validation, or casting
* `Data::from()` without pre-validation: Data enters service layer without input format checks

---

## Related Rules

* Use `Data::fromRequest()` Over `Data::from($request->all())` (05-rules.md)
* Never Use `Data::fromRaw()` or `new Data(...)` in Production Code (05-rules.md)
* Configure TypeScript Generation in CI to Prevent PHP/TypeScript Type Drift (05-rules.md)

---

## Related Skills

* Skill: Define a Data Object with Spatie/laravel-data

---

## Decision 3: Validation in Data Object vs FormRequest

---

## Decision Context

Whether to define validation rules on the Data object (via `rules()`) or on the FormRequest.

---

## Decision Criteria

* Whether the Data object is used across multiple entry points
* Whether the rules are domain-level or HTTP-specific
* Whether authorization context (route params, headers) is needed for rule conditions
* Whether the project uses spatie/laravel-data as the primary validation mechanism

---

## Decision Tree

Is the Data object used across multiple entry points (HTTP + CLI + queue)?
↓
YES → Data object validation recommended — rules on Data apply to all entry points automatically
NO → HTTP-only usage?
    YES → Is authorization context (route params, headers) needed for conditional rules?
        YES → FormRequest validation — has access to route parameters and headers that Data lacks
        NO → Does the application prefer Data-side validation for consistency?
            YES → Data object validation — define `rules()` on the Data class
            NO → FormRequest validation — keeps validation at the HTTP boundary
    NO → CLI/queue entry point?
        YES → Data object validation is the sole option — FormRequests don't apply
NO → Does the project use spatie/laravel-data with TypeScript generation?
    YES → Data object validation ensures TypeScript types reflect validation constraints
    NO → Either layer — pick one authoritative source per application

---

## Rationale

Data object validation ensures consistency across all entry points. FormRequest validation has richer context for conditional rules. The key rule is: never duplicate the same validation rule in both layers. If the Data object validates the same rule as the FormRequest, the rules will diverge over time. Choose one authoritative layer per application.

---

## Recommended Default

**Default:** FormRequest authoritative for HTTP-specific rules (authorization, input format); Data object authoritative for domain rules or when used across multiple entry points
**Reason:** Each layer owns its concerns. FormRequest handles HTTP-specific validation with richer context. Data object handles domain rules that apply everywhere. No overlap, no divergence.

---

## Risks Of Wrong Choice

* Duplicate rules in both: Always diverge over time — one updated, the other forgotten
* Data validation for HTTP-only: Extra validation overhead with no benefit — FormRequest already validates
* FormRequest validation for multi-entry-point: CLI/queue entry points bypass validation entirely

---

## Related Rules

* Define Validation Rules in Exactly One Layer — Either FormRequest or Data Object, Never Both (05-rules.md)
* Respect the Pipeline Order — Never Add Custom Pipes That Violate Authorization → Validation → Casting (05-rules.md)

---

## Related Skills

* Skill: Define a Data Object with Spatie/laravel-data

