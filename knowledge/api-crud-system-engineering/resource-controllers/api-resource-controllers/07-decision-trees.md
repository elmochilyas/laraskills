# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** API Resource Controllers
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## API Controller Response Selection

---

## Decision Context

Choosing the correct HTTP response and status code for each of the five API resource controller actions.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

What action is being performed?
├── index → Return `Resource::collection($paginator)` with 200
├── store → Return `new Resource($model)->response(201)` with 201
├── show → Return `new Resource($model)` with 200
├── update → Return `new Resource($model->fresh())` with 200
└── destroy → Return `response()->noContent()` with 204

---

## Rationale

Standardized status codes make API behavior predictable. Clients can programmatically determine action outcome from the status code alone. API resources ensure consistent JSON structure and controlled attribute exposure.

---

## Recommended Default

**Default:** Follow the status code table: index=200, store=201, show=200, update=200, destroy=204
**Reason:** REST conventions that every API client understands.

---

## Risks Of Wrong Choice

Returning 200 for store prevents clients from distinguishing creation from retrieval. Returning null body for destroy (not 204) is ambiguous. Returning raw models leaks sensitive attributes.

---

## Related Rules

* Always Return 204 From Destroy
* Return 201 With Resource On Store
* Never Return Views From API Controllers
* Never Return Raw Models

---

## Related Skills

* Design API Resource Controllers
* Select Appropriate Response Type in Controllers
