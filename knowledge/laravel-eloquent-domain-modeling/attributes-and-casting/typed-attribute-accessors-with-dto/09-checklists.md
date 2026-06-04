# Typed Attribute Accessors with DTOs — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | typed-attribute-accessors-with-dto |

## Validation Checklist

- [ ] DTO has `readonly` properties or is otherwise immutable
- [ ] Accessor returns the DTO, not an array or null
- [ ] Mutator accepts the DTO and maps to database columns
- [ ] `shouldCache` is enabled for DTO construction
- [ ] Null stored values are handled (return null DTO or throw)
- [ ] DTO validation happens in the constructor
- [ ] DTO is used across multiple models where appropriate (consider custom cast instead)
- [ ] No magic string keys exist where DTO properties would be clearer
