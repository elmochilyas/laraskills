## Rule 1: Use Layer Supertype for common behavior shared across all classes in a layer
---
## Category
Architecture
---
## Rule
Define a base class (supertype) for all classes in a layer (e.g., `DomainEntity`, `ApplicationService`) to provide common infrastructure: identity, timestamps, equality, serialization.
---
## Reason
Duplicating common behavior (ID handling, dates, equality) across classes creates redundancy and inconsistency.
---
## Bad Example
```php
class Order
{
    private string $id;
    private Carbon $createdAt;
    public function __construct()
    {
        $this->id = (string) Str::uuid();
        $this->createdAt = now();
    }
}
class Customer
{
    private string $id;
    private Carbon $createdAt;
    public function __construct()
    {
        $this->id = (string) Str::uuid();
        $this->createdAt = now();
    }
}
```
---
## Good Example
```php
abstract class DomainEntity
{
    protected string $id;
    protected Carbon $createdAt;

    public function __construct()
    {
        $this->id = (string) Str::uuid();
        $this->createdAt = now();
    }

    public function id(): string { return $this->id; }
    public function createdAt(): Carbon { return $this->createdAt; }
}

class Order extends DomainEntity { /* ... */ }
class Customer extends DomainEntity { /* ... */ }
```
---
## Exceptions
When the common behavior varies significantly between classes and inheritance creates rigidity.
---
## Consequences Of Violation
Duplicated common code, inconsistent implementations.
---
## Rule 2: Keep Layer Supertype thin—don't put layer-specific logic in it
---
## Category
Architecture
---
## Rule
The Layer Supertype should contain only truly universal infrastructure for the layer (identity, timestamps). Do not put business logic or framework-specific code.
---
## Reason
Thick base classes create coupling—every class in the layer inherits behavior it may not need, violating SRP.
---
## Bad Example
```php
abstract class DomainEntity
{
    // Business logic in base class
    public function validate(): array { /* ... */ }
    public function calculateHash(): string { /* ... */ }
    public function toArray(): array { /* ... */ }
}
```
---
## Good Example
```php
abstract class DomainEntity
{
    protected string $id;
    protected Carbon $createdAt;
    protected Carbon $updatedAt;
    // Only structural identity and timestamps
}
```
---
## Exceptions
When the logic is genuinely universal and every subclass needs it (e.g., equality comparison based on ID).
---
## Consequences Of Violation
SRP violation, coupling to unnecessary inherited behavior.
---
## Rule 3: Prefer composition (Traits) over inheritance for Layer Supertype
---
## Category
Architecture
---
## Rule
If the common behavior can be composed (via traits or interfaces with defaults), prefer that over a mandatory base class.
---
## Reason
PHP single inheritance limits flexibility; traits allow selective composition of common behaviors.
---
## Bad Example
```php
abstract class DomainEntity
{
    // All domain entities must extend this
}
```
---
## Good Example
```php
trait HasTimestamps
{
    protected Carbon $createdAt;
    protected Carbon $updatedAt;
    // timestamp management
}

trait HasIdentity
{
    protected string $id;
    // identity management
}

class Order
{
    use HasIdentity, HasTimestamps;
    // optional: use only what you need
}
```
---
## Exceptions
When the common behavior includes abstract methods that all subclasses must implement.
---
## Consequences Of Violation
Rigid inheritance hierarchy, limited flexibility.
"""
