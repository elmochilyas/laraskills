# firstOrCreate vs createOrFirst — Race Condition Comparison

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** first-or-create-vs-create-or-first
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

`firstOrCreate()` and `createOrFirst()` serve the same purpose — find a record or create one if it doesn't exist — but they differ fundamentally in how they handle concurrent requests. `firstOrCreate()` follows a check-then-act pattern vulnerable to race conditions, while `createOrFirst()` uses an act-then-handle-collision pattern that is race-condition safe. Understanding this distinction is critical for any code path that may execute concurrently, which is nearly all production web application code.

---

## Core Concepts

- **`firstOrCreate()` flow:** `SELECT ... WHERE attributes` → if null → `INSERT ...`. Race window: between SELECT and INSERT, another request may INSERT the same record.
- **`createOrFirst()` flow:** `INSERT ...` → on unique constraint violation → `SELECT ... WHERE attributes`. No race window: the INSERT is the first operation, and the database's unique constraint provides atomic collision detection.
- **Race window duration:** The gap between SELECT and INSERT in `firstOrCreate()` is typically microseconds for simple queries but can be milliseconds under load, especially with slow queries, transaction isolation delays, or replication lag.
- **Duplicate outcome:** Without application-level or database-level safeguards, `firstOrCreate()` in concurrent paths produces duplicate rows. These duplicates may violate business rules (duplicate user emails, duplicate slugs) or cause silent data corruption.

---

## Mental Models

### The Two-Way Door vs. The One-Way Turnstile
`firstOrCreate()` is a two-way door — you look first, then step through. Someone on the other side can step through at the same moment. `createOrFirst()` is a one-way turnstile — you push forward and it either lets you through (creating) or catches you (returning existing). The turnstile mechanism itself prevents simultaneous passage.

### The Lost Update Analogy
The race condition in `firstOrCreate()` is a variant of the "lost update" problem. Concurrent Request A and Request B both check → both see no record → both insert → one insertion succeeds, the other either throws a duplicate key error (with unique constraint) or creates a duplicate (without). `createOrFirst()` resolves this by designating the INSERT as the authoritative operation.

---

## Internal Mechanics

### `firstOrCreate()` implementation:
```php
public function firstOrCreate(array $attributes = [], array $values = [])
{
    return $this->firstBy($attributes) ?:
            $this->create(array_merge($attributes, $values));
}
```

### `createOrFirst()` implementation (simplified):
```php
public function createOrFirst(array $attributes = [], array $values = [])
{
    try {
        return $this->create(array_merge($attributes, $values));
    } catch (UniqueConstraintViolationException $e) {
        return $this->firstBy($attributes) ??
                throw $e; // retry or re-throw
    }
}
```

The key difference: `firstOrCreate()` optimistically checks first; `createOrFirst()` optimistically inserts first and recovers from collisions.

---

## Patterns

- **User registration endpoint:** Use `User::createOrFirst(['email' => $request->email], $data)` to guarantee one account per email, even with concurrent signups.
- **Slug generation API:** Combine `createOrFirst()` with slug generation to atomically claim a unique slug.
- **Tag or category creation:** `Tag::firstOrCreate()` in admin panels (serial admin access) is acceptable. `Tag::createOrFirst()` for user-facing "create tag on the fly" features.
- **Queue job deduplication:** Use `createOrFirst()` in a `ProcessedJob` model to ensure each job is processed exactly once, even if enqueued multiple times.

---

## Architectural Decisions

- **Default choice:** Prefer `createOrFirst()` for all web-facing code paths that may execute concurrently. Reserve `firstOrCreate()` for truly serial contexts: database seeds, artisan commands, single-worker queue jobs, or code paths protected by explicit locking.
- **Migration requirement:** Adopting `createOrFirst()` requires a migration audit to ensure unique constraints exist on the columns used in the `$attributes` parameter. Without unique constraints, `createOrFirst()` degrades to an INSERT that may create duplicates.
- **Performance profile:** `createOrFirst()` always executes an INSERT first. For endpoints where the record already exists 90%+ of the time, the INSERT becomes wasted overhead. Profile and consider transaction-based `firstOrCreate()` with `lockForUpdate()` as an alternative.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `createOrFirst()` is fully atomic | Requires unique constraint on DB | Adds migration overhead |
| `createOrFirst()` prevents all races | Always executes INSERT first | Wasted write on existing records |
| `firstOrCreate()` is simpler API | Race window exists | Duplicates under concurrency |
| `firstOrCreate()` reads first, faster happy path | No protection without external locking | Must add pessimistic locking |
| `createOrFirst()` returns model on collision | Exception handling on every collision | Negligible performance impact |

---

## Performance Considerations

