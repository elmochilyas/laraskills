# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

* FormRequest vs Inline $request->validate()
* One FormRequest Per Action vs Reusable FormRequest
* FormRequest vs Manual Validator in Controller

---

# Architecture-Level Decision Trees

---

## Decision 1: FormRequest vs Inline $request->validate()

---

## Decision Context

Whether to create a dedicated FormRequest class or validate input inline in the controller using `$request->validate()`.

---

## Decision Criteria

* Number of validation rules (threshold: 3+ rules justify FormRequest)
* Whether authorization is needed (FormRequest provides `authorize()`)
* Whether the same validation is reused across multiple controllers
* Whether the validation rules are testable independently

---

## Decision Tree

Does the action have 3+ validation rules?
↓
YES → Create a FormRequest — dedicated class for focused validation
NO → Does the action require authorization (user can create, update, delete)?
    YES → Create a FormRequest — `authorize()` method gates access before validation
    NO → Is the same validation used in 2+ controllers?
        YES → Create a FormRequest — reusable, single source of truth
        NO → Is the action a controller method that accepts user input?
            YES → Use inline `$request->validate()` — acceptable for 1-2 simple rules
            NO → No validation needed

---

## Rationale

FormRequests encapsulate validation and authorization into a dedicated, autoloadable class. They provide auto-validation (the controller never sees invalid data), authorization gating, and custom error messages. Inline `$request->validate()` is simpler but scatters validation across controllers.

---

## Recommended Default

**Default:** Create a FormRequest for any controller action accepting user input. Use inline `$request->validate()` only for trivial 1-2 rule validations.
**Reason:** FormRequests are the standard Laravel pattern. They provide auto-validation, authorization, custom messages, and improved testability. The overhead of one class per action is justified by the benefits.

---

## Risks Of Wrong Choice

* Inline for 5+ rules: Controller bloated with validation — 20 lines of rules in the controller method
* FormRequest for 1 rule: File overhead — one class for `'required|email'`
* No FormRequest for authorization: Authorization check in controller — easy to forget, scattered
* Inline for reused rules: Duplicate validation across controllers — inconsistent when one changes

---

## Related Rules

* One FormRequest Per Controller Action

---

## Related Skills

* Create and Wire a FormRequest to a Controller Action

---

---

## Decision 2: One FormRequest Per Action vs Reusable FormRequest

---

## Decision Context

Whether to create a dedicated FormRequest for each controller action or reuse a single FormRequest across multiple actions (e.g., `UserRequest` for both store and update).

---

## Decision Criteria

* Whether each action has unique validation rules
* Whether authorization requirements differ between actions
* Whether sharing a FormRequest requires conditional logic to differentiate actions
* Whether the actions have some common rules that could justify inheritance

---

## Decision Tree

Do the actions share identical validation rules and authorization?
↓
YES → Use a single FormRequest — no reason to separate identical logic
NO → Do the actions share 80%+ of validation rules?
    YES → Use inheritance — base FormRequest with shared rules, child classes override
    NO → Does sharing require conditional logic based on `$this->getMethod()` or `$this->route()->getName()`?
        YES → Create separate FormRequests — conditionals in `rules()` are a maintenance smell
        NO → Do the actions have different authorization requirements?
            YES → Create separate FormRequests — authorization varies per action
            NO → Create separate FormRequests — each action has unique rules

---

## Rationale

Shared FormRequests with conditionals to differentiate actions grow unmaintainable. The `rules()` method fills with `if ($this->isMethod('post'))` branches that obscure which rules apply to which action. One FormRequest per action keeps each class focused on a single concern. Inheritance handles shared rules without conditionals.

---

## Recommended Default

**Default:** One FormRequest per controller action. Use inheritance (base class + child classes) when actions share substantial common rules.
**Reason:** Per-action FormRequests have no conditionals, clear naming (`StoreUserRequest`, `UpdateUserRequest`), and separate authorization. Inheritance provides reuse without conditionals.

---

## Risks Of Wrong Choice

* Shared FormRequest with conditionals: `rules()` has 5 `if/else` branches — impossible to tell which rules apply
* Per-action FormRequest with no shared base: Duplicate common rules across 5 requests — DRY violation
* Inheritance with deep hierarchy: Great-grandparent rules apply unexpectedly — brittle
* No FormRequest at all: All validation in controller — violates single responsibility

---

## Related Rules

* One FormRequest Per Controller Action
* FormRequest Inheritance for Shared Rules

---

## Related Skills

* Create and Wire a FormRequest to a Controller Action

---

---

## Decision 3: FormRequest vs Manual Validator in Controller

---

## Decision Context

Whether to use a FormRequest (auto-validated via type-hint) or a manually created Validator inside the controller.

---

## Decision Criteria

* Whether the action is an HTTP controller action (FormRequest-friendly)
* Whether validation follows the standard pattern or needs custom control flow
* Whether the action needs access to validation errors without throwing an exception
* Whether the action is in a non-HTTP context (CLI, queue) where FormRequest is unavailable

---

## Decision Tree

Is the action an HTTP controller action?
↓
YES → Use a FormRequest — auto-validation, authorization, standard Laravel pattern
NO → Is the action in a non-HTTP context (CLI command, queued job)?
    YES → Use `Validator::make()` — FormRequests don't work outside HTTP
    NO → Does the action need to handle validation errors without throwing an exception?
        YES → Use `Validator::make()` manually — check `$validator->fails()` and handle gracefully
        NO → Does the action need custom validation flow (partial validation, conditional validation)?
            YES → Use `Validator::make()` — FormRequest is all-or-nothing
            NO → Use a FormRequest — standard validation pattern

---

## Rationale

FormRequests are the recommended pattern for HTTP controller actions. They auto-validate, auto-authorize, and throw `ValidationException` on failure — the controller never sees invalid data. Manual `Validator::make()` is the escape hatch for non-HTTP contexts or when custom error handling flow is needed.

---

## Recommended Default

**Default:** FormRequest for all HTTP controller actions. Manual `Validator::make()` for non-HTTP contexts and custom validation flows.
**Reason:** FormRequests are simpler, more testable, and follow Laravel conventions. Manual validation is necessary only when FormRequests don't fit the execution context.

---

## Risks Of Wrong Choice

* Manual validator in controller: Must manually check `fails()`, handle errors, and redirect — more code
* FormRequest in non-HTTP context: FormRequest resolves from container but has no HTTP request — errors
* Manual validator that doesn't throw: Controller continues with invalid data — logic errors
* FormRequest when custom error handling needed: Can't prevent the exception — override `failedValidation()`

---

## Related Rules

* FormRequest for HTTP, Manual Validator for CLI/Queue

---

## Related Skills

* Create and Wire a FormRequest to a Controller Action
* Validate Input in Non-HTTP Contexts Using Manual Validator
