# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Response Selection
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Status Code Selection Per Action

---

## Decision Context

Choosing the correct HTTP status code for each resource controller action based on REST conventions.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

What is the action type?
├── Read (index/show) → Return 200 with resource data
├── Create (store) → Is the operation synchronous or async?
│   ├── Synchronous → Return 201 with created resource
│   └── Async (queued) → Return 202 Accepted
├── Update (update) → Return 200 with fresh resource data
├── Delete (destroy) → Return 204 No Content
└── Custom action → What is the semantic result?
    ├── New resource created → 201
    ├── Resource modified → 200 or 204
    ├── Resource deleted → 204
    └── Validation error → 422

---

## Rationale

Standardized status codes make API behavior predictable. Clients can programmatically determine action outcome from the status code alone without parsing the response body.

---

## Recommended Default

**Default:** index=200, store=201, show=200, update=200, destroy=204
**Reason:** REST conventions that every API client understands.

---

## Risks Of Wrong Choice

200 for DELETE is ambiguous (deleted vs not found). 200 for store prevents distinguishing creation from retrieval. 200 with error body confuses clients who expect 200 to mean success.

---

## Related Rules

* Always Use Standardized Status Codes Per Action
* Always Use response()->noContent() For Delete
* Return Fresh Data After Update
* Never Return Raw Models

---

## Related Skills

* Select Appropriate Response Type in Controllers
