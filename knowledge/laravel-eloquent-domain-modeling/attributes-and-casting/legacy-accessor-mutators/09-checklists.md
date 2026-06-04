# Legacy Accessor/Mutators — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | legacy-accessor-mutators |

## Validation Checklist

- [ ] Legacy `get{Name}Attribute` methods are identified for migration
- [ ] Method name changed to camelCase matching the attribute name
- [ ] Method visibility changed from `public` to `protected`
- [ ] Body moved into `Attribute::make(get: fn ($value) => ...)` closure
- [ ] Accessor returns the same value for the same input (tested)
- [ ] Legacy method is removed (no duplication)
- [ ] `shouldCache` is added only where profiling indicates benefit
- [ ] All callers updated if the legacy method was called directly
