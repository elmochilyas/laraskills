## Use Sync Indexing for Development, Queue for Production
---
## Category
Architecture
---
## Rule
Always configure Scout to use sync (inline) indexing in development and testing, and queued indexing in production.
---
## Reason
Sync indexing adds 20-200ms to every write request. In production with high write volume, this degrades API response times. Sync in dev enables immediate feedback and error detection.
---
## Bad Example
```php
// .env — same in all environments
SCOUT_QUEUE=false // Production also uses sync
```
---
## Good Example
```php
// .env.dev
SCOUT_QUEUE=false

// .env.production
SCOUT_QUEUE=true
```
---
## Exceptions
Very low-traffic production applications where sync latency is acceptable.
---
## Consequences Of Violation
Slow API responses in production, degraded user experience, potential timeouts.

## Test with Sync Mode to Catch Indexing Errors Early
---
## Category
Testing
---
## Rule
Always run tests with sync indexing enabled (`SCOUT_QUEUE=false`) to immediately detect indexing failures in CI.
---
## Reason
Queue mode defers indexing errors to job workers. Tests with sync mode surface engine connection failures, schema mismatches, and serialization errors before deployment.
---
## Bad Example
```php
// Tests configured with SCOUT_QUEUE=true
// Indexing failures only caught in Horizon logs
```
---
## Good Example
```php
// phpunit.xml
<env name="SCOUT_QUEUE" value="false"/>

// Test catches error immediately
public function test_post_is_indexed()
{
    $post = Post::factory()->create();
    $results = Post::search('test')->get();
    $this->assertCount(1, $results);
}
```
---
## Exceptions
When using `Scout::fake()` for complete search mocking.
---
## Consequences Of Violation
Indexing bugs slipping into production, silent data inconsistencies.

## Monitor Sync Latency to Decide When to Switch to Queue
---
## Category
Performance
---
## Rule
Always monitor write request latency in sync mode and switch to queued indexing when average latency exceeds 50ms.
---
## Reason
Sync indexing that adds 100ms+ to write requests indicates either high network latency to the search engine or heavy write volume. Queue mode decouples writes from search updates.
---
## Bad Example
```php
// No monitoring — sync mode running in production with 300ms latency
```
---
## Good Example
```php
// Log sync indexing latency
$start = microtime(true);
$post->save();
$latency = (microtime(true) - $start) * 1000;

if ($latency > 50) {
    Log::warning("Search sync latency: {$latency}ms");
}
```
---
## Exceptions
Applications with guaranteed low-latency search engine co-location.
---
## Consequences Of Violation
Slow page loads, poor API response times, user-facing delays.
