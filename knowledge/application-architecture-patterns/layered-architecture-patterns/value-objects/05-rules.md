# Rules for Value Objects in Laravel

## Value Objects Are Readonly and Immutable
---
## Category
Architecture | Domain Modeling
---
## Rule
Value Object classes MUST be declared `readonly` (PHP 8.1+) with all constructor properties typed and private; no setters, no mutable state, no side effects.
---
## Reason
Immutability is the defining characteristic of Value Objects. If a Value Object can change after creation, its identity (defined by value) becomes unstable and its reliability as a type-safe value container is compromised.
---
## Bad Example
```php
class Email {
    public string $value; // Public mutable property
}
```
---
## Good Example
```php
readonly class Email {
    public function __construct(private string $value) {}
}
```
---
## Exceptions
No exceptions. Immutability is a hard requirement.
---
## Consequences Of Violation
Value Object can enter invalid state after creation; equality semantics broken; defensive copies required everywhere.

## Validate on Construction
---
## Category
Architecture | Data Integrity
---
## Rule
Value Object constructors MUST validate ALL invariants before assigning values; if data is invalid, throw `\InvalidArgumentException` and never create the object.
---
## Reason
The primary value of a Value Object is making invalid data unrepresentable. If construction succeeds, the data must be valid. This eliminates null checks and validation duplication throughout the codebase.
---
## Bad Example
```php
readonly class Email {
    public function __construct(private string $value) {
        // No validation — invalid emails can exist
    }
}
```
---
## Good Example
```php
readonly class Email {
    public function __construct(private string $value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }
}
```
---
## Exceptions
No exceptions. Validation on construction is a hard requirement.
---
## Consequences Of Violation
Invalid data propagates through the system; validation must be repeated at every use site; Value Object offers no safety guarantee.

## Expose Value via Named Method
---
## Category
Architecture | API Design
---
## Rule
Expose the underlying value through a domain-meaningful named method (e.g., `->email()`, `->amount()`) rather than a generic getter.
---
## Reason
Named methods express the domain meaning of the value. `$email->email()` is redundant but clear. `$email->value()` is generic but acceptable. Avoid `$email->get()` which communicates nothing.
---
## Bad Example
```php
$vo->get(); // What does this return?
$vo->value(); // Generic but acceptable
```
---
## Good Example
```php
$email->email(); // Clear: returns the email address
$money->amount(); // Clear: returns the monetary amount
```
---
## Exceptions
Simple Value Objects with obvious meaning may use `->value()` as the default convention.
---
## Consequences Of Violation
Unclear API; developers must read the class to understand what `->get()` returns.

## Implement Equality Comparison
---
## Category
Architecture | Domain Modeling
---
## Rule
Value Objects MUST implement `equals(self $other): bool` comparing ALL properties; equality means structural equality of all attributes.
---
## Reason
Value Objects are defined by their attributes. Equality comparison enables set operations, collection filtering, and business rule implementation. Without `equals()`, PHP's default object comparison (by identity) is incorrect for Value Objects.
---
## Bad Example
```php
$a = new Email('a@b.com');
$b = new Email('a@b.com');
$a == $b; // false — PHP compares by identity
```
---
## Good Example
```php
$a = new Email('a@b.com');
$b = new Email('a@b.com');
$a->equals($b); // true — compares by value
```
---
## Exceptions
No exceptions. Equality comparison is required for Value Object semantics.
---
## Consequences Of Violation
Incorrect comparison results; business logic bugs; test failures.

## Use Value Objects as Type Hints
---
## Category
Architecture | API Design
---
## Rule
Replace primitive type hints with Value Object type hints in all method and constructor signatures where domain concepts exist.
---
## Reason
Value Object type hints provide automatic validation and documentation. `Email $email` communicates that the parameter is a valid email. `string $email` communicates nothing about format or validation.
---
## Bad Example
```php
public function register(string $email, string $name): void
```
---
## Good Example
```php
public function register(Email $email, CustomerName $name): void
```
---
## Exceptions
Primitives used purely for technical infrastructure (HTTP headers, query parameters) may remain primitives.
---
## Consequences Of Violation
Missing validation; unclear API; scattered validation logic.

## No IO in Value Object Methods
---
## Category
Architecture | Domain Modeling
---
## Rule
Value Object methods MUST NOT perform IO operations (database queries, API calls, file access, email sending).
---
## Reason
Value Objects are pure data containers with behavior. IO operations break immutability semantics, introduce side effects, and couple the Value Object to infrastructure concerns.
---
## Bad Example
```php
readonly class Email {
    public function sendWelcomeEmail(): void {
        Mail::to($this->value)->send(...); // IO in Value Object
    }
}
```
---
## Good Example
```php
readonly class Email {
    public function toString(): string { return $this->value; }
}
// Send logic is in Infrastructure
```
---
## Exceptions
No exceptions. Value Object methods must be pure — no side effects, no IO.
---
## Consequences Of Violation
Value Objects coupled to infrastructure; untestable; side effects in unexpected places.

## Sensitive Values Avoid Log Leakage
---
## Category
Security | Architecture
---
## Rule
Value Objects representing sensitive data (Email, Phone, CreditCard, SSN) MUST implement `__toString()` to return a masked or safe representation; never expose raw sensitive values in logs.
---
## Reason
Logging systems may capture `__toString()` output automatically. Exposing raw email addresses, phone numbers, or partial credit card numbers in logs violates privacy regulations (GDPR, PCI-DSS).
---
## Bad Example
```php
readonly class Email {
    public function __toString(): string {
        return $this->value; // Raw email in logs
    }
}
```
---
## Good Example
```php
readonly class Email {
    public function __toString(): string {
        $parts = explode('@', $this->value);
        return substr($parts[0], 0, 2) . '***@' . $parts[1];
    }
}
```
---
## Exceptions
Internal-only Value Objects that never reach log output may expose raw values.
---
## Consequences Of Violation
Privacy regulation violations; sensitive data in log aggregation systems; audit failures.
