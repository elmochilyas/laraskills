# Pagination Parameter Validation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** pagination, production, testing, cursor, rate-limiting, performance

## Executive Summary
Phase 3 covers production hardening for pagination — testing pagination validation, cursor-based pagination security, rate limiting by pagination depth, monitoring deep pagination abuse, and pagination schema documentation for client SDK generation.

## Core Concepts

### Pagination as an Attack Surface
Unvalidated pagination is a vector for resource exhaustion attacks:
- **Deep offset attacks**: Requesting `page=1000000` forces MySQL to scan and discard millions of rows.
- **Large per_page attacks**: `per_page=100000` loads all rows into memory.
- **Cursor manipulation**: Tampered cursors cause decode errors or query failures.

### Defensive Pagination Defaults
Every index endpoint must enforce:
- Hard max on `per_page` (cannot be overridden by client).
- Reasonable default `per_page` (15-25).
- Max `page` (or switch to cursor mode beyond a threshold).
- Cursor format validation and integrity checking.

## Internal Mechanics

### Role-Based Per-Page Limits
```php
class IndexPostsRequest extends FormRequest
{
    public function rules(): array
    {
        $maxPerPage = $this->user()?->hasRole('admin') ? 500 : 100;

        return [
            'page' => ['integer', 'min:1', 'max:10000'],
            'per_page' => ['integer', 'min:1', 'max:' . $maxPerPage],
            'cursor' => ['sometimes', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'page' => (int) $this->input('page', 1),
            'per_page' => min(
                (int) $this->input('per_page', 15),
                $this->user()?->hasRole('admin') ? 500 : 100
            ),
        ]);
    }
}
```

### Signed Pagination Cursors
```php
class SignedCursor
{
    public static function encode(array $payload): string
    {
        $payload['expires_at'] = now()->addHour()->timestamp;
        $payload['signature'] = hash_hmac('sha256', json_encode($payload), config('app.key'));
        return base64_encode(json_encode($payload));
    }

    public static function decode(string $cursor): ?array
    {
        $decoded = json_decode(base64_decode($cursor, true), true);

        if (!$decoded || !isset($decoded['signature'])) {
            return null;
        }

        $signature = $decoded['signature'];
        unset($decoded['signature']);

        $expected = hash_hmac('sha256', json_encode($decoded), config('app.key'));

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        if (($decoded['expires_at'] ?? 0) < now()->timestamp) {
            return null;
        }

        return $decoded;
    }
}
```

## Patterns

### Testing Pagination Validation
```php
class IndexPostsPaginationTest extends TestCase
{
    use ValidatesFormRequest;

    public function test_default_pagination_values(): void
    {
        $request = new IndexPostsRequest();

        $request->prepareForValidation();

        $this->assertEquals(1, $request->input('page'));
        $this->assertEquals(15, $request->input('per_page'));
    }

    public function test_per_page_capped_at_max(): void
    {
        $request = new IndexPostsRequest([], [], [], [], [], [
            'HTTP_ACCEPT' => 'application/json',
            'QUERY_STRING' => 'per_page=1000',
        ]);

        // Simulate query string input
        $request->query->set('per_page', '1000');
        $request->prepareForValidation();

        $this->assertLessThanOrEqual(100, (int) $request->input('per_page'));
    }

    public function test_negative_page_rejected(): void
    {
        $this->assertValidationFails(
            ['page' => -1],
            (new IndexPostsRequest())->rules(),
        );
    }

    public function test_string_page_rejected(): void
    {
        $this->assertValidationFails(
            ['page' => 'abc'],
            (new IndexPostsRequest())->rules(),
        );
    }

    public function test_zero_per_page_rejected(): void
    {
        $this->assertValidationFails(
            ['per_page' => 0],
            (new IndexPostsRequest())->rules(),
        );
    }

    public function test_cursor_format_validated(): void
    {
        $this->assertValidationPasses(
            ['cursor' => SignedCursor::encode(['last_id' => 100])],
            (new IndexPostsCursorRequest())->rules(),
        );

        $this->assertValidationFails(
            ['cursor' => base64_encode('invalid-format')],
            (new IndexPostsCursorRequest())->rules(),
        );
    }

    public function test_pagination_meta_in_response(): void
    {
        Post::factory()->count(25)->create();

        $response = $this->getJson('/api/v1/posts?per_page=10');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            'links' => ['first', 'last', 'prev', 'next'],
        ]);
        $response->assertJsonPath('meta.per_page', 10);
        $response->assertJsonPath('meta.current_page', 1);
    }

    public function test_page_out_of_range_returns_empty(): void
    {
        $response = $this->getJson('/api/v1/posts?page=99999');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
        $response->assertJsonPath('meta.current_page', 99999);
    }

    public function test_admin_has_higher_per_page_limit(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/posts?per_page=500');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 500);
    }

    public function test_cursor_pagination_returns_valid_cursor(): void
    {
        Post::factory()->count(30)->create();

        $response = $this->getJson('/api/v1/posts/cursor?per_page=10');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'meta' => ['path', 'per_page', 'next_cursor', 'prev_cursor'],
        ]);
        $this->assertNotNull($response->json('meta.next_cursor'));
    }
}

### Rate Limiting by Page Depth
```php
class PaginationRateLimiter
{
    public function __construct(
        private readonly RateLimiter $limiter,
    ) {}

