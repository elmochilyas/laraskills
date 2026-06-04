# Bulk Request Validation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** bulk-validation, production, testing, partial-success, async-processing

## Executive Summary
Phase 3 covers production hardening for bulk validation — partial success handling, idempotency for bulk operations, testing bulk validation, async processing with queued jobs, rate limiting for bulk endpoints, and integration with import/export pipelines.

## Core Concepts

### Partial Success Contract
Bulk endpoints should communicate exactly which items succeeded and which failed. The response must include a `meta` block with counts and indices so clients can retry only failed items.

### Idempotency in Bulk Operations
Bulk creates need idempotency keys to prevent duplicate items on retry. Each item should carry an `idempotency_key` for deduplication.

## Internal Mechanics

### Idempotent Bulk Create
```php
class BulkStorePostsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'max:64'],
            'posts' => ['required', 'array', 'min:1', 'max:50'],
            'posts.*.client_id' => ['required', 'string', 'max:64', 'distinct'],
            'posts.*.title' => ['required', 'string', 'max:255'],
            'posts.*.body' => ['required', 'string'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Check if idempotency key was already processed
            if ($this->idempotency()->exists($this->input('idempotency_key'))) {
                $validator->errors()->add(
                    'idempotency_key',
                    'This request has already been processed.'
                );
                return;
            }

            // Check for duplicate client_ids against existing records
            $clientIds = collect($this->input('posts'))->pluck('client_id');
            $existing = Post::whereIn('client_id', $clientIds)->pluck('client_id');

            if ($existing->isNotEmpty()) {
                foreach ($existing as $clientId) {
                    $index = $clientIds->search($clientId);
                    $validator->errors()->add(
                        "posts.{$index}.client_id",
                        "A post with client_id '{$clientId}' already exists."
                    );
                }
            }
        });
    }
}
```

## Patterns

### Testing Bulk Validation
```php
class BulkStorePostsValidationTest extends TestCase
{
    use ValidatesFormRequest;

    public function test_empty_batch_rejected(): void
    {
        $this->assertValidationFails(
            ['posts' => []],
            (new BulkStorePostsRequest())->rules(),
        );
    }

    public function test_exceeds_max_batch_size(): void
    {
        $items = array_map(fn ($i) => [
            'title' => "Post {$i}",
            'body' => 'Content',
        ], range(1, 51));

        $this->assertValidationFails(
            ['posts' => $items],
            (new BulkStorePostsRequest())->rules(),
        );
    }

    public function test_valid_batch_passes(): void
    {
        $items = array_map(fn ($i) => [
            'client_id' => "client-{$i}",
            'title' => "Post {$i}",
            'body' => 'Content',
        ], range(1, 3));

        $this->assertValidationPasses(
            ['idempotency_key' => 'batch-001', 'posts' => $items],
            (new BulkStorePostsRequest())->rules(),
            (new BulkStorePostsRequest())->messages(),
        );
    }

    public function test_single_item_failure_reported(): void
    {
        $items = [
            ['title' => 'Valid Post', 'body' => 'Content'],
            ['title' => '', 'body' => ''], // Invalid
            ['title' => 'Another Valid', 'body' => 'Content'],
        ];

        $request = new BulkStorePostsRequest();
        $validator = Validator::make(
            ['posts' => $items, 'idempotency_key' => 'test'],
            $request->rules(),
        );

        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->messages();
        $this->assertArrayHasKey('posts.1.title', $errors);
        $this->assertArrayHasKey('posts.1.body', $errors);
        $this->assertArrayNotHasKey('posts.0.title', $errors);
        $this->assertArrayNotHasKey('posts.2.title', $errors);
    }

    public function test_duplicate_titles_reported_correctly(): void
    {
        $items = [
            ['title' => 'Same Title', 'body' => 'Content 1'],
            ['title' => 'Unique Title', 'body' => 'Content 2'],
            ['title' => 'Same Title', 'body' => 'Content 3'],
        ];

        $request = new BulkStorePostsRequest();
        $validator = Validator::make(
            ['posts' => $items, 'idempotency_key' => 'test'],
            $request->rules(),
        );

        $request->withValidator($validator);

        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->messages();
        $this->assertArrayHasKey('posts.0.title', $errors);
        $this->assertArrayHasKey('posts.2.title', $errors);
        $this->assertArrayNotHasKey('posts.1.title', $errors);
    }

    public function test_bulk_partial_success_response(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/posts/bulk', [
                'posts' => [
                    ['title' => '', 'body' => 'Content'], // Fails
                    ['title' => 'Valid Post', 'body' => 'Content'], // Succeeds
                ],
            ]);

        $response->assertStatus(200); // Partial success
        $response->assertJsonStructure([
            'data',
            'meta' => ['total', 'failed', 'succeeded', 'failed_indices'],
        ]);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(1, $response->json('meta.failed'));
        $this->assertEquals(1, $response->json('meta.succeeded'));
    }

    public function test_bulk_with_duplicate_client_ids(): void
    {
        $items = [
            ['client_id' => 'dup-1', 'title' => 'First', 'body' => 'Content'],
            ['client_id' => 'unique-1', 'title' => 'Second', 'body' => 'Content'],
            ['client_id' => 'dup-1', 'title' => 'Third', 'body' => 'Content'],
        ];

        $validator = Validator::make(
            ['posts' => $items, 'idempotency_key' => 'test'],
            (new BulkStorePostsRequest())->rules(),
        );

        // distinct should catch duplicates within the batch
        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->messages();
        $this->assertArrayHasKey('posts.0.client_id', $errors);
        $this->assertArrayNotHasKey('posts.1.client_id', $errors);
        $this->assertArrayHasKey('posts.2.client_id', $errors);
    }
}
```

