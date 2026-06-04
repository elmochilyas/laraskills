# Skill: Configure Eloquent Model Conventions for Table Mapping

## Purpose

Define Eloquent model properties ($table, $primaryKey, $incrementing, $keyType, $timestamps, $connection) to override default conventions when needed — for legacy tables, UUID/ULID primary keys, multi-tenant databases, or non-standard table naming — while relying on conventions for standard cases.

## When To Use

- Defining new Eloquent models
- Mapping models to existing or legacy database tables
- Setting up UUID or ULID primary keys
- Configuring multi-database connection per model

## When NOT To Use

- Models following all default conventions exactly
- Pivot models managed by belongsToMany

## Prerequisites

- Understanding of Eloquent's convention-over-configuration defaults
- Knowledge of the target database table structure

## Inputs

- Table name (if not conventional)
- Primary key column and type
- Timestamp column names and requirement
- Database connection name
- Key type (int, string)

## Workflow

1. Create the model class extending `Model`
2. If the table name doesn't follow snake_case plural convention, set `protected $table = 'custom_table'`
3. If the PK is not `id`, set `protected $primaryKey = 'uuid'`
4. If the PK is not auto-incrementing (UUID, ULID), set `public $incrementing = false` and `protected $keyType = 'string'`
5. If the table doesn't use timestamps, set `public $timestamps = false`
6. If using a non-default database connection, set `protected $connection = 'pgsql'`

## Validation Checklist

- [ ] Table name matches database table (explicit or conventional)
- [ ] Primary key type matches database column
- [ ] Auto-incrementing disabled for UUID/ULID PKs
- [ ] Timestamps enabled only when columns exist
- [ ] Connection set for multi-database setups

## Common Failures

### Forgetting to disable incrementing for UUIDs
`Model::create()` inserts with `id = 0` because Eloquent expects auto-incrementing integer. Always set `$incrementing = false` and `$keyType = 'string'` for UUID PKs.

### Timestamps on non-entity tables
Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary column expectations.

## Decision Points

### Convention vs explicit override?
Use conventions for standard tables. Override explicitly only when the database schema differs from Eloquent's defaults. Overly explicit models are harder to maintain.

### $table vs $connection for multi-tenant?
Set `$connection` on the model for per-tenant databases. Set `$table` for shared-table multi-tenancy with prefixed table names.

## Performance Considerations

Model hydration overhead exists regardless of convention configuration. Properly configured timestamps and PKs don't add measurable overhead.

## Security Considerations

Mass assignment protection via `$fillable` or `$guarded` is essential. Models without explicit fillable/guarded configuration are vulnerable to mass assignment attacks.

## Related Rules

- Set $incrementing=false for UUID/ULID PKs
- Disable timestamps for non-entity tables
- Explicitly set $connection in multi-DB setups

## Related Skills

- Define Eloquent Relationship Types
- Query with Query Builder Methods
- Cast Model Attributes

## Success Criteria

- Models correctly map to their database tables
- UUID/ULID PKs insert correctly
- Timestamps only on tables that have the columns
- Multi-connection models use correct database
