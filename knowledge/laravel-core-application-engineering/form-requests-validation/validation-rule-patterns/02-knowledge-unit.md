# Validation Rule Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Validation Rule Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Validation rules in Laravel support two syntaxes — pipe-delimited strings and PHP arrays — each with distinct parsing characteristics. Rule objects like `Rule::unique()` and `Rule::exists()` wrap database queries inside validation, while `bail` and `stopOnFirstFailure` control when validation stops. Understanding how the `ValidationRuleParser` transforms human-readable rules into validation constraints is essential for writing correct and performant validators.

---

## Core Concepts

### String vs Array Syntax

String syntax uses pipe-delimited rules passed as a single string:

```php
'email' => 'required|email|max:255|unique:users,email'
```

Array syntax uses an array of rules:

```php
'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')]
```

These are NOT equivalent in all cases. String rules go through string parsing (`explode('|', $rule)`) while array rules skip string parsing entirely. Rule objects CANNOT be represented in string syntax — they require arrays.

### ValidationRuleParser

The `ValidationRuleParser` is responsible for converting human-readable rules into the internal representation used by `Validator`. The parser is instantiated with the validation data (used for wildcard expansion) and exposes two critical methods:

- `explode()` — expands human-friendly rules into a full rules array for the validator
- `parse()` — extracts rule name and parameters from a single rule definition

### Stop Conditions

Two mechanisms control whether validation halts after the first failure:

- `bail` rule — per-attribute: stops validating that attribute on first failure
- `stopOnFirstFailure` — per-request: stops validating ALL attributes on first failure

---

## Mental Models

### The Parser Pipeline

Rules flow through a pipeline: string → `ValidationRuleParser::explode()` → `Validator::passes()` → `validateAttribute()` → `ValidationRuleParser::parse()` → validation method. Each step transforms the representation one level deeper.

### The Rule Object

Rule objects (like `Rule::unique()`) are fully-formed validation instructions that bypass string parsing entirely. They are compiled once at construction time and passed directly to the validator's rule method.

---

## Internal Mechanics

### Rule Parsing: String vs Array

`ValidationRuleParser::explodeExplicitRule()` handles both syntaxes:

```php
protected function explodeExplicitRule($rule, $attribute)
{
    if (is_string($rule)) {
        return explode('|', $rule);
    }

    if (is_object($rule)) {
        if ($rule instanceof Date || $rule instanceof Numeric) {
            return explode('|', (string) $rule);
        }
        return Arr::wrap($this->prepareRule($rule, $attribute));
    }

    // Array of mixed types
    $rules = [];
    foreach ($rule as $value) {
        if ($value instanceof Date || $value instanceof Numeric) {
            $rules = array_merge($rules, explode('|', (string) $value));
        } else {
            $rules[] = $this->prepareRule($value, $attribute);
        }
    }
    return $rules;
}
```

Key detail: `Date` and `Numeric` rule objects are cast to strings and re-split on `|` — they support verbose string format like `'2024-01-01'` and `0.01` but are NOT actual rule validation objects.

### Per-Rule Parameter Parsing

`ValidationRuleParser::parseStringRule()` extracts parameters:

```php
protected static function parseStringRule($rule)
{
    $parameters = [];
    if (str_contains($rule, ':')) {
        [$rule, $parameter] = explode(':', $rule, 2);
        $parameters = static::parseParameters($rule, $parameter);
    }
    return [Str::studly(trim($rule)), $parameters];
}
```

`parseParameters()` uses `str_getcsv($parameter, escape: '\\')` for comma-separated values — except for `regex` and `not_regex` rules where the full parameter is preserved as-is to avoid splitting the regex pattern on commas.

### Normalize Short Types

The parser normalizes short type names:

```php
protected static function normalizeRule($rule)
{
    return match ($rule) {
        'Int' => 'Integer',
        'Bool' => 'Boolean',
        default => $rule,
    };
}
```

This means `'int'` in string syntax becomes the `validateInteger()` method.

### Rule::unique() Database Queries

`Rule::unique()` creates a `Unique` rule object that runs a database EXISTS query during validation:

```php
Rule::unique('users', 'email')
    ->ignore($userId)
    ->where('account_type', 'premium')
```

The query is built lazily — database connection is not used until validation time. The `ignore()` method excludes a specific record by primary key. Without `ignore()`, a unique rule will always fail on updates where the field value hasn't changed.

### Wildcard Rule Expansion

For array data like `$request->items.*.name`, the parser generates explicit rules for each array element:

