# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Singleton Routes
**Generated:** 2026-06-03

---

# Decision Inventory

* Route::singleton() vs Route::resource()->only() for Singular Resources
* Creatable Singleton vs Read-Only Singleton
* Nested Singleton vs Top-Level Singleton
* Singleton Controller Method Convention vs Custom Methods

---

# Architecture-Level Decision Trees

---

## Decision 1: Route::singleton() vs Route::resource()->only() for Singular Resources

---

## Decision Context

Whether to use `Route::singleton()` or `Route::resource()->only()` for resources that have at most one instance per parent context.

---

## Decision Criteria

* Whether the resource is inherently singular (one per parent)
* Whether the URI should include an ID parameter
* Whether the team is familiar with singleton routes

---

## Decision Tree

Does the resource have at most one instance per parent context (profile, avatar, settings)?
↓
YES → `Route::singleton()` — no ID parameter in URI; name implies singular nature
NO → Is the resource described as "the" or "current" (the user's profile, current settings)?
    ↓
    YES → `Route::singleton()` — singular resource accessed at a fixed location
    NO → `Route::resource()` — resources with multiple instances need the standard 7 routes
NO → Does the URI currently include a redundant `{profile}` parameter that is always the same value?
    ↓
    YES → `Route::singleton()` — eliminates the redundant ID parameter
    NO → `Route::resource()` — standard CRUD resource

---

## Rationale

`Route::singleton('profile', ...)` generates routes without an ID parameter because the resource is always accessed at a fixed location (e.g., `/profile` instead of `/profile/{profile}`). It generates show, edit, update, and destroy routes. Using `Route::resource()->only()` with the same actions would include a `{profile}` parameter that is never used.

---

## Recommended Default

**Default:** `Route::singleton()` for truly singular resources (profile, avatar, settings per user). `Route::resource()` for resources with multiple instances.
**Reason:** Singleton routes explicitly communicate the resource's singular nature and eliminate the unused ID parameter.

---

## Risks Of Wrong Choice

* `Route::resource()` for profile: URI includes `/profile/{profile}` where `{profile}` is always the current user's profile
* `Route::singleton()` for multiple instances: Cannot represent multiple instances; wrong for collections
* `Route::singleton()` without `creatable()` for new resources: No way to create the first instance
* Inconsistent singular/plural: Mixing `Route::singleton('profile')` and `Route::resource('users')` without clear distinction

---

## Related Rules

* Use apiResource for APIs
* Name Resources Consistently

---

## Related Skills

* Define Singleton Routes with Route::singleton()
* Use creatable() for Singleton Resources That May Not Exist

---

---

## Decision 2: Creatable Singleton vs Read-Only Singleton

---

## Decision Context

Whether to add `->creatable()` to a singleton route to include create and store routes.

---

## Decision Criteria

* Whether the singleton resource may not exist initially
* Whether the user creates the resource themselves
* Whether the resource is auto-created on first access

---

## Decision Tree

Does the singleton resource exist immediately (auto-created on registration)?
↓
NO → Does the user need to explicitly create the resource?
    ↓
    YES → `->creatable()` — adds GET /create and POST / routes for creation
    NO → Auto-create on first access — no `creatable()`; handle creation in show()
NO → Is the resource populated by system action (not user-initiated)?
    ↓
    YES → No `creatable()` — system creates the resource; user never needs create routes
    NO → Is the resource optional (some users may not have it)?
        ↓
        YES → `->creatable()` — users without the resource need a way to create it
        NO → No `creatable()` — resource always exists; no creation needed

---

## Rationale

Without `creatable()`, a singleton route only has show, edit, update, and destroy. If the resource doesn't exist (user hasn't created their profile yet), there's no way to create it. `creatable()` adds create and store routes so the user can create the initial instance. If the resource is auto-created (e.g., user profile created on registration), `creatable()` is unnecessary.

---

## Recommended Default

**Default:** `->creatable()` for user-managed singleton resources (profile, avatar, settings). No `creatable()` for automatically-created singletons.
**Reason:** Without `creatable()`, there's no way to create the resource. Adding it only when needed prevents unnecessary routes.

---

## Risks Of Wrong Choice

* No `creatable()` for user-created profile: User can't create their profile; show route returns 404 with no way to create
* `creatable()` for auto-created resource: Unnecessary create/store routes; user may accidentally create a second instance
* `creatable()` on non-singleton: Creates are already handled by resource routes
* `creatable()` without authorization: Anyone can create a singleton resource; may bypass intended creation flow

