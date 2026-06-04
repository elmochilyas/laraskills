## Rule 1: Track all changes within a unit of work and commit them atomically
---
## Category
Architecture
---
## Rule
The Unit of Work maintains a list of new, dirty, and removed objects. On `commit()`, all changes are flushed in a single transaction.
---
## Reason
Without atomic commits, partial failures leave the database in an inconsistent state—some changes saved, others lost.
---
## Bad Example
```php
$order->save();
$item1->save();
$item2->save(); // What if this fails? Order saved, items not.
```
---
## Good Example
```php
$uow = new UnitOfWork();
$uow->registerNew($order);
$uow->registerNew($item1);
$uow->registerNew($item2);
$uow->commit(); // all or nothing
```
---
## Exceptions
When the ORM (Eloquent) natively handles this—but be aware of the implicit boundary.
---
## Consequences Of Violation
Partial saves, inconsistent data, manual recovery.
---
## Rule 2: Let the Unit of Work manage identity maps to avoid duplicate objects
---
## Category
Architecture
---
## Rule
The Unit of Work should maintain an identity map: loading the same entity twice returns the same instance, not a duplicate.
---
## Reason
Duplicate instances of the same database row cause conflicting changes and hard-to-trace bugs.
---
## Bad Example
```php
$order1 = Order::find(1);
$order2 = Order::find(1);
$order1->status = 'cancelled';
$order2->status = 'completed';
// Which one wins? → data corruption
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
When using Eloquent's built-in identity map (it handles this automatically within a request).
---
## Consequences Of Violation
Data corruption, conflicting changes, lost updates.
---
## Rule 3: Commit the Unit of Work at the end of the request/use case
---
## Category
Architecture
---
## Rule
Call `commit()` once at the end of the use case, not scattered throughout. Let the UoW accumulate changes during execution.
---
## Reason
Early or scattered commits break atomicity—a failure after a partial commit leaves inconsistent state.
---
## Bad Example
```php
$uow->commit(); // early commit
// more changes here...
$uow->commit(); // second commit
```
---
## Good Example
```php
// All changes registered...
$order = Order::create($data);
$uow->registerNew($order);

$payment = Payment::charge($order->total());
$uow->registerNew($payment);

$uow->commit(); // single commit at end
```
---
## Exceptions
Batch processing where intermediate commits are needed to manage memory/transaction size.
---
## Consequences Of Violation
Partial commits, inconsistent state, lost atomicity.
---
## Rule 4: Use a Unit of Work middleware for automatic transaction management
---
## Category
Architecture
---
## Rule
Wrap the use case execution in middleware that begins a transaction, executes, and either commits (success) or rolls back (failure).
---
## Reason
Manual transaction management is error-prone and leads to transactions left open or committed twice.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(Command $command): void
    {
        DB::beginTransaction();
        try {
            // ... logic ...
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
        }
    }
}
// Repeated in every handler
```
---
## Good Example
```php
class TransactionMiddleware
{
    public function handle(Command $command, callable $next): void
    {
        DB::beginTransaction();
        try {
            $next($command);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```
---
## Exceptions
Read-only operations that don't modify state.
---
## Consequences Of Violation
Scattered transaction management, forgotten rollbacks.
