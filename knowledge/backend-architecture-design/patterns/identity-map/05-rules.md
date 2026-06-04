## Rule 1: Identity Map ensures each database row is loaded only once per transaction
---
## Category
Architecture
---
## Rule
Maintain a map of loaded objects by their ID; when the same row is requested again, return the cached instance instead of querying the database.
---
## Reason
Without Identity Map, loading the same row twice creates two separate objects that can diverge in memory, causing data corruption.
---
## Bad Example
```php
$order1 = Order::find(1);
$order2 = Order::find(1);
$order1->status = 'cancelled';
$order2->status = 'completed';
// Two objects for the same row → conflicting changes
```
---
## Good Example
```php
$uow = new UnitOfWork();
$order1 = $uow->find(Order::class, 1);
$order2 = $uow->find(Order::class, 1);
// $order1 === $order2 (same instance)
```
---
## Exceptions
When data is known to be immutable (read-only reference data) and the identity map overhead isn't justified.
---
## Consequences Of Violation
Lost updates, data corruption, conflicting changes.
---
## Rule 2: Identity Map is scoped to the Unit of Work or request
---
## Category
Architecture
---
## Rule
The Identity Map lives within a Unit of Work or request scope; it is cleared at the end of the transaction/request.
---
## Reason
Cross-request Identity Map causes stale data—a long-living map returns outdated versions of objects.
---
## Bad Example
```php
class GlobalIdentityMap
{
    private static array $objects = []; // never cleared
}
```
---
## Good Example
```php
class UnitOfWork
{
    private array $identityMap = [];

    public function find(string $class, $id): ?object
    {
        $key = "$class:$id";
        if (!isset($this->identityMap[$key])) {
            $this->identityMap[$key] = $this->load($class, $id);
        }
        return $this->identityMap[$key];
    }

    public function clear(): void
    {
        $this->identityMap = [];
    }
}
```
---
## Exceptions
Read-only reference data (countries, currencies) that is stable and safe to cache globally.
---
## Consequences Of Violation
Stale data, cross-request state pollution.
---
## Rule 3: Check Identity Map before querying the database
---
## Category
Architecture
---
## Rule
The data access layer must check the Identity Map before executing a query for a known ID.
---
## Reason
Bypassing the Identity Map means the same row is loaded into a second object, defeating the map's purpose.
---
## Bad Example
```php
class OrderRepository
{
    public function find(OrderId $id): ?Order
    {
        // Direct DB query — bypasses Identity Map
        $row = DB::table('orders')->find($id);
        return $row ? new Order($row) : null;
    }
}
```
---
## Good Example
```php
class OrderRepository
{
    public function __construct(private UnitOfWork $uow) {}

    public function find(OrderId $id): ?Order
    {
        return $this->uow->find(Order::class, (string) $id);
    }
}
```
---
## Exceptions
When explicitly requesting a fresh copy (e.g., force refresh) and the stale instance is discarded.
---
## Consequences Of Violation
Duplicate objects for the same row, data divergence.
