# Bulk Operation Testing — Rules

## Test Partial Success Scenario
---
## Category
Testing
---
## Rule
Always test bulk endpoints with a mix of valid and invalid items — assert that valid items succeed and invalid items return per-item errors.
---
## Reason
Partial success is the most common real-world bulk operation scenario. An implementation that only handles all-success or all-failure will give incorrect results when some items pass and some fail — it may roll back the entire batch or return 500. Testing partial success catches the most nuanced bulk-operation bugs.
---
## Bad Example
```php
it('creates all valid items', function () {
    $items = [['title' => 'One'], ['title' => 'Two']];

    $this->postJson('/api/posts/bulk', ['items' => $items])
        ->assertJsonCount(2, 'data');
    // Does not test mixed valid/invalid input
});
```
---
## Good Example
```php
it('returns partial success with per-item errors', function () {
    $items = [
        ['title' => 'Valid Post'],
        ['title' => ''],           // Invalid — missing title
        ['title' => 'Another Valid'],
    ];

    $response = $this->postJson('/api/posts/bulk', ['items' => $items]);

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
    expect($response->json('errors'))->toHaveCount(1);
    expect($response->json('errors'))->toHaveKey('1');
});
```
---
## Exceptions
When the bulk endpoint uses all-or-nothing transactions (one bad item rolls back the entire batch), partial success is not applicable.
---
## Consequences Of Violation
Bulk endpoint silently rolls back entire batch on one bad item; client receives no indication which items failed; data loss.
---

## Test Batch Size Limits
---
## Category
Testing
---
## Rule
Assert that empty arrays, single-item arrays, and arrays exceeding the max batch size are correctly validated.
---
## Reason
A bulk endpoint without size limits accepts 10,000 items and crashes the server with memory exhaustion. An endpoint that accepts empty arrays may create records with no validation. Boundary size tests prevent these production outages.
---
## Bad Example
```php
it('processes batch', function () {
    $items = [['title' => 'Test']];

    $this->postJson('/api/posts/bulk', ['items' => $items])->assertOk();
    // Does not test empty batch or oversize batch
});
```
---
## Good Example
```php
it('rejects empty batch', function () {
    $this->postJson('/api/posts/bulk', ['items' => []])
        ->assertStatus(422);
});

it('processes single-item batch', function () {
    $this->postJson('/api/posts/bulk', ['items' => [['title' => 'Test']]])
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('rejects batch exceeding max size', function () {
    $items = Post::factory()->count(200)->raw();

    $this->postJson('/api/posts/bulk', ['items' => $items])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});
```
---
## Exceptions
When the bulk endpoint intentionally has no maximum (e.g., admin import endpoints), test performance at expected max sizes instead.
---
## Consequences Of Violation
Server crashes from oversized batch; empty batch silently creates zero records (or passes validation incorrectly); production outage.
---

## Assert Per-Item Error Structure
---
## Category
Testing
---
## Rule
Assert that errors are keyed by the input item index, allowing the client to map errors back to specific items.
---
## Reason
A bulk error response like `{"errors": {"title": ["Required"]}}` is ambiguous — which item failed? Per-item indexing (`errors.0.title`, `errors.2.title`) enables the client to show inline validation errors on the correct form row. Without per-item indexing, the client cannot associate errors with specific items.
---
## Bad Example
```php
it('returns errors for invalid items', function () {
    $items = [['title' => ''], ['title' => 'Valid']];

    $response = $this->postJson('/api/posts/bulk', ['items' => $items]);

    $response->assertStatus(422);
    // Does not verify error indexing by item position
});
```
---
## Good Example
```php
it('indexes errors by item position', function () {
    $items = [['title' => 'Valid'], ['title' => ''], ['title' => '']];

    $response = $this->postJson('/api/posts/bulk', ['items' => $items]);

    $response->assertOk();
    $response->assertJsonStructure([
        'data' => ['*' => ['id', 'title']],
        'errors' => ['1' => ['title'], '2' => ['title']],
    ]);
    expect($response->json('errors'))->toHaveKeys(['1', '2']);
    expect($response->json('errors'))->not->toHaveKey('0');
});
```
---
## Exceptions
When the bulk operation processes all items atomically (all-or-nothing), per-item errors may not apply.
---
## Consequences Of Violation
Client cannot identify which items failed; user sees generic error instead of inline per-row validation; poor UX.
---

## Test Transactional Rollback
---
## Category
Testing
---
## Rule
When the bulk endpoint uses transactional (all-or-nothing) processing, assert that zero records exist in the database when one item fails.
---
## Reason
An all-or-nothing bulk endpoint that partially persists records on failure leaves the database in an inconsistent state. The rollback test is the only way to confirm the transaction boundary is correctly implemented around the batch.
---
## Bad Example
```php
it('rejects batch with invalid item', function () {
    $items = [['title' => 'Valid'], ['title' => '']];

    $this->postJson('/api/posts/bulk', ['items' => $items])->assertStatus(422);
    // Does not assert that no records were persisted
});
```
---
## Good Example
```php
it('rolls back all items when one fails in transactional mode', function () {
    $items = [['title' => 'Valid'], ['title' => '']];

    $this->postJson('/api/posts/bulk', ['items' => $items])->assertStatus(422);

    expect(Post::count())->toBe(0); // No partial persistence
});
```
---
## Exceptions
When the bulk operation uses batch processing (partial success), transactional rollback does not apply — test partial persistence instead.
---
## Consequences Of Violation
Partial data persistence on failure; database in inconsistent state; manual cleanup required.
---

## Test Concurrent Request Handling
---
## Category
Testing
---
## Rule
When bulk endpoints use queue-based or parallel processing, test that concurrent requests to the batch endpoint don't cause race conditions.
---
## Reason
Processing bulk items asynchronously introduces race conditions: two concurrent requests may process the same item, duplicate records, or deadlock. Testing concurrent requests at the feature level catches race conditions that unit tests miss.
---
## Bad Example
```php
it('processes bulk items', function () {
    $items = [['title' => 'One'], ['title' => 'Two']];

    $this->postJson('/api/posts/bulk', ['items' => $items])->assertOk();
    // No concurrent request testing
});
```
---
## Good Example
```php
it('handles concurrent bulk requests', function () {
    $items = [['title' => 'Concurrent']];

    $responses = [];
    for ($i = 0; $i < 5; $i++) {
        $responses[] = $this->postJson('/api/posts/bulk', ['items' => $items]);
    }

    foreach ($responses as $response) {
        expect($response->status())->toBeIn([200, 201, 429]);
    }
    // No duplicate records despite concurrent requests
    expect(Post::count())->toBe(5);
});
```
---
## Exceptions
When the bulk endpoint processes items synchronously in a single thread, concurrent testing may not apply.
---
## Consequences Of Violation
Race conditions cause duplicate records or data corruption; production incidents from concurrent bulk operations.
---
