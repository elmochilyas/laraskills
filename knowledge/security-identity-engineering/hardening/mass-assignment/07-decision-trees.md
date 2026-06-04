# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Mass Assignment Protection ($fillable/$guarded)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | $fillable Whitelist vs $guarded Blacklist | Mass assignment strategy | security, maintainability |
| 2 | Input Filtering Approach | validated() vs only() vs all() for controller input | security, architectural |

---

# Architecture-Level Decision Trees

---

## $fillable Whitelist vs $guarded Blacklist

---

## Decision Context

Choosing between `$fillable` (whitelist of assignable attributes) and `$guarded` (blacklist of non-assignable attributes) for Eloquent mass assignment protection.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the model have a small number of mass-assignable attributes?
↓
YES → Use `$fillable` whitelist (explicit, secure)
NO → Does the model have a small number of sensitive attributes to protect?
    YES → Can use `$guarded` blacklist (but `$fillable` preferred)
    NO → `$fillable` with explicit list (secure default)

Is this a security-critical model (User, Role, Permission)?
↓
YES → `$fillable` whitelist (never rely on blacklist for authorization)
NO → `$fillable` whitelist (best practice for all models)

How many columns does the model have?
↓
Few (2-5) → `$fillable` is maintainable
Many (10+) → `$fillable` is still recommended (documentation of writable fields)
Any → `$fillable` whitelist is always the safest

Are there models with only public-facing fields (no sensitive attributes)?
↓
YES → `$fillable` with all columns (no risk, but still explicit)
NO → `$fillable` with safe columns (exclude sensitive ones)

---

## Rationale

`$fillable` is a whitelist — safer than a blacklist because new columns are blocked by default. `$guarded` is a blacklist — new columns are mass-assignable by default unless explicitly guarded. `$fillable` also serves as documentation for which attributes are intended to be mass-assignable. Use `$fillable` for every model.

---

## Recommended Default

**Default:** `$fillable` whitelist on every model; never use `$guarded` alone (may use `$guarded = ['*']` as explicit safety catch)
**Reason:** A whitelist is inherently more secure than a blacklist. New columns are automatically protected. The `$fillable` array also documents which fields are expected to be mass-assignable, aiding code review.

---

## Risks Of Wrong Choice

- `$guarded = []` (empty): all attributes mass-assignable — catastrophic for User model
- `$fillable` missing sensitive attributes: `MassAssignmentException` (safe failure, but may confuse)
- `$guarded` missing a new sensitive column: newly added sensitive column exposed
- No fillable/guarded at all: `MassAssignmentException` on create (models with no protection)

---

## Related Rules

- Define `$fillable` on Every Eloquent Model (05-rules.md)
- Never Add `is_admin`, `role_id`, or Similar Privilege Fields to `$fillable` (05-rules.md)

---

## Related Skills

- Protect Against Mass Assignment Vulnerabilities (06-skills.md)

---

## Input Filtering Approach

---

## Decision Context

How to filter user input before passing to mass assignment — `$request->validated()`, `$request->only()`, or `$request->all()`.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is there a Form Request class with validation rules?
↓
YES → Use `$request->validated()` (returns only validated fields, defense-in-depth)
NO → Are there inline validation rules in the controller?
    YES → Use either `$validated = $request->validate([...])` or `$request->only([...])` after validation
    NO → Implement form request or `$request->only()` immediately

Does the controller accept many fields for a model update?
↓
YES → Form Request + `$request->validated()` (cleanest, most maintainable)
NO → Single-field update → `$request->only(['field'])` or direct assignment

Is `$request->all()` currently used?
↓
YES → Replace immediately with `$request->validated()` or `$request->only()` (security critical)
NO → Continue with validated/only pattern

Are there fields that should NEVER be passed from request (is_admin, role)?
↓
YES → Ensure they are not in $fillable AND not in the validated array (form request should exclude them)
NO → Standard validation + fillable protection

---

## Rationale

`$request->validated()` is the gold standard — it returns only the fields that passed validation rules, automatically filtering out unexpected or malicious fields. `$request->only()` manually filters fields. `$request->all()` passes everything — it's dangerous because it bypasses validation filtering and relies solely on `$fillable` for protection.

---

## Recommended Default

**Default:** `$request->validated()` with dedicated Form Request classes for every create/update operation
**Reason:** Form Requests encapsulate validation, authorization, and input filtering. `validated()` returns only fields that passed validation rules, providing a clean, safe input set for mass assignment. This is defense-in-depth alongside `$fillable`.

---

## Risks Of Wrong Choice

- `$request->all()`: all fields passed to model, bypasses validation filtering
- `$request->only()` without complete list: missing expected fields silently
- `$request->validated()` without form request: works but validation lives in controller (less reusable)
- No `$request->validated()` with `$fillable`: relying solely on fillable — one misconfiguration away from vulnerability

---

## Related Rules

- Use `->only()` or `->validated()` Instead of `->all()` for Mass Assignment (05-rules.md)
- Use Form Requests for Create and Update Validation (05-rules.md)
- Never Trust Client-Side JavaScript to Prevent Mass Assignment (05-rules.md)

---

## Related Skills

- Protect Against Mass Assignment Vulnerabilities (06-skills.md)