    public function limit(FormRequest $request): void
    {
        $page = (int) $request->input('page', 1);
        $key = 'pagination:' . $request->user()?->id ?? $request->ip();

        // More restrictive for deep pages
        $maxAttempts = match (true) {
            $page > 1000 => 5,
            $page > 100 => 20,
            default => 60,
        };

        $decaySeconds = match (true) {
            $page > 1000 => 3600, // 1 hour
            default => 60,
        };

        $executed = $this->limiter->attempt(
            $key,
            $maxAttempts,
            fn () => true,
            $decaySeconds,
        );

        if (!$executed) {
            throw new HttpResponseException(
                response()->json([
                    'errors' => [[
                        'status' => '429',
                        'code' => 'PAGINATION_RATE_LIMITED',
                        'detail' => 'Too many deep pagination requests.',
                    ]],
                ], 429)
            );
        }
    }
}
```

### Pagination Query Performance Monitoring
```php
class PaginationMonitor
{
    public function record(IndexPostsRequest $request, float $queryTimeMs): void
    {
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);

        Log::debug('Pagination query', [
            'page' => $page,
            'per_page' => $perPage,
            'offset' => ($page - 1) * $perPage,
            'query_time_ms' => $queryTimeMs,
            'user_id' => $request->user()?->id,
            'endpoint' => $request->path(),
        ]);

        Metrics::histogram('pagination.query_time', $queryTimeMs, [
            'page_depth' => $page > 1000 ? 'deep' : ($page > 100 ? 'medium' : 'shallow'),
        ]);

        if ($page > 10000) {
            Log::warning('Extremely deep pagination detected', [
                'page' => $page,
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
            ]);
        }
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Signed cursors with expiration | Prevents cursor tampering and replay attacks |
| Role-based per_page limits | Administrators get higher limits without abusing default |
| Page-depth rate limiting | Prevents deep-scan resource exhaustion |
| Pagination monitoring | Detects abuse patterns and performance issues |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Signed cursors | Tamper-proof pagination | Extra CPU for hash; cursor expires |
| Role-based limits | Flexible per-user limits | Requires user context in validation |
| Page-depth rate limiting | Protects against deep scan attacks | Complex rate limiting logic |
| Deep page monitoring | Early abuse detection | Log volume for normal deep pagination |

## Performance Considerations
- Signed cursor generation adds ~1ms per paginated response.
- Base64 encoding/decoding of cursors is negligible.
- Rate limiting by page depth adds Redis calls — acceptable for pagination endpoints.
- Deep page queries (>10000) should use cursor pagination to avoid OFFSET performance cliff.

## Production Considerations
- Document pagination limits in OpenAPI spec with `minimum` and `maximum` annotations.
- Implement Graceful degradation: when page exceeds max, return last page instead of error.
- Use cursor pagination as default for any endpoint with >10000 expected records.
- Monitor 429 responses on pagination endpoints for abuse patterns.
- Cache total count for frequently-paginated resources to avoid COUNT(*) on every request.

## Common Mistakes
- Not enforcing max per_page — most common pagination security gap.
- Using offset pagination for datasets >100K records — becomes exponentially slower.
- Not validating cursor integrity — clients can craft cursors to access unauthorized data.
- Not setting a max page — allows arbitrary deep OFFSET values.
- Rate-limiting without per-page context — a single page=1 request with 100 items is fine.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| No per_page max | Query returns 1M rows | Always enforce max in rules() |
| Expired cursor returns error | Client pagination breaks | Return friendly error to refresh from page 1 |
| Cursor tampering | Decode exception | Validate before decode; return 422 with clear message |
| Deep offset timeout | 504 on page=1000000 | Enforce max page; switch to cursor pagination |
| Rate limiting legitimate deep pagination | 429 on valid use case | Allowlist for data export tools |

## Ecosystem Usage

### Laravel Pagination with Query Builder
```php
public function index(IndexPostsRequest $request): LengthAwarePaginator
{
    $perPage = $request->validated('per_page', 15);
    $page = $request->validated('page', 1);

    return Post::query()
        ->when($request->validated('search'), fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
        ->when($request->validated('status'), fn ($q, $status) => $q->where('status', $status))
        ->orderBy($request->validated('sort', 'created_at'))
        ->paginate($perPage, ['*'], 'page', $page);
}
```

### Spatie Query Builder with Pagination
```php
// Spatie Query Builder handles pagination validation internally
// but FormRequest should still bound the parameters
public function index(IndexPostsRequest $request)
{
    return QueryBuilder::for(Post::class)
        ->allowedFilters(['title', 'status'])
        ->allowedSorts(['title', 'created_at', 'updated_at'])
        ->paginate($request->validated('per_page', 15));
    // Spatie's paginate() still reads from request query string
    // FormRequest validation runs first, ensuring safe values
}
```

## Related Knowledge Units

### Prerequisites
- **pagination-parameter-validation** — Phase 2 pagination validation basics.
- **input-preparation** — default injection for pagination params.

### Related Topics
- **form-request-testing** — testing pagination validation.
- **validation-rule-array-design** — sorting/array validation for collection endpoints.

### Advanced Follow-up Topics
- **pagination-strategies** — broader pagination architecture (offset vs cursor).
- **response-structures** — paginated response meta structure.

## Research Notes

### Source Analysis
Laravel's paginator reads `page` from the request's query string by default via `Paginator::resolveCurrentPage()`. When using FormRequest validation, the validated `page` value is used via the second parameter of `paginate()` or `paginator()`.

### Key Insight
Pagination validation is one of the few validation concerns that directly protects **infrastructure stability**, not just data integrity. A single unvalidated pagination request can degrade database performance for all users. This makes pagination validation a security and operations concern, not just a correctness concern.

### Version-Specific Notes
- Laravel 10: `CursorPaginator` with `cursorPaginate()` for efficient large-dataset pagination.
- Laravel 11: No changes to pagination internals.
- PHP 8.2: `sodium_crypto_secretbox()` available for cursor encryption (beyond HMAC signing).
