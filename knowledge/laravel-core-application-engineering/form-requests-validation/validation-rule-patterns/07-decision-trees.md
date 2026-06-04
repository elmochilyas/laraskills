# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Validation Rule Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Array Syntax vs Pipe-Delimited String Syntax for Rules
* bail vs stopOnFirstFailure for Validation Stopping
* Rule::unique() Inline vs Dedicated Exists Rule

---

# Architecture-Level Decision Trees

---

## Decision 1: Array Syntax vs Pipe-Delimited String Syntax for Rules

---

## Decision Context

Whether to express validation rules as arrays (`['required', 'email']`) or pipe-delimited strings (`'required|email'`).

---

## Decision Criteria

* Whether the rules include Rule objects (`Rule::unique()`, `Rule::exists()`)
* Whether the rules include custom invokable rule classes
* Whether the rules include regex patterns that may contain pipes
* Whether the team standardizes on one syntax for consistency

---

## Decision Tree

Do any rules require Rule objects (unique, exists, prohibited_if)?
↓
YES → Use array syntax — Rule objects cannot be represented in pipe-delimited strings
NO → Do any rules use custom invokable rule classes?
    YES → Use array syntax — custom rules are PHP objects, not strings
    NO → Do any rules contain regex patterns that might include pipe characters?
        YES → Use array syntax — pipe in regex is interpreted as rule separator in string syntax
        NO → Does the team have a preference?
            Array → Use array syntax — more consistent, supports future Rule objects
            String → Pipe-delimited string — acceptable for simple rules without objects or regex

---

## Rationale

Array syntax is the modern Laravel standard. It supports Rule objects, custom rules, avoids pipe parsing issues, and provides better IDE support (autocompletion, type checking). Pipe-delimited strings are supported but limited — they cannot represent Rule objects or custom rules, and regex patterns with pipes break the parser.

---

## Recommended Default

**Default:** Always use array syntax for validation rules. Never use pipe-delimited strings for complex rule sets.
**Reason:** Array syntax is forward-compatible, avoids all pipe-splitting edge cases, and supports the full range of Laravel validation features. Pipe-delimited strings are a legacy syntax with significant limitations.

---

## Risks Of Wrong Choice

* Pipe string with Rule::unique(): Silent failure — `Rule::unique()` cast to string "Object" — validation never fires
* Pipe string with regex containing `|`: Pipe parsed as rule separator — regex is split, rules are wrong
* Mixed syntax: Some rules as arrays, some as strings — inconsistent, confusing
* Pipe string with custom rule: `new ValidCouponCode` cast to string — doesn't validate

---

## Related Rules

* Prefer Array Syntax for Validation Rules

---

## Related Skills

* Write Validation Rules Using Array Syntax with Rule Objects

---

---

## Decision 2: bail vs stopOnFirstFailure for Validation Stopping

---

## Decision Context

Whether to use per-attribute `bail` (stop validating an attribute on first failure) or per-request `stopOnFirstFailure` (stop validating all attributes on first failure).

---

## Decision Criteria

* Whether the user needs to see all validation errors at once or one at a time
* Whether subsequent rule checks depend on prior rule results (avoid errors from invalid data types)
* Whether the validation includes expensive rules (database queries, API calls) that should be skipped after failure
* Whether the application UX shows all errors at once (typical) or one at a time (wizard, inline)

---

## Decision Tree

Does the user need to see all validation errors at once (standard form UX)?
↓
YES → Do NOT use `bail` or `stopOnFirstFailure` — all rules evaluate, all errors reported
NO → Is the requirement to show ONE error at a time per attribute?
    YES → Use `bail` per-attribute — first failing rule stops that attribute, other attributes still validate
    NO → Is the requirement to show ONE error total (stop on first failure across ALL attributes)?
        YES → Use `stopOnFirstFailure` on the FormRequest — first failure stops everything
        NO → Does the validation include expensive rules that should be gated by cheaper rules?
            YES → Use `bail` — `['required', 'bail', 'email', Rule::exists(...)]` — exists runs only if email is valid
            NO → No stopping needed — all rules evaluate, all errors reported

