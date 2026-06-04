# Validation Skip on Edit — Standardized Knowledge

## Overview
Validation skip on edit determines which fields are validated during update operations. Not all fields in the request need re-validation on every update — unchanged fields can skip expensive checks like uniqueness and existence. Laravel's `sometimes` rule validates a field only when it is present in the input array. For PUT (full update) semantics, custom skip logic compares input with database values to avoid re-validating unchanged data.

## Key Concepts
- **`sometimes` Rule**: Validates a field only if it is present in the input array. The standard approach for PATCH (partial update) requests.
- **PUT vs PATCH Semantics**: PUT requires all fields (full replacement); PATCH allows partial updates. Validation strategy differs accordingly.
- **Unique Ignoring Current Model**: `Rule::unique('table')->ignore($modelId)` prevents false unique violations when the field hasn't changed.
- **Custom Skip Logic**: For PUT requests, compare input with DB values and skip validation for unchanged fields. Adds complexity but saves expensive checks.

## Implementation
PATCH (partial update) with `sometimes`:

```php
class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($this->route('user'))],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

PUT (full update) with custom skip logic:
```php
protected function prepareForValidation(): void
{
    $user = $this->route('user');

    // Remove fields that haven't changed
    foreach (['name', 'email'] as $field) {
        if ($this->has($field) && $this->$field === $user->$field) {
            $this->offsetUnset($field);
        }
    }
}
```

## Best Practices
- Use `sometimes` for all PATCH/update validation by default
- Use `Rule::unique()->ignore()` for all unique fields on update
- For PUT endpoints, compare input with DB and skip unchanged fields
- Never skip authorization checks — only skip validation
- Document whether endpoints use PUT or PATCH semantics for client clarity
