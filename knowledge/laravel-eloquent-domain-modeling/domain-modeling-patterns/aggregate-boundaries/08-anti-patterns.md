# Aggregate Boundaries — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Aggregate Boundaries |
| Focus | Anti-patterns in aggregate boundary definition and enforcement |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Multiple Aggregate Modifications in One Transaction | Architecture | Critical |
| 2 | Object References Across Aggregate Boundaries | Architecture | High |
| 3 | Missing Transaction Wrapping for Aggregate Operations | Reliability | Critical |
| 4 | Exposed Child Collections for Direct Mutation | Design | High |
| 5 | Oversized Aggregates With Too Many Child Types | Scalability | Medium |
| 6 | No Invariant Validation on Aggregate Mutations | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- Missing `DB::transaction()` wrapping is the most common reliability issue — aggregate operations partially persist
- Cross-aggregate Eloquent relationships (BelongsTo across boundaries) are the primary source of accidental cascading writes
- Child collections are frequently exposed for direct `->create()` calls, bypassing root invariant enforcement

---

## 1. Multiple Aggregate Modifications in One Transaction

### Category
Architecture

### Description
Modifying two or more aggregate instances within a single database transaction. This creates coupling between aggregates that should be eventually consistent and violates the DDD principle of one transaction per aggregate.

### Why It Happens
The developer needs both operations to succeed or fail together for data consistency. The database supports transactions, so it seems natural to wrap both operations. The developer may not recognize that the operation spans two separate consistency boundaries.

### Warning Signs
- `DB::transaction()` wrapping operations on two different models (e.g., `Order` and `Product`)
- Controller methods that save changes to multiple models in one transaction
- Service methods accepting two aggregate root instances and saving both
- Comments like "these must be saved together" between conceptually separate operations
- Event listeners that modify another aggregate within the same transaction

### Why Harmful
- Creates tight coupling between aggregates that should be independently scalable
- Increases transaction scope, leading to longer lock times and potential deadlocks
- Violates aggregate boundary — each aggregate should enforce its own consistency
- Makes it impossible to deploy aggregates independently
- Prevents eventual consistency patterns that improve system throughput

### Consequences
- Deadlocks under concurrent access when two aggregates are locked in a single transaction
- Reduced scalability: one slow aggregate operation blocks another
- Coupling that prevents independent deployment or evolution of aggregates
- Difficulty tracing which aggregates are modified together
- Transaction rollbacks that cascade across unintended boundaries

### Preferred Alternative
```php
// First aggregate in its own transaction
DB::transaction(function () use ($order) {
    $order->cancel();
});

// Second aggregate — eventually consistent via domain event
Event::dispatch(new OrderCancelled($order->id));
```

### Refactoring Strategy
1. Identify transactions modifying multiple aggregate roots
2. Separate into per-aggregate transactions
3. Add domain events for cross-aggregate coordination (eventual consistency)
4. Verify that eventual consistency is acceptable for the business operation
5. Add compensating actions for failure scenarios if needed

### Detection Checklist
- [ ] Search for `DB::transaction` blocks and count the distinct aggregate roots modified
- [ ] Check service/action classes for operations on multiple models
- [ ] Review event listeners for modifying additional aggregates within the same transaction
- [ ] Verify that each domain operation only touches one aggregate root
- [ ] Audit test transactions for multi-aggregate modifications

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — One Transaction Must Modify Only One Aggregate Instance |
| Decision Tree | `07-decision-trees.md` — Transaction Boundary Alignment |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |

---

## 2. Object References Across Aggregate Boundaries

### Category
Architecture

### Description
Defining Eloquent `BelongsTo`, `HasMany`, or `BelongsToMany` relationships that reference another aggregate's root or internal entity directly. The ORM relationship creates an implicit object reference that enables accidental cross-aggregate modification.

### Why It Happens
Eloquent's relationship system encourages defining all foreign key relationships. It's natural to add `belongsTo(Product::class)` to `OrderItem` since the database has a `product_id` column. The developer may not recognize `Product` as a separate aggregate.