```php
protected function explodeWildcardRules($results, $attribute, $rules)
{
    $pattern = str_replace('\*', '[^\.]*', preg_quote($attribute, '/'));
    $data = ValidationData::initializeAndGatherData($attribute, $this->data);

    foreach ($data as $key => $value) {
        if (Str::startsWith($key, $attribute) || preg_match('/^'.$pattern.'\z/', $key)) {
            foreach ((array) $rules as $rule) {
                // Assign rule to the specific array key
            }
        }
    }
}
```

This means `$request->all()` is read at parse time to determine array dimensions. If the array is empty, no wildcard rules will apply.

---

## Patterns

### Array Syntax as Default

Prefer array syntax for all but the simplest rules:

```php
'email' => ['required', 'email', 'max:255', Rule::unique('users')]
```

Array syntax avoids pipe-escape confusion, supports rule objects directly, and enables IDE autocompletion for rule names.

### bail Placement

Place `bail` as the first rule in an array to stop validating that attribute on first failure:

```php
'email' => ['bail', 'required', 'email', 'max:255', Rule::unique('users')]
```

Without `bail`, all rules for an attribute run even after a failure — collecting all error messages. `bail` stops after the first failure for that attribute only.

### Unique Ignore on Updates

Always use `ignore()` on unique rules for update operations:

```php
public function rules(): array
{
    return [
        'email' => [
            'required',
            'email',
            Rule::unique('users', 'email')->ignore($this->route('user')),
        ],
    ];
}
```

Without `ignore()`, the update will fail because the user's own record matches the unique check.

### Conditional Unique Rules

Combine unique with a where clause for scoped uniqueness:

```php
Rule::unique('subscriptions')
    ->where('team_id', $this->user()->currentTeam->id)
```

This enforces uniqueness within a scope (e.g., one subscription per team) rather than globally across the entire table.

---

## Architectural Decisions

### String vs Array Performance

String rules incur parsing overhead per-rule per-request via `explode('|', $rule)` and subsequent `parseStringRule()` calls. For high-traffic endpoints with 10+ rules, array syntax avoids this parsing entirely. In practice, the difference is negligible — rule parsing is microseconds — but the principle favors arrays for consistency with rule object support.

### Rule Ordering Convention

Standard rule ordering convention:

1. Presence: `required`, `nullable`, `present`
2. Type: `string`, `integer`, `boolean`, `array`, `numeric`
3. Format: `email`, `url`, `date`, `alpha`
4. Size: `max:255`, `min:8`, `between:5,10`
5. Business: `Rule::unique()`, `Rule::exists()`, custom rules

This ordering ensures type/size validation runs before expensive database checks.

---

## Tradeoffs

### String vs Array Syntax Interchangeability

String syntax (`'required|email|max:255'`) is concise and familiar from older Laravel versions and most online examples. Array syntax (`['required', 'email', 'max:255']`) is more verbose but supports rule objects that cannot be expressed as strings. The tradeoff is not just syntactic — string rules go through `explode('|', $rule)` parsing and `parseStringRule()` parameter extraction, while array rules bypass string parsing entirely. For a team standard, prefer array syntax as the default and allow string syntax only for trivial single-rule definitions.

### bail vs stopOnFirstFailure Granularity

`bail` operates at the attribute level — it stops validating a single attribute after its first failure but continues validating other attributes. `stopOnFirstFailure` operates at the request level — it stops validating everything after the first attribute failure. The tradeoff is error feedback granularity vs performance. `stopOnFirstFailure` provides faster rejection (no need to validate remaining attributes) at the cost of showing only one error at a time, which can frustrate API consumers.

---

## Performance Considerations

### String Parsing Overhead

The `ValidationRuleParser::parse()` method splits string rules on `|`, then splits parameters on `:`, then applies `str_getcsv()` for comma-separated values. For high-traffic endpoints with 20+ string rules, this parsing happens on every request. Array syntax eliminates the split operations entirely, reducing per-request overhead. In practice, the difference is microseconds per rule, but the principle of avoiding unnecessary work applies.

### Wildcard Rule Expansion Cost

Wildcard rules (`items.*.sku`) trigger `ValidationData::initializeAndGatherData()` which hydrates the full array structure into flat dotted keys. For arrays with hundreds or thousands of items (e.g., batch import endpoints), this expansion consumes memory proportional to the array size. Consider validating batch data outside the HTTP request lifecycle or using manual validation with explicit field mapping.

