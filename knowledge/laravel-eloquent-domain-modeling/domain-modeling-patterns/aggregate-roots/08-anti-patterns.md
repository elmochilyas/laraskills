# Aggregate Roots — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Aggregate Roots |
| Focus | Anti-patterns in aggregate root design and implementation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Exposed Child Collections for Direct External Mutation | Architecture | Critical |
| 2 | Missing Transaction Wrapping for Root Operations | Reliability | Critical |
| 3 | Object References Instead of Root ID for Other Aggregates | Architecture | High |
| 4 | No Invariant Enforcement in Root Methods | Reliability | High |
| 5 | Oversized Root With Too Many Child Types | Design | Medium |
| 6 | Technical Method Names Instead of Ubiquitous Language | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- Eloquent's `HasMany` relationship API makes it too easy to expose child collections for direct mutation
- `DB::transaction()` is frequently omitted in root domain methods, leading to partial persistence
- Root methods with generic names like `updateStatus()` miss the opportunity for domain-language alignment

---

## 1. Exposed Child Collections for Direct External Mutation

### Category
Architecture

### Description
The aggregate root's `HasMany` relationship is publicly accessible, allowing external code to directly `create()`, `update()`, or `delete()` child entities. Callers bypass the root's invariant enforcement by mutating children through the raw relationship.

### Why It Happens
Eloquent encourages defining `HasMany` relationships as public methods. Developers naturally call `$order->items()->create()` — it's the standard Eloquent pattern. The invariant enforcement role of the aggregate root may not be front of mind.

### Warning Signs
- `$root->children()->create()` in controllers, services, or actions
- `$root->children->each(fn ($c) => $c->update(...))` patterns
- `$root->children->first()->delete()` bypassing root methods
- The root has `HasMany` relationships but no `add*()`, `remove*()`, or `update*()` domain methods
- Business rules about children are implemented in the controller layer
- Derived attributes (totals, counts) are stale after direct child mutations

### Why Harmful
- Every direct child mutation is a potential invariant bypass
- Derived state (totals, balances, counts) becomes inconsistent
- Multiple entry points for child modification make audit and enforcement impossible
- Adding new invariants requires finding every direct mutation site scattered across the codebase
- The aggregate root is no longer the single authority for its boundary

### Consequences
- Inconsistent aggregate state: totals don't match sum of children, counts are wrong
- Business rules silently ignored for some mutation paths
- Regression bugs when new invariants are added but direct mutation sites are missed
- Controllers become fat with duplicated business logic for child operations
- Refactoring to encapsulate children requires codebase-wide changes

### Preferred Alternative
```php
class Order extends Model
{
    public function addItem(Product $product, int $quantity): void
    {
        DB::transaction(function () use ($product, $quantity) {
            $this->items()->create([...]);
            $this->recalculateTotal();
            $this->save();
        });
    }

    public function removeItem(int $itemId): void
    {
        DB::transaction(function () use ($itemId) {
            $this->items()->where('id', $itemId)->delete();
            $this->recalculateTotal();
            $this->save();
        });
    }
}
```

### Refactoring Strategy
1. Search for all `$root->children()->create(...)`, `$root->children->each(...)`, and direct child modifications
2. For each pattern, add a corresponding domain method on the aggregate root
3. Update callers to use the domain method
4. Make child relationship `protected` or add docblock warnings about direct access
5. Add tests at the aggregate root level for child mutation invariants

### Detection Checklist
- [ ] Search for `->items()->create(`, `->items()->delete(` in code outside the root model
- [ ] Search for `->items->` followed by mutation operations
- [ ] Check if the root has domain methods for each type of child mutation
- [ ] Verify derived attributes after each mutation path
- [ ] Test creating/removing children through both the relationship and root methods

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Expose Child Entities Only Through Aggregate Root Methods |
| Rule | `05-rules.md` — Never Return Child Collections for External Iteration |
| Decision Tree | `07-decision-trees.md` — Child Access Strategy |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |

