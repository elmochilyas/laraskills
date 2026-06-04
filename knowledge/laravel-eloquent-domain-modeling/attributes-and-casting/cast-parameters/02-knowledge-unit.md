# cast-parameters

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** cast-parameters
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cast parameters allow custom casts to accept configuration arguments through the `$casts` array definition using a colon-delimited syntax. Instead of hardcoding behavior inside a cast class or creating separate cast classes for each variant, parameters make casts configurable at the attribute level. This enables a single cast class to handle multiple storage formats, column types, or business rules without code duplication. Understanding the parameter resolution mechanism is essential for building reusable, configurable cast classes.

---

## Core Concepts

- **Colon-delimited syntax**: Parameters are appended to the cast class name with colons: `'attribute' => CastClass::class.':param1:param2'`.
- **Construct argument injection**: Parameters are passed to the cast class's constructor in order. The first parameter is the first constructor argument, etc.
- **String-only parameters**: All parameters from the `$casts` definition are passed as strings. Type conversion (to int, bool, etc.) must happen inside the cast constructor.
- **No named parameters**: Only positional parameters are supported. There is no mechanism for key-value syntax in the `$casts` array.
- **Default values**: The cast constructor can define default values for parameters, making them optional.
- **Castable forwarding**: When used with `Castable`, the parameters are forwarded to `castUsing(array $arguments)`, where `$arguments` is the array of parameters.

---

## Mental Models

- **Constructor configuration**: Think of cast parameters as constructor arguments for the cast class — they are injected at resolution time, not at call time.
- **Build-time vs run-time**: Parameters are resolved once when the cast is instantiated (build-time), not per attribute access (run-time). They are immutable for the lifetime of the cast instance.
- **Column-level config map**: Similar to how HTML attributes configure HTML elements, cast parameters configure how the cast transforms data for a specific column.
- **String tunnel**: Parameters travel through the `$casts` array as raw strings and are only interpreted by the cast's constructor — there is no intermediate validation or parsing.

---

## Internal Mechanics

- **Parsing in `HasAttributes`**: In `Illuminate\Database\Eloquent\Concerns\HasAttributes`, the `$casts` array values are parsed for colons. Everything before the first colon is the cast class; everything after is split by colon into parameter strings.
- **Constructor reflection**: Laravel reflects on the cast class constructor to determine how many parameters to inject. If the constructor has typed parameters, the string value is not automatically type-coerced.
- **Resolution via `make()`**: The cast is resolved through the container, meaning parameters are passed as constructor arguments via `$app->make($castClass, ['parameters' => $params])` or similar mechanism depending on the Laravel version.
- **Array parameter limitation**: There is no syntax for passing arrays or nested structures as cast parameters. Every parameter is a string.
- **Parameter caching**: The resolved cast instance (with parameters baked into its constructor) is cached on the model instance. Subsequent attribute access reuses the same configured cast.

---

## Patterns

### Column Type Indicator Pattern

**Purpose**: Pass the database column type to the cast (e.g., `'rate' => DecimalCast::class.':10:4'` to indicate decimal precision).

**Benefits**: Single cast class handles multiple precision configurations.

**Tradeoffs**: String parsing of column types must be robust against invalid formats.

### Format String Pattern

**Purpose**: Pass formatting configurations like date formats, number separators, or serialization rules.

**Benefits**: Cast logic is unchanged; only formatting varies per column.

**Tradeoffs**: Format string parsing adds complexity to the cast constructor.

### Nullable Flag Pattern

**Purpose**: Pass a boolean flag indicating whether the column is nullable, controlling null-handling behavior in the cast.

**Benefits**: Prevents `null` → sentinel-value coercion globally.

**Tradeoffs**: Boolean strings ('true', 'false') must be explicitly parsed — no automatic `'0'`/`'1'` conversion.

### Threshold/Limit Pattern

**Purpose**: Pass business rules like max length, min value, or allowed units to the cast.

**Benefits**: Domain constraints are visible in the model's `$casts` definition.

**Tradeoffs**: Mixes business rules with persistence configuration; violates single responsibility if constraints are enforced in the cast.

---

## Architectural Decisions

- **When to use parameters**: The cast class has variations that depend on column-level configuration (precision, format, nullability).
- **When to avoid parameters**: The configuration is shared across all uses of the cast — use a config file or property on the cast class instead.
- **When to prefer separate cast classes**: The variations require different methods or significantly different behavior. Separate classes are clearer than conditional logic based on parameters.
- **When to parameterize via `Castable`**: The value object knows its own configuration — use `castUsing(array $arguments)` on the value object rather than inline parameters in `$casts`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single cast class handles multiple configurations | Parameters are positional, not named | Parameter order must be remembered or documented |
| Configuration visible in `$casts` definition | Parameters are always strings | Type coercion must be explicit; errors surface at runtime |
| Reduces cast class proliferation | Parameter parsing adds constructor complexity | Each new parameter increases cognitive load in the cast class |
| Supports both CastsAttributes and Castable | No validation of parameter count before resolution | Missing parameters cause constructor errors at runtime |

