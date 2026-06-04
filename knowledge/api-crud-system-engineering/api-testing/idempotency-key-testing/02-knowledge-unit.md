# Idempotency Key Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Idempotency Key Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Idempotency key tests verify that mutating endpoints (POST, PUT, PATCH, DELETE) correctly handle the `Idempotency-Key` header — ensuring that retrying the same key returns the original response without duplicating the operation. Tests cover first request (executes and stores response), retry with same key (returns stored response), retry with different key (executes again), expired keys (re-executes after TTL), and key validation (missing, malformed). Idempotency is critical for payment and order APIs where network retries must not cause duplicate charges. Laravel implementations use middleware + cache storage.

---

## Core Concepts
An idempotency key is a unique string (typically UUID) sent by the client in the `Idempotency-Key` header. On the first request, the server processes the operation and stores the response keyed by the idempotency key in the cache. On subsequent requests with the same key, the server returns the stored response without reprocessing. The key expires after a configurable TTL (typically 24 hours). Key validation: must be a valid UUID (or not-empty string), must be unique per operation scope. Testing covers the full lifecycle: create → store → retrieve → expire. The cache driver must persist between requests — similar to rate-limit testing, the `array` driver won't work.

---

## Mental Models
Idempotency key testing is **testing the post-it note** — the client writes a unique ID on a post-it and sticks it on the request. The server checks: "have I seen this post-it before?" If no, process the request and save the response under that post-it. If yes, return the saved response without doing anything. The post-it expires after 24 hours — after that, the same post-it is treated as new.

---

## Internal Mechanics
An idempotency middleware (`EnsureIdempotency`) checks `$request->header('Idempotency-Key')`. If present, it looks up `cache: idempotency:{key}`. If found, returns the cached response. If not found, processes the request, caches the response with the key (set TTL), and returns it. The cached response includes status code, headers, and body — typically serialized as JSON. Implementation uses Laravel's cache facade: `Cache::store('redis')->get($key)`, `Cache::store('redis')->put($key, $serialized, $ttl)`. Some implementations also use a database table with a unique constraint on `(key, operation_scope)` to prevent race conditions via database-level locking.

---

## Patterns
- **Test first request**: Send with idempotency key → assert 2xx and body.
- **Test identical retry**: Send same key again → assert exact same response (same status, same body).
- **Verify no duplicate operation**: After retry, assert database has only one record created.
- **Test different key for different operation**: Same payload, different key → creates a second record.
- **Test key expiry**: Mock cache TTL, wait for expiry, assert same key re-executes.
- **Test missing key**: Endpoint without key → executes normally (no idempotency applied).
- **Test invalid key format**: Malformed UUID → 400 or 422 with validation error.

---

## Architectural Decisions
Idempotency key implementation can be middleware-based (transparent to controllers) or controller-based (explicit checking). Middleware-based is preferred for maintainability — all idempotent endpoints automatically get the behavior, and tests validate through HTTP without controller awareness. The tradeoff: middleware-based implementations require cache configuration for tests (file or redis, not array), while controller-based implementations can be unit-tested more easily. The cache TTL is a business decision — too short (minutes) defeats the purpose for long-running retries, too long (days) fills the cache.

---

## Tradeoffs
| Tradeoff | Cache-Based | Database-Based |
|---|---|---|
| Speed | Fast (cache read) | Slower (DB read + unique constraint) |
| Race condition protection | Partial (cache locks) | Strong (DB unique constraint) |
| Persistence | Volatile (TTL-dependent) | Permanent (until cleanup) |
| Complexity | Lower | Higher (migration, cleanup) |
| Test cache driver | Must use file/redis | Uses DB (RefreshDatabase works) |

---

## Performance Considerations
Idempotency tests, like rate-limit tests, require sequential requests sharing state. Each request in a test sends to the same endpoint — use `Cache::store('file')->flush()` between tests. Tests with TTL expiry need clock manipulation (`Carbon::setTestNow()`). The response serialization adds overhead — test with small payloads. Batch idempotency scenarios (first request, retry, different key) into one test method to minimize kernel boots.

---

## Production Considerations
Idempotency keys prevent duplicate financial transactions — this is a correctness-critical feature. Test all edge cases exhaustively. In production, use Redis for idempotency cache (fast, TTL-native, distributed). The idempotency key must be logged without exposing PII. Monitor cache eviction rates — if keys expire before retries complete, duplicate operations occur. Implement cleanup jobs for expired keys to prevent cache bloat.

---

## Common Mistakes
- Using `array` cache driver in tests — idempotency state resets between requests.
- Not testing the "no duplicate operation" aspect — verifying only the response (matching status/body) but not that the database wasn't mutated twice.
- Setting TTL too short — a payment gateway retry 4 hours later creates a duplicate charge.
- Not validating idempotency key format — a client sends an empty string and the middleware crashes.
- Forgetting to include the response status code in the cache — retry returns 200 on a request that originally returned 201.

---

## Failure Modes
- **Race condition**: Two concurrent requests with the same key both pass the cache check and execute — both create records. Mitigated by database unique constraints or atomic locks.
- **Cache driver mismatch**: File cache in test, Redis in production — works in test, fails in production (serialization differences).
- **Key collision**: Two unrelated operations with the same key (client UUID collision) — second operation is silently skipped. Use operation-specific key scoping.
- **TTL too short**: Client retries after TTL expiry — operation executes twice. Critical for payment endpoints.

---

## Ecosystem Usage
Stripe's API popularized the `Idempotency-Key` header. Laravel packages like `stripe/stripe-php` natively support idempotency keys. Spatie's `laravel-idempotency` provides a Laravel middleware implementation. PayPal, GitHub, and Shopify APIs all support idempotency keys.

---

## Related Knowledge Units
### Prerequisites
- HTTP Idempotency Semantics (RFC 7231 Section 4.2.2)
- Laravel Cache Drivers (file, redis, database)

### Related Topics
- rate-limit-testing (shared state across test requests)
- response-header-testing (custom header testing)
- happy-path-testing (successful idempotent request)

### Advanced Follow-up Topics
- Distributed idempotency (Redis + Lua locks)
- Database-level idempotency with unique constraints
- Idempotency key lifecycle management

---

## Research Notes
### Source Analysis
Stripe Idempotency Key API specification. Laravel `Cache::store()` facade. Custom `EnsureIdempotency` middleware pattern based on `fruitcake/laravel-cors` middleware structure.
### Key Insight
Idempotency testing requires sharing state across test requests within a single test method — one of the few test patterns in Laravel that demands this, alongside rate-limit testing.
### Version-Specific Notes
Laravel 11 cache TTL is specified in seconds (previous versions also accepted minutes). The `Cache::store('file')` driver persists between test requests since Laravel 8.x. There is no built-in Laravel idempotency middleware — it's always custom or third-party.
