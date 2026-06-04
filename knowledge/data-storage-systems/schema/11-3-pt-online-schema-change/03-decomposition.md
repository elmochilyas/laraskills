# Decomposition: 11.3 pt-online-schema-change (Percona Toolkit trigger-based online migration)

## Topic Overview
pt-online-schema-change (pt-osc) uses triggers to keep a shadow table in sync. Creates a copy of the table, adds triggers (INSERT/UPDATE/DELETE) on the original table replicating changes to the shadow table. Runs `ALTER TABLE` on the shadow table (no lock), then atomic rename.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-3-pt-online-schema-change/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.3 pt-online-schema-change (Percona Toolkit trigger-based online migration)
- **Purpose:** pt-online-schema-change (pt-osc) uses triggers to keep a shadow table in sync. Creates a copy of the table, adds triggers (INSERT/UPDATE/DELETE) on the original table replicating changes to the shadow table.
- **Difficulty:** Advanced
- **Dependencies:** 11.1 Zero-downtime taxonomy, 11.2 gh-ost

## Dependency Graph
**Depends on:** "11.1 Zero-downtime taxonomy", "11.2 gh-ost"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Trigger-based sync**: AFTER INSERT/UPDATE/DELETE triggers on the original table write changes to the shadow table. Overhead: triggers fire on every DML. ~5-10% performance impact during migration.; - **Chunked copy**: Copies data in chunks (default 1000 rows per chunk). Sleep between chunks. Chunk size configurable.; - **Dry run**: `pt-online-schema-change --dry-run` — checks for FK issues, triggers, replicas. No actual migration..
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