---

## Rationale

`bail` prevents cascading errors: if a field is missing (`required` fails), checking `email` or `exists` on null would produce confusing secondary errors. `stopOnFirstFailure` is for application-level control (wizards, progressive validation). The default (no stopping) is best for standard forms where users need to see every error at once.

---

## Recommended Default

**Default:** Use `bail` per-attribute on most multi-rule fields to prevent cascading errors. Do NOT use `stopOnFirstFailure` unless the UX requires single-error-at-a-time display.
**Reason:** `bail` prevents "secondary errors" (invalid email on empty field). Standard forms should show all errors at once. `stopOnFirstFailure` is too aggressive for most use cases.

---

## Risks Of Wrong Choice

* No `bail` on multi-rule field: "Email is required" AND "Email must be valid" — confusing double error
* `bail` when user needs all errors: User fixes one error, submits, gets the next error — frustrating
* `stopOnFirstFailure` on standard form: User sees one error per submit — maximum 5 submits to fix all issues
* `bail` with expensive rules: Expensive rule still runs if cheaper rules pass — `bail` doesn't prevent this if all cheap rules pass

---

## Related Rules

* bail for Per-Attribute Stopping
* stopOnFirstFailure for Per-Request Stopping

---

## Related Skills

* Write Validation Rules Using Array Syntax with Rule Objects

---

---

## Decision 3: Rule::unique() Inline vs Dedicated Exists Rule

---

## Decision Context

Whether to use `Rule::unique()` for checking database uniqueness directly in FormRequest rules, or use a dedicated custom rule or repository method.

---

## Decision Criteria

* Whether the uniqueness check is standard (single column, no conditions) or complex (multi-column, soft deletes, conditions)
* Whether the uniqueness rule is reused across multiple FormRequests
* Whether the uniqueness check needs to be tested independently
* Whether the uniqueness check involves custom logic beyond a simple database query

---

## Decision Tree

Is the uniqueness check simple (single column, no conditions, no soft delete filtering)?
↓
YES → Use `Rule::unique('table')->ignore($id)` directly in the rules array
NO → Does the uniqueness check involve custom conditions (status filtering, date range, multi-column)?
    YES → Use `Rule::unique('table')->where(fn($q) => $q->where('status', 'active'))` — conditions as closures
    NO → Is the uniqueness check reused across 2+ FormRequests?
        YES → Extract to a custom rule class — single source of truth for the uniqueness logic
        NO → Is the uniqueness check complex (multi-column, joins, subqueries)?
            YES → Extract to a custom rule class or repository method — keeps rules array readable
            NO → Use `Rule::unique()` with `->ignore()` — standard Laravel pattern

---

## Rationale

`Rule::unique()` handles 90% of uniqueness checks — single column, optional ignore for updates, optional where clauses for soft deletes. Complex uniqueness (multi-column, custom conditions beyond simple where clauses) should be extracted to a custom rule class where the logic is testable and reusable.

---

## Recommended Default

**Default:** Use `Rule::unique()` directly in rules arrays for standard single-column uniqueness checks. Extract to a custom rule class for complex multi-column or conditional uniqueness.
**Reason:** `Rule::unique()` is the standard, self-documenting way to express database uniqueness. Custom rules are needed when the logic goes beyond what `Rule::unique()` can express.

---

## Risks Of Wrong Choice

* Inline `Rule::unique()` for complex check: 10-line closure in rules array — obscures the rules structure
* Custom rule for single-column unique: File overhead for a standard check — `Rule::unique()` would suffice
* Missing `->ignore()` on update: Uniqueness check fails against the current record — user can't update their own data
* No soft delete filtering: Unique check sees soft-deleted records — "already taken" on deleted data

---

## Related Rules

* Rule::unique() for Standard Uniqueness

---

## Related Skills

* Write Validation Rules Using Array Syntax with Rule Objects
* Create and Use Invokable Custom Validation Rules
