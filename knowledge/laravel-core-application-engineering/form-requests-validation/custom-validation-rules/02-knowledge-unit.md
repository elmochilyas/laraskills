# Custom Validation Rules

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Custom Validation Rules
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Custom validation rules extend Laravel's validation engine with application-specific constraints. Laravel supports three approaches: invokable rule classes (preferred since Laravel 10), Closure rules (quick inline constraints), and legacy `Validator::extend()` (class-based string name). Invokable rules are the standard — they are autoloadable, testable in isolation, and support dependency injection through the container.

---

## Core Concepts

### Invokable Rule Classes

An invokable rule is a class with a single `__invoke()` method that receives the attribute name, value, and a closure to call on failure:

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

The `$fail` closure accepts an error message string. When called, `InvokableValidationRule` wraps the message into the validator's error bag.

### InvokableValidationRule Wrapper

Internally, invokable rules are wrapped in `InvokableValidationRule`, which implements the `Rule` contract. The wrapper:

```php
class InvokableValidationRule implements Rule
{
    public function passes($attribute, $value)
    {
        $this->failed = false;
        $this->invokable->validate($attribute, $value, function ($message) {
            $this->failed = true;
            $this->message = $message;
        });
        return ! $this->failed;
    }

    public function message()
    {
        return $this->message;
    }
}
```

The `$fail` closure is a flag — `InvokableValidationRule::passes()` returns false if `$fail` was called.

### Closure Rules

Inline closures for one-off validation logic:

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

Closure rules are functionally identical to invokable classes but cannot be reused or tested independently.

---

## Mental Models

### The Validator Plugin

Custom rules are plugins to the validation engine. They extend the set of available constraints without modifying the core Validator class. The Validator discovers them through the rule parsing pipeline — when `ValidationRuleParser::prepareRule()` encounters a `ValidationRule` or `Closure`, it wraps it appropriately.

### The Fail Switch

The `$fail` closure is not an exception — it's a callback that flips a boolean flag in the wrapper. Validation continues to run other rules after `$fail` is called unless `bail` is present. This is different from throwing exceptions, which would abort all remaining validation.

---

## Internal Mechanics

### Rule Resolution in ValidationRuleParser

When the parser encounters a rule object:

```php
protected function prepareRule($rule, $attribute)
{
    if ($rule instanceof Closure) {
        $rule = new ClosureValidationRule($rule);
    }

    if ($rule instanceof InvokableRule || $rule instanceof ValidationRule) {
        $rule = InvokableValidationRule::make($rule);
    }

    // Pass through Rule contracts, Unique, and Exists directly
    if (! is_object($rule) ||
        $rule instanceof RuleContract ||
        ($rule instanceof Exists && $rule->queryCallbacks()) ||
        ($rule instanceof Unique && $rule->queryCallbacks())) {
        return $rule;
    }

    return (string) $rule;  // Fallback: cast to string for pipe parsing
}
```

Key behavior:
- `ValidationRule` interface (standard invokable) → wrapped in `InvokableValidationRule`
- `Closure` → wrapped in `ClosureValidationRule`
- Core `Rule` objects (`Rule::in()`, `Rule::notIn()`, etc.) → passed through directly
- `Unique`/`Exists` with query callbacks → passed through directly
- Everything else → cast to string for pipe-delimited parsing

### ValidationRule Interface Contract

The `ValidationRule` interface (introduced in Laravel 10) defines the contract:

```php
namespace Illuminate\Contracts\Validation;

interface ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void;
}
```

The `$fail` closure accepts either a string message or a translatable `ValidationRuleMessage`:

```php
$fail('validation.custom.postal_code')->translate([
    'attribute' => $attribute,
]);
```

### Stateless Design Constraint

Custom rules should not store state between `validate()` calls:

```php
class ValidPostalCode implements ValidationRule
{
    // WRONG — instance state persists across validations
    private bool $validated = false;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // ...
    }
}
```

The Validator may call `passes()` once per attribute per request. The invokable is instantiated once and reused across all attributes. Any instance state will be shared between validation calls.

---

## Patterns

### Constructor Injection for Dynamic Rules

Rules that depend on external parameters use constructor injection:

