# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Authorization in Requests
**Generated:** 2026-06-03

---

# Decision Inventory

* authorize() Method vs Controller/Service Authorization
* Policy Delegation vs Inline Authorization Logic
* authorize() Return Type: bool vs Response vs Throw

---

# Architecture-Level Decision Trees

---

## Decision 1: authorize() Method vs Controller/Service Authorization

---

## Decision Context

Whether to place authorization logic in the FormRequest's `authorize()` method or in the controller or service layer.

---

## Decision Criteria

* Whether authorization depends on request input data (user can create this type?)
* Whether authorization depends on route model binding results (user can edit this specific model?)
* Whether the same authorization logic is needed across multiple entry points (HTTP + CLI + queue)
* Whether authorization should gate access before or after validation

---

## Decision Tree

Does authorization depend on request input data or route model bindings?
↓
YES → Use `authorize()` in FormRequest — runs before validation, has access to route parameters
NO → Is the authorization needed only for HTTP routes?
    YES → Use `authorize()` in FormRequest — co-locates auth with validation, fails fast before validation
    NO → Is the authorization needed across multiple entry points (HTTP + CLI + queue)?
        YES → Place authorization in a Policy or service layer — reusable across contexts
        NO → Use `authorize()` in FormRequest — simplest for HTTP-only authorization

---

## Rationale

FormRequest `authorize()` runs as the second step in the validation pipeline — before any validation rules execute. This means unauthorized requests are rejected before input is validated, saving processing time and preventing information leakage. If authorization is needed across multiple entry points, a Policy is the correct reusable location.

---

## Recommended Default

**Default:** Use `authorize()` in FormRequest for all HTTP-layer authorization. Use Policies for authorization that spans multiple entry points.
**Reason:** `authorize()` provides early rejection (before validation) and co-location with the request it protects. Policies provide reusability.

---

## Risks Of Wrong Choice

* Authorization only in controller: Unauthorized user's input is validated first — wasted processing, potential information leakage
* Authorization only in Policy: Must manually call `$this->authorize()` in every controller — easy to forget
* Authorization in service: Service depends on HTTP auth context — can't be used from CLI or queue
* No `authorize()` at all: No access control on the request — all authenticated users can create, update, delete

---

## Related Rules

* Keep authorize() Thin — Delegate to Policies and Gates

---

## Related Skills

* Implement HTTP-Layer Authorization in FormRequests

---

---

## Decision 2: Policy Delegation vs Inline Authorization Logic

---

## Decision Context

Whether to delegate authorization from `authorize()` to a Policy class or write inline authorization logic (role checks, ownership comparisons) directly in the method.

---

## Decision Criteria

* Whether there are 2+ actions that need the same type of authorization for the same entity
* Whether the authorization logic is simple (owned by user) or complex (multiple condition checks)
* Whether the authorization logic needs to be tested independently of the FormRequest
* Whether the team uses Laravel's Policy pattern consistently

---

## Decision Tree

Is there already a Policy defined for the entity being authorized?
↓
YES → Delegate to Policy — `$this->user()->can('create', Post::class)`
NO → Would a Policy be useful for this entity's other actions (update, delete, view)?
    YES → Create a Policy and delegate — single source of truth for all entity authorization
    NO → Is the authorization logic a simple single-condition check?
        YES → Inline in `authorize()` — `$this->user()->id === $this->route('post')->user_id`
        NO → Is the authorization logic complex (3+ conditions)?
            YES → Extract to a Policy method — testable, reusable, keeps `authorize()` thin
            NO → Inline in `authorize()`

---

## Rationale

Policies are Laravel's canonical location for authorization logic. They centralize access rules per entity, making them testable and reusable across controllers, requests, and other contexts. Keeping `authorize()` thin ensures the FormRequest remains focused on request-specific concerns.

---

## Recommended Default

**Default:** Delegate to Policies from `authorize()`. Write `authorize()` as `return $this->user()->can('action', $model);`.
**Reason:** Policies centralize authorization, are testable, and integrate with Laravel's authorization system (blade directives, middleware, controllers). Inline logic scatters access rules across request classes.

---

## Risks Of Wrong Choice

* Inline logic for complex auth: 20-line `authorize()` method — hard to test, impossible to reuse
* Policy for simple check: File overhead for `$this->user()->id === $post->user_id`
* No policy for entity with 5 actions: Authorization logic duplicated across 5 FormRequests
* Policy with no Gate registration: `cannot()` always returns false — all access denied

---

## Related Rules

* Keep authorize() Thin — Delegate to Policies and Gates
* Policy Authorization for Complex Rules

---

## Related Skills

* Implement HTTP-Layer Authorization in FormRequests

---

---

## Decision 3: authorize() Return Type: bool vs Response vs Throw

---

## Decision Context

How to signal authorization failure from `authorize()` — returning `false`, returning `Illuminate\Auth\Access\Response`, or throwing an exception.

---

## Decision Criteria

* Whether a custom error message is needed vs the default 403 message
* Whether custom HTTP headers or redirects are needed on authorization failure
* Whether the authorization failure is a 403 vs needing a different status (401, 404)
* Whether the application uses Inertia (which needs Inertia-compatible error responses)

---

## Decision Tree

Is the default 403 "This action is unauthorized." message sufficient?
↓
YES → Return `bool`: `true` (authorized) or `false` (denied)
NO → Do you need a custom error message?
    YES → Use `Response::deny('Custom message')` — returns 403 with custom message
    NO → Do you need a different HTTP status code (401 instead of 403)?
        YES → Throw `AuthenticationException` (401) or `HttpException` with custom status — full control
        NO → Do you need to redirect on authorization failure?
            ↓
            YES → Override `failedAuthorization()` — throw `AuthorizationException` with custom redirect
            NO → Return `bool` — default behavior

---

## Rationale

Returning `bool` is the simplest option and is sufficient for most cases. `Response::deny()` provides custom messages. Throwing exceptions or overriding `failedAuthorization()` provides full control over the response, including redirects and status codes. Choose the simplest approach that meets the requirements.

---

## Recommended Default

**Default:** Return `bool` from `authorize()`. Use `Response::deny()` when a custom error message is needed.
**Reason:** The default 403 message is appropriate for most applications. Custom messages are a minor improvement. Only use exception-level control when you need non-standard status codes or redirects.

---

## Risks Of Wrong Choice

* Always returning `Response::deny()`: Boilerplate — one-method response when `false` would work
* Returning `false` when redirect needed: 403 page instead of redirect — user can't recover
* Throwing exception when `false` suffices: Non-standard error handling — framework's auto-handler is bypassed
* No message in `deny()`: Empty error display — confusion about why access was denied

---

## Related Rules

* authorize() Return Type Convention
* Custom Authorization Error Responses

---

## Related Skills

* Implement HTTP-Layer Authorization in FormRequests
