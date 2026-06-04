# Date Casting — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | date-casting |

## Rules

### Rule 1: Use built-in date casts over manual Carbon instantiation
Never manually call `Carbon::parse()` in accessors when the column is a standard date/datetime/timestamp type. Built-in casts hydrate Carbon instances automatically with zero custom code.

### Rule 2: Choose the correct cast type for the column
Match `date` (date-only), `datetime` (with time), or `timestamp` (Unix integer) to the database column type. Mismatched casts cause silent data corruption.

### Rule 3: Use immutable variants for defensive coding
Prefer `immutable_date` or `immutable_datetime` when the date attribute is shared across multiple consumers and accidental mutation is a risk.

### Rule 4: Format dates explicitly at boundaries, not globally
Apply custom date formats at the presentation layer (Blade, API resources) rather than in the cast definition, unless the API contract requires a specific format.

### Rule 5: Never manually parse dates in accessors when casting works
If a column has a date cast configured, do not add an accessor that parses the same attribute. This duplicates framework logic and creates inconsistency.
