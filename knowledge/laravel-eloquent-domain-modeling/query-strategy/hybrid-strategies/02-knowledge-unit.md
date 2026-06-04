# Hybrid Strategies

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Hybrid Strategies combine Eloquent's expressive query-building capabilities with Query Builder's performance characteristics. The core idea is to use Eloquent for query composition (scopes, relationships, conditional clauses) while controlling result hydration to avoid unnecessary overhead. Key patterns include: using Eloquent scopes on a Query Builder query, mixing `toBase()` with model-aware query construction, manually hydrating Query Builder results, and building queries through the Eloquent API while executing via Query Builder. Hybrid strategies are essential for applications that need both domain expressiveness and performance at scale.

## Core Concepts
- **Eloquent + Query Builder composition** — using Eloquent's builder API (scopes, `when()`, `with()`) with `toBase()` to skip hydration
- **Scope reuse on Query Builder** — applying Eloquent scope methods to a `DB::table()` query
- **Manual Hydration** — converting `stdClass` rows to Model instances only when needed
- **Builder Unification** — mixing `DB::raw()` expressions within Eloquent query chains
- **Partial Hydration** — hydrating only specific models from a result set (e.g., joining a related table but only hydrating the parent)
- **Query Object Pattern** — encapsulating hybrid query logic in dedicated query classes

## Mental Models
- **Hybrid as Ratio** — think of every query as a mixture of Eloquent and QB features; the ratio shifts based on context
- **Onion Layers** — outermost layer: Eloquent for expressiveness; middle layer: builder methods for constraints; inner core: raw SQL for performance
- **Convenience vs Control Spectrum** — at one end: pure Eloquent (max convenience); at the other: pure SQL (max control); hybrid lives in the middle

## Internal Mechanics
Hybrid strategies work because Eloquent Builder ultimately delegates to Query Builder. The key insight is that you can:
1. Access the underlying Query Builder anytime via `$eloquentBuilder->getQuery()`
2. Reset it with `$eloquentBuilder->setQuery($queryBuilder)`
3. Use `toBase()` to create a clone of the builder configured for base results
4. Call `Model::hydrate($rows)` to manually convert `stdClass` arrays to Model instances

The `toBase()` method:
```php
public function toBase()
{
    return $this->getQuery()->from($this->query->from);
}
```

Note: `toBase()` does NOT preserve scopes, eager loads, or other Eloquent-specific builder state — it only preserves the underlying Query Builder constraints.

## Patterns
- **Scoped Query Builder** — define a scope on a model, then apply it to a Query Builder query by extracting the `toBase()` result:
```php
$baseQuery = User::active()->where('role', 'admin')->toBase();
$results = DB::table(DB::raw("({$baseQuery->toSql()}) as u"))
    ->mergeBindings($baseQuery)
    ->get();
```

- **Mixed Construction** — build constraint logic with Eloquent, then switch to QB for joins:
```php
$query = User::select('users.*')->where('active', true);
$query->getQuery()->join('orders', 'users.id', '=', 'orders.user_id');
$results = $query->toBase()->get();
```

- **Manual Hydration with toBase()** — use Eloquent builder features, skip hydration, then manually hydrate select rows:
```php
$raw = User::active()->with('posts')->toBase()->get();
// optionally hydrate only first result
$user = !empty($raw) ? User::hydrate([(array)$raw[0]])->first() : null;
```

- **Scope Reuse via Trait** — extract scope logic into a trait that can be used by both Eloquent models and dedicated query classes.

