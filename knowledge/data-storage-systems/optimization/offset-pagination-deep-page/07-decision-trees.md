# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-16 Offset Pagination Deep Page
**Generated:** 2026-06-03

---

# Decision Inventory

* Offset pagination vs alternatives for deep pages
* Mitigation strategies when offset is required
* Performance degradation at scale

---

# Architecture-Level Decision Trees

---

## Deep Page Mitigation

---

## Decision Context

Handling deep offset pagination where performance degrades as page number increases.

---

## Decision Criteria

* performance: OFFSET 100000 reads 100k rows and discards 99980
* architectural: cursor pagination avoids the problem entirely
* maintainability: deep page limits constrain API surface
* security: deep page enumeration can be abused

---

## Decision Tree

Using offset pagination on a large dataset?
↓
Is the dataset > 100K rows or page number > 100?
YES → Deep page problem
    ↓
    Can you switch to cursor pagination?
    YES → Use cursorPaginate() — O(1) per page
    NO → Mitigations:
        → Cap max page: return empty beyond page 100
        → Require date filters to narrow the range
        → Use seek method: WHERE id > (SELECT id FROM ... OFFSET 100000 LIMIT 1)
NO → Offset is acceptable for shallow pages
    → Cost is proportional to offset size

---

## Recommended Default

**Default:** Switch to cursor pagination for any dataset with > 100 pages
**Reason:** Offset pagination reads and discards all rows before the OFFSET, making deep pages extremely expensive.
