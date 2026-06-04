# Legacy Accessor/Mutators — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | legacy-accessor-mutators |

## Rules

### Rule 1: Replace legacy getXAttribute with Attribute::make
All legacy `get{Name}Attribute($value)` methods should be replaced with `Attribute::make(get: fn ($value) => ...)` to enable caching and modern conventions.

### Rule 2: Change visibility from public to protected
Legacy accessor methods are `public`. After migration to `Attribute::make()`, the method must be `protected` to follow Laravel conventions.

### Rule 3: Use camelCase method names for Attribute accessors
The new method name should be camelCase matching the attribute name: `fullName(): Attribute` not `getFullNameAttribute()`.

### Rule 4: Add shouldCache only after profiling
Do not indiscriminately add `shouldCache: true` to all migrated accessors. Add it only when profiling confirms the accessor is a performance bottleneck or called multiple times per request.

### Rule 5: Remove legacy methods to avoid duplication
After migration, delete the legacy `get{Name}Attribute()` method. Keeping both creates confusion about which definition is active.
