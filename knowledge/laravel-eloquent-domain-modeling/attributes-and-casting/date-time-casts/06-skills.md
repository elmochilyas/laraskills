# Date/Time Casts — Skills

---

## Skill 1: Configure Immutable Date/Time Casting

### Purpose
Set up `immutable_datetime` or `immutable_date` casts on Eloquent model attributes to return `CarbonImmutable` instances, preventing accidental mutation of model date state.

### When To Use
- You need Carbon instances for date manipulation
- You want to prevent accidental mutation of model date attributes
- You need consistent timezone handling across the application

### When NOT To Use
- You only need the raw date string (skip the cast)
- You intentionally need mutable Carbon behavior (rare)

### Prerequisites
- Model class exists with date/time columns
- Understanding of Carbon mutability vs immutability

### Inputs
- Attribute names
- Column types (date, datetime, timestamp)
- Optional custom format string for serialization

### Workflow

1. **Add to `$casts`** using immutable variants:
   ```php
   protected $casts = [
       'created_at' => 'immutable_datetime',
       'updated_at' => 'immutable_datetime',
       'birthday' => 'immutable_date:Y-m-d',
   ];
   ```

2. **Override `serializeDate()`** for consistent API output:
   ```php
   protected function serializeDate(DateTimeInterface $date): string
   {
       return $date->format('Y-m-d\TH:i:sP');
   }
   ```

3. **Use `immutable_date`** for date-only columns with format parameter

4. **Store in UTC** — let Laravel handle the storage format

5. **Convert to user timezone** at the presentation layer only

### Validation Checklist
- [ ] All date columns use immutable variants
- [ ] `serializeDate()` is overridden for consistent JSON output
- [ ] Date-only columns use `immutable_date`, not `immutable_datetime`
- [ ] No manual `Carbon::parse()` for cast attributes

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Date shifted by timezone | Date-only column cast as datetime | Use `immutable_date` for date-only columns |
| Accidental mutation | Mutable `datetime` cast | Use `immutable_datetime` instead |
| Inconsistent API format | No `serializeDate()` override | Override in base model |

### Decision Points
- **Date-only column?** → Use `immutable_date:Y-m-d`
- **Full datetime?** → Use `immutable_datetime`
- **Custom API format?** → Override `serializeDate()`

### Performance Considerations
- Date casts add minimal overhead — Carbon creation is fast
- Immutable variants create new instances on modification (negligible)

### Security Considerations
- `CarbonImmutable` prevents models from leaking mutated state across requests
- Never trust user-provided timezone strings — validate against known list

### Related Rules
| Rule | Reference |
|---|---|
| Prefer `immutable_datetime` over `datetime` | `05-rules.md` |
| Override `serializeDate()` for consistent API output | `05-rules.md` |
| Store all timestamps in UTC | `05-rules.md` |
| Use `immutable_date` for date-only columns | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Configure Date Casting with Custom Format | Similar with mutable variants |
| Configure Primitive Casts for Type Safety | Foundation for all casting |
| Define a Cached Accessor | Alternative for date formatting |

### Success Criteria
- Model attributes return `CarbonImmutable` instances from DB reads
- Serialization uses the configured format consistently
- Date-only columns have no time component
- UTC storage with timezone conversion at presentation boundaries
