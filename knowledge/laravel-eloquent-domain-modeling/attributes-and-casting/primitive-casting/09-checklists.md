# Primitive Casting — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | primitive-casting |

## Validation Checklist

- [ ] Cast type strings are from Laravel's supported list (integer, boolean, float, etc.)
- [ ] Database column type matches the cast (int column → integer cast)
- [ ] Null values are handled correctly (nullable columns cast to null, not 0 or false)
- [ ] No cast used as a substitute for validation or business logic
- [ ] Array vs object choice for JSON columns is deliberate
- [ ] Monetary values use `decimal:N` or a Money value object, not `float`
- [ ] No custom casts exist where primitive casts would suffice
