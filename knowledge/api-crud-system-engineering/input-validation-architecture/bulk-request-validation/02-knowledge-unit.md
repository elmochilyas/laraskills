# Bulk Request Validation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** bulk-validation, batch-processing, array-validation, multi-resource, laravel

## Executive Summary
Phase 2 covers validating arrays of resources in bulk API requests — patterns for batch creates, updates, and deletes. Bulk validation differs from single-resource validation by requiring per-item error reporting, resource limits, and batch-level cross-field validation.

## Mental Models

- **Bulk Validation as a Filter Pipeline** — Each item passes through the same validation filter; failed items are caught with their errors, valid items pass through for processing.
- **Per-Item vs Batch-Level Responsibility** — Per-item validation checks individual units; batch-level validation checks the collection as a whole (size limits, cross-item uniqueness).
- **Wildcard as Structural Reflection** — The `*` wildcard reflects the array structure, applying rules uniformly across all elements without manual iteration.
- **Partial Success as a Contract** — Bulk operations communicate partial success through error metadata (`meta.failed`), not solely through HTTP status codes.

## Core Concepts

### Bulk Request Shapes
```json
// Batch create
{
    "posts": [
        { "title": "Post 1", "body": "Content 1" },
        { "title": "Post 2", "body": "Content 2" }
    ]
}

// Batch update
{
    "posts": [
        { "id": 1, "title": "Updated Title 1" },
        { "id": 2, "title": "Updated Title 2" }
    ]
}
```

### Per-Item vs Batch-Level Validation
| Level | Scope | Examples |
|---|---|---|
| Per-item | Each resource independently | title required, body max length |
| Cross-item | Across items in the batch | Duplicate emails, unique SKUs |
| Batch-level | The batch as a whole | Item count limits, total size |

## Internal Mechanics

### Wildcard Rules for Bulk Validation
```php
public function rules(): array
{
    return [
        'posts' => ['required', 'array', 'min:1', 'max:100'],
        'posts.*.title' => ['required', 'string', 'max:255'],
        'posts.*.body' => ['required', 'string'],
        'posts.*.status' => ['sometimes', Rule::in(['draft', 'published'])],
    ];
}
```

