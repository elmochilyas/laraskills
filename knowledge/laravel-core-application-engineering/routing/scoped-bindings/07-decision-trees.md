# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Scoped Bindings
**Generated:** 2026-06-03

---

# Decision Inventory

* Scoped Bindings vs Unscoped Nested Routes
* Auto-Scoping via Resource Routes vs Explicit scopeBindings()
* Scoped Bindings vs Manual Controller-Level Scoping
* Disabling Scoping via withoutScopedBindings() vs Restructuring Routes

---

# Architecture-Level Decision Trees

---

## Decision 1: Scoped Bindings vs Unscoped Nested Routes

---

## Decision Context

Whether to enable scoped bindings on nested routes (child scoped within parent) or allow unscoped access.

---

## Decision Criteria

* Whether the child resource belongs to the parent
* Whether cross-resource access is a security concern
* Whether the child resource is globally unique (UUID-based)

---

## Decision Tree

Is the child resource conceptually owned by the parent (comments belong to a post)?
↓
NO → Unscoped — child may be globally accessible; parent context is informational
YES → Is the child resource globally unique (UUID primary key)?
    ↓
    YES → Scoped bindings may be unnecessary — UUID is globally unique; parent context is for display
    NO → Scoped bindings — prevents access to children that don't belong to the parent
NO → Does the route expose sensitive data?
    ↓
    YES → ALWAYS scope — cross-resource access is a data exposure vulnerability
    NO → Is there any authorization check for parent-child ownership?
        ↓
        YES → Scoped bindings add defense in depth — authorization runs after binding
        NO → Scoped bindings are essential — the only defense against cross-resource access

---

## Rationale

Without scoped bindings, `/posts/1/comments/50` resolves comment 50 even if it belongs to post 2. The binding queries `Comment::findOrFail(50)` without the `post_id = 1` constraint. Scoped bindings add `where('post_id', $post->id)` to the comment query, ensuring the comment belongs to the specified post. This is the primary defense against cross-resource access in nested routes.

---

## Recommended Default

**Default:** Enable scoped bindings for ALL nested resource routes. Disable only when explicitly justified (globally unique child IDs).
**Reason:** Scoped bindings prevent access to unowned child resources. Without them, any user can access any child resource by ID regardless of parent context.

---

## Risks Of Wrong Choice

* No scoping on nested routes: User accesses comments belonging to other posts by guessing comment IDs
* No scoping in multi-tenant: Tenant A accesses tenant B's child resources by ID
* Scoping on globally unique children: Unnecessary WHERE clause — but no harm; still correct
* Scoping without proper foreign key: Framework can't determine the parent-child relationship; scoping fails silently

---

## Related Rules

* Enable Scoping by Default
* Audit Non-Scoped Routes

---

## Related Skills

* Use Scoped Bindings for Nested Resource Routes
* Configure Explicit Scoped Bindings with scopeBindings()

---

---

## Decision 2: Auto-Scoping via Resource Routes vs Explicit scopeBindings()

---

## Decision Context

Whether to rely on automatic scoping from `Route::resource()` or manually call `->scopeBindings()` on explicit routes.

---

## Decision Criteria

* Whether the route is defined via `Route::resource()` or manually
* Whether the route follows Eloquent foreign key conventions
* Whether the child model has the correct `belongsTo` relationship

---

## Decision Tree

Is the nested route defined via `Route::resource('posts.comments', ...)`?
↓
YES → Auto-scoping is enabled by default (Laravel 8+) — no additional configuration needed
NO → Is the nested route defined manually?
    ↓
    YES → Add `->scopeBindings()` to the route — explicit routes don't auto-scope
    NO → Does the child model have a `belongsTo` relationship to the parent?
        ↓
        YES → Auto-scoping works — the framework detects the foreign key from the relationship
        NO → Scoping may fail — the framework can't determine the scoping column
YES → Does the child model follow the foreign key convention (`post_id` for `posts`)?
    ↓
    YES → Auto-scoping works — default foreign key convention
    NO → Scoping may fail or scope by the wrong column — verify with route:list

---

## Rationale

Resource routes auto-scope nested bindings since Laravel 8. Manual routes require explicit `->scopeBindings()` calls. The framework determines the scoping column by inspecting the child model's `belongsTo` relationship to the parent. If the child follows foreign key conventions (`post_id` for `posts` table), scoping works automatically.

---

## Recommended Default

**Default:** Use `Route::resource()` for nested resources to get auto-scoping. For manual routes, always add `->scopeBindings()`.
**Reason:** Resource routes handle scoping automatically. Manual routes are a common source of missing scoping bugs.

---

## Risks Of Wrong Choice

* Manual route without `scopeBindings()`: No scoping — cross-resource access vulnerability
* `scopeBindings()` without `belongsTo`: Framework can't determine scoping column; scoping fails
* Auto-scoping on resource with non-standard foreign key: Scoping uses wrong column
* `scopeBindings()` on non-nested route: No parent binding to scope against — no effect but harmless

