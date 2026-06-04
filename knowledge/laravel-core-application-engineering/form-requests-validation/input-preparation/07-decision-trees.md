# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Input Preparation
**Generated:** 2026-06-03

---

# Decision Inventory

* prepareForValidation() vs passedValidation() for Data Transformation
* merge() vs replace() for Input Mutation
* Input Preparation in FormRequest vs Service Layer

---

# Architecture-Level Decision Trees

---

## Decision 1: prepareForValidation() vs passedValidation() for Data Transformation

---

## Decision Context

Whether to transform request data using `prepareForValidation()` (runs before validation) or `passedValidation()` (runs after successful validation).

---

## Decision Criteria

* Whether the transformation affects validation (must happen before rules run)
* Whether the transformation should only execute on valid data (avoid processing invalid data)
* Whether the transformation produces data that the controller needs
* Whether the transformation is a side effect or a data normalization

---

## Decision Tree

Does the transformation affect validation results (type coercion, default values, field normalization)?
↓
YES → Use `prepareForValidation()` — must run before validation rules are evaluated
NO → Should the transformation only run on data that passes validation?
    YES → Use `passedValidation()` — avoids processing invalid input
    NO → Does the transformation produce data the controller needs (computed fields, enriched data)?
        YES → Use `passedValidation()` — controller receives transformed data via `validated()`
        NO → Is the transformation a side effect (logging, analytics)?
            YES → Consider event listener — side effects shouldn't block the controller
            NO → Use `passedValidation()` — post-validation transformation

---

## Rationale

`prepareForValidation()` is for transformations that validation rules depend on — type coercion, default injection, field normalization. `passedValidation()` is for transformations that run after successful validation. The timing difference is critical: `prepareForValidation()` affects what gets validated; `passedValidation()` affects what the controller receives.

---

## Recommended Default

**Default:** Use `prepareForValidation()` for pre-validation transformations (type coercion, defaults, normalization). Use `passedValidation()` for post-validation transformations (computed fields, enrichment).
**Reason:** `prepareForValidation()` ensures validation sees correctly typed data. `passedValidation()` avoids processing data that will be rejected.

---

## Risks Of Wrong Choice

* `passedValidation()` for type coercion: Validation rules see string "on" instead of boolean true — `boolean` rule fails
* `prepareForValidation()` for side effects: Side effect runs even on invalid data — wasted processing
* No transformation: Validation rules operate on non-normalized data — false validation failures
* Business logic in `prepareForValidation()`: Authorization hasn't run yet — unauthorized user could trigger side effects

---

## Related Rules

* Use prepareForValidation() for Type Coercion Before Validation

---

## Related Skills

* Normalize Request Input Using prepareForValidation

---

---

## Decision 2: merge() vs replace() for Input Mutation

---

## Decision Context

Whether to use `$this->merge()` (adds/overwrites specific keys) or `$this->replace()` (replaces entire input) when mutating request data in `prepareForValidation()`.

---

## Decision Criteria

* Whether you need to add/update specific fields or replace all input
* Whether you need to preserve existing input fields that are not being modified
* Whether the transformation removes existing fields or adds new ones
* Whether the input is merged (array) or replaced (scalar mutations)

---

## Decision Tree

Do you need to add new fields or update specific existing fields?
↓
YES → Use `merge()` — preserves all other input, only changes specified keys
NO → Do you need to completely replace the entire input payload?
    YES → Use `replace()` — replaces the entire ParameterBag
    NO → Do you need to remove existing fields (not just overwrite)?
        YES → Use `replace()` with only the fields you want to keep, or use `merge()` with null
        NO → Use `merge()` — safest default, never loses data unintentionally

---

## Rationale

`merge()` adds or overwrites specific keys in the input while preserving all other fields. `replace()` completely replaces the entire input. In most input preparation scenarios, you want to add a default, coerce a type, or normalize a value — `merge()` is the right tool. `replace()` is rarely needed.

---

## Recommended Default

**Default:** Use `merge()` for all input mutations in `prepareForValidation()`. Only use `replace()` when you need to completely rebuild the input payload.
**Reason:** `merge()` is non-destructive — it preserves existing input. `replace()` removes all fields not explicitly included, which is almost never the intent.

---

## Risks Of Wrong Choice

* `replace()` when `merge()` is appropriate: All unpreserved fields lost — data silently removed from validated output
* `merge()` when field should be removed: Null value merged but field still exists — may pass validation incorrectly
* Neither called: Input not transformed — validation operates on raw form strings
* Wrong data type merged: `merge(['is_active' => 'yes'])` instead of boolean — validation still sees string

---

## Related Rules

* merge() for Specific Field Mutation
* Input Preparation in prepareForValidation()

---

## Related Skills

* Normalize Request Input Using prepareForValidation

---

---

## Decision 3: Input Preparation in FormRequest vs Service Layer

---

## Decision Context

Whether to perform input normalization and transformation in the FormRequest's `prepareForValidation()` or in the service/action layer.

---

## Decision Criteria

* Whether the transformation is input normalization (formatting, coercion) vs business logic
* Whether the transformation affects validation (must happen pre-validation)
* Whether the transformation is specific to HTTP input or would be needed in non-HTTP contexts
* Whether the transformation should be independently testable

---

## Decision Tree

Is the transformation input normalization (type coercion, string trimming, default values)?
↓
YES → Does the transformation affect validation results?
    YES → FormRequest `prepareForValidation()` — validation depends on the transformed values
    NO → Could the transformation be needed in non-HTTP contexts (queue, CLI)?
        YES → Service layer — shared across all input sources
        NO → FormRequest `prepareForValidation()` — HTTP-specific normalization
NO → Is the transformation business logic (computing derived values, applying rules)?
    YES → Service layer — business logic belongs in services, not HTTP layer
    NO → Is the transformation format-specific (parsing CSV, decoding base64)?
        ↓
        YES → FormRequest `prepareForValidation()` — input format normalization
        NO → Service layer — default for non-normalization transformations

---

## Rationale

Input normalization (type coercion, trimming, default injection) that validation depends on belongs in `prepareForValidation()`. Business logic transformations belong in the service layer. The key question is: does validation depend on this transformation? If yes, it must happen in `prepareForValidation()` before validation runs.

---

## Recommended Default

**Default:** Input normalization and type coercion in `prepareForValidation()`. Business logic and derived computations in the service layer.
**Reason:** Validation depends on normalized input. Business logic depends on validated data. These are distinct concerns that belong at different layers.

---

## Risks Of Wrong Choice

* Business logic in `prepareForValidation()`: Runs before authorization — unauthorized user triggers logic
* Normalization in service layer: Service must handle both raw and normalized input — inconsistent
* No normalization: All services must handle "on" vs true, "yes" vs false — duplication
* Both layers doing normalization: Double-transform — first in request, then in service

---

## Related Rules

* Input Preparation in prepareForValidation()
* Business Logic in Service Layer

---

## Related Skills

* Normalize Request Input Using prepareForValidation
