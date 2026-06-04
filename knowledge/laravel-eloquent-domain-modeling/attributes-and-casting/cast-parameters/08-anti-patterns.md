# Cast Parameters — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Cast Parameters |
| Focus | Anti-patterns in parameterized custom cast classes |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Cast Class Without Parameter Validation | Reliability | High |
| 2 | All Parameters Required, No Defaults | Design | Medium |
| 3 | Undocumented Parameter Formats | Maintainability | Medium |
| 4 | Class Explosion from Refusing Parameters | Design | Medium |
| 5 | One Cast to Rule All Logic | Design | High |
| 6 | Custom Non-Standard Parameter Passing | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- Parameterized casts are the most common source of "stringly-typed" configuration in Laravel applications, where parameter meaning is hidden in opaque colon-delimited strings
- Teams often oscillate between two extremes: creating too many near-identical cast classes or creating one cast with complex conditional logic
- Parameter validation is frequently deferred or skipped entirely, turning configuration typos into silent data corruption

---

## 1. Cast Class Without Parameter Validation

### Category
Reliability

### Description
A custom cast class that accepts parameters via colon-delimited syntax but does not validate them in the constructor. Invalid parameters (negative decimal places, unknown currency codes, malformed format strings) are accepted silently and cause errors or data corruption only when the cast is used.

### Why It Happens
Developers focus on the cast's `get()` and `set()` logic and forget to validate configuration. Parameter validation seems like boilerplate, especially when the cast works with the default parameter values.

### Warning Signs
- Constructor assigns parameters to properties with no type validation or range checking
- Cast produces wrong results only when unusual parameter values are used
- Runtime errors during `get()` or `set()` that should have been caught at construction
- No `InvalidArgumentException` thrown anywhere in the cast class

### Why Harmful
- Silent data corruption: a `DecimalCast:10` (10 decimal places) may truncate data differently than intended, and the error is only visible when inspecting stored values
- Debugging difficulty: the root cause (invalid parameter) is far from the symptom (wrong data)
- Misconfiguration propagates: if a cast is used in production with invalid parameters, it may corrupt existing data before detection
- No early warning: parameters are specified as opaque strings in `$casts` with zero validation feedback

### Consequences
- Data silently stored with wrong precision, format, or type
- Hours of debugging to trace wrong values back to the cast parameter
- No feedback when a developer typoes a parameter (e.g., `DecimialCast:4` resolves to a different cast class)
- Cast may throw confusing errors deep in `get()` or `set()` rather than failing at initialization

### Preferred Alternative
```php
public function __construct(
    private readonly int $decimals = 2,
) {
    if ($decimals < 0 || $decimals > 10) {
        throw new \InvalidArgumentException(
            "Decimal places must be 0-10, got: {$decimals}"
        );
    }
}
```

### Refactoring Strategy
1. Identify all custom cast classes that accept parameters
2. Add constructor validation for each parameter
3. Throw `InvalidArgumentException` with descriptive messages
4. Add unit tests that verify invalid parameters throw correctly

### Detection Checklist
- [ ] Search for custom casts implementing `CastsAttributes` or `CastsInboundAttributes`
- [ ] Check constructor for parameter validation logic
- [ ] Verify validation covers all parameter edge cases (negative, zero, max, invalid strings)
- [ ] Test with invalid parameter values and confirm exceptions

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Validate Cast Parameters in the Constructor |
| Decision Tree | `07-decision-trees.md` — Decision 3: Eager Validation vs Deferred |
| Skill | `06-skills.md` — Step 3: Validate parameters in constructor |

---

## 2. All Parameters Required, No Defaults

### Category
Design

### Description
A parameterized cast class that makes all constructor parameters required, forcing every attribute registration to specify all parameters explicitly even when a sensible default exists for most use cases.

### Why It Happens
Developers don't anticipate the most common use case or consider backward compatibility. Each parameter seems equally important from the cast's perspective, so none are given defaults.

