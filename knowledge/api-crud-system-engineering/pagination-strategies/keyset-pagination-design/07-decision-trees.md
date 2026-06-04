# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Keyset Pagination Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Keyset vs Cursor Pagination Selection

---

## Decision Context

Choosing between transparent keyset pagination (raw sort column values as query parameters) and opaque cursor pagination (encoded tokens) for a given endpoint.

---

## Decision Criteria

* security
* architectural
* maintainability
* performance

---

## Decision Tree

Is the API public-facing with external clients?
├── YES → Use Cursor Pagination (opaque tokens for security)
└── NO → Is the API internal/admin where debugging transparency is valued?
    ├── YES → Are sort column values already visible in responses?
    │   ├── YES → Use Keyset Pagination (no additional exposure)
    │   └── NO → Do sort columns contain sensitive data?
    │       ├── YES → Use Cursor Pagination (encrypt/expose less)
    │       └── NO → Use Keyset Pagination (performance + transparency)
    └── NO → Can clients handle multiple query parameters for pagination?
        ├── YES → Use Keyset Pagination
        └── NO → Use Cursor Pagination (single cursor token)

---

## Rationale

Keyset pagination offers identical O(1) performance to cursor pagination but with transparent, debuggable parameters. It is ideal for internal APIs where security concerns are lower and debugging visibility is valued. Cursor pagination's opaque tokens are better for public APIs.

---

## Recommended Default

**Default:** Keyset Pagination for internal APIs; Cursor Pagination for public APIs
**Reason:** Internal APIs benefit from transparency and debuggability; public APIs need opacity for security.

---

## Risks Of Wrong Choice

Keyset on public APIs exposes sort column values, potentially leaking business intelligence. Cursor on internal APIs adds unnecessary encoding overhead and reduces debugging transparency.

---

## Related Rules

* Always Include a Tiebreaker Column in Keyset Queries
* Use Parameterized Queries, Never Raw Interpolation
* Use Consistent after_ / before_ Parameter Naming

---

## Related Skills

* Apply Keyset Pagination for Sequential Data Without Offset Overhead

---

## Parameter Design Decision

---

## Decision Context

Designing the keyset parameter naming convention and direction control for transparent pagination.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the endpoint support both forward and backward pagination?
├── YES → Do forward and backward parameters risk being sent simultaneously?
│   ├── YES → Require explicit `direction=next` or `direction=prev` parameter
│   └── NO → Use `after_` for forward, `before_` for backward
└── NO → Is the endpoint forward-only (most common)?
    ├── YES → Use `after_` prefix consistently
    └── NO → Is the endpoint backward-only?
        ├── YES → Use `before_` prefix consistently
        └── NO → Use `after_` as default, document as forward-only

---

## Rationale

Consistent `after_`/`before_` parameter naming across all endpoints reduces client confusion. A `direction` parameter prevents clients from sending conflicting `after_` and `before_` parameters simultaneously, which would produce contradictory WHERE clauses.

---

## Recommended Default

**Default:** `after_` prefix for forward pagination; `direction=next`/`direction=prev` for direction control
**Reason:** Self-documenting parameter names; explicit direction prevents contradictory pagination parameters.

---

## Risks Of Wrong Choice

Inconsistent naming across endpoints forces clients to learn different patterns per endpoint. Missing direction guard allows contradictory parameters that produce incorrect or empty results.

---

## Related Rules

* Use Consistent after_ / before_ Parameter Naming

---

## Related Skills

* Apply Keyset Pagination for Sequential Data Without Offset Overhead
