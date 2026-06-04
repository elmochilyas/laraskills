# Aggregate Roots — Rules

---

## Rule: Expose Child Entities Only Through Aggregate Root Methods
---
## Category
Architecture
---
## Rule
Never allow external code to directly create, update, or delete child entities without going through an explicit method on the aggregate root.
---
## Reason
The aggregate root exists specifically to guard invariants covering the entire consistency boundary. Direct child mutation bypasses invariant enforcement, allowing inconsistent state to enter the system.
---
## Bad Example
```php
// In a controller
$order = Order::find($id);
$order->items()->create(['product_id' => 1, 'quantity' => 5]);
// Total not recalculated — invariant violated
```
---
## Good Example
```php
class Order extends Model
{
    public function addItem(Product $product, int $quantity): OrderItem
    {
        $item = $this->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price_cents' => $product->price_cents,
        ]);
        $this->recalculateTotal();
        $this->save();
        return $item;
    }
}

// In a controller
$order->addItem($product, $quantity);
```
---
## Exceptions
Read-only access to child data for display (views, API responses). Never for writes.
---
## Consequences Of Violation
Inconsistent aggregate state where invariants are silently violated, leading to business rule breaches and data corruption.

---

## Rule: Reference Other Aggregates Only by Their Root ID
---
## Category
Architecture
---
## Rule
Store only the ID of another aggregate root when establishing cross-aggregate references. Never store a full Eloquent relationship or object reference to another aggregate.
---
## Reason
Object references create implicit coupling, enable accidental cross-aggregate saves, and violate the principle that external code must only access aggregates through their root ID.
---
## Bad Example
```php
class Order extends Model
{
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
        // Full ORM reference to another aggregate — enables cascading saves
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    // Store only the ID
    protected $fillable = ['customer_id', 'status', 'total_cents'];

    public function customerId(): int
    {
        return $this->customer_id;
    }
}
```
---
## Exceptions
Within the same bounded context, read-only BelongsTo for query convenience may be acceptable — but guarded against accidental writes.
---
## Consequences Of Violation
Accidental cross-aggregate persistence, violated invariants in the referenced aggregate, and tight coupling that prevents independent evolution.

---

## Rule: Keep Aggregate Roots Small — Limit Child Entity Types
---
## Category
Design
---
## Rule
Limit the child entity types within an aggregate root to only those that must be transactionally consistent. Extract independent entities into their own aggregates.
---
## Reason
Large aggregates with many child types increase transaction contention, reduce write throughput, and complicate reasoning about consistency. Smaller aggregates are more performant and maintainable.
---
## Bad Example
```php
class Order extends Model
{
    public function items(): HasMany { ... }
    public function payments(): HasMany { ... }
    public function notes(): HasMany { ... }
    public function shipments(): HasMany { ... }
    public function disputes(): HasMany { ... }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function items(): HasMany { ... }
}

// Payments, Shipments, Disputes are separate aggregate roots
class Payment extends Model { ... }
class Shipment extends Model { ... }
```
---
## Exceptions
When legal or financial regulations demand atomic consistency across what would otherwise be separate aggregates. Rare.
---
## Consequences Of Violation
Performance bottlenecks from oversized transactions, increased deadlock probability, and a monolithic root that violates the Single Responsibility Principle.

---

## Rule: Enforce Invariants at Both Entry and Exit of Root Methods
---
## Category
Reliability
---
## Rule
Validate all aggregate invariants at the start and end of every aggregate root domain method, throwing a domain-specific exception on violation.
---
## Reason
Entry guards reject invalid operations early; exit guards ensure internal logic hasn't corrupted state. This double-validation ensures the aggregate is never left in an invalid state.
---
## Bad Example
```php
public function addItem(Product $product, int $quantity): void
{
    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();
    // No invariant checks at all
}
```
---
## Good Example
```php
public function addItem(Product $product, int $quantity): void
{
    if (! $this->canBeModified()) {
        throw new AggregateLockedException($this->id);
    }
    if ($quantity <= 0) {
        throw new InvalidQuantityException($quantity);
    }

    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();

    if ($this->total_cents <= 0) {
        throw new AggregateStateException('Total must be positive.');
    }
}
```
---
## Exceptions
Query methods that do not modify aggregate state.
---
## Consequences Of Violation
Business rule violations persist silently in the database, requiring costly data remediation and potentially causing downstream processing failures.

