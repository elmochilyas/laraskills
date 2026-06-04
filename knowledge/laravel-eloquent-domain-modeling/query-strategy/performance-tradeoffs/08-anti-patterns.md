# Anti-Patterns: Performance Tradeoffs

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Performance Tradeoffs

## Anti-Patterns

### N+1 in Disguise
Calling relationships inside `each()` or `map()` callbacks without eager loading. This is the most common Eloquent performance trap — one lazy-loaded relationship in a loop of 100 items adds 100 extra queries.

**Problem:** 1 + N queries instead of 2; severe performance degradation (100 queries vs 2); database server overload.

**Solution:** Always eager-load relationships with `with()` before iterating results. Use `Model::preventLazyLoading()` in development to catch N+1 early.

### Massive Get
`Model::all()` or `Model::get()` on tables with 100k+ rows. Each hydrated model consumes ~2-4KB of memory — 50,000 models at 3KB each = 150MB, exceeding typical PHP memory limits.

**Problem:** Out-of-memory crashes in production; PHP process killed by OOM killer; incomplete data processing.

**Solution:** Use `chunkById()`, `cursor()`, or `paginate()` instead of `get()` for result sets exceeding 10,000 rows.

### Get Then Update
Fetching all records with `get()` then updating each one in a loop: `User::where(...)->get()->each->update([...])`. This hydrates every row unnecessarily.

**Problem:** Every row loaded into memory only to be updated; massive memory waste; slow performance from individual updates.

**Solution:** Use a single `update()` query when the update applies to all matched records: `User::where(...)->update([...])`.

### Ignored Profile Data
Never profiling, then guessing about performance bottlenecks. Developers optimize hydration when the real problem is N+1, or optimize queries when the real problem is missing indexes.

**Problem:** Optimization effort directed at the wrong bottleneck; wasted development time; no measurable improvement.

**Solution:** Profile with Debugbar, Telescope, or `DB::listen()` before optimizing. Fix N+1 first, then measure hydration, then optimize.

### Chunk Over Cursor for Streaming
Using `chunk()` when `cursor()` is more appropriate for streaming. `chunk()` fetches batches into memory while `cursor()` streams one row at a time.

**Problem:** Higher memory usage than necessary; slower iteration on very large datasets where streaming is more appropriate.

**Solution:** Use `cursor()` for true streaming iteration. Use `chunkById()` when mutation safety or batch processing is needed.

### Over-Eager Loading
Using `with()` to eager-load relationships that are used on only 5% of results. This wastes a query (or multiple queries) for data that is rarely needed.

**Problem:** Unnecessary database queries on every request; wasted I/O for relationships used on a small subset of results.

**Solution:** Use `load()` for conditionally-needed relationships. Use `with()` only for relationships needed on > 80% of results.

### Premature `toBase()`
Using `toBase()` on result sets < 100 rows where savings are negligible (~20-50µs). The loss of model features (accessors, casts, methods) outweighs the tiny performance gain.

**Problem:** Reduced code expressiveness; lost model features; unnecessary complexity for invisible performance gain.

**Solution:** Only use `toBase()` when profiling confirms hydration overhead > 10ms per request or result sets exceed 1000 rows.
