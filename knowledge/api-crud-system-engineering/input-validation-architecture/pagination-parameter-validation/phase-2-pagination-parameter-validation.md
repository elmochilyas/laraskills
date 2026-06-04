# Pagination Parameter Validation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** pagination, query-parameters, pagination-validation, per-page, cursor, laravel

## Executive Summary
Phase 2 covers validating pagination parameters — `page`, `per_page`, `cursor`, and related meta-parameters. Pagination validation ensures efficient query generation, prevents resource exhaustion, and provides predictable, bounded responses.

## Core Concepts

### Pagination Validation Dimensions

| Parameter | Purpose | Constraints |
|---|---|---|
| `page` | Page number (offset pagination) | integer, min: 1 |
| `per_page` | Items per page | integer, min: 1, max: enforced (default 15-100) |
| `cursor` | Cursor for cursor-based pagination | string, base64-encoded, format-validated |
| `offset` | Starting point (offset pagination) | integer, min: 0 |

### Pagination as a Performance Constraint
Pagination parameters are not just UI concerns — they are **performance controls**. Unvalidated pagination leads to:
- Full table scans with large `per_page` values.
- Deep offset scans with high `page` values (OFFSET 100000 on MySQL).
- Memory exhaustion with unbounded result sets.

## Internal Mechanics

### Standard Index Request with Pagination
```php
class IndexPostsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'page' => ['integer', 'min:1', 'max:10000'],
            'per_page' => ['integer', 'min:1', 'max:100'],
            'sort' => ['string', Rule::in(['created_at', 'title', '-created_at', '-title'])],
            'direction' => ['string', Rule::in(['asc', 'desc'])],
            'search' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'page' => (int) $this->input('page', 1),
            'per_page' => min((int) $this->input('per_page', 15), 100),
        ]);
    }
}
```

### Cursor-Based Pagination Validation
```php
class IndexPostsCursorRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'cursor' => ['sometimes', 'string', 'size:24'], // Base64 encoded cursor
            'per_page' => ['integer', 'min:1', 'max:100'],
            'direction' => ['string', Rule::in(['forward', 'backward'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'per_page' => min((int) $this->input('per_page', 25), 100),
            'direction' => $this->input('direction', 'forward'),
        ]);
    }
}
```

## Patterns

### Reusable Pagination Trait
```php
trait HasPaginationValidation
{
    public function paginationRules(): array
    {
        return [
            'page' => ['integer', 'min:1'],
            'per_page' => ['integer', 'min:1', 'max:' . $this->maxPerPage()],
        ];
    }

    protected function maxPerPage(): int
    {
        return 100;
    }

    protected function preparePagination(): void
    {
        $this->merge([
            'page' => max(1, (int) $this->input('page', 1)),
            'per_page' => min(
                max(1, (int) $this->input('per_page', 15)),
                $this->maxPerPage()
            ),
        ]);
    }
}

// Usage:
class IndexPostsRequest extends FormRequest
{
    use HasPaginationValidation;

    public function rules(): array
    {
        return array_merge($this->paginationRules(), [
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'search' => ['sometimes', 'string', 'max:255'],
        ]);
    }

    protected function prepareForValidation(): void
    {
        $this->preparePagination();
    }
}
```

### Max Per-Page by Resource Type
```php
class IndexPostsRequest extends FormRequest
{
    protected function maxPerPage(): int
    {
        return match (true) {
            $this->user()?->hasRole('admin') => 500,
            default => 100,
        };
    }
}

class IndexAuditLogsRequest extends FormRequest
{
    protected function maxPerPage(): int
    {
        return 50; // Audit logs are large — limit more aggressively
    }
}
```

### Cursor Validation with Decoding
```php
class IndexPostsCursorRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'cursor' => [
                'sometimes',
                'string',
                function ($attribute, $value, $fail) {
                    $decoded = base64_decode($value, true);
                    if ($decoded === false || !str_contains($decoded, ':')) {
                        $fail('The cursor format is invalid.');
                    }
                },
            ],
            'per_page' => ['integer', 'min:1', 'max:100'],
        ];
    }
}
```

