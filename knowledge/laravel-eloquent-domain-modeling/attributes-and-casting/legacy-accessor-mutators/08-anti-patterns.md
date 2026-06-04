# Legacy Accessor/Mutators — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | legacy-accessor-mutators |

## Anti-Patterns

### Keeping Both Legacy and Attribute::make Definitions
- **Severity:** High
- **Problem:** After adding an `Attribute::make()` method, the legacy `get{Name}Attribute()` method remains. Laravel prioritizes `Attribute::make()` so the legacy method is dead code, but it creates confusion and maintenance burden.
- **Solution:** Remove the legacy method immediately after migration. Keep only with `@deprecated` if external callers exist.

### Leaving Legacy Methods Public After Migration
- **Severity:** Medium
- **Problem:** Legacy methods are public and can be called directly by external code. After migration, the new `Attribute::make()` method is protected, but if the legacy method remains with public visibility, it becomes part of the public API.
- **Solution:** Remove legacy methods entirely. The public `$model->attribute` access still works via the attribute system.

### Adding shouldCache to All Migrated Accessors
- **Severity:** Medium
- **Problem:** Adding `shouldCache: true` indiscriminately wastes memory on single-use accessors and adds cache-lookup overhead without benefit.
- **Solution:** Profile first. Only add caching to accessors proven to be called multiple times per request or computationally expensive.

### Migrating Untested Accessors Without Verification
- **Severity:** High
- **Problem:** Accessor migration changes the internal implementation. Without test coverage, behavior changes may go unnoticed.
- **Solution:** Either add tests before migration or perform incremental migration with manual verification of each accessor.
