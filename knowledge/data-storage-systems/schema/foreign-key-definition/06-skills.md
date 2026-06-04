# Skill: Define Foreign Key Constraints with constrained() Helper

## Purpose

Create foreign key constraints using Laravel's `foreignId()->constrained()` pattern to enforce referential integrity, automatically add the required index, match unsigned types correctly, and choose the appropriate `onDelete`/`onUpdate` action for each relationship type.

## When To Use

- Defining child-parent relationships between tables
- Enforcing referential integrity at the database level
- Adding FK constraints in migration files

## When NOT To Use

- Vitess/PlanetScale environments without FK support
- Cross-shard relationships in sharded databases
- Extremely high-throughput tables where FK check overhead is prohibitive

## Prerequisites

- Parent table exists and has a primary key
- Both tables use the same connection/engine
- Understanding of referential actions (cascade, restrict, set null)

## Inputs

- Relationship semantics (ownership, optional reference, financial)
- Parent table and column
- Referential actions for delete and update

## Workflow

1. Use `$table->foreignId('user_id')` to create the FK column with correct unsigned type
2. Chain `->constrained()` to automatically infer the referenced table and column, adding both the constraint and the index
3. Choose `->cascadeOnDelete()` for owned child records (post belongs to user)
4. Choose `->restrictOnDelete()` for financial or audit data where automatic deletion is prohibited
5. Choose `->nullOnDelete()` for optional relationships where children remain valid without a parent
6. For composite FKs, use `$table->foreign(['col1', 'col2'])->references(...)->on(...)` syntax
7. Verify the parent table migration has an earlier timestamp than the FK migration

## Validation Checklist

- [ ] `foreignId()` matches the parent's PK type (unsignedBigInteger for bigIncrements)
- [ ] `constrained()` is used instead of manual FK definition
- [ ] `onDelete` action chosen based on relationship semantics
- [ ] FK column has an index (automatic with constrained())
- [ ] Parent table migration runs before the FK migration
- [ ] No circular cascade chains exist

## Common Failures

### Missing index on FK column
Using `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` adds the constraint but NOT the index. Always use `foreignId()->constrained()` which adds both.

### unsigned type mismatch
`foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK fails. Use `bigIncrements()` on the PK or match types explicitly.

## Decision Points

### cascadeOnDelete vs restrictOnDelete?
CASCADE for owned data where children have no independent existence (posts, comments). RESTRICT for financial/audit data where automatic deletion could cause compliance or data loss issues.

### constrained() vs manual FK?
Always prefer `constrained()`. It's shorter, reduces type mismatch bugs, and automatically adds the required index. Manual FK syntax is only needed for composite FKs.

## Performance Considerations

FK constraints add a read check on the parent table for every INSERT/UPDATE. CASCADE deletes are not free — deleting one parent with 10K children generates 10,001 delete operations in one transaction.

## Security Considerations

CASCADE can silently delete far more data than intended. RESTRICT prevents accidental deletion but may cause unexpected 500 errors if not handled in application code.

## Related Rules

- Use constrained() over manual FK definition
- Match unsigned types between FK and PK
- Index FK columns automatically

## Related Skills

- Select Optimal Blueprint Column Types
- Create Anonymous Migration Classes
- Define Eloquent Relationships

## Success Criteria

- All FK constraints use `foreignId()->constrained()` pattern
- Referential actions match relationship semantics
- FK columns are indexed for join performance
- No type mismatches between FK and PK columns
- Migration ordering ensures parent table exists before FK