---

## 2. Missing Transaction Wrapping for Root Operations

### Category
Reliability

### Description
Aggregate root methods that modify both the root and its children without wrapping the operation in `DB::transaction()`. A failure mid-way leaves the database with partially persisted state.

### Why It Happens
Developers assume `save()` is sufficient. Eloquent's `push()` method seems like it handles atomicity. Transaction boilerplate is often skipped during quick iterations.

### Warning Signs
- Root methods that call `$this->save()` after `$this->items()->create()` without transaction wrapping
- `push()` called without an enclosing `DB::transaction()`
- Orphaned child records found in production data
- Partial data written during error conditions (root saved, children not, or vice versa)
- Event listeners that receive inconsistent aggregate state
- Tests that fail due to stale or partially persisted data

### Why Harmful
- The root may be persisted but children not, or vice versa, on failure
- Derived attributes (totals) may be out of sync with actual children
- Downstream processes consume inconsistent data
- Manual data reconciliation required to fix partial writes
- The aggregate's consistency guarantee is broken — atomicity is not enforced

### Consequences
- Orphaned child records in the database
- Incorrect derived values displayed to users or used in business logic
- Data cleanup scripts required after production incidents
- Hard-to-reproduce bugs that only appear under specific failure scenarios
- Loss of trust in data accuracy

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
1. Identify all root methods that modify root and children without transactions
2. Wrap each in `DB::transaction()`
3. Move domain event dispatching to after transaction commit (use `afterCommit()`)
4. Verify that all root methods have consistent transaction handling
5. Add failure-scenario tests to verify atomicity

### Detection Checklist
- [ ] Check root methods for `DB::transaction()` wrapping when root + children are modified
- [ ] Search for `$this->push()` calls and confirm they're inside `DB::transaction()`
- [ ] Review service-level code that calls root methods for own transaction management
- [ ] Check for event dispatch inside transactions that should be after commit
- [ ] Test failure scenarios (DB exception mid-operation) and verify rollback

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use `DB::transaction()` for All Aggregate Root Mutations |
| Rule | `05-rules.md` — Validate Preconditions Before Calling `save()` on Children |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |

---

## 3. Object References Instead of Root ID for Other Aggregates

### Category
Architecture

### Description
Defining Eloquent `BelongsTo` relationships from one aggregate to another's root or internal entity, creating an object reference that enables accidental cross-aggregate modification and cascading saves.

### Why It Happens
Laravel's Eloquent ORM encourages defining foreign-key relationships as object references. The database has a `customer_id` column, so adding `belongsTo(Customer::class)` seems natural. The aggregate boundary concept is not considered during relationship definition.

### Warning Signs
- `belongsTo(AnotherAggregateRoot::class)` in model relationships
- Cascade saves propagating across aggregates: `$order->customer->save()`
- N+1 queries to load related aggregate data through ORM lazy loading
- Cascade-on-delete foreign keys in migrations across aggregate tables
- Application code that traverses: `$order->customer->orders` (loading other aggregates)
- `touch` parent relationships that update another aggregate's timestamp

### Why Harmful
- Accidental persistence: `$orderItem->product->save()` writes to the Product aggregate
- Cascade updates silently modify other aggregates' data
- The relationship loads the entire other aggregate into memory when only the ID may be needed
- ORM cascading saves propagate across boundaries unexpectedly
- Aggregate boundaries become blurred and unenforceable

### Consequences
- Unintended modifications to other aggregates during routine operations
- Cascade deletes that silently remove data from other aggregates
- Performance overhead from loading full objects when only IDs are needed
- Race conditions when two aggregates interact through relationship chains
- Refactoring difficulty: separating aggregates requires removing all cross-boundary relationships

### Preferred Alternative
```php
class Order extends Model
{
    // Store only the root ID — no Eloquent relationship
    protected $fillable = ['customer_id', 'status', 'total_cents'];

    public function customerId(): int
    {
        return $this->customer_id;
    }
}
```

