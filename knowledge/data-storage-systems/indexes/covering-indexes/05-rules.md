# 3-10 Covering Indexes - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | indexes |
| Knowledge Unit ID | 3-10 | |
| Knowledge Unit | 3-10 Covering Indexes |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Avoid Over-Indexing Write-Heavy Tables
---
## Category
Performance
---
## Rule
Never add more than 5-6 indexes on high-write tables without measuring the INSERT/UPDATE overhead.
---
## Reason
Each index amplifies write I/O. A table with 6 indexes writes 7x data per insert (1 table + 6 indexes).
---
## Bad Example
Adding 12 indexes on a table receiving 10K inserts/second.
---
## Good Example
Selectively adding 3-4 covering indexes that serve the top query patterns.
---
## Exceptions
Reporting/read-only tables with no write load.
---
## Consequences Of Violation
Write throughput collapse, replication lag.

---

## 2. Always Index Foreign Key Columns
---
## Category
Performance
---
## Rule
Always create an index on every foreign key column.
---
## Reason
Unindexed FK columns cause full table scans on JOIN queries and cascade operations.
---
## Bad Example
$table->unsignedBigInteger('user_id'); // no index
---
## Good Example
$table->foreignId('user_id')->constrained(); // auto-indexed
---
## Exceptions
Very small lookup tables (<100 rows).
---
## Consequences Of Violation
Full table scan joins, slow cascade deletes.

---

## 3. Write Sargable WHERE Conditions
---
## Category
Performance
---
## Rule
Never wrap indexed columns in functions inside WHERE clauses.
---
## Reason
WHERE FUNCTION(col) = value prevents index usage. Rewrite as col = value transformation.
---
## Bad Example
WHERE DATE(created_at) = '2024-01-01'
---
## Good Example
WHERE created_at >= '2024-01-01' AND created_at < '2024-01-02'
---
## Exceptions
PostgreSQL expression indexes.
---
## Consequences Of Violation
Full table scan despite indexed column.

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

