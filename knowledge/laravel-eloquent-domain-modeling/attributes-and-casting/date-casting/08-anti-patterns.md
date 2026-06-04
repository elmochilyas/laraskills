# Date Casting — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | date-casting |

## Anti-Patterns

### Mixing Mutable and Immutable Casts Inconsistently
- **Severity:** Medium
- **Problem:** Some date attributes use mutable Carbon while others use immutable variants without clear reasoning, causing confusion about which attributes can be safely mutated.
- **Solution:** Establish a project-wide convention (default immutable, explicit mutable where needed) and document the policy.

### Using `timestamp` Cast for Datetime Columns
- **Severity:** High
- **Problem:** Applying the `timestamp` cast to a `datetime` database column causes incorrect hydration and timezone offset issues because `timestamp` expects a Unix integer.
- **Solution:** Always use `datetime` for datetime columns and `timestamp` only for Unix integer columns.

### Applying Custom Date Formats Globally
- **Severity:** Medium
- **Problem:** Setting a custom format like `'datetime:d/m/Y'` on the cast forces ALL serialization (JSON, array) to use that format, including API responses that should use ISO-8601.
- **Solution:** Use default ISO-8601 in casts and apply custom formats only at the presentation level.

### Calling Carbon::parse() on Cast Attributes
- **Severity:** High
- **Problem:** `Carbon::parse($model->date)` on an attribute with a date cast adds redundant parsing and can cause subtle type issues when the cast returns an instance that is re-parsed.
- **Solution:** Access the Carbon instance directly and use its methods for formatting, modification, and comparison.
