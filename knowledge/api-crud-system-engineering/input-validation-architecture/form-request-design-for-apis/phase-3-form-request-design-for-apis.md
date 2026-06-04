# Form Request Design for APIs

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** form-request, validation, api-design, testing, production

## Executive Summary
Phase 3 covers production hardening, integration patterns, testing strategies, and ecosystem composition of Form Requests. This includes error response formatting, testability patterns, integration with Spatie Laravel Data, and observability hooks for validation failures in production.

## Core Concepts

### Validation as an API Contract Enforcement Point
In production, a FormRequest serves double duty:
1. **Guarantee** — ensures downstream code receives valid data.
2. **Documentation** — rules() acts as a machine-readable schema of endpoint requirements.

### Deterministic Error Responses
Every validation failure must return the **exact same JSON envelope** regardless of which rule failed, which endpoint was hit, or which environment is running. Clients depend on stable error shapes.

## Internal Mechanics

### Custom Validation Failure Response
Override `failedValidation()` to control the HTTP response shape:

```php
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

protected function failedValidation(Validator $validator): void
{
    $response = response()->json([
        'errors' => collect($validator->errors()->messages())
            ->map(fn ($messages, $field) => [
                'status' => (string) Response::HTTP_UNPROCESSABLE_ENTITY,
                'code' => 'VALIDATION_ERROR',
                'source' => ['pointer' => "/data/attributes/{$field}"],
                'title' => 'Validation Error',
                'detail' => $messages[0],
            ])
            ->values(),
    ], Response::HTTP_UNPROCESSABLE_ENTITY);

    throw new ValidationException($validator, $response);
}
```

### Stop on First Failure
```php
protected $stopOnFirstFailure = true;
```

Useful for batch endpoints where one field failure should short-circuit immediately to avoid excessive computation.

## Patterns

### Override `failedAuthorization()` for API Responses
```php
protected function failedAuthorization(): void
{
    throw new HttpResponseException(response()->json([
        'errors' => [[
            'status' => '403',
            'code' => 'FORBIDDEN',
            'title' => 'Forbidden',
            'detail' => 'You are not authorized to perform this action.',
        ]],
    ], Response::HTTP_FORBIDDEN));
}
```

### Testing FormRequest Rules Directly
```php
public function test_create_post_validation(): void
{
    $request = new StorePostRequest([], [
        'title' => '',
        'body' => null,
    ]);

    $validator = Validator::make(
        $request->validationData(),
        $request->rules(),
        $request->messages(),
        $request->attributes()
    );

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('title', $validator->errors()->messages());
}
```

### Integration Test with FormRequest + Controller
```php
public function test_store_post_with_invalid_data_returns_422(): void
{
    $response = $this->postJson('/api/posts', [
        'title' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonStructure([
        'errors' => [['status', 'code', 'source', 'title', 'detail']],
    ]);
    $response->assertJsonFragment(['code' => 'VALIDATION_ERROR']);
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Override `failedValidation()` vs custom exception handler | Request-level control is more explicit; handler-level is global — use both layered |
| Validation data filtering in `validationData()` | Prevents injection of unexpected route parameters into validated set |
| Always `$stopOnFirstFailure = false` by default | Gives client full error list on first attempt; saves round trips |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Custom JSON error envelope | Client-friendly, stable contract | Additional code per endpoint; requires consistency enforcement |
| Direct validator test vs HTTP test | Faster, no routing overhead; tests rules in isolation | Does not test authorization or middleware interaction |
| FormRequest inheritance | DRY across similar endpoints | Violation traceability suffers; subclasses override in confusing ways |

## Performance Considerations
- Cache resolved rule objects when using `Rule::unique()` or custom Rule classes — object creation per invocation adds up.
- Avoid `Validator::replacers()` in FormRequest — they run per-field and add overhead.
- For high-throughput endpoints, run `Validator::make()` directly in service layer to bypass FormRequest overhead (but lose authorization).
- Use `sometimes` rules to skip fields not present rather than `nullable|required_if` chains.

## Production Considerations

### Observability
```php
protected function failedValidation(Validator $validator): void
{
    Log::warning('Validation failed', [
        'path' => $this->path(),
        'method' => $this->method(),
        'errors' => $validator->errors()->toArray(),
        'user_id' => $this->user()?->id,
        'ip' => $this->ip(),
    ]);

    parent::failedValidation($validator);
}
```

### Rate Limit Bypass Protection
Ensure `authorize()` does not make expensive calls before validation. A malicious client can send invalid payloads repeatedly, causing `authorize()` to run database queries each time. Move authorization checks that require DB queries after the `authorize()` gate, or use `withValidator()` to run them post-field-validation.

## Common Mistakes
- Forgetting to call `parent::failedValidation()` when overriding — breaks JSON response format.
- Using `$this->all()` in `rules()` when request has already been read — returns empty array.
- Returning translated messages from `messages()` without accept-language header handling — messages must be locale-agnostic in APIs.
- Testing validation via HTTP only — too slow; test rules() directly for coverage.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Validation exception in queue worker | Job fails, released back to queue | Always validate in controller before dispatching |
| Missing required fields in production | Generic 500 instead of 422 | Ensure all endpoints use FormRequest, not `Request` directly |
| Authorization bypass | Unauthorized user passes validation | Never rely on `authorize()` alone — enforce in middleware/policy layer too |
| Rule serialization error in cache | `UnexpectedValueException` on `RouteServiceProvider` | Avoid closures in rules() if caching routes |

## Ecosystem Usage

### Spatie Laravel Data Integration
```php
use Spatie\LaravelData\Data;

class PostData extends Data
{
    public function __construct(
        public string $title,
        public string $body,
        public StatusEnum $status,
    ) {}
}

// FormRequest auto-generates rules from DTO
class StorePostRequest extends \Spatie\LaravelData\DataRequest
{
    protected string $dataClass = PostData::class;
}
```

### Laravel Telescope
- FormRequest validation errors appear in the "Failed Validation" tab.
- Use `Telescope::recordValidation()` in custom failedValidation to capture full error context.

### Laravel API Resource + FormRequest
```php
class PostController extends Controller
{
    public function store(StorePostRequest $request): PostResource
    {
        $post = Post::create($request->validated());
        return PostResource::make($post);
    }
}
```

## Related Knowledge Units

### Prerequisites
- **validation-error-shape-customization** — standardizing error responses.
- **form-request-testing** — testing patterns for FormRequest classes.

### Related Topics
- **dto-integration-payload-method** — returning typed DTOs from FormRequest.
- **authorization-in-form-requests** — deeper policy integration with `authorize()`.

### Advanced Follow-up Topics
- **bulk-request-validation** — handling arrays of resources in validation.
- **manual-validator-creation** — when FormRequests are not enough.

## Research Notes

### Source Analysis
The `ValidatesWhenResolvedTrait` in Laravel's source (`Illuminate\Validation\ValidatesWhenResolvedTrait`) reveals the exact hook point: it implements `ValidatesWhenResolved` interface, which the `Resolver` calls after dependency injection. This is the mechanism that makes FormRequest auto-validation work.

### Key Insight
The FormRequest abstraction succeeds because it collapses three cross-cutting concerns — authorization, validation, and input normalization — into a single injectable object. This drastically reduces controller ceremony and makes validation failures observable at a single, centralized point.

### Version-Specific Notes
- Laravel 10: `FormRequest::validated()` returns only the validated data, not all input — this is the preferred accessor over `$request->all()`.
- Laravel 11: No new FormRequest API changes; stability is expected.
- PHP 8.3: Readonly properties in DTOs work seamlessly with FormRequest validated data.
