## withExists vs withCount vs with

Choosing between `withExists()` (boolean), `withCount()` (integer), and `with()` (full models) for checking relationship presence.

---

## Decision Context

When you need to know whether a model has related records, you must choose between three approaches with different performance and information characteristics.

---

## Decision Criteria

* whether you need a boolean answer (exists y/n) or a count (how many)
* whether you need the actual related models
* whether you need to filter the parent query by existence (`whereHas`)
* cardinality of the related table (few vs many rows per parent)

---

## Decision Tree

Need to know about related records?

↓

Do you need the actual related models to work with?

YES → `with()` — eager load the related models

NO → Do you need to know how many (cardinality)?

    YES → `withCount()` — integer count

    NO → Do you only need yes/no (does any exist)?

        YES → `withExists()` — most efficient (EXISTS subquery short-circuits)

        NO → Do you need to filter parents by existence?

            YES → `whereHas()` / `orWhereHas()` — filters parent query

            NO → `withExists()` — boolean annotation

---

## Rationale

`withExists()` uses `EXISTS (SELECT 1 ... LIMIT 1)` which short-circuits on the first matching row. `withCount()` must count all matching rows. For boolean checks, `withExists()` is always faster, with the advantage growing with related-table cardinality.

---

## Recommended Default

**Default:** `withExists()` for boolean checks; `withCount()` when cardinality matters; `with()` when full models needed
**Reason:** EXISTS short-circuits on first match — halving query time vs COUNT

---

## Risks Of Wrong Choice

`withCount()` for boolean checks wastes database work on full count scans; `with()` for presence check loads entire collections needlessly; `withExists()` returns boolean, not integer — confuses code expecting `> 0`.

---

## Related Rules

- Index the foreign key column for EXISTS performance (from with-exists standardized knowledge)

---

## Related Skills

- withExists() usage with constraints (relationships/06-skills.md)
- loadExists() for deferred checks (relationships/06-skills.md)
