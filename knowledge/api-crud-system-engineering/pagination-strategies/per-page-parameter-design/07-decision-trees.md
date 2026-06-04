# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Per-Page Parameter Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Default and Maximum Values Decision

---

## Decision Context

Choosing appropriate default `per_page` and maximum `per_page` values for a given endpoint based on client type and record size.

---

## Decision Criteria

* performance
* security
* architectural

---

## Decision Tree

What is the primary client type for this endpoint?
├── Mobile → Default: 10-15, Maximum: 50
├── Web/Desktop → Default: 15-25, Maximum: 100
├── Admin Panel → Default: 25-50, Maximum: 200
└── Batch/Export → Default: 100, Maximum: 1000 (with separate rate limits)

Is the average record size large (article body, images) or small (IDs, names)?
├── Large → Smaller defaults (10) and lower maximums (50)
└── Small → Standard defaults (15-25) and standard maximums (100)

Has a dedicated export endpoint been considered for batch operations?
├── YES → General endpoints keep standard limits
└── NO → Create a dedicated export endpoint; don't abuse per_page for batch

---

## Rationale

Different client types have different bandwidth and UI constraints. Mobile clients need smaller pages to reduce data transfer. Admin panels benefit from larger pages for efficient data scanning. Per_page should never be used as a batch processing mechanism.

---

## Recommended Default

**Default:** 15 for general APIs, 25 for admin, 10 for mobile; Maximum: 100 for general endpoints
**Reason:** Balances response size and request count; protects against resource exhaustion.

---

## Risks Of Wrong Choice

No maximum allows DoS via large page requests. Too-large defaults overwhelm mobile clients. Too-small defaults increase request count and latency. Using per_page for batch processing causes timeouts.

---

## Related Rules

* Always Enforce a Documented Maximum per_page
* Use Consistent per_page Naming Across All Endpoints
* Use Clamping Over Rejection for Out-of-Range Values

---

## Related Skills

* Implement Per-Page Parameter Design

---

## Clamping vs Rejection Decision

---

## Decision Context

Choosing between clamping out-of-range `per_page` values to the valid range versus rejecting them with validation errors.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Is there a regulatory/compliance reason to strictly reject out-of-range values?
├── YES → Reject with 422 validation error and clear message
└── NO → Does the client pagination loop break on 400/422 errors?
    ├── YES → Clamp to valid range using min(max()) — more resilient
    └── NO → Is the API internal with trusted callers?
        ├── YES → Clamping is preferred (forgiving)
        └── NO → Clamping is preferred (defensive)

---

## Rationale

Rejecting out-of-range values forces clients to handle 400 errors during pagination, which may break pagination loops. Clamping gracefully adjusts to the nearest valid value, keeping pagination working. Rejection is only required when compliance mandates strict parameter validation.

---

## Recommended Default

**Default:** Clamp using `min(max((int) $request->input('per_page', 15), 1), 100)`
**Reason:** More resilient; keeps pagination working even when clients send slightly out-of-range values.

---

## Risks Of Wrong Choice

Rejection breaks client pagination loops on out-of-range values. No clamping allows values that exceed database or memory limits.

---

## Related Rules

* Use Clamping Over Rejection for Out-of-Range Values

---

## Related Skills

* Implement Per-Page Parameter Design
