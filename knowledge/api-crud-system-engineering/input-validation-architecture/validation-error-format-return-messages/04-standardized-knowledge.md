# Validation Error Format & Return Messages — Standardized Knowledge

## Overview
Validation error format determines how validation failures are communicated back to API clients. Laravel's default format returns errors keyed by field: `{ message: "...", errors: { field: ["message1", "message2"] } }`. Customizing this format is critical for API contracts that require specific error structures (JSON:API, custom schemas) and for client-side error mapping. The choice between returning all errors vs first error only affects UX, security, and round-trip efficiency.

## Key Concepts
- **Structured Field Errors**: Errors grouped by field name. The standard for most APIs. Clients map errors to input fields by key.
- **Flat Error Array**: A simple list of error messages. Simpler but loses field-to-error mapping.
- **Single Error Response**: Returns only the first validation error. Reduces information leakage about validation rules. Clients must fix and retry.
- **Full Error Response**: Returns all validation errors in one response. Better UX for multi-field forms. May reveal validation rule structure.
- **Custom failedValidation()**: Override point in FormRequest to return any error structure required by the API contract.

## Implementation
Custom error format via FormRequest override:

```php
class StoreUserRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        $errors = $validator->errors();

        throw new HttpResponseException(response()->json([
            'status' => 'error',
            'code' => 422,
            'message' => 'Validation failed',
            'errors' => $errors->toArray(),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->id(),
            ],
        ], 422));
    }
}
```

Global format via `App\Exceptions\Handler`:
```php
$this->renderable(function (ValidationException $e, $request) {
    if ($request->expectsJson()) {
        return response()->json([
            'errors' => $e->errors(),
            'status' => 422,
        ], 422);
    }
});
```

## Best Practices
- Default Laravel format is suitable for most APIs; customize only when the API contract requires it
- Return all errors for form-based UIs; return first error for programmatic APIs
- Include a top-level `message` summarizing the failure
- Use consistent format across all endpoints — never mix formats
- Include correlation IDs (request ID) in error responses for debugging
