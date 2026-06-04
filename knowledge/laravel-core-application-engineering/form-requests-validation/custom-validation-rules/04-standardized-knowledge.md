# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Custom Validation Rules |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Custom validation rules extend Laravel's validation engine with application-specific constraints. Laravel supports three approaches: invokable rule classes (preferred since Laravel 10), Closure rules (quick inline constraints), and legacy `Validator::extend()` (class-based string name). Invokable rules are the standard — they are autoloadable, testable in isolation, and support dependency injection through the container.

---

## Core Concepts

- **Invokable rule classes**: Implement `ValidationRule` interface with `validate(string $attribute, mixed $value, Closure $fail): void`
- **Closure rules**: Inline closures for one-off validation — `function (string $attribute, mixed $value, Closure $fail) { ... }`
- **The `$fail` closure**: When called, marks the rule as failed. Continues validation of other rules unless `bail` is present
- **InvokableValidationRule wrapper**: Wraps invokable rules — calls `validate()`, tracks whether `$fail` was called
- **Dependency injection**: Invokable rules can type-hint constructor dependencies — resolved from the container

---

## When To Use

- Reusable validation logic that applies to multiple fields or forms
- Complex validation requiring database queries or external API calls
- Business-specific validations (valid postal code, coupon code, membership number)
- When the built-in rules are insufficient for domain-specific constraints

## When NOT To Use

- Simple checks that can be expressed with built-in rules
- One-off validation in a single FormRequest (use Closure rules instead)
- Validation that depends on context only available in the FormRequest

---

## Best Practices

- **Prefer invokable classes** over Closures for any rule used in more than one place
- **Use descriptive class names**: `ValidPostalCode`, `ValidCouponCode`, `NotFutureDate`
- **Return translatable messages**: `$fail('validation.custom.postal_code')->translate()`
- **Test rules in isolation**: Instantiate the rule, call `validate()`, assert on the `$fail` callback
- **Use dependency injection** for rules that need services, repositories, or external APIs
- **Fail with specific messages**: Include the attribute name and rejected value for clarity

---

## Architecture Guidelines

- Rules extend `Illuminate\Contracts\Validation\ValidationRule` (Laravel 10+)
- Rules in `app/Rules/` directory or co-located with feature modules
- Closures are wrapped in `ClosureValidationRule` during parsing
- `ValidationRuleParser::prepareRule()` handles the wrapping logic
- The `$fail` closure is a boolean flag mechanism — not an exception
- Translation files in `resources/lang/en/validation.php` for rule messages

---

## Performance

Custom rule execution cost depends on the validation logic. Database-querying rules should be cached or eager-loaded where possible. The `$fail` closure mechanism is lightweight — it's a boolean flag, not an exception. Rules run in the per-attribute loop during `Validator::passes()`.

---

## Security

Custom rules execute arbitrary PHP code — ensure they don't have unintended side effects. Rules should validate, not mutate. Database queries in rules should use parameterized queries (Eloquent/Query Builder). Never trust user input in rule logic.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Throwing exceptions instead of using $fail | Exception pattern familiarity | Aborts all remaining validation | Use `$fail('message')` to fail gracefully |
| Side effects in validate() | Performing mutations in rules | Unexpected behavior, hard to debug | Rules should only validate |
| Not translating messages | Hardcoded English strings | Internationalization broken | Use `$fail()->translate()` |
| Heavy database queries without caching | No caching on repeated validation | N+1 query problem in array validation | Cache results or batch queries |
| Using legacy `Validator::extend()` | Outdated documentation | Misses DI and auto-discovery benefits | Use invokable classes (Laravel 10+) |

---

## Anti-Patterns

- **Throwing exceptions**: `throw new \Exception('Invalid')` instead of `$fail('Invalid')`
- **Database mutations**: Writing to the database inside a validation rule
- **500-line invokable rule**: Rule that does too much — should be simple and focused
- **Legacy extend() usage**: Using `Validator::extend()` in Laravel 10+ instead of invokable classes
- **Rules with side effects**: Sending emails, updating records, calling external APIs

---

## Examples

**Invokable rule class:**
```php
class ValidPostalCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! preg_match('/^\d{5}(-\d{4})?$/', $value)) {
            $fail('The :attribute must be a valid ZIP code.');
        }
    }
}
```

**Closure rule (one-off):**
```php
'promo_code' => [
    'required',
    function (string $attribute, mixed $value, Closure $fail) {
        if (! PromoCode::where('code', $value)->where('active', true)->exists()) {
            $fail('The :attribute is invalid or expired.');
        }
    },
]
```

**Rule with dependency injection:**
```php
class ValidCouponCode implements ValidationRule
{
    public function __construct(private CouponService $coupons) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $this->coupons->isValid($value)) {
            $fail('The :attribute is not a valid coupon code.');
        }
    }
}
```

**Using the rule in a FormRequest:**
```php
'postal_code' => ['required', new ValidPostalCode],
```

---

## Related Topics

- validation-rule-patterns — String vs array syntax for rules
- conditional-validation — When rules depend on other field values
- form-request-fundamentals — FormRequest integration
- form-request-testing — Testing forms with custom rules

---

## AI Agent Notes

- The `$fail` closure is not an exception — it flips a boolean flag, validation continues for other rules
- `ValidationRule` interface (Laravel 10+) defines: `public function validate(string $attribute, mixed $value, Closure $fail): void`
- Closures are wrapped in `ClosureValidationRule`, invokable classes in `InvokableValidationRule`
- Core Rule objects (`Rule::in()`, `Rule::notIn()`) pass through directly without wrapping
- Translation: `$fail('validation.custom.postal_code')->translate()`

---

## Verification

- [ ] Invokable classes used for reusable custom rules (Laravel 10+)
- [ ] Closure rules used for one-off validation only
- [ ] `$fail()` used instead of throwing exceptions
- [ ] No side effects in validate() method
- [ ] Messages are translatable where internationalization is needed
- [ ] Rules testable in isolation (unit test)
- [ ] Dependency injection used for services/database access
- [ ] Rule file in `app/Rules/` or appropriate feature directory