---

## Related Rules

* Enable Scoping by Default
* Audit Non-Scoped Routes

---

## Related Skills

* Use Scoped Bindings for Nested Resource Routes
* Configure Explicit Scoped Bindings with scopeBindings()

---

---

## Decision 3: Scoped Bindings vs Manual Controller-Level Scoping

---

## Decision Context

Whether to rely on route-level scoped bindings or manually verify parent-child ownership in controllers.

---

## Decision Criteria

* Whether routes are defined as nested resources
* Whether controller methods should be responsible for ownership verification
* Whether the application uses both manual and resource routes

---

## Decision Tree

Are the routes defined as nested resources?
↓
YES → Route-level scoping — automatic; no controller code needed
NO → Are the routes manually defined?
    ↓
    YES → Can `->scopeBindings()` be added to the route definition?
        ↓
        YES → Route-level scoping — add `->scopeBindings()` to the route
        NO → Manual scoping in controller — `$post->comments()->findOrFail($commentId)`
    NO → Route-level scoping — prefer route-level over controller-level
NO → Is there a requirement for the controller to verify ownership independently?
    ↓
    YES → Both — route-level scoping + controller-level verification (defense in depth)
    NO → Route-level scoping only — route-level is sufficient

---

## Rationale

Route-level scoping (`$comment = Comment::where('post_id', $post->id)->findOrFail($commentId)`) happens before the controller receives the model. Manual controller-level scoping (`$post->comments()->findOrFail($commentId)`) duplicates this logic in every controller method. Route-level scoping is DRYer and prevents the wrong model from being loaded at all.

---

## Recommended Default

**Default:** Route-level scoping for all nested routes. Remove manual `findOrFail` scoping from controllers when route-level scoping is enabled.
**Reason:** Route-level scoping prevents the wrong model from being loaded before the controller sees it. Controller-level scoping loads the wrong model first, then rejects it — wasteful and error-prone.

---

## Risks Of Wrong Choice

* Controller-level scoping only: Wrong child model is loaded before scoping check; memory and query wasted
* Both route and controller scoping: Redundant queries — the route-level query loads the model, controller queries again
* No scoping at either level: Cross-resource access vulnerability; wrong model used throughout
* Inconsistent scoping: Some controllers scope manually, others rely on route-level — confusion about which applies

---

## Related Rules

* Enable Scoping by Default
* Never Place Business Logic in Middleware

---

## Related Skills

* Use Scoped Bindings for Nested Resource Routes
* Refactor Manual Controller Scoping to Route-Level Scoped Bindings

---

---

## Decision 4: Disabling Scoping via withoutScopedBindings() vs Restructuring Routes

---

## Decision Context

Whether to disable scoped bindings on a specific route or restructure the route to avoid needing unscoped access.

---

## Decision Criteria

* Whether the child resource is legitimately globally accessible
* Whether the parent context is truly unnecessary for child resolution
* Whether the route design can be changed

---

## Decision Tree

Is the child resource globally unique (UUID primary key)?
↓
YES → `withoutScopedBindings()` — globally unique children don't need parent scoping
NO → Does the child resource legitimately not belong to the parent context?
    ↓
    YES → Can the route be restructured to not be nested?
        ↓
        YES → Restructure — move child to top-level route instead of nesting
        NO → `withoutScopedBindings()` — document WHY scoping is disabled
    NO → Is the team disabling scoping out of convenience (getting 404s)?
        ↓
        YES → Fix the underlying issue — wrong parent key, missing relationship, wrong route parameters
        NO → `withoutScopedBindings()` — legitimate use case
NO → Is `withoutScopedBindings()` being used to bypass debugging?
    ↓
    YES → Fix the bug — scoping is not the problem; incorrect route parameters are
    NO → Evaluate legitimate use cases

---

## Rationale

`withoutScopedBindings()` disables the security guarantee of scoped bindings. It should only be used when the child resource is globally unique (UUID-based, no parent dependency) or when the route design legitimately requires unscoped access. In most cases, disabling scoping is a workaround for incorrect route configuration, not a legitimate architectural decision.

---

## Recommended Default

**Default:** NEVER use `withoutScopedBindings()` by default. Add it only after thorough review and documentation of why scoping is unnecessary.
**Reason:** Scoped bindings are a security feature. Disabling them creates a data exposure vulnerability that must be intentional and documented.

---

## Risks Of Wrong Choice

* Disabling for convenience: Opens cross-resource access vulnerability; easy to forget to re-enable
* Disabling without documentation: Future developers don't know scoping is disabled; assumes it's active
* Disabling and restructuring later: The `withoutScopedBindings()` call remains as dead configuration
* Disabling on non-unique children: Multiple children with same ID in different parent contexts return wrong model

---

## Related Rules

* Enable Scoping by Default
* Audit Non-Scoped Routes

---

## Related Skills

* Use Scoped Bindings for Nested Resource Routes
* Disable Scoped Bindings with withoutScopedBindings() When Appropriate
