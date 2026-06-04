# Unique Enforcement — firstOrCreate vs createOrFirst

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Unique Enforcement
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Unique enforcement in Eloquent deals with the challenge of atomically finding or creating records that satisfy uniqueness constraints. `firstOrCreate()` and `createOrFirst()` (introduced in Laravel 10.20+) are the two primary methods, each taking a fundamentally different approach to race conditions. `firstOrCreate()` is vulnerable to duplicate rows in concurrent scenarios because the `SELECT` and `INSERT` are separate operations. `createOrFirst()` leverages database unique constraints to handle collisions atomically, making it the safe choice for concurrent environments where uniqueness matters.

---

## Core Concepts

- **`firstOrCreate($attributes, $values)`:** Attempts to find a record matching `$attributes`. If found, returns it. If not found, creates a new record with `$attributes + $values`. The two operations are not atomic — a race window exists between the `SELECT` and `INSERT`.
- **`createOrFirst($attributes, $values)` (Laravel 10.20+):** Attempts to create a record with `$attributes + $values`. If a unique constraint violation occurs (duplicate entry), falls back to retrieving the existing record. Atomic by design — the `INSERT` is attempted first, and collisions are caught and handled.
- **`firstOrNew($attributes, $values)`:** Returns a new model instance without persisting it. No database interaction until `save()` is called. Does not protect against race conditions.
- **`updateOrCreate($attributes, $values)`:** Finds a record by `$attributes` and updates it, or creates a new one. Also vulnerable to race conditions.
- **Unique constraint dependency:** `createOrFirst()` requires a database unique index on the columns being matched. Without a unique constraint, duplicate insertion succeeds silently.

---

## Mental Models

### The Door Analogy
`firstOrCreate()` is like checking if a room is occupied by looking through the keyhole (SELECT), then entering if empty (INSERT). Between looking and entering, someone else might slip in. `createOrFirst()` is like trying to enter immediately — if the room is already occupied, you gracefully step back.

### The Try-Lock vs Check-Lock Pattern
`firstOrCreate()` follows the "check-then-act" pattern — optimistic but race-prone. `createOrFirst()` follows the "act-check-collision" pattern — try the operation and handle the conflict if it occurs. The latter is the standard approach for concurrent systems.

---

## Internal Mechanics

- `firstOrCreate()` calls `firstBy()` (SELECT) and then `newQuery()->create()` (INSERT) if no record is found.
- `createOrFirst()` calls `newQuery()->create()` directly. If a `UniqueConstraintViolationException` (SQLSTATE 23000, code 1062 for MySQL) is caught, it calls `firstBy()` to retrieve the existing record.
- The exception handling in `createOrFirst()` uses a retry loop: if the `firstBy()` after the exception also fails (because the record was deleted between the failed INSERT and the fallback SELECT), it retries the INSERT.
- Both methods respect model `$fillable` / `$guarded` protection.
- Both methods fire model events (`creating`, `created`, `saving`, `saved`).

---

## Patterns

- **Idempotent user registration:** `User::createOrFirst(['email' => $email], $userData)` — ensures one user per email even under concurrent registration.
- **Slug generation with collision handling:** `Post::createOrFirst(['slug' => $slug], $postData)` — atomic slug uniqueness.
- **Pivot table with unique constraint:** Role assignment on pivot table with composite unique key:
```php
DB::table('role_user')->insertOr(['user_id' => $id, 'role_id' => $roleId], []);
// Or with model:
RoleUser::createOrFirst(['user_id' => $id, 'role_id' => $roleId]);
```
- **Batch uniqueness with `firstOrCreate` in serial context:** Use `firstOrCreate` only when the surrounding code is serial (queues, single-worker jobs) or when duplicates are acceptable.

---

## Architectural Decisions

- **When to use `createOrFirst()` vs `firstOrCreate()`:** Default to `createOrFirst()` for any code path that may execute concurrently (web requests, queue workers, scheduled tasks). Use `firstOrCreate()` only in strictly serial contexts (seeds, migrations, single-user commands).
- **Unique constraint requirement:** `createOrFirst()` requires a database unique constraint. If you cannot add one (legacy schema, third-party database), you must use `firstOrCreate()` with explicit locking (`lockForUpdate()` inside a transaction).
- **Performance tradeoff:** `createOrFirst()` has a slower "happy path" than `firstOrCreate()` because it always executes an INSERT first. For code paths where the record usually exists (rare creation), `firstOrCreate()` with `lockForUpdate()` may be faster.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `createOrFirst()` is race-condition safe | Requires unique constraint on database | Migration must add unique index |
| `createOrFirst()` fails gracefully | Exception handling overhead on collision | Negligible — caught exception is cheap |
| `firstOrCreate()` is simpler | Race window between SELECT and INSERT | Duplicates in concurrent scenarios |
| `firstOrCreate()` works without unique constraint | No integrity guarantee without DB constraint | Data validation is application-only |
| `createOrFirst()` retries on race | Theoretical infinite retry loop | Extremely unlikely in practice |

