# Skill: Resolve Migration Order Dependencies and Circular References

## Purpose

Ensure migration files are ordered so that referenced tables are created before referencing tables, FK constraints are added after both tables exist, and circular dependencies are resolved by creating tables without FKs first, then adding constraints in subsequent migrations.

## When To Use

- Creating new tables with FK relationships
- Adding FK constraints to existing tables
- Designing schemas with mutual references between tables

## When NOT To Use

- Tables with no cross-references
- Single-table migrations

## Prerequisites

- Understanding of FK dependency ordering
- Knowledge of Laravel's lexicographic filename sorting

## Inputs

- Table creation order based on FK dependencies
- FK constraint definitions
- Circular dependency resolution strategy

## Workflow

1. List all tables and their FK dependencies
2. Order table creation: tables with no FK dependencies first, then tables that reference them
3. For each FK constraint, create it in a separate migration AFTER both tables exist
4. For circular dependencies (A references B, B references A): create both tables without FKs first, then add both FKs in a subsequent migration
5. For PostgreSQL, use `NOT VALID` constraints to defer validation: `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` — validates later
6. Use deferred FK validation for large tables where immediate validation would lock writes

## Validation Checklist

- [ ] All FK-referenced tables are created before referencing tables
- [ ] FK constraints are added as separate migrations after table creation
- [ ] Circular dependencies are resolved with deferred FK addition
- [ ] Migration order is verified with `migrate:status`
- [ ] PostgreSQL uses NOT VALID for zero-lock FK validation on large tables

## Common Failures

### Creating FK in the same migration as the table
`Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must exist in an earlier migration. Always separate table creation from FK constraint creation when dependencies cross tables.

### Circular FK between tables
Two tables with mutual FK references cannot be created with their constraints in the same migration. Create tables without FKs, then add constraints in a subsequent migration.

## Decision Points

### FK in table creation vs separate migration?
FK in table creation is only safe when the referenced table is created in an earlier migration with an earlier timestamp. For all other cases, use separate FK migration files.

### NOT VALID vs immediate validation?
NOT VALID for large tables where validation would require a full table scan with locks. Immediate validation for small tables where the scan completes quickly.

## Performance Considerations

FK validation on table creation scans the referenced table. For large tables, this adds to migration time. NOT VAL defers the scan to a separate operation where it can be scheduled during low traffic.

## Security Considerations

NOT VALID constraints don't validate existing data — invalid data can exist temporarily. Ensure VALIDATE runs before relying on the constraint for data integrity.

## Related Rules

- Create tables before adding FK constraints
- Resolve circular dependencies with deferred FKs
- Use NOT VALID for zero-lock constraint addition

## Related Skills

- Define Foreign Key Constraints
- Name and Order Migration Files
- Use PostgreSQL Lazy ADD COLUMN DEFAULT

## Success Criteria

- All table creation migrations are ordered by FK dependency
- FK constraints are added after both tables exist
- Circular dependencies are resolved cleanly
- PostgreSQL uses NOT VALID for large-table validation
- `migrate:status` shows correct execution order
