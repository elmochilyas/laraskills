# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** View Models and Presenters
**Generated:** 2026-06-03

---

# Decision Inventory

* View Model vs Template Inline Formatting
* View Model vs API Resource
* Eager vs Lazy Computation in View Models

---

# Architecture-Level Decision Trees

---

## Decision 1: View Model vs Template Inline Formatting

---

## Decision Context

Whether to extract presentation logic (formatting, conditionals, computed values) into a view model class or keep it inline in the Blade template.

---

## Decision Criteria

* Template complexity (number of conditionals, formatting calls, fallbacks)
* Whether the same formatting logic appears in multiple templates
* Whether the template needs to be testable in isolation
* Whether the template exceeds 50 lines of presentation logic

---

## Decision Tree

Does the template contain multiple conditionals (`@if`/`@elseif`/`@else` chains)?
↓
NO → Is there complex formatting (currency, dates, status badges)?
    NO → Simple variable interpolation (`{{ $user->name }}`) — no view model needed
    YES → Is the same formatting logic repeated in 2+ templates?
        YES → View model (shared formatting) or helper function (single formatting call)
        NO → View model if 3+ formatting calls; helper function for 1-2
YES → Is there null/fallback handling (`$user?->profile?->bio ?? 'No bio'`)?
    YES → View model — encapsulate null handling in a method
NO → Are there computed values from model state (isOverdue, canBeCancelled)?
    YES → View model — computed properties with descriptive names
NO → Does the template exceed 50 lines of complex logic?
    YES → View model — extract logic, keep template lean
    NO → Template inline may be acceptable

---

## Rationale

View models encapsulate formatting logic that would otherwise clutter the template. For simple variable interpolation, a view model adds ceremony without benefit. For complex templates with multiple conditionals, formatting, and null handling, view models significantly improve readability and testability.

---

## Recommended Default

**Default:** View model when template has multiple conditionals, complex formatting, or null handling; no view model for simple interpolation
**Reason:** View models provide value when they encapsulate complexity. Premature extraction creates an inflated codebase full of trivial, unused classes.

---

## Risks Of Wrong Choice

* View model for simple template: Unnecessary class ceremony for no benefit
* Inline formatting for complex template: Hard to read, impossible to test in isolation
* View model for everything: Codebase fills with trivial view models

---

## Related Rules

* Only Create View Models When Templates Exceed a Complexity Threshold (05-rules.md)
* Never Include Business Logic in View Models (05-rules.md)

---

## Related Skills

* Skill: Implement View Models for Complex Template Data

---

## Decision 2: View Model vs API Resource

---

## Decision Context

Whether to use a view model (for Blade templates) or an API Resource (for JSON responses) when transforming data for output.

---

## Decision Criteria

* Whether the output format is HTML (Blade) or JSON (API)
* Whether the transformation includes Blade-specific methods (route(), auth())
* Whether the same transformation logic is needed for both formats

---

## Decision Tree

Is the output destination a Blade template (HTML) or a JSON API response?
↓
Blade template → View model
    View models can call `route()`, `auth()`, `config()` — Blade-specific helpers
JSON API response → API Resource (extends `JsonResource`)
    Resources are designed for JSON serialization without Blade dependencies
NO → Does the same transformation need to work in BOTH Blade and JSON contexts?
    YES → Create both: view model for Blade, API Resource for JSON
        Shared formatting logic → helper function or DTO, consumed by both
    NO → Use the appropriate tool for the output format only

---

## Rationale

View models are Blade-specific — they may call `route()`, `auth()`, `config()`, or other Laravel helpers that depend on the HTTP request context. These calls break in API context (queue jobs, console commands) where no Blade template is rendering. API Resources are designed for JSON serialization and do not carry Blade-specific dependencies.

---

## Recommended Default

**Default:** View models for Blade templates; API Resources for JSON responses — never use one for the other's purpose
**Reason:** Each tool is designed for its specific output format. Reusing view models for JSON or API Resources for Blade creates coupling issues and broken behavior.

---

## Risks Of Wrong Choice

* View model for JSON: `route()` calls break in API/queue context
* API Resource for Blade: Cannot access Blade-specific state, no `$slot` support
* Single class for both: Either Blade or JSON will have broken features

---

## Related Rules

* Do Not Use View Models for API Responses (05-rules.md)

---

## Related Skills

* Skill: Implement View Models for Complex Template Data

---

## Decision 3: Eager vs Lazy Computation in View Models

---

## Decision Context

Whether to compute derived display values eagerly (in the constructor) or lazily (on first access via a method).

---

## Decision Criteria

* Whether the computed value is always needed by the template
* How expensive the computation is
* Whether the computation depends on runtime template state

---

## Decision Tree

Is the computed value ALWAYS needed when the template renders (always displayed)?
↓
YES → Eager computation in constructor as `readonly` property:
    `public readonly string $formattedTotal;`
    Set in constructor: `$this->formattedTotal = '...'`
NO → Is the value accessed conditionally (only on some renders)?
    YES → Is the computation cheap (< 1ms)?
        YES → Eager is fine — cost is negligible
        NO → Lazy method with memoization:
            public function stats(): array
            {
                return $this->stats ??= $this->computeExpensiveStats();
            }
NO → Does the computation require template state (parameters from the view)?
    YES → Method (not property): `public function statusBadgeClass(): string`
    NO → Readonly property or method

---

## Rationale

Eager computation in the constructor ensures the template does not trigger expensive computations on property access (no lazy loading surprises). Lazy computation avoids paying cost for values that are conditionally displayed. Methods are needed when computation requires parameters.

---

## Recommended Default

**Default:** Eager computation in readonly properties for values always needed; lazy methods with memoization for expensive conditional values
**Reason:** Eager computation pays cost once and guarantees availability. Lazy computation avoids unnecessary cost for conditional values.

---

## Risks Of Wrong Choice

* Eager for expensive conditional value: Cost paid on every render even when value is not displayed
* Lazy for always-needed value: `??=` check overhead on every access, potential for repeated computation
* Method for simple property: Adds method call overhead and ceremony for a simple formatted value

---

## Related Rules

* Use Readonly Properties for Eager-Computed Values (05-rules.md)
* Keep Constructor Parameters Focused — Maximum 3 (05-rules.md)

---

## Related Skills

* Skill: Implement View Models for Complex Template Data