---

## Performance Considerations

- **No per-request overhead**: Parameters are parsed once per model class (during boot), not per attribute access.
- **Constructor argument validation**: Type coercion in the constructor runs once per cast instance. Expensive validation (e.g., hitting the database to validate a parameter) delays model hydration.
- **String parsing cost**: Splitting the `$casts` value by colon is negligible. However, if the parameter string is long (e.g., a serialized configuration), the cost is paid per cast class, not per access.
- **Opcode caching**: Parameters in the `$casts` array are literal strings in the model class. Opcache handles them efficiently.

---

## Production Considerations

- **Error messages**: A missing or invalid parameter causes a constructor error with a generic message. There is no Laravel-level validation that tells the developer which attribute has the misconfigured cast.
- **Documentation requirement**: Because parameters are positional strings, the cast class must document the meaning of each parameter position. Without documentation, future developers cannot determine what `DecimalCast::class.':10:4'` means.
- **Backward compatibility**: Adding new parameters to a cast constructor shifts the argument order. Existing `$casts` definitions break unless new parameters have defaults and are appended.
- **String encoding edge cases**: If a parameter value contains a colon (e.g., a URL or time format), it breaks the parsing. There is no escape mechanism.

---

## Common Mistakes

- **Forgetting to parse string to correct type**: Cast constructors receive strings, but the cast later treats them as integers. `'price' => DecimalCast::class.':2'` passes `'2'` as string, then `2 * 100` works in PHP (type juggling) but `strlen($precision)` returns `1` instead of `2`.
- **Assuming named parameter support**: Developers experienced with other languages expect `'param=value'` syntax and try `CastClass::class.':precision=10'`.
- **Over-parameterizing**: Adding too many positional parameters makes the `$casts` array unreadable. `'attr' => ComplexCast::class.':10:4:true:USD:en:left'` should be a dedicated class.
- **Mutating parameters in the cast**: Storing parameter-derived state as mutable instance properties causes cross-attribute contamination when the same cast class is reused.
- **Hardcoding defaults that conflict with parameters**: If the constructor has `$precision = 8` but the cast is called with `:2`, the default must be explicitly overridden.

---

## Failure Modes

- **Missing parameter causes instantiation error**: If the constructor requires a parameter that is not provided, `TypeError` or `ArgumentCountError` is thrown during model boot, causing a 500 error on every request.
- **Colon in parameter value breaks parsing**: A parameter like `'time' => TimeCast::class.':H:i:s'` is parsed as three parameters (`H`, `i`, `s`) instead of one (`H:i:s`).
- **Parameter count mismatch after refactor**: Adding a required constructor parameter to a cast class breaks every `$casts` entry that uses it.
- **Security edge case**: If a parameter is user-configurable (e.g., from a config file), a malformed string can crash the application during cast resolution.

---

## Ecosystem Usage

- **Laravel Framework**: The `encrypted` cast does not use parameters, but the `AsEnumObject` and `AsCollection` casts accept the underlying class as a parameter: `'status' => AsEnumObject::class.':'.App\Enums\Status::class`.
- **Spatie Laravel Enum**: The `Enums\Enum::class` cast pattern uses parameters to specify the enum class.
- **Community decimal casts**: Packages like `bavix/laravel-extra-casts` use parameters for decimal precision.
- **Laravel Money**: Some community money packages use parameters to specify currency: `'price' => MoneyCast::class.':USD'`.
- **Spatie Laravel Data**: The data transfer object casting uses class parameters to specify the DTO class.

---

## Related Knowledge Units

### Prerequisites
- casts-attributes-interface — the bidirectional custom casting contract
- castable-interface — self-defining casts on value objects

### Related Topics
- value-object-casting
- serializes-castable-attributes

### Advanced Follow-up Topics
- runtime-casting

---

## Research Notes

- The colon-delimited parameter syntax is parsed in `Illuminate\Database\Eloquent\Concerns\HasAttributes::getCastType()`.
- Laravel 11 introduced improvements to cast parameter caching, reducing repeated parsing of the same cast definitions.
- There is no first-party escape mechanism for colons in parameter values. Workarounds include base64-encoding parameters or using a custom delimiter in the cast constructor.
- The `castUsing()` method of `Castable` receives the parsed parameter array directly, allowing value objects to validate and interpret parameters in their own context.
- Cast parameters are a Laravel-specific convention and do not exist outside the Eloquent ecosystem — there is no SQL-level equivalent.