### Pagination Meta in Response Validation
```php
public function test_pagination_meta_is_present(): void
{
    Post::factory()->count(30)->create();

    $response = $this->getJson('/api/v1/posts?per_page=10');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'data',
        'meta' => [
            'current_page',
            'last_page',
            'per_page',
            'total',
        ],
        'links' => [
            'first',
            'last',
            'prev',
            'next',
        ],
    ]);
    $response->assertJsonPath('meta.per_page', 10);
    $response->assertJsonPath('meta.total', 30);
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| per_page max enforced per-resource | Prevents expensive queries on specific endpoints | Global max — too permissive for some resources |
| Pagination trait for reuse | Consistent across all index endpoints | Copy-paste rules — inconsistent limits |
| Default injected in prepareForValidation() | Clients omit pagination safely | Required fields — breaks existing clients without updates |
| Cursor format validation | Prevents invalid cursor injection attacks | No validation — SQL injection risk through cursor |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Global per_page max | Bounded query cost | Too restrictive for admin reports |
| Per-resource per_page max | Appropriate limits per endpoint | More configuration per request |
| Default values in prepareForValidation() | Optional params for clients | Hidden defaults may surprise |
| Cursor validation | Security against tampering | More code; must keep format stable across versions |

## Performance Considerations
- Enforce `per_page` max to bound query result sets and memory usage.
- Deep `page` values (>10000) cause OFFSET performance issues — consider cursor-based pagination for large datasets.
- Validating cursor format prevents invalid queries but adds overhead.
- Default `per_page` should match application page size expectations (15-25 is typical).

## Production Considerations
- Set `per_page` max based on expected row size — audit logs: 50; posts: 100; lightweight items: 500.
- Monitor `per_page` distribution — clients requesting max frequently may indicate insufficient default.
- Log pagination parameter anomalies (page > 10000, per_page = max) for abuse detection.
- Document `per_page` limits in OpenAPI schema.

## Common Mistakes
- Not setting a hard `per_page` max — allows unbounded result sets.
- Using `per_page` default that's too high (100+) — wastes resources on every list view.
- Not validating `page` as integer — string injection through page parameter.
- Forgetting `min:1` on `per_page` — a zero or negative value causes query errors.
- Using offset pagination for large datasets — deep pages become exponentially slower.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| per_page not validated | Memory exhaustion with large per_page | Enforce hard max in validation rules |
| page not bounded | Deep offset query timeout | Set max page; or switch to cursor pagination |
| Cursor tampering | Invalid base64 → 500 error | Validate cursor format; catch decode exceptions |
| Default not set | Missing per_page defaults | Always inject defaults in prepareForValidation() |

## Ecosystem Usage

### Laravel Built-in Pagination
```php
// Controller uses validated pagination params
public function index(IndexPostsRequest $request): LengthAwarePaginator
{
    return Post::query()
        ->paginate(
            perPage: $request->validated('per_page', 15),
            page: $request->validated('page', 1),
        );
}
```

### Laravel Cursor Pagination
```php
public function index(IndexPostsCursorRequest $request): CursorPaginator
{
    return Post::query()
        ->cursorPaginate(
            perPage: $request->validated('per_page', 25),
            cursor: $request->validated('cursor'),
        );
}
```

### Spatie Query Builder Pagination
```php
use Spatie\QueryBuilder\QueryBuilder;

public function index(IndexPostsRequest $request)
{
    return QueryBuilder::for(Post::class)
        ->allowedSorts(['title', 'created_at'])
        ->paginate(
            perPage: $request->validated('per_page', 15),
        );
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class design pattern.
- **input-preparation** — default injection for pagination params.

### Related Topics
- **validation-rule-array-design** — sorting and filtering array validation.
- **conditional-validation-patterns** — role-based per_page limits.

### Advanced Follow-up Topics
- **pagination-strategies** — broader pagination architecture.
- **response-structures** — paginated response meta structure.

## Research Notes

### Source Analysis
Laravel's `LengthAwarePaginator` accepts `perPage` and `currentPage` from the request. The `paginate()` method on Eloquent reads these from the request's query string by default. When using FormRequest, the validated parameters override these defaults, giving you control over bounds.

### Key Insight
Pagination parameters are the **most impactful performance controls** exposed to API clients. A single request with `per_page=100000` can consume more database and memory resources than 1000 normal requests. Proper validation of pagination is not just a DX concern — it is an infrastructure protection measure.

### Version-Specific Notes
- Laravel 10: `CursorPaginator` available for cursor-based pagination.
- Laravel 11: No changes.
- PHP 8.2: `max()` / `min()` functions work well for capping per_page in default injection.