### Refactoring Strategy
1. Identify `BelongsTo`/`HasMany` relationships that cross aggregate boundaries
2. Remove the relationship definition from the model
3. Replace object access (`$order->customer`) with explicit queries by ID
4. For read-side convenience, add dedicated query methods or read models
5. Document the aggregate boundary and the ID-only reference pattern

### Detection Checklist
- [ ] Search for `belongsTo(` referencing models in other aggregates
- [ ] Search for `HasMany(` referencing models in other aggregates
- [ ] Check chain access patterns: `$order->customer->address->city`
- [ ] Verify cascade foreign keys don't cross aggregate boundaries
- [ ] Audit `touch` configuration for cross-aggregate propagation

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Reference Other Aggregates Only by Their Root ID |
| Knowledge | `04-standardized-knowledge.md` — Reference by ID |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |

---

## 4. No Invariant Enforcement in Root Methods

### Category
Reliability

### Description
Aggregate root domain methods that accept any input and perform modifications without enforcing business invariants. Invalid state transitions, negative quantities, or inconsistent data can be persisted without detection.

### Why It Happens
The root method is treated as a simple "save with side effects" rather than an invariant enforcement point. The developer assumes validation happens at the controller or form request level. The root is seen as a data manager, not a domain guard.

### Warning Signs
- Root methods that directly set attributes without precondition checks
- No domain-specific exceptions thrown from root methods
- Business rules about valid states found only in controllers
- Database constraint violations indicating invalid state
- Inconsistent data reported in business reviews or reports
- `throw` statements absent from root domain methods

### Why Harmful
- Invalid aggregate state can be created and persisted
- The root doesn't guarantee its own consistency — external layers must enforce rules
- Business rules are scattered across controllers and services
- Database constraints are the last defense (too late for useful error messages)
- Other parts of the system cannot trust the aggregate's consistency

### Consequences
- Business data corrupted by invalid state transitions
- Downstream processes (billing, reporting) processing invalid data
- Manual data fixes required when invalid state is detected
- Business logic bugs that are hard to trace to root methods
- Legal or compliance issues from incorrect data processing

### Preferred Alternative
```php
public function addItem(Product $product, int $quantity): void
{
    if (! $this->canBeModified()) {
        throw new AggregateLockedException($this->id);
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
        throw new AggregateStateException('Total must be positive.');
    }
}
```

### Refactoring Strategy
1. Document all invariants for the aggregate (valid state transitions, value ranges)
2. Add precondition checks at the start of each root method
3. Add postcondition checks after each mutation
4. Create domain-specific exception classes for each invariant violation
5. Add tests verifying invariants are enforced for both valid and invalid inputs

### Detection Checklist
- [ ] Review root domain methods for precondition validation
- [ ] Search for domain-specific exceptions (`throws` in docblock or `throw` in method body)
- [ ] Check if valid state transitions are documented anywhere
- [ ] Audit database records for states that should be impossible
- [ ] Test state transitions that should be invalid — do they throw?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Enforce Invariants at Both Entry and Exit of Root Methods |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |

---

## 5. Oversized Root With Too Many Child Types

### Category
Design

### Description
An aggregate root that manages 4+ child entity types (items, payments, shipments, notes, disputes), all within the same consistency boundary. The root becomes a monolithic class responsible for too many child types.

### Why It Happens
The database schema has multiple tables referencing the root's table. Developers assume "belongs to Order" means "part of the Order aggregate." No distinction is made between "has a foreign key" and "needs transactional consistency."

### Warning Signs
- 4+ `HasMany` relationships on the aggregate root
- The root model file exceeds 500 lines
- Loading the root for any operation loads data for all child types
- Transaction contention on the root's main table
- Many methods on the root for different child types (payItems, shipItems, addNote, addDispute)
- The model class has multiple distinct responsibilities

