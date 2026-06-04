# ECC Standardized Knowledge — Idempotency Key Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Idempotency Key Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Idempotency key tests verify that mutating endpoints (POST, PUT, PATCH, DELETE) correctly handle the `Idempotency-Key` header — ensuring that retrying the same key returns the original response without duplicating the operation. Tests cover first request (executes and stores response), retry with same key (returns stored response), retry with different key (executes again), expired keys (re-executes after TTL), and key validation (missing, malformed). Idempotency is critical for payment and order APIs where network retries must not cause duplicate charges. Laravel implementations use middleware + cache storage.

## Core Concepts

- **`Idempotency-Key` header**: Unique string (typically UUID) sent by client
- **First request**: Server processes and caches response keyed by idempotency key
- **Retry with same key**: Server returns cached response without reprocessing
- **Retry with different key**: Server executes again (different operation)
- **Key expiry**: Configurable TTL (typically 24 hours) — expired keys are treated as new
- **Key validation**: Must be valid UUID (or non-empty string) — malformed keys return 400/422
- **Cache driver**: Must persist between requests — `array` driver won't work (same as rate-limit testing)

## When To Use

- Payment, order, and checkout endpoints where duplicates are unacceptable
- Any POST endpoint that creates a resource (idempotency prevents duplicate creation)
- APIs with unreliable client networks (mobile, IoT) where retries are expected
- Endpoints documented as idempotent in the API contract

## When NOT To Use

- GET, HEAD, OPTIONS endpoints (naturally idempotent)
- Public read-only endpoints
- Endpoints where duplicate operations are harmless (logging, analytics)

## Best Practices

- **Test first request**: Send with idempotency key → assert 2xx and body.
- **Test identical retry**: Send same key again → assert exact same response (same status, same body).
- **Verify no duplicate operation**: After retry, assert database has only one record created.
- **Test different key for different operation**: Same payload, different key → creates a second record.
- **Test key expiry**: Mock cache TTL, wait for expiry, assert same key re-executes.
- **Test missing key**: Endpoint without key → executes normally (no idempotency applied).
- **Test invalid key format**: Malformed UUID → 400 or 422 with validation error.

## Architecture Guidelines

- Idempotency implementation can be middleware-based (transparent to controllers) or controller-based (explicit checking).
- Middleware-based is preferred — all idempotent endpoints automatically get the behavior, tests validate through HTTP.
- Cache TTL is a business decision: too short (minutes) defeats retry purposes, too long (days) fills the cache.
- For race condition protection, consider database-backed idempotency with unique constraints (stronger than cache locks).

## Performance Considerations

- Idempotency tests, like rate-limit tests, require sequential requests sharing state.
- Use `Cache::store('file')->flush()` between tests.
- Tests with TTL expiry need clock manipulation (`Carbon::setTestNow()`).
- Batch idempotency scenarios (first request, retry, different key) into one test method to minimize kernel boots.

## Security Considerations

- Idempotency keys prevent duplicate financial transactions — this is correctness-critical.
- Idempotency keys must be logged without exposing PII (avoid logging user email or ID in key).
- Implement cleanup jobs for expired keys to prevent cache bloat.
- Test that idempotency middleware doesn't bypass authentication/authorization checks.
- Ensure stored responses don't contain sensitive data that shouldn't be cached.

## Common Mistakes

- Using `array` cache driver in tests — idempotency state resets between requests.
- Not testing the "no duplicate operation" aspect — verifying only the response but not that the database wasn't mutated twice.
- Setting TTL too short — a payment gateway retry 4 hours later creates a duplicate charge.
- Not validating idempotency key format — empty string crashes the middleware.
- Forgetting to include response status code in cache — retry returns 200 on a request that originally returned 201.

## Anti-Patterns

- **No deduplication verification**: Testing that retries return the same body but not verifying the database has only one record.
- **Controller-level idempotency**: Each controller implements its own idempotency logic — inconsistent and untestable.
- **Shared idempotency key space across users**: User A's key could collide with User B's key — scope keys per user/operation.

## Examples

```php
it('returns cached response on retry with same key', function () {
    $key = Str::uuid()->toString();

    // First request
    $response1 = $this->postJson('/api/posts', [
        'title' => 'Hello',
        'body' => 'World',
    ], ['Idempotency-Key' => $key]);
    $response1->assertStatus(201);

    // Retry with same key
    $response2 = $this->postJson('/api/posts', [
        'title' => 'Hello',
        'body' => 'World',
    ], ['Idempotency-Key' => $key]);
    $response2->assertStatus(201);

    // Verify only one post was created
    expect(Post::count())->toBe(1);
    // Verify identical responses
    expect($response2->json())->toEqual($response1->json());
});

it('rejects invalid idempotency key format', function () {
    $response = $this->postJson('/api/posts', [
        'title' => 'Hello',
    ], ['Idempotency-Key' => '']);

    $response->assertStatus(422);
});
```

## Related Topics

- **Prerequisites**: HTTP Idempotency Semantics (RFC 7231), Laravel Cache Drivers
- **Siblings**: rate-limit-testing, response-header-testing, happy-path-testing
- **Advanced**: Distributed idempotency (Redis + Lua locks), Database-level idempotency with unique constraints, Idempotency key lifecycle management

## AI Agent Notes

- Idempotency testing requires sharing state across test requests within a single test method — one of the few test patterns in Laravel that demands this, alongside rate-limit testing.
- There is no built-in Laravel idempotency middleware — it's always custom or third-party.
- Stripe's API popularized the `Idempotency-Key` header pattern.

## Verification

- [ ] First request with idempotency key executes and stores response
- [ ] Retry with same key returns cached response without duplicate operation
- [ ] Different key with same payload creates a second record
- [ ] Expired keys are treated as new requests
- [ ] Missing key executes normally (no idempotency applied)
- [ ] Invalid key format returns validation error
- [ ] Database has exactly one record after idempotent retry (deduplication verified)
