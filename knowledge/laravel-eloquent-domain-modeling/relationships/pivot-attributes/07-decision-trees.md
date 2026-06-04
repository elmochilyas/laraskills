## withPivot + Generic Pivot vs Custom Pivot Model

Choosing between using `withPivot()` to whitelist extra columns on a generic pivot and creating a custom pivot model with casting and behavior.

---

## Decision Context

When a many-to-many pivot table has extra columns beyond the two foreign keys, you must decide how to access and manage those attributes.

---

## Decision Criteria

* whether pivot attributes need type casting (dates, enums, JSON)
* whether pivot attributes need accessors/mutators
* whether pivot columns are read-only or also writable
* number of extra pivot columns (1-2 vs 5+)
* whether the pivot needs its own relationships

---

## Decision Tree

Many-to-many pivot with extra columns?

↓

Do you need type casting (e.g., Carbon dates, enum, JSON) on pivot attributes?

YES → Use Custom Pivot Model (extends Pivot) with `$casts`

NO → Are there accessors or mutators needed for pivot attributes?

    YES → Custom Pivot Model with accessors

    NO → Does the pivot need its own relationships to other models?

        YES → Custom Pivot Model with relationship methods

        NO → Is this a polymorphic many-to-many?

            YES → Custom Pivot Model extending MorphPivot (not Pivot)

            NO → Generic Pivot with `withPivot()` is sufficient

            Are timestamps needed on the pivot?

            YES → Add `->withTimestamps()`

            NO → Just `->withPivot('col1', 'col2')`

---

## Rationale

Generic pivots return raw values without casting. For dates, enums, and complex types, a custom pivot model with `$casts` is necessary. Custom pivot models also enable accessors, mutators, and relationships on the pivot itself. For simple extra columns without casting needs, `withPivot()` is sufficient.

---

## Recommended Default

**Default:** Generic pivot with `withPivot()` for simple attributes; custom pivot model when casting or behavior is needed
**Reason:** Custom pivot models add class overhead; generic pivot is simpler for raw column access

---

## Risks Of Wrong Choice

Generic pivot without `withPivot()` returns null for extra columns; custom pivot model for raw integers is over-engineering; `MorphPivot` extension required for polymorphic pivots (Pivot base won't work).

---

## Related Rules

- Custom morph pivot models MUST extend MorphPivot, not Pivot (from morph-pivot standardized knowledge)

---

## Related Skills

- withPivot() whitelisting (relationships/06-skills.md)
- Custom pivot model creation and casting (relationships/06-skills.md)
- syncWithPivotValues() usage (relationships/06-skills.md)
