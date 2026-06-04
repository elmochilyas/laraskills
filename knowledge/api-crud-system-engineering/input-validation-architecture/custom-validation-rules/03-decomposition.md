# Custom Validation Rules

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** custom-rules, testing, production, integration, rule-registry

## Executive Summary
Phase 3 covers testing custom rule classes in isolation, registering rules as container services, rule localization strategies, integration with DTOs, and enterprise rule registries for cross-team reusable validation.

## Core Concepts

### Rule as a First-Class Citizen
Custom rules should be treated like services — registered in the container, dependency-injected, tested in isolation, and documented in a shared rule catalog. A rule is not "just validation" — it is a reusable business constraint.

### Rule Registry Pattern
A centralized registry of all custom rules used across the API. This enables discovery, prevents duplication, and enforces naming conventions.
```
app/Rules/
├── Banking/
│   ├── SwiftCodeRule.php
│   ├── IbanRule.php
│   └── SortCodeRule.php
├── Commerce/
│   ├── SkuFormatRule.php
│   ├── TaxIdRule.php
│   └── CurrencyCodeRule.php
└── Core/
    ├── BooleanRule.php
    ├── HexColorRule.php
    └── SlugRule.php
```

## Internal Mechanics

### Rule Class as a Container Service
```php
// AppServiceProvider::register()
$this->app->bind(UniqueSkuRule::class, function ($app) {
    return new UniqueSkuRule(
        $app[SkuRepository::class],
        $app[Cache::class],
    );
});

// In FormRequest:
'sku' => ['required', app(UniqueSkuRule::class)->ignore($productId)],
```

Rules registered as singletons should be stateless — use `ignore()` to set per-validation context without constructor pollution.

### Rule with Localization Support
```php
class CurrencyCodeRule implements ValidationRule
{
    public function __construct(
        private readonly Translator $translator,
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        $currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

        if (!in_array(strtoupper($value), $currencies, true)) {
            $fail($this->translator->get('validation.currency_code', [
                'attribute' => $attribute,
                'currencies' => implode(', ', $currencies),
            ]));
        }
    }
}
```

## Patterns

### Testing Custom Rule Classes in Isolation
```php
public function test_boolean_rule_accepts_true(): void
{
    $rule = new BooleanRule();
    $rule('flag', true, $this->failClosure());
    $this->assertNoValidationError();
}

public function test_boolean_rule_rejects_string_true(): void
{
    $failed = false;
    $rule = new BooleanRule();
    $rule('flag', 'true', function ($message) use (&$failed) {
        $failed = true;
    });
    $this->assertTrue($failed);
}

public function test_unique_sku_rule_with_existing_sku(): void
{
    $repo = $this->createMock(SkuRepository::class);
    $repo->method('exists')->with('SKU-001', null)->willReturn(true);

    $rule = new UniqueSkuRule($repo);
    $failed = false;
    $rule('sku', 'SKU-001', function ($message) use (&$failed) {
        $failed = true;
    });

    $this->assertTrue($failed);
}

public function test_unique_sku_rule_ignores_current_id(): void
{
    $repo = $this->createMock(SkuRepository::class);
    $repo->method('exists')->with('SKU-001', 42)->willReturn(false);

    $rule = new UniqueSkuRule($repo);
    $rule = $rule->ignore(42);
    $failed = false;
    $rule('sku', 'SKU-001', function ($message) use (&$failed) {
        $failed = true;
    });

    $this->assertFalse($failed);
}

private function failClosure(): Closure
{
    return function (string $message) {
        $this->fail("Unexpected validation failure: {$message}");
    };
}
```

### Integration Test with FormRequest
```php
public function test_store_post_with_invalid_sku(): void
{
    $response = $this->postJson('/api/v1/products', [
        'sku' => 'INVALID',
        'name' => 'Test Product',
        'price' => 9.99,
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment([
        'source' => ['pointer' => '/sku'],
    ]);
}
```

