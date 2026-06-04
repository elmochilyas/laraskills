# Anti-Patterns: Local Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Local Scopes

## Anti-Patterns

### Side Effect Scopes
Performing logging, caching, or API calls inside scope methods. Scopes should be pure query constraint methods — side effects make them unpredictable and hard to test.

**Problem:** Side effects triggered on every scope invocation; unexpected behavior when scopes are called in unexpected contexts; testing complexity.

**Solution:** Limit scope methods to query constraining only. Perform side effects in separate, explicit code paths.

### Terminating Scopes
Calling `get()`, `first()`, `count()`, or `paginate()` inside a scope method. A scope that terminates the query breaks the fluent chain — any methods added after it won't be applied.

**Problem:** Broken fluent chaining; non-composable scopes; reduced testability; confusing API where some "scopes" return counts and others return builders.

**Solution:** Scopes must only constrain the query, not execute it. Terminal methods belong at the end of the full chain at the call site.

### Scope Obesity
20+ scopes on a single model. A model with too many scopes violates single responsibility and becomes difficult to navigate, test, and maintain.

**Problem:** Bloated model files; difficulty finding relevant scopes; reduced readability; scattering of query logic across the model class.

**Solution:** Extract scopes to a custom builder class when exceeding 15. Use `HasBuilder` trait (Laravel 10+) for registration.

### Trivial Scopes
Creating scopes for one-line constraints used only once — e.g., `scopeActive($q) { return $q->where('active', true); }` used in a single controller.

**Problem:** Unnecessary abstraction overhead; clutter on the model; increased file size without meaningful benefit.

**Solution:** Use inline `where()` for truly one-off constraints. Create a scope only when the constraint is used in 2+ places or expresses a meaningful domain concept.

### Hidden Complexity
A scope that adds 3 JOINs and a subquery without documentation. Developers calling the scope have no idea what SQL it generates.

**Problem:** Surprising query behavior; unexpected performance impact; difficulty understanding what the scope does without reading the implementation.

**Solution:** Document scopes that add JOINs, subqueries, or non-obvious constraints. Test scopes at the SQL level.

### Forgotten Return
Omitting the `return $q` statement in a scope method. The `?? $this` fallback silently swallows scope methods that do not return the builder.

**Problem:** Scope constraints silently ignored; queries returning unfiltered results; security filters bypassed; hours of debugging time wasted.

**Solution:** Always write an explicit `return $q` statement as the last line of every scope method.

### Technical Naming
Naming scopes after database column names (`whereStatusActive`) instead of domain concepts (`active`). Technical names expose database implementation details.

**Problem:** Code that reveals database structure; harder for non-technical team members to understand; naming inconsistency.

**Solution:** Name scopes using business domain terminology. `$query->active()` communicates business intent; `$query->whereActiveTrue()` leaks database implementation.
