# Manual Validator Creation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** manual-validation, validator-make, service-layer-validation, laravel

## Executive Summary
Phase 2 covers `Validator::make()` for manual validation outside FormRequests — in service layers, commands, queued jobs, and API integrations. Manual validation is necessary when the data source is not an HTTP request or when validation must occur after the controller boundary.

## Mental Models

- **Validator::make() as a Portable Validation Engine** — Unlike FormRequests which are HTTP-bound, `Validator::make()` is a portable engine usable in any context: services, jobs, CLI commands, and external integrations.
- **Manual Validation as Defense in Depth** — Manual validation in service layers provides an additional validation layer beyond the FormRequest, following the defense-in-depth principle.
- **ValidationResult as a Rich Return Type** — Returning a `ValidationResult` object communicates pass/fail/data/errors as a single cohesive unit instead of throwing or returning booleans.
- **Manual Validation as Complement, Not Alternative** — Manual validation does not replace FormRequests; it extends validation to contexts where HTTP request objects are unavailable.

## Core Concepts

### When to Use Manual Validation
- **Service layer validation** — validating data from multiple sources (request + DB + external API).
- **Queued job validation** — validating data before processing in a job.
- **CLI command validation** — validating arguments and options.
- **API client validation** — validating responses from external services.
- **Bulk/batch processing** — validating each item in a collection independently.

### Validator::make() API
```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make(
    $data,           // array of data to validate
    $rules,          // array of validation rules
    $messages,       // optional custom messages
    $attributes      // optional custom attribute names
);

if ($validator->fails()) {
    $errors = $validator->errors();
    // Handle failure
}
```

## Internal Mechanics

### Validator Instance Lifecycle
```
Validator::make($data, $rules)
    → parseRules() → expandWildcards()
    → passes() → iterate rules → collect errors
    → validated() → return only validated data
```

The validator instance is single-use — after `passes()` or `fails()` is called, the results are cached.

### ValidationResult Return Pattern
```php
class ValidationResult
{
    public function __construct(
        public readonly bool $passes,
        public readonly array $data,
        public readonly MessageBag $errors,
    ) {}

    public static function fromValidator(Validator $validator): self
    {
        return new self(
            passes: !$validator->fails(),
            data: $validator->validated(),
            errors: $validator->errors(),
        );
    }
}
```

## Patterns

### Service-Layer Validation
```php
class PostService
{
    public function __construct(
        private readonly PostRepository $posts,
    ) {}

    public function create(array $data, User $author): Post
    {
        $validator = Validator::make($data, [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->posts->create(
            $validator->validated(),
            $author,
        );
    }
}
```

### Batch Validation in Job
```php
class ProcessBatchImportJob implements ShouldQueue
{
    public function handle(): void
    {
        $results = ['valid' => [], 'failed' => []];

        foreach ($this->items as $index => $item) {
            $validator = Validator::make($item, [
                'email' => ['required', 'email'],
                'name' => ['required', 'string', 'max:100'],
            ]);

            if ($validator->fails()) {
                $results['failed'][$index] = $validator->errors();
            } else {
                $results['valid'][$index] = $validator->validated();
            }
        }

        // Process valid items, report failed items
    }
}
```

### Reusable Validation Service
```php
class ValidationService
{
    public function validate(array $data, array $rules): array
    {
        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException(
                $validator,
                response()->json(['errors' => $validator->errors()], 422),
            );
        }

        return $validator->validated();
    }
}

// Usage in any context:
$this->validation->validate($data, [
    'email' => ['required', 'email'],
    'amount' => ['required', 'numeric', 'min:0'],
]);
```

### Validator with Custom Error Messages
```php
$validator = Validator::make($data, $rules, [
    'email.required' => 'An email address is required.',
    'email.email' => 'The email format is invalid.',
    'title.required' => 'Please provide a title.',
    'title.max' => 'Title cannot exceed :max characters.',
]);
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Validator::make() in service | Decouples validation from HTTP layer | FormRequest — requires HTTP request |
| ValidationException throw | Consistent error handling with FormRequest | Return error array — manual handling |
| ValidationResult object | Rich return with passes/data/errors | Boolean + array — multiple return paths |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Service-layer validation | Works in any context (job, CLI, API) | Duplicates rules defined in FormRequest |
| Reusable validation service | Centralized, consistent validation | Single point of change; must handle all contexts |
| ValidationException | Framework-integrated error handling | Controller must catch or let it bubble |

## Performance Considerations
- `Validator::make()` is cheap — use freely.
- Avoid recreating the same validator instance — cache rule sets for repeated validation.
- In loops (batch), create a fresh `Validator` per item — they are not reusable.
- Use `Validator::make()` with `$stopOnFirstFailure = true` for performance-critical single-item validation.

## Production Considerations
- Log validation failures with the calling context (class, method, data shape).
- Wrap manual validation in try/catch when used in jobs — prevents job from failing.
- Do **not** throw `ValidationException` in queued jobs without proper exception handling.
- Use `Validator::make()` for data from trusted sources too — defense in depth.

## Common Mistakes
- Throwing `ValidationException` in a queue job — it expects 422 response context.
- Reusing validator instances — results are cached after first call.
- Mixing FormRequest and manual validation for the same endpoint — dual validation.
- Using `$validator->validated()` before checking `passes()` — throws on failure.
- Forgetting to pass `$messages` and `$attributes` — inconsistent with FormRequest errors.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| ValidationException in job | Job released repeatedly | Catch exception, log, mark as failed |
| Validator reused | Returns cached stale result | Create new Validator per validation |
| Missing custom messages | Generic error format in API | Create message arrays for manual validation |
| Throwing without response | HTML error instead of JSON | Always pass response to ValidationException |

## Ecosystem Usage

### Manual Validation in Laravel Commands
```php
class ImportUsersCommand extends Command
{
    public function handle(): int
    {
        $validator = Validator::make($this->arguments(), [
            'file' => ['required', 'string', 'ends-with:.csv'],
            'dry-run' => ['boolean'],
        ]);

        if ($validator->fails()) {
            $this->error($validator->errors()->first());
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
```

### Manual Validation in Livewire Components
```php
class CreatePostForm extends Component
{
    public string $title = '';
    public string $body = '';

    public function save(): void
    {
        $validated = Validator::make(
            ['title' => $this->title, 'body' => $this->body],
            ['title' => ['required', 'max:255'], 'body' => ['required']],
        )->validate();

        Post::create($validated);
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — rules() design applied in manual context.

### Related Topics
- **validation-error-shape-customization** — customizing errors from manual validation.
- **custom-validation-rules** — using custom rules in Manual Validator.

### Advanced Follow-up Topics
- **bulk-request-validation** — manual validation for batch processing.
- **after-validation-hooks** — after() hooks with Manual Validator.

## Research Notes

### Source Analysis
`Validator::make()` is a facade for `Illuminate\Validation\Factory::make()`. The factory creates a new `Validator` instance, parses rules, and returns it ready for use. The validator is stateless between calls — each `make()` creates a fresh instance.

### Key Insight
Manual validation is not an alternative to FormRequests — it is a **complement**. FormRequests handle the HTTP boundary; `Validator::make()` handles every other validation need. The same rule arrays, custom rules, and messages work in both contexts, ensuring consistency across the entire application.

### Version-Specific Notes
- Laravel 10: `Validator::make()->validate()` returns validated data or throws.
- Laravel 11: No changes to validation factory.
- PHP 8.2: Named arguments improve Validator::make() readability with explicit parameters.
