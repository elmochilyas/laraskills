# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Model Binding (Implicit)
**Generated:** 2026-06-03

---

# Decision Inventory

* Implicit Binding vs Manual findOrFail in Controllers
* Custom Column Binding via Inline Syntax vs Model-Level getRouteKeyName
* Parameter Name Convention vs Custom Parameter Names
* withTrashed vs Default Soft Delete Exclusion

---

# Architecture-Level Decision Trees

---

## Decision 1: Implicit Binding vs Manual findOrFail in Controllers

---

## Decision Context

Whether to rely on Laravel's implicit route model binding or manually call `Model::findOrFail()` in controller methods.

---

## Decision Criteria

* Whether the route parameter maps directly to a model ID
* Whether the controller method needs the model instance
* Whether the resolution logic is a simple `findOrFail`

---

## Decision Tree

Does the route parameter map directly to a model's primary key?
↓
YES → Is the resolution a simple `Model::findOrFail($id)`?
    ↓
    YES → Implicit binding — type-hint the model in the controller parameter
    NO → Does the resolution need custom logic (cache, joins, authorization)?
        ↓
        YES → Explicit binding — use `Route::bind()` for custom resolution
        NO → Implicit binding — the standard resolution handles it
NO → Does the route parameter map to a non-primary-key column?
    ↓
    YES → Custom column binding — `{user:slug}` syntax in the route definition
    NO → Does the controller need the model at all?
        ↓
    YES → Explicit binding — custom resolution for non-standard mapping
    NO → No binding needed — pass the raw parameter value

---

## Rationale

Implicit binding eliminates `User::findOrFail($id)` boilerplate from every controller method. It automatically returns 404 when the model is not found. The mechanism is parameter name matching — `{user}` in the URI matches `User $user` in the controller parameter. This is the standard, most concise approach for ID-based model resolution.

---

## Recommended Default

**Default:** Implicit binding for all routes where a route parameter corresponds to a model's primary key.
**Reason:** Implicit binding is zero-configuration, automatically returns 404, and documents the expected model type in the method signature.

---

## Risks Of Wrong Choice

* Manual `findOrFail` in every controller: Boilerplate code; inconsistent 404 handling; easy to forget
* Implicit binding with non-matching parameter names: `{user}` and `User $account` — binding fails silently; raw ID injected
* Implicit binding for non-primary-key: Resolves by ID when slug was intended; wrong model returned
* Manual resolution with different 404 behavior: Some controllers return 404, others throw exceptions, others return null

---

## Related Rules

* Use Type-Hinted Parameters in Controllers
* Name Every Route for URL Generation

---

## Related Skills

* Implement Implicit Route Model Binding with Type-Hinted Parameters
* Use Custom Column Binding for Non-ID Route Resolution

---

---

## Decision 2: Custom Column Binding via Inline Syntax vs Model-Level getRouteKeyName

---

## Decision Context

Whether to use inline `{user:slug}` syntax or override `getRouteKeyName()` on the model to specify a custom binding column.

---

## Decision Criteria

* Whether all routes for the model should use the same custom key
* Whether only specific routes need non-ID resolution
* Whether the model's route key is a fundamental property

---

## Decision Tree

Do ALL routes for this model need to bind by the same non-ID column?
↓
NO → Inline syntax — `{user:slug}` only affects the specific route
YES → Is the custom key a fundamental property of the model (UUID, ULID)?
    ↓
    YES → `getRouteKeyName()` — the model's identity is naturally non-numeric; affects all bindings correctly
    NO → Inline syntax — only specific routes need non-ID binding; global override would break other routes
NO → Is the custom key also used for URL generation (`route('users.show', $user)`)?
    ↓
    YES → `getRouteKeyName()` — also changes `getRouteKey()` which affects URL generation
    NO → Inline syntax — URL generation still uses primary key; only route resolution uses custom column

---

## Rationale

`getRouteKeyName()` affects ALL bindings of that model globally AND changes `getRouteKey()` which controls URL generation. Inline `{user:slug}` syntax (Laravel 8+) only affects the specific route and does not change URL generation. Inline syntax is preferred because it's explicit at the route level and doesn't silently affect other routes.

---

## Recommended Default

**Default:** Inline `{user:slug}` syntax for single-route customization. `getRouteKeyName()` only when the model naturally uses a non-numeric primary key (UUID/ULID) and ALL routes should reflect this.
**Reason:** Inline syntax is explicit and scoped. `getRouteKeyName()` silently changes all bindings and URL generation.

---

## Risks Of Wrong Choice

* `getRouteKeyName()` for single route: All routes change binding behavior; URL generation changes silently
* Inline syntax for all routes: Every route must specify the column — repetitive and error-prone
* Non-unique column in binding: Wrong model returned when duplicates exist
* Missing index on custom column: Slow queries on large tables