```php
class MaxTeamSize implements ValidationRule
{
    public function __construct(
        private int $maxSize,
        private int $teamId
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $count = TeamMember::where('team_id', $this->teamId)->count();
        if ($count >= $this->maxSize) {
            $fail("Team cannot exceed {$this->maxSize} members.");
        }
    }
}
```

Usage in FormRequest:

```php
'members' => [
    'required',
    'array',
    new MaxTeamSize(10, $this->route('team')->id),
],
```

### Naming Convention

Store custom rules in `app/Rules/`:

```
app/Rules/
├── ValidPostalCode.php
├── MaxTeamSize.php
├── ValidCurrency.php
└── DistinctCaseInsensitive.php
```

Each file is one class named PascalCase of what it validates.

### Reusable ValidationMessage Builder

For translatable messages with dynamic parameters:

```php
class ValidPromoCode implements ValidationRule
{
    public function __construct(
        private ?int $customerId = null
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $promo = PromoCode::where('code', $value)->first();

        if (! $promo) {
            $fail('validation.promo_not_found')->translate();
            return;
        }

        if ($promo->isExpired()) {
            $fail('validation.promo_expired')->translate([
                'expired_at' => $promo->expires_at->format('Y-m-d'),
            ]);
        }
    }
}
```

Translation keys go in `resources/lang/en/validation.php`.

---

## Architectural Decisions

### Invokable Class vs Closure

| Aspect | Invokable Class | Closure |
|--------|----------------|---------|
| Reusability | Multiple FormRequests | Single use |
| Testability | `$this->assertRuleFails()` | Integrated test only |
| DI | Constructor injection | Closure `use` binding |
| Organization | Autoloaded, findable | Inside FormRequest |
| Complexity threshold | 2+ FormRequests sharing logic | One-off inline logic |

Threshold: If a validation rule is used in more than one FormRequest, extract to an invokable class. A single-use rule can remain a closure but should be extracted if it exceeds 5-7 lines.

### Invokable Rule vs Validator::extend()

`Validator::extend()` registers rule closures globally in a ServiceProvider:

```php
Validator::extend('valid_postal_code', function ($attribute, $value, $parameters, $validator) {
    return preg_match('/^\d{5}(-\d{4})?$/', $value);
});
```

This approach:
- Registers rules globally — hard to trace where rules are defined
- Cannot be autoloaded — must be in a ServiceProvider or manually included
- Does not support DI through container
- Is the legacy pattern from Laravel 5.x-8.x

Invokable rules supersede `Validator::extend()` for all new code. The only use case for `extend()` is package-level validation rules that must work across apps without manual import.

---

## Tradeoffs

### Invokable Class vs Closure for Single-Use Rules

Closure rules keep validation logic inline with the rule definition, making the FormRequest self-contained. The tradeoff is testability — closures cannot be unit-tested in isolation, and any logic beyond a simple check requires integration testing through the full HTTP stack. An invokable class adds a file and a few lines of boilerplate but enables direct unit testing via `$this->assertRuleFails()`. The threshold should be lower than most teams expect: if the closure exceeds 5 lines or contains a condition, extract to an invokable.

### Custom Rule vs Existing Rule Composition

Before writing a custom validation rule, consider composing existing rules using `Rule::in()`, `Rule::notIn()`, or `Rule::when()`. Custom rules provide unlimited flexibility but bypass Laravel's built-in error message infrastructure and require manual translation integration. The rule of thumb: if the validation can be expressed as a combination of existing rules with `Rule::when()`, prefer composition over a custom class.

---

## Performance Considerations

### Per-Field Instantiation Overhead

Each custom rule object is instantiated once and reused across all attributes that use it in the same validation run. The `InvokableValidationRule` wrapper adds negligible overhead — one method call and a closure allocation per attribute. The real performance cost comes from expensive operations inside the `validate()` method, not from the rule wrapping infrastructure.

### Database Query Optimization

Custom rules that query the database should cache results internally using nullable properties. For array validation (`items.*.sku`), a rule that queries on every invocation can generate N+1 database queries. Cache the query result on first call and reuse it for subsequent attribute checks to reduce database load.

---

## Production Considerations

### Error Message Localization

