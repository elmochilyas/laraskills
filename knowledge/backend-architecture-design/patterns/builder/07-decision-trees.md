# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Builder pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Builder vs constructor with named arguments
* Decision 2: Builder mutability — fluent mutable vs immutable builder
* Decision 3: Builder validation strategy — build-time vs step-time validation

---

# Architecture-Level Decision Trees

---

## Decision: Builder vs Constructor with Named Arguments

---

## Decision Context

Choose between a dedicated Builder class and PHP 8+ named arguments with constructor promotion for constructing complex objects.

---

## Decision Criteria

* performance considerations: Builder allocates intermediate object per step (immutable) or mutates state (mutable); direct constructor is one allocation
* architectural considerations: Builder separates construction from representation; constructor couples both
* security considerations: Builder can validate at build time; constructor validates inline
* maintainability considerations: Builder can have fluent API and defaults; constructor with named args is idiomatic PHP 8+

---

## Decision Tree

Does the object have more than 4-5 optional constructor parameters?
↓
YES → Consider Builder (named arguments still usable, but Builder provides cleaner incremental construction)
    ↓
    Are many constructor parameters optional with meaningful defaults?
    YES → Builder can provide sensible defaults and override only what's needed
        ↓
        Example: `new QueryBuilder()->select(...)->from(...)->where(...)->get()`
        NO → Constructor with named arguments is sufficient (PHP 8+ named params)
    ↓
    Does construction involve multi-step logic (not just setting properties)?
    YES → Builder (each step can have logic, validation, transformation)
        ↓
        Example: DTO builder that normalizes input, validates format, then builds
        NO → Named arguments are simpler for simple property population
NO → Constructor with named arguments (PHP 8+ named parameters)
    ↓
    `new Product(name: 'Widget', price: 100, category: 'tools')`
    ↓
    Is the object constructed in many places with the same common configuration?
    YES → Static factory method + named arguments (factory encapsulates common defaults)
        ↓
        `Product::basic(string $name, Money $price): self` — sets category, status defaults
        NO → Direct named-argument constructor — no builder overhead needed
NO → Does the object need to be constructed differently based on runtime context?
    YES → Builder (different director configurations produce different object variants)
    ↓
    Director orchestrates builder steps differently per use case
    NO → Constructor or factory is sufficient

---

## Rationale

PHP 8 named arguments have significantly reduced the need for the Builder pattern in many cases. Builder remains valuable when construction involves multiple steps with logic per step, when you need different object variants from the same construction process, or when the object has many optional parameters where named arguments still lead to cluttered callsites.

---

## Recommended Default

**Default:** PHP 8 named arguments with constructor promotion for most DTOs and value objects. Builder when construction requires step-wise logic, validation, or multiple construction variants.
**Reason:** Named arguments are idiomatic PHP 8+, require no extra classes, and provide excellent readability.

---

## Risks Of Wrong Choice

Builder where named args suffice: unnecessary class, boilerplate, cognitive overhead. Named args where step logic is needed: construction logic leaks into client code, duplicated across callers. No builder for multi-variant construction: inconsistent object construction across the codebase.

---

## Related Rules

- Rule 1: Prefer named arguments for DTO/value object construction (PHP 8+)
- Rule 2: Use Builder when construction involves step-wise logic or multiple variants

---

## Related Skills

- Use PHP 8 Named Arguments
- Implement Fluent Builder
- Design Builder with Directors

---

## Decision: Builder Mutability — Fluent Mutable vs Immutable Builder

---

## Decision Context

Choose whether builder methods mutate internal state (fluent mutable) or return new builder instances (immutable).

---

## Decision Criteria

* performance considerations: mutable builder allocates once; immutable builder allocates per step (measurable at 100k+/s)
* architectural considerations: immutable prevents accidental reuse; mutable allows builder reuse
* security considerations: immutable builder cannot leak state between builds; mutable can be reused unsafely
* maintainability considerations: mutable is more familiar (Laravel conventions); immutable is safer but verbose

---

## Decision Tree

Will the builder be used in long-running processes (Octane, queues) where builder instances persist?
↓
YES → Immutable builder (prevents accidental state sharing between requests)
    ↓
    Each `->withX()` returns a new instance — original remains unmodified
    ↓
    Example: `$b1 = new Builder(); $b2 = $b1->withName('foo'); // $b1 unchanged`
    ↓
    Does memory overhead matter for this use case (building 10k+ objects per request)?
    YES → Profile first; immutable allocation overhead may be significant at scale
    ↓
    Consider mutable builder with `clone` before mutation if needed
    NO → Immutable is safe for long-running processes — recommended default