---

## Related Rules

* Use Type-Hinted Parameters in Controllers
* Ensure Column Uniqueness for Custom Binding Keys

---

## Related Skills

* Implement Implicit Route Model Binding with Type-Hinted Parameters
* Use Custom Column Binding for Non-ID Route Resolution

---

---

## Decision 3: Parameter Name Convention vs Custom Parameter Names

---

## Decision Context

Whether to follow the Laravel convention (parameter name matches variable name) or use custom parameter names.

---

## Decision Criteria

* Whether the parameter name convention is consistent across the application
* Whether the parameter name clearly identifies the model
* Whether implicit binding is intended

---

## Decision Tree

Does the route parameter name match the type-hinted variable name in the controller?
↓
YES → {user} → User $user → Implicit binding works automatically
NO → {userId} → User $user → Does the parameter need a different URI name than the variable?
    ↓
    YES → Parameter naming convention is intentional — use explicit binding or match parameter to variable
    NO → Rename to match — `{user}` instead of `{userId}` for `User $user`
NO → Is the parameter name a convention violation (userId vs user)?
    ↓
    YES → Fix the convention — use `{user}` for model binding, `{userId}` only when not binding
    NO → Match parameter name to variable name — implicit binding requires this

---

## Rationale

Implicit binding works by matching the route parameter name to the controller variable name. `{user}` in the URI matches `User $user` in the controller. If the names don't match, the framework does NOT bind and injects the raw string value instead. This is the most common binding bug — developers name the parameter `{userId}` and the variable `User $user`, expecting binding to work.

---

## Recommended Default

**Default:** Match route parameter names to controller variable names exactly. `{user}` → `$user`, `{post}` → `$post`.
**Reason:** Name matching is the core mechanism of implicit binding. Mismatched names silently bypass binding entirely.

---

## Risks Of Wrong Choice

* `{userId}` with `User $user`: No binding — raw ID string injected; controller expects model, gets string
* `{user}` with `string $userId`: No binding — type hint is string, not model; raw value passed
* Inconsistent naming: Some routes use `{user}`, others use `{userId}` — no consistent convention
* Case mismatch: `{User}` matches `User $user` (case-insensitive) but convention should be lowercase

---

## Related Rules

* Use Type-Hinted Parameters in Controllers
* Always Name Routes

---

## Related Skills

* Implement Implicit Route Model Binding with Type-Hinted Parameters
* Match Route Parameter Names to Controller Variable Names

---

---

## Decision 4: withTrashed vs Default Soft Delete Exclusion

---

## Decision Context

Whether to include soft-deleted models in route model binding using `->withTrashed()`.

---

## Decision Criteria

* Whether the route should expose soft-deleted resources
* Whether the controller handles trashed models explicitly
* Whether security constraints require soft-deleted models to be inaccessible

---

## Decision Tree

Should the route expose soft-deleted resources to the user?
↓
NO → Default behavior (no `withTrashed`) — soft-deleted models return 404; this is usually correct
YES → Does the controller method explicitly handle trashed models?
    ↓
    YES → `->withTrashed()` — the controller is prepared to receive trashed models
    NO → Is there authorization logic that prevents unauthorized access to trashed models?
        ↓
        YES → `->withTrashed()` + authorization — the route supports trashed models but access is controlled
        NO → Default behavior — trashed models should not be accessible without explicit handling
NO → Is the route part of an admin panel that manages trashed resources?
    ↓
    YES → `->withTrashed()` — admin routes explicitly manage trashed resources
    NO → Default behavior — public routes should never expose deleted resources

---

## Rationale

Without `->withTrashed()`, soft-deleted models return 404 from implicit binding. This is the correct default — deleted resources should not be accessible. `->withTrashed()` should only be added when the route explicitly handles trashed models (admin restore, force delete, trashed resource listing).

---

## Recommended Default

**Default:** Do NOT use `->withTrashed()` unless the route explicitly needs to access soft-deleted models. This is a security-conscious default.
**Reason:** Accidentally exposing soft-deleted records to unauthorized users is a common security issue. The default 404 is the safe behavior.

---

## Risks Of Wrong Choice

* No `withTrashed` when needed: Admin restore route returns 404 for trashed models
* `withTrashed` on public routes: Deleted resources accessible without authorization
* `withTrashed` globally on model: If `resolveRouteBinding` is overridden to always include trashed, all routes expose deleted records
* Inconsistent `withTrashed`: Some routes support trashed models, others don't — confusing API behavior

---

## Related Rules

* Use Type-Hinted Parameters in Controllers
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Implicit Route Model Binding with Type-Hinted Parameters
* Use withTrashed for Soft-Deleted Model Binding in Admin Routes
