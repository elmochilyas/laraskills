# Manual Validator Creation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** manual-validation, testing, production, batch-processing, jobs

## Executive Summary
Phase 3 covers testing manual validation in services and jobs, production error handling for non-HTTP contexts, batch validation performance optimization, integration with external data sources, and patterns for maintaining consistent validation across all application layers.

## Core Concepts

### Consistent Validation Across Contexts
Validation rules should be defined once and reused across FormRequests and manual `Validator::make()` calls. Define rule arrays as constants or static methods on a shared validation class to eliminate duplication.

### Error Handling by Context
Manual validation in a service should not assume HTTP context. In jobs, `ValidationException` is inappropriate — use custom exceptions or error result objects instead.

## Internal Mechanics

### Context-Aware ValidationException Handling
```php
class ServiceValidationException extends \RuntimeException
{
    public function __construct(
        public readonly MessageBag $errors,
        public readonly array $data,
    ) {
        parent::__construct('Validation failed in service layer.');
    }
}

// Service method
public function create(array $input): Post
{
    $validator = Validator::make($input, static::$rules);

    if ($validator->fails()) {
        throw new ServiceValidationException(
            $validator->errors(),
            $input,
        );
    }

    return $this->posts->create($validator->validated());
}
```

### Reusable Rule Registry
```php
class PostValidationRules
{
    public static function base(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:100000'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ];
    }

    public static function forUpdate(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'body' => ['sometimes', 'string', 'max:100000'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}

// Used in FormRequest:
public function rules(): array { return PostValidationRules::base(); }

// Used in service:
$validator = Validator::make($data, PostValidationRules::base());
```

## Patterns

### Testing Manual Validation in Services
```php
public function test_service_validation_passes_with_valid_data(): void
{
    $service = new PostService(new PostRepository());

    $data = [
        'title' => 'Valid Title',
        'body' => 'Valid body content',
        'status' => 'draft',
    ];

    $validator = Validator::make($data, PostValidationRules::base());

    $this->assertTrue($validator->passes());
}

public function test_service_validation_fails_with_missing_title(): void
{
    $data = ['body' => 'Content', 'status' => 'draft'];

    $validator = Validator::make($data, PostValidationRules::base());

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('title', $validator->errors()->messages());
}

public function test_service_throws_validation_exception(): void
{
    $this->expectException(ServiceValidationException::class);

    $service = new PostService(new PostRepository());
    $service->create(['body' => 'Content without title']);
}

public function test_batch_validation_returns_partial_results(): void
{
    $items = [
        ['email' => 'valid@example.com', 'name' => 'Alice'],
        ['email' => 'invalid', 'name' => 'Bob'],
        ['email' => '', 'name' => 'Charlie'],
    ];

    $results = [];
    foreach ($items as $index => $item) {
        $validator = Validator::make($item, [
            'email' => ['required', 'email'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        $results[$index] = [
            'passes' => $validator->passes(),
            'data' => $validator->validated(),
            'errors' => $validator->errors()->toArray(),
        ];
    }

    $this->assertTrue($results[0]['passes']);
    $this->assertFalse($results[1]['passes']);
    $this->assertFalse($results[2]['passes']);
    $this->assertEquals('valid@example.com', $results[0]['data']['email']);
}
```

### Testing Validator in Queued Jobs
```php
public function test_job_validates_and_processes_valid_item(): void
{
    $item = ['email' => 'user@example.com', 'name' => 'John'];
    $job = new ProcessImportItemJob($item);

    $validator = Validator::make($item, [
        'email' => ['required', 'email'],
        'name' => ['required', 'string'],
    ]);

    $this->assertTrue($validator->passes());
}

public function test_job_rejects_invalid_item(): void
{
    $item = ['email' => 'not-an-email', 'name' => ''];
    $job = new ProcessImportItemJob($item);

    $validator = Validator::make($item, [
        'email' => ['required', 'email'],
        'name' => ['required', 'string'],
    ]);

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('email', $validator->errors()->messages());
    $this->assertArrayHasKey('name', $validator->errors()->messages());
}

public function test_job_does_not_throw_validation_exception(): void
{
    // ValidationException should NOT be thrown in job context
    $this->expectException(ServiceValidationException::class);

    $service = new ImportService();
    $service->processItem(['email' => 'invalid']);
}
```

