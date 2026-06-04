# Decomposition: 1.30 Schema comparison and drift detection

## Topic Overview
Schema drift — differences between the expected schema (defined by migrations) and the actual schema (in the database) — accumulates over time due to manual changes, partial migrations, hotfixes, and environment inconsistencies. Drift detection compares the actual database schema against the migration-defined schema and reports differences. This is essential for audit compliance, deployment reliability, and production debugging.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-30-schema-comparison-drift-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.30 Schema comparison and drift detection
- **Purpose:** Schema drift — differences between the expected schema (defined by migrations) and the actual schema (in the database) — accumulates over time due to manual changes, partial migrations, hotfixes, and environment inconsistencies. Drift detection compares the actual database schema against the migration-defined schema and reports differences.
- **Difficulty:** Advanced
- **Dependencies:** 1.8 Migration squashing, 1.28 Migration testing in CI, 1.20 Migration immutability

## Dependency Graph
**Depends on:** "1.8 Migration squashing", "1.28 Migration testing in CI", "1.20 Migration immutability"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Drift sources**: Manual `ALTER TABLE` in production console, partial migration failures, hotfixes applied directly, environment-specific changes (e.g., index tuning on production only).; - **Detection approaches**: (1) Compare `INFORMATION_SCHEMA` against migration output. (2) Use schema dump diffing: dump production schema, compare against migration-generated schema. (3) Third-party tools like `pt-table-checksum`, `liquibase diff`.; - **Impact of undetected drift**: A manual index added to production but not in the migration means the index is lost on the next `migrate:fresh`. A column added manually is missing from staging, causing code that references it to fail..
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