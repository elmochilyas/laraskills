# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Name Generation
**Generated:** 2026-06-03

---

# Decision Inventory

* Named Routes vs action() Helper for URL Generation
* Dot Notation Names vs Flat Names
* Name Prefixes in Groups vs Individual ->name() Calls
* route() Helper vs Hardcoded URLs

---

# Architecture-Level Decision Trees

---

## Decision 1: Named Routes vs action() Helper for URL Generation

---

## Decision Context

Whether to generate URLs via route names (`route('users.show', $user)`) or controller action strings (`action([UserController::class, 'show'], $user)`).

---

## Decision Criteria

* Whether the route has a defined name
* Whether the controller class may change
* Whether the URL generation is in a view or controller

---

## Decision Tree

Does the route have a defined `->name()`?
↓
YES → Use `route('name')` — O(1) named route lookup; decoupled from controller class
NO → Can a name be added to the route definition?
    ↓
    YES → Add `->name()` and use `route()` — names are always preferred
    NO → Is the controller class stable (won't be moved/renamed)?
        ↓
        YES → `action()` is acceptable — but adding a name is still better
        NO → Hardcoded URL — `action()` breaks if controller namespace changes; hardcoded also breaks; prefer named
NO → Is URL generation in Blade views?
    ↓
    YES → `route()` — cleaner syntax in templates; `action()` requires full class reference
    NO → `route()` — cleaner in controllers, tests, and emails

---

## Rationale

`route('name')` uses the route collection's `$nameList` hash table (O(1) lookup) and is decoupled from controller class names. `action([Controller::class, 'method'])` must resolve the controller string, check method existence, and then match against the route collection (O(n) worse case). Named routes also survive refactoring — moving a controller doesn't break URL generation.

---

## Recommended Default

**Default:** `route('name')` for ALL URL generation where the route is named. `action()` is the fallback for unnamed routes.
**Reason:** Named routes are O(1), decoupled from controllers, and survive refactoring. `action()` is slower and coupled to class names.

---

## Risks Of Wrong Choice

* `action()` for named route: Slower lookup; breaks when controller class or namespace changes
* `route()` without defined name: `InvalidArgumentException` at call time — no name registered
* `action()` with non-existent method: `LogicException` — method not found on controller
* Mixing both approaches: Inconsistent URL generation; some references break during refactoring

---

## Related Rules

* Enforce ->name() on Every Route Definition
* Enforce Dot Notation Naming Convention
* Ban Hardcoded URLs in Views and Controllers

---

## Related Skills

* Assign Route Names via ->name() on Every Route
* Use route() Helper for All URL Generation

---

---

## Decision 2: Dot Notation Names vs Flat Names

---

## Decision Context

Whether to use hierarchical dot notation (`admin.users.index`) or flat names (`admin-users-index`) for route naming.

---

## Decision Criteria

* Whether the application has hierarchical route grouping
* Whether route names need to be predictable from the URL
* Whether the team follows Laravel conventions

---

## Decision Tree

Does the application have hierarchical route groups (prefix groups, subdomains)?
↓
YES → Dot notation — mirrors the group hierarchy; names are predictable from URLs
NO → Does the URL structure follow a resourceful pattern?
    ↓
    YES → Dot notation — `resource.action` (e.g., `users.show`, `posts.comments.index`)
    NO → Are route names expected to follow Laravel conventions?
        ↓
        YES → Dot notation — Laravel resource routes auto-generate dot notation names
        NO → Flat names — acceptable for non-hierarchical, non-resource routes
NO → Will route names be used with name prefixes in groups?
    ↓
    YES → Dot notation — `Route::name('admin.')` prepends `admin.` to `users.index` → `admin.users.index`
    NO → Dot notation is still preferred — it's the Laravel convention

---

## Rationale

Dot notation mirrors the route hierarchy: URL `/admin/users` → route name `admin.users.index`. Developers can guess route names from URLs without checking route files. Flat names (`admin-users-index`) don't convey the hierarchy and are harder to guess. Laravel's resource routing auto-generates dot notation names, so consistency requires dot notation everywhere.

---

## Recommended Default

**Default:** Dot notation (`resource.action`) for ALL route names.
**Reason:** Predictable naming, hierarchy mirroring, Laravel convention. Developers can infer route names from URLs.

---

## Risks Of Wrong Choice

* Flat names for resources: `users-index` vs Laravel auto-generated `users.index` — inconsistency and confusion
* Dot notation without hierarchy: `show.user` instead of `users.show` — unconventional order; hard to predict
* Flat names in groups: Name prefix `admin` + flat name `users-index` → `adminusers-index` — unreadable
* Dot notation with wrong hierarchy: `index.users.admin` — reverse hierarchy; confusing

---

## Related Rules

* Enforce ->name() on Every Route Definition
* Enforce Dot Notation Naming Convention
* Ban Hardcoded URLs in Views and Controllers

---

## Related Skills

* Assign Route Names via ->name() on Every Route
* Use route() Helper for All URL Generation

---

---

## Decision 3: Name Prefixes in Groups vs Individual ->name() Calls

---

## Decision Context

Whether to use `Route::name('prefix.')` on groups or call `->name()` individually on each route.

---

## Decision Criteria

* Whether all routes in the group share a common prefix
* Whether some routes need custom names that don't follow the prefix
* Whether the group is large (10+ routes)

---

## Decision Tree

Do ALL routes in the group share a common prefix segment?
↓
YES → Use `Route::name('prefix.')` — reduces repetition; ensures consistency
NO → Do MOST routes share a prefix but some are exceptions?
    ↓
    YES → Use group name prefix + individual `->name()` overrides for exceptions
    NO → Individual `->name()` calls — no common prefix; group adds no value
NO → Is this a resource route?
    ↓
    YES → Resource routes auto-generate names (`resource.index`, `resource.show`) — no manual naming needed
    NO → Is the group large (>10 routes)?
        ↓
        YES → Group name prefix — significant repetition reduction
        NO → Either approach is fine; group prefix is cleaner

---

## Rationale

`Route::name('admin.')` prepends `admin.` to every route name in the group. This ensures consistency and reduces repetition. Without it, every route would need `->name('admin.users.index')`, `->name('admin.posts.index')`, etc. Group name prefixes also make it clear which routes belong to which group when reading the route file.

---

## Recommended Default

**Default:** Use `Route::name('prefix.')` on every group where all routes share a common segment. Use individual `->name()` overrides for exceptions.
**Reason:** Group prefixes reduce repetition, ensure consistency, and make group membership obvious.

---

## Risks Of Wrong Choice

* No group prefix on 10+ routes: Each route repeats the prefix; easy to typo one
* Group prefix with incompatible individual names: Some routes in the group get the prefix when they shouldn't — use nested groups
* Trailing dot omitted: `Route::name('admin')` → `adminusers.index` instead of `admin.users.index`
* Group prefix on resource: `Route::name('admin.')->group(fn() => Route::resource('users', ...))` → `admin.users.index` (correct)

---

## Related Rules

* Enforce ->name() on Every Route Definition
* Enforce Dot Notation Naming Convention
* Ban Hardcoded URLs in Views and Controllers

---

## Related Skills

* Assign Route Names via ->name() on Every Route
* Use route() Helper for All URL Generation

---

---

## Decision 4: route() Helper vs Hardcoded URLs

---

## Decision Context

Whether to use `route('name')` in views, controllers, and tests, or hardcode URL strings like `/users/5`.

---

## Decision Criteria

* Whether the URL may change in the future
* Whether the reference needs to be testable
* Whether the reference is in a view or email template

---

## Decision Tree

Does the URL reference need to survive route URI changes?
↓
YES → ALWAYS use `route()` — changing the URI in the route definition automatically updates all references
NO → Is the URL reference in a view, email, or controller?
    ↓
    YES → `route()` — hardcoded URLs in views break silently when routes change
    NO → Shell scripts, documentation, external config?
        ↓
        YES → Hardcoded URL — `route()` only works in Laravel application context
        NO → `route()` — always preferred in application code
NO → Does the URL reference need to be testable?
    ↓
    YES → `route()` — `assertRedirect(route('users.index'))` continues to pass after URI change
    NO → `route()` is still preferred — consistency and decoupling
NO → Is the URL reference in a migration or seeder?
    ↓
    YES → Hardcoded URL — routes may not be loaded during migrations
    NO → `route()` — ALWAYS use `route()` in application code

---

## Rationale

Hardcoded URLs are coupled to the URI pattern defined in the route file. Changing `/users/{user}` to `/members/{member}` breaks every hardcoded reference. `route('users.show', $user)` continues to work because the name is the stable identifier. Hardcoded URLs also cannot be tested — `assertRedirect('/users/5')` fails if the URI changes, even though the redirect is correct.

---

## Recommended Default

**Default:** ALWAYS use `route()` in application code. Hardcode URLs only outside the Laravel application context.
**Reason:** Named routes decouple URL references from URI patterns. Hardcoded URLs break silently and are not testable.

---

## Risks Of Wrong Choice

* Hardcoded URLs in views: Design changes (`/posts` → `/articles`) require updating every Blade template
* Hardcoded URLs in controllers: Redirect URLs break silently; no compilation error
* Hardcoded URLs in tests: 'assertRedirect('/users/5')` fails after URI change — false test failure
* `route()` in migrations: `RuntimeException` if routes not loaded — use URL facade or hardcoded for migrated URLs

---

## Related Rules

* Enforce ->name() on Every Route Definition
* Enforce Dot Notation Naming Convention
* Ban Hardcoded URLs in Views and Controllers

---

## Related Skills

* Assign Route Names via ->name() on Every Route
* Use route() Helper for All URL Generation