- `createOrFirst()` always performs a write (INSERT) before a read (SELECT on collision). On tables with frequent reads but rare creates, this adds unnecessary write load.
- `firstOrCreate()` with `lockForUpdate()` inside a transaction performs a read with a lock (SELECT ... FOR UPDATE) then a conditional INSERT. This is race-condition safe but holds row locks, impacting concurrency.
- The exception handling in `createOrFirst()` constructs a `UniqueConstraintViolationException` — PHP exception creation is cheap (~1-2μs), and the try-catch overhead without exception is near zero.
- Indexing the attributes column(s) benefits both methods: `firstOrCreate()`'s SELECT uses it, and `createOrFirst()`'s unique constraint index is required.

---

## Production Considerations

- **Always add a unique constraint** before deploying code that uses `createOrFirst()`. The method is only as safe as the database constraint it relies on.
- **Log `createOrFirst()` collisions** at `info` level — they indicate concurrent usage. An unexpected spike may reveal a performance bottleneck or a new concurrent code path.
- **Monitor for duplicate records** in tables that use `firstOrCreate()` on concurrent paths. A scheduled query `SELECT attributes, COUNT(*) FROM table GROUP BY attributes HAVING COUNT(*) > 1` can detect silent duplicates.
- **Test concurrency** with `Http::pool()` dispatching 10 simultaneous requests to the same endpoint using `firstOrCreate()` vs `createOrFirst()`. The `firstOrCreate()` test should produce duplicates (confirming the race), while `createOrFirst()` should not.

---

## Common Mistakes

- **Using `firstOrCreate()` in web controllers without thought:** Every web request is concurrent. Unless you've explicitly serialized access (e.g., mutex lock, queue), `firstOrCreate()` has a race window.
- **Using `createOrFirst()` without migration check:** The method silently inserts duplicates if no unique constraint exists. Always verify the migration before relying on `createOrFirst()`.
- **Believing `updateOrCreate()` is safe:** `updateOrCreate()` uses `firstOrCreate()` internally to find existing records — it has the same race condition.
- **Confusing `createOrFirst()` with `firstOrCreate()` in code review:** Depends on a reviewer knowing the difference. Establish a team convention and add a CI lint rule if possible.
- **Not handling the edge case where `createOrFirst()` throws after retry exhaustion:** Under extreme contention, the retry loop may exhaust its limit and throw an exception. Have a fallback strategy (retry with backoff, log and alert).

---

## Failure Modes

- **Duplicate records from `firstOrCreate()`:** Two concurrent requests both pass the SELECT → both execute INSERT. One succeeds, one throws a constraint violation (if unique exists) or both succeed (if no unique). Data integrity is compromised.
- **`createOrFirst()` infinite retry:** Theoretically possible under extreme contention where a record is repeatedly created and deleted between the failed INSERT and fallback SELECT. In practice, the retry limit catches this.
- **Soft delete conflict:** `firstOrCreate()` matches soft-deleted records, potentially returning a record that should be logically unavailable. Use `->whereNull('deleted_at')` or explicit query scoping.

---

## Ecosystem Usage

- **Laravel Breeze / Jetstream:** Registration controllers use `create()` with validation + duplicate checking at the validation layer. No find-or-create pattern in standard auth flows.
- **Laravel Nova:** `firstOrCreate()` is used internally for resource creation, which is typically serial per user.
- **Spatie media-library:** `getMedia()` / `addMedia()` — attachment operations are not find-or-create; uniqueness is handled at the file level.
- **Laravel Sanctum:** Token creation creates without find-or-create — uniqueness is handled by the token hash.

---

## Related Knowledge Units

### Prerequisites
- `unique-enforcement` (overview of both methods)
- `database-constraints` (unique constraint definition)
- Model creation fundamentals

### Related Topics
- `concurrency-handling` (locking strategies alternative)
- `upsert-patterns` (bulk uniqueness)
- `select-constraints` (reducing query payload)

### Advanced Follow-up Topics
- Distributed idempotency keys for API endpoints
- Optimistic concurrency control for webhooks
- Database-level `INSERT ... ON DUPLICATE KEY` vs `ON CONFLICT` patterns

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder` — both methods are defined in this class. `firstOrCreate()` at line ~540, `createOrFirst()` at line ~560 (Laravel 11). The retry logic in `createOrFirst()` uses a simple `for` loop with a maximum of 3 attempts.

### Key Insight
The fundamental difference is architectural: `firstOrCreate()` treats creation as exceptional (optimistic read, pessimistic write), while `createOrFirst()` treats existence as exceptional (optimistic write, collision recovery). The latter is more robust under concurrency because the database's unique constraint provides the authoritative conflict detection, not application-level checking.

### Version-Specific Notes
- Laravel 10.20: `createOrFirst()` introduced.
- Laravel 11: `createOrFirst()` retry logic refined; now handles edge case where record is deleted between failed INSERT and fallback SELECT.
- Pre-Laravel 10.20: `firstOrCreate()` with `lockForUpdate()` inside a transaction is the only safe concurrent path.
