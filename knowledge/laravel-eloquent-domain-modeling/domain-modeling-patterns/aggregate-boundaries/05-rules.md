# Aggregate Boundaries — Rules

---

## Rule: One Transaction Must Modify Only One Aggregate Instance
---
## Category
Architecture
---
## Rule
Never modify more than one aggregate instance within a single database transaction.
---
## Reason
An aggregate defines a consistency boundary. Modifying multiple aggregates in the same transaction suggests the boundary is incorrectly drawn and creates coupling between aggregates that should be eventually consistent.
---
## Bad Example
```php
DB::transaction(function () use ($orderId, $productId) {
    $order = Order::findOrFail($orderId);
    $order->status = 'cancelled';
    $order->save();

    $product = Product::findOrFail($productId);
    $product->restock($quantity);
    $product->save();
});
```
---
## Good Example
```php
DB::transaction(function () use ($orderId) {
    $order = Order::findOrFail($orderId);
    $order->cancel();
});

Event::dispatch(new OrderCancelled($orderId, $quantity));
// Product restocking happens in a listener, eventually consistent
```
---
## Exceptions
Technical transactions that insert related database rows belonging to the same aggregate root. Never for modifying two different aggregate roots.
---
## Consequences Of Violation
Tight coupling between aggregates, reduced scalability due to long-held locks, and hidden dependencies that prevent independent deployment.

---

## Rule: Reference Other Aggregates by Root ID, Not Object Reference
---
## Category
Architecture
---
## Rule
Always store the root ID of another aggregate when establishing cross-aggregate references. Never store an Eloquent object reference or belong-to relationship to another aggregate's internal entity.
---
## Reason
Object references create accidental coupling across aggregate boundaries, enable unintended cascading saves, and violate the rule that external code must only reference the aggregate root.
---
## Bad Example
```php
class OrderItem extends Model
{
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    // BelongsTo to Product gives a full ORM reference to another aggregate
}
```
---
## Good Example
```php
class OrderItem extends Model
{
    // Store only the root ID
    protected $fillable = ['product_id', 'quantity', 'unit_price_cents'];
}
```
---
## Exceptions
When the referenced aggregate is part of the same bounded context and the relationship is read-only for display purposes. Never use for writes.
---
## Consequences Of Violation
Accidental cross-aggregate writes, violated invariants, and subtle bugs when `save()` cascades through relationship references.

---

## Rule: Use `DB::transaction()` to Wrap Aggregate Operations
---
## Category
Reliability
---
## Rule
Always wrap aggregate root modifications inside `DB::transaction()` to ensure atomicity of all state changes within the aggregate boundary.
---
## Reason
Eloquent's `save()` on the root does not automatically persist children atomically. A failure mid-way through a multi-step aggregate operation can leave the database in an inconsistent state without an explicit transaction.
---
## Bad Example
```php
public function addItem(Product $product, int $quantity): void
{
    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();
    // No transaction — if save fails, the item is already persisted
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
Read-only operations or queries that don't modify state. Never skip for write paths.
---
## Consequences Of Violation
Database inconsistency: orphaned child records, partially written state, and invariants that fail silently.

---

## Rule: Never Expose Internal Child Collections for Direct Modification
---
## Category
Design
---
## Rule
Do not return child Eloquent `HasMany` relationships from the aggregate root for external mutation. Provide explicit domain methods such as `addItem()` and `removeItem()` instead.
---
## Reason
Exposing raw relationship collections allows callers to bypass the root's invariant enforcement. The root exists specifically to guard access to its internal entities.
---
## Bad Example
```php
// In a controller
$order = Order::find($id);
$order->items()->create(['product_id' => 1, 'quantity' => 5]);
// Total is NOT recalculated — invariant violated
```
---
## Good Example
```php
// In the Order aggregate root
public function addItem(Product $product, int $quantity): void
{
    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();
}
```
---
## Exceptions
Read-only access for display in views or API responses, where no mutation occurs.
---
## Consequences Of Violation
Invariants are silently bypassed, leading to inconsistent aggregate state and business rule violations that are difficult to trace.

---

## Rule: Keep Aggregate Boundaries Small
---
## Category
Scalability
---
## Rule
Design aggregates to include only the entities that must be transactionally consistent. If an aggregate contains more than a handful of child entities, question whether all truly need atomic consistency.
---
## Reason
Large aggregates increase transaction contention, degrade write throughput, and load more data into memory than necessary. Smaller aggregates perform better and are easier to reason about.
---
## Bad Example
```php
class Order extends Model // Aggregate root with EVERYTHING
{
    public function items(): HasMany { ... }
    public function payments(): HasMany { ... }
    public function shipments(): HasMany { ... }
    public function notes(): HasMany { ... }
    public function auditLogs(): HasMany { ... }
    // 5+ child types — too large, most should be separate aggregates
}
```
---
## Good Example
```php
class Order extends Model // Aggregate root — only items
{
    public function items(): HasMany { ... }
}

