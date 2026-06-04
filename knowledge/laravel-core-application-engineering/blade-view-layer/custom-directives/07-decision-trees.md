# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Custom Directives
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Directive vs Blade Component
* Custom Directive vs Helper Function
* Blade::if() vs Blade::directive() for Custom Conditionals

---

# Architecture-Level Decision Trees

---

## Decision 1: Custom Directive vs Blade Component

---

## Decision Context

Whether to implement a reusable template feature as a custom `@directive` or as an `<x-component>`.

---

## Decision Criteria

* Whether the output includes HTML structure (multiple tags, slots)
* Whether the feature needs slot content injection
* Whether the feature needs attribute bags or data binding

---

## Decision Tree

Does the reusable feature need to output HTML (multiple tags, divs, classes)?
↓
NO → Single expression transform (formatting, date conversion, string manipulation)?
    YES → Custom directive is appropriate
    NO → Blade component is more appropriate
YES → Does it need slot content (content between opening/closing tags)?
    YES → Blade component (directives cannot accept slots)
    NO → Does it need attribute bags or complex data binding?
        YES → Blade component
        NO → Is the output simpler than a single tag?
            YES → Directive may be acceptable but component is preferred
            NO → Blade component

---

## Rationale

Directives compile to PHP expressions — they cannot accept slot content, process attributes, or encapsulate HTML structure. Components provide slots, attribute bags, dependency injection, and testability. A directive that returns HTML is a component pretending to be a directive.

---

## Recommended Default

**Default:** Blade components for reusable UI with HTML. Custom directives for PHP expression transformations only.
**Reason:** Components support slots, attributes, and testing. Directives are only suitable when you need to transform a PHP expression at compile time.

---

## Risks Of Wrong Choice

* Directive returning HTML: No slot support, no attribute bag, untestable compared to components
* Component for simple formatting: Overkill — a 5-line directive replaces a full class + template file

---

## Related Rules

* Do Not Create Directives for Reusable UI (05-rules.md)
* Keep Directive Logic Simple — No Business Logic (05-rules.md)

---

## Related Skills

* Skill: Register Custom Blade Directives

---

## Decision 2: Custom Directive vs Helper Function

---

## Decision Context

Whether to implement a reusable value transformation as a `@directive` or as a PHP helper function.

---

## Decision Criteria

* Whether the transformation needs to create control structures (if/else blocks)
* Whether the transformation is purely a value conversion
* Whether the function needs to be tested in isolation
* Whether the function needs to be discoverable via IDE search

---

## Decision Tree

Does the transformation need to create PHP control structures (if/else/endif)?
↓
YES → Custom directive (helpers cannot create control flow)
NO → Is the transformation purely a value conversion (formatting, truncation, encoding)?
    YES → Helper function — testable as pure PHP, IDE-discoverable, importable anywhere
    NO → Does the transformation need to run at compile time for performance?
        YES → Custom directive (compiled once, cached)
        NO → Helper function

---

## Rationale

Helper functions are pure PHP — they can be unit-tested directly, discovered via IDE search, and used anywhere (Blade, PHP, controllers). Directives are syntax-only and only work in Blade. Use helpers for value transformation; use directives only when you need control flow or compile-time transformation.

---

## Recommended Default

**Default:** Helper function for value transformation; custom directive only for control-flow syntax or compile-time optimization
**Reason:** Helpers are testable, discoverable, and reusable across all contexts. Directives should be reserved for what helpers cannot do.

---

## Risks Of Wrong Choice

* Directive for formatting: Hidden in Blade, untestable in isolation, not reusable in PHP code
* Helper for control flow: Cannot create `@if`/`@else`/`@endif` structure in templates

---

## Related Rules

* Keep Directive Logic Simple — No Business Logic (05-rules.md)
* Prefix All Custom Directive Names (05-rules.md)

---

## Related Skills

* Skill: Register Custom Blade Directives

---

## Decision 3: Blade::if() vs Blade::directive() for Custom Conditionals

---

## Decision Context

Whether to register a custom conditional using `Blade::if()` (auto generates `@name`/`@elsename`/`@endname`) or `Blade::directive()` (manual implementation).

---

## Decision Criteria

* Whether the conditional follows the if/else/endif pattern
* Whether the conditional needs complex expression evaluation
* Whether custom control structures beyond if/else are needed

---

## Decision Tree

Does the conditional follow the standard if/else pattern (condition is true → output, false → skip)?
↓
YES → `Blade::if('name', fn(): bool => ...)` — auto-generates `@name`/`@elsename`/`@endname`
NO → Does the conditional need to evaluate PHP expressions as arguments?
    YES AND complex → `Blade::directive()` with careful manual implementation
    NO → `Blade::if()` is simpler and safer
NO → Does the directive need custom control flow beyond if/else (loops, try/catch)?
    YES → `Blade::directive()` (Blade::if handles only conditionals)
    NO → `Blade::if()`

---

## Rationale

`Blade::if()` automatically generates the full `@if`/`@else`/`@endif` directive structure with proper scoping. Using `Blade::directive()` for conditionals requires manually implementing the else/endif logic and returning raw PHP control structures — this is error-prone and introduces scoping bugs.

---

## Recommended Default

**Default:** `Blade::if()` for all custom conditionals; `Blade::directive()` only for non-conditional formatting macros
**Reason:** `Blade::if()` handles scoping, else, and endif automatically. Manual implementation in `Blade::directive()` is fragile and unnecessary for standard conditionals.

---

## Risks Of Wrong Choice

* `Blade::directive()` for conditionals: Scoping bugs, unclosed if blocks, manual endif required
* `Blade::if()` for non-conditional formatting: Cannot work — `Blade::if()` requires a boolean return

---

## Related Rules

* Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()` (05-rules.md)

---

## Related Skills

* Skill: Register Custom Blade Directives
