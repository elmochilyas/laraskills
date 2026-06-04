# Decomposition: 11.5 pgroll (PostgreSQL zero-downtime migration tool)

## Topic Overview
pgroll is a PostgreSQL migration tool that creates a new version of the schema, supports dual-write (write to both old and new schema), and cuts over atomically. Unlike MySQL tools, pgroll is PostgreSQL-native, understanding PostgreSQL features (NOT VALID, GENERATED columns, RLS). Provides rollback capability without data loss.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-5-pgroll-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.5 pgroll (PostgreSQL zero-downtime migration tool)
- **Purpose:** pgroll is a PostgreSQL migration tool that creates a new version of the schema, supports dual-write (write to both old and new schema), and cuts over atomically. Unlike MySQL tools, pgroll is PostgreSQL-native, understanding PostgreSQL features (NOT VALID, GENERATED columns, RLS).
- **Difficulty:** Advanced
- **Dependencies:** 11.1 Zero-downtime taxonomy, 11.6 Expand-contract

## Dependency Graph
**Depends on:** "11.1 Zero-downtime taxonomy", "11.6 Expand-contract"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Version-based**: Create schema version V2 alongside V1. Write to both during migration. Reads served from V1 until cutover.; - **PostgreSQL-native**: Uses PostgreSQL features: `NOT NULL` via `NOT VALID`, defaults via `SET DEFAULT`, column renames via views.; - **Rollback**: Since V1 schema/data is preserved during migration, rollback is instant (just stop writing to V2)..
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