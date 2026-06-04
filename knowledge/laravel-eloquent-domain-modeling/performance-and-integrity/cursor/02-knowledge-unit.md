# cursor — Memory-Efficient Single-Query Streaming

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** cursor
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

`cursor()` returns an `Illuminate\Support\LazyCollection` that streams over database results one row at a time using PHP's generators and database cursors. Unlike `chunk()` and `lazy()`, which execute multiple queries, `cursor()` executes a single query and yields each row as an Eloquent model without ever loading all rows into memory. This makes it the most memory-efficient iteration method for read-only processing of massive datasets — at the cost of several important limitations, including the inability to eager load relationships and the requirement to keep the database connection open.

---

## Core Concepts

- **Single query execution:** `cursor()` executes one `SELECT` statement and fetches rows lazily from the database result set.
- **Row-level yielding:** Each iteration yields a single Eloquent model, not a collection batch. The callback receives one model at a time.
- **Database cursor dependency:** The underlying implementation uses PDO's `fetch()` method with a `while` loop wrapped in a generator, not server-side database cursors. This means the entire result set is still transferred to PHP memory at the connection level — it's not truly "streaming" from the database server.
- **No eager loading:** `with()` is silently ignored on cursor queries because Eloquent cannot batch-load relationships on a per-row stream. Each repeated relationship access triggers individual lazy-load queries.
- **Blocking connection:** The database connection is held open for the duration of cursor iteration. Long-running cursor processes can exhaust connection pool limits.

---

## Mental Models

### The Garden Hose vs. The Water Tank
`get()` fills a water tank (all rows in memory) before you can use any water. `cursor()` turns on a garden hose — water starts flowing immediately, and you use it as it arrives. But unlike `lazy()` (which has a series of buckets), `cursor()` is a continuous stream.

### The Firehose Metaphor
Using `cursor()` is like drinking from a firehose — you get a continuous stream of data with minimal buffering, but you can't add flavorings (eager loading) and you must hold the hose open (keep the connection alive) the entire time.

---

## Internal Mechanics

- `Builder::cursor()` calls `$this->query->cursor()`, which uses `Generator::from()` with `$this->get()`'s internal fetch mechanism.
- The query builder calls `PDOStatement::fetch(PDO::FETCH_ASSOC)` in a loop, yielding each row as an array.
- The Eloquent builder wraps this: each yielded array is hydrated into an Eloquent model via `$this->newModelInstance()->newFromBuilder($row)`.
- The `LazyCollection` wrapping allows `map()`, `filter()`, and other collection operations on the stream.
- The query is executed once; all rows remain in the database result buffer until yielded.

---

## Patterns

- **Read-only data export:**
```php
$fh = fopen('users.csv', 'w');
foreach (User::cursor() as $user) {
    fputcsv($fh, $user->toArray());
}
fclose($fh);
```
- **One-pass aggregations:** Summing, counting, or grouping large result sets without memory overhead.
- **Stateless reporting:** Generating reports where each row is processed independently and written to output.
- **Throttled processing:** Combine with a rate limiter inside the loop to control processing speed:
```php
foreach (User::cursor() as $user) {
    $user->sendNewsletter();
    sleep(1); // Throttle to 1 per second
}
```

---

## Architectural Decisions

- **When to use `cursor()` vs `lazy()`:** Use `cursor()` when: (1) you are doing read-only processing, (2) you don't need eager loading, (3) memory is the primary constraint, and (4) you can guarantee fast iteration to avoid connection timeout. Use `lazy()` when you need eager loading, mutation safety, or chunk-level processing.
- **No eager loading is a feature, not a bug:** `cursor()` forces you to design for single-model processing, which naturally leads to simpler, more stateless processing logic. If you need relationships, use `lazy()` with `with()`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Lowest memory usage per row | No eager loading support | N+1 for any relationship access during iteration |
| Single query execution | Holds connection open for duration | Risk of connection pool exhaustion |
| Yields immediately — no wait for full fetch | Still transfers all data through PDO buffer | Not a true server-side cursor |
| Simple, intuitive streaming API | Cannot be used with `chunkById` safety | Only for read-only; mutating rows is unsafe |
| Compatible with `LazyCollection` methods | Each yielded model is hydrated individually | Slightly slower than raw DB::cursor() |

---

## Performance Considerations

