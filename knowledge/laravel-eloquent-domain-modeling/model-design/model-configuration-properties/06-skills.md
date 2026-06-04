# Skill: Configure Non-Conventional Model Properties

## Purpose

Override Eloquent's default configuration properties (`$table`, `$primaryKey`, `$incrementing`, `$keyType`, `$connection`) to match an existing or non-conventional database schema.

## When To Use

- Table name does not follow snake_case plural convention
- Primary key is not `id` or is not auto-incrementing (UUID, UUIDv7, ULID)
- Model uses a non-default database connection
- Working with legacy or third-party database schemas

## When NOT To Use

- All conventions match — omit the property entirely
- The convention override is already handled by the base model (`$dateFormat`)

## Prerequisites

- Model class exists extending `Model` or `BaseModel`
- Schema details (actual table name, primary key column, key type, connection name)

## Inputs

- Actual table name (if different from convention)
- Primary key column name and type
- Whether the key is auto-incrementing
- Database connection name (if not default)
- Fillable attribute list and hidden attribute list

## Workflow

1. Inspect the actual database schema to determine which properties differ from Eloquent's defaults
2. Set only the properties that differ — omit properties that match conventions:
   ```
   class Order extends Model
   {
       protected $table = 'customer_orders'       // Override — differs
       protected $primaryKey = 'uuid'              // Override — differs
       public $incrementing = false                // Override — differs
       protected $keyType = 'string'               // Override — differs
       // $connection omitted — using default
   }
   ```
3. When overriding the primary key, always set `$primaryKey`, `$incrementing`, and `$keyType` together:
   - UUID: `$primaryKey = 'uuid'`, `$incrementing = false`, `$keyType = 'string'`
4. Use the `casts()` method instead of `$casts` property for attribute casting:
   ```
   protected function casts(): array
   {
       return [
           'total_cents' => 'integer',
           'paid_at' => 'datetime',
       ]
   }
   ```
5. Avoid `$with` for eager loading and keep `$appends` lightweight

## Validation Checklist

- [ ] Only properties that differ from defaults are declared
- [ ] Primary key overrides include all three: `$primaryKey`, `$incrementing`, `$keyType`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] `$fillable` is alphabetically ordered
- [ ] `$with` is not used (or is explicitly justified)
- [ ] `$appends` contains only cheap accessors (no database queries)
- [ ] `$connection` uses runtime resolution via config, not hard-coded strings

## Common Failures

- **Setting default values unnecessarily**: `protected $table = 'users'` when convention already gives `users`. Only override when different.
- **Incomplete PK overrides**: Setting `$primaryKey = 'uuid'` and `$incrementing = false` but forgetting `$keyType = 'string'`. SQL type errors on joins.
- **Expensive $appends**: Including an accessor in `$appends` that executes a database query creates N+1 on every serialization.

## Decision Points

- **$casts property vs method**: Use the `casts()` method (Laravel 11+) for flexibility and inheritance support. Use `$casts` property only for trivial models with 2 or fewer static casts.
- **$connection hard-coded vs config**: Use config-based resolution for environment-specific routing. Hard-code only when the connection is truly static.

## Performance Considerations

- `$with` adds unnecessary joins to every query — avoid it
- `$appends` runs accessors on every serialization — keep them cheap
- `$dateFormat` set once in the base model avoids per-model duplication

## Security Considerations

- `$hidden` protects sensitive attributes from serialization — never skip it
- `$fillable` is a mass-assignment security boundary — always define it

## Related Rules

- Set Only Properties That Differ from Defaults
- Prefer `casts()` Method Over `$casts` Property
- Avoid `$with` for Bulk Eager Loading
- Keep `$appends` Lightweight
- Use `$primaryKey`, `$incrementing`, and `$keyType` Together

## Related Skills

- Base Model Class for Shared Configuration
- Model Conventions for Naming Standards
- Strict Mode Configuration for Error Detection

## Success Criteria

- Model configuration accurately reflects the actual database schema
- Only non-default properties are declared (clean, noise-free class)
- Primary key overrides include all interdependent properties
- `$appends` and `$with` do not cause performance regressions
