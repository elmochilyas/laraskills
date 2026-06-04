# Migration to Attribute::make — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | migration-to-attribute-make |

## Validation Checklist

- [ ] All legacy get methods converted to `Attribute::make(get: ...)`
- [ ] All legacy set methods converted to `Attribute::make(set: ...)`
- [ ] Bidirectional methods share a single `Attribute::make()`
- [ ] Return values match before/after migration (tested)
- [ ] `shouldCache` is not added indiscriminately
- [ ] No legacy accessor/mutator methods remain
- [ ] Method visibility changed from `public` to `protected`
- [ ] Test suite passes with the migrated accessors