## Architectural Decisions
- **When to Go Hybrid** — when a query benefits from Eloquent's scopes/conditions but returns many rows where hydration overhead matters.
- **When Not to Go Hybrid** — when the added complexity (two abstraction layers) outweighs the performance gain; for simple queries with small result sets.
- **Abstraction Boundary** — keep hybrid logic inside repository or query-object classes; don't scatter hybrid patterns across controllers.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Access to Eloquent scopes + QB performance | Mixed abstraction level confuses some developers | Keep hybrid in repository/query object layer |
| Reuse existing scope logic in QB context | `toBase()` bypasses Eloquent builder features | Verify scopes work correctly with toBase() |
| Fine-grained control over hydration | Manual hydration is error-prone | Use `hydrate()` helper; avoid manual `new Model()` |
| Expressive query API with raw performance | Harder to test (need to check both SQL and data paths) | Test hybrid queries with `toSql()` assertion |
|  |  |  |

## Performance Considerations
- Hybrid strategies typically reduce overhead by 40-80% compared to pure Eloquent for large result sets (depending on cast complexity)
- The cost of `toBase()` is the cost of building the query minus hydration — most savings come from skipping model instantiation for every row
- Manual hydration of a few rows from a large result set costs only for those rows

## Production Considerations
- **Test both SQL and data** — verify that hybrid queries produce correct SQL AND correct data shapes; `toBase()` may skip scopes unintentionally
- **Log hybrid query paths** — tag queries with a marker (e.g., query comment) to distinguish hybrid paths from pure Eloquent paths in monitoring
- **Document the decision** — add code comments explaining why a hybrid approach was chosen (what performance requirement drove it)
- **Extract to Query Objects** — avoid inline hybrid logic; create dedicated `UserReportQuery` or `DashboardQuery` classes

## Common Mistakes
- **Forgetting `toBase()` loses scopes** — when converting a scoped Eloquent query to `toBase()`, the resulting Query Builder does NOT re-apply global scopes
- **Double hydration** — calling `get()` on a builder that already has `toBase()` applied (the `toBase()` call returns a Query Builder, not an Eloquent Builder; calling `get()` returns `stdClass`)
- **Accidental N+1 from manual loading** — manually hydrating models and then accessing lazy-loaded relationships triggers N+1
- **Mixing connection configurations** — using an Eloquent model's connection setting while executing through a different Query Builder connection can cause inconsistencies

## Failure Modes
- **Inconsistent scope application** — a global scope is applied to the Eloquent query, but `toBase()` returns the query BEFORE scope application if not careful with evaluation order
- **Missing eager loads** — `toBase()` does not execute `with()` eager loads; the join/subquery must be added explicitly to the underlying Query Builder
- **Binding position errors** — manually merging bindings with `mergeBindings()` can misorder bindings if the merge happens at the wrong point in SQL construction

## Ecosystem Usage
- **Laravel Excel (Maatwebsite)** — uses hybrid internally: Eloquent for query building, QB for actual row iteration during export
- **Spatie/QueryBuilder** — automatically applies scopes and filters while using the underlying builder efficiently
- **Laravel Nova** — uses hybrid for resource listing: Eloquent for authorization scoping, QB for efficient pagination queries
- **staudenmeir/eloquent-param-limit-bug-fix** — addresses hybrid binding edge cases in subquery joins

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Decision Framework, Performance Tradeoffs, To Base Pattern

### Related Topics
Local Scopes, Global Scopes, Custom Builder Pattern

### Advanced Follow-up Topics
Domain-Specific Query Methods, Conditional Clauses

## Research Notes
- **Source Analysis:** The `Eloquent\Builder` class has a `$query` property that holds the underlying `Query\Builder`. All methods that don't require hydration (where, orderBy, groupBy) delegate directly. Methods that require hydration (get, first, cursor) call the underlying QB and then hydrate results.
- **Key Insight:** The hybrid sweet spot is using Eloquent for query CONSTRUCTION (scopes, when(), relation constraints) and Query Builder for query EXECUTION (get, cursor, paginate). `toBase()` is the official bridge between these two phases.
- **Version-Specific Notes:** Laravel 9+ improved `toBase()` to preserve more builder state. Laravel 11 introduced `Model::query()->toBase()` as a supported pattern in documentation. The `mergeBindings()` method on Query Builder is the primary tool for combining binding arrays from multiple query sources.
