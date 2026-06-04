## Mutable vs Immutable DateTime Casts

Choosing between `datetime` (Carbon) and `immutable_datetime` (CarbonImmutable) for date casting.

---

## Decision Context

When casting date/time columns, you must choose between mutable Carbon and immutable CarbonImmutable.

---

## Decision Criteria

* whether date mutation could accidentally modify model state
* team experience with mutable Carbon bugs
* need for Carbon's mutable API (modify-in-place patterns)

---

## Decision Tree

Casting a date/time column?

↓

Could calling a mutating method like `->addDay()` on the attribute cause bugs?

YES (nearly always) → Use `immutable_datetime` or `immutable_date`

NO → Do you intentionally mutate the date object in place without marking dirty?

    Rare case → `datetime` is acceptable

    Default → Use `immutable_datetime`

---

## Rationale

Mutable Carbon objects cause subtle bugs: `$model->created_at->addDay()` mutates the model's internal date without marking it dirty, leaking state changes across the request. CarbonImmutable returns a new instance on every modification, preventing this.

---

## Recommended Default

**Default:** `immutable_datetime` for all datetime columns
**Reason:** Prevents accidental mutation bugs; safe by default

---

## Risks Of Wrong Choice

Accidental date mutation leaking state; hard-to-debug bugs where date values change unexpectedly.

---

## Related Rules

- Date cast immutability conventions (from date-time-casts standardized knowledge)

---

## Related Skills

- Date/time cast configuration (attributes-and-casting/06-skills.md)

---

## Date Serialization Strategy (Global vs Per-Model)

Choosing between overriding `serializeDate()` globally and formatting dates in each controller/view.

---

## Decision Context

When dates are serialized to JSON/API responses, you must decide where to define the format.

---

## Decision Criteria

* consistency requirements across the API
* whether different endpoints need different date formats
* whether a base model class is used

---

## Decision Tree

Need consistent date format in API responses?

↓

Is there a base model class used by all models?

YES → Override `serializeDate()` in the base model (single source of truth)

NO → Override `serializeDate()` on each model that needs custom format

    Do different endpoints need different date formats?

    YES → Format dates at the controller/API resource level instead of model

---

## Rationale

Overriding `serializeDate()` in a base model provides consistent ISO 8601 or custom format across the entire API. Per-controller formatting is needed when different endpoints require different date representations.

---

## Recommended Default

**Default:** Override `serializeDate()` in a base model for consistent API-wide format
**Reason:** Single source of truth, prevents format inconsistencies across endpoints

---

## Risks Of Wrong Choice

Inconsistent date formats across API responses; missing serialization override causes default ISO 8601 when another format is expected.