### Warning Signs
- `belongsTo(OtherAggregate::class)` relationships defined between aggregates
- `HasMany` across aggregate boundaries
- Cascading saves or touches that propagate across aggregate boundaries
- `cascadeOnDelete()` foreign keys in migrations between aggregate tables
- Application code that loads one aggregate through another's relationship
- N+1 queries loading related aggregate data via ORM relationships

### Why Harmful
- `$orderItem->product->save()` accidentally modifies the Product aggregate
- Cascade deletes silently remove records from another aggregate
- The relationship creates implicit coupling that's hard to discover or remove
- ORM lazy loading loads the other aggregate's data unnecessarily
- Transaction boundaries are blurred: saving an Order may cascade-save a Product

### Consequences
- Accidental writes to other aggregates during standard operations
- Orphaned data from cascade deletes that bypass domain logic
- Performance degradation from loading related aggregates through naive relationship access
- Difficult to refactor aggregate boundaries because relationships are deeply embedded
- Race conditions when two aggregates are modified through a single relationship chain

### Preferred Alternative
```php
class OrderItem extends Model
{
    // Store only the root ID — no Eloquent relationship
    protected $fillable = ['product_id', 'quantity', 'unit_price_cents'];
}
```

### Refactoring Strategy
1. Identify Eloquent relationships that cross aggregate boundaries
2. Remove the relationship definitions from the model
3. Replace `$item->product` with explicit queries by ID: `Product::find($item->product_id)`
4. For read-side convenience, add query scopes or separate read models
5. Remove cascade foreign keys from migrations

### Detection Checklist
- [ ] Search for `belongsTo(` and `HasMany(` that reference models in other aggregates
- [ ] Check migration foreign keys for `cascadeOnDelete()` across boundaries
- [ ] Search for chain access: `$order->items->first()->product->...`
- [ ] Verify that child entities only reference the root by ID
- [ ] Audit `touch` configuration for cross-aggregate propagation

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Reference Other Aggregates by Root ID, Not Object Reference |
| Decision Tree | `07-decision-trees.md` — Cross-Aggregate Reference Strategy |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |

---

## 3. Missing Transaction Wrapping for Aggregate Operations

### Category
Reliability

### Description
Performing multi-step aggregate operations (creating children, updating totals, saving the root) without wrapping them in `DB::transaction()`. A failure mid-operation leaves the database in an inconsistent state with partially persisted data.

### Why It Happens
Developers assume Eloquent's `save()` is atomic. The root's `save()` may succeed while a child `save()` fails, and the root's changes remain committed. The `DB::transaction()` boilerplate seems optional during development.

### Warning Signs
- Aggregate root methods that call `$this->save()` after child operations without transaction wrapping
- Domain methods that call `$this->items()->create()` and `$this->save()` separately
- Orphaned child records found in the database after failed operations
- Support tickets about "order saved but items missing"
- Partial data written to database during error conditions
- No `DB::transaction()` usage in aggregate root domain methods

### Why Harmful
- Partial writes: the root may be saved but children not, or vice versa
- Inconsistent state: derived attributes (totals) may not be updated if a child save fails
- Manual data reconciliation required to fix partial writes
- Test suite may not catch the issue if it doesn't simulate failure scenarios
- Customer-facing data inconsistencies that erode trust

### Consequences
- Orphaned child records (order items without an order, or vice versa)
- Incorrect totals displayed to users after partial failure
- Data cleanup scripts needed to reconcile inconsistent state
- Hard-to-debug failures that only appear under specific error conditions
- Database integrity constraints may prevent the operation entirely, causing unexpected 500 errors

### Preferred Alternative
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

### Refactoring Strategy
1. Identify aggregate root methods that modify both the root and children without transactions
2. Wrap each in `DB::transaction()`
3. Ensure domain events are dispatched after the transaction commits (not inside)
4. Verify that failure handling is consistent across all aggregate operations
5. Add tests that simulate failure scenarios and verify rollback

### Detection Checklist
- [ ] Search for `$this->items()->create(` in model methods — check if wrapped in transaction
- [ ] Search for `$this->push()` calls — confirm they're wrapped in `DB::transaction()`
- [ ] Review aggregate root methods for multiple `save()` calls without transaction wrapping
- [ ] Check for orphaned child records in production data
- [ ] Verify domain events are dispatched after transaction commit, not inside

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use `DB::transaction()` to Wrap Aggregate Operations |
| Rule | `05-rules.md` — Use `push()` for Atomic Root + Children Saves Only Within a Transaction |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |

