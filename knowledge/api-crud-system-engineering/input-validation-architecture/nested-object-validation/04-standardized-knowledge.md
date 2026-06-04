# Nested Object Validation — Standardized Knowledge

## Overview
Nested object validation handles validating structured data within request payloads — arrays of items, nested object properties, and mixed structures. Laravel's validation system uses dot notation (`field.nested_field`) for named properties and wildcard notation (`array.*.field`) for uniform lists. Choosing the correct syntax is critical: wildcard notation applies the same rules to every item, while dot notation targets specific properties.

## Key Concepts
- **Dot Notation (`field.nested`)**: Validates specific named properties of an object. Use `address.city` to validate the city field inside an address object.
- **Wildcard Notation (`array.*.field`)**: Validates fields across all items in an array. Each item must have the same structure.
- **Nested Array of Objects**: Combine both: `items.*.name`, `items.*.quantity`. Rule applies uniformly to every item's field.
- **Depth Limiting**: Laravel validates to any depth, but 3+ levels is a design smell. Flatten deeply nested payloads when possible.

## Implementation
Laravel 13 validates nested data natively. No special setup required:

```php
public function rules(): array
{
    return [
        // Named nested object properties
        'address.street' => ['required', 'string', 'max:255'],
        'address.city' => ['required', 'string', 'max:100'],
        'address.postal_code' => ['required', 'string', 'size:10'],

        // Array of objects with uniform structure
        'items' => ['required', 'array', 'min:1'],
        'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
        'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],

        // Array with scalar values
        'tags' => ['nullable', 'array'],
        'tags.*' => ['required', 'string', 'max:50'],
    ];
}
```

## Best Practices
- Limit nesting to 2 levels deep; flatten anything at 3+ levels
- Use `array.*.field` for uniform collections; use `field.nested` for object properties
- Validate array minimum size when the endpoint requires at least one item (`min:1`)
- Return clear error messages with the full dotted path so clients can map errors to UI fields
- Use `present` rule when a field must exist in the request even if null
