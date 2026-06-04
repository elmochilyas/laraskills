## Make Value Objects Immutable With readonly Properties
---
## Category
Design
---
## Rule
Declare all value object properties as `readonly` (PHP 8.1+). Value objects must be immutable — their state cannot change after construction.
---
## Reason
Immutability guarantees that a value object instance always represents the same value. This prevents bugs caused by accidental mutation through shared references and enables safe reuse of value objects across multiple contexts.
---
## Bad Example
```php
class Money
{
    public int $cents;  // Mutable — can be changed after construction
    public string $currency;
}
```
---
## Good Example
```php
class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}
}
```
---
## Exceptions
No common exceptions. All value objects must be immutable.
---
## Consequences Of Violation
Accidental mutation of shared value object references, subtle bugs depending on access order, loss of value semantics, difficulty reasoning about code behavior.

---
## Self-Validate in the Constructor
---
## Category
Reliability
---
## Rule
Validate all input parameters in the value object constructor. Throw `\InvalidArgumentException` or a domain-specific exception when invalid values are provided.
---
## Reason
A value object should never exist in an invalid state. Constructor validation is the last line of defense — it guarantees that any instance of the value object is valid, regardless of how it was created.
---
## Bad Example
```php
class Email
{
    public function __construct(
        public readonly string $address
    ) {
        // No validation — invalid emails can be created
    }
}
```
---
## Good Example
```php
class Email
{
    public function __construct(
        public readonly string $address
    ) {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email address: {$address}");
        }
    }
}
```
---
## Exceptions
When construction is computationally expensive (e.g., involves I/O), use a lightweight validation constructor and a separate hydration factory for persistence loading.
---
## Consequences Of Violation
Invalid data flowing through the application, errors discovered late (at persistence time instead of creation time), inconsistent validation scattered across callers.

---
## Implement Equality Comparison
---
## Category
Design
---
## Rule
Implement an `equals()` method on value objects that compares all properties. Two value objects with identical property values must be considered equal.
---
## Reason
Value objects are defined by their properties, not by identity. Without explicit equality, developers default to `===` (reference equality), which fails for two separately-constructed instances with the same values. `equals()` provides value-based comparison.
---
## Bad Example
```php
$email1 = new Email('user@example.com');
$email2 = new Email('user@example.com');

$email1 === $email2; // false — different objects, even though same value
```
---
## Good Example
```php
class Email
{
    public function equals(self $other): bool
    {
        return $this->address === $other->address;
    }
}

$email1->equals($email2); // true — value-based comparison
```
---
## Exceptions
No common exceptions. All value objects should support equality comparison.
---
## Consequences Of Violation
Comparison logic duplicated across the codebase, missed properties in manual comparisons, subtle equality bugs when new properties are added to the value object.

---
## Integrate With Eloquent via Custom Casts
---
## Category
Code Organization
---
## Rule
Integrate value objects with Eloquent models using custom casts (`CastsAttributes` or `Castable`). Do not manually serialize/deserialize value objects in controllers or actions.
---
## Reason
Manual serialization scatters conversion logic across the codebase, duplicates code, and breaks the encapsulation that value objects provide. Custom casts centralize the transformation at the model boundary.
---
## Bad Example
```php
// Manual serialization in every controller
$user = new User();
$user->email = serialize(new Email($request->input('email')));

$email = unserialize($user->email); // Manual deserialization on read
```
---
## Good Example
```php
// Custom cast handles all serialization
class EmailCast implements CastsAttributes
{
    public function get(...): ?Email
    {
        return $value === null ? null : new Email($value);
    }

    public function set(...): array
    {
        return [$key => (string) $value];
    }
}

// Model usage
protected $casts = [
    'email' => EmailCast::class,
];
```
---
## Exceptions
When the value object is never persisted (in-memory only, DTO, query result wrapper), no Eloquent integration is needed.
---
## Consequences Of Violation
Serialization logic scattered across controllers and actions, duplicated code for each persistence/serialization point, easy to forget serialization in some code paths, inconsistent handling.

---
## Implement __toString for Convenient Display
---
## Category
Design
---
## Rule
Implement `__toString()` on value objects to return a meaningful string representation suitable for display and interpolation.
---
## Reason
Value objects are frequently used in Blade templates, string interpolation, and logging. Without `__toString()`, developers must manually call a formatting method or access individual properties, leading to inconsistent display formatting.
---
## Bad Example
```php
{{ $user->email->address }} // Must know internal property name
```
---
## Good Example
```php
class Email
{
    public function __toString(): string
    {
        return $this->address;
    }
}

{{ $user->email }} // Clean, consistent display
```
---
## Exceptions
When the value object has no single obvious string representation (e.g., an Address with multiple lines), use a named formatting method (`toOneLine()`, `toMultiLine()`) instead.
---
## Consequences Of Violation
Inconsistent display formatting across Blade templates, callers accessing internal properties directly, coupling views to internal value object structure.

---
## Do Not Expose Setters on Value Objects
---
## Category
Design
---
## Rule
Never define setter methods on value objects. Construction is the only way to set value object state. Use `with*()` methods for creating modified copies.
---
## Reason
Setters imply mutation, which contradicts the immutability principle of value objects. Allowing mutation alongside `readonly` properties creates an inconsistent API where some properties are immutable and others are not.
---
## Bad Example
```php
class Address
{
    public readonly string $street;
    public readonly string $city;

    public function setCity(string $city): void // Setter violates immutability
    {
        $this->city = $city;
    }
}
```
---
## Good Example
```php
class Address
{
    public function __construct(
        public readonly string $street,
        public readonly string $city,
    ) {}

    public function withCity(string $city): self
    {
        return new self($this->street, $city);
    }
}
```
---
## Exceptions
No common exceptions. Value objects must not have setters.
---
## Consequences Of Violation
Mutable value objects that lose their value semantics, accidental in-place modifications bypassing validation, unpredictable behavior when shared references are modified.
