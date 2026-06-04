# Decomposition: 3.24 Indexing foreign key columns (automatic via constrained)

## Topic Overview
Foreign key columns must be indexed for JOIN performance. Laravel's `->constrained()` automatically adds an index. Manual FK definitions do NOT.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-24-indexing-foreign-key-columns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.24 Indexing foreign key columns (automatic via constrained)
- **Purpose:** Foreign key columns must be indexed for JOIN performance. Laravel's `->constrained()` automatically adds an index.
- **Difficulty:** Foundation
- **Dependencies:** 1.4 Foreign key definition, 15.2 Foreign key index requirements

## Dependency Graph
**Depends on:** "1.4 Foreign key definition", "15.2 Foreign key index requirements"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **constrained() auto-index**: `$table->foreignId('user_id')->constrained()` creates FK constraint AND index.; - **Manual FK without index**: `$table->foreign('user_id')->references('id')->on('users')` creates FK constraint only. No index. Full table scan on every JOIN.; - **MySQL InnoDB**: Automatically indexes FK columns if no index exists. PostgreSQL does not..
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