# Form Request Design for APIs

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** form-request, validation, api-design, laravel

## Executive Summary
Phase 2 covers the deep implementation mechanics of Laravel Form Requests in API contexts. Unlike web form validation, API Form Requests must account for stateless authentication, structured error responses, strict typing, and integration with DTOs. This phase wires the `rules()`, `authorize()`, `messages()`, and `attributes()` methods into a cohesive validation pipeline that enforces contract guarantees at the API boundary.

## Mental Models

- **FormRequest as an API Contract Boundary** — The FormRequest is the authoritative entry gate; all input must pass through it before reaching the controller, service layer, or DTO.
- **The Four-Pillar Interface as a Protocol** — `rules()`, `authorize()`, `messages()`, and `attributes()` form a standardized protocol that every endpoint implements.
- **FormRequest as a Self-Validating Document** — The class validates itself at resolution time, making validation an intrinsic property of the request rather than an external controller process.
- **Single Responsibility at the HTTP Layer** — By pushing validation to the request object, controllers become thinner and validation logic becomes independently testable.

## Core Concepts

### FormRequest as the API Contract Boundary
A FormRequest is not merely a validation class — it is the **authoritative entry gate** for every API endpoint. All input must pass through it before reaching the controller, service layer, or DTO. This guarantees that downstream code receives data in a known, validated shape.

### The Four-Pillar Interface
1. **`rules()`** — Schema definition; what fields exist and their constraints.
2. **`authorize()`** — Gatekeeping; whether the actor can perform this action.
3. **`messages()`** — Developer-facing error localization; overrides defaults per rule.
4. **`attributes()`** — Human-friendly field name mapping for error messages.

## Internal Mechanics

### Validation Pipeline Execution Order
```
Request → authorize() → prepareForValidation() → rules() → Validator::make() → passes() → failed() → validationData()
```

- `authorize()` runs **before** any validation. A 403 response is returned immediately if it fails.
- `prepareForValidation()` runs after authorization but before rule resolution — used for sanitization.
- `rules()` is resolved lazily via the service container, allowing dependency injection.

### The `validationData()` Method
Override this to control which data key set is validated. Defaults to `$this->all()` (input + route params + files). For API requests, it is common to restrict to `$this->json()->all()` or a filtered subset.

```php
protected function validationData(): array
{
    return $this->json()->all() + $this->route()->parameters();
}
```

## Patterns

### Rule Grouping by Section
```php
public function rules(): array
{
    return [
        'data.attributes.title' => ['required', 'string', 'max:255'],
        'data.attributes.status' => ['required', Rule::in(['draft', 'published'])],
        'data.relationships.tags' => ['sometimes', 'array'],
        'data.relationships.tags.*' => ['exists:tags,id'],
    ];
}
```

### Injecting Services into Form Requests
```php
public function __construct(
    private readonly SiteRepository $sites,
    private readonly RateLimiter $limiter,
) {
    parent::__construct();
}

public function rules(): array
{
    return $this->sites->validationRules($this->route('site'));
}
```

Form Requests are resolved through the container, so constructor injection works naturally.

### Separate Store vs Update Rules
```php
public function rules(): array
{
    $rules = ['title' => ['required', 'string', 'max:255']];

    if ($this->isMethod('PATCH')) {
        $rules['title'] = ['sometimes', 'string', 'max:255'];
    }

    return $rules;
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| FormRequest over Validator::make() | Declarative, testable, injectable, authorization-aware | Manual validator in controller — duplicates concern |
| Array rule syntax over `|` pipes | Type-safe, IDE-compatible, extensible with Rule objects | Pipe-delimited strings — harder to compose |
| Single FormRequest per action | Explicit contract per endpoint | Reusable base request — adds indirection |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Granularity | One request per action = precise rules | File count grows linearly with endpoints |
| Inheritance | Shared base rules reduce duplication | Fragile base class problem |
| Constructor injection | Services resolved automatically | Cannot use in Lumen or non-container contexts |
| JSON-only validationData() | Prevents route param injection attacks | Loses route parameter validation in same class |

## Performance Considerations
- FormRequests are **singleton-like** in a request lifecycle — resolved once and reused.
- Avoid database queries inside `rules()` for every field; batch queries in constructor.
- Use `Rule::unique()->ignore($this->route('id'))` instead of `exists` + `whereNot` closure.
- `validationData()` filtering reduces validator workload on large payloads.

## Production Considerations
- Override `failedValidation()` to return `JsonResponse` with a consistent error envelope.
- Log validation failures at `warning` level for observability.
- Do **not** throw `ValidationException` directly — always rely on FormRequest's built-in handling.
- Set `$stopOnFirstFailure = true` for write-heavy endpoints to reduce wasted validation.

## Common Mistakes
- Calling `$this->all()` in `rules()` after body has been read by middleware — stream is consumed once.
- Using `auth()->user()` inside `rules()` instead of injecting via `$this->user()` (loses testability).
- Returning `false` from `authorize()` without response message — leaves client guessing.
- Overloading `rules()` with complex nested conditional logic — extract to dedicated methods.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Authorization before auth middleware | `authorize()` sees `null` user | Bind FormRequest after `auth` middleware in controller |
| Validation swallowed in jobs | Silent data corruption | Always validate before dispatching |
| Rule string typos | Unserializable rules in cache | Unit test every FormRequest |
| Missing `validationData()` override | Route params pollute validated | Explicit override |

## Ecosystem Usage

### Laravel Built-in
- `App\Http\Requests\*` — default location for all FormRequests.
- `Illuminate\Foundation\Http\FormRequest` — base class for all requests.

### Spatie Laravel Data
- Use `DataRequest` from Spatie to auto-generate FormRequest from DTO definitions.
- Replaces manual `rules()` when DTO properties mirror validation rules.

### Laravel Nova / Telescope
- Telescope logs FormRequest validation failures in the "Requests" tab.
- Nova uses FormRequests internally but provides a custom validation UI layer.

## Related Knowledge Units

### Prerequisites
- **form-request-organization** — directory placement and naming conventions.
- **authorization-in-form-requests** — deeper `authorize()` mechanics and policy integration.

### Related Topics
- **dto-integration-payload-method** — returning validated data as DTO from FormRequest.
- **validation-error-shape-customization** — customizing the JSON error format.

### Advanced Follow-up Topics
- **manual-validator-creation** — bypassing FormRequest for service-layer validation.
- **bulk-request-validation** — validating arrays of resources beyond single FormRequest.

## Research Notes

### Source Analysis
Laravel's FormRequest is an extension of Symfony's `Request` class, decorated with `ValidatesWhenResolvedTrait`. The trait hooks into the framework's `Resolver` — when the controller method type-hints the FormRequest, it's automatically resolved and validated before the controller executes.

### Key Insight
The FormRequest pattern inverts the traditional "controller validates" flow. By pushing validation to the request object itself, controllers become thinner and validation logic becomes independently testable. This is a direct application of the **Single Responsibility Principle** at the HTTP layer.

### Version-Specific Notes
- Laravel 10+: `FormRequest` supports `prepareForValidation()` with return type `void`.
- Laravel 11: No breaking changes to FormRequest API; validation error format remains the default.
- PHP 8.2+: Constructor property promotion works cleanly in FormRequests.