### Async Bulk Processing with Validation
```php
class BulkProcessPostsJob implements ShouldQueue
{
    public function handle(): void
    {
        $results = [];

        foreach ($this->items as $index => $item) {
            $validator = Validator::make($item, [
                'title' => ['required', 'string', 'max:255'],
                'body' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $results[$index] = [
                    'status' => 'failed',
                    'errors' => $validator->errors()->toArray(),
                ];
                continue;
            }

            try {
                Post::create($validator->validated());
                $results[$index] = ['status' => 'created'];
            } catch (\Throwable $e) {
                $results[$index] = [
                    'status' => 'error',
                    'errors' => [$e->getMessage()],
                ];
            }
        }

        // Store results for client to poll
        Cache::put(
            "bulk:{$this->batchId}:results",
            $results,
            now()->addDay()
        );
    }
}
```

### Rate Limiting for Bulk Endpoints
```php
class BulkRateLimiter
{
    public function __construct(
        private readonly RateLimiter $limiter,
    ) {}

    public function check(string $key, int $maxItemsPerMinute = 1000): bool
    {
        $cost = $this->limiter->attempts($key);

        if ($cost > $maxItemsPerMinute) {
            throw new HttpResponseException(
                response()->json([
                    'errors' => [[
                        'status' => '429',
                        'code' => 'RATE_LIMITED',
                        'detail' => 'Bulk operation rate limit exceeded.',
                    ]],
                ], 429)
            );
        }

        return true;
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| 200 OK with partial failures | Client can process successful items immediately |
| Idempotency keys on bulk | Safe retry without duplicates |
| Async processing with results cache | Non-blocking for large batches |
| Per-item distinct client_id | Prevents duplicates within batch before DB insert |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Synchronous bulk (small batches) | Simple, immediate response | Times out for large batches |
| Async bulk (large batches) | Handles thousands of items | Client must poll for results |
| Partial success (200) | Client processes partial results | Complex response parsing |
| Atomic all-or-nothing | Simple client logic | Wasteful when one item fails |

## Performance Considerations
- Synchronous bulk processing should be limited to 50-100 items.
- Async processing with queue jobs handles thousands but adds latency.
- Per-item DB uniqueness checks in `after()` — batch into single query where possible.
- Rate limit by item count, not request count — 1 request with 100 items ≠ 100 requests.

## Production Considerations
- Monitor bulk endpoint latency as a function of batch size.
- Log bulk operation summaries (batch ID, item count, success rate).
- Use database transactions for atomic bulk writes.
- Implement dead-letter queues for consistently failing items.
- Set PHP `max_execution_time` appropriately for synchronous bulk.

## Common Mistakes
- Not setting `max` constraint — accepts unlimited items, leading to timeouts.
- Returning 422 for all bulk failures — partial success is still success (200).
- Not providing `failed_indices` — client cannot identify which items to retry.
- Mixing bulk validation errors with processing errors in same response.
- Not rate-limiting by item count — clients can abuse with many small items.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Bulk timeout with large batch | 504 Gateway Timeout | Limit batch size; async for >100 items |
| Partial success not communicated | Client retries all items | Always include meta block with counts |
| Idempotency key collision | Duplicate items on retry | Check idempotency before processing |
| DB constraint violation mid-batch | Partial insert, transaction error | Validate thoroughly before DB insert |

## Ecosystem Usage

### Laravel Batch Processing with Queue
```php
Bus::batch([
    new ProcessPostItemJob($item1),
    new ProcessPostItemJob($item2),
])->then(function (Batch $batch) {
    // All succeeded
})->catch(function (Batch $batch, \Throwable $e) {
    // Some failed
})->finally(function (Batch $batch) {
    // Processing complete
})->dispatch();
```

### Spatie Laravel Data Bulk Rules
```php
class BulkPostsData extends Data
{
    /** @var PostData[] */
    public array $posts;

    public static function rules(): array
    {
        return [
            'posts' => ['required', 'array', 'min:1', 'max:100'],
            'posts.*.title' => ['required', 'string', 'max:255'],
            'posts.*.body' => ['required', 'string'],
        ];
    }

    public static function messages(): array
    {
        return [
            'posts.max' => 'A maximum of 100 posts can be created at once.',
            'posts.*.title.required' => 'Each post must have a title.',
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **bulk-request-validation** — Phase 2 bulk validation mechanics.
- **validation-rule-array-design** — wildcard rules for arrays.

### Related Topics
- **manual-validator-creation** — per-item validation in service layer.
- **form-request-testing** — testing bulk validation.

### Advanced Follow-up Topics
- **pagination-parameter-validation** — pagination for bulk response endpoints.
- **api-lifecycle-governance** — bulk endpoint lifecycle management.

## Research Notes

### Source Analysis
Laravel's `distinct` rule within wildcard arrays checks for duplicate values within the same array. When combined with `after()` callbacks for cross-referencing against the database, it provides a complete bulk validation pipeline. The `MessageBag` supports dot-notation keys like `posts.3.title`, enabling precise per-item error reporting.

### Key Insight
The key design decision in bulk validation is the **success model**: atomic vs. partial. Atomic is simple but wasteful; partial is efficient but complex. The choice depends on whether the operation is transactional (banking) or best-effort (data import). Most CRUD bulk operations benefit from partial success.

### Version-Specific Notes
- Laravel 10: `distinct` works in wildcard arrays for scalar values.
- Laravel 11: No changes.
- PHP 8.2: First-class callable syntax for array_map in batch transformation.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization