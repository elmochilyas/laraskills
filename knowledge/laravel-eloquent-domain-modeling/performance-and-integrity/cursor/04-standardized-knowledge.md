# cursor

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | cursor |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`cursor()` returns a `LazyCollection` that streams database results one row at a time using PHP generators. Unlike `chunk()` and `lazy()`, which execute multiple queries, `cursor()` executes a single query and yields each row as an Eloquent model without loading all rows into memory. This is the most memory-efficient iteration method for read-only processing of massive datasets — at the cost of no eager loading support and the requirement to keep the database connection open.

## Core Concepts

- **Single query execution**: `cursor()` executes one `SELECT` statement and fetches rows lazily from the result set.
- **Row-level yielding**: Each iteration yields a single Eloquent model, not a batch.
- **No eager loading**: `with()` is silently ignored on cursor queries — each relationship access triggers a lazy-load query.
- **Blocking connection**: The database connection is held open for the duration of cursor iteration.
- **PDO buffering**: The underlying implementation uses PDO's `fetch()` in a generator loop — the entire result set transfers to PHP's connection-level buffer, but PHP memory holds only one model at a time.

## When To Use

- Read-only processing of datasets too large to fit in memory (millions of rows)
- Stateless data export (CSV, JSON streaming) where each row is independent
- One-pass aggregations (summing, counting, grouping) without materializing the full result set
- CLI commands or queue jobs that process rows sequentially with minimal memory

## When NOT To Use

- You need eager-loaded relationships on each row (use `lazy()` with `with()`)
- The dataset is small enough to fit in memory (use `get()` for simplicity)
- You need mutation safety during iteration (use `chunkById()`)
- The iteration runs in a web request — cursor holds the connection for the entire HTTP response time
- The processing involves database writes that must be atomic per batch (use `chunk()` or `chunkById()`)

## Best Practices

- **Never access relationships inside a cursor loop**: `cursor()` silently ignores `with()`, so `$user->posts` triggers a new query per model. For 100k rows, that is 100k extra queries — instant N+1 disaster. If you need relationships, use `lazy()` with `with()` instead.
- **Only use cursor in CLI/queue contexts**: Web requests should complete quickly. A cursor-held connection in a web controller can timeout and block the connection pool. Cursor is designed for artisan commands and queue jobs.
- **Set a generous connection timeout**: Cursor iteration longer than MySQL's `wait_timeout` (often 60–300 seconds in cloud environments) disconnects. Set `wait_timeout` or `statement_timeout` appropriately for long-running cursor processes.
- **Avoid materializing the LazyCollection**: Calling `->toArray()`, `->all()`, or `collect($cursor)` forces all rows into memory, defeating the purpose of cursor.
- **Use `READ UNCOMMITTED` for read-only cursor processing**: Prevents deadlocks with concurrent writes. Execute `DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED')` before the cursor loop.

## Architecture Guidelines

- Confine cursor usage to CLI commands, queue jobs, or background processes
- Never use cursor in a web controller or middleware
- Limit concurrent cursor processes to avoid connection pool starvation
- Monitor cursor job duration to detect queries that take too long per row

## Performance Considerations

- `cursor()` uses less PHP memory than `lazy()` — models hydrated one at a time vs. one chunk at a time
- The entire result set is still buffered at the PDO driver level — truly massive result sets (10M+) may still cause database-side memory issues
- Per-row hydration overhead is higher than `lazy()` — Eloquent instantiates a model for each row instead of per batch. Benchmark before choosing `cursor()` over `lazy()`.
- Without eager loading, any relationship access inside a cursor loop triggers N+1 cascade, negating all memory benefits

## Security Considerations

- Long-running cursor processes may hold database credentials in memory for extended periods
- Ensure cursor jobs respect row-level authorization if accessing multi-tenant data
- Export cursors should not expose data the caller is not authorized to see

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Accessing relationships in cursor loop | Assuming eager loading works | N+1 query explosion per row | Use `lazy()` with `with()` |
| Using cursor in web controller | Convenience/ignorance | Connection held for HTTP duration, pool exhaustion | Use `paginate()` or `get()` for web |
| Materializing the LazyCollection | Calling `->toArray()` or `->all()` | Full result set loaded into memory | Iterate the LazyCollection directly |
| Not handling connection disconnect | Assuming cursor runs forever | Partial processing, incomplete work | Implement keepalive queries or checkpoint |
| Assuming server-side cursor | cursor() name implies DB cursor | PDO still buffers all rows in driver | Use raw PDO with unbuffered queries for true streaming |

## Anti-Patterns

- **Cursor-in-web-request**: Using `cursor()` in a controller action. Holds a database connection open for the entire HTTP response, risking pool exhaustion and timeouts.
- **Relationship-triggered N+1**: Accessing eager-loadable relationships inside a cursor loop. Produces thousands of queries per second, overwhelming the database.
- **Accidental materialization**: Passing a cursor LazyCollection to a function that calls `->all()` or `->toArray()`. Memory spikes to full dataset size, defeating the purpose.

## Examples

```php
// Read-only CSV export — ideal cursor use case
$fh = fopen('users.csv', 'w');
foreach (User::cursor() as $user) {
    fputcsv($fh, $user->only(['id', 'name', 'email']));
}
fclose($fh);

// One-pass aggregation
$totalRevenue = 0;
foreach (Order::cursor() as $order) {
    $totalRevenue += $order->amount;
}

// Throttled processing in a job
foreach (User::where('newsletter_opt_in', true)->cursor() as $user) {
    $user->sendNewsletter();
    sleep(1); // Throttle to 1 per second to respect rate limits
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | PHP generators and iterators |
| Prerequisite | PDO statement fetching mechanics |
| Closely Related | chunk-chunk-by-id |
| Closely Related | lazy-lazy-by-id |
| Closely Related | subquery-optimization |

## AI Agent Notes

- Never generate cursor usage inside a controller or web middleware
- Do not add `with()` calls before `cursor()` — they are silently ignored
- Generate `lazy()` with `with()` if relationships are needed
- Add a READ UNCOMMITTED isolation level statement for cursor processes to prevent deadlocks

## Verification

- [ ] Cursor is used only in CLI commands or queue jobs, not web controllers
- [ ] No `with()` calls precede the `cursor()` call
- [ ] No relationship access occurs inside the cursor iteration loop
- [ ] The LazyCollection is not materialized via `->toArray()`, `->all()`, or `collect()`
- [ ] Connection timeout or keepalive is configured for long-running cursor jobs
