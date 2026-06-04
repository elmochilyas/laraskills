# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Resourceful Routing
**Generated:** 2026-06-03

---

# Decision Inventory

* Route::resource() vs Explicit Route Definitions
* Route::apiResource() vs Route::resource() for APIs
* Nested Resources with Shallow Nesting vs Full Nesting
* Resource only()/except() vs Full 7-Route Resource

---

# Architecture-Level Decision Trees

---

## Decision 1: Route::resource() vs Explicit Route Definitions

---

## Decision Context

Whether to use `Route::resource()` for automatic route generation or define each route explicitly.

---

## Decision Criteria

* Whether the resource follows the standard 7 RESTful actions
* Whether the controller uses the standard method names
* Whether the team benefits from enforced RESTful conventions

---

## Decision Tree

Does the resource follow the standard 7 actions (index, create, store, show, edit, update, destroy)?
↓
YES → Are all 7 actions implemented in the controller?
    ↓
    YES → `Route::resource()` — single declaration generates all routes; enforces conventions
    NO → `Route::resource()` with `->only()` or `->except()` — limit to implemented actions
NO → Does the resource have mostly standard actions with some custom ones?
    ↓
    YES → `Route::resource()` with `->only()` + external custom routes — combine resource with explicit custom actions
    NO → Is the controller method naming incompatible with resource conventions?
        ↓
        YES → Explicit route definitions — resource conventions don't match; use individual routes
        NO → `Route::resource()` — even partial matches benefit from convention enforcement

---

## Rationale

`Route::resource()` generates 5-7 routes from a single declaration, enforcing RESTful conventions (URI patterns, route names, controller method names). This reduces boilerplate, ensures consistency, and documents the resource's supported operations. Explicit routes provide full control but require maintaining each definition individually.

---

## Recommended Default

**Default:** `Route::resource()` for standard CRUD resources. Explicit routes for non-standard operations. Combine both for resources that are mostly standard with a few custom actions.
**Reason:** Resource routing is the standard pattern for CRUD. It reduces boilerplate and enforces team conventions.

---

## Risks Of Wrong Choice

* Explicit routes for standard CRUD: 7 route definitions per resource; boilerplate; inconsistent naming across resources
* `Route::resource()` for non-standard controller: Route to non-existent method throws exception at runtime
* `Route::resource()` with all 7 actions but only 3 implemented: 4 routes return 500 errors
* Resource without `->only()`: All 7 actions are routable, including create/edit for JSON APIs that should not have form routes

---

## Related Rules

* Use apiResource for APIs
* Use only/explicitly

---

## Related Skills

* Define Resource Routes with Route::resource()
* Use apiResource for API-Only Endpoints

---

---

## Decision 2: Route::apiResource() vs Route::resource() for APIs

---

## Decision Context

Whether to use `Route::apiResource()` (5 routes, no create/edit) or `Route::resource()` (7 routes, includes create/edit) for API endpoints.

---

## Decision Criteria

* Whether the API returns JSON responses
* Whether create/edit form routes are needed
* Whether the application serves both web and API

---

## Decision Tree

Is the resource exclusively a JSON API endpoint?
↓
YES → `Route::apiResource()` — create and edit routes are for HTML forms; APIs don't need them
NO → Does the resource serve both web (HTML forms) and API (JSON) consumers?
    ↓
    YES → Two separate resources — `Route::resource()` for web, `Route::apiResource()` for API
    NO → Does the resource only serve HTML views?
        ↓
        YES → `Route::resource()` — create and edit routes are needed for form rendering
        NO → `Route::apiResource()` — JSON APIs should never include create/edit routes
NO → Is the application an API-only backend?
    ↓
    YES → `Route::apiResource()` — always; create/edit are HTML-only concerns
    NO → `Route::apiResource()` — default to apiResource; add explicit routes for any HTML-only endpoints

---

## Rationale

`Route::apiResource()` generates only 5 routes (index, store, show, update, destroy), omitting create and edit which return HTML forms. For JSON APIs, create and edit routes are unnecessary — they return 404 or unusable HTML. Using `apiResource` documents that the endpoint is API-only and avoids generating useless routes.

---

## Recommended Default

**Default:** `Route::apiResource()` for all JSON API resources. `Route::resource()` only for resources that serve HTML forms (traditional server-rendered applications).
**Reason:** API endpoints don't need create/edit HTML form routes. `apiResource` eliminates unnecessary route bloat and documents API intent.

---

## Risks Of Wrong Choice

* `Route::resource()` for APIs: Creates useless create/edit routes; API consumers get 404 or irrelevant HTML forms
* `Route::apiResource()` for HTML: Missing create/edit routes; users can't access resource creation forms
* Mixed resources inconsistently: Some resources have create/edit, others don't — confusing API surface
* `Route::apiResource()` but controller has create/edit methods: Methods are never called; dead code

