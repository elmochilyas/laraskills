# Cast Parameters — Skills

---

## Skill 1: Create a Parameterized Custom Cast

### Purpose
Build a custom cast class that accepts configuration parameters via colon-delimited syntax in the model's `$casts` array, enabling reusable casts with per-attribute configuration.

### When To Use
- A cast class needs per-attribute configuration (decimal places, currency, locale)
- You want to avoid creating a separate cast class for each variation
- The same cast logic applies with different parameters across attributes

### When NOT To Use
- The cast doesn't need configuration — just use the class name directly
- The configuration is different per model — use separate cast classes

### Prerequisites
- Understanding of `CastsAttributes` interface
- A value object or transformation that needs configuration

### Inputs
- Cast class name
- Parameter names, types, and defaults
- Valid parameter values documentation

### Workflow

1. **Define the cast class** implementing `CastsAttributes` or `CastsInboundAttributes`

2. **Accept parameters in the constructor** with defaults:
   ```php
   class DecimalCast implements CastsAttributes
   {
       public function __construct(
           private readonly int $decimals = 2,
           private readonly string $locale = 'en_US',
       ) {}
   ```

3. **Validate parameters in the constructor** — throw `InvalidArgumentException` with clear messages

4. **Document valid parameter values** in the class docblock — explain order, types, and defaults

5. **Register in the model** using colon-delimited syntax:
   ```php
   protected $casts = [
       'price' => DecimalCast::class . ':4,de_DE',
       'tax' => DecimalCast::class . ':4',
       'discount' => DecimalCast::class,
   ];
   ```

### Validation Checklist

- [ ] Constructor accepts parameters with sensible defaults
- [ ] Parameters are validated in the constructor
- [ ] Valid parameter values are documented in the class docblock
- [ ] Colon-delimited syntax is used consistently for registration
- [ ] Optional parameters can be omitted from the `$casts` array

### Related Rules

| Rule | Reference |
|---|---|
| Accept cast parameters as array in constructor | `05-rules.md` Rule 1 |
| Validate cast parameters in the constructor | `05-rules.md` Rule 2 |
| Document valid parameter values | `05-rules.md` Rule 3 |
| Provide defaults for optional cast parameters | `05-rules.md` Rule 4 |
| Use colon-delimited syntax consistently | `05-rules.md` Rule 5 |

### Success Criteria
- Cast class accepts parameters with defaults and validation
- Model registers with colon-delimited parameter syntax
- Documentation explains parameter meaning, order, and defaults
- Omitting parameters falls back to sensible defaults
