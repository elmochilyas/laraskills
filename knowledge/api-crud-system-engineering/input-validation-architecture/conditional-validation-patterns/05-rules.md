# Conditional Validation Patterns — Rules

## Use Rule::when() for Simple Binary Conditions
---
## Category
Code Organization | Maintainability
---
## Rule
Use `Rule::when()` for simple binary conditional rule sets inside `rules()`; reserve `withValidator()` for complex multi-field logic.
---
## Reason
`Rule::when()` keeps the condition alongside its rules in `rules()`, making the validation contract readable in one place. `withValidator()` obscures which fields have conditional behavior.
---
## Bad Example
```php
public function rules(): array
{
    return ['company_name' => ['nullable', 'string', 'max:255']];
}

protected function withValidator(Validator $validator): void
{
    // Conditional hidden in withValidator
    if ($this->input('type') !== 'business') { return; }
    $validator->addRules(['company_name' => ['required', 'string', 'max:255']]);
}
```
---
## Good Example
```php
public function rules(): array
{
    return [
        'company_name' => Rule::when(
            $this->input('type') === 'business',
            ['required', 'string', 'max:255'],
            ['nullable', 'string', 'max:255']
        ),
    ];
}
```
---
## Exceptions
Conditions requiring access to the Validator instance (e.g., `$validator->sometimes()`) or multiple related fields with shared logic belong in `withValidator()`.
---
## Consequences Of Violation
Scattered conditional logic, harder to audit validation contracts, violations of single-responsibility in rule methods.

---

## Use sometimes for Presence, nullable for Optional Type
---
## Category
Framework Usage | Reliability
---
## Rule
Use `sometimes` when a field's validation should be skipped entirely if the field is absent; use `nullable` when the field may be present with a `null` value but should still validate type if non-null.
---
## Reason
`sometimes` skips all rules when the field is absent — including type checks. `nullable` allows `null` as a valid value while still validating non-null values against the remaining rules.
---
## Bad Example
```php
'email' => ['sometimes', 'email'], // If absent, no validation — but also no type check if present at all
```
---
## Good Example
```php
'email' => ['nullable', 'email'],  // null is valid; non-null values must be valid email
'email' => ['sometimes', 'required', 'email'], // Only validate if present; if present, must be email
```
---
## Exceptions
No common exceptions — always distinguish "optional with nullable value" from "validate only when present."
---
## Consequences Of Violation
Fields accepted as non-null strings without type validation; `null` values silently passing `string` rules when `nullable` was intended.

---

## Extract Complex Conditional Logic to Named Methods
---
## Category
Maintainability | Code Organization
---
## Rule
Extract complex conditional validation logic (more than 3 conditions or nested `Rule::when()` calls) from `rules()` to a dedicated named method.
---
## Reason
Inline conditional chains in `rules()` quickly become unreadable — extracting to `addPaymentRules()` or `addShippingRules()` keeps the rules method declarative and the conditions testable in isolation.
---
## Bad Example
```php
public function rules(): array
{
    return [
        'type' => ['required', Rule::in(['physical', 'digital'])],
        'weight' => Rule::when($this->input('type') === 'physical',
            Rule::when($this->input('shipping') === 'international',
                ['required', 'numeric', 'max:20'],
                ['required', 'numeric', 'max:50']
            ),
            ['nullable']
        ),
    ];
}
```
---
## Good Example
```php
public function rules(): array
{
    return array_merge(
        ['type' => ['required', Rule::in(['physical', 'digital'])]],
        $this->shippingRules()
    );
}

protected function shippingRules(): array
{
    if ($this->input('type') !== 'physical') {
        return ['weight' => ['nullable']];
    }
    $max = $this->input('shipping') === 'international' ? 20 : 50;
    return ['weight' => ['required', 'numeric', "max:{$max}"]];
}
```
---
## Exceptions
Simple two-branch `Rule::when()` with one or two rules per branch — these are readable inline.
---
## Consequences Of Violation
Unreadable rules methods; skipped edge cases in untested conditional branches; high cognitive load when modifying validation logic.

---

## Prefer prohibited_if Over required_without for Mutual Exclusion
---
## Category
Maintainability | Security
---
## Rule
Use `prohibited_if` for mutually exclusive fields instead of `required_without` when exactly one of two fields should be present.
---
## Reason
`prohibited_if` explicitly rejects the prohibited field when the condition is met, preventing both fields from being submitted. `required_without` only ensures at least one is present but allows both, bypassing the mutual-exclusion intent.
---
## Bad Example
```php
'card_id' => ['required_without:paypal_id', 'exists:cards,id'],
'paypal_id' => ['required_without:card_id', 'exists:paypal,id'],
// Both can be submitted — violates mutual exclusion
```
---
## Good Example
```php
'payment_type' => ['required', Rule::in(['card', 'paypal'])],
'card_id' => ['required_if:payment_type,card', 'prohibited_if:payment_type,paypal', 'exists:cards,id'],
'paypal_id' => ['required_if:payment_type,paypal', 'prohibited_if:payment_type,card', 'exists:paypal,id'],
```
---
## Exceptions
When both fields are genuinely optional and the business allows neither or both.
---
## Consequences Of Violation
Mutual exclusion bypassed — both fields submitted together causes ambiguous business logic; validation passes when it should reject.

---

## Test Every Conditional Branch Independently
---
## Category
Testing
---
## Rule
Write a separate test case for each conditional branch in validation rules, covering both pass and fail scenarios per branch.
---
## Reason
Untested conditional branches are the most common source of validation bugs — a branch that compiles but never fires in tests will eventually fire in production with unexpected results.
---
## Bad Example
```php
public function test_store_post_validation(): void
{
    // Only tests "business" type — "individual" branch never tested
}
```
---
## Good Example
```php
/** @testWith ["individual"] */
/** @testWith ["business"] */
public function test_company_name_validation(string $type): void
{
    $data = ['type' => $type, 'name' => '...'];
    if ($type === 'business') {
        $this->assertValidationPasses($data, $this->rules());
    }
}
```
---
## Exceptions
No common exceptions — every condition branch must have test coverage.
---
## Consequences Of Violation
Production bugs surface when unexercised conditional paths execute; regression detection is blind for half the validation logic.

---

## Never Use Closures in rules() When Route Caching Is Required
---
## Category
Performance | Framework Usage
---
## Rule
Replace closure rules with Rule class instances in `rules()` when the application uses route caching (`php artisan route:cache`).
---
## Reason
Closures cannot be serialized; `php artisan route:cache` fails when a FormRequest's `rules()` method contains closures. Rule classes implement `Serializable` and work with route caching.
---
## Bad Example
```php
'email' => ['required', function ($attr, $value, $fail) {
    if (!str_ends_with($value, '@example.com')) {
        $fail('Must be @example.com');
    }
}], // Breaks route caching
```
---
## Good Example
```php
'email' => ['required', new ValidDomainRule('example.com')], // Rule class — cache-safe
```
---
## Exceptions
Applications that never use route caching (e.g., local dev-only) may use closures, but prefer Rule classes from the start to avoid later migration pain.
---
## Consequences Of Violation
`php artisan route:cache` throws a serialization exception; deployments fail; developers waste time diagnosing the obscure error.
