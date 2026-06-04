# Validation Skip on Null Update — Standardized Knowledge

## Overview
Validation skip on null update handles the ambiguity between null-as-action ("clear this field") and null-as-omission ("don't update this field"). In API design, null and absent have distinct semantics: absent means "don't change the field" (PATCH), null means "set the field to null" (clear). The validation strategy must align with this semantic distinction — using `nullable` when null is a valid update value, and converting null to absent when null means "don't update."

## Key Concepts
- **Null-as-Action**: Null is an intentional value meaning "clear/remove this field's value." The field should be set to null in the database.
- **Null-as-Omission**: Null means "don't update this field" (same as absent). The null should be converted to absent before validation.
- **`nullable` Rule**: Makes null a valid value for a field. When present, other rules only apply to non-null values.
- **`sometimes` Rule**: Validates only when the field is present. Does not validate when absent. Null is still considered "present."
- **`present` Rule**: Requires the field to exist in the request but allows null as a value.

## Implementation

```php
class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // Null clears the value (null-as-action)
            'biography' => ['nullable', 'string', 'max:5000'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],

            // Null is not valid; field must be a string or absent
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($this->route('user'))],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Convert null to absent for fields where null means "don't update"
        foreach (['name', 'email'] as $field) {
            if ($this->has($field) && $this->input($field) === null) {
                $this->offsetUnset($field);
            }
        }
    }
}
```

## Best Practices
- Use `nullable` when null is a valid value that should be stored as null
- Use `sometimes` without `nullable` when null is not valid — null will fail validation
- Convert null to absent in `prepareForValidation()` when null means "don't update"
- Document field semantics (null meaning) in the API specification
- Distinguish between nullable DB columns and nullable API fields — they may differ