---

## Performance Considerations

- `createOrFirst()` executes an INSERT on every call, even when the record already exists. For hot paths where the record exists 99% of the time, this adds unnecessary write load. Consider `firstOrCreate()` with pessimistic locking as an alternative.
- The exception handling in `createOrFirst()` is not a performance concern — PHP exception handling is fast relative to database round trips.
- Without a unique index, the duplicate key check in `createOrFirst()` cannot detect collisions — duplicates will be inserted. The unique index is not optional.
- Both methods execute at least one query. `createOrFirst()` executes two queries on collision (failed INSERT + fallback SELECT).

---

## Production Considerations

- Always pair `createOrFirst()` with a database unique constraint. Without it, the method silently inserts duplicates — it has no way to detect collisions.
- Monitor for `SQLSTATE[23000]` errors in production. Occasional duplicate key errors are expected with `createOrFirst()` — they are caught and handled. An increase may indicate a missing unique constraint.
- For high-throughput endpoints, prefer explicit transaction-based uniqueness with `lockForUpdate()` for better predictability.
- Test concurrency scenarios with `Http::pool()` or parallel queue workers to validate race condition handling.

---

## Common Mistakes

- **Using `firstOrCreate()` for concurrent operations:** The classic race condition. Two requests both execute `SELECT`, both get null, both execute `INSERT`. Duplicate created. Always use `createOrFirst()` or manual locking for concurrent paths.
- **Using `createOrFirst()` without a unique constraint:** The method silently inserts duplicates because the unique constraint violation is the collision detection mechanism. Without it, no exception is thrown.
- **Using `firstOrNew()` for uniqueness:** `firstOrNew()` does not persist — it returns a new model instance. Uniqueness is only checked when `save()` is called, which is itself not atomic.
- **Assuming `updateOrCreate()` is race-condition safe:** `updateOrCreate()` has the same race window as `firstOrCreate()`. Use `createOrFirst()` or `updateOrCreate()` inside a transaction with `lockForUpdate()`.

---

## Failure Modes

- **Duplicate insertion despite `createOrFirst()`:** If the unique constraint is missing or incorrectly defined (e.g., composite key misconfiguration), duplicates are inserted silently.
- **Infinite retry loop in extreme concurrency:** Under very high contention, `createOrFirst()` may repeatedly insert and collide. The retry loop has a max iteration count — if exceeded, it throws. This is theoretical; in practice, contention resolves within 1-2 retries.
- **`firstOrCreate()` with soft deletes:** `firstOrCreate()` matches on all rows, including soft-deleted ones. Use `->whereNull('deleted_at')` or a unique scope to avoid returning soft-deleted records.

---

## Ecosystem Usage

- **Laravel Sanctum:** Uses `firstOrCreate()` for personal access token creation. Token creation is typically serial per user session, so race conditions are low risk.
- **Laravel Jetstream:** Team membership uses `firstOrCreate()` for pivot table entries. Concurrent team adds could theoretically race, but practical risk is low.
- **Spatie Laravel Permission:** `givePermissionTo()` uses `firstOrCreate()` for role/permission assignment. Some implementations add manual locking for concurrency safety.

---

## Related Knowledge Units

### Prerequisites
- Unique constraints in database migrations
- Model creation basics (`create()`, `save()`)

### Related Topics
- `first-or-create-vs-create-or-first` (race condition deep dive)
- `upsert-patterns` (bulk unique enforcement)
- `database-constraints` (underlying constraint mechanics)

### Advanced Follow-up Topics
- Pessimistic locking patterns for custom unique enforcement
- Distributed unique enforcement across microservices
- Database-specific unique constraint behaviors

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::firstOrCreate()` at `src/Illuminate/Database/Eloquent/Builder.php` (line ~540). `Illuminate\Database\Eloquent\Builder::createOrFirst()` at the same file, introduced in Laravel 10.20. The retry logic in `createOrFirst()` uses `$this->newQuery()->create()` wrapped in a try-catch for `UniqueConstraintViolationException`.

### Key Insight
The paradigm shift from `firstOrCreate()` to `createOrFirst()` represents a move from "check-then-act" to "act-and-handle-conflict" architecture. This is the same pattern used by `INSERT ... ON DUPLICATE KEY UPDATE` at the SQL level. Both are valid; the choice depends on whether you can design for collisions or prefer to prevent them.

### Version-Specific Notes
- Laravel 10.20+: `createOrFirst()` introduced as a first-class Eloquent method.
- Laravel 11+: `createOrFirst()` stabilized with retry logic for edge cases.
- Laravel 5+: `firstOrCreate()` and `firstOrNew()` available since early versions.
