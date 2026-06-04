## Scoped Relationship vs Base Relationship + Runtime Constraint

Choosing between defining a relationship with pre-applied constraints (scoped) and keeping a base relationship with runtime constraints via `with()` closures.

---

## Decision Context

When a relationship often needs the same constraints (e.g., only approved comments, only recent posts), you must decide whether to encode those constraints at definition time (scoped) or apply them at query time.

---

## Decision Criteria

* whether the constraint applies to EVERY access to the relationship
* whether an unscoped (base) version is also needed
* whether the constraint varies by request context
* whether the constraint is a domain concept (approved comments) vs ad-hoc filter (posts since a date)

---

## Decision Tree

Defining a relationship that often needs constraints?

↓

Is the constraint a domain concept (always applies for the relationship's semantics)?

YES → Define a scoped relationship with a descriptive name: `approvedComments()`, `recentPosts()`

Is the base (unscoped) relationship also needed?

YES → Keep both: `comments()` (all) + `approvedComments()` (filtered)

NO → Only the scoped variant is needed

NO → Does the constraint vary by request/context?

    YES → Use base relationship + runtime constraint via `with(['rel' => fn($q) => ...])`

    NO → Is this a "latest" or "best of" singular relationship?

        YES → Use `latestOfMany()` / `oldestOfMany()` / `ofMany()` on HasOne

        NO → Define scoped relationship (definition-time constraint)

---

## Rationale

Scoped relationships encode constraints at definition time, making them always-applied and non-overridable. This is ideal for domain-specific relationship variants but limits flexibility. Runtime constraints via `with()` closures are request-specific and composable.

---

## Recommended Default

**Default:** Base relationship + runtime constraints; scoped only for domain-specific named variants
**Reason:** Base relationships are more flexible; scoped relationships multiply methods and can't be overridden

---

## Risks Of Wrong Choice

Scoped without base hides data (no unfiltered access); runtime-only constraints mean no named, reusable relationship variant; `ofMany` on BelongsTo causes runtime error.

---

## Related Rules

- Scoped relationships need descriptive names (from scoped-relationships standardized knowledge)
- Base relationship should always exist alongside scoped variants

---

## Related Skills

- Scoped relationship definition (relationships/06-skills.md)
- Runtime constraint application via with() closures (relationships/06-skills.md)
