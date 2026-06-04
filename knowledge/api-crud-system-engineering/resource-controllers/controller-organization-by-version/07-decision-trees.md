# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Organization by Version
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Versioning Strategy Selection

---

## Decision Context

Choosing between versioned controller directories (`V1/`, `V2/`) and alternative versioning approaches for API evolution.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Does the API have external clients that cannot be updated simultaneously?
├── YES → Are breaking changes expected or planned?
│   ├── YES → Use URL prefix versioning with versioned controller directories
│   └── NO → Backward-compatible additions may not need versioning
└── NO → Is the API internal-only with controlled clients?
    ├── YES → Versioning may be unnecessary; use additive changes only
    └── NO → Plan for versioning at first breaking change

Should V2 duplicate V1 controllers or inherit from them?
├── Major changes across multiple methods → Duplicate fully (prevent V1 regressions)
├── Minor change in one method → Extend V1 and override the single method
└── Unsure → Duplicate fully; deduplicate later if inheritance is safe

---

## Rationale

URL prefix versioning (`/v1/`, `/v2/`) is explicit, cacheable, testable, and debuggable. Versioned controller directories provide structural isolation. Full duplication prevents accidental V1 regressions from shared inheritance.

---

## Recommended Default

**Default:** URL prefix versioning with fully duplicated versioned controller directories
**Reason:** Maximum isolation prevents V1 regressions when V2 changes.

---

## Risks Of Wrong Choice

Sharing service instances between versions silently breaks V1 when V2 changes services. No deprecation timeline leads to indefinite maintenance of old versions. Incomplete V2 implementation returns 404s.

---

## Related Rules

* Use URL Prefix Versioning
* Duplicate Controllers By Default, Inherit For Minor Changes
* Run Versioned Test Suites Independently
* Pin V1 Controllers To V1-Specific Service Bindings

---

## Related Skills

* Implement Controller Organization by Version
