# ECC Standardized Knowledge — Form Request Organization

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Form Request Organization |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Form requests encapsulate validation and authorization logic per API endpoint. Version-specific form requests allow different validation rules, required fields, and authorization logic per API version. This KU covers directory structure, rule inheritance, rule addition/removal across versions, and authorization changes. Versioned form requests follow the namespace pattern `App\Http\Requests\V1\StoreUserRequest` and `App\Http\Requests\V2\StoreUserRequest`. Form request versioning is the most security-critical aspect of API versioning — a rule gap between versions is a vulnerability, not just a bug.

## Core Concepts

- **Versioned Namespace**: `App\Http\Requests\V1\`, `App\Http\Requests\V2\`
- **Rule Inheritance**: V2 extends V1's rules, adds or removes keys via `rules()` override
- **Per-Version Authorization**: Different `authorize()` logic per version
- **Rule Composition**: Shared rules via traits or base request classes
- **`prepareForValidation()`**: Version-specific input transformation
- **`failedValidation()`**: Version-specific error response format

## When To Use

- Any API with version-specific validation rules
- APIs where required fields differ between versions
- APIs with version-specific authorization logic
- When validation error format should evolve across versions

## When NOT To Use

- Versions with identical validation rules (single form request shared across versions)
- Simple endpoints where inline validation in controllers is sufficient
- APIs where validation logic is entirely database-driven

## Best Practices

- **Use inheritance for progressive rule enhancement**: V2 extends V1, overrides `rules()`.
- **Override `rules()` to add/remove keys** — never modify the parent's rules directly.
- **Test each version's form request independently** — parent rule changes silently affect children.
- **Use traits for reusable rule groups** (`WithPhoneValidation`, `WithTaxIdValidation`).
- **Mark old fields as `nullable|sometimes` when deprecating them** in new versions.
- **Use `validated()` instead of `$request->all()`** to maintain version safety.
- **Include version number in validation error responses** for easier debugging.

## Architecture Guidelines

- Form request resolution adds ~0.2ms per request — negligible.
- Rule inheritance adds no runtime cost (rules are arrays built at call time).
- Complex `prepareForValidation()` logic can add measurable overhead — keep it light.
- Rule caching (Laravel 11) applies per request class, not per version.
- Authorization drift prevention: ensure V2 doesn't remove checks present in V1 without intentional review.

## Performance Considerations

- Form request resolution adds ~0.2ms per request.
- Rule inheritance adds no runtime cost (rules are arrays built at call time).
- Complex `prepareForValidation()` can add overhead — keep it light.
- Rule validation caching applies per request class, not per version.

## Security Considerations

- Form request versioning is the most security-critical aspect of API versioning — a rule gap between versions is a vulnerability.
- V2 must not remove `authorize()` checks that existed in V1 without intentional review.
- Security-critical validation rules should be tested for every active version.
- OWASP API Security emphasizes the risk of authorization drift between API versions.

## Common Mistakes

- Modifying V1's `rules()` method and forgetting V2 extends it — V2 gets the change too.
- Adding a required field in V2 without considering V1 consumers who don't send it.
- Overriding `authorize()` in V2 but forgetting to call `parent::authorize()`.
- Using the same form request for store and update — they need separate versions too.

## Anti-Patterns

- **Rule leak**: V2 inherits outdated V1 validation rules, allowing invalid data.
- **Authorization gap**: V2 removes an `authorize()` check that existed in V1, creating a security hole.
- **Silent rule removal**: V2 drops a validation rule, allowing bad data into the database.

## Examples

```php
// V1 form request
class V1\StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'status' => 'sometimes|in:draft,published',
        ];
    }
}

// V2 form request — adds category, makes status default to draft
class V2\StorePostRequest extends V1\StorePostRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['category_id'] = 'required|exists:categories,id';
        $rules['status'] = 'sometimes|in:draft,published,archived';
        return $rules;
    }

    public function authorize(): bool
    {
        return $this->user()?->hasRole('editor') ?? false;
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: resource-class-organization, controller-inheritance
- **Advanced**: Custom validation rules per version, Versioned error response formats

## AI Agent Notes

- Form request versioning is the most security-critical aspect of API versioning — a rule gap between versions is a vulnerability.
- The most common form request versioning mistake is rule inheritance coupling — a parent rule change silently affecting all child versions.
- Laravel 11's `FormRequest` is unchanged from Laravel 10. The `after()` method works for post-validation hooks in versioned requests.

## Verification

- [ ] Version-specific form requests in versioned namespaces
- [ ] Rule inheritance pattern used for progressive enhancement
- [ ] Each version's rules tested independently (not relying on parent tests)
- [ ] Authorization logic tested per version
- [ ] Rule diff tracked between versions
- [ ] Deprecated fields marked as `nullable|sometimes` in older versions
- [ ] No authorization gaps between versions
