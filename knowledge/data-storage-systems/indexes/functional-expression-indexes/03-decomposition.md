# Decomposition: 3.12 Functional/expression indexes (index by expression result, PostgreSQL/MySQL)

## Topic Overview
Functional indexes index the result of an expression rather than a raw column value. Essential for making sargable queries that use functions in WHERE clauses. PostgreSQL and MySQL 8.0+ support them.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-12-functional-expression-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.12 Functional/expression indexes (index by expression result, PostgreSQL/MySQL)
- **Purpose:** Functional indexes index the result of an expression rather than a raw column value. Essential for making sargable queries that use functions in WHERE clauses.
- **Difficulty:** Advanced
- **Dependencies:** 3.11 Partial indexes, 3.28 Sargability rule, 12.23 Expression/functional indexes

## Dependency Graph
**Depends on:** "3.11 Partial indexes", "3.28 Sargability rule", "12.23 Expression/functional indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Expression index**: `CREATE INDEX ON users (LOWER(email))`. The index stores `LOWER(email)` values.; - **Query matching**: The expression in WHERE must exactly match the index expression. `WHERE LOWER(email) = 'test@example.com'` uses the index. `WHERE LOWER(email) LIKE '%test%'` does not.; - **MySQL 8.0+**: Functional indexes on expressions. Pre-8.0 required generated columns..
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