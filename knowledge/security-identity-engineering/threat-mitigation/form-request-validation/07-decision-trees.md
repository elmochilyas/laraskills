# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Form Request Validation Rules and Best Practices
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Form Request vs Inline Validation | Validation architecture pattern | architectural, maintainability |
| 2 | Input Filtering Strategy | validated() vs all() vs only() | security |
| 3 | authorization() Placement | Form Request vs controller authorization | architectural |

---

# Architecture-Level Decision Trees

---

## Form Request vs Inline Validation

---

## Decision Context

Whether to use a dedicated Form Request class or inline `$request->validate()` in the controller.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the controller action accept significant user input (3+ fields)?
↓
YES → Form Request (dedicated validation class)
NO → Simple one-field update → Inline `$request->validate()` acceptable

Are there multiple controller actions that mutate similar resources?
↓
YES → Form Request per action (separate Store/Update requests)
NO → Single action → Form Request still preferred

Is the validation logic likely to change independently from the controller?
↓
YES → Form Request (validation changes don't touch controller)
NO → Inline may be simpler

Are there authorization checks tied to this input?
↓
YES → Form Request (authorization + validation in one class)
NO → Form Request still preferred for validation separation

Is this a prototype or a mature codebase?
↓
Prototype → Inline validation acceptable initially
Mature codebase → Form Requests expected for all significant input

---

## Rationale

Form Requests separate validation logic from controller logic, making both more testable and maintainable. They also provide authorization checks (`authorize()`) that run before validation, preventing unauthorized users from triggering validation errors. For small, one-off validations, inline `$request->validate()` is acceptable.

---

## Recommended Default

**Default:** Form Request for every create/update operation; inline only for trivial single-field updates
**Reason:** Form Requests provide a consistent, testable validation pattern. They encapsulate authorization, validation rules, error messages, and input normalization in one class. The overhead of creating a Form Request class is minimal compared to the maintainability benefits.

---

## Risks Of Wrong Choice

- Form Request for every trivial field: unnecessary class overhead
- Inline for complex multi-field operations: bloated controllers, validation logic duplication
- No validation at all: SQL injection, mass assignment, XSS via unvalidated input
- Inline with authorization in controller: authorization runs after validation (unauthorized users trigger validation errors)

---

## Related Rules

- Create One Form Request per Controller Method (05-rules.md)
- Implement `authorize()` to Gate Access Before Validation (05-rules.md)
- Use `nullable` Instead of `sometimes` for Optional Fields (05-rules.md)

---

## Related Skills

- Centralize Input Validation with Form Requests (06-skills.md)

---

## Input Filtering Strategy

---

## Decision Context

How to extract input from the request — `$request->validated()`, `$request->only()`, or `$request->all()`.

---

## Decision Criteria

* security

---

## Decision Tree

Is there a Form Request class for this action?
↓
YES → Use `$request->validated()` (returns only validated fields)
NO → Is there inline validation?
    YES → Use `$validated = $request->validate([...])` then pass `$validated`
    NO → Use `$request->only([...])` with explicit field list

Is `$request->all()` currently used somewhere?
↓
YES → Replace immediately — this is a security risk
NO → Continue with validated/only pattern

Does the input get passed to model `create()` or `update()`?
↓
YES → Must use `$request->validated()` or explicit `$request->only()` (defense-in-depth with $fillable)
NO → Standard validation still recommended

Could the request contain unexpected fields added client-side?
↓
YES → Always use validated/only (never all)
NO → Still use validated/only (prevent future surprises)

---

## Rationale

`$request->validated()` returns only the fields that passed validation rules, automatically filtering out unexpected or malicious fields. `$request->only()` manually filters to named fields. `$request->all()` passes everything — including any fields an attacker added to the request. Combined with `$fillable` mass assignment protection, `validated()` provides defense-in-depth.

---

## Recommended Default

**Default:** `$request->validated()` with Form Requests for all create/update operations
**Reason:** `validated()` is the safest option — it returns only fields that passed explicit validation rules. Combined with `$fillable` on the model, two independent layers prevent mass assignment of unexpected fields. No other filtering approach provides this level of safety.

---

## Risks Of Wrong Choice

- `$request->all()`: all request fields passed to model, bypasses validation filtering
- `$request->only(['field'])` without validation: no format validation, only field filtering
- `$request->validated()` with incomplete rules: some fields not validated (missing rules)
- No filtering at all: complete mass assignment vulnerability

---

## Related Rules

- Implement `authorize()` to Gate Access Before Validation (05-rules.md)
- Add Custom Rule Objects for Reusable Validation (05-rules.md)

---

## Related Skills

- Centralize Input Validation with Form Requests (06-skills.md)

---

## authorize() Placement

---

## Decision Context

Whether to place authorization checks in the Form Request's `authorize()` method or in the controller.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the authorization check specific to this form submission?
↓
YES → Form Request `authorize()` (authorization + validation coupled)
NO → Is the authorization policy broadly applied (e.g., user can create Post)?
    YES → Can go in Form Request or controller
    NO → Keep with the specific action

Does authorization depend on the input data being validated?
↓
YES → Must be in Form Request (validation runs first, but authorize() runs before rules())
NO → Controller authorization is fine (runs after validation)

Does the project standard place authorization in Form Requests?
↓
YES → Follow project convention
NO → Can go in controller (but recommend Form Request for consistency)

Is this a public endpoint (registration, contact form)?
↓
YES → `authorize()` returns `true` (no auth needed)
NO → Implement proper authorization check

---

## Rationale

The Form Request's `authorize()` method runs before `rules()`, so unauthorized requests fail fast without triggering validation errors. This prevents unauthorized users from learning about validation rules through error messages. Placing authorization in Form Requests keeps the authorization concern with the input validation concern, making the controller cleaner.

---

## Recommended Default

**Default:** Authorization in Form Request's `authorize()` method for input-specific permissions; controller authorization for cross-cutting policy checks
**Reason:** `authorize()` runs before validation, preventing information leakage from validation errors. It keeps authorization with the input context. For broad policies (user can create posts), a Policy class is still preferred, called from within `authorize()`.

---

## Risks Of Wrong Choice

- Authorization only in controller: unauthorized users trigger validation errors (can discover validation rules)
- `authorize()` returning `false` by default (no override): all requests denied
- `authorize()` returning `true` always: no authorization at all
- Authorization in Form Request but validation in controller: split logic, confusing

---

## Related Rules

- Implement `authorize()` to Gate Access Before Validation (05-rules.md)
- Use `prepareForValidation()` for Input Normalization (05-rules.md)

---

## Related Skills

- Centralize Input Validation with Form Requests (06-skills.md)
