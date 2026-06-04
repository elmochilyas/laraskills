# Migration to Attribute::make — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | migration-to-attribute-make |

## Anti-Patterns

### Incremental Migration Without a Plan
- **Severity:** Medium
- **Problem:** Migrating one accessor at a time across different models in different commits creates inconsistency — some attributes use legacy syntax, others use `Attribute::make()`.
- **Solution:** Plan the migration per model. Convert all accessors in one model per pass to maintain internal consistency.

### Keeping Legacy Methods as "Documentation"
- **Severity:** High
- **Problem:** After adding `Attribute::make()`, the legacy method is dead code but kept as "documentation." The legacy method is never called and becomes misleading as the codebase evolves.
- **Solution:** Remove legacy methods immediately. Document intent in the `Attribute::make()` closure or method docblock.

### Migrating Without Test Coverage
- **Severity:** High
- **Problem:** Accessor migration changes internal implementation. Without tests, subtle differences in return values (e.g., null handling, type coercion) go undetected.
- **Solution:** Write tests for attribute accessors before migrating, or migrate incrementally with manual verification of each attribute.

### Adding shouldCache to All Migrated Accessors
- **Severity:** Medium
- **Problem:** Indiscriminate caching wastes memory on single-use accessors and risks stale values if the underlying data changes within a request.
- **Solution:** Profile first. Add `shouldCache` only to accessors with proven performance benefit.
