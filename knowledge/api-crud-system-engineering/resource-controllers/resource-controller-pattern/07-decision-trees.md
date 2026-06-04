# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Resource Controller Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Resource vs Manual Route Registration

---

## Decision Context

Choosing between `Route::resource()` for convention-driven CRUD routing versus manual route registration for individual endpoints.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Does the endpoint set map cleanly to standard CRUD operations (list/create/read/update/delete)?
├── YES → Use `Route::resource()` or `Route::apiResource()`
└── NO → Is it a single, focused action (search, restore, webhook)?
    ├── YES → Use an invokable controller with manual route
    └── NO → Is it a non-CRUD feature (auth, dashboard, file upload)?
        ├── YES → Use dedicated controller with manual routes
        └── NO → Use `Route::resource()` with `only()` for partial routes

---

## Rationale

Resource registration eliminates human error, ensures naming consistency, and provides a self-documenting route list. Manual routes are prone to typos, naming drift, and missed routes.

---

## Recommended Default

**Default:** `Route::apiResource()` for all JSON API endpoints
**Reason:** Consistent, self-documenting, eliminates boilerplate and human error.

---

## Risks Of Wrong Choice

Manual routes cause naming drift across endpoints. Resource controller with extra non-CRUD methods breaks SRP and confuses the route contract.

---

## Related Rules

* Always Use Route::resource() Over Manual Routes
* Keep Resource Methods In Standard Order
* Never Add Non-Resource Methods To Resource Controllers
* Use Route Model Binding In Method Signatures

---

## Related Skills

* Apply the Resource Controller Pattern for Standard CRUD Actions

---

## Web vs API Resource Controllers

---

## Decision Context

Choosing between `Route::resource()` (7 actions including create/edit views) and `Route::apiResource()` (5 JSON-only actions) for a given application.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the application API-only with no server-rendered HTML?
├── YES → Use `Route::apiResource()` — 5 actions, no view routes
└── NO → Is it a hybrid app serving both JSON and HTML?
    ├── YES → Use `Route::resource()` for web routes, `Route::apiResource()` for API routes
    └── NO → Is it a first-party SPA backend?
        ├── YES → Use `Route::apiResource()` (SPAs consume JSON)
        └── NO → Use `Route::resource()` (likely a web app)

---

## Rationale

API resource controllers drop the two view-related methods (`create` and `edit`) that are unnecessary in JSON-only endpoints, reducing route table bloat and preventing accidental HTML returns to API clients.

---

## Recommended Default

**Default:** `Route::apiResource()` for `routes/api.php`; `Route::resource()` for `routes/web.php`
**Reason:** Prevents registering unused view routes in API-only contexts.

---

## Risks Of Wrong Choice

`Route::resource()` in API routes registers dead routes that return HTML to JSON clients. Missing `create`/`edit` in web routes breaks server-rendered forms.

---

## Related Rules

* Always Use Route::apiResource() In api.php
* Never Return Views From API Controllers

---

## Related Skills

* Design API Resource Controllers
