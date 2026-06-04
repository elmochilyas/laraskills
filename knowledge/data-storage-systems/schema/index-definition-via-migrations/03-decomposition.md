# Decomposition: 1.5 Index definition via migrations (index, unique, primary, fullText, spatial)

## Topic Overview
Indexes in Laravel migrations are defined using Blueprint methods that generate database-specific DDL. The five index types — `index`, `unique`, `primary`, `fullText`, `spatial` — serve different query optimization purposes. Defining indexes at migration time is the correct point to design the physical data access path, not after queries become slow in production.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-5-index-definition-via-migrations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.5 Index definition via migrations (index, unique, primary, fullText, spatial)
- **Purpose:** Indexes in Laravel migrations are defined using Blueprint methods that generate database-specific DDL. The five index types — `index`, `unique`, `primary`, `fullText`, `spatial` — serve different query optimization purposes.
- **Difficulty:** Foundation
- **Dependencies:** 3.1 B-Tree index structure, 3.8 Composite/compound indexes, 3.13 Full-text indexes, 3.20 Concurrent index creation, 3.21 Index management in Laravel migrations

## Dependency Graph
**Depends on:** "3.1 B-Tree index structure", "3.8 Composite/compound indexes", "3.13 Full-text indexes", "3.20 Concurrent index creation", "3.21 Index management in Laravel migrations"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **index()**: Standard B-tree index. Use for columns frequently used in WHERE, JOIN, ORDER BY.; - **unique()**: Enforces uniqueness while providing index benefits. Automatically creates a B-tree index constraint.; - **primary()**: Typically handled by `id()` or `bigIncrements()`. Creates the clustered index (InnoDB) or primary key constraint.; - **fullText()**: Specialized index for full-text search (MySQL FULLTEXT, PostgreSQL GIN tsvector).; - **spatial()**: R-Tree index (MySQL) or GiST index (PostgreSQL) for spatial/GIS data..
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