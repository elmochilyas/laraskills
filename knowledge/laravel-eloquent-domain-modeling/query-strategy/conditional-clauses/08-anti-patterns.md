# Anti-Patterns: Conditional Clauses

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Conditional Clauses

## Anti-Patterns

### Hidden Conditions
Using `when()` with a condition that is always true or always false — e.g., `when(true, fn($q) => $q->where('x', 1))`. This adds unnecessary indirection and obscures the fact that the constraint is unconditional.

**Problem:** Wraps a fixed constraint behind a condition that never varies, confusing readers about whether the condition serves a purpose.

**Solution:** Use explicit constraint methods for unconditional filters. Reserve `when()` for genuinely runtime-determined conditions.

### Side Effect Callbacks
Performing logging, caching, API calls, or other side effects inside `when()` closures. `when()` callbacks should be pure query builders.

**Problem:** Side effects obscure the query construction intent, make testing harder, and violate separation of concerns.

**Solution:** Keep `when()` callbacks limited to query-constraining logic. Perform side effects (logging, caching) in separate, explicit code paths.

### Nested When Spaghetti
Deeply nested `when()` chains exceeding 3 levels: `when(a, fn => when(b, fn => when(c, ...)))`. Each level adds branching complexity that obscures the final SQL structure.

**Problem:** Unreadable filter chains that no developer can confidently modify; high defect rates in filter logic.

**Solution:** Extract nested conditional logic into named methods, separate query objects, or a filter strategy class with one method per concern.

### Unnecessary When
Using `when()` for every single constraint, including ones that are always applied. This creates "condition pollution" where the chain is cluttered with unnecessary conditionals.

**Problem:** Reduces readability for no benefit; the condition check itself adds closure overhead for every constraint.

**Solution:** Use explicit `where()` for fixed constraints. Reserve `when()` for constraints whose application depends on runtime data.

### Condition Pollution
Using `when()` for constraints that are always applied but wrapped "just in case." This clutters the chain with unnecessary conditionals that obscure the actual runtime-dependent logic.

**Problem:** Makes it harder to distinguish between fixed constraints and conditional ones; increases cognitive load.

**Solution:** Apply fixed constraints directly. Use `when()` only when the condition genuinely varies at runtime.

### Forgotten Return in Callback
Omitting the explicit `return $q` inside a `when()` callback. The `?? $this` fallback silently swallows `void` returns, causing the constraint to be silently dropped.

**Problem:** Filter constraints silently ignored; security filters bypassed; hours of debugging time wasted on "missing" filters.

**Solution:** Always write an explicit `return $q` statement inside every `when()` and `unless()` callback.
