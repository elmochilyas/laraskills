# Custom Validation Rules

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-custom-validation-rules |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Three custom validation rule strategies in Laravel: Rule classes, closure rules, and `Rule::custom()` method. Rule classes are preferred for reusable, testable, injectable validation logic. Closure rules suit one-off simple cases. The `$fail` closure halts validation for the attribute immediately, preventing cascading failures from additional rules.

## Core Concepts

- **Rule Class** (`php artisan make:rule`): Reusable, testable, injectable via constructor. Implements `ValidationRule` with `__invoke`.
- **Closure Rule**: Inline, no extra file, suitable for simple one-off validation.
- **`Rule::when()`**: Conditional composition — returns different rule sets based on a condition.
- **`$fail` Closure**: Halts validation for the attribute immediately; can be called multiple times for multiple errors.
- **Constructor Injection**: Rule classes support full dependency injection via constructor.
- **Multi-Field Rules**: Cross-field validation by passing data resolvers to rule constructors.

## When To Use

- When validation logic is too complex for built-in rules
- When the same validation is needed across multiple endpoints
- When validation requires external dependencies (repositories, APIs)
- When cross-field validation is needed (start_date before end_date)
- For domain-specific format validation (SKU, order number, tax ID)

## When NOT To Use

- When built-in rules suffice (required, string, email, exists, unique)
- For simple presence checks that `sometimes` or `nullable` handle
- For one-off validation that will never be reused — use closure rules instead
- When validation logic belongs in a FormRequest's `after()` hook

## Best Practices (WHY)

- **Prefer Rule classes over closures**: Reusable, testable, injectable with explicit dependencies.
- **Call `$fail()`, don't return bool**: The `$fail` closure stops validation for that attribute immediately.
- **Use constructor injection, not facades**: Explicit dependencies make rules testable.
- **Make rules stateless**: `__invoke` may be called multiple times per validation — don't share state.
- **Name rules descriptively**: `ValidEmailDomainRule` not `EmailRule`.
- **Batch expensive operations in constructor**: Cache DB/API results to avoid repeated calls.
- **Use `Rule::when()` for conditional composition**: Fluent, readable conditional rule sets.

## Architecture Guidelines

- Rule classes implement `Illuminate\Contracts\Validation\ValidationRule`.
- Store rule classes in `App\Rules\` directory.
- Name rule classes after what they validate: `ValidCurrencyRule`, `UniqueSkuRule`, `StartBeforeEndRule`.
- Register rules as services in the container if they have dependencies.
- Use inline closures only for trivial, non-reusable validation.
- For multi-field rules, pass data resolvers (closures) rather than the entire request.
- Override error messages with descriptive text that includes the field name.

## Performance Considerations

- Rule classes are resolved per-validation — cache expensive computations in constructor.
- Closure rules cannot be serialized — use Rule classes if caching route definitions.
- Avoid DB queries inside `__invoke()` — batch queries in constructor.
- `Rule::when()` adds condition evaluation overhead — negligible for single use.
- Rules with external API calls should have short timeouts and caching.

## Security Considerations

- Never include raw user input in error messages without sanitization.
- Rule classes should not log or expose sensitive validation data.
- Multi-field rules should not leak data about other fields in error messages.
- Ensure rules that check existence (DB lookups) are bounded by authorization.
- Rule classes with dependencies should not store sensitive data as constructor parameters.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning `bool` instead of calling `$fail` | Rule passes silently | Confusing old `passes()` API | Invalid data passes validation | Always call `$fail()` for invalid cases |
| Stateful rule instances | Cross-validation data leakage | Reusing instance variables | Wrong validation results | Make rules stateless |
| Injecting `Request` into rules | HTTP coupling | Convenience for accessing input | Not reusable outside HTTP context | Pass only needed data |
| Throwing exceptions inside rules | Breaks validation flow | Using throw instead of `$fail` | ValidationException instead of error | Use `$fail()` |
| `Validator::extend()` in service provider | Global rules conflict across contexts | Global registration | Side effects in unrelated validation | Use Rule classes locally in FormRequests |

## Anti-Patterns

- **One gigantic rule class with multiple responsibilities**: Single rule should validate one constraint.
- **Rules that call external APIs synchronously**: Blocks validation — use `after()` hook with timeout.
- **Rules that modify data**: Validation should not have side effects.
- **Rules that depend on session or auth state implicitly**: Pass required data via constructor.
- **Closure rules in reusable contexts**: Closures can't be serialized — breaks route caching.

## Examples

```php
class UniqueSkuRule implements ValidationRule
{
    public function __construct(
        private readonly SkuRepository $skus,
        private readonly ?int $ignoreId = null,
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->skus->exists($value, $this->ignoreId)) {
            $fail("The {$attribute} '{$value}' is already in use.");
        }
    }
}

// Usage:
'sku' => ['required', new UniqueSkuRule(app(SkuRepository::class), $productId)],
```

## Related Topics

- Form Request Design for APIs (base request hosting custom rules)
- Validation Rule Array Design (custom rules applied to array elements)
- Conditional Validation Patterns (combining custom rules with conditionals)
- Manual Validator Creation (using custom rules outside FormRequests)
- After Validation Hooks (post-validation with custom rule data)

## AI Agent Notes

- Prefer Rule classes over closures for any validation that might be reused.
- Use constructor injection for dependencies — never inject the Request object.
- Always call `$fail()` for invalid values, don't return `bool`.
- Keep rules stateless — don't use instance properties that change between calls.
- Name rule files and classes after the constraint they validate, not the field.

## Verification

- [ ] Rule classes implement `ValidationRule` interface with `__invoke`
- [ ] All rules call `$fail()` for invalid values (no return values used)
- [ ] No Rule class injects the `Request` object
- [ ] Rule classes are stateless — no shared instance state across invocations
- [ ] Rules with dependencies use constructor injection
- [ ] Rule classes are in `App\Rules\` with descriptive naming
- [ ] Unit tests exist for each custom rule with both pass and fail cases
