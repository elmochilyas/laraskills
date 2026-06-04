# Date Casting — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | date-casting |

## Validation Checklist

- [ ] Cast type matches the database column type (date, datetime, timestamp)
- [ ] Custom format string is specified only when API contract requires it
- [ ] Immutable variant is used where defensive coding matters
- [ ] Timezone conversions happen at serialization/view boundaries, not in the cast
- [ ] No manual `Carbon::parse()` calls exist for cast attributes
- [ ] Nullable date columns return null (not a default Carbon instance)
- [ ] Date serialization uses the configured format in JSON/array output
- [ ] Dirty detection works correctly for date attribute modifications