### Warning Signs
- Constructor parameters have no `= value` defaults in the signature
- Every `$casts` entry using the cast includes the colon-delimited parameters
- No distinction between required and optional configuration values
- Adding a new parameter requires updating every model that uses the cast

### Why Harmful
- Unnecessary verbosity in `$casts` definitions — the most common configuration is repeated everywhere
- Brittle to parameter addition — adding a new parameter requires updating all usages
- Developers must understand the parameter format even when using the default behavior
- Higher barrier to adoption — every usage requires looking up the parameter format

### Consequences
- Bloated `$casts` arrays with redundant parameter specifications
- Breaking changes when a new parameter is added at the end of the list
- Higher cognitive load for developers using the cast
- More code churn when parameter lists change

### Preferred Alternative
```php
public function __construct(
    private readonly int $decimals = 2,
    private readonly string $locale = 'en_US',
) {}
```

### Refactoring Strategy
1. Review each parameter and identify the most common value
2. Assign that value as the default in the constructor signature
3. Update documentation to reflect the new defaults
4. Remove redundant parameter specifications from `$casts` entries

### Detection Checklist
- [ ] Check constructor signatures for parameters without defaults
- [ ] Review `$casts` entries — are most specifying the same parameter values?
- [ ] Count unique parameter combinations vs total usages
- [ ] Assess if a sensible default exists for each parameter

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Provide Defaults for Optional Cast Parameters |
| Skill | `06-skills.md` — Step 2: Accept parameters in constructor with defaults |
| Knowledge | `04-standardized-knowledge.md` — Default values for optional parameters |

---

## 3. Undocumented Parameter Formats

### Category
Maintainability

### Description
A custom cast class that accepts colon-delimited parameters without documenting what the parameters mean, their order, types, valid values, or defaults. Developers must read the cast class source code to understand the parameter format.

### Why It Happens
The cast class seems self-documenting to the author who wrote it. Parameter meaning is obvious during development but opaque months later. Teams don't enforce docblock standards for cast classes.

### Warning Signs
- `$casts` entries like `DecimalCast::class . ':4,de_DE'` with no documentation of what parameters mean
- Developers frequently asking what parameters a cast accepts
- Multiple `$casts` entries using parameters incorrectly because the format is unknown
- No docblock on the cast class explaining parameter format

### Why Harmful
- Every attribute registration becomes a context-switch to read the cast class source
- Incorrect parameter usage proliferates — developers guess the parameter meaning
- Onboarding new developers is slower — they must reverse-engineer each custom cast
- Parameter order changes become dangerous because no one knows the current format
- Comma-separated parameters in a string are inherently fragile and undocumented — a typo in either the parameter value or its position is invisible

### Consequences
- Time wasted reading cast class internals to determine parameter format
- Incorrect cast usage causing subtle data issues
- Inconsistent parameter values across models using the same cast
- Harder to audit the codebase for correct cast configuration

### Preferred Alternative
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
 *   DecimalCast          → defaults (2, en_US)
 */
