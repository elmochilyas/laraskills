## Use brick/money for Monetary Types, Not Float Arithmetic
---
## Category
Reliability
---
## Rule
Use the `brick/money` library for all monetary types, amounts, and arithmetic. Never use PHP `float` for monetary calculations.
---
## Reason
Floating-point arithmetic introduces precision errors that cause accounting discrepancies. `brick/money` uses integer arithmetic internally, provides proper rounding, and prevents common float-related bugs like `0.1 + 0.2 !== 0.3`.
---
## Bad Example
```php
$total = 19.99 + 4.99; // float — precision error possible
```
---
## Good Example
```php
use Brick\Money\Money;

$total = Money::of('19.99', 'USD')->plus(Money::of('4.99', 'USD'));
```
---
## Exceptions
When displaying purely cosmetic amounts with no arithmetic (e.g., labels from an external system), float formatting is acceptable.
---
## Consequences Of Violation
Accounting discrepancies from float precision errors, hard-to-debug rounding issues, financial audit failures, customer complaints about incorrect charges.

---
## Normalize Emails to Lowercase on Construction
---
## Category
Reliability
---
## Rule
Normalize email addresses to lowercase in the value object constructor. Store the normalized form in the database.
---
## Reason
Email addresses are case-insensitive per RFC 5321. Storing mixed-case emails causes duplicate accounts, failed login attempts, and inconsistent matching. Lowercase normalization eliminates these issues at the domain boundary.
---
## Bad Example
```php
class Email
{
    public function __construct(
        public readonly string $address
    ) {
        // No normalization — 'User@Example.com' and 'user@example.com' stored separately
    }
}
```
---
## Good Example
```php
class Email
{
    public readonly string $localPart;
    public readonly string $domain;

    public function __construct(
        public readonly string $address
    ) {
        $normalized = strtolower(trim($address));
        if (! filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
        $this->address = $normalized;
    }
}
```
---
## Exceptions
No common exceptions. Always normalize emails on construction.
---
## Consequences Of Violation
Duplicate user accounts for the same email in different cases, failed login for users who type their email in different case, inconsistent email matching across the application.

---
## Store Money Amounts as Integer Cents Internally
---
## Category
Reliability
---
## Rule
Represent all monetary amounts as integer cents internally. Never store money as `float` or `decimal` in PHP value objects.
---
## Reason
Integer cents are exact — no precision loss. Float representations accumulate rounding errors. Decimal strings are exact but require string-to-string arithmetic. Integer cents provide exact representation with the best performance.
---
## Bad Example
```php
class Money
{
    public function __construct(
        public readonly float $amount, // Float — precision errors
        public readonly string $currency,
    ) {}
}
```
---
## Good Example
```php
class Money
{
    public function __construct(
        public readonly int $cents,    // Integer — exact precision
        public readonly string $currency = 'USD',
    ) {}
}
```
---
## Exceptions
When using `brick/money`, the library handles internal representation; use its `Money` object directly rather than duplicating cents storage.
---
## Consequences Of Violation
Accumulated rounding errors in financial calculations, accounting reconciliation failures, customer-facing price display bugs, audit trail inaccuracies.

---
## Validate Email Format Before Storage
---
## Category
Security
---
## Rule
Validate email format using `filter_var()` or an email validation library in the value object constructor before storage. Reject invalid formats with a domain exception.
---
## Reason
Invalid email addresses cause delivery failures, bounce processing errors, and can enable injection attacks if used unsanitized in email headers. Validation at the value object boundary catches all invalid input before it enters the system.
---
## Bad Example
```php
class Email
{
    public function __construct(
        public readonly string $address // No validation — invalid emails stored
    ) {}
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
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
    }
}
```
---
## Exceptions
When accepting partially-typed emails during registration flows, validate at submission point rather than during partial input.
---
## Consequences Of Violation
Invalid email addresses in the database, failed email delivery, email injection vulnerabilities, bounce handling errors, poor user experience.

---
## Use Structured Value Objects for Addresses
---
## Category
Design
---
## Rule
Model geographic addresses as structured value objects with typed components (street, city, state, postalCode, country), not as a single unstructured string.
---
## Reason
Unstructured address strings cannot be validated, formatted consistently, or used for geographic queries. Structured components enable per-field validation, country-specific formatting, and integration with address verification services.
---
## Bad Example
```php
// Single string — no structure, no validation
protected $casts = ['address' => 'string'];
```
---
## Good Example
```php
class Address
{
    public function __construct(
        public readonly string $street,
        public readonly string $city,
        public readonly string $state,
        public readonly string $postalCode,
        public readonly string $country,
    ) {
        // Validate each component
    }

    public function __toString(): string
    {
        return "{$this->street}, {$this->city}, {$this->state} {$this->postalCode}";
    }
}
```
---
## Exceptions
When storing unstructured address data from external systems where parsing into components is unreliable, store as JSON and create a structured value object at the application boundary.
---
## Consequences Of Violation
Inconsistent address formatting, inability to validate address components individually, difficulty integrating with address verification APIs, poor internationalization support.

---
## Implement Castable for Self-Casting Domain Primitives
---
## Category
Code Organization
---
## Rule
Implement `Castable` on domain primitive value objects (Money, Email, Address) that are used across multiple models, enabling self-casting registration.
---
## Reason
When the same value object type appears in several models, implementing `Castable` eliminates duplicate cast class references in each model's `$casts` array. The value object carries its serialization logic, reducing duplication.
---
## Bad Example
```php
// Each model must remember to reference the cast class
class User extends Model
{
    protected $casts = ['email' => EmailCast::class];
}
class Contact extends Model
{
    protected $casts = ['email' => EmailCast::class];
}
```
---
## Good Example
```php
class Email implements Castable
{
    public static function castUsing(): string
    {
        return EmailCast::class;
    }
}

// Models register the value object directly
class User extends Model
{
    protected $casts = ['email' => Email::class];
}
class Contact extends Model
{
    protected $casts = ['email' => Email::class];
}
```
---
## Exceptions
When the value object is used in only one model, direct cast class registration is simpler and preferred.
---
## Consequences Of Violation
Duplicate cast class references across models, cast class location disconnected from value object, higher refactoring cost when cast logic changes.

---
## Implement Equality Comparison for All Domain Primitives
---
## Category
Design
---
## Rule
Implement an `equals()` method on every domain primitive value object. Two value objects with the same property values must be considered equal.
---
## Reason
Value objects are defined by their properties, not by identity. Without explicit equality comparison, developers resort to comparing individual properties, duplicating equality logic and missing properties in comparisons.
---
## Bad Example
```php
if ($addr1->street === $addr2->street && $addr1->city === $addr2->city) {
    // Comparison must be repeated everywhere
}
```
---
## Good Example
```php
class Address
{
    public function equals(Address $other): bool
    {
        return $this->street === $other->street
            && $this->city === $other->city
            && $this->state === $other->state
            && $this->postalCode === $other->postalCode
            && $this->country === $other->country;
    }
}

if ($addr1->equals($addr2)) {
    // Clean, centralized comparison
}
```
---
## Exceptions
No common exceptions. All value objects should implement equality comparison.
---
## Consequences Of Violation
Duplicated comparison logic scattered across the codebase, missed properties in equality checks, subtle bugs when new properties are added to value objects but not added to comparison logic.
