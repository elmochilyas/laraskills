# Decomposition: 1.4 Foreign key definition (constrained, onDelete, onUpdate, cascade/restrict/set null)

## Topic Overview
Foreign key constraints enforce referential integrity at the database level. Laravel's `constrained()` helper provides a concise, convention-based syntax for defining FKs that reduces boilerplate and eliminates type mismatch bugs. The `onDelete` and `onUpdate` options determine behavior when referenced rows are deleted or updated.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-4-foreign-key-definition/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.4 Foreign key definition (constrained, onDelete, onUpdate, cascade/restrict/set null)
- **Purpose:** Foreign key constraints enforce referential integrity at the database level. Laravel's `constrained()` helper provides a concise, convention-based syntax for defining FKs that reduces boilerplate and eliminates type mismatch bugs.
- **Difficulty:** Foundation
- **Dependencies:** 2.2 Relationship types, 15.1 Foreign key constraints, 15.12 Foreign key cascade implications, 1.29 FK in PlanetScale/Vitess

## Dependency Graph
**Depends on:** "2.2 Relationship types", "15.1 Foreign key constraints", "15.12 Foreign key cascade implications", "1.29 FK in PlanetScale/Vitess"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **constrained()**: Automatically infers table and column from the relationship name. `$table->foreignId('user_id')->constrained()` references `users.id`.; - **onDelete() / onUpdate()**: Defines referential action. Options: `cascade` (propagate), `restrict` (block), `set null` (nullify FK), `no action` (defer check).; - **foreignId()**: Creates an `unsignedBigInteger` column that matches the type Laravel uses for `id()` by default.; - **Key points**: `constrained()` adds both the FK constraint AND an index on the column. Manually defined FKs via `$table->foreign('col')->references('id')->on('table')` do NOT automatically add an index..
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