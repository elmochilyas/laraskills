# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Custom Validation Rules
**Generated:** 2026-06-03

---

# Decision Inventory

* Invokable Rule Class vs Closure for Reusable Validation
* Custom Rule vs Validator::extend() Legacy Approach
* Custom Rule Placement: app/Rules/ vs Feature Directory

---

# Architecture-Level Decision Trees

---

## Decision 1: Invokable Rule Class vs Closure for Reusable Validation

---

## Decision Context

Whether to create a reusable invokable rule class (implementing `ValidationRule`) or define a Closure rule inline in the FormRequest.

---

## Decision Criteria

* Whether the validation logic is used in 2+ FormRequests or validators
* Whether the logic is complex (database query, API call, business logic)
* Whether the logic needs dependency injection (repository, service, external client)
* Whether the logic needs to be unit-testable in isolation

---

## Decision Tree

Is the validation logic used in 2+ places?
↓
YES → Create an invokable rule class — reusable, autoloadable, testable
NO → Does the logic require dependency injection (database query, API call)?
    YES → Create an invokable rule class — container resolves dependencies automatically
    NO → Is the logic complex (more than 5 lines, multiple conditions)?
        YES → Create an invokable rule class — keeps FormRequest lean, testable in isolation
        NO → Does the logic need to be unit-tested?
            YES → Create an invokable rule class — testable via `$rule->validate(...)`
            NO → Use a Closure in the FormRequest's `rules()` method

---

## Rationale

Invokable rule classes are the standard approach since Laravel 10. They are autoloadable, support dependency injection, and are testable in isolation. Closures are acceptable only for trivial, single-use logic that is too simple to warrant a dedicated class.

---

## Recommended Default

**Default:** Create invokable rule classes for all custom validation logic. Use Closures only for trivial one-off checks.
**Reason:** Invokable classes are testable, reusable, and follow Laravel conventions. Closures in `rules()` arrays cannot be reused or tested without invoking the full validation pipeline.

---

## Risks Of Wrong Choice

* Closure for complex logic: 20-line closure in `rules()` — untestable, unreusable, hard to read
* Invokable class for single `!$this->input('field')`: File overhead for 2-line validation
* Closure needing DI: Can't inject services — must use `app()` or manual resolution
* No rule class for reused logic: Duplicate Closure in 3 FormRequests — violations when one copy is updated

---

## Related Rules

* Prefer Invokable Classes Over Closures for Reusable Rules

---

## Related Skills

* Create and Use Invokable Custom Validation Rules

---

---

## Decision 2: Custom Rule vs Validator::extend() Legacy Approach

---

## Decision Context

Whether to create custom validation as an invokable rule class or use the legacy `Validator::extend()` method.

---

## Decision Criteria

* Whether the project targets Laravel 10+ (where invokable rules are the standard)
* Whether the rule needs to support string-syntax usage (`-> Sometimes:rule_name`)
* Whether the rule needs to be easily autoloaded and discoverable
* Whether the project has existing `Validator::extend()` rules that would need migration

---

## Decision Tree

Is the project on Laravel 10+?
↓
YES → Use invokable rule classes — the modern, recommended approach
NO → Is the project on Laravel 9 or earlier?
    YES → Use `Validator::extend()` if targeting compatibility; consider upgrading first
    NO → Does the rule need to be referenced by string name in pipe-delimited syntax?
        YES → Use `Validator::extend()` — string-name registration is required for pipe syntax
        NO → Does the project already have 5+ `Validator::extend()` registrations?
            YES → Consider consistency — may stay with `Validator::extend()` for existing rule sets
            NO → Use invokable rule classes — autoloadable, no manual registration

---

## Rationale

Invokable rule classes are the standard in Laravel 10+. They implement `ValidationRule` or `Rule` interfaces, are autoloaded by Composer, and don't require manual registration in service providers. `Validator::extend()` is legacy and requires explicit registration, making rules harder to discover.

---

## Recommended Default

**Default:** Use invokable rule classes for all custom validation on Laravel 10+. Use `Validator::extend()` only when targeting older versions or when string-name syntax is required.
**Reason:** Invokable rules require no registration, are autoloadable, support DI, and are the framework's recommended approach. `Validator::extend()` adds a registration step and is less discoverable.

---

## Risks Of Wrong Choice

* `Validator::extend()` on Laravel 10+: Using legacy approach when modern standard exists — less discoverable
* Invokable class with string-name reference: Can't reference by string in pipe syntax — must use `new RuleClass()`
* `Validator::extend()` without provider registration: Rule never registered — runtime error
* Mix of both approaches: Inconsistent — developers don't know which pattern to follow

---

## Related Rules

* Prefer Invokable Classes Over Closures for Reusable Rules

---

## Related Skills

* Create and Use Invokable Custom Validation Rules

---

---

## Decision 3: Custom Rule Placement: app/Rules/ vs Feature Directory

---

## Decision Context

Where to place custom rule classes — in the centralized `app/Rules/` directory or within the feature/module they belong to.

---

## Decision Criteria

* Whether the project uses feature-based or layer-based organization
* Whether the rule is shared across 2+ features or specific to one
* Whether the rule represents a domain concept or a technical validation
* Whether the project convention places rules in a specific location

---

## Decision Tree

Does the project use feature-based organization (app/Features/)?
↓
YES → Is the rule specific to a single feature?
    YES → Place inside the feature's `Rules/` directory — co-located with the domain
    NO → Place in `app/Rules/` — shared across features
NO → Does the project use layer-based organization?
    YES → Place in `app/Rules/` — centralized location, matches Laravel convention
    NO → Does the rule represent a core domain concept (ValidEmail, ValidPostalCode)?
        YES → Place in `app/Rules/` — domain concepts are application-wide
        NO → Place in `app/Rules/` — default location for custom rules

---

## Rationale

Rule placement should match the project's organizational pattern. Feature-based projects co-locate rules with the feature. Layer-based projects centralize rules in `app/Rules/`. Rules that represent core domain concepts or are shared across features belong in the centralized location regardless of project structure.

---

## Recommended Default

**Default:** `app/Rules/` for layer-based projects. Feature-local `Rules/` directory for feature-specific rules in feature-based projects.
**Reason:** Rule placement should follow the same organizational pattern as the rest of the codebase. Consistency is more important than the specific location.

---

## Risks Of Wrong Choice

* Feature rule in `app/Rules/`: Ownership unclear — which feature owns ValidCouponCode?
* Shared rule in a feature directory: Other features must import from a foreign feature — coupling
* No consistent placement: Some rules in `app/Rules/`, some in features, some in FormRequests — hard to find
* Rule in wrong namespace: Autoloading failure — `Rule::class` not found

---

## Related Rules

* Custom Rule Namespace Convention

---

## Related Skills

* Create and Use Invokable Custom Validation Rules
