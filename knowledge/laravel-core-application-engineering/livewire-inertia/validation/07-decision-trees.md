# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Validation
**Generated:** 2026-06-03

---

# Decision Inventory

* #[Rule] Attribute vs $rules Array for Validation Rules
* Real-Time Validation (validateOnly in updated) vs Deferred Validation (validate in Action)
* Livewire Validation vs FormRequest Validation

---

# Architecture-Level Decision Trees

---

## Decision 1: #[Rule] Attribute vs $rules Array for Validation Rules

---

## Decision Context

Whether to declare validation rules using PHP 8 `#[Rule]` attributes on properties or the traditional `$rules` array.

---

## Decision Criteria

* Whether the project uses PHP 8+ (required for attributes)
* Whether rules are static or dynamic (computed at runtime)
* Whether the property-rule relationship should be visually explicit
* Whether the team standardizes on attribute syntax or array syntax

---

## Decision Tree

Are the validation rules static (never change between requests)?
↓
YES → Use `#[Rule]` attributes — co-located with the property, visually explicit
NO → Are rules dynamic (computed at runtime based on component state)?
    YES → Use `$rules` array — attributes can't be dynamic, array can be computed
    NO → Is the team standard on `$rules` array?
        YES → Use `$rules` — consistency with existing codebase
        NO → Use `#[Rule]` — modern syntax, prevents property-rule drift

---

## Rationale

`#[Rule]` attributes are co-located with the property they validate. When a property is renamed, the rule moves with it. The `$rules` array separates rules from properties — renaming a property leaves a stale rule in the array. Attributes are the modern standard; arrays are for dynamic rules.

---

## Recommended Default

**Default:** Use `#[Rule]` attributes for all static validation rules. Use `$rules` array only for dynamic rules.
**Reason:** Attribute co-location prevents property-rule drift. Rules are immediately visible above the property. The `$rules` array is the escape hatch for dynamic rules.

---

## Risks Of Wrong Choice

* `$rules` for static rules: Property renamed, old rule remains in array — silent validation miss
* `#[Rule]` for dynamic rules: Attribute value evaluated once — dynamic rule never recomputed
* No rules at all: Properties unvalidated — invalid data stored
* Mixed with no convention: Some properties use attributes, some use $rules — confusing

---

## Related Rules

* Prefer Rule Attributes Over Rules Array

---

## Related Skills

* Implement Real-Time Server-Side Validation

---

---

## Decision 2: Real-Time Validation vs Deferred Validation

---

## Decision Context

Whether to validate fields in real-time as the user types (via `validateOnly()` in `updated()` hook) or defer validation until the action method (via `$this->validate()`).

---

## Decision Criteria

* Whether the user expects immediate inline error feedback
* Whether the validation rule is expensive (unique check, external API)
* Whether the form is long (10+ fields) where real-time validation would be noisy
* Whether the field is critical (email, password confirmation) needing immediate feedback

---

## Decision Tree

Does the field need immediate inline error feedback as the user types (critical fields)?
↓
YES → Is the validation rule cheap (required, min, max, email format)?
    YES → Use real-time validation — `$this->validateOnly('field')` in `updatedField()`
    NO → Is the validation rule expensive (unique:users, exists:emails)?
        YES → Use debounced real-time validation — `$this->validateOnly('field')` with debounced wire:model
        NO → Use real-time validation — or defer if UX allows
NO → Is the form simple (1-5 fields) with standard submission flow?
    YES → Deferred validation — `$this->validate()` in the action method
    NO → Is the form long (10+ fields)?
        YES → Deferred validation — real-time on 10 fields would be noisy and resource-heavy
        NO → Deferred validation — default for standard form submission

---

## Rationale

Real-time validation provides immediate feedback but increases server requests. Deferred validation validates all fields at once in the action method. Use real-time for critical fields where immediate feedback is important (email format, password match). Defer for everything else to minimize requests.

---

## Recommended Default

**Default:** Deferred validation in action method. Real-time validation only for critical fields (email, password, unique fields).
**Reason:** Deferred validation minimizes server requests. Real-time should be reserved for fields where immediate feedback significantly improves UX.

---

## Risks Of Wrong Choice

* Real-time on all 10 fields: 10 AJAX requests per form fill — unnecessary load
* Deferred for email uniqueness: User fills entire form, submits, gets "email taken" — frustrating
* Real-time with expensive rule: Unique check on every keystroke — database load, slow feedback
* No real-time for critical field: User submits, gets error, fixes, submits again — slow feedback loop

---

## Related Rules

* Real-Time for Critical Fields, Deferred for Others

---

## Related Skills

* Implement Real-Time Server-Side Validation

---

---

## Decision 3: Livewire Validation vs FormRequest Validation

---

## Decision Context

Whether to validate data using Livewire's built-in validation (`#[Rule]`, `$this->validate()`) or use Laravel's FormRequest classes.

---

## Decision Criteria

* Whether the validation rules are reused in non-Livewire contexts (API, Inertia)
* Whether the validation is part of a Livewire component or a standalone HTTP endpoint
* Whether the component's data comes from `wire:model` properties or an HTTP request
* Whether the team prefers centralized FormRequests or component-local validation

---

## Decision Tree

Is the validation reused in non-Livewire contexts (API endpoint, Inertia form, CLI command)?
↓
YES → Use FormRequest — single source of truth for validation rules across contexts
NO → Is the data source Livewire properties (wire:model) vs HTTP request input?
    Livewire properties → Use Livewire validation — `#[Rule]` attributes on component properties
    HTTP request → Use FormRequest — standard HTTP validation
NO → Does the component need real-time inline validation as the user types?
    YES → Use Livewire validation — `validateOnly()` works only in Livewire components
    NO → Is the validation simple (1-3 rules)?
        YES → Use Livewire validation — simpler, co-located with the component
        NO → Use FormRequest — FormRequests keep complex rules organized

---

## Rationale

Livewire validation is for component-local validation that doesn't need reuse. FormRequest validation is for rules shared across multiple contexts (HTTP + Livewire + API). If the same data shape is validated in both a Livewire component and an API endpoint, a FormRequest prevents rule duplication.

---

## Recommended Default

**Default:** Livewire validation for component-specific rules. FormRequest only when rules are shared across multiple contexts.
**Reason:** Livewire validation keeps rules co-located with the component and supports real-time validation. FormRequest adds an extra class to maintain. Only use FormRequest when there's actual reuse.

---

## Risks Of Wrong Choice

* FormRequest for Livewire-only validation: Must manually trigger FormRequest from component — extra overhead
* Livewire validation for shared rules: Rules duplicated in Livewire component and API FormRequest — drift
* No validation at all: Component stores unvalidated data — data integrity issues
* Mixed approaches with no pattern: Some components validate inline, others use FormRequests — inconsistent

---

## Related Rules

* Livewire Validation for Components, FormRequest for Shared Rules

---

## Related Skills

* Implement Real-Time Server-Side Validation
