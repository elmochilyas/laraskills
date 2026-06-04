## Rule 1: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
---
## Category
Architecture
---
## Rule
When assigning a responsibility to a domain class would reduce its cohesion or create excessive coupling, instead create a fabricated (non-domain) class to handle it.
---
## Reason
Domain classes should focus on domain logic; forcing infrastructure or cross-cutting concerns into them violates SRP and reduces cohesion.
---
## Bad Example
```php
class Order
{
    public function save(): void // domain entity doing persistence
    {
        DB::table('orders')->insert([...]);
    }
}
```
---
## Good Example
```php
class Order { /* domain logic only */ }

// Pure fabrication: Repository handles persistence
class OrderRepository
{
    public function save(Order $order): void
    {
        DB::table('orders')->insert($order->toArray());
    }
}
```
---
## Exceptions
When the responsibility is trivially simple (e.g., `$order->toArray()`) that adding a fabrication class is over-engineering.
---
## Consequences Of Violation
Low cohesion, SRP violation, domain mixed with infrastructure.
---
## Rule 2: Name pure-fabrication classes by their role, not by the domain concept they serve
---
## Category
Architecture
---
## Rule
Pure-fabrication classes should be named according to their technical role (Repository, Factory, Service, Adapter, Strategy), not by domain terms.
---
## Reason
Domain-inspired names for technical classes confuse the Ubiquitous Language; role-based names communicate the class's technical purpose.
---
## Bad Example
```php
class OrderPersister { // domain-sounding name for a repository
    public function save(Order $order): void { /* ... */ }
}
```
---
## Good Example
```php
class OrderRepository { // role-based name
    public function save(Order $order): void { /* ... */ }
}
```
---
## Exceptions
When the fabrication implements a domain concept that has a clear domain name (e.g., "TaxCalculator" is both a domain concept and a fabrication).
---
## Consequences Of Violation
Ubiquitous Language pollution, confusion about class purpose.
---
## Rule 3: Use Factories pure fabrications to handle complex object creation
---
## Category
Architecture
---
## Rule
When object creation requires assembling parts from different sources or conditional logic, delegate to a Factory (pure fabrication) rather than putting creation logic in the domain class.
---
## Reason
Complex creation logic in domain classes violates SRP; Factories encapsulate creation and keep domain classes focused on behavior.
---
## Bad Example
```php
class Order
{
    public static function fromCheckout(array $cartData): self
    {
        // Complex: validate cart, calculate tax, apply discounts, create items
    }
}
```
---
## Good Example
```php
class OrderFactory
{
    public function fromCheckout(CheckoutData $data): Order
    {
        $items = $this->createItems($data->cart);
        $total = $this->calculateTotal($items, $data->customer);
        return Order::create($items, $total);
    }
}
```
---
## Exceptions
Simple creation (`new Order(...)`) where no Factory is needed.
---
## Consequences Of Violation
SRP violation in domain classes, complex creation mixed with behavior.
---
## Rule 4: Pure-fabrication classes should not contain domain logic
---
## Category
Architecture
---
## Rule
Repositories, factories, and other fabrications may orchestrate domain objects but must not implement domain business rules.
---
## Reason
Domain logic in fabrications defeats the purpose of separating concerns; business rules must remain in domain objects.
---
## Bad Example
```php
class OrderRepository
{
    public function findOverdue(): Collection
    {
        return Order::query()
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subDays(30))
            ->get()
            ->filter(fn(Order $o) => $o->total()->amount() > 100); // domain rule in repository
    }
}
```
---
## Good Example
```php
class OrderRepository
{
    public function findOverdue(): Collection
    {
        return Order::query()
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subDays(30))
            ->get();
    }
}
// Domain rule stays in domain service or entity
```
---
## Exceptions
When the domain rule is a simple filtering criterion that doesn't warrant a domain class (rare).
---
## Consequences Of Violation
Domain logic scattered in infrastructure, difficult to find and test.
---
## Rule 5: Don't fabricate unnecessarily—only introduce when cohesion/coupling demands it
---
## Category
Architecture
---
## Rule
Do not create Factory, Repository, or Service classes until there is a demonstrable need (cohesion loss or coupling increase) that justifies them.
---
## Reason
Pure fabrications add indirection and files; introducing them unnecessarily over-engineers the design.
---
## Bad Example
```php
class OrderFactory // unnecessary — simple creation
{
    public function create(int $customerId): Order
    {
        return new Order(['customer_id' => $customerId]);
    }
}
```
---
## Good Example
```php
// Direct creation is fine for simple cases
$order = new Order(customerId: $customerId);
```
---
## Exceptions
When the codebase follows a consistent convention (e.g., every aggregate has a factory) and consistency is valued over minimalism.
---
## Consequences Of Violation
Unnecessary indirection, YAGNI violation, navigation overhead.