class DecimalCast implements CastsAttributes
```

### Refactoring Strategy
1. For each parameterized cast, add a class-level docblock documenting parameter format
2. Document parameter order, types, valid values, and defaults
3. Include usage examples in the docblock
4. Review existing `$casts` entries for correctness against the documentation

### Detection Checklist
- [ ] Search for custom cast classes — do they have class-level docblocks?
- [ ] Check docblock for parameter format documentation
- [ ] Review `$casts` entries — can a developer understand the parameters without reading source?
- [ ] Verify examples match actual parameter parsing logic

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document Valid Parameter Values |
| Skill | `06-skills.md` — Step 4: Document valid parameter values |

---

## 4. Class Explosion from Refusing Parameters

### Category
Design

### Description
Creating many separate custom cast classes that differ only in configuration values (e.g., `UsdMoneyCast`, `EurMoneyCast`, `GbpMoneyCast`) instead of creating a single parameterized cast class that accepts the currency as a colon-delimited parameter.

### Why It Happens
Developers are unfamiliar with the colon-delimited parameter syntax. Each variation seems like a distinct concern. Copy-pasting a cast class and changing a few values is faster than designing a parameterized solution.

### Warning Signs
- Multiple cast classes with nearly identical `get()` and `set()` implementations
- Class names that differ only by a configuration value (`UsdCast`, `EurCast`)
- Adding a new variation requires creating a new class file
- Parameterized casts exist in the framework but aren't used by the team

### Why Harmful
- Code duplication: identical get/set logic repeated across multiple cast classes
- Class explosion: a new variation means a new file, namespace entry, and tests
- Maintenance burden: fixing a bug in the shared logic requires updating N classes
- Testing overhead: each variation needs its own test suite
- Missed abstraction: the configuration value is hardcoded instead of being a parameter

### Consequences
- Many small cast classes with duplicated logic
- Higher maintenance burden for what should be a single configurable class
- More files to navigate, slowing development
- Inconsistent behavior if variations drift during maintenance
- Testing effort multiplied by the number of variations

### Preferred Alternative
```php
class MoneyCast implements CastsAttributes
{
    public function __construct(
        private readonly string $currency = 'USD',
    ) {}
    // Shared get/set logic uses $this->currency
}

// Registration
protected $casts = [
    'usd_price' => MoneyCast::class,           // defaults to USD
    'eur_price' => MoneyCast::class . ':EUR',
    'gbp_price' => MoneyCast::class . ':GBP',
];
```

### Refactoring Strategy
1. Identify groups of cast classes with identical or nearly identical logic
2. Extract shared logic into a single parameterized cast class
3. Add a constructor parameter for the configuration value
4. Update all `$casts` arrays to use the new class with appropriate parameters
5. Delete the now-redundant separate cast classes

### Detection Checklist
- [ ] Search for cast classes whose names suggest configuration (`Usd`, `Eur`, `De`, `En`)
- [ ] Compare `get()`/`set()` implementations across similar cast classes
- [ ] Count cast classes vs unique logic — is there a class per configuration value?
- [ ] Assess whether a parameterized cast would reduce duplication without adding complexity

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Decision 1: Parameterized Cast vs Separate Classes |
| Rule | `05-rules.md` — Use Colon-Delimited Syntax Consistently |
| Knowledge | `04-standardized-knowledge.md` — Reusable cast class with per-attribute configuration |

---

## 5. One Cast to Rule All Logic

### Category
Design

### Description
A single parameterized cast class that uses complex conditional branching based on parameter values to handle fundamentally different transformation logic. The cast violates the Single Responsibility Principle by becoming a kitchen sink of data transformations.

### Why It Happens
The same developer who would create 20 separate casts for minor configuration differences may overcorrect in the opposite direction. Instead of creating separate classes for different transformation types, they add parameters that branch into entirely different code paths.

### Warning Signs
- Cast class with `if`/`switch` statements checking parameter values to determine core logic
- Cast class longer than 150 lines with multiple unrelated transformation paths
- Parameter combinations that produce fundamentally different output types
- Cast class docstring that describes multiple unrelated behaviors
- Adding a new "mode" requires adding a new parameter value and new conditional branches

### Why Harmful
- Violates Single Responsibility Principle — the cast handles multiple unrelated transformation types
- Combinatorial complexity: parameter interactions create an exponential number of code paths to test
- Harder to reason about: developers must trace parameter values through conditionals to understand behavior
- Testing becomes expensive — each parameter combination represents a distinct behavior to verify
- Adding new transformation logic risks breaking existing configurations

### Consequences
- Bloated, hard-to-maintain cast class
- Brittle code where changing one branch accidentally affects another
- Exhaustive testing is impractical due to parameter combination explosion
- Onboarding difficulty: new developers must understand multiple transformation domains in one class
- Higher risk of introducing bugs when modifying the cast

### Preferred Alternative
```php
// Separate cast classes for fundamentally different logic
class MoneyCast implements CastsAttributes
{
    public function __construct(private readonly string $currency = 'USD') {}
    // Money-specific transformation
}