// Payments, Shipments, Notes are separate aggregates referenced by ID
```
---
## Exceptions
When business requirements truly demand atomic consistency across many child entities (e.g., financial settlements with legal invariants). Rare.
---
## Consequences Of Violation
Performance degradation from oversized transactions, increased deadlock probability, and difficulty reasoning about consistency boundaries.

---

## Rule: Validate Invariants Before and After Every Aggregate Mutation
---
## Category
Reliability
---
## Rule
Check aggregate invariants at both entry and exit of every aggregate root domain method. Throw a domain-specific exception if any invariant is violated.
---
## Reason
Aggregate invariants are the business rules that must always hold true. Validating only at entry allows internal logic to corrupt state. Validating only at exit allows bad input to reach internal operations.
---
## Bad Example
```php
public function addItem(Product $product, int $quantity): void
{
    // No invariant check
    $this->items()->create([...]);
    $this->save();
}
```
---
## Good Example
```php
public function addItem(Product $product, int $quantity): void
{
    if ($this->status !== OrderStatus::Pending) {
        throw new OrderCannotBeModifiedException($this->id);
    }
    if ($quantity <= 0) {
        throw new InvalidQuantityException($quantity);
    }

    $this->items()->create([...]);
    $this->recalculateTotal();
    $this->save();

    if ($this->total_cents <= 0) {
        throw new InvalidAggregateStateException('Order total must be positive.');
    }
}
```
---
## Exceptions
Simple read or query methods that do not modify state.
---
## Consequences Of Violation
Invalid domain state goes undetected, corrupting data and causing subtle business logic failures downstream.

---

## Rule: Use `push()` for Atomic Root + Children Saves Only Within a Transaction
---
## Category
Reliability
---
## Rule
Use `$model->push()` to persist an aggregate root and its children atomically, but always wrap it inside an explicit `DB::transaction()` block.
---
## Reason
`push()` recursively saves the root and all loaded, dirty relationships. Without a wrapping transaction, a failure saving a child leaves the root already persisted — creating a partial write.
---
## Bad Example
```php
$order->save();
$order->items->each(fn ($item) => $item->save());
// No transaction — if an item save fails, the order is already saved
```
---
## Good Example
```php
DB::transaction(function () use ($order) {
    $order->push();
});
```
---
## Exceptions
Single-model persistence where no child relationships exist.
---
## Consequences Of Violation
Orphaned or partially-persisted aggregate state, requiring manual cleanup and data reconciliation.

---

## Rule: Do Not Cascade Persistence Across Aggregate Boundaries
---
## Category
Architecture
---
## Rule
Never configure Eloquent relationship cascades (`cascade` on migration foreign keys or `touch` on belongs-to) that cross aggregate boundaries.
---
## Reason
Database-level cascades silently delete or update records across aggregate boundaries, bypassing domain invariant enforcement and creating hard-to-trace data loss.
---
## Bad Example
```php
// Migration on order_items table
$table->foreignId('order_id')
    ->constrained()
    ->cascadeOnDelete(); // Silently deletes items when order is deleted
```
---
## Good Example
```php
// Migration on order_items table
$table->foreignId('order_id')
    ->constrained();
    // No cascade — explicit domain logic handles cleanup

// In Order aggregate root:
public function remove(): void
{
    $this->items()->delete();
    $this->delete();
}
```
---
## Exceptions
Technical referential integrity within the same aggregate (root → children). Never across aggregates.
---
## Consequences Of Violation
Silent data loss across aggregate boundaries, violated invariants, and debugging nightmares when records disappear without application code involvement.
