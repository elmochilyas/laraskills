# Anti-Patterns — Bulk Request Validation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Bulk Request Validation |
| Difficulty | Advanced |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| All-or-Nothing Rejection | High | High | Code review: entire batch rejected when one item fails |
| No Per-Item Error Reporting | High | High | Code review: generic error message without per-item pointers |
| No max on Bulk Array | Critical | Medium | Code review: array field without max constraint |
| Same Rate Limit as Single Endpoints | Medium | Medium | Code review: no adjusted rate limiting for bulk endpoints |
| Async Processing With No Validation | High | Low | Code review: raw data queued without any validation |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Reusing Single-Resource FormRequest for Bulk | Same rules array applied to bulk without wildcard adaptation | Rules don't apply to array elements; bulk bypasses validation |
| Per-Item Uniqueness via DB Constraints Only | Relying on DB unique indexes instead of pre-checking | Wasteful rollbacks and wasted processing |
| No Cross-Item Validation | Duplicate emails, SKUs, or titles pass validation | Data integrity issues at the application level |

---

## Anti-Pattern Details

### AP-BRV-01: All-or-Nothing Rejection

**Description**: The entire batch is rejected with a 422 response when a single item fails validation. The client must fix the one error and resubmit the entire batch, even if the other 99 items are valid. This is extremely wasteful for large batches and creates a poor developer experience for API consumers.

**Root Cause**: Applying single-resource validation mentality to bulk operations. The developer reuses single-item validation logic without adapting for batch semantics.

**Impact**:
- Client wastes bandwidth resubmitting valid items
- Processing delay for large batches with minor errors
- Poor user experience: one typo in a CSV import rejects the entire file
- No partial progress: successful items are never processed

**Detection**:
- Code review: bulk endpoint returns 422 for any item failure
- Code review: `Validator::make()` applied to entire payload, not per-item
- Integration tests: partial-failure scenarios return 4xx instead of 200 with meta.failed

**Solution**:
- Validate all items independently, collect errors per item
- Return HTTP 200/201 with `meta.failed` count and per-item errors
- Process valid items and report failures to the client

**Example**:
```php
// BEFORE: All-or-nothing rejection
public function store(BulkStorePostsRequest $request): JsonResponse
{
    $posts = [];
    foreach ($request->input('posts') as $data) {
        $validator = Validator::make($data, $this->itemRules());
        if ($validator->fails()) {
            return response()->json(['error' => 'Validation failed'], 422); // ❌ whole batch rejected
        }
        $posts[] = Post::create($validator->validated());
    }
    return PostResource::collection($posts);
}

// AFTER: Partial success
public function store(BulkStorePostsRequest $request): JsonResponse
{
    $valid = [];
    $errors = [];

    foreach ($request->input('posts') as $index => $data) {
        $validator = Validator::make($data, $this->itemRules());
        if ($validator->fails()) {
            $errors[] = ['index' => $index, 'errors' => $validator->errors()];
        } else {
            $valid[] = Post::create($validator->validated());
        }
    }

    return response()->json([
        'data' => PostResource::collection($valid),
        'meta' => ['total' => count($request->input('posts')), 'failed' => count($errors)],
        'errors' => $errors,
    ], count($errors) > 0 ? 200 : 201);
}
```

---

### AP-BRV-02: No Per-Item Error Reporting

**Description**: When validation fails for some items, the error response contains a generic message like "Some items failed validation" with no indication of which items failed or why. The client must guess which item has the problem or re-submit the entire batch to discover the error.

**Root Cause**: Minimal error handling. The developer didn't implement per-item error collection, assuming the client can identify failures independently.

**Impact**:
- Client cannot programmatically identify failed items
- Manual debugging required for bulk import failures
- Invalid items may be repeatedly resubmitted in good batches
- Slow feedback loop: client fixes one error, resubmits, discovers the next

**Detection**:
- Code review: bulk validation error response includes no index or item reference
- Code review: `$validator->errors()` collected globally, not per-item
- Integration tests: bulk error response lacks per-item error pointers

**Solution**:
- Track each item by its index in the batch
- Return per-item error objects with index and field-level errors
- Use wildcard-style pointer format: `items.3.email`

**Example**:
```php
// BEFORE: No per-item reporting
return response()->json([
    'error' => 'Some items failed validation', // ❌ no per-item details
], 422);

// AFTER: Per-item error reporting
$errors = [];
foreach ($request->input('posts') as $index => $data) {
    $validator = Validator::make($data, $this->itemRules());
    if ($validator->fails()) {
        foreach ($validator->errors()->toArray() as $field => $messages) {
            $errors["items.{$index}.{$field}"] = $messages;
        }
    }
}

return response()->json([
    'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Some items failed validation.', 'status' => 422],
    'detail' => ['fields' => $errors], // ✅ per-item pointers
], 422);
```

