# Bulk Request Validation — Rules

## Always Enforce Hard max on Bulk Arrays
---
## Category
Security | Performance | Scalability
---
## Rule
Always set a hard `max` constraint on every bulk request array based on expected resource size and processing capacity (typically 50–500).
---
## Reason
Without a `max`, a single request can submit unlimited items, causing memory exhaustion, database overload, or DoS through massive payload processing.
---
## Bad Example
```php
'posts' => ['required', 'array', 'min:1'], // No max — unbounded
```
---
## Good Example
```php
'posts' => ['required', 'array', 'min:1', 'max:50'],
```
---
## Exceptions
Internal admin endpoints with trusted consumers may use higher limits, but always enforce some maximum.
---
## Consequences Of Violation
Resource exhaustion attacks, slow queries on oversized batches, OOM errors, degraded API performance for other tenants.

---

## Use Wildcard Rules for Per-Item Validation
---
## Category
Code Organization | Maintainability
---
## Rule
Use `*` wildcard rules for per-item field validation instead of manually iterating and validating each item in a loop.
---
## Reason
Wildcard rules are declarative, framework-native, and produce consistent per-field error pointers automatically — manual loops require custom error reporting and are harder to maintain.
---
## Bad Example
```php
foreach ($this->input('posts') as $i => $post) {
    $validator = Validator::make($post, [
        'title' => ['required', 'string'],
    ]);
    // Manual error collection
}
```
---
## Good Example
```php
'posts' => ['required', 'array', 'min:1', 'max:50'],
'posts.*.title' => ['required', 'string', 'max:255'],
'posts.*.body' => ['required', 'string'],
```
---
## Exceptions
When per-item rules differ based on item properties (e.g., polymorphic items), use a manual loop with selective rule sets in the service layer.
---
## Consequences Of Violation
Duplicated validation logic, inconsistent error reporting formats, harder test coverage, fragile per-item indexing.

---

## Use after() Hook for Cross-Item Uniqueness, Not distinct
---
## Category
Reliability | Framework Usage
---
## Rule
Use the `after()` hook for cross-item uniqueness checks on objects or composite keys; `distinct` only works for scalar values.
---
## Reason
Laravel's `distinct` rule only validates that scalar values in a flat array are unique — it silently ignores object arrays. The `after()` hook provides full control for checking duplicates on composite fields.
---
## Bad Example
```php
'posts.*.title' => ['required', 'string', 'distinct'], // distinct ignored on objects
```
---
## Good Example
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $titles = collect($this->input('posts'))->pluck('title');
        $duplicates = $titles->duplicates();
        foreach ($duplicates as $index => $title) {
            $validator->errors()->add("posts.{$index}.title", "Duplicate title.");
        }
    });
}
```
---
## Exceptions
When validating a flat scalar array (e.g., `emails.*`) — `distinct` works correctly for scalar values.
---
## Consequences Of Violation
Duplicate items silently pass validation; duplicate detection must happen at the database layer, causing wasted queries and rollback errors.

---

## Return Per-Item Errors with Proper Pointers
---
## Category
Scalability | Maintainability
---
## Rule
Return per-item validation errors with precise field pointers (e.g., `posts.3.title`) so clients can identify and correct specific items.
---
## Reason
Without per-item pointers, a bulk request with 50 items and 3 errors each returns 150 undifferentiated error messages — clients cannot determine which items failed.
---
## Bad Example
```php
// Generic error with no item index
'title' => ['Title is required'],
```
---
## Good Example
```php
// Per-item pointer
'posts.3.title' => ['Title is required'],
'posts.7.body' => ['Body is required'],
```
---
## Exceptions
No common exceptions — always include item indices in error pointers for bulk endpoints.
---
## Consequences Of Violation
Poor developer experience, clients forced to re-submit entire batches, increased support burden for "which items failed?"

---

## Return Partial Success, Not All-or-Nothing
---
## Category
Scalability | Reliability
---
## Rule
Return HTTP 200/201 with a `meta.failed` count when some items in a batch fail, rather than rejecting the entire batch with 422.
---
## Reason
All-or-nothing rejection forces clients to re-submit all items (including valid ones), wasting bandwidth and increasing latency. Partial success lets clients fix only the failed items.
---
## Bad Example
```php
return response()->json(['errors' => [...]], 422); // Whole batch rejected
```
---
## Good Example
```php
return response()->json([
    'data' => [...],
    'meta' => ['total' => 50, 'failed' => 3, 'succeeded' => 47],
], 201);
```
---
## Exceptions
Financial transactions (payments, ledger entries) where atomicity is legally required — always use all-or-nothing with proper rollback.
---
## Consequences Of Violation
Unnecessary bandwidth consumption, increased client complexity, worse user experience for large batch operations.

---

## Use Separate FormRequests for Bulk Operations
---
## Category
Code Organization | Maintainability
---
## Rule
Define dedicated FormRequest classes for bulk endpoints (e.g., `BulkStorePostsRequest`) separate from single-resource FormRequests.
---
## Reason
Bulk validation rules (array size limits, wildcard rules, cross-item uniqueness) differ fundamentally from single-resource rules. Sharing a single FormRequest between both contexts requires complex conditional logic.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        if ($this->isMethod('post') && is_array($this->input('posts'))) {
            return ['posts' => ['array', 'max:50'], 'posts.*.title' => ['required']];
        }
        return ['title' => ['required']];
    }
}
```
---
## Good Example
```php
class BulkStorePostsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'posts' => ['required', 'array', 'min:1', 'max:50'],
            'posts.*.title' => ['required', 'string', 'max:255'],
        ];
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fragile conditional logic in rules methods; increased test complexity; accidental breaking of single-resource rules when changing bulk logic.

---

## Consider Async for Batches Larger Than 100 Items
---
## Category
Performance | Scalability
---
## Rule
Accept requests with >100 items but dispatch them to a queued job for async processing instead of synchronous validation and processing.
---
## Reason
Synchronous processing of large batches blocks the HTTP request for seconds or minutes, consuming worker threads and degrading API responsiveness.
---
## Bad Example
```php
public function store(BulkStorePostsRequest $request): JsonResponse
{
    foreach ($request->input('posts') as $post) {
        Post::create($post); // Synchronous — blocks request
    }
}
```
---
## Good Example
```php
public function store(BulkStorePostsRequest $request): JsonResponse
{
    ProcessBulkPosts::dispatch($request->validated(), auth()->id());
    return response()->json(['message' => 'Accepted', 'job_id' => ...], 202);
}
```
---
## Exceptions
Small batches (≤100 items) where synchronous completion is acceptable and the response should include created resource IDs.
---
## Consequences Of Violation
Request timeout for large batches; thread pool exhaustion; poor P99 latency; cascading failures under load.