Custom rules that use `$fail('validation.custom.key')->translate()` must have the corresponding translation keys in `resources/lang/{locale}/validation.php`. In production, missing translation keys silently fall back to the key name, producing unprofessional error messages. Include translation files in your deployment checklist and test with `app()->setLocale()` for all supported locales.

### Rule Registration in Service Providers

If using the legacy `Validator::extend()` pattern, ensure the ServiceProvider is registered in `config/app.php` and that the extension call is idempotent. Registering the same extension twice causes a runtime error. For invokable rules, no registration is needed — autoloading handles discovery automatically.

---

## Common Mistakes

### Instance State in ValidationRule

Since `InvokableValidationRule` wraps the rule once, any instance property set during `validate()` persists for subsequent calls in the same validation run. This causes cross-field state pollution.

### Database Queries Without Caching

A custom rule that queries the database runs per-field. For `items.*.sku` with 50 items, the rule fires 50 times — 50 database queries. Cache the query result inside the rule if the data doesn't change per field:

```php
class ValidSKU implements ValidationRule
{
    private ?Collection $validSkus = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $this->validSkus ??= Product::pluck('sku');
        if (! $this->validSkus->contains($value)) {
            $fail('Invalid SKU.');
        }
    }
}
```

### Forgetting $fail is a Closure, not a Return

```php
// WRONG — returns nothing, validation passes
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    return false;
}

// CORRECT — calls the fail closure
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    $fail('Invalid.');
}
```

The `$fail` closure must be called explicitly. Returning false or throwing an exception does not mark the rule as failed.

---

## Failure Modes

### Silent Rule Failure

If a custom rule's `validate()` method throws an unhandled exception (not a `$fail` call), the exception propagates through the Validator and surfaces as a 500 error. The validator cannot catch exceptions thrown inside rule closures — the entire validation fails with an HTTP 500 instead of a validation error response. Wrap I/O operations in try/catch and always use `$fail()` for validation failures.

### Missing Import of ValidationRule Interface

The `ValidationRule` interface must be imported from `Illuminate\Contracts\Validation\ValidationRule`. A common mistake is implementing the `Rule` interface (the legacy contract) instead, which has a different method signature (`passes()`, `message()`). This compiles without error but the rule never executes because the Validator checks for the `ValidationRule` interface before invoking `validate()`.

---

## Ecosystem Usage

### Laravel Nova

Nova uses invokable custom rules for its resource validation. The `Nova\Rules\RelatableAttachment` rule validates that file attachments belong to the correct parent resource. Nova's custom fields often ship with their own invokable rules to validate field-specific constraints like JSON structure or file dimensions.

### Laravel Spark

Spark uses custom rules for billing validation, such as `ValidCoupon` rules that verify discount codes against the Stripe API, and `ValidTaxId` rules that validate VAT identification numbers through external tax services. These rules encapsulate third-party API calls behind the simple `ValidationRule` interface.

### Laravel Horizon

Horizon uses custom rules to validate queue configuration inputs, such as `ValidQueueConnection` rules that verify Redis connection parameters are syntactically correct. These rules demonstrate the pattern of wrapping infrastructure validation behind a reusable rule interface.

---

## Related Knowledge Units

- **Validation Rule Patterns** (this subdomain) — string vs array syntax, Rule::unique()
- **Conditional Validation** (this subdomain) — rules that depend on other fields
- **Form Request Fundamentals** (this subdomain) — where rules execute in the pipeline

---

## Research Notes

### Rule Resolution Order

The `ValidationRuleParser::prepareRule()` method checks for `ValidationRule` interface first, then `Closure`, then `Rule` contract. This order means an object implementing both `ValidationRule` and `Rule` is treated as `ValidationRule` — the `invokable` path takes priority. This is by design since Laravel 10 introduced the new interface.

### Future Direction — Rule Groups and Composition

Future Laravel versions could introduce rule grouping where multiple rules can be composed into a single unit that short-circuits on first failure within the group. This would eliminate the need for manual `bail` placement when using custom rule objects.

### Framework Source Reference
- `Illuminate\Validation\InvokableValidationRule` — wrapper for invokable rules
- `Illuminate\Validation\ClosureValidationRule` — wrapper for closure rules
- `Illuminate\Validation\ValidationRuleParser::prepareRule()` — rule resolution logic
- `Illuminate\Contracts\Validation\ValidationRule` — the invokable contract