---

## Related Rules

* Use apiResource for APIs
* Add Custom Actions Outside the Resource Definition

---

## Related Skills

* Define Singleton Routes with Route::singleton()
* Use creatable() for Singleton Resources That May Not Exist

---

---

## Decision 3: Nested Singleton vs Top-Level Singleton

---

## Decision Context

Whether to nest a singleton resource under a parent or keep it at the top level.

---

## Decision Criteria

* Whether the singleton belongs to a parent entity (user, team)
* Whether the parent context is needed for authorization
* Whether the singleton is global or scoped

---

## Decision Tree

Does the singleton belong to a parent entity (user's profile, team's settings)?
↓
YES → Nested singleton — `Route::singleton('team.profile', ProfileController::class)`
NO → Is the singleton globally scoped (application settings)?
    ↓
    YES → Top-level singleton — no parent context; global singleton
    NO → Does the singleton require a parent context for authorization?
        ↓
        YES → Nested singleton — parent context is needed for authorization scoping
        NO → Top-level singleton — no parent dependency
NO → Is the parent entity resolved via route model binding?
    ↓
    YES → Nested singleton — parent model is automatically bound
    NO → Top-level singleton — no parent binding needed

---

## Rationale

Nested singletons (e.g., `team.profile` → `teams/{team}/profile`) automatically resolve the parent model via route model binding. The parent context is available in the controller for authorization and scoping. Top-level singletons (e.g., `profile` → `/profile`) have no parent and are globally scoped.

---

## Recommended Default

**Default:** Nested singleton when the resource belongs to a parent entity. Top-level singleton for globally-scoped resources.
**Reason:** Nesting provides parent context for authorization and scoping. Top-level is simpler for truly global singletons.

---

## Risks Of Wrong Choice

* Top-level singleton that should be nested: Missing parent context; authorization requires manual parent resolution
* Nested singleton without parent binding: Parent not in route — controller can't access parent context
* Nested singleton with redundant parent: Parent ID in URI is always the same for the current user
* Nested singleton 3+ levels deep: Unwieldy URIs; deep nesting antipattern

---

## Related Rules

* Use apiResource for APIs
* Name Resources Consistently

---

## Related Skills

* Define Singleton Routes with Route::singleton()
* Use Nested Singleton Routes for Parent-Scoped Resources

---

---

## Decision 4: Singleton Controller Method Convention vs Custom Methods

---

## Decision Context

Whether to follow the singleton controller convention (show, edit, update, destroy) or define custom method names.

---

## Decision Criteria

* Whether the singleton operations match the standard convention
* Whether the controller implements singleton-specific logic
* Whether the team understands the singleton method convention

---

## Decision Tree

Does the singleton need only the standard operations (show, edit, update, destroy)?
↓
YES → Follow convention — `show()`, `edit()`, `update()`, `destroy()` in the controller
NO → Does the singleton need create/store (use `creatable()`)?
    ↓
    YES → Convention + create — standard singleton methods + `create()` and `store()`
    NO → Does the singleton need custom operations beyond the standard?
        ↓
        YES → Define custom routes outside the singleton — add explicit routes for custom operations
        NO → Follow convention — standard methods cover all needs
NO → Is the controller also used for non-singleton routes?
    ↓
    YES → Follow convention — standard method names avoid ambiguity with other route definitions
    NO → Singleton controller convention is still preferred — method names are predictable

---

## Rationale

Singleton routes map to specific controller method names: show, edit, update, destroy (and create/store if `creatable`). These conventions are predictable and consistent with resource routing conventions. Custom operations should be defined as explicit routes outside the singleton definition.

---

## Recommended Default

**Default:** Follow the singleton controller convention. If custom operations are needed, add explicit routes alongside the singleton definition.
**Reason:** Standard method names are predictable and follow Laravel conventions. Custom routes are explicit about non-standard operations.

---

## Risks Of Wrong Choice

* Non-standard method names: Route tries to call `show()` but controller has `display()` — 500 error
* Custom methods inside singleton definition: Not supported — singleton generates specific routes only
* Inconsistent convention: Some singletons use standard methods, others don't — confusing for developers
* Missing `show()` method: Singleton generates `/profile` route but controller has no `show()` — 500

---

## Related Rules

* Use apiResource for APIs
* Name Resources Consistently

---

## Related Skills

* Define Singleton Routes with Route::singleton()
* Follow Singleton Controller Method Conventions
