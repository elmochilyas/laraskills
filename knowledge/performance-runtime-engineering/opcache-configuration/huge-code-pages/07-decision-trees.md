# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Huge Code Pages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Huge code pages for OpCache | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Enable Huge Code Pages

---

## Decision Context

Huge pages (2MB instead of 4KB) reduce TLB misses for OpCache shared memory. Requires OS configuration (hugetlbfs). Benefit depends on app size.

---

## Decision Criteria

* **performance** — reduces TLB misses for large OpCache pools
* **architectural** — requires OS-level configuration
* **operations** — adds deployment complexity

---

## Decision Tree

Is the OpCache memory pool large (>256MB)?
↓
**YES** — Huge pages provide measurable TLB miss reduction.
**NO** — Small OpCache fits in regular pages. Minimal benefit.

---

Is hugetlbfs configured on the OS?
↓
**YES** — Enable opcache.huge_code_pages.
**NO** — Must configure OS first: reserve huge pages, mount hugetlbfs.

---

Is the application memory-intensive (high OpCache usage)?
↓
**YES** — Huge pages provide benefit.
**NO** — Not worth the configuration complexity.

---

Is this a containerized environment?
↓
**YES** — Container needs host-level huge page support and privileges.
**NO** — Direct OS config.

---

## Recommended Default

**Default:** Enable if OpCache memory > 256MB and OS supports hugetlbfs. Skip otherwise.
**Reason:** Meaningful TLB reduction at scale; not worth config overhead for small apps.

---

## Risks Of Wrong Choice

* Enabling without OS support: warning logged, no impact
* OS config without huge page reservation: OOM from overcommit

---

## Related Skills

* Huge Code Pages
