# Validation Rule Array Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** array-validation, production, testing, bulk-endpoints, security

## Executive Summary
Phase 3 covers production testing of array validation rules, security hardening against nested array attacks, performance optimization for bulk validation, integration with CSV/JSON import pipelines, and error reporting strategies for partially-valid arrays.

## Core Concepts

### Partial Validation in Bulk Operations
When validating arrays of resources (e.g., bulk create), some items may pass and others fail. The API must return a structured response indicating which items failed and why, without rejecting the entire batch.

### Defensive Array Depth Limits
Nested wildcard validation is a computational cost multiplier. Production APIs must enforce maximum array depth and element count to prevent resource exhaustion attacks via deeply nested or massive payloads.

## Internal Mechanics

### Custom Array Validation with Per-Item Error Reporting
```php
use Illuminate\Support\MessageBag;

class BulkValidator
{
    public function validate(array $items, array $rules): array
    {
        $validItems = [];
        $errors = [];

        foreach ($items as $index => $item) {
            $validator = Validator::make($item, $rules);

            if ($validator->fails()) {
                $errors[$index] = $validator->errors();
            } else {
                $validItems[$index] = $validator->validated();
            }
        }

        return [
            'valid' => $validItems,
            'errors' => $errors,
        ];
    }
}
```

### Limiting Array Depth Middleware
```php
class LimitArrayDepth
{
    public function handle(Request $request, Closure $next, int $maxDepth = 3): Response
    {
        $data = $request->json()->all();

        if ($this->exceedsDepth($data, $maxDepth)) {
            return response()->json([
                'error' => 'Payload exceeds maximum nesting depth of ' . $maxDepth,
            ], 422);
        }

        return $next($request);
    }

    private function exceedsDepth(array $data, int $maxDepth, int $current = 0): bool
    {
        if ($current > $maxDepth) return true;

        foreach ($data as $value) {
            if (is_array($value) && $this->exceedsDepth($value, $maxDepth, $current + 1)) {
                return true;
            }
        }

        return false;
    }
}
```

## Patterns

### Testing Array Validation Rules
```php
public function test_tags_must_be_unique(): void
{
    $validator = Validator::make(
        ['tags' => ['php', 'laravel', 'php']],
        [
            'tags' => ['required', 'array', 'min:1'],
            'tags.*' => ['required', 'string', 'distinct'],
        ]
    );

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('tags.2', $validator->errors()->messages());
}

public function test_empty_array_rejected(): void
{
    $validator = Validator::make(
        ['items' => []],
        [
            'items' => ['required', 'array', 'min:1'],
            'items.*.sku' => ['required', 'string'],
        ]
    );

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('items', $validator->errors()->messages());
}

public function test_nested_validation_accepts_valid_data(): void
{
    $data = [
        'line_items' => [
            ['sku' => 'SKU-001', 'quantity' => 2],
            ['sku' => 'SKU-002', 'quantity' => 1],
        ],
    ];

    $validator = Validator::make($data, [
        'line_items' => ['required', 'array', 'min:1', 'max:100'],
        'line_items.*.sku' => ['required', 'string', 'max:20'],
        'line_items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
    ]);

    $this->assertTrue($validator->passes());
}
```

### Bulk Import with Selective Failure
```php
class BulkImportRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'imports' => ['required', 'array', 'min:1', 'max:500'],
            'imports.*.email' => ['required', 'email'],
            'imports.*.name' => ['required', 'string', 'max:100'],
            'imports.*.role' => ['required', Rule::in(['admin', 'editor', 'viewer'])],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Check for duplicate emails across the batch
            $emails = collect($this->input('imports'))->pluck('email');
            if ($emails->duplicates()->isNotEmpty()) {
                $validator->errors()->add('imports', 'Duplicate emails found in batch.');
            }
        });
    }
}
```

