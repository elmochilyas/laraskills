# Decomposition: 1.27 Online index creation in PostgreSQL/SQL Server (.online() modifier)

## Topic Overview
PostgreSQL supports creating indexes without blocking writes via the `CONCURRENTLY` option. SQL Server supports similar online index operations. Laravel exposes this via the `.online()` modifier on index creation for SQL Server, but for PostgreSQL, it requires raw SQL.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-27-online-index-creation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.27 Online index creation in PostgreSQL/SQL Server (.online() modifier)
- **Purpose:** PostgreSQL supports creating indexes without blocking writes via the `CONCURRENTLY` option. SQL Server supports similar online index operations.
- **Difficulty:** Advanced
- **Dependencies:** 3.20 Concurrent index creation, 1.26 MySQL ALGORITHM options, 3.1 B-Tree index structure

## Dependency Graph
**Depends on:** "3.20 Concurrent index creation", "1.26 MySQL ALGORITHM options", "3.1 B-Tree index structure"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **PostgreSQL CONCURRENTLY**: `CREATE INDEX CONCURRENTLY` builds the index in the background while allowing concurrent inserts, updates, and deletes. Takes longer but doesn't block writes.; - **PostgreSQL limitation**: `CONCURRENTLY` cannot be run inside a transaction. Each migration using `CONCURRENTLY` must be the only operation in its migration file.; - **Laravel SQL Server .online()**: `$table->index('column')->online()` for SQL Server online index creation.; - **Tradeoff**: Online index creation takes 2-3x longer than standard index creation but avoids write blocking..
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