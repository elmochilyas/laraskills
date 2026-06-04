# Custom Validation Rules — Engineering Rules

---

## Rule 1: Prefer Invokable Classes Over Closures for Reusable Rules

---

## Category

Framework Usage

---

## Rule

Use invokable rule classes (implementing `ValidationRule`) for any validation rule used in more than one place. Reserve Closure rules for one-off, single-location validation only.

---

## Reason

Invokable classes are autoloadable, testable in isolation, support dependency injection through the container, and can be reused across multiple FormRequests and validation contexts. Closures inline in rule arrays cannot be reused without duplication.

---

## Bad Example

```php
// Same Closure duplicated in two FormRequests
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'postal_code' => ['required', function (string $attr, mixed $val, Closure $fail) {
                if (! preg_match('/^\d{5}(-\d{4})?$/', $val)) {
                    $fail('Invalid ZIP code.');
                }
            }],
        ];
    }
}
```

---

## Good Example

```php
// app/Rules/ValidPostalCode.php
class ValidPostalCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! preg_match('/^\d{5}(-\d{4})?$/', $value)) {
            $fail('The :attribute must be a valid ZIP code.');
        }
    }
}

// Used in any FormRequest
'postal_code' => ['required', new ValidPostalCode],
```

---

## Exceptions

For one-off validations that will never be reused (e.g., a unique constraint check specific to a single action), Closure rules are acceptable.

---

## Consequences Of Violation

Maintenance risks: duplicated validation logic across multiple request classes. Testing overhead: each duplication must be tested separately.

---

## Rule 2: Use $fail() — Do Not Throw Exceptions in Custom Rules

---

## Category

Maintainability

---

## Rule

Call `$fail('message')` to indicate validation failure. Do not throw exceptions from within the `validate()` method.

---

## Reason

The `$fail` closure is a boolean flag mechanism — it marks the rule as failed without aborting validation of other rules on the same field (unless `bail` is present). Throwing an exception halts all remaining validation for all fields, producing incomplete error feedback.

---

## Bad Example

```php
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    if (! ValidCoupon::isValid($value)) {
        throw new \InvalidArgumentException('Invalid coupon.');
    }
}
```

---

## Good Example

```php
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    if (! ValidCoupon::isValid($value)) {
        $fail('The :attribute is not a valid coupon code.');
    }
}
```

---

## Exceptions

No common exceptions. Always use `$fail()` for validation failure signaling.

---

## Consequences Of Violation

User experience risks: users see only the first validation error instead of all errors. Reliability risks: validation exceptions may bypass Laravel's validation error handling.

---

## Rule 3: Do Not Perform Side Effects in validate()

---

## Category

Design

---

## Rule

Custom rules must only validate input — they must not write to the database, send API calls, dispatch jobs, or modify the request. Validation rules are read-only operations.

---

## Reason

Side effects in validation rules are invisible to developers reading the code. They execute during every validation pass, including runs that may be discarded. Side effects violate the principle of least astonishment and make debugging extremely difficult.

---

## Bad Example

```php
class ValidCouponCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $coupon = Coupon::where('code', $value)->first();
        $coupon->increment('times_checked'); // Side effect in validation!
        if (! $coupon->active) {
            $fail('Coupon is expired.');
        }
    }
}
```

---

## Good Example

```php
class ValidCouponCode implements ValidationRule
{
    public function __construct(private CouponService $coupons) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $this->coupons->isValid($value)) {
            $fail('The :attribute is not a valid coupon code.');
        }
    }
}
// Coupon usage tracking is handled by the service layer
```

---

## Exceptions

Read-only cache warming (e.g., `Cache::remember()`) is acceptable as a side effect, provided it does not change application state.

---

## Consequences Of Violation

Reliability risks: side effects may execute in unexpected validation contexts (e.g., `sometimes()` callbacks). Debugging difficulty: unpredictable behavior from implicit state changes.

---

## Rule 4: Test Custom Rules in Isolation

