# Idempotency Key Testing — Rules

## Test First Request Then Identical Retry
---
## Category
Testing
---
## Rule
Send a request with an idempotency key, then send the same key again — assert the first returns original status and body, and the retry returns an identical response.
---
## Reason
The core idempotency contract is: retrying with the same key returns the same response without reprocessing. Without this paired test, the middleware may store the response but fail to return it on retry (e.g., wrong cache key, wrong status code stored).
---
## Bad Example
```php
it('accepts idempotency key', function () {
    $key = Str::uuid();

    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();
    // Does not test retry behavior
});
```
---
## Good Example
```php
it('returns cached response on retry with same key', function () {
    $key = Str::uuid()->toString();

    $first = $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key]);
    $first->assertCreated();

    $retry = $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key]);
    $retry->assertCreated();

    expect($retry->json())->toEqual($first->json());
});
```
---
## Exceptions
When the idempotency is designed to return 200 on retry for an operation that originally returned 201, document and assert this behavior.
---
## Consequences Of Violation
Retries cause duplicate operations despite idempotency key; cache miss on retry; same-key retries return different responses.
---

## Verify No Duplicate Operation On Retry
---
## Category
Testing
---
## Rule
After an idempotent retry, assert the database has exactly one record created, not two.
---
## Reason
An idempotency test that only checks response status/body may pass even if the operation was processed twice (if the cache returned a stale copy but the operation still ran). The database assertion is the ground truth — if only one record exists, deduplication worked.
---
## Bad Example
```php
it('returns cached response on retry', function () {
    $key = Str::uuid();

    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();

    expect(Post::count())->toBe(2); // Duplicate! Retry should not have created a second record
});
```
---
## Good Example
```php
it('ensures no duplicate record on idempotent retry', function () {
    $key = Str::uuid()->toString();

    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();

    expect(Post::count())->toBe(1); // Only one record — deduplication successful
});
```
---
## Exceptions
When the operation is designed to update rather than create (e.g., PUT/PATCH), assert the record was updated once, not duplicated.
---
## Consequences Of Violation
Duplicate financial transactions; duplicate orders; duplicate records despite correct-looking HTTP response.
---

## Test Different Key For Different Operation
---
## Category
Testing
---
## Rule
Assert that sending the same payload with a different idempotency key creates a new (separate) resource.
---
## Reason
An idempotency implementation that incorrectly matches on payload (instead of key) will treat every request with the same data as a duplicate, preventing legitimate duplicate-submission scenarios (e.g., the user actually wants two orders with the same items).
---
## Bad Example
```php
it('handles idempotency key', function () {
    $key = Str::uuid();

    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => $key])->assertCreated();
    // Does not test that a different key creates a separate record
});
```
---
## Good Example
```php
it('creates separate records with different keys', function () {
    $first  = $this->postJson('/api/posts', $data, ['Idempotency-Key' => Str::uuid()->toString()]);
    $second = $this->postJson('/api/posts', $data, ['Idempotency-Key' => Str::uuid()->toString()]);

    $first->assertCreated();
    $second->assertCreated();

    expect(Post::count())->toBe(2); // Two separate resources
});
```
---
## Exceptions
When the operation is naturally idempotent (e.g., PUT that replaces a resource), different keys may result in the same outcome.
---
## Consequences Of Violation
Idempotency key collision; different keys create same resource; users cannot submit multiple similar requests.
---

## Test Missing And Invalid Key Formats
---
## Category
Testing
---
## Rule
Test that a missing `Idempotency-Key` header proceeds normally (no idempotency applied) and that invalid key formats return 400/422.
---
## Reason
An idempotency middleware that requires keys on every request breaks non-idempotent clients. An idempotency middleware that accepts empty strings or malformed keys stores bad cache keys, causing cache collisions or panics. Both boundaries must be tested.
---
## Bad Example
```php
it('handles idempotency', function () {
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => 'valid-key'])->assertCreated();
    // Missing-key and invalid-key scenarios untested
});
```
---
## Good Example
```php
it('proceeds normally without idempotency key', function () {
    $this->postJson('/api/posts', $data)->assertCreated();
});

it('rejects empty idempotency key', function () {
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => ''])
        ->assertStatus(422);
});

it('rejects malformed idempotency key', function () {
    $this->postJson('/api/posts', $data, ['Idempotency-Key' => 'not-a-valid-uuid!'])
        ->assertStatus(422);
});
```
---
## Exceptions
When the application uses non-UUID keys (e.g., arbitrary strings), adjust the invalid-format test to the key specification.
---
## Consequences Of Violation
Empty key crashes middleware; missing key on required-idempotency endpoint blocks clients; invalid keys cause cache collisions.
---

## Use Persistent Cache Driver
---
## Category
Testing
---
## Rule
Never use the `array` cache driver for idempotency tests — use `file` or `redis` that persists cache across test requests.
---
## Reason
Idempotency stores the response in the cache keyed by the idempotency key. The `array` cache driver resets its store between every HTTP request within the same test, making the retry request a cache miss — the operation runs twice and returns conflicting results.
---
## Bad Example
```php
// CACHE_DRIVER=array — cache resets between requests
it('returns cached response on retry', function () {
    $key = Str::uuid();

    $this->postJson('/api/orders', $data, ['Idempotency-Key' => $key])->assertCreated();
    $this->postJson('/api/orders', $data, ['Idempotency-Key' => $key])->assertCreated();

    expect(Order::count())->toBe(2); // Cache miss — duplicate order despite test passing
});
```
---
## Good Example
```php
protected function setUp(): void
{
    parent::setUp();
    Config::set('cache.default', 'file');
    Cache::flush();
}

it('returns cached response on retry', function () {
    $key = Str::uuid();

    $this->postJson('/api/orders', $data, ['Idempotency-Key' => $key])->assertCreated();
    $this->postJson('/api/orders', $data, ['Idempotency-Key' => $key])->assertCreated();

    expect(Order::count())->toBe(1); // Cache hit — deduplication works
});
```
---
## Exceptions
When using a dedicated idempotency storage (database table, Redis directly) that persists independently of the cache driver.
---
## Consequences Of Violation
Idempotency tests pass with array cache but fail in production; duplicate operations in production despite passing tests.
---
