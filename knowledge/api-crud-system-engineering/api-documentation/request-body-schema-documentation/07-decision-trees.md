# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Request Body Schema Documentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Schema structure (flat vs nested)
* Schema source (auto-generated from Form Requests vs manually curated)

---

# Architecture-Level Decision Trees

---

## Schema Structure — Flat vs Nested

---

## Decision Context

Should request body schemas be flat or nested? Arises when designing request payload documentation.

---

## Decision Criteria

* consumer understanding — nested structures are harder to document
* validation mapping — nested structures match domain relationships
* spec complexity — deeply nested schemas increase spec size
* API design — flat vs nested reflects the actual API contract

---

## Decision Tree

Does the business domain have clear entity relationships (address within user)?
↓
YES → Nested object schemas (match domain model, more maintainable)
NO → Simple CRUD with no sub-objects → Flat body schemas

---

## Recommended Default

**Default:** Nested object schemas that mirror the domain model
**Reason:** Accurate representation of data relationships, matches validation structure.

---

## Risks Of Wrong Choice

Flat schemas for complex domains: consumer must flatten their data model. Nested schemas for simple endpoints: unnecessary complexity.

---

## Schema Source — Auto-Generated vs Manually Curated

---

## Decision Tree

Are Form Request classes used for validation?
↓
YES → Auto-generate from Form Requests (Scramble/Scribe inference), manually augment with error examples
NO → Manually write OpenAPI schemas in components

---

## Recommended Default

**Default:** Auto-generated from Form Requests with manual error augmentation
**Reason:** Eliminates drift between validation rules and documentation while ensuring error scenarios are covered.

---

## Risks Of Wrong Choice

Manual schemas: drift from actual validation rules. Auto-only: missing error documentation.

---

*Related rules and skills are not available for this KU.*
