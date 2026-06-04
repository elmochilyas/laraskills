# Decomposition: 1.29 Foreign key constraint management in PlanetScale/Vitess environments

## Topic Overview
PlanetScale (based on Vitess) and standalone Vitess environments have significant limitations with foreign key constraints. Vitess does not fully support cross-shard FK constraints and has restrictions on schema changes that differ from standard MySQL. PlanetScale enforces branch-based schema management where FKs must be created within the context of a deploy request.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-29-foreign-key-planetscale-vitess/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.29 Foreign key constraint management in PlanetScale/Vitess environments
- **Purpose:** PlanetScale (based on Vitess) and standalone Vitess environments have significant limitations with foreign key constraints. Vitess does not fully support cross-shard FK constraints and has restrictions on schema changes that differ from standard MySQL.
- **Difficulty:** Advanced
- **Dependencies:** 1.4 Foreign key definition, 15.1 Foreign key constraints, 15.16 Application-level vs database-level enforcement

## Dependency Graph
**Depends on:** "1.4 Foreign key definition", "15.1 Foreign key constraints", "15.16 Application-level vs database-level enforcement"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Vitess FK limitation**: Vitess does not guarantee FK enforcement across shards. FKs are only supported within a single shard or when the parent and child tables are co-located.; - **PlanetScale branching**: Schema changes are made in a branch, deployed via a deploy request, and applied using non-blocking DDL. FK constraints must be part of the deploy request workflow.; - **Application-level enforcement**: In Vitess environments, FK enforcement is often delegated to the application layer using Eloquent relationships and application validation.; - **Drop behavior**: Vitess may silently ignore FK constraint violations or fail unpredictably depending on configuration..
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