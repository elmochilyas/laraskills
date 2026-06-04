## Rule 1: Data Mapper moves data between domain objects and the database while keeping them independent
---
## Category
Architecture
---
## Rule
The Data Mapper is a separate layer that transfers data between domain objects and the database schema. Domain objects have no knowledge of the database.
---
## Reason
Domain objects that know about the database schema (Active Record) are coupled to persistence; Data Mapper keeps them pure.
---
## Bad Example
```php
class Order extends Model
{
    // Domain logic mixed with database schema knowledge
    protected $fillable = ['total', 'customer_id', 'status'];
}
```
---
## Good Example
```php
class Order // Pure domain object
{
    public function __construct(
        private OrderId $id,
        private Money $total,
        private CustomerId $customerId,
        private OrderStatus $status
    ) {}
}

class OrderMapper
{
    public function toDatabase(Order $order): array
    {
        return [
            'id' => (string) $order->id(),
            'total' => $order->total()->amount(),
            'customer_id' => (string) $order->customerId(),
            'status' => $order->status()->value,
        ];
    }

    public function toDomain(array $row): Order
    {
        return new Order(
            OrderId::fromString($row['id']),
            new Money($row['total']),
            CustomerId::fromString($row['customer_id']),
            OrderStatus::from($row['status'])
        );
    }
}
```
---
## Exceptions
Simple CRUD applications where Active Record's coupling is an acceptable tradeoff for simplicity.
---
## Consequences Of Violation
Domain coupled to database schema, difficult to change either independently.
---
## Rule 2: Data Mapper is bidirectional (to domain and from domain)
---
## Category
Architecture
---
## Rule
The Data Mapper should provide both directions: `toDomain()` (database row → domain object) and `toDatabase()` (domain object → database row).
---
## Reason
Both directions are needed for full persistence; implementing only one direction incomplete.
---
## Bad Example
```php
class OrderMapper
{
    public function toDatabase(Order $order): array { /* ... */ }
    // No toDomain method
}
```
---
## Good Example
```php
class OrderMapper
{
    public function toDomain(array $row): Order { /* ... */ }
    public function toDatabase(Order $order): array { /* ... */ }
}
```
---
## Exceptions
When only reads or only writes are needed (CQRS with separate read/write models).
---
## Consequences Of Violation
Incomplete persistence, missing conversion direction.
---
## Rule 3: Mapper should not contain business logic
---
## Category
Architecture
---
## Rule
The Mapper only translates data formats; it must not implement or alter business rules.
---
## Reason
Business logic in the Mapper violates SRP and makes business rules untestable without database setup.
---
## Bad Example
```php
class OrderMapper
{
    public function toDomain(array $row): Order
    {
        if ($row['total'] > 1000) { // business rule in mapper
            $row['requires_approval'] = true;
        }
        return new Order(/* ... */);
    }
}
```
---
## Good Example
```php
class OrderMapper
{
    public function toDomain(array $row): Order
    {
        return new Order(
            OrderId::fromString($row['id']),
            new Money($row['total']),
            OrderStatus::from($row['status'])
        );
    }
}
```
---
## Exceptions
Default values for new fields during schema migration (temporary, with a removal ticket).
---
## Consequences Of Violation
SRP violation, business logic hidden in mappers.