- `cursor()` uses less PHP memory than `lazy()` because models are hydrated one at a time rather than one chunk at a time. For very large models with many attributes and relationships, this difference is significant.
- Despite PHP memory savings, the entire result set is still buffered by the database driver (often at the PDO level). Truly large result sets (millions of rows) may still cause database-side memory issues.
- The per-row hydration overhead is higher per row than `lazy()` because Eloquent must instantiate a model for each row instead of per batch. Benchmark before choosing `cursor()` over `lazy()`.
- Without eager loading, any relationship access inside a cursor loop triggers an N+1 cascade. This can negate all memory benefits with query volume.

---

## Production Considerations

- **Connection timeout risk:** Cursor iteration longer than MySQL's `wait_timeout` (default 28800 seconds, but often 60–300 in cloud environments) will disconnect. Set a generous timeout or keep iteration fast.
- **Connection pool starvation:** Each cursor holds one connection. Multiple concurrent cursor processes can exhaust the connection pool. Use a single cursor process or limit concurrency.
- **Deadlock risk on write:** If the cursor reads rows and a concurrent transaction writes to the same table, InnoDB may use gap locks or next-key locks that can escalate to deadlock. Use `READ UNCOMMITTED` isolation level for read-only cursor processing:
```php
DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
```
- **Not suitable for web requests:** Cursor processing should be limited to CLI commands, queue jobs, or background processes. A web request using `cursor()` would hold the connection for the entire HTTP response time.

---

## Common Mistakes

- **Accessing relationships inside cursor loop:** `$user->posts` triggers a new query per model — instant N+1. If you need relations, use `lazy()` with `with()` instead.
- **Using `cursor()` in a web controller:** Web requests should be fast. Cursor is designed for background processing. A cursor-held connection in a web request can timeout and block other requests.
- **Calling `->toArray()` or `->all()` on a cursor LazyCollection:** This forces full materialization into memory, defeating the purpose of cursor.
- **Not handling connection disconnect:** Cursor-based processing that runs for hours should implement retry logic for dropped connections.
- **Assuming server-side cursor:** PDO's `fetch()` still transfers all rows to PHP's internal buffer. True server-side cursors require `PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => false` which Laravel does not use by default.

---

## Failure Modes

- **Out of memory despite cursor:** If the `LazyCollection` is passed to something that materializes it (e.g., `collect($cursor)->all()`), memory usage spikes to the full result set size.
- **N+1 explosion:** Accessing a relationship inside the cursor loop for 100k rows produces 100k extra queries, easily overwhelming the database.
- **Dead MySQL connection:** A cursor job that processes for 12 hours may exceed `wait_timeout`. Implement keepalive queries if needed.
- **PDO buffer exhaustion:** For extremely large result sets (10M+ rows), the PDO buffer itself may exhaust PHP memory. Use true unbuffered queries in this case via raw PDO.

---

## Ecosystem Usage

- **Laravel Excel:** `FromQuery` export uses cursor-style iteration for memory-efficient spreadsheet generation.
- **Laravel Scout:** Import commands use `cursor()` for initial index population to minimize memory usage.
- **Spatie's async package:** Background jobs use cursor streaming for processing large row sets without blocking queue workers.

---

## Related Knowledge Units

### Prerequisites
- PHP generators and iterators
- PDO statement fetching mechanics

### Related Topics
- `chunk-chunk-by-id` (multi-query batching alternative)
- `lazy-lazy-by-id` (chunked hydration with eager loading)
- `subquery-optimization` (avoiding cursor with better queries)

### Advanced Follow-up Topics
- Server-side cursor support in PostgreSQL vs MySQL
- PDO unbuffered query configuration
- Database-specific streaming optimizations

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::cursor()` at `src/Illuminate/Database/Eloquent/Builder.php`. Delegates to `Illuminate\Database\Query\Builder::cursor()` which uses `Generator::from()` with `PDO::fetch()`. The hydration happens via `Model::newFromBuilder()` per row.

### Key Insight
Despite its name, `cursor()` does not use actual database server cursors. It streams via PHP's yield/generator pattern over a single buffered PDO query. The memory efficiency comes from yielding one model at a time, not from server-side cursor management. True server-side cursors would require raw PDO with `MYSQL_ATTR_USE_BUFFERED_QUERY = false` or PostgreSQL's `DECLARE CURSOR`.

### Version-Specific Notes
- Laravel 5+: `cursor()` available on both Query and Eloquent Builder.
- Laravel 7+: Returns `LazyCollection` instead of `Generator` — enables collection chaining.
- Laravel 8+: Performance improvements in per-row model hydration.
- Laravel 10+: `cursor()` on Eloquent builder now respects model `$connection` configuration properly.
- Laravel 11+: No significant changes; the implementation remains stable.