---

## Related Rules

* Use apiResource for APIs
* Use only/explicitly

---

## Related Skills

* Define Resource Routes with Route::resource()
* Use apiResource for API-Only Endpoints

---

---

## Decision 3: Nested Resources with Shallow Nesting vs Full Nesting

---

## Decision Context

Whether to use shallow nesting (`->shallow()`) or full nesting for related resources.

---

## Decision Criteria

* Whether parent ID is needed for child resource operations
* Whether the route structure is 2 levels or 3+ levels deep
* Whether API consumers benefit from shallower URIs

---

## Decision Tree

Are resources nested 3+ levels (posts/{post}/comments/{comment}/replies/{reply})?
↓
YES → Shallow nesting — routes that don't need parent IDs omit them; 2 levels max in URI
NO → Are resources nested 2 levels (posts/{post}/comments/{comment})?
    ↓
    YES → Does the child show/update/destroy route need the parent ID?
        ↓
        YES → Full nesting — parent ID is required for scoping or authorization
        NO → Shallow nesting — child can be identified by its own ID alone; parent ID is redundant
    NO → Is the child resource globally unique (UUID-based)?
        ↓
        YES → Shallow nesting — child can be resolved without parent context
        NO → Full nesting — parent context is needed for unique child identification

---

## Rationale

Shallow nesting generates routes where `show`, `update`, and `destroy` don't include the parent ID. `index`, `create`, and `store` still include the parent. This keeps URIs shorter when the parent context is unnecessary for individual child operations. Deep nesting (3+ levels) should always use shallow nesting.

---

## Recommended Default

**Default:** Shallow nesting for all nested resources by default. Full nesting only when the parent ID is needed for child identification or authorization.
**Reason:** Shallow nesting produces cleaner URIs and reduces redundant information. The parent ID is only needed for creation and listing operations.

---

## Risks Of Wrong Choice

* Full nesting at 3+ levels: URIs like `posts/1/comments/2/replies/3` — unwieldy and hard to parse
* Shallow nesting without unique child IDs: Child can't be uniquely resolved by its own ID; wrong resource returned
* Shallow nesting on polymorphic children: Parent context is needed to determine the child's type
* Inconsistent nesting: Some nested resources use shallow, others use full — API consumers must check each endpoint

---

## Related Rules

* Use apiResource for APIs
* Add Custom Actions Outside the Resource Definition

---

## Related Skills

* Define Resource Routes with Route::resource()
* Use Shallow Nesting for Deeply Nested Resources

---

---

## Decision 4: Resource only()/except() vs Full 7-Route Resource

---

## Decision Context

Whether to use `->only()` to limit resource routes or register all 7 routes.

---

## Decision Criteria

* Whether all 7 actions are implemented in the controller
* Whether unused actions should be inaccessible
* Whether the resource's available operations should be documented in routes

---

## Decision Tree

Are all 7 resource actions implemented in the controller?
↓
YES → Full resource — all actions are valid; registration matches implementation
NO → Are only some actions implemented (read-only resource)?
    ↓
    YES → `->only(['index', 'show'])` — limit to implemented read actions
    NO → Are most actions implemented except 1-2?
        ↓
        YES → `->except(['create', 'edit'])` or `->except(['destroy'])` — exclude unimplemented actions
        NO → `->only()` with explicit list — document exactly which operations are supported
NO → Is the resource API-only (no create/edit)?
    ↓
    YES → `Route::apiResource()` + `->only()` — combine apiResource with action limiting
    NO → `->only()` — explicitly declare supported operations

---

## Rationale

`->only()` and `->except()` limit the generated routes to only those actions that are implemented. This prevents routes from being registered that would return 500 errors (because the controller method doesn't exist). It also serves as documentation — the route definition tells developers which operations the resource supports.

---

## Recommended Default

**Default:** Use `->only()` to explicitly list implemented actions. This documents the resource contract and prevents accidental access to unimplemented actions.
**Reason:** Unused actions registered as routes are an attack surface and confusion point. Explicit route limits document the resource contract.

---

## Risks Of Wrong Choice

* Full resource with 3 implemented methods: 4 routes are registered but return 500; attack surface for unimplemented actions
* `->only()` not used: All 7 actions accessible even if not implemented; poor developer experience on missing actions
* Inconsistent `->only()` across resources: Some resources have 3 actions, others have 7 — no clear convention
* `->except()` hides disabled actions: Better to use `->only()` to positively assert what's available

---

## Related Rules

* Use apiResource for APIs
* Add Custom Actions Outside the Resource Definition

---

## Related Skills

* Define Resource Routes with Route::resource()
* Limit Resource Actions Using only() and except()