### Error Response for Partial Failure
```php
// Response when some items fail:
{
  "errors": [
    {
      "status": "422",
      "code": "VALIDATION_ERROR",
      "source": { "pointer": "/imports/0/email" },
      "title": "Validation Error",
      "detail": "The email field is required."
    },
    {
      "status": "422",
      "code": "VALIDATION_ERROR",
      "source": { "pointer": "/imports/2/role" },
      "title": "Validation Error",
      "detail": "The selected role is invalid."
    }
  ],
  "meta": {
    "total": 10,
    "failed": 2,
    "succeeded": 8
  }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Per-item validator loop for bulk | Reports all errors at once; client can fix batch in one round trip |
| Middleware for depth limiting | Rejects early before any validation cost |
| Meta block with success/failure counts | Client knows partial result; can commit valid items |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| All-at-once validation (wildcards) | Single round trip for validation | All items fail if one rule fails (with stopOnFirstFailure) |
| Per-item loop validation | Granular per-item error reporting | More code, more Validator::make() calls |
| Depth-limit middleware | Prevents DoS via deep nesting | Arbitrary limit may reject legitimate deeply nested payloads |

## Performance Considerations
- Wildcard `distinct` has O(n²) complexity — for >1000 items, sort client-side first or use a closure rule with hash map.
- Each `exists` rule in an array executes a separate query — batch them into a single `whereIn` via custom rule.
- For bulk endpoints with >100 items, consider async processing with a job queue.
- `max` on array size is the most important performance gate — it bounds all downstream computation.

## Production Considerations
- Log array validation failures with the count of failed items for monitoring.
- Return partial success (2xx) for bulk operations where some items fail — the client can retry failed items.
- Set PHP `max_input_vars` and `post_max_size` appropriately for bulk endpoints.
- Use `request_size` middleware to reject payloads >10MB before validation.

## Common Mistakes
- Using `*` wildcard without `array` rule on parent — validation silently skips.
- Assuming error keys match input structure — wildcard errors use numeric keys (`tags.0`, `tags.1`).
- Not limiting array size — accepting up to 50 items means 50 DB queries for `exists` rules.
- Returning 400 for all items when only one fails — report partial failure properly.
- Using `distinct` on nested array of objects — it only works at the scalar level.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Memory exhaustion with large arrays | PHP out of memory | Limit array size; stream validation for CSV imports |
| Wildcard rule not applied | Invalid data passes | Unit test with empty array, single item, and multi-item inputs |
| Distinct rule fails on non-scalar | Unexpected pass | Use custom rule with array_unique for object arrays |
| Bulk partial failure not reported | Client cannot identify failed items | Structure errors with item index and field path |

## Ecosystem Usage

### Laravel Excel / Maatwebsite for CSV Import
```php
class UsersImport implements ToModel, WithValidation
{
    public function rules(): array
    {
        return [
            '0' => ['required', 'email', 'unique:users,email'],
            '1' => ['required', 'string', 'max:100'],
            '2' => ['required', Rule::in(['admin', 'editor'])],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            '0.required' => 'Email is required (row :attribute)',
            '0.email' => 'Email is not valid (row :attribute)',
            '0.unique' => 'Email already exists (row :attribute)',
        ];
    }
}
```

### Spatie Laravel Data Array Rules
```php
class BulkCreateUsersData extends Data
{
    /** @var UserData[] */
    public array $users;

    public static function rules(): array
    {
        return [
            'users' => ['required', 'array', 'min:1', 'max:100'],
            'users.*.email' => ['required', 'email', 'unique:users,email'],
            'users.*.name' => ['required', 'string', 'max:100'],
            'users.*.password' => ['required', 'string', 'min:8'],
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **validation-rule-array-design** — Phase 2 array wildcard mechanics.
- **form-request-testing** — testing patterns for array validation.

### Related Topics
- **bulk-request-validation** — comprehensive bulk validation patterns.
- **custom-validation-rules** — custom rules applied in array contexts.

### Advanced Follow-up Topics
- **conditional-validation-patterns** — conditional logic within array elements.
- **validation-error-shape-customization** — error formatting for array fields.

## Research Notes

### Source Analysis
Laravel's `Validator` class uses `parseRule()` to split `tags.*.type` into the wildcard component and the field component. The `*` is replaced with each actual array key during `Validator::validate()` through `replaceWildcards()` method.

### Key Insight
Wildcard array validation is effectively a **compile step** that converts declarative patterns into concrete rules. The validator internally expands `tags.*.name` into `tags.0.name`, `tags.1.name`, etc. This expansion happens before rule execution, which is why massive arrays can cause memory issues.

### Version-Specific Notes
- Laravel 9+: Wildcards work with `prohibited_if` and `exclude_if`.
- Laravel 10: No changes to wildcard behavior.
- PHP 8.2+: Array validation benefits from `true` type for nullable/required logic.
