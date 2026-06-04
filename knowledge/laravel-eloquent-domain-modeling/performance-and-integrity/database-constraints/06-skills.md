# Skill: Define Database Constraints for Referential Integrity

## Purpose
Guarantee data integrity at the database level using foreign key constraints, unique constraints, and cascade behaviors — preventing orphaned records and duplicate data regardless of application code paths.

## When To Use
- Every foreign key relationship — always define the constraint, not just the column
- Unique email addresses, slugs, or any column that must not have duplicates
- Pivot tables — composite unique constraints prevent duplicate relationships
- Cascade deletes for dependent data (profiles, settings)

## When NOT To Use
- Bulk load operations where constraint checking overhead is unacceptable
- Multi-tenant tables where constraints would cross tenant boundaries
- Tables where parent deletion should never cascade (use RESTRICT)

## Prerequisites
- Migration fundamentals
- Understanding of relationships and foreign keys
- Knowledge of database engine differences (MySQL, PostgreSQL, SQLite)

## Inputs
- Migration file with Schema builder
- Foreign key column definition
- Referenced table and column
- Desired cascade behavior: cascade, restrict, or set null

## Workflow
1. Use `$table->foreignIdFor(Model::class)` for the foreign key column
2. Always chain `->constrained()` to create the actual database constraint
3. Choose cascade behavior:
   - `->cascadeOnDelete()` for dependent content (posts, comments)
   - `->restrictOnDelete()` for financial/transactional data
   - `->nullOnDelete()` for nullable optional relationships
4. Add `->index()` for PostgreSQL/SQLite (MySQL auto-indexes)
5. Add `->unique()` on columns that must not have duplicates
6. For soft deletes: implement cascade logic via model events, not `ON DELETE CASCADE`
7. Review all cascade constraints before deployment for cascade depth

## Validation Checklist
- [ ] Every `foreignIdFor()` is followed by `->constrained()`
- [ ] Critical data foreign keys use `restrictOnDelete()` or `nullOnDelete()`
- [ ] PostgreSQL/SQLite foreign key columns have explicit `->index()`
- [ ] Unique constraints exist on columns that must not have duplicates
- [ ] No `SET FOREIGN_KEY_CHECKS=0` in production migrations
- [ ] Cascade constraints audited for depth and row counts

## Common Failures
- Omitting `->constrained()` — column exists but no referential integrity
- Wrong cascade direction — accidental mass deletion or orphaned data
- Not indexing FK on PostgreSQL/SQLite — full table scans on joins
- Disabling FK checks in migrations — data corruption if migration fails
- Forgetting cascade for soft deletes — `ON DELETE CASCADE` only works on hard deletes

## Decision Points
- `cascadeOnDelete()` vs `restrictOnDelete()`: cascade for user-submitted content, restrict for financial/transactional data
- `foreignIdFor(Model::class)->constrained()` vs manual `foreign('col')->references('id')->on('table')`: prefer the helper for convention-based code

## Performance Considerations
- FK checks add ~5-10% overhead on writes in MySQL InnoDB
- Unique constraints create an index — speeds up lookups but slows writes
- Cascade deletes on large child sets can lock tables for extended periods
- Adding FK constraints to live tables with millions of rows may lock the table

## Security Considerations
- FK constraints prevent orphaned records that could expose stale authorization data
- Constraint violations leak table structure in error messages — handle gracefully in APIs

## Related Rules
- Always Chain constrained() After foreignIdFor() (performance-and-integrity/database-constraints)
- Default to restrictOnDelete for Critical Data (performance-and-integrity/database-constraints)
- Index Foreign Key Columns on PostgreSQL and SQLite (performance-and-integrity/database-constraints)
- Audit All CASCADE Constraints Before Deployment (performance-and-integrity/database-constraints)
- Never Disable FOREIGN_KEY_CHECKS in Production (performance-and-integrity/database-constraints)
- Handle Cascade for Soft Deletes Separately (performance-and-integrity/database-constraints)

## Related Skills
- Implement Unique Enforcement with createOrFirst
- Implement Atomic Upsert Operations
- Implement Concurrent-Safe Find-Or-Create

## Success Criteria
- No orphaned child records exist in the database
- Referential integrity is enforced at database level, not just application level
- Cascade behaviors are reviewed and match business requirements
- Soft-delete cascades work correctly
