# Validation Rule Array Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** array-validation, nested-input, wildcard-rules, laravel

## Executive Summary
Phase 2 covers array validation techniques for nested API payloads, including the `*` wildcard syntax, dot-notation traversal, array element rules, and deeply nested structure validation. Modern APIs frequently accept arrays of resources or nested JSON:API relationships — these patterns require precise array validation strategies.

## Core Concepts

### The `*` Wildcard Syntax
Laravel uses `*` as a wildcard to apply rules to every element of an array:
```php
'tags' => ['required', 'array', 'min:1', 'max:10'],
'tags.*' => ['required', 'string', 'max:50', 'distinct'],
```

Each element in `tags` is validated independently. `distinct` ensures no duplicate values.

### Dot-Notation for Nested Access
```php
'data.attributes.title' => ['required', 'string', 'max:255'],
'data.relationships.tags.data.*.id' => ['required', 'exists:tags,id'],
```

Laravel's validator uses dot notation to traverse nested array structures recursively.

## Internal Mechanics

### Array Rule Resolution
The validator expands `*` rules by iterating over the actual array structure. For `addresses.*.city`, if `addresses` has keys `0`, `1`, the validator creates concrete rules for `addresses.0.city` and `addresses.1.city`.

### Wildcard Depth
Wildcards can be stacked for multi-dimensional arrays:
```php
// Input: items[0][variants][0][sku]
'items.*.variants.*.sku' => ['required', 'string', 'min:3'],
```

Each `*` creates a nested loop over the corresponding array dimension.

## Patterns

### Array of Objects with Type-Specific Rules
```php
'items' => ['required', 'array', 'min:1'],
'items.*.type' => ['required', Rule::in(['product', 'service', 'discount'])],
'items.*.product_id' => ['required_if:items.*.type,product', 'exists:products,id'],
'items.*.service_id' => ['required_if:items.*.type,service', 'exists:services,id'],
'items.*.amount' => ['required', 'numeric', 'min:0'],
'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
```

### Distinct Values Across Array
```php
'emails' => ['required', 'array', 'min:1'],
'emails.*' => ['required', 'email', 'distinct'],
```
`distinct` ensures no two array elements have the same value.

### Conditional Rules Per Element Index
```php
public function rules(): array
{
    $rules = [
        'line_items' => ['required', 'array', 'min:1'],
        'line_items.*.sku' => ['required', 'string'],
        'line_items.*.quantity' => ['required', 'integer', 'min:1'],
    ];

    // First line item can have discount, others cannot
    $rules['line_items.0.discount'] = ['sometimes', 'numeric', 'min:0', 'max:100'];

    return $rules;
}
```

### Size Constraints on Array
```php
'skus' => ['required', 'array', 'min:1', 'max:50'],
'skus.*' => ['required', 'string', 'size:12'], // exactly 12 chars per SKU
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Wildcard `*` syntax over manual iteration | Declarative, readable, framework-native | Loop + Validator::make() per item — complex, error-prone |
| Dot-notation for nested access | Consistent with Laravel's `Arr::get()` and `data_get()` | JSONPath or XPath — not supported by framework |
| `distinct` for uniqueness | Built-in, no closure needed | Closure rule — verbose |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Wildcard rules | Single rule definition for all elements | Error messages use `tags.0` not `tags[0]` — client confusion |
| Deeply nested wildcards | Covers complex JSON:API shapes | Hard to read and debug; error messages are very specific |
| `required_if` with wildcards | Handles conditional array logic | Parent wildcard `*` bleeds into attribute name — must match exactly |

## Performance Considerations
- Wildcard rules are expanded by the validator — deep nesting (3+ levels) increases rule count exponentially.
- Use `max` constraint on array size to prevent denial-of-service via massive arrays.
- `distinct` is O(n²) on unsorted arrays — for large arrays, sort before validation.
- `exists` rules inside arrays execute one query per unique value — batch with `whereIn` if possible.

## Production Considerations
- Limit array depth in API contract to prevent malicious nested payloads.
- Use `max` and `min` on array fields to enforce business constraints.
- Override error messages for wildcard fields to be client-friendly:
  ```php
  'tags.*.distinct' => 'Duplicate tags are not allowed.',
  'items.*.product_id.required_if' => 'Product ID is required when type is product.',
  ```

## Common Mistakes
- Forgetting `'array'` rule on the parent field — `*` requires the parent to be an array.
- Using `items.*.product_id` with `required_if:type,product` — wildcard in the field name doesn't propagate to the condition parameter; use `required_if:items.*.type,product`.
- Not using `min:1` on arrays — empty arrays pass `array` validation.
- Using `distinct` on non-scalar arrays (array of objects) — `distinct` only works on scalar values.
- Overlooking `max` on arrays — open-ended array acceptance is a DoS vector.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Massive nested array | Timeout/exhaustion | Enforce `max` on all array fields; limit depth to 2 levels |
| Wildcard in required_if mismatch | Conditional rule never applies | Use exact parent wildcard path in the condition |
| Empty array passes validation | Business logic fails with empty collection | Always add `min:1` for non-empty requirement |
| Deep wildcards hard to debug | Unexpected rule failures | Unit test each wildcard rule independently |

## Ecosystem Usage

### JSON:API Compliant Validation
```php
'data' => ['required', 'array'],
'data.type' => ['required', Rule::in(['posts'])],
'data.id' => ['prohibited', 'string'], // id is server-assigned
'data.attributes.title' => ['required', 'string', 'max:255'],
'data.relationships.tags.data' => ['sometimes', 'array'],
'data.relationships.tags.data.*.type' => ['required_with:data.relationships.tags.data', Rule::in(['tags'])],
'data.relationships.tags.data.*.id' => ['required_with:data.relationships.tags.data', 'exists:tags,id'],
```

### Spatie Laravel Data Array Validation
```php
class OrderData extends Data
{
    /** @var LineItemData[] */
    public array $items;

    public static function rules(): array
    {
        return [
            'items' => ['array', 'min:1', 'max:50'],
            'items.*.sku' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — base request structure that hosts array rules.

### Related Topics
- **conditional-validation-patterns** — combining wildcards with conditional logic.
- **custom-validation-rules** — custom rules applied to array elements.

### Advanced Follow-up Topics
- **bulk-request-validation** — validating arrays of complete resources.
- **pagination-parameter-validation** — array validation for pagination metadata.

## Research Notes

### Source Analysis
Laravel's validator uses `Illuminate\Validation\Validator::parseRule()` to handle `*` wildcards. The expansion happens in `Validator::getDistinctRules()` and `Validator::addImplicitExtensions()`. Each wildcard is replaced with the concrete array key during validation execution.

### Key Insight
The wildcard `*` syntax transforms what would be imperative loops into declarative rule definitions. This is particularly powerful for JSON:API payloads where nested relationships require consistent validation across all elements.

### Version-Specific Notes
- Laravel 9+: `*` wildcard support for `required_if`, `prohibited_if`, and other conditional rules.
- Laravel 10: `distinct` works with `ignore_case` option.
- PHP 8.1+: Array unpacking in rules works cleanly with wildcard expansion.
