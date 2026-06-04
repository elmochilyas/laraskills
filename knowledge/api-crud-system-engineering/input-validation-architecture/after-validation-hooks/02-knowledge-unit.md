# After Validation Hooks

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** hooks, after-validation, passedValidation, post-processing, laravel

## Executive Summary
Phase 2 covers the `afterValidation()` and `passedValidation()` hooks in Form Requests, the `Validator::after()` callback, and post-validation processing patterns. These hooks allow side effects, data transformation, and cross-field validation logic that runs after all rules pass.

## Mental Models

- **Hooks as Validation Event Handlers** — Post-validation hooks (`passedValidation()`, `after()`) are event handlers triggered after validation completes, not general mutation tools.
- **Validation as a Gate** — Validation is a gate; hooks run only after the gate opens, operating on data that has already passed all rule checks.
- **after() as a Circuit Breaker** — The `after()` callback is a circuit breaker that can reject data even after all rules pass (e.g., fraud or external-service checks).
- **passedValidation() as a Decorator** — Decorates validated data with derived or computed fields before it reaches the controller.

## Core Concepts

### passedValidation() Hook
Called **after** all validation rules pass but **before** `validated()` returns:
```php
protected function passedValidation(): void
{
    $this->merge([
        'total' => $this->input('quantity') * $this->input('price'),
    ]);
}
```

Used for derived data computation that should be part of the validated data set.

### afterValidation() Hook
Alias for `passedValidation()` in some Laravel versions. Called at the same lifecycle point. Use `passedValidation()` for consistency.

### Validator::after() Callback
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        // This runs after all rules pass
        if (!$this->subscription->isActive()) {
            $validator->errors()->add('subscription', 'Your subscription is inactive.');
        }
    });
}
```

Use `after()` for cross-field or external-service validation that cannot be expressed as a rule.

## Internal Mechanics

### Lifecycle Order
```
authorize() → prepareForValidation() → rules() → Validator::make()
    → passes() → passes() (each rule)
    → after() callbacks run
    → if no errors: passedValidation() / afterValidation()
    → validated() returns data
```

If any rule fails, `after()` callbacks still run (Laravel 10+). To skip `after()` on failure, check `$validator->errors()->isEmpty()` at the start of `after()`.

### StopOnFirstFailure Interaction
When `$stopOnFirstFailure = true`, `after()` callbacks still run for the failing attribute but other attributes are not validated. Use with caution — `after()` may receive partial data.

## Patterns

### Auditable Data Injection
```php
protected function passedValidation(): void
{
    $this->merge([
        'created_by' => $this->user()->id,
        'created_ip' => $this->ip(),
    ]);
}
```

### Event Dispatching After Validation
```php
protected function passedValidation(): void
{
    $this->merge(['uuid' => (string) Str::uuid()]);

    event(new OrderValidated($this->validated()));
}
```

### External Service Validation in after()
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $response = Http::timeout(3)->post('https://fraud.example.com/check', [
            'email' => $this->input('email'),
            'amount' => $this->input('amount'),
        ]);

        if ($response->json('risk_score') > 80) {
            $validator->errors()->add('email', 'Transaction flagged as high risk.');
        }
    });
}
```

### Normalization in passedValidation()
```php
protected function passedValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'price' => (int) round($this->input('price') * 100), // cents
    ]);
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| passedValidation() over controller | Keeps data normalization in request layer | Controller does it — duplicates concern |
| after() over custom rule for external calls | after() runs once; rule runs per-field | Custom rule — runs per-field, multiple API calls |
| Merge in hook vs mutate validated() return | Merge makes data available to controller and validated() | Mutate validated() — data inconsistency |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| passedValidation() | Centralized post-validation logic | Hidden from controller; subtle side effects |
| after() callback | Runs after all rules pass; full Validator access | Must check errors() to skip on failure |
| Merge in hook | Data flows naturally to controller | Modifies input; may conflict with validation rules |

## Performance Considerations
- `after()` callbacks run synchronously during validation — slow callbacks delay the response.
- External API calls in `after()` should have short timeouts (2-3s).
- `passedValidation()` is fast — use for in-memory transformations only.
- Avoid database writes in `passedValidation()` — side effects should not happen during validation.

## Production Considerations
- `after()` callbacks should have explicit timeouts for external services.
- Log `passedValidation()` side effects for debugging.
- Never dispatch jobs from `passedValidation()` — validation is not transactional.
- Use `after()` for SLA-bound external checks (fraud, blacklist) that must block the request.

## Common Mistakes
- Performing database writes in `passedValidation()` — validation should be side-effect free.
- Assuming `after()` callbacks are ordered — they run in registration order but should be independent.
- Using `after()` for field-level validation — belongs in rules().
- Mutating input that was already validated — `merge()` after validation works but may confuse.
- Forgetting that `after()` runs even on failed validation — check `$validator->errors()->isEmpty()`.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| after() exception | 500 error on valid data | Wrap after() body in try/catch |
| passedValidation() mutation changes validation result | Inconsistent validated data | Only merge new keys; don't modify validated keys |
| External API timeout in after() | Slow response | Set short timeouts; use async validation if possible |
| Side effects in passedValidation() | Data created even when controller fails | Move side effects to controller/service |

## Ecosystem Usage

### Laravel Pipeline with After Hook
```php
class ValidateOrderPipeline
{
    public function handle(StoreOrderRequest $request, Closure $next): mixed
    {
        $request->passedValidation();
        return $next($request);
    }
}
```

### Spatie Laravel Data After Creation Hook
```php
class OrderData extends Data
{
    public function __construct(
        public string $email,
        public int $amount,
        public ?string $uuid = null,
    ) {}

    public function after(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class that provides hooks.
- **conditional-validation-patterns** — how conditionals interact with after hooks.

### Related Topics
- **input-preparation** — pre-validation hooks that complement post-validation hooks.
- **dto-integration-payload-method** — hooks that prepare data for DTO creation.

### Advanced Follow-up Topics
- **manual-validator-creation** — after hooks in non-FormRequest validation.
- **dto-integration-todto-method** — toDto() conversion triggered after validation.

## Research Notes

### Source Analysis
In `Illuminate\Foundation\Http\FormRequest`, `passedValidation()` is called by the `ValidatesWhenResolvedTrait` after the validator passes. The trait's `validateResolved()` method checks `$validator->passes()` and calls `passedValidation()` if true. `after()` callbacks are registered via `Validator::after()` and run in `Validator::passes()`.

### Key Insight
Post-validation hooks are the bridge between "data is valid" and "data is ready for use." They are the last opportunity to mutate input before it reaches the controller. This makes them the ideal place for normalization, injection of server-generated values, and cross-field business rule checks.

### Version-Specific Notes
- Laravel 10: `passedValidation()` is the standard hook; `afterValidation()` is an alias.
- Laravel 11: `after()` callbacks no longer receive the validator by reference — closure binding is used.
- PHP 8.2: Readonly properties in DTOs can be populated in `passedValidation()` before controller.
