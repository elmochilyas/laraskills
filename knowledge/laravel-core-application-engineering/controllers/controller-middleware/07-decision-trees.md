# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Route-Level vs Controller-Level Middleware
* `only()` vs `except()` Scoping Strategy
* Controller Middleware vs FormRequest authorize()

---

# Architecture-Level Decision Trees

---

## Decision 1: Route-Level vs Controller-Level Middleware

---

## Decision Context

Whether to apply middleware in the route definition (route groups, individual routes) or in the controller constructor via `$this->middleware()`.

---

## Decision Criteria

* Whether the same middleware applies to multiple controllers
* Whether the middleware needs method-level granularity
* Whether the security audit requires visible middleware declarations

---

## Decision Tree

Does the same middleware apply to multiple controllers (e.g., auth on all resources)?
↓
YES → Route-level middleware in route groups:
    `Route::middleware('auth')->group(function () { ... })`
    Reason: Visible in route files, auditable from one location, DRY
NO → Does the middleware need to apply to specific methods within a single controller?
    YES → Controller-level middleware:
        `$this->middleware('admin')->only(['destroy']);`
        Reason: Method-level granularity not achievable at route level
    NO → Single action controller or all methods need it?
        YES → Route-level is simpler
        NO → Controller-level

---

## Rationale

Route-level middleware is visible in route files, making the security posture auditable from a single location. Controller middleware is hidden inside class files and requires developers to check every controller to understand the full middleware stack.

---

## Recommended Default

**Default:** Route-level middleware for shared protection (auth, throttle); controller-level only for method-specific granularity
**Reason:** Route-level is auditable and DRY. Controller-level is needed when different methods of the same controller need different middleware.

---

## Risks Of Wrong Choice

* Controller middleware for shared protection: Duplicated across controllers, invisible in route files
* Route-level for method-specific needs: Cannot scope middleware to individual methods
* Middleware duplication: Same middleware at route AND controller level runs twice

---

## Related Rules

* Prefer Route-Level Middleware for Shared Protection (05-rules.md)
* Verify Middleware Composition with route:list (05-rules.md)

---

## Related Skills

* Skill: Apply Middleware to Controller Actions

---

## Decision 2: only() vs except() Scoping Strategy

---

## Decision Context

Whether to use `->only()` (list the actions that get middleware) or `->except()` (list the actions that exclude middleware) when scoping controller middleware.

---

## Decision Criteria

* Number of actions that need the middleware vs number that don't
* Whether future methods should automatically get the middleware
* Whether restrictive (whitelist) or permissive (blacklist) scoping is preferred

---

## Decision Tree

Do only a few actions need this middleware (1-3 out of 7)?
↓
YES → `->only(['action1', 'action2'])` — explicit whitelist
    Future methods are NOT automatically protected (safer default)
NO → Do most actions need this middleware, with only 1-2 exceptions?
    YES → `->except(['index', 'show'])` — more readable for auth on resource controllers
    NO → Does the middleware apply to ALL actions?
        YES AND ALL actions truly need it → Unscoped is acceptable with documentation
        NO → `->only()` is the safer default
NO → Is this `auth` middleware on a resource controller?
    YES → `->except(['index', 'show'])` is the convention (public reads)
    NO → `->only()` is preferred

---

## Rationale

`->only()` explicitly lists what is protected, making it immediately clear which actions have the middleware. `->except()` requires the reader to know all controller methods and subtract the exceptions mentally, which is error-prone as methods are added.

---

## Recommended Default

**Default:** `->only()` as the restrictive default; `->except()` only for auth middleware on resource controllers
**Reason:** `->only()` is restrictive — new methods are unprotected by default, which is safer. `->except()` requires the developer to remember to exclude new methods.

---

## Risks Of Wrong Choice

* `->except()` for everything: New methods automatically get middleware, potential unintended protection
* `->only()` for auth on resource: More verbose (`->only(['store', 'update', 'destroy'])` vs `->except(['index', 'show'])`)
* Unscoped middleware: Applies to ALL methods, including future additions

---

## Related Rules

* Use `->only()` as the Default, `->except()` as the Exception (05-rules.md)
* Always Declare except() for Public Resource Actions (05-rules.md)

---

## Related Skills

* Skill: Apply Middleware to Controller Actions

---

## Decision 3: Controller Middleware vs FormRequest authorize()

---

## Decision Context

Whether to enforce authorization via controller middleware (`$this->middleware('can:update,post')`) or via FormRequest `authorize()` method.

---

## Decision Criteria

* Whether authorization requires model-specific access (can user update THIS post)
* Whether the check is role-based (admin, editor) or permission-based
* Whether the authorization check needs access to validated request data

---

## Decision Tree

Does the authorization require model-specific access (can user update THIS specific resource)?
↓
YES → FormRequest `authorize()` or Policy gate:
    ```php
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post'));
    }
    ```
    Reason: Model-specific checks need the resolved route model which FormRequest has access to
NO → Is the check role-based (admin only, editor only)?
    YES → Controller middleware is acceptable:
        `$this->middleware('admin')->only(['destroy']);`
        Reason: Role-based checks do not need model access
    NO → Is the check a simple permission (feature flag, subscription tier)?
        YES → Controller middleware or custom middleware class
        NO → FormRequest authorize()
NO → Does the authorization depend on the input data (validated request)?
    YES → FormRequest authorize() (has access to validated data)
    NO → Controller middleware

---

## Rationale

Controller middleware runs authorization at the middleware layer, before the controller method resolves. This couples the authorization check to the route resolution. FormRequest `authorize()` keeps authorization coupled to the validated request data and has access to route model bindings.

---

## Recommended Default

**Default:** FormRequest `authorize()` for model-specific authorization; controller middleware for simple role-based checks (admin, editor)
**Reason:** FormRequest has access to route model bindings and validated data — needed for model-specific authorization. Simple role checks don't need this context.

---

## Risks Of Wrong Choice

* `middleware('can:...')`: Authorization split across middleware and FormRequest, harder to test
* FormRequest for simple role check: Overkill — a middleware with `->only(['destroy'])` is simpler
* Auth in controller method body: Runs after middleware, bypasses middleware-layer protection

---

## Related Rules

* Do Not Use Controller Middleware as Authorization Gate (05-rules.md)

---

## Related Skills

* Skill: Apply Middleware to Controller Actions