NO → Is the builder reused after `build()` in the same request?
    YES → Must clone or use immutable (mutable builder after `build()` may have stale state)
    ↓
    `$builder->build(); $builder->build(); // mutable: second build may use stale state`
    NO → Mutable builder is simpler (Laravel convention — Eloquent Builder, Query Builder)
        ↓
        Mutable builder mutates `$this` on each method call
        Simpler code, less allocations, familiar pattern
        ↓
        Is this builder part of a library/package consumed by others?
        YES → Offer immutable interface (consumers expect safety from external packages)
        NO → Mutable is acceptable for internal use

---

## Rationale

Mutable builders are simpler and match Laravel conventions (Eloquent Builder mutates `$this`). Immutable builders are safer in long-running processes and when the builder is reused. The choice hinges on whether builder instances cross request boundaries (Octane) or are reused after `build()`.

---

## Recommended Default

**Default:** Mutable builder for request-scoped construction (standard Laravel pattern). Immutable builder for long-running processes (Octane) or library/published packages.
**Reason:** Mutable is simpler and more performant for single-use construction. Immutable prevents subtle cross-request bugs in Octane.

---

## Risks Of Wrong Choice

Mutable builder reused after `build()`: second call returns object with stale/modified state. Immutable builder in hot path (100k+/s): GC pressure from intermediate allocations. Mutable builder in Octane: cross-request state contamination.

---

## Related Rules

- Rule 3: Immutable builder for Octane/long-running processes
- Rule 4: Mutable builder is acceptable for request-scoped single-use construction

---

## Related Skills

- Implement Fluent Mutable Builder
- Implement Immutable Builder
- Detect Builder Reuse Bugs

---

## Decision: Builder Validation Strategy — Build-Time vs Step-Time Validation

---

## Decision Context

Choose whether the builder validates state at each step or only when `build()` is called.

---

## Decision Criteria

* performance considerations: step-time validation runs N times; build-time validation runs once
* architectural considerations: step-time fails fast; build-time accumulates errors for complete reporting
* security considerations: step-time prevents storing invalid intermediate state; build-time may store invalid until final
* maintainability considerations: step-time spreads validation logic; build-time centralizes it

---

## Decision Tree

Is early feedback critical (the user/developer should know immediately when they set an invalid value)?
↓
YES → Step-time validation (validate each property as it's set)
    ↓
    Each setter validates its argument immediately
    Example: `->withEmail('invalid')` throws exception immediately
    ↓
    Does the property depend on other properties that may not be set yet?
    YES → Deferred validation — check cross-property constraints at `build()` only
        ↓
        Step-time validates individual properties (type, format, range)
        Build-time validates cross-property constraints (email+domain, start+end)
        NO → Step-time validation for all constraints is safe
NO → Build-time validation (validate all at once in `build()`)
    ↓
    Collect all values, then validate in one place
    Provides complete error reporting (all violations at once)
    ↓
    Is a complete error report preferred (form validation UX)?
    YES → Build-time validation with aggregated error messages
        ↓
        Example: `$errors = []; if(!$name) $errors[] = 'name required'; if(!$email) $errors[] = 'email required'`
        Throw `ValidationException` with all errors
        NO → Step-time validation with immediate exception (simpler, fail-fast)
NO → Is this a data builder for tests?
    YES → Build-time validation with sensible defaults (test builders should rarely fail)
        ↓
        Test builders provide defaults for all required fields
        Build-time validation catches incomplete configurations
        NO → Step-time for strict validation (domain objects, business rules)

---

## Rationale

Step-time validation provides immediate feedback and is simpler for single-property constraints. Build-time validation is necessary for cross-property constraints and when comprehensive error reporting is required (e.g., API request validation). Test builders should use build-time validation with generous defaults to minimize test friction.

---

## Recommended Default

**Default:** Step-time validation for individual property constraints. Build-time validation for cross-property constraints. Test builders use build-time validation with complete defaults.
**Reason:** Step-time catches errors early. Build-time handles relationships between properties. Test builders should not fail during test setup.

---

## Risks Of Wrong Choice

Step-time validation blocking valid state: property A depends on B, but B not yet set → false positive. Build-time only validation: user sets invalid email, proceeds 10 steps, then gets error at end — poor UX. No validation at all: builder creates invalid objects, runtime errors at usage point.

---

## Related Rules

- Rule 5: Step-time validates individual properties; build-time validates cross-property constraints
- Rule 6: Test builders must provide complete defaults — never fail on partial configuration

---

## Related Skills

- Implement Step-Time Validation
- Implement Build-Time Validation
- Design Test Data Builders