---

## Production Considerations

### Rule::unique() Database Load

Every `Rule::unique()` executes a database query during validation. In production, 100 concurrent requests each validating a unique email generates 100 database queries. For high-traffic registration endpoints, consider deferring the unique check to a database-level unique constraint and serving the validation error from a post-save check rather than pre-save validation.

### Wildcard Rule Validation for Empty Arrays

Wildcard rules on empty arrays silently pass — there is no data to expand against, so no validation runs. In production, this can allow submissions with empty arrays when the business logic requires at least one item. Always add a separate `min:1` rule on the parent array field when using wildcard rules on required arrays.

---

## Common Mistakes

### Pipe-Delimited Strings with Commas

```php
// WRONG — comma attempts to split parameters
'email' => 'unique:users,email_address,ignore:1,id'

// CORRECT — comma after ignore value
'email' => "unique:users,email_address,ignore:1,id"
```

The parser uses `str_getcsv()` which splits on commas. Values containing commas must use array syntax.

### regex Rule with Pipe

```php
// WRONG — pipe inside regex is parsed as rule delimiter
'name' => "required|regex:/^[a-z|0-9]+$/"

// CORRECT — array syntax
'name' => ['required', 'regex:/^[a-z|0-9]+$/']
```

The `|` inside the regex pattern is indistinguishable from a rule separator in string syntax.

### Missing ignore() Causes False Duplicate Errors

```php
// WRONG — update always fails
Rule::unique('users', 'email')

// CORRECT — ignores current record
Rule::unique('users', 'email')->ignore($user->id)
```

This is the most common unique-rule bug. The rule queries the database for the email value, finds the current record, and reports a duplicate.

---

## Failure Modes

### Empty Array + Wildcard Rules

If `$request->items` is an empty array, wildcard rules `*.name` have no data to expand against. The rule never executes — validation passes regardless of the wildcard rule definition. This can lead to unexpected passes when the consumer expects at least one item.

### Parameter Count Mismatch

Rules like `between` require exact parameter counts. `'between:5,10'` is valid (two params). `'between:5'` crashes silently (the method receives only one parameter).

---

## Ecosystem Usage

### Laravel Nova

Nova uses `Rule::unique()` with scope constraints extensively to enforce uniqueness within resource-specific contexts. Nova's `Lens` filters use `Rule::exists()` to validate that referenced lens IDs exist in the database. Nova also uses wildcard validation rules for its repeatable field groups, where `fields.*.value` patterns validate each field in a dynamic form group.

### Laravel Spark

Spark's billing validation uses `Rule::in()` with allowed plan intervals and `Rule::unique()` for subscription IDs. The `Rule::exists()` pattern is used to validate that coupon codes and tax rate IDs reference valid records in the billing provider's database. Spark's team size validation uses the `between` rule to enforce minimum and maximum team member counts.

### Laravel Fortify

Fortify uses `Rule::username()` (Laravel 11+) for username format validation, and `Rule::unique()` for email and username uniqueness checks in its authentication flows. Fortify also demonstrates the `bail` pattern, placing `bail` as the first rule in authentication requests to prevent validating email format after the required check fails.

---

## Related Knowledge Units

- **Form Request Fundamentals** (this subdomain) — the validation pipeline rules run within
- **Custom Validation Rules** (this subdomain) — creating custom rule objects
- **Conditional Validation** (this subdomain) — rules that depend on other field values

---

## Research Notes

### Regex Rule Parsing Special Case

The `parseStringRule()` method has a special case for `regex` and `not_regex` rules — the full parameter after `:` is preserved as-is without `str_getcsv()` splitting. This is because regex patterns often contain commas that would be incorrectly parsed as parameter delimiters. This special case is a workaround for the fundamental limitation of string-based rule representation.

### Future Direction — Type-Safe Rule Objects

Future Laravel versions could introduce type-safe rule builders that replace string-based rule definitions entirely. A fluent API like `Rule::string()->email()->max(255)->unique('users')` would provide IDE autocompletion, static analysis, and eliminate the parsing ambiguity of string syntax. This would make array syntax the minimum standard and string syntax a legacy format.

### Framework Source Reference
- `Illuminate\Validation\ValidationRuleParser` — rule parsing pipeline
- `Illuminate\Validation\Rules\Unique` — unique rule implementation
- `Illuminate\Validation\Rules\Exists` — exists rule implementation
- `Illuminate\Validation\Validator::validateAttribute()` — per-attribute loop
