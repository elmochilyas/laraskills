## Column Reduction Strategy (Select All vs Select Specific)

Choosing between loading all columns and using constrained `select()` to reduce data transfer.

---

## Decision Context

When eager loading with a constraint closure, you can reduce the columns selected from the related table to avoid loading unnecessary data.

---

## Decision Criteria

* whether the related table has large columns (BLOB, TEXT, JSON)
* number of related records loaded
* whether the foreign key is included in the select
* maintenance cost of listing columns explicitly

---

## Decision Tree

Eager loading a relationship with constrained loading?

↓

Does the related table have large columns (JSON, TEXT, BLOB) not needed in this context?

YES → Use column reduction: `->with(['relation' => fn($q) => $q->select('id', 'foreign_key', 'col1', 'col2')])`

    Is the foreign key included in the select?

    YES → Proceed

    NO → Add the foreign key — without it, relationship hydration breaks

NO → Select all columns is acceptable

---

## Rationale

Omitting the foreign key from a constrained `select()` is the most common constrained loading mistake. Eloquent needs the FK to match related records to their parents. Column reduction provides 10-100x memory savings when avoiding large columns, but adds maintenance cost.

---

## Recommended Default

**Default:** Select all columns unless large columns are present
**Reason:** Simpler code; only optimize when profiling shows a need

---

## Risks Of Wrong Choice

Memory bloat from loading large columns unnecessarily, broken hydration from missing FK in select.

---

## Related Rules

Related rules: Constrained select patterns (from standardized knowledge)

---

## Related Skills

Related skills: Prevent N+1 with strategic eager loading

---

## Per-Parent Limit Strategy (limit vs limitBy)

Choosing between `limit()` (global) and `limitBy()` (per-parent) for constrained eager loading.

---

## Decision Context

When you need to limit the number of related records loaded per parent, you must choose between the global `limit()` and the per-parent `limitBy()`.

---

## Decision Criteria

* whether you need per-parent or global total limits
* Laravel version (limitBy requires 8.52+)
* performance impact of window function in limitBy

---

## Decision Tree

Need to limit related records in eager loading?

↓

Do you need N records per parent or N records total?

Per-parent: `limitBy(N)` (Laravel 8.52+)

Global total: `limit(N)`

    Is this deterministic ordering important?

    YES → Pair `limit()` with `orderBy()` for consistent results

---

## Rationale

`limit()` applies globally — if you have 100 users and `limit(5)`, you get 5 posts total across all users. `limitBy()` uses window functions to apply the limit per parent group, giving 5 posts per user. Using `limit()` when per-parent is needed silently returns incomplete data.

---

## Recommended Default

**Default:** Use `limitBy()` for per-parent limiting (Laravel 8.52+)
**Reason:** Per-parent limits are almost always the intended behavior; global limits are rarely correct for relationship loading

---

## Risks Of Wrong Choice

Using `limit()` expecting per-parent behavior gives incomplete results; `limitBy()` on versions before 8.52 throws an error.

---

## Related Rules

Related rules: None specific from rules file

---

## Related Skills

Related skills: Prevent N+1 with strategic eager loading
