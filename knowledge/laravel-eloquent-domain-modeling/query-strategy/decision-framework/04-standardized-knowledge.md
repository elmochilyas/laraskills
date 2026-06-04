# Decision Framework — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Decision Framework
- **ECC Version:** 1.0

## Overview
The Decision Framework provides structured guidance for choosing between Eloquent ORM and Query Builder for any database operation. Eloquent provides model features (hydration, relationships, scopes, events) but adds overhead. Query Builder is minimal, fast, and direct. The mature approach uses both — defaulting to Eloquent for domain operations and dropping to Query Builder (or `toBase()`) for performance-critical paths.

## Core Concepts
- Eloquent ORM: full ORM with hydration, relationships, accessors, events, scopes, serialization
- Query Builder: thin SQL abstraction returning `stdClass` objects; no model layer
- Model Hydration: converting rows to Model instances (~2-5µs per row overhead)
- `toBase()`: Eloquent method skipping hydration, returning `stdClass` from model-backed queries
- CQRS Read Path: separating read queries (Query Builder) from write operations (Eloquent)
- Spectrum: Eloquent → Eloquent + `toBase()` → Query Builder → Raw SQL

## When To Use
- **Eloquent for**: model events, relationships (eager/lazy), accessors/mutators, attribute casting, scopes, serialization, route model binding, domain logic
- **Query Builder for**: bulk inserts/updates (1000+ rows), complex reporting/analytics, pivot table operations, database-specific SQL features (JSON, CTEs, full-text), maximum performance
- **`toBase()` for**: read-heavy paths needing Eloquent builder features but not hydration

## When NOT To Use
- Do NOT use Query Builder when you need model events (`created`, `saved`, `deleted`)
- Do NOT use Query Builder on tables with soft deletes (bypasses `SoftDeletingScope`)
- Do NOT use Query Builder with multi-tenant models (bypasses tenant isolation scopes)
- Do NOT use Eloquent for mass updates on 10k+ rows executed one-by-one via `get()->each->update()`
- Do NOT over-optimize: switching to QB for a query running 3 times/day on 10 rows is premature

## Best Practices (WHY)
- Default to Eloquent for all new queries; optimize only when profiling proves it matters
- Use `toBase()` as the first optimization step before switching to `DB::table()`
- Use Eloquent for writes (events, validation, relationships); use Query Builder or `toBase()` for reads
- Handle the 80% case with Eloquent; optimize the 20% hot path with Query Builder
- Structure read-model queries behind repositories or query objects so switching strategy doesn't require changing callers

## Architecture Guidelines
- Establish a team convention: "Use Eloquent for all operations unless profiling proves it's a bottleneck"
- Keep decision reversible — abstract data access behind interfaces for critical paths
- Audit N+1 with `Model::preventLazyLoading()` in development; log violations in production
- Document when and why Query Builder is chosen over Eloquent in code comments
- Use `toBase()` as the intermediate step: it preserves Eloquent builder features without hydration

## Performance
- Hydration overhead: ~2-5µs per model; ~2-4KB memory per model
- Query Builder: ~0.5µs per row, ~0.5KB per row — 4-10x less memory and 5-10x less CPU
- Hydration overhead is proportional to row count: negligible for <100 rows, significant for 50k+
- Eloquent's lazy loading can cause N+1 hidden in loops; Query Builder forces explicit joins
- `toBase()` + `cursor()` returns raw objects without hydration

## Security
- Query Builder bypasses all Eloquent security scopes (soft deletes, multi-tenant, access control)
- Always use Eloquent for operations that depend on scope-based security boundaries
- Model events fired by Eloquent (e.g., cache invalidation, audit logs) are skipped with Query Builder
- `stdClass` objects from Query Builder don't have the same serialization behavior as models

## Common Mistakes
- Using Eloquent for mass updates: `User::where(...)->get()->each->update([...])` hydrates every row
- Using Query Builder when events are needed — `created`/`creating` events never fire
- Over-optimizing with QB for trivial queries — premature optimization adds complexity
- Missing relationship constraint methods — Query Builder lacks `whereHas`, `with`, `has`
- Assuming `toBase()` preserves eager loads — `with()` is NOT preserved

## Anti-Patterns
- **Eloquent for Everything**: using Eloquent for bulk reporting/export queries with 100k+ rows
- **Query Builder for Everything**: losing model events, scopes, and relationship features across the codebase
- **Premature QB**: switching to Query Builder before profiling confirms a bottleneck
- **Mixed Signals**: using Eloquent for SELECT and Query Builder for UPDATE/INSERT on the same model in the same request
- **Hidden QB**: using `DB::table()` inside an Eloquent model method, bypassing the model's own scopes

## Examples
```php
// Default: Eloquent
$user = User::with('posts')->where('active', true)->first();

// First optimization: toBase()
$raw = User::where('active', true)->toBase()->get(); // stdClass array

// Full QB for reporting
$report = DB::table('orders')
    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'))
    ->where('created_at', '>=', now()->subMonth())
    ->groupBy(DB::raw('DATE(created_at)'))
    ->get();

// Eloquent for write (events needed)
$user = User::find($id);
$user->update(['email' => $newEmail]); // fires saved/updating events

// QB for bulk insert (performance)
DB::table('logs')->insert($thousandsOfRows);
```

## Related Topics
- Builder Fundamentals — the base API for both Eloquent and Query Builder
- To Base Pattern — `toBase()` as the bridge between Eloquent and Query Builder
- Performance Tradeoffs — detailed cost analysis of hydration vs raw
- Hybrid Strategies — combining Eloquent construction with QB execution

## AI Agent Notes
- Default to Eloquent unless the task explicitly requires raw performance or bypassing scopes
- Use `toBase()` when you need Eloquent builder features but not model hydration
- Never use `DB::table()` on a model that has security-critical global scopes
- Always verify that Query Builder queries account for soft deletes and tenant scopes
- Prefer Eloquent for writes; Query Builder for reads

## Verification
- [ ] Decision between Eloquent and Query Builder justified by profiling data
- [ ] No premature optimization — Eloquent is the default for new queries
- [ ] `toBase()` considered as first optimization step before switching to `DB::table()`
- [ ] All writes use Eloquent when model events are required
- [ ] Query Builder queries on soft-deletable tables explicitly handle `deleted_at`
- [ ] N+1 prevention active (`preventLazyLoading()`) in development
