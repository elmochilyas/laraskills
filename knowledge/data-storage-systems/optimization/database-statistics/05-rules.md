# 4-29 Database Statistics - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | optimization |
| Knowledge Unit ID | 4-29 | |
| Knowledge Unit | 4-29 Database Statistics |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always EXPLAIN Before Optimizing
---
## Category
Performance
---
## Rule
Always run EXPLAIN ANALYZE before attempting query optimization.
---
## Reason
Guessing without the query plan leads to wrong optimizations.
---
## Bad Example
Adding an index without checking the plan.
---
## Good Example
EXPLAIN ANALYZE SELECT ... then optimize
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Wasted effort.

---

## 2. Avoid LIKE With Leading Wildcard
---
## Category
Performance
---
## Rule
Never use LIKE with a leading wildcard for search.
---
## Reason
Leading wildcard prevents B-Tree index usage, forcing full table scan.
---
## Bad Example
WHERE title LIKE percent search percent
---
## Good Example
Use full-text search indexes instead.
---
## Exceptions
Prefix matches LIKE prefix percent
---
## Consequences Of Violation
Full table scan.

---

## 3. Use Cursor Pagination For Large Datasets
---
## Category
Performance
---
## Rule
Never use offset-based pagination for deep pages.
---
## Reason
OFFSET cost grows linearly with page number.
---
## Bad Example
paginate 20 on page 1000 -- slow
---
## Good Example
cursorPaginate 20 -- O1 per page
---
## Exceptions
Small datasets under 1000 rows.
---
## Consequences Of Violation
Slow deep-page pagination.

---

## 4. Review And Apply Core Concepts
---
## Category
Design
---
## Rule
Always understand and apply the core concepts documented in this knowledge unit before making implementation decisions.
---
## Reason
Core concepts define the foundational principles that correct implementation depends on.
---
## Bad Example
Implementing without understanding core concepts.
---
## Good Example
Reviewing core concepts before implementation.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Implementation errors, unexpected behavior.

---

## 5. Consider Architecture Guidelines
---
## Category
Architecture
---
## Rule
Always review the architecture guidelines section when designing systems that involve this knowledge area.
---
## Reason
Architecture guidelines provide decision frameworks for selecting between approaches.
---
## Bad Example
Choosing an approach without comparing alternatives.
---
## Good Example
Using the architecture decision table to make informed choices.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Suboptimal architectural decisions.

---

