# Request Lifecycle Integration — Standardized Knowledge

## Overview
Request lifecycle integration determines where input validation fits in Laravel's middleware pipeline relative to authentication, authorization, and other request processing concerns. Validation can run before auth (fail-fast on invalid input) or after auth (when rules depend on the authenticated user). Understanding the middleware pipeline order and the FormRequest lifecycle is essential for placing validation correctly.

## Key Concepts
- **Middleware Pipeline Order**: Middleware executes in the order registered. `auth` middleware before `throttle` means authenticated users get different limits. FormRequest validation runs in the `SubstituteBindings` middleware group.
- **FormRequest Lifecycle**: `authorize()` → `rules()` → `prepareForValidation()` → `withValidator()` → validation execution → controller method. Each step has a specific position in the request lifecycle.
- **Validation Before Auth**: Rejects invalid input before authentication processing. Reduces auth workload but prevents using user data in rules.
- **Validation After Auth**: Allows rules to use `$this->user()` for user-specific validation (e.g., "user cannot set own role"). Requires route-level middleware ordering.

## Implementation
Middleware ordering in routes:

```php
// Validation after auth (user data available in rules)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/posts', [PostController::class, 'store'])
        ->middleware('throttle:api');
});

// FormRequest with user-dependent validation
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->user);
    }

    public function rules(): array
    {
        return [
            'role_id' => [
                'required',
                'exists:roles,id',
                Rule::notIn([$this->user()->role_id]), // user-specific rule
            ],
        ];
    }
}
```

## Best Practices
- Use FormRequest for endpoint-specific validation; use middleware for cross-cutting concerns
- Validate after auth when rules depend on user data
- Validate before auth for public endpoints to fail-fast on invalid input
- Keep `authorize()` and `rules()` focused — don't mix authorization logic with validation rules
- Use route groups to apply middleware consistently across related endpoints
