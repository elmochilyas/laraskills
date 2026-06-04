## Mark All Value Object Properties as readonly
---
## Category
Design
---
## Rule
Declare every property on a value object as `readonly` (PHP 8.1+). Never define mutable properties on value objects.
---
## Reason
`readonly` properties enforce immutability at the language level — the compiler prevents reassignment after construction. This guarantees that value objects cannot be modified once created, preventing accidental mutation through shared references.
---
## Bad Example
```php
class Money
{
    public int $cents;    // Mutable — can be changed after construction
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
When performance profiling demonstrates that readonly property cloning is a bottleneck in a hot path (extremely rare in practice).
---
## Consequences Of Violation
Accidental mutation of value object state through shared references, subtle bugs where a value object changes unexpectedly, difficulty reasoning about code behavior.

---
## Return New Instances From Modification Operations
---
## Category
Design
---
## Rule
Operations that semantically "modify" a value object must return a new instance. Never mutate the internal state of `$this`.
---
## Reason
Value objects represent values, not entities. Changing a value object's state destroys referential transparency. Returning new instances makes modifications explicit at the call site (`$new = $old->add($other)`), preventing shared-reference mutation bugs.
---
## Bad Example
```php
class Money
{
    public function add(Money $other): void
    {
        $this->cents += $other->cents; // Mutates $this — breaks immutability
    }
}
```
---
## Good Example
```php
class Money
{
    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->cents + $other->cents, $this->currency);
    }
}
```
---
## Exceptions
No common exceptions. Immutable value objects must never be mutated in place.
---
## Consequences Of Violation
Shared value object instances corrupted by one consumer's modification, intermittent bugs that depend on access order, loss of value semantics and referential transparency.

---
## Do Not Expose Setters on Value Objects
---
## Category
Design
---
## Rule
Never define public or protected setter methods on value objects. Use named constructors (`with*()` or `from*()`) for creating modified copies.
---
## Reason
Setters imply mutable state. Value objects should expose no mutating API — the only way to create an instance is through the constructor or named constructors that return new instances. This makes the object's lifecycle explicit and controlled.
---
## Bad Example
```php
class Email
{
    private string $address;

    public function setAddress(string $address): void // Setter violates immutability
    {
        $this->address = $address;
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
    ) {}

    public function withAddress(string $address): self
    {
        return new self($address);
    }
}
```
---
## Exceptions
No common exceptions. Value objects must not have setters.
---
## Consequences Of Violation
Mutable value objects that lose their identity-by-value semantics, accidental in-place modifications, code that is harder to reason about and test.

---
## Combine Immutable Value Objects With CarbonImmutable
---
## Category
Reliability
---
## Rule
Use `CarbonImmutable` (via `immutable_datetime` cast) for all date/time model attributes when using immutable value objects. Do not mix mutable `Carbon` with immutable domain objects.
---
## Reason
Inconsistent immutability — mutable `Carbon` objects on the model and immutable value objects in domain logic — creates confusion. Developers must remember which objects are safe to modify and which are not, leading to accidental mutation bugs.
---
## Bad Example
```php
protected $casts = [
    'created_at' => 'datetime', // Mutable Carbon — inconsistent with immutable value objects
];
```
---
## Good Example
```php
protected $casts = [
    'created_at' => 'immutable_datetime', // Consistent immutability contract
];
```
---
## Exceptions
When interfacing with third-party libraries that require mutable `Carbon` instances, convert immutables to mutables at the boundary explicitly.
---
## Consequences Of Violation
Accidental mutation of date attributes through `Carbon`'s mutable API, inconsistent immutability contract confusing developers half-mutable model state.

---
## Use Named Constructors for Modified Copies
---
## Category
Design
---
## Rule
Create modified copies of value objects using named constructors prefixed with `with` (e.g., `withAmount()`, `withCurrency()`). Make the intent of the operation clear through the method name.
---
## Reason
Named constructors like `withAmount(int $cents)` make the modification explicit at the call site. They clearly communicate that a new instance is returned rather than the original being mutated.
---
## Bad Example
```php
// Unclear modifier — is $money mutated or returned new?
$money = $money->applyNewAmount(5000);
```
---
## Good Example
```php
// Named constructor clearly returns new instance
$money = $money->withAmount(5000);
$money = $money->withCurrency('EUR');
```
---
## Exceptions
For arithmetic operations (`add`, `subtract`, `multiply`), use domain-specific method names rather than `with*` naming.
---
## Consequences Of Violation
Ambiguous method names that don't distinguish between mutation and new instance creation, callers unsure whether original object is modified, defensive copying in calling code.