### External API Response Validation
```php
class ExternalApiService
{
    public function fetchProducts(): array
    {
        $response = Http::get('https://api.example.com/products')->json();

        // Validate external API response before use
        $validator = Validator::make($response, [
            'data' => ['required', 'array'],
            'data.*.id' => ['required', 'integer'],
            'data.*.sku' => ['required', 'string'],
            'data.*.price' => ['required', 'numeric', 'min:0'],
            'meta.total' => ['required', 'integer'],
        ]);

        if ($validator->fails()) {
            Log::error('External API returned unexpected structure', [
                'errors' => $validator->errors()->toArray(),
                'response' => $response,
            ]);

            throw new ExternalApiException('Unexpected API response structure.');
        }

        return $validator->validated();
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Shared rule arrays (PostValidationRules) | Single source of truth; eliminates duplication |
| ServiceValidationException | Context-appropriate; not tied to HTTP |
| Validator::make() in job loops | Per-item isolation; one failure doesn't affect others |
| External API response validation | Defense in depth for third-party data |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Shared rule classes | DRY, consistent across contexts | Must be maintained as rules evolve |
| Context-specific exceptions | Proper error handling by context | Multiple exception types to manage |
| Per-item validation in loop | Granular error reporting | O(n) validator creation overhead |
| External API validation | Catches integration issues early | More code for external integrations |

## Performance Considerations
- Batch validation with 1000+ items benefits from pre-compiling rule sets.
- Use `Validator::make()` with `$stopOnFirstFailure = true` for single-item validation.
- External API response validation adds latency — consider validating sample data instead of entire response.
- Cache shared rule arrays in static properties to avoid reallocation.

## Production Considerations
- Monitor manual validation failure rates per service/job.
- Log the full data snapshot on validation failure in services for debugging.
- Do not expose internal validation errors to external API callers.
- Use structured logging for validation failures (context, service, data keys) for alerting.

## Common Mistakes
- Throwing `ValidationException` in queue jobs — job will fail and retry indefinitely.
- Using `Validator::make()` without checking `fails()` first — `validated()` throws on failure.
- Sharing validator instances across loop iterations — each iteration needs a fresh instance.
- Forgetting to include custom messages in service validation — error format differs from FormRequest.
- Not logging validation failures in non-HTTP contexts — silent data loss.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| ValidationException in queue job | Job stuck in retry loop | Catch and convert to ServiceValidationException or log + fail |
| Silent validation failure | Invalid data processed | Always check passes() before using validated() |
| Shared rule array mutated | Rules changed unexpectedly | Use readonly arrays or static methods returning new arrays |
| External API response changes | Validation fails for all requests | Implement circuit breaker; grace period for response migration |

## Ecosystem Usage

### Laravel Validator in Pipeline Pattern
```php
class ValidationPipe
{
    public function handle(mixed $data, Closure $next): mixed
    {
        $validator = Validator::make(
            is_array($data) ? $data : $data->toArray(),
            $this->rules()
        );

        if ($validator->fails()) {
            throw new ServiceValidationException($validator->errors(), $data);
        }

        return $next($validator->validated());
    }
}
```

### Spatie Laravel Data Manual Validation
```php
$data = PostData::from([
    'title' => 'Test',
    'body' => 'Content',
]);

// Validate using DTO's rules
$result = $data->validate();
if ($result->fails()) {
    // Handle DTO-level validation failure
}
```

## Related Knowledge Units

### Prerequisites
- **manual-validator-creation** — Phase 2 manual validation basics.
- **form-request-design-for-apis** — rules defined the same way in both contexts.

### Related Topics
- **validation-error-shape-customization** — custom error formats for manual validation.
- **bulk-request-validation** — batch validation using Validator::make().

### Advanced Follow-up Topics
- **custom-validation-rules** — using custom rules in manual validation.
- **after-validation-hooks** — after() with Manual Validator.

## Research Notes

### Source Analysis
`Validator::make()` creates a new `Illuminate\Validation\Validator` through the `Factory`. The factory is a singleton in the container, but each `make()` call produces an independent instance. The validator uses `ValidationRuleParser` to parse string and array rules, and `MessageBag` to collect errors.

### Key Insight
Manual validation with `Validator::make()` is the **universal validation primitive** in Laravel. FormRequests, Livewire, and other validation mechanisms all ultimately use `Validator::make()`. Understanding manual validation means understanding the core — everything else is a wrapper.

### Version-Specific Notes
- Laravel 10: `Validator::make()->validate()` returns validated data or throws `ValidationException`.
- Laravel 11: No changes to Validator::make() API.
- PHP 8.3: `json_validate()` available for JSON input validation before Validator::make().
