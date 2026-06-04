# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Response Schema Documentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Response structure (wrapped vs unwrapped)
* Response schema source (auto-generated vs manually defined)

---

# Architecture-Level Decision Trees

---

## Response Structure — Wrapped vs Unwrapped

---

## Decision Context

Should responses wrap data in an envelope (`{ data: {...} }`) or return bare resources? Arises when documenting response schemas.

---

## Decision Criteria

* consistency — wrapped responses allow metadata alongside data
* simplicity — unwrapped is simpler for consumers
* future-proof — adding fields to wrapped responses doesn't break consumers
* pagination — paginated responses naturally need wrapping for meta

---

## Decision Tree

Are pagination or metadata fields needed in responses?
↓
YES → Wrapped response envelope (`{ data: ..., meta: { ... } }`)
NO → Single resource response?
    YES → Unwrapped (simpler) or wrapped (consistent with paginated)
    NO → Collection response → Wrapped (consistent pattern)

---

## Recommended Default

**Default:** Wrapped response envelope for collections; unwrapped or wrapped for single resources
**Reason:** Wrapped responses support metadata, pagination, and are future-proof without breaking consumers.

---

## Risks Of Wrong Choice

Unwrapped for collections: no room for pagination metadata. Wrapped for all: extra nesting for simple single-resource endpoints.

---

## Response Schema Source — Auto-Generated vs Manually Defined

---

## Decision Tree

Are Laravel API Resources used for response formatting?
↓
YES → Auto-generate response schemas from API Resources (Scramble), manually add error response schemas
NO → Manual schema definition with contract testing to verify accuracy

---

## Recommended Default

**Default:** Auto-generated from API Resources + manually defined error schemas
**Reason:** Drift-free for success responses; explicit for error responses.

---

## Risks Of Wrong Choice

Manual only: schema drifts from actual API Resource output. Auto-only: no error response documentation.

---

*Related rules and skills are not available for this KU.*
