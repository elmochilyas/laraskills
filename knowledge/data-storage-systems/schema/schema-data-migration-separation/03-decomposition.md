# Decomposition: 1.24 Schema and data migration separation (data changes in separate files/jobs)

## Topic Overview
Schema changes (ALTER TABLE, CREATE TABLE) and data migrations (UPDATE, backfill, transform) should be in separate files. Schema migrations should run in the deployment pipeline. Data migrations should be queued jobs that run asynchronously.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-24-schema-data-migration-separation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.24 Schema and data migration separation (data changes in separate files/jobs)
- **Purpose:** Schema changes (ALTER TABLE, CREATE TABLE) and data migrations (UPDATE, backfill, transform) should be in separate files. Schema migrations should run in the deployment pipeline.
- **Difficulty:** Advanced
- **Dependencies:** 1.19 Data backfill strategies, 1.23 Model usage inside migrations anti-pattern, 1.25 Rollback strategy

## Dependency Graph
**Depends on:** "1.19 Data backfill strategies", "1.23 Model usage inside migrations anti-pattern", "1.25 Rollback strategy"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Schema migration**: DDL operations on table structure. Fast (milliseconds to seconds). Must run before code that depends on the new schema.; - **Data migration**: DML operations on existing rows. Potentially long-running (minutes to hours). Does not block deployment if run asynchronously.; - **Separation rationale**: A data migration that takes 2 hours should not block a deployment pipeline. The schema migration (adding the column) is fast. The data migration (backfilling values) is a background job..
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