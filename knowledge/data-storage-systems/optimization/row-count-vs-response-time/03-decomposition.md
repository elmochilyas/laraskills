# Decomposition: 4.26 Correlation between row count and query response time

## Topic Overview
Query response time does not scale linearly with row count. The relationship is governed by index access patterns, buffer pool hit rates, network latency, and the database's ability to short-circuit. Understanding when response time degrades from O(log N) to O(N) — and why — is the foundation of query performance prediction.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-26-row-count-vs-response-time/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.26 Correlation between row count and query response time
- **Purpose:** Query response time does not scale linearly with row count. The relationship is governed by index access patterns, buffer pool hit rates, network latency, and the database's ability to short-circuit.
- **Difficulty:** Intermediate
- **Dependencies:** 4.1 EXPLAIN output interpretation, 4.16 Offset pagination deep-page problems, 4.19 Chunk method tradeoffs, 4.27 Profiling tools, 3.10 Covering indexes

## Dependency Graph
**Depends on:** "4.1 EXPLAIN output interpretation", "4.16 Offset pagination deep-page problems", "4.19 Chunk method tradeoffs", "4.27 Profiling tools", "3.10 Covering indexes"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **O(log N) via index**: B-Tree index lookup touches ~4-5 pages per row regardless of table size (for typical cardinalities). Response time stays flat as the table grows.; - **O(N) via full scan**: Sequential scan reads all pages. Response time grows proportionally to table size.; - **Buffer pool effect**: If the working set fits in memory, response time is dominated by CPU and latch contention. If it spills to disk, I/O latency dominates.; - **Network transfer time**: Returning 10,000 rows at 1ms per round trip (depending on row width and network) adds 100ms+ before client processing.; - **Short-circuit optimizations**: LIMIT with correct index, EXISTS, and MIN/MAX on indexed columns can return instantly regardless of total row count..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization