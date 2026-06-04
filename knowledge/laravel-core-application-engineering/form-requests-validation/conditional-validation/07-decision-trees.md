# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Conditional Validation
**Generated:** 2026-06-03

---

# Decision Inventory

* Declarative Conditional Rules vs Programmatic Conditionals
* ConditionalRules::when() vs withValidator() for Complex Conditions
* Sometimes() vs Exclude_* Rules for Conditional Field Presence

---

# Architecture-Level Decision Trees

---

## Decision 1: Declarative Conditional Rules vs Programmatic Conditionals

---

## Decision Context

Whether to express conditional validation using declarative rules (`required_if`, `required_unless`, `prohibited_if`) or programmatic conditionals in `withValidator()`.

---

## Decision Criteria

* Whether the condition depends on a single field value (simple) or computed values (complex)
* Whether the condition is based on raw input or validated values
* Whether the conditional logic is self-documenting with declarative syntax
* Whether the condition involves 2+ fields in combination

---

## Decision Tree

Does the condition depend on the value of a single field (field X equals value Y)?
↓
YES → Use declarative rule — `required_if:field,value`, `prohibited_if:field,value`, `required_unless:field,value`
NO → Does the condition depend on the validated value of another field?
    YES → Use `sometimes()` — cloaks run after per-attribute validation, can access validated values
    NO → Does the condition involve 2+ fields or computed values?
        YES → Use `withValidator()` with `after()` callbacks — full programmatic control
        NO → Does the condition depend on external state (database, auth user, time)?
            YES → Use `withValidator()` or `ConditionalRules::when()` — programmatic condition evaluation
            NO → Use declarative rule — simplest option

---

## Rationale

Declarative rules are order-independent, self-documenting, and require no additional code. They are the right choice for simple field-to-value conditions. Programmatic conditionals via `withValidator()` are necessary when the condition depends on validated values, computed data, or external state.

---

## Recommended Default

**Default:** Use declarative rules for all single-field-dependent conditions. Use `withValidator()` for complex conditions involving multiple fields, external state, or computed values.
**Reason:** Declarative rules are simpler, more readable, and require no additional methods. Complex conditions naturally need programmatic logic.

---

## Risks Of Wrong Choice

* Declarative for complex condition: Can't express computed values or external state — wrong rule silently passes
* Programmatic for simple condition: 5-line callback for `required_if` — unnecessary complexity
* Wrong declarative rule: `required_if` vs `required_with` confusion — incorrect validation behavior
* No `exclude_if`: Conditional fields included in validated data despite being irrelevant

---

## Related Rules

* Use Declarative Rules for Simple Field-Dependent Conditions

---

## Related Skills

* Apply Declarative Conditional Validation Rules

---

---

## Decision 2: ConditionalRules::when() vs withValidator() for Complex Conditions

---

## Decision Context

Whether to use Laravel's `ConditionalRules::when()` class or the `withValidator()` hook for complex conditional validation logic.

---

## Decision Criteria

* Whether the condition should add different rules vs just making a field required/optional
* Whether the condition is evaluated at rule-parse time or needs access to validated data
* Whether the condition applies to entire rules for a field vs individual rule modifications
* Whether the condition needs to produce different error messages for different branches

---

## Decision Tree

Does the condition add entirely different rule sets based on the condition (if A → rules X, if B → rules Y)?
↓
YES → Use `ConditionalRules::when(condition, ifRules, elseRules)` — clean, readable, array-based
NO → Does the condition need access to validated values (not just raw input)?
    YES → Use `withValidator()` with `sometimes()` — works with post-validation data
    NO → Does the condition need to modify existing rules rather than replace them entirely?
        YES → Use `withValidator()` — finer-grained control over the validator state
        NO → Does the condition need access to external state (database, auth)?
            ↓
            YES → Use `withValidator()` — full access to container, services, and request
            NO → Use `ConditionalRules::when()` — simpler, self-contained in rules array

---

## Rationale

`ConditionalRules::when()` is the cleanest option for replacing entire rule sets based on a boolean condition. It keeps conditional logic inside the `rules()` array, making it visible alongside the unconditional rules. `withValidator()` is necessary when access to validated data, external state, or finer-grained validator manipulation is required.

---

## Recommended Default

**Default:** Use `ConditionalRules::when()` for branch-based rule sets. Use `withValidator()` when the condition requires validated data, external state, or per-rule modifications.
**Reason:** `ConditionalRules::when()` keeps the condition visible in the rules array. `withValidator()` is the escape hatch for everything else.

---

## Risks Of Wrong Choice

* `ConditionalRules::when()` for validated data: Condition receives raw input — may be stale or incorrect
* `withValidator()` for simple branch: More code than needed — callback obscures the conditional structure
* No conditional mechanism: Same FormRequest used for create and update with `sometimes('field')` — unclear
* Wrong condition evaluation time: Parse-time vs runtime — conditions based on validated data evaluated too early

---

## Related Rules

* ConditionalRules::when() for Branch Rules
* withValidator() for Complex Conditions

---

## Related Skills

* Apply Declarative Conditional Validation Rules

---

---

## Decision 3: sometimes() vs Exclude_* Rules for Conditional Field Presence

---

## Decision Context

Whether to use `sometimes()` to conditionally apply rules or `exclude_if`/`exclude_unless` to conditionally remove fields from validated data.

---

## Decision Criteria

* Whether the field should be absent from validated data when the condition is met
* Whether the condition depends on raw input or validated values
* Whether the field is optional with conditional rules vs conditionally excluded entirely
* Whether the condition should also affect other rules that reference this field

---

## Decision Tree

Should the field be COMPLETELY excluded from validated data when the condition is met?
↓
YES → Use `exclude_if` or `exclude_unless` — field removed entirely, never reaches validated data
NO → Does the condition depend on the validated value of another field?
    YES → Use `sometimes()` — cloaks fire after per-attribute validation, can see other validated values
    NO → Does the field's requirement depend on another field's value (field X required if field Y = value)?
        YES → Use declarative rules (`required_if`) — simpler than `sometimes()`
        NO → Does the field need different rules based on a condition?
            ↓
            YES → Use `sometimes()` — conditionally apply or skip rules
            NO → No conditional needed

---

## Rationale

`exclude_*` rules remove a field from the validated data entirely when a condition is met — the field is treated as if it was never submitted. `sometimes()` conditionally applies rules but keeps the field in validated data if rules pass. Declarative `required_if` is simpler than `sometimes()` when the condition is a simple field-value check.

---

## Recommended Default

**Default:** Use `exclude_if`/`exclude_unless` when the field should be absent from output. Use `required_if` for simple field-value-dependent requirements. Use `sometimes()` for complex conditions based on validated values.
**Reason:** `exclude_*` is the most explicit option — it controls what goes INTO the validated data. `required_if` is the simplest for basic requirements. `sometimes()` is the flexible option for complex cases.

---

## Risks Of Wrong Choice

* `sometimes()` with `exclude_if` behavior: Field still in validated data with empty value — unexpected null
* `exclude_if` when field should be validated: Field silently excluded — missing validation
* `sometimes()` for simple requirement: More verbose than `required_if` — unnecessary closure
* No conditional at all: Field always required or always optional — wrong behavior for conditional forms

---

## Related Rules

* sometimes() for Validated-Value Conditions
* exclude_if for Conditional Field Removal

---

## Related Skills

* Apply Declarative Conditional Validation Rules
