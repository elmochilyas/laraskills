# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Validation Error Formatting
**Generated:** 2026-06-03

---

# Decision Inventory

* FormRequest vs Inline $request->validate() for Validation
* Named Error Bags vs Single Default Error Bag for Multi-Form Pages
* Custom failedValidation() vs Handler renderable() for Validation Response

---

# Architecture-Level Decision Trees

---

## Decision 1: FormRequest vs Inline $request->validate() for Validation

---

## Decision Context

Whether to validate request data using a dedicated FormRequest class or inline `$request->validate()` within the controller method.

---

## Decision Criteria

* Whether the validation rules are simple (1-3 rules, single field) or complex
* Whether the same validation rules are reused across multiple controllers
* Whether the validation logic needs to be independently testable
* Whether authorization is coupled to the validation concern

---

## Decision Tree

How many fields and rules does this validation need?
↓
1-3 rules, 1-2 fields, single controller?
YES → Is this validation likely to grow (feature expected to evolve)?
    YES → Use FormRequest — accommodates future complexity without refactoring
    NO → Is the validation never reused across other endpoints?
        YES → Inline `$request->validate()` — acceptable for trivial validation
        NO → Use FormRequest — reused rules belong in a dedicated class
NO → 3+ rules or 3+ fields or multiple controllers?
    YES → Does the validation need authorization logic?
        YES → Use FormRequest — `authorize()` method keeps auth with validation
        NO → Use FormRequest — independently testable, focused, reusable

---

## Rationale

FormRequest classes are the standard Laravel pattern for non-trivial validation. They're independently testable (no controller needed), reusable across controllers, and keep controllers focused on request handling. Inline `$request->validate()` is acceptable only for trivial, single-use, single-controller validation with 1-2 fields.

---

## Recommended Default

**Default:** Use FormRequest classes for any validation with 3+ fields, complex rules, or reuse across controllers. Use inline `$request->validate()` only for trivial 1-2 field validation in a single controller.
**Reason:** FormRequests are the contract for incoming data. Extracting them from controllers improves testability, reusability, and single responsibility.

---

## Risks Of Wrong Choice

* Inline for complex validation: Bloated controller — 30 lines of validation rules in a controller method
* FormRequest for single field: File proliferation — one file per trivial validation
* Inline for reused rules: Duplicate rules across controllers — inconsistent validation when one copy changes
* No authorization in FormRequest: Authorization check in controller, validation in FormRequest — split concern

---

## Related Rules

* Use FormRequest Classes Instead of Inline Validation
* FormRequest Authorization Method

---

## Related Skills

* Create FormRequest-Validated Endpoint

---

---

## Decision 2: Named Error Bags vs Single Default Error Bag for Multi-Form Pages

---

## Decision Context

Whether to use a single default error bag or named error bags when a page contains multiple independent forms.

---

## Decision Criteria

* Whether the page has multiple forms that submit independently
* Whether one form's validation errors should affect the other form's display
* Whether the forms are visually separated (different sections, modals, tabs)
* Whether the forms share fields with the same names

---

## Decision Tree

Does the page contain multiple forms that submit independently?
↓
NO → Use default error bag — single form, no conflict possible
YES → Do the forms share any field names (both forms have an "email" field)?
    YES → Use named error bags — shared field names would mix errors between forms
    NO → Are the forms visually separated (different sections, different modals, different tabs)?
        YES → Use named error bags — prevents one form's errors from displaying on the other form
        NO → Are the forms independent operations (login + registration, search + filter)?
            YES → Use named error bags — one form's failure shouldn't block the other
            NO → Single default bag may suffice with clear UX separation

---

## Rationale

Named error bags isolate validation state per form. Without them, a registration form's validation errors appear on the login form and vice versa because both use the default `"default"` bag. Named bags (`$request->errorBag('login')`) scope errors to the correct form context.

---

## Recommended Default

**Default:** Use default error bag for single-form pages. Use named error bags (`FormRequest::errorBag()`) for any page with multiple independent forms.
**Reason:** Error bag isolation is simple to implement and prevents a common UX bug — cross-form error pollution.

---

## Risks Of Wrong Choice

* Default bag for multi-form pages: Login errors show on registration form, search errors show on filter form
* Named bag for single form: Unnecessary configuration — default bag works correctly
* No errorBag() on FormRequest: Controller must manually pass bag name — easy to forget

---

## Related Rules

* Named Error Bags for Multi-Form Pages
* FormRequest ErrorBag Method

---

## Related Skills

* Create FormRequest-Validated Endpoint

---

---

## Decision 3: Custom failedValidation() vs Handler renderable() for Validation Response

---

## Decision Context

Whether to customize the validation error response by overriding `failedValidation()` on the FormRequest or using a `renderable()` callback in the exception handler for `ValidationException`.

---

## Decision Criteria

* Whether the custom response applies to ALL FormRequests globally or a single FormRequest
* Whether the custom response needs access to the current request data
* Whether the application is API-only (consistent JSON response for all validation errors)
* Whether the application needs Inertia-specific error handling

---

## Decision Tree

Does the custom response apply to all FormRequests in the application?
↓
YES → Is the application API-only (consistent JSON response shape for all validation errors)?
    YES → Use `renderable()` for `ValidationException` in the handler — single point of customization
    NO → Use `renderable()` in the handler for global customization — keep it centralized
NO → Does the custom response apply to a single FormRequest or endpoint?
    YES → Use `failedValidation()` override on the specific FormRequest
    NO → Do multiple FormRequests share the same custom response logic?
        ↓
        YES → Extract to a trait or base FormRequest class — shared method across classes
        NO → Use `failedValidation()` on the individual FormRequest

---

## Rationale

Global validation response changes belong in the handler's `renderable()` — one place, applies everywhere. Endpoint-specific changes belong on the FormRequest's `failedValidation()` override. Using `failedValidation()` on every FormRequest for the same change is repetitive — extract to a base class or use the handler.

---

## Recommended Default

**Default:** Use handler `renderable()` for global validation response customization (e.g., consistent API JSON structure). Use FormRequest `failedValidation()` for endpoint-specific response needs.
**Reason:** The handler is the centralized point for global exception rendering. `failedValidation()` is the escape hatch for endpoint-specific requirements.

---

## Risks Of Wrong Choice

* `failedValidation()` on every FormRequest: Repeated code — 10 FormRequests with the same override
* `renderable()` for single endpoint: Handler grows with endpoint-specific logic that should be on the FormRequest
* No customization for API: Default Laravel validation JSON structure — may not match API contract

---

## Related Rules

* FormRequest Custom Validation Response
* Error Handler Renderable Registration

---

## Related Skills

* Create FormRequest-Validated Endpoint
* Exception Handler Configuration
