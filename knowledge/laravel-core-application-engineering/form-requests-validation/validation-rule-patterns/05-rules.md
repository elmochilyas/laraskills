# Validation Rule Patterns — Engineering Rules

---

## Rule 1: Prefer Array Syntax for Validation Rules

---

## Category

Framework Usage

---

## Rule

Use array syntax for validation rules (`['required', 'email', 'max:255']`) instead of pipe-delimited strings. Reserve string syntax only for trivial, well-known rules with no Rule objects.

---

## Reason

Array syntax supports Rule objects (`Rule::unique()`, `Rule::exists()`), custom invokable rules, IDE autocompletion, and avoids pipe-splitting issues with regex patterns that contain pipe characters. String syntax cannot represent Rule objects and is error-prone with complex parameters.

---

## Bad Example

```php
'email' => 'required|email|unique:users,email|max:255|regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/'
// Unreadable, breaks if regex contains pipe
```

---

## Good Example

```php
'email' => ['required', 'email', 'max:255', Rule::unique('users'), 'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/']
// Autocompleted, readable, supports Rule objects
```

---

## Exceptions

For very simple rules like `'required|string|max:255'`, string syntax is acceptable when no Rule objects or regex patterns are involved.

---

## Consequences Of Violation

Maintenance risks: rules break when parameters contain pipe or comma characters. Framework compatibility: Rule objects silently fail in string syntax.

---

## Rule 2: Always Use Rule::unique()->ignore() on Update Requests

---

## Category

Framework Usage

---

## Rule

When validating unique fields on update requests, always call `->ignore($modelId)` on the `Rule::unique()` constraint. Otherwise the update always fails because the current record's own value matches.

---

## Reason

`Rule::unique('users')` checks that the value does not exist in the specified table. Without `ignore()`, updating a user's email to the same value (or not changing it at all) produces a false positive "email already taken" error.

---

## Bad Example

```php
public function rules(): array
{
    return [
        'email' => ['required', 'email', Rule::unique('users')],
        // Update always fails because user's own email is in the table
    ];
}
```

---

## Good Example

```php
public function rules(): array
{
    return [
        'email' => ['required', 'email', Rule::unique('users')->ignore($this->route('user'))],
        // Ignores the current user's email in the uniqueness check
    ];
}
```

---

## Exceptions

For create requests, `ignore()` is not needed — the record does not exist yet.

---

## Consequences Of Violation

Reliability risks: users cannot update their own email or profile without getting false unique errors. User experience: preventable validation failures.

---

## Rule 3: Use bail on Dependent Rules for Performance

---

## Category

Performance

---

## Rule

Place `bail` as the first rule on any attribute where subsequent rules depend on the preceding ones passing. This stops validating that attribute on the first failure.

---

## Reason

Without `bail`, all rules on an attribute execute even after the first one fails. For example, if `required` fails, checking `string`, `min:8`, and `confirmed` is wasteful and produces redundant error messages for the same underlying issue.

---

## Bad Example

```php
'password' => ['required', 'string', 'min:8', 'confirmed']
// All four rules run even if 'required' fails — wasteful
```

---

## Good Example

```php
'password' => ['bail', 'required', 'string', 'min:8', 'confirmed']
// Stops after the first failure — more efficient, cleaner errors
```

---

## Exceptions

When the application needs to collect ALL validation errors for an attribute (even when earlier ones fail), omit `bail`. This is rare and usually indicates over-validation.

---

## Consequences Of Violation

Performance risks: unnecessary rule execution on already-failed attributes. User experience: redundant error messages for the same issue.

---

## Rule 4: Use Array Syntax for Regex Rules to Prevent Comma-Splitting

---

## Category

Framework Usage

---

## Rule

Always use array syntax when a validation rule includes a regex pattern. String syntax causes the validator to split the regex on commas, breaking the pattern.

---

## Reason

The validation rule parser uses `str_getcsv()` to split string-syntax rules on commas. Regex patterns containing commas or pipes are incorrectly split at those characters, resulting in broken or silently failing validation.

---

## Bad Example

```php
'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'
// The comma-separated parser may split this incorrectly
```

---

## Good Example

```php
'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/']
// Array syntax preserves the full regex pattern
```

---

## Exceptions

Simple regex patterns without commas, pipes, or special delimiters (e.g., `regex:/^[a-z]+$/`) may work in string syntax, but array syntax is always safer.

---

## Consequences Of Violation

Reliability risks: regex rules silently fail or apply incorrect patterns. Security risks: intended validation constraints are not enforced.

---

## Rule 5: Use Rule::exists() for Foreign Key Validation

---

## Category

Framework Usage

---

## Rule

Use `Rule::exists('table', 'column')` to validate that a value exists in a database table. Do not use manual DB queries or Closure-based checks for foreign key existence.

---

## Reason

`Rule::exists()` builds a lazy database query that only executes during validation. It is optimized, parameterized against SQL injection, and integrates cleanly with the validation pipeline. Manual queries add boilerplate and are easy to get wrong.

---

## Bad Example

```php
'role_id' => [
    'required',
    'integer',
    function (string $attribute, mixed $value, Closure $fail) {
        if (! DB::table('roles')->where('id', $value)->exists()) {
            $fail('The selected role does not exist.');
        }
    },
]
```

---

## Good Example

```php
'role_id' => ['required', 'integer', Rule::exists('roles', 'id')]
```

---

## Exceptions

When the existence check requires complex additional conditions (multiple WHERE clauses beyond simple column matching), use `Rule::exists()->where()` or a custom rule.

---

## Consequences Of Violation

Maintenance risks: duplicate existence-checking logic across requests. Performance risks: queries not lazily constructed. Security risks: potential SQL injection if queries are not parameterized.

---

## Rule 6: Add bail or stopOnFirstFailure Strategically

---

## Category

Performance

---

## Rule

Use `bail` per-attribute for dependent rules. Use `$request->stopOnFirstFailure(true)` per-request when the first validation error should abort all validation immediately.

---

## Reason

`bail` stops validation of additional rules on a single attribute after the first failure. `stopOnFirstFailure` stops validation of ALL attributes after the first failure anywhere. Choosing the right mechanism prevents wasted computation and provides appropriate user feedback.

---

## Bad Example

```php
// stopOnFirstFailure when only one attribute has dependent rules
protected function stopOnFirstFailure(): bool
{
    return true; // Stops ALL validation after first error — hides other issues
}
```

---

## Good Example

```php
// bail on the specific attribute with dependent rules
'password' => ['bail', 'required', 'string', 'min:8', 'confirmed']

// stopOnFirstFailure for the whole request only when appropriate
protected function stopOnFirstFailure(): bool
{
    return false; // Let users see all validation errors
}
```

---

## Exceptions

Use `stopOnFirstFailure` for multi-step wizards or progressive forms where showing one error at a time is intentional UX.

---

## Consequences Of Violation

User experience risks: users must fix one error, resubmit, then see the next error. Performance risks: unnecessary validation of unrelated fields after a failure.