class PercentageCast implements CastsAttributes
{
    public function __construct(private readonly int $precision = 2) {}
    // Percentage-specific transformation
}

class DecimalCast implements CastsAttributes
{
    public function __construct(private readonly int $decimals = 2) {}
    // Decimal-specific transformation
}
```

### Refactoring Strategy
1. Identify distinct transformation behaviors within the overgrown cast class
2. Extract each distinct behavior into its own cast class
3. Add parameterization only for configuration within a single transformation type
4. Update all `$casts` array entries to use the appropriate new cast class
5. Delete the original overgrown cast class

### Detection Checklist
- [ ] Count conditional branches in cast class — are they selecting transformation type or configuring a single transformation?
- [ ] Review output types — does the cast return fundamentally different types based on parameters?
- [ ] Check test file size — is the cast's test suite disproportionately large?
- [ ] Assess if all parameter combinations represent variations of the same transformation or different transformations

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Reusable cast class with per-attribute configuration |
| Decision Tree | `07-decision-trees.md` — Decision 1: Parameterized Cast vs Separate Classes |
| Rule | `05-rules.md` — Accept cast parameters as array (single responsibility in parsing) |

---

## 6. Custom Non-Standard Parameter Passing

### Category
Maintainability

### Description
Using alternative mechanisms to pass configuration to custom cast classes instead of the standard colon-delimited syntax. Examples include array-based registration in `$casts`, environment variable lookups inside the cast class, or static property configuration.

### Why It Happens
Developers find the colon-delimited syntax limited for complex configuration. Arrays feel more natural in PHP. Environment variables seem flexible for per-environment configuration.

### Warning Signs
- `$casts` array entries with associative array values instead of strings
- Cast class calling `env()`, `config()`, or `$_ENV` during construction or `get()`
- Static properties on cast classes set elsewhere in the application bootstrap
- Custom parsing logic that doesn't use Laravel's built-in parameter handling

### Why Harmful
- Non-standard patterns confuse developers familiar with Laravel conventions
- Environment-dependent cast behavior is invisible in the `$casts` declaration
- Static configuration couples the cast to global state, making testing harder
- Custom array formats lack the conciseness and discoverability of colon-delimited strings
- Tooling (static analysis, code generators) expects the standard syntax

### Consequences
- Developer confusion during code reviews — unfamiliar parameter patterns
- Hidden configuration dependencies (env vars, global state) that are not obvious from model code
- Breaking changes when the custom mechanism is refactored to standard syntax
- Inconsistent parameter handling across the codebase

### Preferred Alternative
```php
// Standard colon-delimited syntax
protected $casts = [
    'price' => DecimalCast::class . ':4,de_DE',
];

// For complex configuration, use casts() method
protected function casts(): array
{
    return [
        'price' => new DecimalCast(decimals: 4, locale: 'de_DE'),
    ];
}
```

### Refactoring Strategy
1. Identify non-standard parameter-passing mechanisms in cast classes
2. Convert simple configurations to colon-delimited syntax
3. Use the `casts()` method returning instances for complex configurations
4. Remove environment variable dependencies from cast classes
5. Update documentation and tests

### Detection Checklist
- [ ] Search for `env(`, `config(`, `$_ENV` in cast class files
- [ ] Check `$casts` arrays for non-string values (arrays, objects)
- [ ] Search for static properties on cast classes that are set externally
- [ ] Verify all cast registrations use standard syntax or `casts()` method

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Colon-Delimited Syntax Consistently |
| Decision Tree | `07-decision-trees.md` — Decision 2: Colon-Delimited vs Alternative |
| Knowledge | `04-standardized-knowledge.md` — Colon-delimited parameter syntax |