---

### AP-BRV-03: No max on Bulk Array

**Description**: The bulk array field has no maximum size constraint — `'posts' => ['required', 'array']` without `max:N`. An attacker can submit a batch with 100,000 items, consuming server memory for deserialization, database connections for processing, and CPU time for validation. This is a critical resource exhaustion vulnerability.

**Root Cause**: Oversight or assuming clients will be reasonable. The developer didn't consider the resource cost of unbounded batch processing.

**Impact**:
- Memory exhaustion from large payload deserialization
- Database connection pool starvation during batch processing
- CPU exhaustion from validating thousands of items
- Denial of service via a single API request

**Detection**:
- Code review: array field rules without `max` constraint
- Code review: bulk endpoint with no guard on array size
- Security testing: sending 10000 items and observing resource usage

**Solution**:
- Always enforce a hard `max` on bulk arrays (50-500 depending on resource)
- Return a clear error message when the limit is exceeded
- Consider paginated bulk processing for very large datasets

**Example**:
```php
// BEFORE: No max
'posts' => ['required', 'array', 'min:1'], // ❌ no upper bound

// AFTER: Hard max enforced
'posts' => ['required', 'array', 'min:1', 'max:50'], // ✅ bounded

// With per-resource limit:
protected function maxBatchSize(): int
{
    return $this->user()->isAdmin() ? 500 : 50;
}

'posts' => ['required', 'array', 'min:1', 'max:' . $this->maxBatchSize()],
```

---

### AP-BRV-04: Same Rate Limit as Single Endpoints

**Description**: Bulk endpoints are configured with the same rate limit as single-resource endpoints — e.g., 60 requests per minute for both `POST /posts` and `POST /posts/bulk`. A client can multiply their effective write throughput by sending bulk requests instead of single ones, bypassing the intended rate limit by a factor of 50-100x.

**Root Cause**: Applying uniform rate limiting without considering operation cost. The developer throttles by request count, not by resource count.

**Impact**:
- Rate limiting effectively disabled for bulk endpoints
- Resource exhaustion: bulk at 60 RPM × 100 items = 6000 write operations
- Unfair advantage for clients using bulk API
- Cannot distinguish bulk abusers from single-endpoint power users

**Detection**:
- Code review: same rate limiter configuration for bulk and single endpoints
- Code review: no per-item throttling middleware for bulk operations
- Monitoring: bulk endpoint throughput far exceeds single-endpoint throughput

**Solution**:
- Apply tighter rate limits to bulk endpoints — divide by typical batch size
- Implement per-item rate accounting: count each item against the user's quota
- Use different throttle middleware instances per endpoint

**Example**:
```php
// BEFORE: Same rate limit
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);       // 60 RPM
    Route::post('/posts/bulk', [PostController::class, 'bulkStore']); // ❌ also 60 RPM = unlimited writes
});

// AFTER: Adjusted rate limits
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);         // 60 writes/min
});
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/posts/bulk', [PostController::class, 'bulkStore']); // 10 bulk ops/min = 500 writes/min at 50/batch
});
```

---

### AP-BRV-05: Async Processing With No Validation

**Description**: Bulk data is dispatched to a queue for async processing without any validation at the controller level. The raw request payload is queued directly, and validation happens inside the job after the response has been sent. If validation fails in the job, the data was already accepted (HTTP 202), but no error is returned to the client.

**Root Cause**: Premature optimization. The developer wants a fast response and moves all processing to a job, skipping the validation step entirely.

**Impact**:
- Client receives HTTP 202 for invalid data — no error feedback
- Invalid data sits in the queue consuming worker resources
- Job fails, retries, and eventually ends up in the failed_jobs table with no feedback loop
- Client has no way to know or correct the invalid submission

**Detection**:
- Code review: queue dispatch in controller without pre-validation
- Code review: `dispatch()` called with `$request->all()` before any `validate()` call
- Operations review: jobs failing with validation errors with no client notification

**Solution**:
- Always validate at the controller level before dispatching to the queue
- Use `Validator::make()` or FormRequest to validate the payload shape
- Catch validation errors in the job and notify the client asynchronously

**Example**:
```php
// BEFORE: Queue without validation
public function bulkStore(Request $request): JsonResponse
{
    ProcessBulkPosts::dispatch($request->input('posts')); // ❌ no validation
    return response()->json(['message' => 'Accepted'], 202);
}

// AFTER: Validate before queueing
public function bulkStore(BulkStorePostsRequest $request): JsonResponse
{
    $validated = $request->validated(); // ✅ validate first
    ProcessBulkPosts::dispatch($validated['posts']);
    return response()->json(['message' => 'Accepted', 'count' => count($validated['posts'])], 202);
}
```
