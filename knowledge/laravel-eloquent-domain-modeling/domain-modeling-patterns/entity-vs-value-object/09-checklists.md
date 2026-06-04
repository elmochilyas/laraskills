# Entity vs Value Object — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | entity-vs-value-object |

## Validation Checklist

- [ ] Entity has a clear identity (primary key, UUID, natural key)
- [ ] Entity lifecycle is explicit (create → modify → persist)
- [ ] Value object is immutable (readonly properties)
- [ ] Value objects are compared by value equality
- [ ] Value objects have no independent identity or lifecycle
- [ ] Entities embed value objects as typed attributes
- [ ] Classification is documented or obvious from the code
- [ ] Entities have domain methods, not just getters/setters
