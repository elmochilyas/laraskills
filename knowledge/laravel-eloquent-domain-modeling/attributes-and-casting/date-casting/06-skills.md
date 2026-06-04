# Date Casting — Skills

---

## Skill 1: Configure Date Casting with Custom Format

### Purpose
Set up date casting on an Eloquent model attribute using the built-in `date` or `datetime` cast with a custom serialization format, ensuring correct Carbon instance hydration and consistent JSON output.

### When To Use
- An attribute stores a date or datetime in the database
- You need Carbon instances for date manipulation in PHP
- You need a specific format in JSON/array serialization

### When NOT To Use
- You only need the raw timestamp string (no date math, formatting)
- You prefer immutable Carbon instances (use `immutable_date` or `immutable_datetime`)

### Prerequisites
- Understanding of date columns in the database schema
- Knowledge of Carbon formatting codes

### Inputs
- Attribute name
- Date column type (datetime, date, timestamp)
- Desired serialization format string (or default)

### Workflow

1. **Add the attribute to `$casts`** with `'datetime'` or `'date'`:
   ```php
   protected $casts = [
       'published_at' => 'datetime:Y-m-d H:i:s',
       'birth_date' => 'date:Y-m-d',
   ];
   ```

2. **Choose the correct cast type**:
   - `date` — for date-only columns (no time component)
   - `datetime` — for full datetime columns
   - `timestamp` — for Unix timestamp columns

3. **Specify a custom format** for serialization to JSON/array — omit to use default

4. **Use `immutable_date` or `immutable_datetime`** if Carbon mutability is undesirable

5. **Handle timezone** — access the Carbon instance and call `->tz()` where conversion is needed

### Validation Checklist

- [ ] Correct cast type matches the database column (date, datetime, timestamp)
- [ ] Custom format string is provided where default serialization is insufficient
- [ ] Immutable variant is used if mutability is a concern
- [ ] Timezone conversions happen explicitly at serialization/view boundaries
- [ ] No manual `Carbon::parse()` in accessors where casting handles it

### Related Rules

| Rule | Reference |
|---|---|
| Use built-in date casts over manual Carbon instantiation | `05-rules.md` Rule 1 |
| Choose the correct cast type for the column | `05-rules.md` Rule 2 |
| Use immutable variants for defensive coding | `05-rules.md` Rule 3 |
| Format dates explicitly at boundaries, not globally | `05-rules.md` Rule 4 |
| Never manually parse dates in accessors when casting works | `05-rules.md` Rule 5 |

### Success Criteria
- Attribute hydrates as Carbon instance from DB read
- Date serialization uses the configured format
- Immutable variant is used where appropriate
- No manual `Carbon::parse()` calls for cast attributes
