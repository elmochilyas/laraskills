# Decomposition: Query Optimization Cost

## Topic Overview
Optimizing database queries reduces CPU and memory usage on the database server, enabling smaller/cheaper instance sizes and reducing I/O costs. A single unoptimized query can consume 90% of database resources. For Laravel applications, N+1 queries (missing eager loading), missing indexes, and full table scans are the primary culprits. Every query optimized translates directly to lower database tier cost or more capacity on existing hardware.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-query-optimization-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Query Optimization Cost
- **Purpose:** Optimizing database queries reduces CPU and memory usage on the database server, enabling smaller/cheaper instance sizes and reducing I/O costs. A single unoptimized query can consume 90% of database resources. For Laravel applications, N+1 queries (missing eager loading), missing indexes, and full table scans are the primary culprits. Every query optimized translates directly to lower database tier cost or more capacity on existing hardware.
- **Difficulty:** Foundation
- **Dependencies:** - Index Tuning Cost (ku-02), - Read Replicas Cost (ku-05), - Serverless Database (ku-07)

## Dependency Graph
**Depends on:**
- Index Tuning Cost (ku-02)
- Read Replicas Cost (ku-05)
- Serverless Database (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Query optimization: Any app with slow page loads, high database CPU, or N+1 queries
- Index optimization: Tables > 10K rows with frequent WHERE, JOIN, or ORDER BY queries
- N+1 detection: Any Eloquent relationship without eager loading in loops
- Slow query log: Production databases with CPU > 50% consistently
- Query monitoring: New Relic, Scout APM, or Laravel Telescope for query time tracking
**Out of scope:**
- Premature optimization: Don't optimize 1-2ms queries on 10-row tables (negligible impact)
- Ignoring application cache: Some queries are better avoided entirely (cache results)
- Over-indexing: Too many indexes slow writes (INSERT/UPDATE/DELETE) and increase storage cost
- Query optimization for reporting: Analytical queries on large datasets may need different approach (materialized views, data warehouse)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization