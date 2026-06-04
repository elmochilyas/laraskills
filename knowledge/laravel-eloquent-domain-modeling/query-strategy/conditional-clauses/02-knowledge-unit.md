# Conditional Clauses

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Conditional clauses — `when()` and `unless()` — solve the problem of composing queries whose constraints depend on runtime conditions (e.g., request filters, user permissions, feature flags). Instead of building imperative if/else trees that break the fluent chain, these methods accept a condition and a closure that is invoked only when the condition is met. This keeps query composition declarative, testable, and chainable. The pattern is foundational for building filter APIs, search endpoints, and permission-aware queries.

## Core Concepts
- **`when(condition, callback [, default])`** — if condition is truthy, invokes the callback with the builder; otherwise invokes the default if provided
- **`unless(condition, callback [, default])`** — invert of when: invokes callback when condition is falsy
- **Truthiness evaluation** — condition can be a boolean, a callable, or any value; callables receive the builder
- **Return value protocol** — the callback must return the builder instance for chaining to continue
- **Condition carry** — the condition value is passed as the second argument to the callback, enabling use in the closure

## Mental Models
- **Conditional Gate** — think of `when` as a gate that either lets the constraint pass through or skips it entirely
- **Fluent If-Statement** — replaces `if (condition) { $query->where(...); } return $query;` with a single chainable method
- **Filter Pipeline** — sequence of `when` calls forms a filter pipeline where each condition independently decides whether to apply

## Internal Mechanics
`when()` is implemented on `Illuminate\Database\Eloquent\Builder` (and available on Query Builder through the `Builder::macro` system). The implementation is approximately:

```php
public function when($value, $callback, $default = null)
{
    if ($value) {
        return $callback($this, $value) ?? $this;
    } elseif ($default) {
        return $default($this, $value) ?? $this;
    }
    return $this;
}
```

Key detail: the return value of `$callback` is checked with `?? $this`, meaning the callback can return `void` (e.g., no explicit return) and the builder is still returned. This makes the pattern forgiving but can mask bugs where a callback modifies a different builder instance.

## Patterns
- **Filter Search** — `$query->when($request->filled('status'), fn($q) => $q->where('status', $request->status))`
- **Scope Application** — combine `when` with boolean flags: `$query->when($includeArchived, fn($q) => $q->withoutGlobalScope(SoftDeletingScope::class))`
- **Nested Conditionals** — chain multiple `when` calls for independent filter dimensions: status filter, date range filter, search term filter
- **Default Fallback** — provide a default closure that runs when the condition is false: `->when($sort, ..., fn($q) => $q->orderBy('created_at', 'desc'))`
- **Callable Conditions** — pass a closure as condition for deferred evaluation: `->when(fn() => Auth::user()->isAdmin(), ...)`

## Architectural Decisions
- **Why Not Just If-Statements?** — imperatives break the fluent chain, require extracting the builder to a variable, and make filter composition harder to test and refactor.
- **Why Callbacks Instead of Strings?** — closures provide type safety and access to scope; string conditions would require parsing and limit expressiveness.
- **Why `?? $this` Fallback?** — allows callbacks with no return statement to work, making the API more forgiving at the cost of hiding unintentional void returns.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Maintains fluent chaining | Callback overhead for every condition | Use for readability; skip for hot paths with millions of iterations |
| Declarative filter pipeline | Can mask bugs (forgotten return, wrong builder) | Always return `$q` from callbacks explicitly |
| Condition value passed to callback | Slightly magical; hard to grep for conditions | Prefer `$request->filled()` as condition over raw request access |
|  |  |  |

## Performance Considerations
- `when()` overhead is negligible — a single closure invocation per condition
- For extremely hot loops (processing thousands of queries per request), precompute conditions outside the builder chain
- Closure allocation is cheap; PHP 8+ JIT eliminates most overhead

## Production Considerations
- **Explicit returns** — always `return $q` from callbacks; forgetting the return silently skips the constraint
- **Log filter usage** — tag queries with applied filters for observability and debugging
- **Validate condition inputs** — sanitize user-provided filter values before passing them to `when()`
- **Prefer `filled()` over `isset()`** — `$request->filled()` rejects empty strings, which avoids applying filters with no actual value

## Common Mistakes
- **Forgetting `return $q`** — the most common bug; callback returns null and builder is returned unchanged
- **Modifying external builder** — capturing a different builder instance inside the callback and modifying it instead of `$q`
- **Non-boolean conditions** — passing a collection as condition (always truthy); casting unintentionally
- **Nested `when` without clarity** — deep nesting of `when` inside `when` reduces readability; extract to named methods

## Failure Modes
- **Silent query omission** — a condition that is always false (due to typo) means the intended filter is never applied, potentially leaking data
- **Unintended eager condition** — a truthy condition like `when($request->status, ...)` where status is `""` (empty string) passes as truthy in PHP
- **Condition evaluation order** — conditions are evaluated in chain order; moving a `when()` call changes the resulting SQL

## Ecosystem Usage
- **Spae/QueryBuilder** — popular package that exposes `allowedFilters()`, `allowedSorts()`, etc., building on top of conditional clause patterns
- **Laravel Nova** — uses `when()` internally for filter application on resource queries
- **Laravel Filament** — table filters apply conditions using `when()` patterns under the hood

## Related Knowledge Units

### Prerequisites
Builder Fundamentals (chaining, constraint methods)

### Related Topics
Local Scopes, Dynamic Scopes, Decision Framework

### Advanced Follow-up Topics
Hybrid Strategies, Custom Builder Pattern, Domain-Specific Query Methods

## Research Notes
- **Source Analysis:** Defined in `Illuminate\Database\Concerns\BuildsQueries` trait, used by both Eloquent Builder and Query Builder.
- **Key Insight:** `when()` with a callable condition (`fn() => ...`) enables lazy evaluation of expensive permission checks or feature-flag lookups.
- **Version-Specific Notes:** Laravel 10+ improved type inference for `when()` closures in IDE autocompletion by adding `@template` annotations. `unless()` was deprecated in some internal use but remains available on the builder.
