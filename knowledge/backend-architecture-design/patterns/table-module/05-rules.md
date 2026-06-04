## Rule 1: Use Table Module for simple, data-centric applications without complex domain logic
---
## Category
Architecture
---
## Rule
Table Module is appropriate when business logic is simple CRUD operations on database tables and a Domain Model would be over-engineering.
---
## Reason
Table Module keeps logic close to the database structure; Domain Model adds unnecessary abstraction for simple table-centric logic.
---
## Bad Example
```php
// Over-engineering: Domain Model for a simple lookup table
class Country { /* ... */ }
class CountryRepository { /* ... */ }
```
---
## Good Example
```php
class CountryModule
{
    public function getAll(): Collection
    {
        return DB::table('countries')->get();
    }
    public function getByCode(string $code): ?object
    {
        return DB::table('countries')->where('code', $code)->first();
    }
}
```
---
## Exceptions
When business logic has complex rules, invariants, and multiple interacting entities that demand a Domain Model.
---
## Consequences Of Violation
Over-engineering for simple data-centric applications.
---
## Rule 2: One Table Module class per database table
---
## Category
Architecture
---
## Rule
Create one Table Module class for each database table. The class's methods operate on the table via SQL or DB facade.
---
## Reason
One-to-one mapping between table and module keeps the code organized and predictable.
---
## Bad Example
```php
class CustomerModule
{
    public function getCustomers(): Collection { /* customers table */ }
    public function getOrders(): Collection { /* orders table */ }
    // Two tables in one module
}
```
---
## Good Example
```php
class CustomerTable
{
    public function getAll(): Collection { /* customers */ }
    public function findById(int $id): ?object { /* customers */ }
}
class OrderTable
{
    public function getAll(): Collection { /* orders */ }
    public function findByCustomer(int $customerId): Collection { /* orders */ }
}
```
---
## Exceptions
When two tables are always accessed together and splitting would create cross-module orchestration.
---
## Consequences Of Violation
Mixed table concerns, unclear module purpose.
---
## Rule 3: Table Module operates on a Record Set (collection of rows), not a single domain object
---
## Category
Architecture
---
## Rule
Table Module methods typically return Record Sets (collections of rows) rather than domain objects. The Record Set is a generic data structure, not typed.
---
## Reason
Table Module is a data-oriented pattern; returning typed domain objects would introduce Domain Model complexity that the pattern aims to avoid.
---
## Bad Example
```php
class OrderTable
{
    public function find(int $id): Order // returns typed domain object
    {
        return new Order(DB::table('orders')->find($id));
    }
}
```
---
## Good Example
```php
class OrderTable
{
    public function find(int $id): ?object // returns row object
    {
        return DB::table('orders')->find($id);
    }
}
```
---
## Exceptions
When the Row Data Gateway pattern is used to wrap individual rows.
---
## Consequences Of Violation
Unnecessary abstraction, mixing patterns inappropriately.
---
## Rule 4: Use Transaction Script to orchestrate multiple Table Modules
---
## Category
Architecture
---
## Rule
When a use case involves multiple tables, create a Transaction Script that orchestrates the relevant Table Modules.
---
## Reason
Table Modules handle single-table operations; coordinating multiple tables belongs in a use-case-specific script.
---
## Bad Example
```php
class OrderTable
{
    public function placeOrder(array $data): void
    {
        // Manually orchestrates multiple tables — SRP violation
        DB::table('orders')->insert($data['order']);
        DB::table('order_items')->insert($data['items']);
        DB::table('inventory')->decrement(...);
    }
}
```
---
## Good Example
```php
class PlaceOrderScript
{
    public function __construct(
        private OrderTable $orders,
        private OrderItemTable $items,
        private InventoryTable $inventory
    ) {}
    public function execute(OrderData $data): void
    {
        $orderId = $this->orders->insert($data->order);
        $this->items->insertForOrder($orderId, $data->items);
        $this->inventory->decrementStock($data->items);
    }
}
```
---
## Exceptions
When the table operation is self-contained (single table).
---
## Consequences Of Violation
SRP violation in Table Module, tight coupling between tables.