---

## Category

Testing

---

## Rule

Write unit tests for every custom invokable rule by instantiating the rule, calling `validate()` with known inputs, and asserting on the `$fail` closure.

---

## Reason

Integration tests for custom rules require the full HTTP stack. Unit tests in isolation are faster, more focused, and can cover edge cases (null, empty, boundary values) that would be cumbersome to test through the HTTP pipeline.

---

## Bad Example

```php
// Only tested through HTTP integration — misses edge cases
public function test_coupon_validation(): void
{
    $response = $this->post('/checkout', ['coupon' => 'INVALID']);
    $response->assertSessionHasErrors(['coupon']);
}
```

---

## Good Example

```php
public function test_valid_postal_code_accepts_five_digit(): void
{
    $rule = new ValidPostalCode;
    $fail = fn () => $this->fail('Should not have failed.');
    $rule->validate('postal_code', '12345', $fail);
    $this->expectNotToPerformAssertions();
}

public function test_valid_postal_code_rejects_invalid(): void
{
    $rule = new ValidPostalCode;
    $failed = false;
    $rule->validate('postal_code', 'abcde', function () use (&$failed) {
        $failed = true;
    });
    $this->assertTrue($failed);
}
```

---

## Exceptions

Rules that depend on container-resolved services (database, API) may require integration tests or mocked dependencies in unit tests.

---

## Consequences Of Violation

Testing gaps: edge cases and boundary values not covered. Performance risks: slower integration test suite.

---

## Rule 5: Use Descriptive Class Names for Custom Rules

---

## Category

Maintainability

---

## Rule

Name invokable rule classes with descriptive, intention-revealing names that describe what the rule validates. Use the pattern `Valid{What}` or `{Constraint}Rule`.

---

## Reason

Descriptive names make the purpose of the rule immediately clear when reading the rules array. Names like `ValidPostalCode`, `NotFutureDate`, or `ValidCouponCode` are self-documenting. Vague names like `CustomRule` or `MyRule` require investigation.

---

## Bad Example

```php
// app/Rules/CheckRule.php
class CheckRule implements ValidationRule { /* ... */ }

// In use:
'field' => ['required', new CheckRule] // What does CheckRule validate?
```

---

## Good Example

```php
// app/Rules/ValidPostalCode.php
class ValidPostalCode implements ValidationRule { /* ... */ }

// In use:
'postal_code' => ['required', new ValidPostalCode] // Clearly validates postal codes
```

---

## Exceptions

No common exceptions. Descriptive naming costs nothing and provides continuous documentation benefit.

---

## Consequences Of Violation

Maintenance risks: developers must open rule files to understand their purpose. Onboarding friction: new team members cannot reason about rules from their names alone.

---

## Rule 6: Cache or Batch Database Queries in Validation Rules

---

## Category

Performance

---

## Rule

When a custom rule queries the database, cache the result for the duration of the request or batch multiple lookups into a single query. Avoid N+1 query patterns inside validation rules.

---

## Reason

Custom rules fire once per field value per validation pass. When validating arrays (`items.*.code`), a database-querying rule may execute dozens of times. Without caching, the same query repeats for each array element, creating a performance bottleneck.

---

## Bad Example

```php
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    $exists = DB::table('codes')->where('code', $value)->exists(); // Runs per item
    if (! $exists) {
        $fail('Invalid code.');
    }
}
```

---

## Good Example

```php
class ValidCode implements ValidationRule
{
    private static array $validCodes = [];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty(self::$validCodes)) {
            self::$validCodes = DB::table('codes')->pluck('code')->all(); // One query
        }
        if (! in_array($value, self::$validCodes, true)) {
            $fail('Invalid code.');
        }
    }
}
```

---

## Exceptions

Rules that validate against rapidly changing data may need fresh queries per invocation.

---

## Consequences Of Violation

Performance risks: N+1 database queries during array validation. Scalability risks: multiplied database load under concurrent requests.