---

## 4. Exposed Child Collections for Direct Mutation

### Category
Design

### Description
Exposing child `HasMany` relationships from the aggregate root so external code can directly `create()`, `update()`, or `delete()` children. Callers can bypass the root's invariant enforcement by accessing `$order->items()` directly.

### Why It Happens
HasMany relationships are the standard Eloquent way to define one-to-many relationships, and they automatically expose `create()` and `save()` methods. Developers may not realize these methods bypass invariant enforcement. Eloquent's API encourages direct relationship access.

### Warning Signs
- Controller code calling `$order->items()->create([...])` instead of `$order->addItem(...)`
- `$order->items->first()->delete()` in application logic
- Children created or deleted without the root recalculating derived values
- The aggregate root has `HasMany` relationships but no corresponding domain methods (addItem, removeItem)
- Code that iterates $order->items and modifies each one individually
- Business rules about children enforced in controllers instead of the root

### Why Harmful
- Every direct child mutation is an opportunity to bypass invariant enforcement
- Derived attributes (totals, counts) become stale when children are modified without root notification
- Multiple entry points for the same operation make it hard to ensure consistency
- Adding new invariants requires finding all direct mutation sites
- The aggregate root becomes a pass-through container rather than an enforcement boundary

### Consequences
- Inconsistent derived state (total doesn't match sum of line items)
- Business rules ignored for some code paths
- Controllers duplicating logic that should be in the root
- Difficult to add new invariants without auditing every child modification site
- Refactoring to encapsulate children requires changes across the codebase

### Preferred Alternative
```php
// Aggregate root provides guarded access
public function addItem(Product $product, int $quantity): void
{
    DB::transaction(function () use ($product, $quantity) {
        $this->items()->create([...]);
        $this->recalculateTotal();
        $this->save();
    });
}
```

### Refactoring Strategy
1. Identify all direct child mutation sites: `$root->items()->create()`, `$root->items->first()->delete()`
2. For each mutation pattern, add a corresponding domain method on the aggregate root
3. Update callers to use the domain methods
4. Consider adding linting rules to warn against direct `HasMany` mutation calls
5. Document the invariant enforcement boundary in the root's docblock

### Detection Checklist
- [ ] Search for `->items()->create(`, `->items()->delete(` in controllers and services
- [ ] Search for `->items->each(` with mutation operations
- [ ] Check aggregate root for missing domain methods (addItem, removeItem, updateItem)
- [ ] Verify derived attributes recalculate after child modifications
- [ ] Test direct child mutation via `create()` — does the root detect the change?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Expose Internal Child Collections for Direct Modification |
| Decision Tree | `07-decision-trees.md` — Aggregate Boundary Scope |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |

---

## 5. Oversized Aggregates With Too Many Child Types

### Category
Scalability

### Description
An aggregate root that includes many child entity types (items, payments, shipments, notes, audit logs, disputes) in the same consistency boundary. The aggregate becomes large, slow to load, and transactionally contentious.

### Why It Happens
The domain model closely mirrors the database schema where a table has many related tables. "They all belong to the Order" — the developer assumes everything related to Order must be in the same aggregate. The cost of large aggregates isn't obvious until performance degrades.

### Warning Signs
- An aggregate root with 4+ `HasMany` relationship types
- Loading the aggregate for a simple operation requires loading many child records
- Transaction timeouts or deadlocks on aggregate-busy tables
- Controllers or services that load the full aggregate but only use one child type
- "Order" model with 20+ relationships defined
- Performance issues traced to aggregate loading for simple status checks

### Why Harmful
- Loading the full aggregate is expensive — every child type loads data even when not needed
- Transaction contention increases as more rows are locked per operation
- Concurrent users on the same aggregate cause deadlocks more frequently
- Simple operations (checking order status) require loading all children
- The aggregate boundary is too coarse, coupling unrelated concerns together

### Consequences
- Slow page loads for operations that only need a subset of aggregate data
- Database deadlocks under concurrent write load on the aggregate
- Difficulty reasoning about consistency: what invariants really span all child types?
- Performance fixes involve loading fewer child types, which adds conditional loading logic
- Migration to smaller aggregates requires significant refactoring

### Preferred Alternative
```php
// Small aggregate — only items need transactional consistency with order
class Order extends Model
{
    public function items(): HasMany { ... }
}

// Payments, Shipments, Notes are separate aggregate roots
// referenced by order_id
class Payment extends Model { ... }
class Shipment extends Model { ... }
```

### Refactoring Strategy
1. Identify aggregate roots with many child types (4+ `HasMany` relationships)
2. For each child type, determine if it truly needs transactional consistency with the root
3. Extract independent child types into their own aggregate roots
4. Reference the original root by ID from the new aggregates
5. Use domain events for eventual consistency between the new aggregates

### Detection Checklist
- [ ] Count `HasMany` relationships on aggregate root models
- [ ] Review transaction scope for each aggregate operation — do all children need to be loaded?
- [ ] Check for deadlocks in database logs on aggregate tables
- [ ] Profile aggregate loading time for complex operations
- [ ] Audit whether each child type truly requires atomic consistency with the root

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Aggregate Boundaries Small |
| Decision Tree | `07-decision-trees.md` — Aggregate Boundary Scope |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |

---

## 6. No Invariant Validation on Aggregate Mutations

### Category
Reliability

### Description
Aggregate root domain methods that do not validate business invariants before or after mutation. Children can be added to a cancelled order, negative quantities can be assigned, and inconsistent state can be persisted without detection.

### Why It Happens
Developers may not know the full set of invariants for the aggregate. Invariant validation is seen as a "controller concern" rather than a model concern. The data seems "close enough" to valid, and database constraints are expected to catch the rest.

### Warning Signs
- Root domain methods that accept any input without precondition checks
- No domain-specific exceptions thrown from aggregate methods
- Business rule violations discovered during QA or production use
- Invariant logic duplicated in controllers "just in case"
- Database constraint violations indicating invalid state persisted
- Support tickets about orders in impossible states (paid but also cancelled, shipped but not paid)

### Why Harmful
- Invalid aggregate state can persist and flow through the system
- Downstream processes (reporting, billing, shipping) fail when they encounter invalid state
- Business rules are only enforced at the UI level, not the domain level
- Database constraints become the invariant enforcement (too late, at persistence)
- The aggregate doesn't guarantee its own consistency — external checks are required

### Consequences
- Corrupted business data requiring manual remediation
- Downstream system failures from unexpected aggregate states
- Business reporting with impossible or inconsistent data
- Hard-to-debug cascading failures from invariant violations
- Legal or regulatory implications from incorrect financial data

### Preferred Alternative
```php
public function addItem(Product $product, int $quantity): void
{
    if ($this->status !== OrderStatus::Pending) {
        throw new OrderCannotBeModifiedException($this->id);
    }
    if ($quantity <= 0) {
        throw new InvalidQuantityException($quantity);
    }

    DB::transaction(function () use ($product, $quantity) {
        $this->items()->create([...]);
        $this->recalculateTotal();
        $this->save();
    });

    if ($this->total_cents <= 0) {
        throw new InvalidAggregateStateException('Order total must be positive.');
    }
}
```

### Refactoring Strategy
1. Document all invariants for each aggregate (truth table of valid states)
2. Add precondition checks at the start of every domain method
3. Add postcondition checks after every mutation
4. Use domain-specific exceptions (not generic `\InvalidArgumentException`)
5. Add tests that verify invariants are enforced for valid and invalid inputs

### Detection Checklist
- [ ] Review aggregate root methods for precondition validation
- [ ] Search for domain-specific exception classes — do they cover all invariant violations?
- [ ] Check if `\DomainException` or custom exceptions are thrown from aggregate methods
- [ ] Audit database records for states that should be impossible
- [ ] Test invalid state transitions and verify they throw exceptions

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Validate Invariants Before and After Every Aggregate Mutation |
| Skill | `06-skills.md` — Identify and Define an Aggregate Boundary |
