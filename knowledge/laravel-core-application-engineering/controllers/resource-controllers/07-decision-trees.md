# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Resource Controllers
**Generated:** 2026-06-03

---

# Decision Inventory

* Web Resource vs API Resource Controller
* Full Resource vs Limited Resource Route Registration
* Standard CRUD vs Custom Actions Placement

---

# Architecture-Level Decision Trees

---

## Decision 1: Web Resource vs API Resource Controller

---

## Decision Context

Whether to generate a resource controller with `--resource` (7 methods) or `--api` (5 methods).

---

## Decision Criteria

* Whether the endpoint serves HTML or JSON
* Whether create/edit form routes are needed
* Whether the application has both web and API entry points

---

## Decision Tree

Does the endpoint serve HTML pages (web) or JSON (API)?
↓
HTML (Web)? → Use `php artisan make:controller NameController --resource`
    Route registration: `Route::resource('name', NameController::class)`
    Methods: index, create, store, show, edit, update, destroy
JSON (API)? → Use `php artisan make:controller Api\NameController --api`
    Route registration: `Route::apiResource('name', NameController::class)`
    Methods: index, store, show, update, destroy (no create/edit)

---

## Rationale

API endpoints do not need `create()` or `edit()` methods because JSON APIs do not serve HTML forms. Including them adds dead code and creates confusion for API consumers who see unused routes.

---

## Recommended Default

**Default:** `--api` for all API controllers (5 methods), `--resource` for web controllers (7 methods)
**Reason:** API controllers should never have create/edit (form) methods. Using `--api` eliminates dead code and keeps the controller focused on JSON responses.

---

## Risks Of Wrong Choice

* `--resource` for API: Dead create/edit methods, unused routes, confusion about why form methods exist
* `--api` for web: Missing create/edit methods — forms cannot be displayed

---

## Related Rules

* Use apiResource for API Endpoints (05-rules.md)
* Generate Resource Controllers via Artisan (05-rules.md)

---

## Related Skills

* Skill: Create a Resource Controller for CRUD Operations

---

## Decision 2: Full Resource vs Limited Resource Route Registration

---

## Decision Context

Whether to register all 7 (or 5) resource routes or limit to only the needed actions.

---

## Decision Criteria

* Whether the resource supports the full CRUD lifecycle
* Whether some actions should not be exposed
* Read-only vs full CRUD access

---

## Decision Tree

Does the resource support all CRUD operations (create, read, update, delete)?
↓
YES → Register full resource: `Route::resource('posts', PostController::class)`
NO → Is it read-only (index and show only)?
    YES → `Route::resource('posts', PostController::class)->only(['index', 'show'])`
NO → Is it write-only with no read?
    YES → Use specific route registration, not resource
NO → Are some operations admin-only?
    YES → Register full resource with middleware scoping instead of partial routes
NO → Is the resource a sub-resource (comments on posts)?
    YES → Use nested resource or shallow resource: `Route::resource('posts.comments', ...)->shallow()`

---

## Rationale

Registering only the needed routes prevents unused methods from being accidentally called. However, the full resource registration is the conventional pattern and should be preferred when the resource supports the full lifecycle.

---

## Recommended Default

**Default:** Full resource registration (`Route::resource()`) for standard CRUD; `->only()` for read-only or limited resources
**Reason:** Full registration is predictable and conventional. Only limit routes when the resource genuinely does not support certain operations.

---

## Risks Of Wrong Choice

* Full registration for read-only: Unused routes are exposed (POST, PUT, DELETE on read-only resource)
* `->only()` for full CRUD: Missing routes cause 404 errors, inconsistent resource surface

---

## Related Rules

* Use Resource Controllers for All CRUD Operations (05-rules.md)
* Avoid Resource Controllers for Non-CRUD Resources (05-rules.md)

---

## Related Skills

* Skill: Create a Resource Controller for CRUD Operations

---

## Decision 3: Standard CRUD vs Custom Actions Placement

---

## Decision Context

Whether to add a non-CRUD action (publish, archive, approve) to a resource controller or create a separate controller.

---

## Decision Criteria

* Whether the action is a standard CRUD operation or custom
* Whether the action is tightly coupled to the resource lifecycle
* Team convention
* Whether Route::resource() can register the action

---

## Decision Tree

Is the action a standard CRUD operation (index, create, store, show, edit, update, destroy)?
↓
YES → Place in resource controller — follows standard convention
NO → Is it a lifecycle action (publish, archive, approve)?
    YES → Has the team explicitly agreed to include it?
        YES → Add as named method with explicit route registration (documented exception)
        NO → Create a separate single-action controller
NO → Is it a utility action (export, import, search)?
    YES → Create a separate single-action or plain controller
NO → Is it a dashboard or reporting action?
    YES → Create a separate plain controller

---

## Rationale

Non-standard methods violate the predictable resource contract. Developers expect exactly the 7 standard actions from a resource controller. Custom methods create confusion and require manual route registration regardless of placement.

---

## Recommended Default

**Default:** Single-action controllers for all non-CRUD operations; resource controllers for the standard 7 actions only
**Reason:** Keeps resource controllers predictable and gives each non-CRUD operation its own named class. Single-action controllers are self-documenting and testable in isolation.

---

## Risks Of Wrong Choice

* Custom methods in resource controller: Violates 7-method contract, requires manual routes, confusing
* Separate controller for lifecycle action that team expects in resource: Inconsistency across codebase

---

## Related Rules

* Do Not Add Non-Resource Actions to Resource Controllers (05-rules.md)
* Use Form Requests for Store and Update Validation (05-rules.md)
* Use Route Model Binding in Show, Edit, Update, Destroy (05-rules.md)

---

## Related Skills

* Skill: Extract Non-CRUD Operations from a Resource Controller
* Skill: Create a Single-Action Controller for a Non-CRUD Operation
