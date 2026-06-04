## Aggregation Method (withCount vs withExists vs with)

Choosing between count, existence check, and full relationship loading for aggregate data.

---

## Decision Context

When you need information about a related set, you must choose how granular the information needs to be: just a yes/no, a count, or the full related models.

---

## Decision Criteria

* whether actual model data is needed
* whether a count integer is sufficient
* whether only a boolean existence check is needed
* performance of subquery vs model hydration

---

## Decision Tree

Need information about related records?

↓

Do you need the actual related models (with their attributes)?

YES → Use `with('relation')` — hydrate full models

NO → Do you need the exact count (number of children)?

    YES → Use `withCount('relation')`

        Do you need a filtered count (e.g., only approved)?

        YES → `withCount(['relation' => fn($q) => $q->where('approved', true)])`

    NO (just need yes/no) → Use `withExists('relation')` — more efficient than withCount

---

## Rationale

`withExists()` generates a boolean subquery (EXISTS/NOT EXISTS), which is faster than COUNT. `withCount()` generates a COUNT subquery, which is faster than loading full models. Loading full models just to count them is the most expensive option. Choose the cheapest method that provides the needed information.

---

## Recommended Default

**Default:** `withCount()` when you need an actual count; `withExists()` when you only need yes/no
**Reason:** Both avoid model hydration; `withExists` is cheaper than `withCount` for boolean checks

---

## Risks Of Wrong Choice

Loading full models just to count them wastes memory; using `withCount()` when only existence is needed adds unnecessary COUNT overhead; using `withExists()` when a count is needed provides insufficient data.

---

## Related Rules

- HasMany-Use-WithCount-Over-Load (has-many/05-rules.md)

---

## Related Skills

- Count children without loading them (has-many/06-skills.md)

---

## Constrained vs Unconstrained Counts

Choosing between counting all related records and counting a filtered subset.

---

## Decision Context

When using `withCount()`, you may need to count only specific subsets of related records rather than all of them.

---

## Decision Criteria

* whether the count needs to be filtered
* whether the relationship has soft deletes
* number of distinct count variations needed
* complexity of the filter constraint

---

## Decision Tree

Counting related records?

↓

Do you need to count all related records (no filter)?

YES → `withCount('relation')`

NO → Do you need to count a subset?

    YES → `withCount(['relation' => fn($q) => $q->where(...)])`

    Does the relationship use soft deletes?

    YES → Add `->whereNull('deleted_at')` in the constraint if trashed shouldn't count

    Need multiple different counts on the same relation?

    YES → Use multiple named constraints: `withCount(['comments', 'comments as approved_comments_count' => fn($q) => $q->where('approved', true)])`

---

## Rationale

Unconstrained `withCount()` counts all related records. Constraint callbacks allow counting only matching subsets. Multiple counts on the same relationship are possible with named aliases. Soft-deleted relations require explicit constraints to exclude trashed records.

---

## Recommended Default

**Default:** Use unconstrained `withCount()` for total counts; constrain only when filtered subsets are needed
**Reason:** Simpler query; only add constraints when domain logic requires filtered counts

---

## Risks Of Wrong Choice

Forgetting to constrain for soft deletes (counts include trashed records), adding unnecessary constraints that return the same result as unconstrained.
