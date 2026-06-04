# Anti-Patterns: Constrained Eager Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Constrained Eager Loading

## Anti-Patterns

### Global Limit Instead of Per-Parent
Using `limit(5)` in a constrained loading closure expecting 5 related records per parent. `limit()` is global — it limits the total rows returned, not per-parent.

**Problem:** Only 5 total related records returned across all parents, not 5 per parent.

**Solution:** Use `limitBy()` (Laravel 8.52+) for per-parent limiting.

### No Foreign Key in Select
Omitting the foreign key from a constrained `select()` call during column reduction. Eloquent needs the FK to match related models to their parents — without it, hydration breaks.

**Problem:** Broken relationship hydration — related models cannot be matched to parents.

**Solution:** Always include the foreign key (and morph type for polymorphic) in any constrained `select()` call.

### Unnecessary Constraints
Adding `where` clauses in constrained loading closures that match 99% of related rows. The constraints add query overhead without meaningful data reduction.

**Problem:** Query overhead without benefit — constraints don't reduce the result set meaningfully.

**Solution:** Only apply constraints that actually reduce the number of loaded related records.

### Duplicate Constraint Closures
Duplicating the same constraint closure across multiple queries instead of extracting it to a named scope on the related model.

**Problem:** Code duplication, inconsistency risk, harder maintenance.

**Solution:** Extract reusable constraint logic to query scopes on the related model.

### Limit Without OrderBy
Using `limit()` inside a constrained loading closure without `orderBy()`. Without ordering, which records are kept is non-deterministic.

**Problem:** Non-deterministic results — different queries may return different related records.

**Solution:** Always pair `limit()` with `orderBy()` for deterministic results.

### Constraint in $with
Expecting `$with` on the model to support constraint closures. The `$with` property only accepts relationship name strings — it cannot use constrained loading.

**Problem:** Cannot filter, limit, or select columns on `$with` relationships.

**Solution:** Use explicit `with()` with constraint closures at the query site instead of `$with`.
