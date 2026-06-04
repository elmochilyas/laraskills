## Rule 1: Use Lazy Load for expensive-to-create objects that may not be used
---
## Category
Architecture
---
## Rule
Defer the creation or loading of an object until it is actually needed, not when the parent object is constructed.
---
## Reason
Loading everything eagerly wastes memory and time if many referenced objects are never used.
---
## Bad Example
```php
class Order
{
    private Customer $customer; // loaded eagerly

    public function __construct(int $customerId)
    {
        $this->customer = Customer::find($customerId); // always loads
    }
}
```
---
## Good Example
```php
class Order
{
    private ?Customer $customer = null;

    public function __construct(
        private int $customerId
    ) {}

    public function customer(): Customer
    {
        return $this->customer ??= Customer::find($this->customerId);
    }
}
```
---
## Exceptions
When the object is always used (lazy loading adds complexity without benefit).
---
## Consequences Of Violation
Wasted resources, slower construction, unnecessary database queries.
---
## Rule 2: Use Virtual Proxy for lazy loading, not null checks everywhere
---
## Category
Architecture
---
## Rule
Use a Virtual Proxy that transparently loads the real object on first access, instead of null-checking and loading throughout the code.
---
## Reason
Null-checking scatters loading logic and is error-prone; Virtual Proxy encapsulates lazy loading.
---
## Bad Example
```php
class Order
{
    private ?Customer $customer = null;

    public function customer(): ?Customer
    {
        if ($this->customer === null) {
            $this->customer = Customer::find($this->customerId);
        }
        return $this->customer;
    }
}
```
---
## Good Example
```php
class LazyCustomerProxy
{
    private ?Customer $real = null;

    public function __construct(
        private int $id
    ) {}

    public function __call(string $method, array $args): mixed
    {
        return ($this->real ??= Customer::findOrFail($this->id))->$method(...$args);
    }
}
```
---
## Exceptions
When the lazy loading is simple and a single null-check is sufficient.
---
## Consequences Of Violation
Scattered null checks, duplicated loading logic, error-prone.
---
## Rule 3: Use Ghost objects to avoid null checks in domain logic
---
## Category
Architecture
---
## Rule
A Ghost is a partially-loaded object that loads the rest of its data on first access to any property/method.
---
## Reason
Ghost objects appear fully loaded to the caller, eliminating null checks while still deferring loading.
---
## Bad Example
```php
if ($order->customer() !== null) {
    $email = $order->customer()->email;
}
```
---
## Good Example
```php
// Ghost: appears as a real Customer, loads on demand
$email = $order->customer()->email; // works without null check
```
---
## Exceptions
When the object graph is simple and null checks are acceptable.
---
## Consequences Of Violation
Null checks scattered in domain logic, defensive programming.
---
## Rule 4: Document lazy-loaded properties to avoid unexpected database queries
---
## Category
Architecture
---
## Rule
Explicitly mark lazy-loaded properties in docblocks or naming conventions so callers know access may trigger a database query.
---
## Reason
Unexpected lazy loads (N+1 problem) can cause severe performance degradation; documentation helps prevent this.
---
## Bad Example
```php
class Order
{
    private LazyCustomerProxy $customer; // undocumented — caller doesn't know access triggers DB
}
```
---
## Good Example
```php
class Order
{
    /** @lazy-loads — triggers DB query on access */
    private LazyCustomerProxy $customer;
}
```
---
## Exceptions
When the ORM (Eloquent) handles lazy loading transparently and the team is well-trained on N+1 risks.
---
## Consequences Of Violation
N+1 query problems, unexpected performance degradation.
