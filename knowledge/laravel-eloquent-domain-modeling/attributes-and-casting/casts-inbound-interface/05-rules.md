## Use CastsInboundAttributes for Write-Only Normalization Only
---
## Category
Design
---
## Rule
Implement `CastsInboundAttributes` only when the attribute requires transformation exclusively on write and the stored database value is the correct PHP representation on read.
---
## Reason
Using `CastsInboundAttributes` when read-time transformation is needed forces callers to manually transform the raw value after reading. This duplicates transformation logic and breaks the encapsulation that custom casts provide.
---
## Bad Example
```php
// Email is stored as-is, but application expects lowercase on read too
class EmailCast implements CastsInboundAttributes
{
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => strtolower(trim($value))];
    }
    // Callers must lowercase the read value manually
}
```
---
## Good Example
```php
// Bidirectional cast ensures consistent behavior on read and write
class EmailCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): string
    {
        return strtolower(trim($value));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => strtolower(trim($value))];
    }
}
```
---
## Exceptions
When the stored value (e.g., a bcrypt hash) is the correct read representation and the original value should never be reconstructed.
---
## Consequences Of Violation
Inconsistent attribute behavior between read and write, hidden transformation requirements on callers, unexpected raw values when accessing attributes directly in code.

---
## Return Array of Key-Value Pairs From set
---
## Category
Framework Usage
---
## Rule
Always return an associative array with column names as keys from the `set()` method, using `[$key => $value]` for single-attribute updates or a multi-key array for multi-attribute updates.
---
## Reason
The `set()` contract requires an array return. Returning a scalar value or omitting the key wrapper causes Eloquent to misassign the value, leading to silent data corruption.
---
## Bad Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [bcrypt($value)]; // Numeric array — key is lost
}
```
---
## Good Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [$key => bcrypt($value)];
}
```
---
## Exceptions
No common exceptions. Always use associative arrays with the correct column key.
---
## Consequences Of Violation
Attribute value overwritten with wrong key, silent data loss, incorrect column updated in the database.

---
## Combine CastsInboundAttributes With Accessors for Read Formatting
---
## Category
Code Organization
---
## Rule
When using `CastsInboundAttributes` for write normalization, pair it with an accessor if the raw stored value needs read-time formatting for presentation purposes.
---
## Reason
`CastsInboundAttributes` provides no `get()` transformation. If the stored format needs display formatting (date formatting, number formatting, label derivation), an accessor provides the read-side transformation cleanly.
---
## Bad Example
```php
// Write-only cast stores hash, but no formatted display available
class HashedSsn implements CastsInboundAttributes
{
    public function set(...): array
    {
        return [$key => Hash::make($value)];
    }
}
// Read returns full hash — not suitable for display
```
---
## Good Example
```php
class HashedSsn implements CastsInboundAttributes
{
    public function set(...): array
    {
        return [$key => Hash::make($value)];
    }
}

// In model: accessor for display
protected function ssnDisplay(): Attribute
{
    return Attribute::make(get: fn () => '***-**-' . substr($this->ssn, -4));
}
```
---
## Exceptions
When the raw stored value is already the desired read format (e.g., a hash used only for verification).
---
## Consequences Of Violation
Raw database values exposed in views and API responses, manual formatting repeated across controllers and Blade templates, inconsistent display formatting.

---
## Document the One-Directional Nature
---
## Category
Maintainability
---
## Rule
Add a docblock to the `CastsInboundAttributes` implementation explaining that it provides no read transformation and that the database value is returned as-is on read.
---
## Reason
Developers accustomed to `CastsAttributes` expect bidirectional transformation. Documenting the one-directional contract prevents confusion about why the attribute returns raw values on read.
---
## Bad Example
```php
// No documentation — developer expects bidirectional behavior
class HashedCast implements CastsInboundAttributes
{
    public function set(...): array { /* ... */ }
}
```
---
## Good Example
```php
/**
 * Inbound-only cast: hashes values on write using bcrypt.
 * On read, the stored hash is returned as-is.
 * Use Hash::check() for verification — the original value cannot be recovered.
 */
class HashedCast implements CastsInboundAttributes
{
    public function set(...): array { /* ... */ }
}
```
---
## Exceptions
No common exceptions. Always document the unidirectional behavior.
---
## Consequences Of Violation
Developer confusion about attribute behavior, unnecessary debugging time, accidental misuse of the attribute value in business logic.

---
## Do Not Implement get() With CastsInboundAttributes
---
## Category
Framework Usage
---
## Rule
Implement only the `set()` method when using `CastsInboundAttributes`. Do not add a `get()` method — the interface signals that no read transformation occurs.
---
## Reason
`CastsInboundAttributes` is explicitly a write-only contract. Adding `get()` violates the interface's semantic intent and creates an inconsistent pattern where some inbound casts transform reads and others don't.
---
## Bad Example
```php
class WeirdCast implements CastsInboundAttributes
{
    public function get(...): mixed { return strtoupper($value); } // Violates intent
    public function set(...): array { return [$key => strtolower($value)]; }
}
```
---
## Good Example
```php
class NormalizeCast implements CastsInboundAttributes
{
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => strtolower(trim($value))];
    }
}
```
---
## Exceptions
No common exceptions. If bidirectional transformation is needed, switch to `CastsAttributes`.
---
## Consequences Of Violation
Misleading code that appears to be write-only but performs read transformations, inconsistent behavior across inbound casts, violation of the principle of least surprise.
