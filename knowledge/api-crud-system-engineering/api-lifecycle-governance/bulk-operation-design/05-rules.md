# Phase 5: Rules — Bulk Operation Design

## Rule 1: Preserve Request Order in Response
---
## Category
Design
---
## Rule
Always return bulk operation results in the same order as the request operations array. Never reorder results.
---
## Reason
Order-preserving responses enable consumers to map results to requests without correlation IDs. Reordering forces consumers to implement their own matching logic.
---
## Bad Example
```php
return response()->json([
    'results' => collect($operations)->shuffle()->values(), // random order
]);
```
---
## Good Example
```php
public function bulkStore(Request $request) {
    $results = [];
    foreach ($request->input('operations') as $index => $operation) {
        $results[$index] = $this->processOperation($operation);
    }
    ksort($results); // preserve request order
    return response()->json(['results' => array_values($results)]);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer confusion; mandatory correlation IDs required; support burden when mapping fails.
---

## Rule 2: Limit Batch Size to 500 Operations
---
## Category
Scalability
---
## Rule
Always enforce a maximum of 500 operations per bulk request at the middleware or gateway level. Never accept unlimited batch sizes.
---
## Reason
Unbounded batch sizes cause memory exhaustion, request timeouts, and unfair resource consumption across consumers.
---
## Bad Example
```php
// No batch size limit — consumer sends 50,000 operations
public function bulkStore(Request $request) {
    foreach ($request->input('operations') as $op) { ... } // OOM
}
```
---
## Good Example
```php
public function bulkStore(Request $request) {
    $operations = $request->input('operations', []);
    if (count($operations) > 500) {
        return response()->json([
            'error' => ['code' => 'BATCH_TOO_LARGE', 'limit' => 500]
        ], 413);
    }
    // process
}
```
---
## Exceptions
Enterprise-tier consumers with approved higher limits (up to 2000) may override via configuration.
---
## Consequences Of Violation
Memory exhaustion; HTTP 504 timeouts; DoS vulnerability via oversized batches.
---

## Rule 3: Use Per-Operation Transactions (Non-Atomic by Default)
---
## Category
Reliability
---
## Rule
Always process bulk operations in per-operation transactions, not a single atomic transaction. Never let one failed operation block other operations from succeeding.
---
## Reason
Partial failure is the primary value of bulk endpoints. Atomic transactions turn a single bad item into 500 failures.
---
## Bad Example
```php
DB::transaction(function () use ($operations) {
    foreach ($operations as $op) { // one failure rolls back ALL
        User::create($op['data']);
    }
});
```
---
## Good Example
```php
$results = [];
foreach ($operations as $op) {
    try {
        DB::beginTransaction();
        $results[] = ['status' => 201, 'data' => User::create($op['data'])->toArray()];
        DB::commit();
    } catch (Throwable $e) {
        DB::rollBack();
        $results[] = ['status' => 422, 'errors' => $e->getMessage()];
    }
}
```
---
## Exceptions
Operations requiring atomicity (money transfer between accounts within same batch) may use a transaction per group.
---
## Consequences Of Violation
Single bad item prevents all other items from being processed; consumer retries entire batch unnecessarily.
---

## Rule 4: Validate Each Operation Independently
---
## Category
Security
---
## Rule
Always validate and authorize each operation individually within a bulk request. Never perform batch-level validation only.
---
## Reason
Batch-level validation allows malicious operations to pass through unchecked alongside valid ones. Per-operation authorization prevents cross-tenant access escalation.
---
## Bad Example
```php
// Validates only batch envelope, not individual operations
$request->validate(['operations.*.data.name' => 'string']);
```
---
## Good Example
```php
foreach ($operations as $op) {
    $validator = Validator::make($op['data'], [
        'name' => 'required|string|max:255',
    ]);
    if ($validator->fails()) {
        $results[] = ['status' => 422, 'errors' => $validator->errors()];
        continue;
    }
    $this->authorize('create', User::class); // per-operation auth
}
```
---
## Exceptions
Read-only bulk operations may validate at batch level only.
---
## Consequences Of Violation
Invalid data committed through valid batch envelope; privilege escalation across consumers.
---

## Rule 5: Count Bulk Requests as Single Rate Limit Unit
---
## Category
Scalability
---
## Rule
Always count one bulk request as a single unit against the consumer's rate limit, regardless of how many operations it contains. Never multiply rate limit consumption by operation count.
---
## Reason
Counting per-operation makes bulk endpoints useless for their primary purpose — reducing network overhead. Consumers would revert to individual requests.
---
## Bad Example
```php
foreach ($operations as $op) {
    RateLimiter::hit($consumer->rateLimitKey()); // N hits per bulk request
}
```
---
## Good Example
```php
// Single rate limit check for the entire bulk request
RateLimiter::hit($consumer->rateLimitKey()); // 1 hit regardless of operation count
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers hit rate limits on bulk endpoints; switch back to individual requests; increased network overhead.
---

## Rule 6: Provide Per-Operation Correlation Identifiers
---
## Category
Design
---
## Rule
Always require or generate per-operation `request_id` or `correlation_id` in bulk requests and echo them back in responses. Never return bulk results without per-operation identifiers.
---
## Reason
Correlation IDs enable consumers to unambiguously map response results to request operations, even if order were to change due to parallel processing.
---
## Bad Example
```json
// Response without correlation identifiers
{ "results": [{ "status": 201 }, { "status": 422 }] }
```
---
## Good Example
```json
// Request with correlation IDs
{ "operations": [
    { "request_id": "op-1", "data": { "name": "Alice" } },
    { "request_id": "op-2", "data": { "name": "Bob" } }
]}
// Response echos them back
{ "results": [
    { "request_id": "op-1", "status": 201, "data": { "id": 1 } },
    { "request_id": "op-2", "status": 422, "errors": { "name": ["Exists"] } }
]}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer cannot determine which operations succeeded or failed; support escalations; wasted debugging time.
---

## Rule 7: Use Chunked Internal Processing for Large Batches
---
## Category
Performance
---
## Rule
Always process bulk operations in internal chunks (50 per chunk) with configurable parallel concurrency (max 10 threads). Never process all operations sequentially or with unlimited parallelism.
---
## Reason
Chunking manages memory usage and prevents database connection pool exhaustion. Parallelism improves throughput without overwhelming resources.
---
## Bad Example
```php
// Process all 500 operations in parallel — 500 DB connections
foreach ($operations as $op) {
    dispatch(fn() => $this->process($op)); // unlimited parallel
}
```
---
## Good Example
```php
$chunks = collect($operations)->chunk(50);
$chunks->each(function ($chunk) {
    $chunk->each(function ($op) {
        dispatch(new ProcessOperation($op))
            ->onConnection('redis')
            ->onQueue('bulk-processing');
    });
    // Process sequentially within chunk, parallel across chunks
});
```
---
## Exceptions
Ordered operations requiring strict sequence must process sequentially.
---
## Consequences Of Violation
Memory exhaustion (all operations in memory); database connection pool saturation; degraded performance for other consumers.
