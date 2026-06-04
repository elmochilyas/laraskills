# Validation Rule Patterns — Anti-Patterns

## Anti-Pattern 1: Pipe-Delimited Rules With No Space Around |

**Symptom:** Rules written as `'required|string|max:255'` — pipe-delimited, compact, no whitespace.

**Problem:** Pipe-delimited rules cannot accept certain rule objects with string interpolation, cannot be type-hinted, and obscure the number of validation rules being applied. IDE tooling cannot autocomplete or verify individual rules within the string.

```php
// BAD — opaque string, no tooling support
'email' => 'required|string|email|max:255|unique:users,email'
```

**Solution:** Use array syntax for all rules. Arrays are IDE-friendly, composable, and accept rule objects.

```php
// GOOD — composable arrays
'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')]
```

**Detection:** Search for pipe (`|`) characters within validation rule strings. Flag for conversion to array syntax.

---

## Anti-Pattern 2: Rule Objects With Unnecessary string Wrapping

**Symptom:** Passing a rule object like `new RequiredIf(...)` but wrapping it as `'required_if:...'` in string format.

**Problem:** Mixing string rules and objects inconsistently makes the rule list harder to read and maintain. If one rule must be an object (e.g., `Rule::unique()`), all rules in that field should use array syntax for consistency.

```php
// BAD — mixed string and object
'email' => 'required|string|email|max:255|' . Rule::unique('users')->ignore($this->user)
```

**Solution:** Use full array syntax with all rules as array elements.

```php
// GOOD — consistent array syntax
'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user)]
```

**Detection:** Search for string concatenation (`.` operator) inside `rules()` methods combining strings with rule objects.

---

## Anti-Pattern 3: Overusing exists:table Rule

**Symptom:** Using `exists:users,id` to verify foreign keys exist, even when the same validation run also validates the related model via a custom rule.

**Problem:** The `exists` rule queries the database for every request. If a custom rule already verifies the entity's validity (including existence), the `exists` rule is a redundant query added solely for database integrity.

```php
// BAD — redundant existence check
'user_id' => 'required|integer|exists:users,id' // Query 1
```

**Solution:** Remove redundant `exists` rules when existence is guaranteed by other means (authorization, route binding, custom rules). Keep `exists` only for foreign keys that cannot be validated through other rules.

```php
// GOOD — let authorization or route binding handle it
// Route already resolved $user via binding; no need for exists check
'user_id' => ['required', 'integer']
```

**Detection:** Search for `exists:` in FormRequest rules. Verify each is necessary — not duplicating route binding or authorization.

---

## Anti-Pattern 4: Inline Anonymous Functions for Simple Rule Logic

**Symptom:** Using `function ($attribute, $value, $fail) { ... }` closures directly in the rules array for logic that could be a declarative rule.

**Problem:** Inline closures in the rules array cannot be reused, tested independently, or named meaningfully. They clutter the rules array with implementation logic instead of declarations.

```php
// BAD — inline closure, untestable, unreusable
public function rules(): array
{
    return [
        'sku' => ['required', function ($attribute, $value, $fail) {
            if (! preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
                $fail('Invalid SKU format.');
            }
        }],
    ];
}
```

**Solution:** Extract closure logic into a named custom rule class implementing `ValidationRule`.

```php
// GOOD — named, reusable, testable
public function rules(): array
{
    return [
        'sku' => ['required', new ValidSkuFormat()],
    ];
}
```

**Detection:** Search for `function ($attribute, $value, $fail)` or `function ($attribute, $value, Closure $fail)` inside `rules()` methods.

---

## Anti-Pattern 5: Complex Nested Array Validation in a Single Flat Rule Set

**Symptom:** Validating deeply nested arrays (e.g., `items.*.variants.*.prices.*.amount`) all in a single FormRequest's `rules()` method.

**Problem:** Deeply nested array rules create long, repetitive, hard-to-read constraints. When a nested structure has 4+ levels, the rule definitions explode in complexity.

```php
// BAD — deeply nested, hard to maintain
public function rules(): array
{
    return [
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|integer|exists:products,id',
        'items.*.quantity' => 'required|integer|min:1|max:999',
        'items.*.variants' => 'array',
        'items.*.variants.*.id' => 'required|integer|exists:variants,id',
        'items.*.variants.*.prices' => 'required|array',
        'items.*.variants.*.prices.*.currency' => 'required|string|size:3',
        'items.*.variants.*.prices.*.amount' => 'required|numeric|min:0',
    ];
}
```

**Solution:** Extract nested validation into a dedicated FormRequest or a custom rule class that handles the nested structure.

```php
// GOOD — delegate nested validation
public function rules(): array
{
    return [
        'items' => ['required', 'array', 'min:1'],
        'items.*' => [new ValidOrderItem()],
    ];
}
```

**Detection:** Search for validation rules with 3+ levels of array nesting (`*.*.*.`). Flag for decomposition.

---

## Anti-Pattern 6: Required Fields Without Bounds

**Symptom:** Declaring `required` without any `string`, `integer`, `array`, or format constraint.

**Problem:** A field that is `required` alone accepts any value — an empty string, a boolean, a number, a null-like value. Without type bounds, valid data can be surprising (e.g., no `min` on a required number field means `-999999999` is valid).

```php
// BAD — required with no type constraint
'age' => ['required'] // Accepts "abc", true, [], 0, -1
```

**Solution:** Always pair `required` with type and boundary constraints.

```php
// GOOD — bounded
'age' => ['required', 'integer', 'min:0', 'max:150']
```

**Detection:** Search for `['required']` or `'required'` used alone without type/size/bound constraints in the same field's rule list.

---

## Anti-Pattern 7: Not Using Bail in Rule Chains

**Symptom:** Rules that proceed to check formatting, size, or uniqueness even when the first rule fails (e.g., trying to `unique` on an empty string).

**Problem:** Without `bail`, Laravel runs every rule in the chain regardless of prior failures. A field that fails `required` still runs `email`, `max:255`, and `unique:users`, each producing its own useless error message.

```php
// BAD — runs all rules even if first fails
'email' => ['required', 'email', 'max:255', Rule::unique('users')]
// Missing required? Still gets: email invalid, too long, already taken errors
```

**Solution:** Use `bail` as the first rule to stop on first failure.

```php
// GOOD — stops on first failure
'email' => ['bail', 'required', 'email', 'max:255', Rule::unique('users')]
```

**Detection:** Search for array rules without `bail` at the start. Flag fields with 3+ rules where the first failure makes subsequent checks irrelevant.
