# Base Model Class

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Base Model Class |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Every Eloquent model extends `Illuminate\Database\Eloquent\Model`. This base class provides Active Record implementation — column property access, relationship resolution, event dispatching, serialization, and mass assignment protection. Understanding what the base class provides is the starting point for all model design decisions.

## Core Concepts

- **Active Record Foundation**: Each model wraps a database row; properties map to columns, methods to query builders or relationships
- **Mass Assignment Protection**: `$fillable` and `$guarded` control bulk-assignable attributes; default is guarding all (`$guarded = ['*']`)
- **Dynamic Property Access**: `__get` and `__set` bridge attribute access to database columns, relationships, and accessors
- **Event Dispatch**: Model lifecycle events (`creating`, `created`, `saving`, `saved`, etc.) fire during persistence operations
- **Serialization**: `toArray()` and `toJson()` convert models to array/JSON representations

## When To Use

- Every Eloquent model must extend `Model` — it is required
- Use all base class features (mass assignment, events, serialization) by default

## When NOT To Use (Alternatives)

- For read-only projections, consider a plain PHP class or a read-model with limited Model inheritance
- For DTOs, use plain PHP classes instead of extending Model

## Best Practices

- **Set `$fillable` explicitly**: Never leave `$guarded = []`. Always whitelist fillable attributes to prevent mass-assignment vulnerabilities.
- **Override `$table` for legacy databases**: Don't rely on conventions when the table name doesn't match the convention.
- **Define a base model for shared configuration**: Create `App\Models\BaseModel` extending `Model` for app-wide defaults (serialization, date format, strict mode).

## Architecture Guidelines

- All models extend the base `Model` class
- Define `$fillable` or `$guarded` on every model
- Use `casts()` method (Laravel 11+) over `$casts` property for attribute typing

## Performance Considerations

- Model hydration adds overhead — for bulk data operations, consider `toBase()` to skip model instantiation
- `Model::withoutEvents()` for bulk operations that don't need event side effects

## Security Considerations

- Mass assignment protection is a security feature — never set `$guarded = []`
- Sensitive attributes should be in `$hidden` to prevent accidental serialization

## Examples

```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | PHP OOP |
| Closely Related | Model Conventions |
| Closely Related | Model Configuration Properties |
| Closely Related | Mass Assignment Protection |

## AI Agent Notes

- Always set `$fillable` — never `$guarded = []`
- The base Model provides events, serialization, mass assignment
- Override `$table` for non-conventional table names

## Verification

- [ ] Every model extends `Illuminate\Database\Eloquent\Model`
- [ ] `$fillable` or `$guarded` is explicitly defined
- [ ] Sensitive attributes are in `$hidden`
