# Hybrid Strategies — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Hybrid Strategies
- **ECC Version:** 1.0

## Overview
Hybrid Strategies combine Eloquent's expressive query-building API with Query Builder's performance characteristics. Key patterns include: using Eloquent scopes with `toBase()` to skip hydration, applying Eloquent scope logic to `DB::table()` queries, manually hydrating only select rows, and mixing `DB::raw()` within Eloquent chains. Hybrid strategies bridge the gap between expressiveness and performance for applications at scale.

## Core Concepts
- `toBase()`: Eloquent builder API → Query Builder execution (skips hydration)
- Direct QB access: `$eloquentBuilder->getQuery()` to access the underlying Query Builder
- Manual Hydration: `Model::hydrate(array $rows)` to convert stdClass arrays to Model instances
- Scope Reuse: extracting scope logic to traits usable in both Eloquent and QB contexts
- Binding Management: `mergeBindings()` for combining binding arrays from Eloquent and QB
- Query Object Pattern: encapsulating hybrid query logic in dedicated classes

## When To Use
- Queries benefiting from Eloquent scopes/conditions but returning many rows where hydration matters
- Reporting/export endpoints that need model scopes but not per-row model features
- Migrating from pure Eloquent to optimized queries incrementally
- CQRS-inspired architectures with read models that need partial Eloquent features
- Reusing existing scope logic in a new Query Builder context

## When NOT To Use
- Do NOT go hybrid for simple queries with small result sets — complexity outweighs gain
- Do NOT go hybrid when `toBase()` loses critical scope behavior — verify scope timing first
- Do NOT go hybrid when eager loads (`with()`) are essential — `toBase()` does not preserve them
- Do NOT use hybrid patterns scattered across controllers — encapsulate in query objects
- Do NOT manually hydrate large result sets — defeats the purpose of skipping hydration

## Best Practices (WHY)
- Encapsulate hybrid logic in query-object or repository classes, not controllers
- Use `toBase()` as the primary hybrid tool — it's the simplest bridge between Eloquent and QB
- Verify scope behavior with `toBase()` — test that global scopes are applied as expected
- Use `Model::hydrate()` for selective hydration of individual rows from raw result sets
- Document why a hybrid approach was chosen (what performance requirement drove it)
- Tag hybrid query paths in monitoring to distinguish from pure Eloquent paths

## Architecture Guidelines
- Keep hybrid logic in dedicated classes (`UserReportQuery`, `DashboardQuery`)
- Use traits for scope logic that must work in both Eloquent and QB contexts
- Prefer `toBase()` over raw `DB::table()` — it preserves more Eloquent builder state
- Test both the SQL output and the data shape of hybrid queries
- Establish a team convention: "Hybrid in repositories, pure Eloquent in controllers"

## Performance
- Hybrid reduces overhead by 40-80% vs pure Eloquent for large result sets (depends on casts)
- `toBase()` eliminates per-row hydration (2-5µs/row) while preserving query construction
- Manual hydration costs only for the rows you hydrate, not the entire result set
- `toBase()` + `chunk()` is the most memory-efficient hybrid pattern for large exports

## Security
- `toBase()` may skip global scopes that enforce security boundaries — verify before using
- Manual hydration bypasses attribute casting — ensure raw data types match expectations
- `mergeBindings()` can misorder bindings — test the compiled SQL
- Eager loads are lost with `toBase()` — manually add joins/subqueries for relationship data
- Document which security scopes are preserved and which are bypassed

## Common Mistakes
- Forgetting `toBase()` loses scopes — not all scopes are applied at the same point in the chain
- Double hydration: calling `get()` on a builder that already has `toBase()` applied
- Accidental N+1 from manually hydrating models and then accessing lazy-loaded relationships
- Mixing connection configurations between Eloquent and QB connections
- Binding position errors with `mergeBindings()` — test the compiled SQL
- Scattering hybrid patterns across controllers instead of encapsulating

## Anti-Patterns
- **Hybrid Sprawl**: inline `toBase()` calls scattered across 20 controllers instead of in query objects
- **Expensive Hydration**: calling `hydrate()` on 10k+ rows — defeats the purpose of skipping hydration
- **Lost Scopes**: assuming all global scopes work transparently with `toBase()` without verification
- **Ignored Eager Loads**: using `with()` then `toBase()` and wondering why relations aren't loaded
- **Manual Raw**: dropping to raw `DB::raw()` when `toBase()` would suffice

## Examples
```php
// Primary hybrid pattern: toBase()
$rawUsers = User::active()
    ->where('role', 'admin')
    ->toBase()
    ->get(); // stdClass, not models

// Selective manual hydration
$raw = User::where('active', true)->toBase()->get();
$firstUser = !empty($raw)
    ? User::hydrate([(array)$raw[0]])->first()
    : null;

// Mix Eloquent with QB join
$query = User::select('users.*')->where('active', true);
$query->getQuery()->join('orders', 'users.id', '=', 'orders.user_id');
$results = $query->toBase()->get();

// Scope reuse (extract to trait)
trait UserScopeTrait {
    public function scopeActive($q) { $q->where('active', true); }
    public function scopeVerified($q) { $q->whereNotNull('email_verified_at'); }
}
class User extends Model { use UserScopeTrait; }
// Can't use trait directly on QB, but can apply manually:
$query = DB::table('users')->where('active', true)->whereNotNull('email_verified_at');

// Query object pattern
class ActiveUsersReportQuery {
    public function get(): array {
        return User::active()
            ->verified()
            ->toBase()
            ->get();
    }
}
```

## Related Topics
- To Base Pattern — the foundation of hybrid strategies
- Decision Framework — choosing between Eloquent, hybrid, and QB
- Performance Tradeoffs — understanding when hybrid optimization matters
- Custom Builder Pattern — combining hybrid strategies with custom builders

## AI Agent Notes
- `toBase()` is the primary hybrid tool — prefer it over raw `DB::table()`
- Always verify that global scopes are applied when using `toBase()`
- Eager loads (`with()`) are lost with `toBase()` — convert to joins/subqueries
- Encapsulate hybrid patterns in query objects, not inline in controllers
- Test both SQL output and data shape for hybrid queries

## Verification
- [ ] `toBase()` used instead of `DB::table()` where Eloquent builder features are needed
- [ ] Global scope behavior verified with `toBase()`
- [ ] Eager loads converted to explicit joins or subqueries when using `toBase()`
- [ ] Hybrid logic encapsulated in query objects or repository classes
- [ ] SQL output verified with `toSql()` for hybrid chains
- [ ] Binding positions verified with `toRawSql()`
- [ ] Performance improvement measured (not assumed)
