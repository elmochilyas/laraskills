# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Form Handling
**Generated:** 2026-06-03

---

# Decision Inventory

* useForm() vs Direct axios/fetch for Form Submission
* Server-Side Validation Only vs Client + Server Validation
* useForm POST vs router.visit for Form Actions

---

# Architecture-Level Decision Trees

---

## Decision 1: useForm() vs Direct axios/fetch for Form Submission

---

## Decision Context

Whether to use Inertia's `useForm()` hook for form submission or a direct HTTP client (axios, fetch) that bypasses Inertia's protocol.

---

## Decision Criteria

* Whether the form submission should use Inertia's error auto-mapping
* Whether the form submission should trigger a page navigation (redirect) on success
* Whether the form submission is a standard CRUD operation or a custom API call
* Whether the response should update Inertia's page state

---

## Decision Tree

Does the form submit data that should update the current page or navigate to a new page?
↓
YES → Use `useForm()` — integrates with Inertia's navigation, error mapping, and page state
NO → Is the form submission a custom API call that should NOT change the page?
    YES → Use axios/fetch — direct API call, no Inertia page change
    NO → Does the form need automatic error mapping from server 422 responses?
        YES → Use `useForm()` — errors auto-populate from server validation
        NO → Use `useForm()` — still provides processing state, error handling, and form management

---

## Rationale

`useForm()` integrates with Inertia's protocol — server validation errors are automatically mapped to form fields, form state is managed (processing, errors, hasErrors, recentlySuccessful), and submissions trigger proper Inertia navigation. Direct axios/fetch calls bypass Inertia's page management and require manual error handling.

---

## Recommended Default

**Default:** Use `useForm()` for all form submissions in Inertia applications. Use axios/fetch only for API calls that don't affect the current page (background sync, analytics).
**Reason:** `useForm()` provides auto error mapping, processing state, and Inertia navigation integration — all features that would need manual implementation with axios/fetch.

---

## Risks Of Wrong Choice

* axios for standard form: No auto error mapping — must manually parse 422 and set errors
* `useForm()` for API-only call: Triggers Inertia page navigation — unintended page change
* No form library: Manual state management — processing flag, error state, data handling
* `useForm()` without redirect: Form submits but page doesn't update — stale data visible

---

## Related Rules

* useForm for Inertia Form Submissions

---

## Related Skills

* Implement a Secure Inertia Form with Validation

---

---

## Decision 2: Server-Side Validation Only vs Client + Server Validation

---

## Decision Context

Whether to rely solely on server-side validation (Laravel FormRequest/Validator) or add client-side validation as an additional layer.

---

## Decision Criteria

* Whether the application needs real-time field-level validation feedback
* Whether the team has JavaScript expertise to maintain client validation
* Whether the validation rules are simple or complex
* Whether the application is public-facing (UX priority) or internal tool

---

## Decision Tree

Is server-side validation always implemented?
↓
YES → Is real-time field-level feedback needed for UX (inline errors as user types)?
    YES → Add client-side validation — improves UX, but never replaces server validation
    NO → Is the team size large enough to maintain client and server validation in sync?
        YES → Add client-side validation — duplicate rules, both must match
        NO → Server validation only — simpler, single source of truth
NO → Is the application public-facing where UX is critical?
    YES → Add client-side validation — reduces server round trips for common errors
    NO → Server validation only — internal tools can tolerate round-trip validation

---

## Rationale

Server-side validation is the security boundary — it's required regardless of client-side validation. Client-side validation is UX sugar that provides faster feedback. The cost is maintaining duplicate validation rules in two languages (PHP + JS). Inertia's `useForm` handles server errors seamlessly, so client validation is optional.

---

## Recommended Default

**Default:** Server-side validation always. Client-side validation optional, added when UX requires real-time feedback and the team can maintain both.
**Reason:** Server validation is the security boundary — never optional. Client validation is UX sugar with a maintenance cost. Add only when the UX benefit justifies the duplication.

---

## Risks Of Wrong Choice

* Client validation only: Trivially bypassed — invalid data reaches server, no server validation defined
* Server validation only with complex forms: Users wait for round trip to see field errors — slow feedback loop
* Client and server out of sync: Client says "email too long" (max:100), server says "email too long" (max:255) — confusing
* Duplicate validation with no sync process: Rules drift over time — client misses a rule, server catches it

---

## Related Rules

* Always Validate on Server

---

## Related Skills

* Implement a Secure Inertia Form with Validation

---

---

## Decision 3: useForm POST vs router.visit for Form Actions

---

## Decision Context

Whether to submit form data using `useForm().post()` (form-specific) or `router.visit()` (generic navigation) for form actions.

---

## Decision Criteria

* Whether the submission is a form with field data or a simple action (delete)
* Whether the submission needs to preserve file upload progress tracking
* Whether the submission needs form-specific state management (errors, processing, data)
* Whether the submission is a GET request with query parameters

---

## Decision Tree

Is the submission a form with data fields (create, update) or a simple action (delete)?
↓
Form with data → Use `form.post()` / `form.put()` / `form.patch()` — manages data, errors, processing state
Simple action (delete) → Does the action need to confirm before executing?
    YES → Use `router.visit()` with `onBefore` callback for confirmation
    NO → Use `router.delete()` — simpler than form for action-only requests
NO → Is the submission a GET request with search/filter query parameters?
    YES → Use `router.get()` or `router.visit()` with query parameters
    NO → Is file upload progress tracking needed?
        YES → Use `form.post()` with `forceFormData: true` — provides progress.percentage
        NO → Use `form.post()` — standard form submission

---

## Rationale

`useForm().post()` manages form-specific state (data, errors, processing, recentlySuccessful) that `router.visit()` doesn't provide. `router.visit()` is better for non-form actions (delete, GET navigation) where form state management isn't needed.

---

## Recommended Default

**Default:** `useForm()` for all form submissions with data fields. `router.visit()` or specific methods (`router.delete()`) for non-form actions.
**Reason:** `useForm()` provides error handling, processing state, and data management specific to forms. `router.visit()` is simpler for action-only requests.

---

## Risks Of Wrong Choice

* `router.visit()` for form: No form state management — must manually track data, errors, processing
* `form.post()` for simple delete: Overkill — form object with data, errors for a delete with no fields
* `form.get()` not available: `useForm` doesn't have `get()` — use `router.visit()` for search/filter
* No progress for file upload: `router.visit()` doesn't provide upload progress — use `form.post()`

---

## Related Rules

* useForm for Data Forms, router.visit for Actions

---

## Related Skills

* Implement a Secure Inertia Form with Validation
