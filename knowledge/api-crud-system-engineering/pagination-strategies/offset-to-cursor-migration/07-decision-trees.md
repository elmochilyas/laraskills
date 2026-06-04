# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Offset-to-Cursor Migration
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Migration Strategy Selection

---

## Decision Context

Choosing the migration approach from offset to cursor pagination — big bang switch, dual-controller coexistence, or versioned endpoint — based on client impact tolerance and migration timeline.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Are all API clients under your direct control (internal/first-party)?
├── YES → Can all clients be updated simultaneously?
│   ├── YES → Big bang switch (simplest, least code complexity)
│   └── NO → Dual-controller pattern with 1-3 month deprecation window
└── NO → Is there an API versioning strategy available (v1/v2)?
    ├── YES → Versioned endpoints: v1 maintains offset, v2 uses cursor
    │   └── During transition, both versions are live
    └── NO → Dual-controller pattern with 6-12 month deprecation window
        ├── Use Deprecation and Sunset HTTP headers
        └── Monitor cursor vs offset usage ratio; sunset offset at <5% usage

---

## Rationale

Client impact is the primary concern. Big bang is simplest but breaks all clients simultaneously. Dual-controller allows gradual client migration with deprecation headers. Versioned endpoints provide the cleanest separation but require maintaining two endpoint sets.

---

## Recommended Default

**Default:** Dual-controller pattern with 6-month deprecation window and Deprecation/Sunset headers
**Reason:** Balances migration reliability (clients migrate at their own pace) with code complexity (single endpoint handles both).

---

## Risks Of Wrong Choice

Big bang breaks clients that weren't updated. Silent deprecation causes clients to discover breakage at runtime. No rollback plan leaves no escape if cursor has issues.

---

## Related Rules

* Support Both Pagination Methods During a 6-12 Month Transition
* Use Deprecation and Sunset HTTP Headers
* Verify Cursor Indexes Exist Before Enabling Cursor Pagination

---

## Related Skills

* Migrate from Offset to Cursor Pagination Without Breaking Clients

---

## Rollout Strategy Decision

---

## Decision Context

Determining the rollout strategy for enabling cursor pagination — gradual percentage-based rollout, sandbox testing, or full enablement.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Have cursor indexes been verified with EXPLAIN ANALYZE?
├── YES → Is there a sandbox/staging environment with production-scale data?
│   ├── YES → Has load testing been completed with cursor pagination?
│   │   ├── YES → Gradual rollout starting at 10% of traffic
│   │   │   ├── Monitor cursor query performance and error rates
│   │   │   ├── If stable for 1 week → increase to 50%
│   │   │   └── If issues → roll back to offset, fix, restart
│   │   └── NO → Load-test before any production traffic
│   └── NO → Create sandbox with production-scale data for testing
└── NO → Create indexes and verify before enabling any traffic

---

## Rationale

Cursor pagination without matching composite indexes performs full table scans, resulting in worse performance than the offset pagination it's replacing. Gradual rollout catches issues early before affecting all clients.

---

## Recommended Default

**Default:** Feature-flag rollout: 10% → 50% → 100% over 2-3 weeks
**Reason:** Catches performance or correctness issues early; allows rollback without full incident.

---

## Risks Of Wrong Choice

Full rollout without load testing causes production degradation. No feature flag means full rollback of code changes. Insufficient testing with production-scale data misses index issues.

---

## Related Rules

* Verify Cursor Indexes Exist Before Enabling Cursor Pagination

---

## Related Skills

* Migrate from Offset to Cursor Pagination Without Breaking Clients
