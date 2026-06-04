# Form Request Customization Points — Standardized Knowledge

## Overview
Form Requests in Laravel 13 provide override points — `prepareForValidation()`, `withValidator()`, `failedValidation()`, `failedAuthorization()` — that allow developers to hook into the validation lifecycle. Each method serves a distinct purpose: input transformation, validator modification, error response customization, and authorization failure handling. Understanding which override to use and when prevents mixing responsibilities and keeps validation logic clean.

## Key Concepts
- **prepareForValidation()**: Runs before validation rules. Used to merge, normalize, or transform input data. The only method where `$this->merge()` has effect on validation.
- **withValidator()**: Runs after rules are set but before validation executes. Used to add `after()` callbacks, conditional rules, or modify the validator instance.
- **failedValidation()**: Called when validation fails. Used to customize error response format, add logging, or throw custom exceptions.
- **failedAuthorization()**: Called when `authorize()` returns false. Used to customize 403 responses or return 404 for security through obscurity.

## Implementation
In Laravel 13, FormRequest extends `Illuminate\Foundation\Http\FormRequest`. Each override point is a protected method that can be overridden in the concrete request class:

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => Str::lower($this->email),
    ]);
}

protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->team_id === $this->user()->team_id) {
            $validator->errors()->add('team_id', 'Cannot assign to your own team.');
        }
    });
}

protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([
        'errors' => $validator->errors(),
        'status' => 422,
    ], 422));
}
```

## Best Practices
- Use `prepareForValidation()` for all input transformations — never modify `$this->request` directly
- Use `withValidator()` for post-rule validation logic like cross-field checks
- Only override `failedValidation()` when the API contract demands a non-default error shape
- Never call validation logic from `authorize()` — authorization and validation are separate concerns
- Keep each override focused on its intended purpose; don't mix input prep with error formatting
