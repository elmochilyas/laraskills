# Decomposition: Slow Query Identification Sql

## Topic Overview
Profiling tools capture **actual SQL queries** with their execution time, parameter values, and stack traces. This reveals which queries are slow, where they're called from, and how many times they execute. The combination of query time + call count reveals the real cost: a 5ms query called 200 times (N+1) costs 1000ms — far more than a single 200ms query.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/slow-query-identification-sql/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Slow Query Identification Sql
- **Purpose:** Profiling tools capture **actual SQL queries** with their execution time, parameter values, and stack traces. This reveals which queries are slow, where they're called from, and how many times they execute. The combination of query time + call count reveals the real cost: a 5ms query called 200 times (N+1) costs 1000ms — far more than a single 200ms query.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Query optimization priority
  - Fixing slow queries without profiling
  - Camera model
  - Tiered profiling workflow

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization