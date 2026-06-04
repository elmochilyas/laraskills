## withDefault vs Null Checks vs API Default

Choosing between `withDefault()` on a relationship, manual null checks in code, or providing defaults at the API/serialization layer.

---

## Decision Context

When a relationship may not have a related record (optional BelongsTo/HasOne), you must decide whether to return a default model instance or allow null.

---

## Decision Criteria

* whether null is a meaningful distinction from a default (e.g., "no author" vs "guest author")
* how many places in the codebase access this relationship
* whether serialization should always include the relationship key
* whether the default depends on parent model attributes (dynamic)
* whether the relationship is HasMany/BelongsToMany (unsupported)

---

## Decision Tree

Optional singular relationship (may return null)?

↓

Is it important to distinguish "no relation" from "null/default"?

YES → No withDefault — let it return null, handle null checks

NO → Is the relationship accessed in many places (repetitive null checks)?

    YES → Consider withDefault to centralize fallback

    Is the default value static?

    YES → `->withDefault(['name' => 'Guest'])` — array defaults

    NO → Does the default depend on parent model attributes?

        YES → `->withDefault(fn($parent) => ...)` — callable default

        NO → `->withDefault()` — bare default instance

    NO → Is the null value only a concern at the API/serialization level?

        YES → Handle in JSON resource / API response layer (no withDefault)

---

## Rationale

`withDefault()` implements the Null Object pattern at the ORM layer, eliminating null checks everywhere. However, it masks the distinction between "no record" and "default value," which can hide data integrity issues. Use it when the default is a valid domain concept.

---

## Recommended Default

**Default:** No withDefault for most cases; withDefault only when the relationship is always expected to be present (settings, guest author)
**Reason:** Null is semantically meaningful; withDefault masks missing data and changes serialization behavior

---

## Risks Of Wrong Choice

withDefault on every optional relationship masks data loss; no withDefault with 50 null checks creates fragile, repetitive code; callable defaults with DB queries in hot paths cause performance issues.

---

## Related Rules

- Default model has `$exists = false` — check this to distinguish (from default-models standardized knowledge)

---

## Related Skills

- withDefault() array, callable, and bare usage (relationships/06-skills.md)
- exists flag checking on default models (relationships/06-skills.md)