---

## Rule: Use `DB::transaction()` for All Aggregate Root Mutations
---
## Category
Reliability
---
## Rule
Wrap every aggregate root mutation that modifies the root and its children inside a `DB::transaction()` block.
---
## Reason
Eloquent does not automatically provide atomicity for root + children saves. Without an explicit transaction, a partial failure leaves inconsistent state in the database.
---
## Bad Example
```php
public function addItem(Product $product, int $quantity): void
{
    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();
}
```
---
## Good Example
```php
public function addItem(Product $product, int $quantity): void
{
    DB::transaction(function () use ($product, $quantity) {
        $this->items()->create([...]);
        $this->recalculateTotal();
        $this->save();
    });
}
```
---
## Exceptions
Read-only methods that query without mutation.
---
## Consequences Of Violation
Partially persisted aggregate state, orphaned child records, and database inconsistency that requires manual reconciliation.

---

## Rule: Never Return Child Collections for External Iteration
---
## Category
Design
---
## Rule
Do not expose child `HasMany` relationship collections from the aggregate root that allow external code to iterate and mutate children arbitrarily.
---
## Reason
Returning the raw collection tempts callers to perform operations that bypass the root's invariant enforcement, leading to inconsistent aggregate state.
---
## Bad Example
```php
// In a controller
foreach ($order->items as $item) {
    if ($item->product_id === $productId) {
        $item->delete(); // Bypasses root invariants
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function removeItem(int $itemId): void
    {
        $this->items()->where('id', $itemId)->delete();
        $this->recalculateTotal();
        $this->save();
    }
}

// In a controller
$order->removeItem($itemId);
```
---
## Exceptions
Read-only iteration for display purposes where no mutation occurs.
---
## Consequences Of Violation
Invariant violations that are difficult to trace, as mutations happen outside the root's control and may not recalculate derived state.

---

## Rule: Name Aggregate Root Methods Using Ubiquitous Language
---
## Category
Maintainability
---
## Rule
Name aggregate root methods using the domain's ubiquitous language terms that stakeholders recognize, not technical database language.
---
## Reason
Ubiquitous language bridges the gap between domain experts and developers. When code uses business terms like `fulfill()`, `cancel()`, or `archive()` instead of `updateStatus('fulfilled')`, the code becomes self-documenting and aligns with business conversations.
---
## Bad Example
```php
class Order extends Model
{
    public function updateStatus(string $status): void
    {
        $this->status = $status;
        $this->save();
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function fulfill(): void
    {
        $this->status = 'fulfilled';
        $this->fulfilled_at = now();
        $this->save();
    }

    public function cancel(string $reason): void
    {
        $this->status = 'cancelled';
        $this->cancellation_reason = $reason;
        $this->save();
    }
}
```
---
## Exceptions
Technical infrastructure classes where domain language is irrelevant.
---
## Consequences Of Violation
Code that is hard to map to business requirements, increased communication overhead, and confusion when new developers join the project.

---

## Rule: Validate Preconditions Before Calling `save()` on Children
---
## Category
Reliability
---
## Rule
Check all domain preconditions before any child entity is persisted within an aggregate root method, not after.
---
## Reason
Persisting a child before precondition validation means the child may be saved even if the transaction later rolls back — or worse, never rolls back because validation happens after the write.
---
## Bad Example
```php
public function addItem(Product $product, int $quantity): void
{
    $item = $this->items()->create([...]); // Persisted immediately

    if (! $this->canAcceptMoreItems()) {
        throw new OrderCapacityExceededException();
        // Item is already in the database!
    }
}
```
---
## Good Example
```php
public function addItem(Product $product, int $quantity): void
{
    if (! $this->canAcceptMoreItems()) {
        throw new OrderCapacityExceededException();
    }

    DB::transaction(function () use ($product, $quantity) {
        $this->items()->create([...]);
        $this->recalculateTotal();
        $this->save();
    });
}
```
---
## Exceptions
No common exceptions. Validate first, persist second.
---
## Consequences Of Violation
Orphaned child records or duplicate data when preconditions fail after partial persistence, requiring manual cleanup and reconciliation.
