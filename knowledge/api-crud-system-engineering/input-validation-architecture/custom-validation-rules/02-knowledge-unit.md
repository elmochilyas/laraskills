# Custom Validation Rules

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** custom-rules, rule-objects, closures, reusable-validation, laravel

## Executive Summary
Phase 2 covers the three custom validation rule strategies in Laravel: Rule classes, closure rules, and the `Rule::custom()` method. It covers when to use each, how to compose rules, dependency injection in rules, and rule parameterization for reusable validation logic.

## Mental Models

- **Rule Object as a Validation Micro-Service** — Each Rule class is a self-contained validation micro-service with its own dependencies, logic, and error reporting.
- **$fail Closure as a Circuit Breaker** — The `$fail` closure halts validation for the attribute immediately, preventing cascading failures from additional rules.
- **Custom Rules as Language Extensions** — Custom rules extend the validation vocabulary of the framework, adding domain-specific constraints beyond built-in rules.
- **Rule Composition as a Strategy Pattern** — Composing rules via arrays implements the Strategy pattern: each rule is a strategy, and the validator applies them in sequence.

## Core Concepts

### Three Custom Rule Strategies

| Strategy | When to Use | Complexity |
|---|---|---|
| **Rule class** (`php artisan make:rule`) | Reusable, testable, injectable | High |
| **Closure rule** | One-off, simple, context-dependent | Low |
| **`Rule::custom()` / `Rule::when()`** | Conditional composition, chaining | Medium |

### Rule Objects Are Invokable
Rule classes implement `Illuminate\Contracts\Validation\ValidationRule` with an `__invoke` method:
```php
public function __invoke(string $attribute, mixed $value, Closure $fail): void
{
    if (!preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
        $fail("The {$attribute} must be in format ABC-1234.");
    }
}
```

The `$fail` closure stops validation for that attribute — subsequent rules for the same attribute are skipped.

## Internal Mechanics

### Rule Class Constructor Injection
```php
use App\Repositories\SkuRepository;

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

// In FormRequest:
'sku' => ['required', new UniqueSkuRule(app(SkuRepository::class), $postId)],
```

### Closure Rule Binding
```php
use Illuminate\Support\Facades\Validator;

Validator::extend('valid_timezone', function ($attribute, $value, $parameters, $validator) {
    return in_array($value, timezone_identifiers_list(), true);
});
```

Closures bound with `Validator::extend()` are global. For scoped rules, use inline closures in `rules()`.

## Patterns

### Boolean-Safe Validation Rule
```php
class BooleanRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, [true, false, 0, 1, '0', '1'], true)) {
            $fail("The {$attribute} field must be true or false.");
        }
    }
}
```

### Composed Rules with Rule::when()
```php
use Illuminate\Support\Str;

Rule::when(
    $this->input('type') === 'premium',
    ['required', 'string', 'min:10'],
    ['sometimes', 'nullable']
);
```

Returns different rule sets based on a condition.

### Multi-Field Rule (Cross-Field Validation)
```php
class StartBeforeEndRule implements ValidationRule
{
    public function __construct(
        private readonly Closure $endDateResolver,
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        $endDate = ($this->endDateResolver)();

        if ($endDate && $value > $endDate) {
            $fail("The start date must be before the end date.");
        }
    }
}

// In FormRequest:
'start_date' => ['required', 'date', new StartBeforeEndRule(fn () => $this->input('end_date'))],
```

### Parameterized Rule with Error Placeholders
```php
class AllowedCurrenciesRule implements ValidationRule
{
    public function __construct(
        private readonly array $allowedCurrencies,
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array(strtoupper($value), $this->allowedCurrencies, true)) {
            $fail('The :attribute must be one of: ' . implode(', ', $this->allowedCurrencies) . '.');
        }
    }
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Rule class over closure | Reusable, testable, injectable | Closure — not reusable, harder to test |
| $fail closure over throwing | Halts further rules for the attribute | Throw ValidationException — catches all rules |
| Constructor injection over facades | Explicit dependencies, testable | Rule:: facade — hidden coupling |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Rule class | Full DI, testable, reusable | More files; one class per rule |
| Closure rule | Inline, no extra file | Not reusable; untestable in isolation |
| Rule::custom() | Composable, fluent | Adds dependency on Rule facade |
| $fail() vs return bool | $fail stops immediately; can add multiple failures | Must remember to call $fail, not return false |

## Performance Considerations
- Rule classes are resolved per-validation — cache expensive computations (e.g., API calls) in rule instance.
- Closure rules cannot be serialized — use Rule classes if caching route definitions.
- Avoid DB queries inside rule `__invoke()` — batch queries in constructor or use repository cache.
- `Rule::when()` adds condition evaluation overhead — negligible for single use but measurable in loops.

## Production Considerations
- Log rule failures with attribute name and value for debugging.
- Use rule classes for all business-critical validation (e.g., uniqueness, cross-field checks).
- Register custom rules as services in the container for testability.
- Name rules descriptively — `ValidEmailDomainRule` not `EmailRule` (too generic).

## Common Mistakes
- Returning `bool` from `__invoke()` instead of calling `$fail()` — rule passes silently.
- Making rules stateful across invocations — `__invoke` may be called multiple times per validation.
- Using `Validator::extend()` in service provider — global rules may conflict across contexts.
- Throwing exceptions inside rules instead of calling `$fail()` — breaks validation flow.
- Injecting `Request` into rules — creates coupling; pass only needed data.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Rule class not resolved | ContainerException: Target class not found | Register in AppServiceProvider or use app() helper |
| Closure rule serialization | UnexpectedValueException caching routes | Use Rule class for serialized contexts |
| $fail() not called | Invalid value passes validation | Always call $fail() explicitly for invalid cases |
| Stateful rule instance | Cross-request data leakage | Make rules stateless; pass data via constructor |

## Ecosystem Usage

### Laravel Built-in Rule Classes
```php
use Illuminate\Validation\Rule;

Rule::unique('users', 'email')->ignore($userId);
Rule::in(['draft', 'published', 'archived']);
Rule::exists('posts', 'id')->where('status', 'published');
Rule::prohibitedIf(fn () => $this->input('type') === 'guest');
```

### Spatie Laravel Validation
```php
use Spatie\ValidationRules\Rules\CountryCode;
use Spatie\ValidationRules\Rules\Currency;

'country' => ['required', new CountryCode()],
'currency' => ['required', new Currency()],
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class where custom rules are applied.

### Related Topics
- **conditional-validation-patterns** — combining custom rules with conditionals.
- **validation-rule-array-design** — custom rules applied to array elements.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — custom rules that transform data for DTOs.
- **after-validation-hooks** — post-validation processing with custom rule data.

## Research Notes

### Source Analysis
Laravel's `Validator` class resolves Rule objects through `validateUsingRuleClass()`. Rules implementing `ValidationRule` interface are invoked with the `$fail` closure. Rules implementing `DataAwareRule` or `ValidatorAwareRule` receive additional context before invocation.

### Key Insight
The `$fail` closure pattern replaces the older `passes()` / `message()` two-method interface. It simplifies rule creation to a single callable and allows multiple error messages per rule call. The closure can be called multiple times to add multiple errors for the same attribute.

### Version-Specific Notes
- Laravel 10: New `ValidationRule` interface with `__invoke` — replaces old `Rule` contract.
- Laravel 11: `Rule::custom()` added for inline custom rules.
- PHP 8.2+: `Closure` type with `$fail` parameter can use `Closure` import.
