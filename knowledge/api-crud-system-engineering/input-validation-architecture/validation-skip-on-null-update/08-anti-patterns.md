# Validation Skip on Null Update — Anti-Patterns

## Treating Null as Absent by Default
**Description:** Automatically converting all null inputs to absent without considering each field's semantics.
**Why it happens:** Developers implement a blanket null-to-absent conversion in a base FormRequest.
**Consequences:** Fields where null means "clear the value" silently skip the update; data is never cleared.
**Better approach:** Define null semantics per field. Convert only fields where null means "don't update."

## Using `nullable` on Non-Nullable DB Columns
**Description:** Adding `nullable` validation to fields whose database columns have `NOT NULL` constraint.
**Why it happens:** Developers use `nullable` for all optional fields without checking DB schema.
**Consequences:** Validation passes null, but the database integrity constraint fails; server error propagates to the client.
**Better approach:** Match validation nullable rules to DB column nullability. Use `sometimes` for optional fields that are NOT NULL in DB.

## Confusing `nullable` with `sometimes`
**Description:** Using `nullable` when the intent is to make a field optional (omittable).
**Why it happens:** Developers think `nullable` makes a field optional. `nullable` and `sometimes` are different.
**Consequences:** `nullable` allows null values but doesn't allow omission. `sometimes` allows omission. Using the wrong one causes unexpected validation failures.
**Better approach:** Use `nullable` for null-as-value. Use `sometimes` for optional fields. Use both when a field is both omittable and nullable.

## Silent Null Data Loss
**Description:** Converting null to absent without logging, causing unexpected data clearing.
**Why it happens:** Null-to-absent conversion happens silently in `prepareForValidation()`.
**Consequences:** If client sends null intending to clear a field, the field is not updated; data loss is invisible.
**Better approach:** Log null-to-absent conversions in development. Consider rejecting null-as-omission explicitly with an error message telling clients to omit the field instead.

## Using Null to Represent Empty String
**Description:** Sending `null` when the intent is to send an empty string, or vice versa.
**Why it happens:** API consumers confuse null and empty string semantics.
**Consequences:** Data quality issues — some records have null, others have empty strings, both meaning "no value."
**Better approach:** Normalize in `prepareForValidation()`: convert empty strings to null (or null to empty string) based on field semantics. Document the canonical representation.
