## Rule 1: Subtypes must be substitutable for their base types without altering correctness
---
## Category
Architecture
---
## Rule
Any code that uses a base type must work correctly with any of its subtypes without knowing which subtype it's using.
---
## Reason
LSP violations cause subtle runtime bugs—callers that check types, make assumptions, or handle special cases are fragile and defeat polymorphism.
---
## Bad Example
```php
class Rectangle
{
    public function __construct(
        protected int $width,
        protected int $height
    ) {}

    public function setWidth(int $width): void { $this->width = $width; }
    public function setHeight(int $height): void { $this->height = $height; }
    public function area(): int { return $this->width * $this->height; }
}

class Square extends Rectangle
{
    public function setWidth(int $width): void
    {
        $this->width = $width;
        $this->height = $width; // violates LSP: changes height unexpectedly
    }
}
```
---
## Good Example
```php
interface Shape
{
    public function area(): int;
}

class Rectangle implements Shape
{
    public function __construct(
        private int $width,
        private int $height
    ) {}
    public function area(): int { return $this->width * $this->height; }
}

class Square implements Shape
{
    public function __construct(
        private int $side
    ) {}
    public function area(): int { return $this->side * $this->side; }
}
```
---
## Exceptions
When the subtype relationship is explicitly private and never used polymorphically (but avoid inheritance in this case).
---
## Consequences Of Violation
Runtime errors, instanceof checks, broken polymorphism.
---
## Rule 2: Preconditions cannot be strengthened in subtypes
---
## Category
Architecture
---
## Rule
A subtype cannot require more restrictive conditions than its base type. If the base type accepts any string, the subtype cannot require a non-empty string.
---
## Reason
Strengthening preconditions breaks callers who pass valid base-type arguments—they get unexpected failures.
---
## Bad Example
```php
class FileLogger
{
    public function log(string $message): void { /* accepts any string */ }
}

class HtmlLogger extends FileLogger
{
    public function log(string $message): void
    {
        if (str_contains($message, '<')) { // strengthened precondition
            throw new \InvalidArgumentException('Message cannot contain HTML');
        }
    }
}
```
---
## Good Example
```php
interface Logger
{
    public function log(string $message): void;
}

class FileLogger implements Logger
{
    public function log(string $message): void { /* accepts any */ }
}

class SafeLogger implements Logger
{
    public function log(string $message): void
    {
        $message = strip_tags($message); // sanitize, don't throw
        // log sanitized message
    }
}
```
---
## Exceptions
When the precondition is validated at a higher level before reaching the subtype (document this dependency).
---
## Consequences Of Violation
Unexpected exceptions, callers must know subtype details.
---
## Rule 3: Postconditions cannot be weakened in subtypes
---
## Category
Architecture
---
## Rule
A subtype must guarantee at least what the base type guarantees. If the base type returns a non-null result, the subtype must also.
---
## Reason
Weakening postconditions breaks callers that rely on the base type's contract.
---
## Bad Example
```php
interface UserRepository
{
    /** @return non-empty-array<User> */
    public function findActive(): array;
}

class CachedUserRepository implements UserRepository
{
    public function findActive(): array
    {
        return []; // weakened postcondition: can return empty array
    }
}
```
---
## Good Example
```php
interface UserRepository
{
    /** @return non-empty-array<User> */
    public function findActive(): array;
}

class CachedUserRepository implements UserRepository
{
    public function findActive(): array
    {
        $users = Cache::get('active_users');
        if (empty($users)) {
            $users = $this->decorated->findActive();
            Cache::put('active_users', $users);
        }
        return $users; // satisfies postcondition
    }
}
```
---
## Exceptions
When the contract explicitly documents that the result may be empty in edge cases.
---
## Consequences Of Violation
Unexpected nulls, empty results, callers need subtype-specific handling.
---
## Rule 4: Use composition over inheritance to avoid LSP violations
---
## Category
Architecture
---
## Rule
Prefer composition (delegating to an injected collaborator) over inheritance when the subtype relationship is uncertain or when you need only part of the base behavior.
---
## Reason
Inheritance is the primary source of LSP violations; composition provides the flexibility to reuse behavior without being constrained by the base type's contract.
---
## Bad Example
```php
class AdminUser extends User
{
    public function hasPermission(string $permission): bool
    {
        return true; // LSP: User's hasPermission checks permissions, Admin bypasses all
    }
}
```
---
## Good Example
```php
class AdminPermissionStrategy implements PermissionStrategy
{
    public function hasPermission(User $user, string $permission): bool
    {
        return $user->isAdmin() || $user->hasDirectPermission($permission);
    }
}
```
---
## Exceptions
When the inheritance relationship represents a true IS-A relationship with no contractual differences.
---
## Consequences Of Violation
LSP violations, instanceof checks, fragile polymorphic code.
---
## Rule 5: Document the base type's contract explicitly (are there invariants?)
---
## Category
Architecture
---
## Rule
Define the base type's contract clearly—preconditions, postconditions, and invariants—so implementors know what they must satisfy.
---
## Reason
Undocumented contracts lead to unintentional LSP violations—implementors don't know what they're required to guarantee.
---
## Bad Example
```php
interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
    // No contract documented
}
```
---
## Good Example
```php
/**
 * Contract:
 * - Precondition: $amount > 0
 * - Postcondition: ChargeResult with non-null transactionId on success
 * - Invariant: Idempotent for the same idempotencyKey
 */
interface PaymentGateway
{
    public function charge(Money $amount, string $idempotencyKey): ChargeResult;
    public function refund(TransactionId $transactionId): RefundResult;
}
```
---
## Exceptions
Trivial interfaces where the contract is obvious from the method signature and naming.
---
## Consequences Of Violation
Unintentional LSP violations, confused implementors, runtime surprises.
