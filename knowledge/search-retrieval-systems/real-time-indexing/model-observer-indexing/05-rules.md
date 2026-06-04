---
## Rule Name
Always Queue Observers in Production

## Category
Performance

## Rule
Always use queued observer indexing in production by setting `'queue' => true` in Scout config.

## Reason
Synchronous observer indexing blocks the HTTP response on search engine latency. Queuing defers it to background workers.

## Bad Example
```php
// config/scout.php
'queue' => false,  // Observer syncs inline — blocks saves
```

## Good Example
```php
// config/scout.php
'queue' => true,
```

## Exceptions
Development environments where simplicity is preferred.

## Consequences Of Violation
Model saves blocked on search engine API latency in production.

---
## Rule Name
Implement shouldBeSearchable for Conditional Indexing

## Category
Performance

## Rule
Always implement `shouldBeSearchable()` to prevent indexing records that should not appear in search results (drafts, inactive).

## Reason
Indexing non-searchable records wastes index storage and pollutes search results. Gating prevents both issues.

## Bad Example
```php
// All records indexed — including drafts
public function shouldBeSearchable(): bool { return true; }
```

## Good Example
```php
public function shouldBeSearchable(): bool
{
    return $this->is_published && $this->is_active;
}
```

## Exceptions
Models where every record should be searchable regardless of status.

## Consequences Of Violation
Draft/inactive records appearing in search results and wasting index storage.

---
## Rule Name
Test Observer Indexing in Tests

## Category
Testing

## Rule
Always test that model saves trigger index updates and deletes remove from index.

## Reason
Observer-based indexing is silent — failures don't throw visible errors. Tests catch broken indexing before production.

## Bad Example
```php
// No test — index may silently fall out of sync
```

## Good Example
```php
/** @test */
public function saved_product_is_indexed()
{
    $product = Product::factory()->create();
    Queue::assertPushed(MakeSearchable::class, fn($job) => $job->model->is($product));
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected indexing failures — database and index drift apart silently.
