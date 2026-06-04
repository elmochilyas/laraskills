## Filtering Strategy (whereBelongsTo vs Manual FK)

Choosing between `whereBelongsTo()` and manual `where('fk', $value)` for filtering by parent.

---

## Decision Context

When filtering a query by a related model, you must decide whether to use the convenience `whereBelongsTo()` or write the FK condition manually.

---

## Decision Criteria

* desire to decouple from database schema
* whether the relationship name is unambiguous
* frequency of FK column name changes
* preference for explicit vs abstracted code

---

## Decision Tree

Need to filter by a parent model?

↓

Does the model have multiple BelongsTo relations to the same related model?

YES → Use `whereBelongsTo($model, 'explicit_name')` — avoid ambiguity

NO → Is FK column name stable and well-known?

    YES → Manual `where('fk', $value)` is fine (simpler, no relationship resolution overhead)

    NO (schema may change) → Use `whereBelongsTo($model)` (decouples from FK column name)

---

## Rationale

`whereBelongsTo($user)` introspects the BelongsTo relationship to find the FK column, generating identical SQL to a manual `where()` clause. It adds negligible overhead (microseconds) but improves maintainability when FK columns might change. The explicit relationship name is required when there are multiple BelongsTo paths to the same model.

---

## Recommended Default

**Default:** Use `whereBelongsTo()` when there are multiple BelongsTo relations to the same type; use manual `where()` for simple single-relationship cases
**Reason:** Balances clarity with abstraction; avoids ambiguity in complex models

---

## Risks Of Wrong Choice

Using `whereBelongsTo()` without explicit name on models with multiple BelongsTo to the same parent type may filter on the wrong FK; manual `where()` creates schema coupling.

---

## Related Rules

Related rules: From the KU content on `whereBelongsTo` conventions

---

## Related Skills

Related skills: Configure a BelongsTo relationship with foreign key conventions
