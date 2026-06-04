# Validation Rule Inheritance — Standardized Knowledge

## Overview
Validation rule inheritance manages the relationship between store and update validation rules, and composes rule groups across multiple FormRequests. When store and update have 80%+ identical rules, inheritance through base FormRequests reduces duplication. For shared rule groups across unrelated requests, traits provide composition without inheritance coupling. The decision to inherit vs separate depends on rule similarity and the mutability of fields between creation and update contexts.

## Key Concepts
- **Store/Update Inheritance**: A base FormRequest containing shared rules, with store and update requests extending it and overriding specific rules.
- **Rule Traits**: Reusable rule methods extracted into traits. Used when 3+ FormRequests share a rule group (address validation, contact info).
- **Method Override Pattern**: Store/update FormRequests override `rules()` to call `parent::rules()` and merge with specific rules.
- **`sometimes` Rule**: Marks rules as conditional — only validate fields present in the request. Essential for update validation.

## Implementation
Base FormRequest with store/update inheritance:

```php
class BaseUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}

class StoreUserRequest extends BaseUserRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
    }
}

class UpdateUserRequest extends BaseUserRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($this->route('user'))],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);
    }
}
```

Trait for shared rule groups:
```php
trait HasAddressRules
{
    public function addressRules(): array
    {
        return [
            'address.street' => ['required_with:address', 'string', 'max:255'],
            'address.city' => ['required_with:address', 'string', 'max:100'],
            'address.postal_code' => ['required_with:address', 'string', 'size:10'],
        ];
    }
}
```

## Best Practices
- Use inheritance when store/update rules are 80%+ identical
- Use traits for rule groups shared across 3+ unrelated FormRequests
- Override specific rules in child classes using `array_merge`
- Use `sometimes` for all update rules to support partial updates
- Keep rule inheritance shallow — one level of inheritance is sufficient