### Reusable Rule with Fluent Builder
```php
class SkuRule implements ValidationRule
{
    private bool $checkUniqueness = false;
    private ?int $ignoreId = null;

    public function unique(?int $ignoreId = null): static
    {
        $this->checkUniqueness = true;
        $this->ignoreId = $ignoreId;
        return $this;
    }

    public function format(string $pattern): static
    {
        $this->formatPattern = $pattern;
        return $this;
    }

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
            $fail("The {$attribute} format is invalid.");
            return;
        }

        if ($this->checkUniqueness) {
            // Check uniqueness against repository
        }
    }
}

// Usage:
'sku' => ['required', (new SkuRule())->unique($productId)],
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Rule classes in container | Explicit dependency management, swappable implementations |
| Fluent builder on rules | Self-documenting API at call site |
| Rule registry directory | Discoverable, prevents duplication across teams |
| Isolated unit tests for rules | Fast, no HTTP overhead, tests business logic directly |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Container-registered rules | DI, testable with mocks | Requires bootstrap for tests |
| Fluent builders | Readable composition | More code in rule class |
| Rule registry | Prevents duplication | Overhead to maintain catalog |

## Performance Considerations
- Register rules as singletons if stateless — avoid reconstructing on every validation.
- Fluent builder methods should return `$this` (no clones) to reduce object allocation.
- Cache expensive computations (regex compilation, API calls) in rule instance properties.
- For rules used across many fields (e.g., `BooleanRule`), cache the instance.

## Production Considerations

### Rule Documentation
```php
/**
 * Validates that a value is a supported currency code.
 *
 * Accepted: USD, EUR, GBP, JPY, CAD
 *
 * @see https://docs.example.com/standards/currencies
 */
class CurrencyCodeRule implements ValidationRule { ... }
```

### Rule Discovery via Artisan Command
```bash
php artisan rules:list
# Lists all custom rules with their descriptions
```

### Monitoring Rule Usage
```php
class MonitoredRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        Metrics::increment('validation.rule.invocation', [
            'rule' => static::class,
            'attribute' => $attribute,
        ]);

        // ... validation logic ...
    }
}
```

## Common Mistakes
- Making rules stateful when used as singletons — data from one request leaks to next.
- Injecting `Request` or `Input` directly — couples rule to HTTP context.
- Not testing the `$fail` path — only testing successful validation.
- Over-parameterizing rules — if a rule takes 5+ parameters, it's doing too much.
- Creating too many one-off rules instead of composing built-in rules.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Rule registered as singleton with state | Cross-request contamination | Use `->recreate()` or make rules stateless |
| Rule not found by autoloader | ClassNotFoundException for rule | Run `composer dump-autoload` |
| Rule serialization for queue | LogicException: Serialization of closures | Ensure rule is serializable; avoid closures |
| Missing rule documentation | Team duplicates existing rule | Mandate rule discovery in PR template |

## Ecosystem Usage

### Spatie Laravel Validation Rules
```php
// Provides many pre-built rules
use Spatie\ValidationRules\Rules\Delimited;
use Spatie\ValidationRules\Rules\Enum;

'roles' => ['required', new Delimited('email')],
'status' => ['required', new Enum(PostStatus::class)],
```

### Laravel Custom Rule Package Structure
```text
my-package/
├── src/
│   └── Rules/
│       ├── MyPackageRule.php
│       └── RulesServiceProvider.php
└── tests/
    └── Rules/
        └── MyPackageRuleTest.php
```

### Archivable Rule Registry Tool
```php
// php artisan rules:registry
class GenerateRuleRegistry extends Command
{
    public function handle(): int
    {
        $rules = File::allFiles(app_path('Rules'));

        $markdown = "# Custom Rule Registry\n\n";
        foreach ($rules as $file) {
            $class = $this->fileToFqn($file);
            $reflection = new ReflectionClass($class);
            $docblock = $reflection->getDocComment();
            $markdown .= "## " . class_basename($class) . "\n";
            $markdown .= "- **Namespace:** {$class}\n";
            $markdown .= "- **Description:** " . $this->parseDescription($docblock) . "\n\n";
        }

        File::put(base_path('docs/rule-registry.md'), $markdown);
        $this->info('Rule registry generated at docs/rule-registry.md');

        return self::SUCCESS;
    }
}
```

## Related Knowledge Units

### Prerequisites
- **custom-validation-rules** — Phase 2 custom rule mechanics.
- **form-request-design-for-apis** — where rules are applied.

### Related Topics
- **validation-rule-array-design** — custom rules in array contexts.
- **conditional-validation-patterns** — conditional custom rule application.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — custom rules feeding into DTOs.
- **manual-validator-creation** — using custom rules in manual validation.

## Research Notes

### Source Analysis
Laravel 10+ uses `Illuminate\Validation\ValidationRuleParser` to detect rule type. Rule objects implementing `ValidationRule` are invoked directly. Older `Rule` contract with `passes()` and `message()` methods is still supported for backward compatibility.

### Key Insight
Custom rules are the **extension point** for domain-specific validation. By creating well-named, single-responsibility rule classes, you build a domain-specific validation language that reads naturally at the call site: `['required', new HexColorRule(), new UniqueSkuRule($productId)]`.

### Version-Specific Notes
- Laravel 10: `ValidationRule` interface replaces `Rule` contract. `$fail` closure replaces `message()` method.
- Laravel 11: `Rule::custom()` allows inline custom rules with `$fail` closure.
- PHP 8.2: `readonly` properties in rule classes simplify state management.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization