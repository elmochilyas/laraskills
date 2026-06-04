# Decomposition: 1.23 Model usage inside migrations anti-pattern (use DB::table or raw SQL instead)

## Topic Overview
Using Eloquent models inside migrations is an anti-pattern because models evolve independently of the schema. A migration running `User::where('status', 'active')->update(...)` references the `User` model as it exists today — but the migration was written for the schema as it existed at a past point. Model changes (renamed columns, new scopes, removed attributes) can break old migrations when run on a fresh database or during rollback.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-23-model-inside-migrations-antipattern/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.23 Model usage inside migrations anti-pattern (use DB::table or raw SQL instead)
- **Purpose:** Using Eloquent models inside migrations is an anti-pattern because models evolve independently of the schema. A migration running `User::where('status', 'active')->update(...)` references the `User` model as it exists today — but the migration was written for the schema as it existed at a past point.
- **Difficulty:** Intermediate
- **Dependencies:** 1.24 Schema and data migration separation, 1.19 Data backfill strategies

## Dependency Graph
**Depends on:** "1.24 Schema and data migration separation", "1.19 Data backfill strategies"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Schema-model mismatch**: Models change (columns renamed, scopes added, casts changed) after the migration was written. When the migration runs on a fresh database, it uses the current model's state, which may not match the migration's expectations.; - **CI and fresh installs**: `migrate:fresh` in CI re-runs all migrations. If any migration uses a model that references a column that was added by a later migration, it fails.; - **Rollback failures**: A model's `boot()` method may register global scopes that reference columns that no longer exist after rollback.; - **Alternative**: Use `DB::table()` or raw SQL for data transformations in migrations..
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