### Cross-Item Uniqueness Validation
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $titles = collect($this->input('posts'))->pluck('title');

        $duplicates = $titles->duplicates();
        if ($duplicates->isNotEmpty()) {
            foreach ($duplicates as $index => $title) {
                $validator->errors()->add(
                    "posts.{$index}.title",
                    "Duplicate title '{$title}' found in batch."
                );
            }
        }
    });
}
```

## Patterns

### Individual Item Validation with Errors
```php
class BulkStorePostsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'posts' => ['required', 'array', 'min:1', 'max:50'],
            'posts.*.title' => ['required', 'string', 'max:255'],
            'posts.*.body' => ['required', 'string', 'max:10000'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Validate that all referenced tags exist
            $tagIds = collect($this->input('posts'))
                ->pluck('tags')
                ->flatten()
                ->unique()
                ->toArray();

            if (!empty($tagIds)) {
                $existingCount = Tag::whereIn('id', $tagIds)->count();
                if ($existingCount !== count($tagIds)) {
                    $validator->errors()->add(
                        'posts.*.tags',
                        'One or more tags do not exist.'
                    );
                }
            }
        });
    }
}
```

### Per-Item Error Response
```json
{
    "errors": [
        {
            "status": "422",
            "code": "VALIDATION_ERROR",
            "source": { "pointer": "/posts/0/title" },
            "detail": "The title field is required."
        },
        {
            "status": "422",
            "code": "VALIDATION_ERROR",
            "source": { "pointer": "/posts/2/body" },
            "detail": "The body may not be greater than 10000 characters."
        },
        {
            "status": "422",
            "code": "VALIDATION_ERROR",
            "source": { "pointer": "/posts" },
            "detail": "Duplicate titles found in batch."
        }
    ],
    "meta": {
        "total": 5,
        "failed": 2,
        "succeeded": 3,
        "failed_indices": [0, 2]
    }
}
```

### Service-Layer Bulk Validation with Partial Processing
```php
class BulkPostService
{
    public function createMany(array $posts): BulkResult
    {
        $validItems = [];
        $errors = [];

        foreach ($posts as $index => $data) {
            $validator = Validator::make($data, [
                'title' => ['required', 'string', 'max:255'],
                'body' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $errors[$index] = $validator->errors();
            } else {
                $validItems[$index] = $validator->validated();
            }
        }

        // Only process valid items
        $created = [];
        foreach ($validItems as $index => $data) {
            try {
                $created[$index] = Post::create($data);
            } catch (\Throwable $e) {
                $errors[$index] = new MessageBag(['_error' => $e->getMessage()]);
            }
        }

        return new BulkResult($created, $errors);
    }
}
```

### Transformed Error Response for Bulk
```php
protected function failedValidation(Validator $validator): void
{
    $errors = [];

    foreach ($validator->errors()->messages() as $field => $messages) {
        // Parse field like "posts.3.title"
        if (preg_match('/^posts\.(\d+)\.(.+)$/', $field, $matches)) {
            $errors[] = [
                'status' => '422',
                'code' => 'VALIDATION_ERROR',
                'source' => [
                    'pointer' => "/posts/{$matches[1]}/{$matches[2]}",
                ],
                'detail' => $messages[0],
            ];
        } else {
            $errors[] = [
                'status' => '422',
                'code' => 'VALIDATION_ERROR',
                'source' => ['pointer' => "/{$field}"],
                'detail' => $messages[0],
            ];
        }
    }

    throw new HttpResponseException(
        response()->json(['errors' => $errors], 422)
    );
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Wildcard rules for per-item validation | Declarative, concise | Loop with Validator::make() — imperative, verbose |
| after() hook for cross-item uniqueness | Single pass over data | Unique constraint in DB — costly rollback |
| Per-item error reporting | Client fixes specific items | Whole-batch rejection — wasteful |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Wildcard rules | Simple, framework-native | Hard to customize per-item messages |
| after() uniqueness check | Avoids partial DB inserts | Memory: stores all titles for comparison |
| Service-layer per-item loop | Full control, partial processing | More code; manual error collection |
| Bulk with partial success | Client retries only failed items | Complex response structure |

## Performance Considerations
- Set `max` on bulk array size to bound computation (50-500 depending on resource).
- Cross-item uniqueness checks are O(n) — fine for n < 1000.
- Wildcard `exists` rules in arrays execute one query per unique value — batch with `whereIn`.
- Use `min:1` and `max:50` to prevent empty or oversized batch processing.

## Production Considerations
- Always set a hard `max` limit on bulk arrays — prevent resource exhaustion.
- Log bulk validation summaries (total / failed / succeeded) for monitoring.
- Return partial success (200/201) when some items succeed and others fail.
- Consider async processing for bulk operations > 100 items.

## Common Mistakes
- Not setting `max` on the bulk array — open-ended batch size is a DoS vector.
- Using `required_if` with wildcards incorrectly — condition path must match wildcard.
- Forgetting that `distinct` doesn't work across array items in nested objects.
- Returning 400 for partial success — should return 200/201 with meta.failed count.
- Using DB uniqueness constraints as the only cross-item validation — wasteful on failure.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Exceeding `max` items | Validation rejects batch | Inform client of limit in error message |
| Cross-item duplicate undetected | DB unique constraint violation | Check in after() hook before DB insert |
| Partial failure not communicated | Client retries entire batch | Always include meta.failed and failed_indices |
| Memory exhaustion with large batch | PHP memory limit hit | Enforce max items; stream processing for >1000 |

## Ecosystem Usage

### Laravel Batch Validation with Excel Import
```php
use Maatwebsite\Excel\Concerns\WithValidation;

class PostsImport implements WithValidation
{
    public function rules(): array
    {
        return [
            '0' => ['required', 'string', 'max:255'], // title
            '1' => ['required', 'string'],              // body
            '2' => ['sometimes', Rule::in(['draft', 'published'])],
        ];
    }
}
```

### Spatie Laravel Data Array Validation
```php
class BulkCreatePostsData extends Data
{
    /** @var PostData[] */
    public array $posts;

    public static function rules(): array
    {
        return [
            'posts' => ['required', 'array', 'min:1', 'max:50'],
            'posts.*.title' => ['required', 'string', 'max:255'],
            'posts.*.body' => ['required', 'string'],
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — base request structure.
- **validation-rule-array-design** — wildcard and array validation basics.

### Related Topics
- **conditional-validation-patterns** — conditional rules in bulk context.
- **custom-validation-rules** — custom rules for bulk cross-item checks.

### Advanced Follow-up Topics
- **manual-validator-creation** — per-item validation in service layer.
- **pagination-parameter-validation** — validating pagination in collection endpoints.

## Research Notes

### Source Analysis
Laravel's wildcard validation (`*.field`) was designed for nested array data, making it directly applicable to bulk operations. The validator expands `posts.*.title` into concrete rules for each array index. The `after()` callback is the preferred place for cross-item validation because it runs once per batch, not per item.

### Key Insight
Bulk validation strategies exist on a spectrum from "reject all on any failure" to "process valid items, report failures." The right choice depends on the use case: financial transactions need atomic bulk (all or nothing), while data imports benefit from partial processing. The architecture must choose consciously and communicate the behavior in the API contract.

### Version-Specific Notes
- Laravel 10: Wildcard rules work for all built-in rules.
- Laravel 11: No changes.
- PHP 8.2: Array functions (`array_map`, `array_filter`) work cleanly with bulk validation.
