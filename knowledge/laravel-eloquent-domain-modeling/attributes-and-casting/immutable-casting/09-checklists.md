# Immutable Casting — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | immutable-casting |

## Validation Checklist

- [ ] `get()` returns a new instance on each call (not a cached mutable reference)
- [ ] Value objects have `readonly` properties or are otherwise immutable
- [ ] Arrays are returned fresh (not a reference to a mutable property)
- [ ] Immutability behavior is documented in the cast class
- [ ] Test confirms mutation of returned value doesn't affect model state
- [ ] Performance impact of repeated allocation is acceptable (profiled if needed)
- [ ] Nested objects are also handled immutably (deep clone if needed)
