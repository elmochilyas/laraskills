# Enum Casting — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | enum-casting |

## Validation Checklist

- [ ] Enum is backed by string or int (not a unit enum)
- [ ] Enum class is registered in `$casts` using `Enum::class` syntax
- [ ] Database column type matches the enum's backing type
- [ ] Business logic uses enum instances, not raw scalar values
- [ ] No string constants duplicated alongside the enum definition
- [ ] Enum serializes correctly to JSON (uses the backing value)
- [ ] Invalid database values (not matching any case) throw a cast error
- [ ] Enum cases cover all valid values for the column
