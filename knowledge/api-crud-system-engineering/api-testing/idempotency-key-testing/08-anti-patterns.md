# Anti-Patterns — Idempotency Key Testing

## Anti-Pattern 1: No Retry Deduplication Verification

**Category**: Testing completeness

**Description**: Testing only that the first request with an idempotency key succeeds, without verifying that a retry with the same key does not duplicate the operation.

**Warning Signs**:
- Idempotency tests send one request with a key and assert success
- No test sends the same key twice and checks the database for a single record
- The retry-deduplication contract is trusted without verification

**Why It's Harmful**: The entire purpose of idempotency is preventing duplicate operations. A test that only verifies the first request works proves nothing about deduplication. The middleware may store the response but fail to check the cache on subsequent requests, or the cache may use the wrong key.

**Real-World Consequence**: A payment gateway's idempotency middleware is deployed. Tests pass because they only send one request per key. In production, a network retry with the same idempotency key creates a duplicate charge. The customer is charged twice.

**Preferred Alternative**: Send the same key twice, assert both return the same response, and assert the database has exactly one record.

**Refactoring Strategy**:
1. Add a second request with the same idempotency key
2. Assert the second response is identical to the first (same status, same body)
3. Assert database count is 1 (not 2)

**Detection Checklist**:
- [ ] Retry with same key returns identical response
- [ ] Database has exactly one record after retry
- [ ] Test would fail if duplicate operation occurred

**Related Rules**: Test First Request Then Identical Retry, Verify No Duplicate Operation On Retry
**Related Skills**: Implement Idempotency Key Testing

---

## Anti-Pattern 2: No Database Deduplication Check

**Category**: Testing correctness

**Description**: Verifying only that the HTTP response matches on retry without checking the database for duplicate records.

**Warning Signs**:
- Tests compare `$response1->json()` with `$response2->json()` but never call `Post::count()`
- A retry returns the cached response but still creates a database record — tests would pass
- Response comparison is trusted over database ground truth

**Why It's Harmful**: The response could match (both return the same cached body) even though the operation ran twice — if the middleware stores the response after the first request but doesn't prevent the second execution. The HTTP response lies; the database tells the truth.

**Real-World Consequence**: A middleware bug stores the response correctly in cache but fails to short-circuit execution on retry. Both requests hit the controller. The controller creates two records. Both API responses return 201 (the second is the cached first response, but the operation already ran). Tests pass. Production has duplicate orders.

**Preferred Alternative**: Always assert the database state after idempotent retries — `expect(Post::count())->toBe(1)`.

**Refactoring Strategy**:
1. After sending the same key twice, assert the database count matches the expected number of created records
2. For create operations: assert exactly 1 record
3. For update operations: assert the record was updated once (no duplicate versions)

**Detection Checklist**:
- [ ] Every idempotency retry test includes a database count assertion
- [ ] Response comparison is paired with database verification
- [ ] Test catches duplicate operations even if responses match

**Related Rules**: Verify No Duplicate Operation On Retry
**Related Skills**: Implement Idempotency Key Testing
**Related Decision Trees**: Tree 1 — Idempotency Scenario Test Coverage

---

## Anti-Pattern 3: Not Testing Different Key for Different Operation

**Category**: Testing completeness

**Description**: Testing only that the same key returns cached response, without verifying that a different key with the same payload creates a separate resource.

**Warning Signs**:
- All idempotency tests use the same key twice
- No test sends a second request with a different key
- The "different key = different operation" contract is untested

**Why It's Harmful**: An idempotency implementation that incorrectly deduplicates on payload instead of key will treat every identical payload as a duplicate — even with different keys. This prevents legitimate duplicate operations (e.g., customer wants two identical orders).

**Real-World Consequence**: A customer places an order for a specific set of items. The idempotency middleware incorrectly matches on the payload hash. A second order with the same items (legitimate) is blocked because the middleware thinks it's a retry. The customer cannot place the order again.

**Preferred Alternative**: Send the same payload with two different idempotency keys and assert two records are created.

**Refactoring Strategy**:
1. Send request 1 with key A → assert created
2. Send request 2 with key B (same payload) → assert created
3. Assert database has 2 records

**Detection Checklist**:
- [ ] Different key + same payload creates two records
- [ ] The middleware does not match on payload content
- [ ] Tests verify both deduplication (same key) and non-deduplication (different key)

**Related Rules**: Test Different Key For Different Operation
**Related Skills**: Implement Idempotency Key Testing

---

## Anti-Pattern 4: Missing Key Validation Tests

**Category**: Testing completeness

**Description**: Never testing how the middleware handles missing, empty, or malformed idempotency keys.

**Warning Signs**:
- All tests send valid UUID idempotency keys
- No test omits the `Idempotency-Key` header
- No test sends an empty string or malformed UUID

**Why It's Harmful**: An idempotency middleware may crash on empty keys (null pointer, empty string), return a confusing error, or silently accept invalid keys and store them in cache. Each unhandled boundary creates a production bug.

**Real-World Consequence**: A client sends an empty `Idempotency-Key: ""` header due to a bug. The middleware tries to parse the empty string as UUID, throws an exception, and returns 500. The client retries (same empty key) and gets 500 again. The endpoint is effectively down for that client.

**Preferred Alternative**: Test missing key (normal execution), empty key (400/422), and malformed key (400/422).

**Refactoring Strategy**:
1. Add a test without `Idempotency-Key` → assert normal 2xx
2. Add a test with empty string key → assert 422
3. Add a test with malformed UUID → assert 422

**Detection Checklist**:
- [ ] Missing key works normally (no idempotency applied)
- [ ] Empty key returns validation error
- [ ] Malformed key returns validation error
- [ ] Key format validation is consistent with documented spec

**Related Rules**: Test Missing And Invalid Key Formats
**Related Skills**: Implement Idempotency Key Testing

---

## Anti-Pattern 5: Using `array` Cache Driver for Idempotency Tests

**Category**: Testing correctness

**Description**: Running idempotency tests with the `array` cache driver, which resets state between HTTP requests and breaks retry behavior.

**Warning Signs**:
- `CACHE_DRIVER=array` in test configuration
- Idempotency tests always create duplicate records (retry never hits cache)
- Tests pass but production idempotency is untested

**Why It's Harmful**: The `array` cache driver resets its store between every HTTP request. The idempotency middleware stores the response after the first request, but on the second request (same test), the cache is empty — the middleware treats it as a new request. The operation runs twice.

**Real-World Consequence**: All idempotency tests pass with `CACHE_DRIVER=array` because the retry assertion passes (test doesn't check DB count). Production has a redis-backed cache and idempotency works correctly there. But the tests never actually verified the retry path — they tested two independent requests.

**Preferred Alternative**: Use `file` or `redis` cache driver for idempotency tests, and assert database state to confirm deduplication.

**Refactoring Strategy**:
1. Set `CACHE_DRIVER=file` in test configuration or in `setUp()`
2. Add `Cache::flush()` between tests to prevent state bleed
3. Always verify database state (not just response equality)

**Detection Checklist**:
- [ ] Idempotency tests use `file` or `redis` cache driver
- [ ] `array` cache is not used for idempotency tests
- [ ] Database assertions confirm deduplication works at the storage level

**Related Rules**: Use Persistent Cache Driver
**Related Skills**: Implement Idempotency Key Testing
**Related Decision Trees**: Tree 2 — Cache Driver and State Management
