## Accept Cast Parameters as Array in Constructor
---
## Category
Design
---
## Rule
Accept cast parameters as a single `array $parameters` in the constructor, then parse and assign individual values with defaults. Alternatively, use a named static factory method like `parseParameters()`.
---
## Reason
Laravel passes colon-delimited parameters as a flat array. Accepting the array directly keeps the constructor self-documenting and provides a single point for validation and default assignment.
---
## Bad Example
```php
class DecimalCast implements CastsAttributes
{
    public function __construct(
        array $parameters
    ) {
        $this->decimals = $parameters[0];
        $this->locale = $parameters[1];
    }
}
```
---
## Good Example
```php
class DecimalCast implements CastsAttributes
{
    public function __construct(
        private readonly int $decimals = 2,
        private readonly string $locale = 'en_US',
    ) {}

    public static function parseParameters(array $parameters): static
    {
        return new static(
            decimals: (int) ($parameters[0] ?? 2),
            locale: $parameters[1] ?? 'en_US',
        );
    }
}
```
---
## Exceptions
No common exceptions. Always validate and provide defaults for parameters.
---
## Consequences Of Violation
Undefined array key errors when parameters are missing, silent failures from missing defaults, fragile parameter handling.

---
## Validate Cast Parameters in the Constructor
---
## Category
Reliability
---
## Rule
Validate all cast parameters eagerly in the constructor or factory method. Throw `InvalidArgumentException` with a clear message when parameter values are invalid.
---
## Reason
Cast parameters are specified as colon-delimited strings in the model's `$casts` array. Invalid parameters fail only when the attribute is accessed, not at registration time. Eager validation catches misconfiguration early.
---
## Bad Example
```php
public function __construct(
    private readonly int $decimals = 2,
) {}
```
---
## Good Example
```php
public function __construct(
    private readonly int $decimals = 2,
) {
    if ($decimals < 0 || $decimals > 10) {
        throw new \InvalidArgumentException("Decimal places must be 0-10, got: {$decimals}");
    }
}
```
---
## Exceptions
No common exceptions. Parameter validation protects against silent data corruption.
---
## Consequences Of Violation
Silent data truncation or corruption when invalid parameters are used, debugging difficulty when misconfiguration is discovered only at runtime during attribute access.

---
## Document Valid Parameter Values
---
## Category
Maintainability
---
## Rule
Document the valid parameter values, their types, their order, and defaults in the cast class docblock. The colon-delimited syntax hides parameter semantics from the model definition.
---
## Reason
Unlike named constructor arguments, cast parameters are opaque strings in the `$casts` array. Without documentation, developers cannot know what values are valid, their order, or their effect.
---
## Bad Example
```php
// No documentation — what does ':4,de_DE' mean?
protected $casts = [
    'price' => DecimalCast::class . ':4,de_DE',
];
```
---
## Good Example
```php
/**
 * Casts decimal values with configurable precision and locale.
 *
 * Parameter format: DecimalCast:{decimals},{locale}
 *   - decimals (int): Number of decimal places (0-10). Default: 2.
 *   - locale (string): Locale for formatting. Default: 'en_US'.
 *
 * Examples:
 *   DecimalCast:4,de_DE  → 4 decimal places, German locale
 *   DecimalCast:0        → 0 decimal places, default locale
 *   DecimalCast           → defaults (2, en_US)
 */
class DecimalCast implements CastsAttributes
```
---
## Exceptions
No common exceptions. Always document parameterized casts.
---
## Consequences Of Violation
Developer confusion about parameter meaning, incorrect cast usage, time wasted reading cast class internals to determine parameter format.

---
## Provide Defaults for Optional Cast Parameters
---
## Category
Reliability
---
## Rule
Always provide sensible defaults for every cast parameter so that the cast works correctly when used without any colon-delimited arguments.
---
## Reason
Models may omit optional parameters for the most common use case. Without defaults, omitting parameters causes runtime errors or requires all models to specify all parameters, defeating the purpose of configurability.
---
## Bad Example
```php
public function __construct(
    private readonly int $decimals, // No default — required
) {}
```
---
## Good Example
```php
public function __construct(
    private readonly int $decimals = 2, // Sensible default
) {}
```
---
## Exceptions
When a parameter is truly required for the cast to function and has no sensible default, make it required and document the requirement.
---
## Consequences Of Violation
Runtime errors when models omit parameters, unnecessary verbosity in `$casts` definitions, breaking changes when new parameters are added.

---
## Use Colon-Delimited Syntax Consistently
---
## Category
Maintainability
---
## Rule
Always use the standard `CastClass::class . ':param1,param2'` colon-delimited syntax when registering parameterized casts in the model. Do not invent alternative parameter-passing mechanisms.
---
## Reason
Colon-delimited syntax is the established Laravel convention recognized by the framework. Alternative approaches (custom array arguments, environment-based configuration) are non-standard, harder to audit, and confuse developers familiar with standard patterns.
---
## Bad Example
```php
protected $casts = [
    'price' => ['cast' => DecimalCast::class, 'decimals' => 4],
];
```
---
## Good Example
```php
protected $casts = [
    'price' => DecimalCast::class . ':4',
];
```
---
## Exceptions
When using the `casts()` method, you may also return instances directly, which is equally acceptable: `'price' => new DecimalCast(decimals: 4)`.
---
## Consequences Of Violation
Fragile custom parameter parsing, deviation from Laravel conventions, confusion during code reviews, inability to use standard tooling that expects colon-delimited format.