### Why Harmful
- Performance: loading all child types for simple operations is expensive
- Transaction contention: locking rows for many child tables per operation
- Coupling: changes to one child type affect the root's class complexity
- Reasoning: hard to understand which invariants span all child types
- Refactoring: difficult to extract child types into separate aggregates

### Consequences
- Slow aggregate operations as more child types are added
- Deadlocks under concurrent load on aggregate tables
- Maintenance difficulty: the root class grows unwieldy
- Loading overhead for operations that only need specific children
- Reluctance to add new child types because the root is already too complex

### Preferred Alternative
```php
// Root with only the essential child type
class Order extends Model
{
    public function items(): HasMany { ... }
}

// Other concerns are separate aggregate roots
class Payment extends Model { ... }
class Shipment extends Model { ... }
class OrderNote extends Model { ... }
```

### Refactoring Strategy
1. Identify child types that could exist as separate aggregates
2. Determine if they need transactional consistency with the root (rarely)
3. Extract each independent child type into its own aggregate root
4. Reference the original root by ID from the new aggregates
5. Use domain events for eventual consistency between aggregates

### Detection Checklist
- [ ] Count `HasMany` relationships on aggregate root models
- [ ] Count lines of code in the root model class
- [ ] Profile loading time for the aggregate with all children
- [ ] Review whether each child type truly requires atomic consistency with the root
- [ ] Check for deadlock reports involving the root's main table

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Aggregate Roots Small — Limit Child Entity Types |
| Decision Tree | `07-decision-trees.md` — Aggregate Size Decision |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |

---

## 6. Technical Method Names Instead of Ubiquitous Language

### Category
Maintainability

### Description
Naming aggregate root methods with technical descriptions (`updateStatus('paid')`) instead of domain language (`markAsPaid()`). The code communicates implementation details rather than business intent.

### Why It Happens
Developers naturally name methods after what they do technically. `updateStatus()` is a common CRUD pattern. The ubiquitous language of the domain requires understanding business terminology that may not be familiar to all developers.

### Warning Signs
- Method names like `updateStatus()`, `setState()`, `changeAttribute()` on aggregate roots
- Controllers passing status strings as parameters instead of calling named methods
- Switch/if chains in controllers checking status values
- Business stakeholders don't recognize method names in code reviews
- Domain language terms (fulfill, cancel, archive) absent from the codebase
- Documentation maps technical names back to business concepts

### Why Harmful
- Code communicates how, not what — harder to map to business requirements
- Developers must mentally translate `updateStatus('fulfilled')` to "this marks the order as fulfilled"
- Business stakeholders cannot read or validate the code's behavior
- New team members must learn both the domain and the technical translation layer
- The domain model's expressiveness is lost

### Consequences
- Code that's harder to understand without business context
- Communication gap between developers and domain experts
- Onboarding difficulty for new developers unfamiliar with the codebase
- Missed opportunities to align code with business concepts
- Requirements translation errors from technical naming

### Preferred Alternative
```php
class Order extends Model
{
    public function fulfill(): void { ... }
    public function cancel(string $reason): void { ... }
    public function archive(): void { ... }
}
```

### Refactoring Strategy
1. Identify technical method names on aggregate roots (`updateStatus`, `setState`, `change`)
2. For each, determine the business intent (what domain concept does it express?)
3. Rename to the ubiquitous language term
4. Move parameterized values (like status strings) into the method name
5. Update all callers and documentation

### Detection Checklist
- [ ] Search for method names like `updateStatus`, `setState`, `change*` on models
- [ ] Check if status values are passed as parameters in method calls
- [ ] Review naming against domain glossary or ubiquitous language documentation
- [ ] Check if business stakeholders would recognize method names
- [ ] Verify that method names express WHAT, not HOW

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Name Aggregate Root Methods Using Ubiquitous Language |
| Skill | `06-skills.md` — Implement an Aggregate Root With Invariant Enforcement |
