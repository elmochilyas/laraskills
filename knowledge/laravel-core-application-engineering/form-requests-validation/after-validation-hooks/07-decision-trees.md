# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** After Validation Hooks
**Generated:** 2026-06-03

---

# Decision Inventory

* withValidator() vs Overriding validator() for Validator Modification
* passedValidation() vs Controller-Side Post-Validation Logic
* after() Callback vs Custom Rule Class for Cross-Field Validation

---

# Architecture-Level Decision Trees

---

## Decision 1: withValidator() vs Overriding validator() for Validator Modification

---

## Decision Context

Whether to modify the validator instance using `withValidator()` or override the `validator()` method for custom validator construction.

---

## Decision Criteria

* Whether you need complete control over validator construction or just modification
* Whether you want to preserve default FormRequest behavior (messages, attributes, custom resolvers)
* Whether you need to add `after()` callbacks or mutate the validator before validation runs

---

## Decision Tree

Do you need complete control over how the Validator instance is constructed (custom Validator class, factory)?
↓
YES → Override `validator()` — return a completely custom validator instance
NO → Do you need to make targeted modifications after construction (add `after()` callbacks, inject data)?
    YES → Use `withValidator()` — safe hook designed for post-construction modification
    NO → Do you need to change validation data, messages, or attributes at construction time?
        YES → Use `validationData()`, `messages()`, or `attributes()` overrides instead
        NO → No modification needed — use defaults

---

## Rationale

Overriding `validator()` loses the default FormRequest behavior (automatic message customization, attribute name resolution, custom resolver injection). `withValidator()` is the safe hook for modifications — it fires after the validator is constructed with full defaults, giving you access to mutate without losing framework behavior.

---

## Recommended Default

**Default:** Use `withValidator()` for all validator modifications. Only override `validator()` when you need a completely different validator implementation (rare).
**Reason:** `withValidator()` preserves all default FormRequest behavior while providing full access to the constructed validator. Overriding `validator()` is a nuclear option that should be used sparingly.

---

## Risks Of Wrong Choice

* Overriding `validator()` unnecessarily: Lose message customization, attribute names, custom resolvers — silent behavior change
* `withValidator()` for full construction: Can't replace the validator class entirely — limited to mutations only
* No hook usage: Can't add cross-field validation or mutate validator — limited to basic `rules()` array

---

## Related Rules

* Use withValidator() for Validator Modification, Not Override

---

## Related Skills

* Implement Cross-Field Validation Using withValidator and after

---

---

## Decision 2: passedValidation() vs Controller-Side Post-Validation Logic

---

## Decision Context

Whether to handle post-validation side effects (data transformation, logging, enrichment) in the FormRequest's `passedValidation()` hook or in the controller after the request passes validation.

---

## Decision Criteria

* Whether the post-validation logic is tightly coupled to the request (data transformation, field normalization)
* Whether the post-validation logic produces output the controller needs
* Whether the logic is a side effect vs a data transformation
* Whether the logic is testable independently of the controller

---

## Decision Tree

Is the post-validation logic a data transformation (formatting, enriching, computing derived values)?
↓
YES → Does the controller need the transformed data?
    YES → Use `passedValidation()` — mutated data is available to the controller via `$request->validated()`
    NO → Use `passedValidation()` — co-locate transformation with validation
NO → Is the post-validation logic a side effect (logging, analytics, dispatching events)?
    YES → Does the side effect depend on successfully validated data?
        YES → Use `passedValidation()` — runs only on successful validation
        NO → Consider event listener — side effect shouldn't block the controller
    NO → Controller-side logic — controller actions should contain routing and orchestration, not transformations

---

## Rationale

`passedValidation()` is the correct place for request-level data transformations that depend on validated data. The controller should orchestrate the action, not transform request data. Side effects that are part of the action's outcome may also belong here. Controller-side post-validation logic is for response-specific concerns (redirects, response building).

---

## Recommended Default

**Default:** Use `passedValidation()` for data transformations on validated input. Keep controller response logic in the controller. Keep side effects in `passedValidation()` or event listeners.
**Reason:** `passedValidation()` co-locates transformation with validation. The controller remains focused on orchestration and response. This separation makes transformations testable without a controller.

---

## Risks Of Wrong Choice

* Transformations in controller: Controller accumulates data-wrangling logic — violates single responsibility
* Side effects in `passedValidation()`: Makes testing harder — side effects run every time the request validates
* `passedValidation()` for response concerns: FormRequest shouldn't know about redirects or response types

---

## Related Rules

* passedValidation() for Post-Validation Transformations

---

## Related Skills

* Implement Cross-Field Validation Using withValidator and after

---

---

## Decision 3: after() Callback vs Custom Rule Class for Cross-Field Validation

---

## Decision Context

Whether to implement cross-field validation (e.g., `end_date > start_date`) using a `Validator::after()` callback in `withValidator()` or a custom rule class.

---

## Decision Criteria

* Whether the validation involves 2+ fields that must be compared
* Whether the same cross-field logic is reusable across multiple validators
* Whether the validation requires access to the entire validated data set
* Whether the validation logic is complex (multiple conditions, database lookups)

---

## Decision Tree

Is the cross-field validation logic reused across 2+ FormRequests or validators?
↓
YES → Create a custom rule class — injects into the rule array, reusable, testable in isolation
NO → Does the validation compare 2+ fields at the validator level (end_date > start_date, password matches confirmation)?
    YES → Use `Validator::after()` callback in `withValidator()` — simplest for single-use cross-field checks
    NO → Does the validation require access to the entire validated data set?
        ↓
        YES → Use `Validator::after()` — after receives the full validator with all field data
        NO → Can the validation be expressed as a single-field rule with parameterized comparison?
            ↓
            YES → Use a custom rule class
            NO → Use `Validator::after()` callback

---

## Rationale

`Validator::after()` callbacks are the simplest mechanism for single-use cross-field validation. They fire after all per-attribute rules pass, providing access to the full validated state. Custom rule classes are the right choice when the same cross-field logic is needed in multiple places — they encapsulate the logic in a testable, injectable class.

---

## Recommended Default

**Default:** Use `Validator::after()` callback for single-use cross-field validation (e.g., `end_date > start_date`). Extract to a custom rule class when the same logic is needed in 2+ places.
**Reason:** `after()` callbacks are simple and co-located with the FormRequest. Custom rule classes provide reuse. The threshold for extraction is the same as any other refactoring: 2+ consumers.

---

## Risks Of Wrong Choice

* Custom rule for single-use cross-field: Class overhead for one-off logic — harder to find than inline callback
* `after()` for reusable logic: Duplicated callback in every FormRequest — violates DRY
* Neither approach: Cross-field validation done in controller after request passes — validation happens too late
* `after()` with side effects: Callback modifies data or performs actions — violates single responsibility

---

## Related Rules

* withValidator() for after() Callback Registration
* Invokable Validation Rules for Reusable Logic

---

## Related Skills

* Implement Cross-Field Validation Using withValidator and after
* Create and Use Invokable Custom Validation Rules
