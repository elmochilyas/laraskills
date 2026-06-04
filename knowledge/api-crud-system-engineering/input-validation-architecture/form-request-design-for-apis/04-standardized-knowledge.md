# Form Request Design for APIs

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-form-request-design-for-apis |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Foundation |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Laravel Form Requests serve as the authoritative entry gate for API endpoints. They implement a four-pillar interface — `rules()`, `authorize()`, `messages()`, and `attributes()` — forming a standardized protocol that every endpoint implements. All input must pass through the FormRequest before reaching the controller, ensuring downstream code receives data in a known, validated shape.

## Core Concepts

- **FormRequest as API Contract Boundary**: The authoritative entry gate — all input must pass through before reaching controller/service/DTO.
- **Four-Pillar Interface**: `rules()` (schema), `authorize()` (gatekeeping), `messages()` (error localization), `attributes()` (field name mapping).
- **Validation Pipeline Order**: `authorize()` → `prepareForValidation()` → `rules()` → `Validator::make()` → `passes()` → `failed()` → `validationData()`.
- **Array rule syntax over pipe strings**: Type-safe, IDE-compatible, extensible with Rule objects.
- **Single FormRequest per action**: Explicit contract per endpoint rather than reusable base requests.

## When To Use

- For every API endpoint that accepts input data
- When validation rules need to be independently testable
- When authorization is tightly coupled to input validation
- For JSON:API or structured payload endpoints
- When consistent error response shapes are required

## When NOT To Use

- For trivial endpoints with no input validation
- For service-layer validation where no HTTP request exists (jobs, CLI commands)
- For endpoints validated entirely by route model binding
- When using Spatie Laravel Data's `DataRequest` which auto-generates FormRequests

## Best Practices (WHY)

- **Use array rule syntax**: Type-safe, IDE-compatible, supports Rule objects and closures.
- **One FormRequest per action**: Explicit contract per endpoint; avoids fragile conditionals.
- **Override `failedValidation()` in a base `ApiRequest`**: Single point of error formatting for consistent error shapes.
- **Inject services via constructor**: FormRequests are resolved through the container.
- **Use `validationData()` to control input scope**: Prevent route param injection and restrict to JSON body.
- **Use `$stopOnFirstFailure` for write-heavy endpoints**: Reduces wasted validation.
- **Separate Store vs Update rules**: Use `isMethod()` check or separate FormRequests.
- **Never call `$this->all()` after body has been read**: Stream is consumed once.

## Architecture Guidelines

- All API FormRequests extend a base `App\Http\Requests\Api\ApiRequest` class.
- The base class overrides `failedValidation()` to return consistent JSON error envelopes.
- Use array syntax exclusively for rules — never pipe-delimited strings.
- Keep `rules()` methods readable by extracting complex logic to dedicated helper methods.
- Use constructor injection for repositories/services needed in rule generation.
- Place FormRequests in `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`.

## Performance Considerations

- FormRequests are resolved once per request and reused — singleton-like in request lifecycle.
- Avoid database queries inside `rules()` for every field; batch queries in constructor.
- Use `Rule::unique()->ignore($id)` instead of `exists` + `whereNot` closure.
- `validationData()` filtering reduces validator workload on large payloads.
- Setting `$stopOnFirstFailure` reduces processing for batch validation.

## Security Considerations

- `authorize()` runs before `rules()` — prevents unauthorized actors from triggering validation.
- Never include sensitive data in validation error messages.
- Sanitize input in `prepareForValidation()` before rules evaluate.
- Use `validationData()` to exclude route parameters from validation scope.
- Log validation failures at warning level for observability.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using pipe-delimited rules | `'title' => 'required\|string'` | Copying from old tutorials | Can't use Rule objects; harder to extend | Use array syntax |
| Calling `$this->all()` in rules() | Stream already consumed by middleware | Not accounting for JSON parsing | Empty data; validation passes incorrectly | Use `$this->json()->all()` or `validationData()` |
| Using `auth()->user()` instead of `$this->user()` | Loses testability | Convenience | Can't mock user in tests | Always use `$this->user()` |
| Complex conditional logic in rules() | Hard to read/debug rules | No extraction | Rules method is unmaintainable | Extract to dedicated helper methods |
| Not overriding failedValidation() | Default Laravel web-oriented error shape | Not customizing | Inconsistent with API error contract | Override in base ApiRequest |

## Anti-Patterns

- **Single FormRequest for Store and Update**: Using `isMethod()` for conditional rules — better to split.
- **Rules method with DB queries for every field**: N+1 validation queries.
- **FormRequest with no authorize() method**: Defaults to `false` — all requests denied.
- **Throwing generic Exception in failedValidation()**: Must throw `HttpResponseException`.
- **FormRequest as a dumping ground**: Too many responsibilities beyond the four-pillar interface.

## Examples

```php
class StorePostRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'tags' => ['sometimes', 'array', 'min:1', 'max:10'],
            'tags.*' => ['exists:tags,id'],
        ];
    }

    public function authorize(): bool
    {
        return $this->user()->can('create', Post::class);
    }
}
```

## Related Topics

- Form Request Organization (directory placement and naming)
- Authorization in Form Requests (authorize() mechanics)
- Validation Rule Array Design (array and wildcard rules)
- Custom Validation Rules (rule objects and closures)
- Validation Error Shape Customization (customizing error responses)

## AI Agent Notes

- Always use array syntax for validation rules, never pipe-delimited strings.
- Always include an `authorize()` method — it defaults to false.
- Override `failedValidation()` in a base class for consistent error shapes.
- Use `prepareForValidation()` for input sanitization before rules evaluate.
- When generating create/update endpoints, consider separate FormRequests for each action.

## Verification

- [ ] All FormRequests extend a base `ApiRequest` class with overridden `failedValidation()`
- [ ] Array syntax used for all validation rules
- [ ] `authorize()` method is explicitly defined in every FormRequest
- [ ] `validationData()` is overridden to restrict input scope
- [ ] No pipe-delimited string rules exist
- [ ] `$stopOnFirstFailure` is configured appropriately
- [ ] FormRequest unit tests exist for critical validation scenarios
