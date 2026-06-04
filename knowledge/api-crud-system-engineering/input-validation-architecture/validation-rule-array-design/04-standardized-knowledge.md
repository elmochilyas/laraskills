# Validation Rule Array Design

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-validation-rule-array-design |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Array validation techniques for nested API payloads using the `*` wildcard syntax, dot-notation traversal, and array element rules. Modern APIs frequently accept arrays of resources or nested JSON:API relationships — these patterns require precise array validation strategies that are declarative and framework-native.

## Core Concepts

- **`*` Wildcard Syntax**: Applies rules uniformly across all array elements without explicit iteration.
- **Dot-Notation Navigation**: Laravel's validator uses dot notation to traverse nested array structures recursively.
- **Wildcard Depth**: Multiple `*` can be stacked for multi-dimensional arrays (`items.*.variants.*.sku`).
- **`distinct` Rule**: Ensures no duplicate values across array elements (scalar values only).
- **Array Constraints**: `min` and `max` bound array size to prevent resource exhaustion.
- **Conditional Rules in Arrays**: `required_if` with wildcards for per-element conditional validation.

## When To Use

- For any API accepting arrays of resources (bulk create, batch update)
- For JSON:API compliant payloads with relationships arrays
- For nested input structures (order items, multiple addresses)
- For any endpoint where input contains collections of similar objects

## When NOT To Use

- For single-resource endpoints (use flat rules instead)
- For deeply nested structures beyond 3 wildcard levels
- When per-element validation requires different rules per index (use manual loop)
- For non-array inputs (use standard flat rules)

## Best Practices (WHY)

- **Always add `array` rule on the parent**: `*` requires the parent to be identified as `array`.
- **Always add `min:1` for non-empty requirement**: Empty arrays pass `array` validation.
- **Always add `max` to bound array size**: Open-ended arrays are a DoS vector.
- **Use `distinct` for scalar uniqueness checks**: Built-in, no closure needed.
- **Use exact wildcard path in `required_if`**: `required_if:items.*.type,product` — wildcard must match.
- **Override wildcard error messages**: `tags.*.distinct => 'Duplicate tags are not allowed.'`.
- **Limit wildcard depth to 2-3 levels**: Deeper nesting is hard to read and debug.

## Architecture Guidelines

- Define array rules with parent type first: `'tags' => ['required', 'array', 'min:1', 'max:10']`.
- Follow with element rules: `'tags.*' => ['required', 'string', 'max:50', 'distinct']`.
- For conditional array rules, use exact wildcard paths in the condition parameter.
- Override error messages for wildcard fields to be client-friendly.
- Use `after()` hook for cross-item validation that `distinct` cannot handle (e.g., unique combinations).
- Unit test each wildcard rule independently with various array sizes.

## Performance Considerations

- Wildcard rules expand to concrete rules per element — deep nesting (3+ levels) increases rule count exponentially.
- `distinct` is O(n²) on unsorted arrays — sort before validation for large arrays.
- `exists` rules inside arrays execute one query per unique value — use `whereIn` to batch.
- `max` constraint on array size prevents DoS via massive payloads.
- Array limit of 50-100 items is typical for bulk endpoints.

## Security Considerations

- Always enforce `max` on array fields to prevent resource exhaustion attacks.
- Limit array depth to 2-3 levels to prevent complex malicious payloads.
- `distinct` on sensitive fields (emails) prevents enumeration via duplicate detection.
- Wildcard validation error messages may reveal array structure — keep messages generic.
- Deep wildcards combined with `exists` rules can be used for data enumeration — batch and rate-limit.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Forgetting `array` rule on parent | `*` wildcard without parent array type | Assuming implicit type | Rules silently ignored | Always declare `array` on parent |
| Wildcard in required_if mismatch | `required_if:type,product` without parent wildcard path | Not using exact path | Condition never applies | Use `required_if:items.*.type,product` |
| No min:1 on arrays | Empty arrays pass validation | Assuming array implies presence | Business logic receives empty collection | Always add `min:1` for non-empty requirement |
| No max on arrays | Open-ended arrays | Oversight | DoS via massive payload | Always enforce max per endpoint |
| `distinct` on array of objects | `distinct` only works on scalar values | Not reading docs | Silent failure | Use `after()` hook for object uniqueness |

## Anti-Patterns

- **Deep nesting beyond 3 wildcards**: `a.*.b.*.c.*.d` — unreadable and slow to expand.
- **No array size limits**: Accepting unlimited array elements.
- **`distinct` for object uniqueness**: `distinct` only works on scalar values.
- **Wildcard rules without element type validation**: `items.*` without specifying `array` or `string`.
- **Manual foreach validation in FormRequest**: Defeats the purpose of wildcard rules.

## Examples

```php
// Array of objects with type-specific rules
'items' => ['required', 'array', 'min:1', 'max:50'],
'items.*.type' => ['required', Rule::in(['product', 'service'])],
'items.*.product_id' => ['required_if:items.*.type,product', 'exists:products,id'],
'items.*.service_id' => ['required_if:items.*.type,service', 'exists:services,id'],
'items.*.amount' => ['required', 'numeric', 'min:0'],
'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],

// Distinct values
'emails' => ['required', 'array', 'min:1', 'max:100'],
'emails.*' => ['required', 'email', 'distinct'],
```

## Related Topics

- Form Request Design for APIs (base structure hosting array rules)
- Conditional Validation Patterns (combining wildcards with conditionals)
- Custom Validation Rules (applying custom rules to array elements)
- Bulk Request Validation (array validation for bulk endpoints)
- Pagination Parameter Validation (array validation for pagination meta)

## AI Agent Notes

- Always include `array`, `min`, and `max` on parent array fields.
- Use exact wildcard paths in conditional rule parameters.
- Prefer `after()` hook over `distinct` for object uniqueness checks.
- Limit wildcard depth to 3 levels max.
- When generating bulk endpoints, set `max` based on expected batch size.

## Verification

- [ ] All array fields have `array` rule on the parent key
- [ ] All array fields have `min` and `max` constraints
- [ ] Wildcard `*` is used for element rules, not manual loops
- [ ] `distinct` is used only for scalar array values
- [ ] Deep nesting is limited to 3 wildcard levels maximum
- [ ] Conditional rules (`required_if`) use the full wildcard parent path
- [ ] Error messages for wildcard fields are overridden for clarity
