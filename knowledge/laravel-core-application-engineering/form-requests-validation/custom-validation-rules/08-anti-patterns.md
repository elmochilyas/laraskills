# Custom Validation Rules — Anti-Patterns

## Anti-Pattern 1: Throwing Exceptions Instead of Using $fail

**Symptom:** Calling `throw new \Exception()` or `throw new \InvalidArgumentException()` inside a custom rule's `validate()` method instead of calling `$fail()`.

**Problem:** The `$fail` closure is a boolean flag mechanism — it marks the rule as failed without aborting validation of other rules. Throwing an exception halts all remaining validation for all fields, producing incomplete error feedback and potentially surfacing as a 500 error.

```php
// BAD — exception aborts all validation
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    if (! preg_match('/^\d{5}$/', $value)) {
        throw new \InvalidArgumentException('Invalid ZIP code.');
    }
}
```

**Solution:** Always call `$fail('message')` to signal validation failure. Never throw exceptions.

```php
// GOOD — proper failure signaling
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    if (! preg_match('/^\d{5}$/', $value)) {
        $fail('The :attribute must be a valid ZIP code.');
    }
}
```

**Detection:** Search for `throw` inside `validate()` methods of classes implementing `ValidationRule`.

---

## Anti-Pattern 2: Side Effects in validate() Methods

**Symptom:** Writing to the database, sending emails, incrementing counters, or calling external APIs inside a custom rule's `validate()` method.

**Problem:** Custom rules should only validate input — side effects are invisible to developers reading validation code, execute during every validation pass (including for invalid data), and violate the principle of least astonishment.

```php
// BAD — side effect in validation
class ValidCouponCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $coupon = Coupon::where('code', $value)->first();
        $coupon->increment('times_checked'); // Side effect!
        if (! $coupon->active) {
            $fail('Coupon is expired.');
        }
    }
}
```

**Solution:** Rules must be read-only. Move side effects to the service layer after validation passes.

```php
// GOOD — validation only
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
```

**Detection:** Search for `::create`, `::update`, `::save`, `::delete`, `dispatch`, `Mail::`, `increment`, `decrement` inside `validate()` methods.

---

## Anti-Pattern 3: Instance State in ValidationRule Causing Cross-Field Pollution

**Symptom:** Storing per-call state in instance properties of a custom rule class.

**Problem:** The `InvokableValidationRule` wrapper instantiates the rule once and reuses it across all attributes. Instance state set during one `validate()` call persists to subsequent calls in the same validation run, causing cross-field data leakage.

```php
// BAD — state leaks between fields
class ValidSKU implements ValidationRule
{
    private bool $validated = false; // Cross-field state!
    private array $validSkus = [];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $this->validated) {
            $this->validSkus = Product::pluck('sku')->all();
            $this->validated = true;
        }
        // ...
    }
}
```

**Solution:** Cache database results with nullable properties, not boolean flags. Never use instance properties for per-call state.

```php
// GOOD — null-check caching, no flag
class ValidSKU implements ValidationRule
{
    private ?Collection $validSkus = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $this->validSkus ??= Product::pluck('sku');
        if (! $this->validSkus->contains($value)) {
            $fail('Invalid SKU.');
        }
    }
}
```

**Detection:** Search for `private` properties in classes implementing `ValidationRule`. Inspect for boolean flags or mutable state.

---

## Anti-Pattern 4: Using Legacy Validator::extend() in Laravel 10+

**Symptom:** Registering custom rules via `Validator::extend()` in a ServiceProvider instead of creating invokable rule classes.

**Problem:** `Validator::extend()` requires manual registration, does not support dependency injection through the container, and makes rules harder to discover. Invokable classes are autoloadable, injectable, and testable.

```php
// BAD — legacy pattern, hard to find and test
// In AppServiceProvider:
Validator::extend('valid_postal_code', function ($attribute, $value, $parameters, $validator) {
    return preg_match('/^\d{5}(-\d{4})?$/', $value);
});
```

**Solution:** Create an invokable rule class implementing `ValidationRule`. No registration needed.

```php
// GOOD — autoloaded, testable, injectable
class ValidPostalCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! preg_match('/^\d{5}(-\d{4})?$/', $value)) {
            $fail('The :attribute must be a valid ZIP code.');
        }
    }
}
```

**Detection:** Search for `Validator::extend(` in ServiceProvider files. Flag for migration to invokable classes.

---

## Anti-Pattern 5: N+1 Database Queries in Array Validation

**Symptom:** A custom rule queries the database on every invocation without caching, causing N+1 queries when validating array fields.

**Problem:** When validating `items.*.sku` with 50 items, a rule that queries the database per call generates 50 queries. The same data is fetched repeatedly because the rule instance has no internal cache.

```php
// BAD — queries per item
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    $exists = DB::table('products')->where('sku', $value)->exists(); // 50 items = 50 queries
    if (! $exists) {
        $fail('Invalid SKU.');
    }
}
```

**Solution:** Cache reference data using a nullable property in the rule class.

```php
// GOOD — single query, cached
class ValidSKU implements ValidationRule
{
    private static ?Collection $validSkus = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        self::$validSkus ??= Product::pluck('sku');
        if (! self::$validSkus->contains($value)) {
            $fail('Invalid SKU.');
        }
    }
}
```

**Detection:** Search for `::where`, `::find`, `::first`, `->exists()`, `DB::` inside `validate()` methods. Review for null-caching patterns.

---

## Anti-Pattern 6: Missing Translation Integration

**Symptom:** Hardcoding English error messages in custom rules without using `$fail()->translate()`.

**Problem:** Hardcoded messages cannot be localized. When the application supports multiple locales, non-English users see English error messages. The translation key system is available but unused.

```php
// BAD — not translatable
$fail('The postal code is invalid.');
```

**Solution:** Use translation keys with `$fail()->translate()` and define translations in `resources/lang/`.

```php
// GOOD — translatable
$fail('validation.custom.postal_code')->translate();

// resources/lang/en/validation.php
'custom' => [
    'postal_code' => 'The postal code must be a valid 5-digit ZIP code.',
],
```

**Detection:** Search for `$fail(` in custom rule classes. Flag any usage where the argument is a hardcoded string (not using `->translate()`).
