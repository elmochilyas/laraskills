# Migration to Attribute::make — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | migration-to-attribute-make |

## Rules

### Rule 1: Convert all accessors/mutators in one pass per model
When migrating a model, convert all legacy accessors and mutators in a single pass to ensure consistent syntax and reduce the number of migration commits.

### Rule 2: Combine get+set into a single Attribute::make
If an attribute has both a legacy accessor and mutator, combine them into a single `Attribute::make(get: fn, set: fn)` call for cohesion.

### Rule 3: Verify return types after migration
The closure return type in `Attribute::make()` may differ from the legacy method signature. Verify that the actual returned value matches the original behavior.

### Rule 4: Gate shouldCache on profiling results
Do not add `shouldCache: true` during migration unless profiling has confirmed the accessor is a performance bottleneck.

### Rule 5: Do not keep legacy methods for backward compatibility
Legacy methods should be removed immediately after migration. Keeping them creates duplication and confusion. If external callers exist, add a `@deprecated` tag during a transition period.
