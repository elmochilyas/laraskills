# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Date Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Built-in Date Cast vs Manual Carbon::parse() in Accessor
* Decision 2: Mutable Carbon (`date`/`datetime`) vs Immutable Carbon (`immutable_date`/`immutable_datetime`)
* Decision 3: Custom Serialization Format vs Default ISO-8601

---

# Architecture-Level Decision Trees

---

## Decision 1: Built-in Date Cast vs Manual Carbon::parse() in Accessor

---

## Decision Context

Choose between using a built-in date cast (`date`, `datetime`, `timestamp`) on the model's `$casts` array or manually parsing dates with `Carbon::parse()` in an accessor.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the attribute a standard date/datetime/timestamp column in the database?
↓
YES → Built-in Date Cast (simpler, no custom code)
NO → Is the date stored in a non-standard format?
    YES → Manual `Carbon::parse()` or custom cast
    NO → Built-in Date Cast
→ In both cases: does the date need timezone conversion?
    YES → Built-in cast handles hydration; convert timezone at boundary with `->tz()`
    NO → Built-in Date Cast

---

## Rationale

Built-in date casts handle hydration into Carbon instances, serialization, and timezone conversion with zero custom code. Manual `Carbon::parse()` in accessors duplicates framework capability and creates inconsistency.

---

## Recommended Default

**Default:** Built-in date cast for all standard date/datetime/timestamp columns.
**Reason:** Built-in casts handle hydration, serialization, and timezone conversion automatically. No custom code needed.

---

## Risks Of Wrong Choice

* Manual `Carbon::parse()`: duplicated framework logic, inconsistent date handling across models, serialization must be handled separately

---

## Related Rules

* Use built-in date casts over manual Carbon instantiation (`05-rules.md` Skill 1)

---

## Related Skills

* Configure Date Casting with Custom Format (`06-skills.md` Skill 1)

---

## Decision 2: Mutable Carbon vs Immutable Carbon

---

## Decision Context

Choose between mutable Carbon instances (`date`/`datetime` casts) and immutable Carbon instances (`immutable_date`/`immutable_datetime` casts).

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the date attribute need to be modified after loading?
↓
YES → Does the modification need to be tracked by Eloquent's dirty detection?
    YES → Mutable Carbon (changes via `->addDay()` tracked automatically)
    NO → Mutable Carbon (convenience of fluent mutation API)
NO → Is defensive coding against mutation side effects important?
    YES → Immutable Carbon (prevents accidental mutation)
    NO → Mutable Carbon (default, familiar API)

---

## Rationale

Mutable Carbon instances are the default and allow fluent date manipulation with automatic dirty detection. Immutable variants prevent accidental modification of date values, which is valuable when dates are shared across multiple consumers within a request.

---

## Recommended Default

**Default:** Mutable `datetime` cast for most attributes. Immutable `immutable_datetime` when defensive coding against mutation is a priority.
**Reason:** Mutable Carbon is the standard Laravel convention and integrates with dirty detection. Immutable variants protect against accidental mutation but require explicit reassignment for changes.

---

## Risks Of Wrong Choice

* Mutable dates shared across consumers: accidental mutation causing subtle bugs, unexpected date changes
* Immutable dates needing modification: must reassign to model, slightly more verbose, no dirty detection for fluent changes

---

## Related Rules

* Use immutable variants for defensive coding (`05-rules.md` Skill 3)

---

## Related Skills

* Configure Date Casting with Custom Format (`06-skills.md` Skill 1)

---

## Decision 3: Custom Serialization Format vs Default ISO-8601

---

## Decision Context

Choose between a custom date serialization format or the default ISO-8601 format when casting dates to JSON/array.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the API consumer require a specific date format?
↓
YES → Custom format in the cast: `'datetime:Y-m-d H:i:s'`
NO → Is the default Carbon serialization (ISO-8601) acceptable?
    YES → Default format (omit format string)
    NO → Does only the frontend/export need a different format?
        YES → Keep default cast; format at the view/resource boundary
        NO → Custom format in the cast

---

## Rationale

Default ISO-8601 serialization (`2026-06-03T12:00:00.000000Z`) is the standard for API communication. Custom formats should be specified in the cast only when the API contract requires a different format. Presentation-level formatting belongs in Blade views or API resources.

---

## Recommended Default

**Default:** Default ISO-8601 format. Add custom format string only when the API contract requires it.
**Reason:** ISO-8601 is the universal standard for machine-to-machine date communication. Formatting for human readability should happen at the presentation layer.

---

## Risks Of Wrong Choice

* Custom format for all dates: inconsistent API responses, breaking changes for consumers, unnecessary coupling to presentation format
* Default format everywhere: some consumers may require specific formats, adding conversion overhead

---

## Related Rules

* Format dates explicitly at boundaries, not globally (`05-rules.md` Skill 4)

---

## Related Skills

* Configure Date Casting with Custom Format (`06-skills.md` Skill 1)
