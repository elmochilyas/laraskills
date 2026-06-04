# Cast Parameters

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Cast Parameters |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Cast parameters allow passing configuration values to custom cast classes via the model's `$casts` array using a colon-delimited syntax. Parameters are passed to the cast class constructor, enabling reusable cast classes that can be configured per attribute (e.g., `MoneyCast:USD` for dollars, `MoneyCast:EUR` for euros).

## Core Concepts

- **Colon-delimited syntax**: `'attribute' => CastClass::class . ':param1,param2'`
- **Constructor injection**: Parameters are passed to the cast class constructor as an array
- **Multiple parameters**: Commas separate multiple parameters: `':param1,param2,param3'`
- **Type safety**: Parameters arrive as strings — cast constructors should parse/validate them

## When To Use

- You have a reusable cast class that needs per-attribute configuration
- You want to avoid creating a separate cast class for each variation
- You need to control the behavior of a cast at the attribute level

## When NOT To Use

- The cast doesn't need configuration (use the class name directly)
- The configuration is different per model (consider a different approach per model)

## Best Practices

- **Accept parameters as a single array**: `__construct(array $parameters)` — parse individual values from the array
- **Validate parameters in the constructor**: Invalid parameters should throw early with clear error messages
- **Document valid parameter values**: Since the model file hides the parameter meaning, document what values are valid

## Examples

```php
class DecimalCast implements CastsAttributes
{
    public function __construct(
        private int $decimals = 2,
        private string $locale = 'en_US',
    ) {}

    public static function parseParameters(array $parameters): static
    {
        return new static(
            decimals: (int) ($parameters[0] ?? 2),
            locale: $parameters[1] ?? 'en_US',
        );
    }

    // get() and set() implementations...
}

// Registration
protected $casts = [
    'price' => DecimalCast::class . ':4,de_DE',
    'tax_rate' => DecimalCast::class . ':4',
    'discount' => DecimalCast::class,
];
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | CastsAttributes Interface |
| Closely Related | Castable Interface |
| Closely Related | Value Object Casting |
| Advanced | SerializesCastableAttributes |

## AI Agent Notes

- Parameters are colon-delimited after the class name
- Accept parameters as `array $parameters` in the constructor
- Validate parameters and throw early on invalid values

## Verification

- [ ] Cast class constructor accepts `array $parameters` or specific typed parameters
- [ ] Parameters are validated in the constructor
- [ ] Valid parameter values are documented
- [ ] Default values are provided for optional parameters
