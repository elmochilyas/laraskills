# JSON Casting — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | json-casting |

## Validation Checklist

- [ ] Database column is `json` or `jsonb` type
- [ ] Cast type matches the intended PHP representation (array vs collection vs object)
- [ ] Null column values are handled (empty array/collection on read)
- [ ] Consumers reassign modified values (not just mutate in-place)
- [ ] JSON key presence is checked before access (avoid undefined key errors)
- [ ] JSON columns are only used for genuinely dynamic schemas
- [ ] Fixed-schema data uses normalized tables with proper columns
- [ ] Model serializes correctly to JSON (including the array/collection attribute)
