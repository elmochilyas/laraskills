# Aggregate Roots — Skills

---

## Skill 1: Implement an Aggregate Root With Invariant Enforcement

### Purpose
Create an aggregate root Eloquent model that guards access to child entities and enforces domain invariants through explicit domain methods.

### When To Use
- You need to enforce consistency across multiple related entities
- There is a clear ownership hierarchy (order owns items, invoice owns lines)
- Modifications to children must always go through the parent

### When NOT To Use
- Entities are independent with no coordinated consistency needs
- The aggregate would include too many child types
- The root adds no invariant enforcement beyond pass-through

### Prerequisites
- Aggregate boundary defined
- Understanding of entity relationships in the domain

### Inputs
- Aggregate root model class
- Child entity model classes
- Business invariants to enforce

### Workflow

1. **Define the root model** with `HasMany`/`HasOne` relationships to children:
   ```php
   class Order extends Model
   {
       public function items(): HasMany
       {
           return $this->hasMany(OrderItem::class);
       }
   }
   ```

2. **Add domain methods** that guard children access:
   ```php
   public function addItem(Product $product, int $quantity): void
   {
       if (! $this->canBeModified()) {
           throw new AggregateLockedException($this->id);
       }
       
       DB::transaction(function () use ($product, $quantity) {
           $this->items()->create([...]);
           $this->recalculateTotal();
           $this->save();
       });
   }
   ```

3. **Name methods in ubiquitous language** — `fulfill()`, `cancel()`, not `updateStatus()`

4. **Validate invariants at entry and exit** of every domain method

5. **Reference other aggregates by root ID** — not by object reference

6. **Do not expose child collections** for direct external mutation

### Validation Checklist
- [ ] Child entities are only modified through root methods
- [ ] Cross-aggregate references use IDs
- [ ] Aggregate invariants are enforced in root methods
- [ ] Aggregate operations are wrapped in `DB::transaction()`

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Invariant bypassed | Raw `HasMany` relationship exposed | Provide explicit domain methods |
| Transaction not atomic | Missing `DB::transaction()` wrapper | Always wrap root mutations |
| Cross-aggregate coupling | Full BelongsTo reference to another aggregate | Store only the root ID |

### Decision Points
- **Simple CRUD with no invariants?** → No aggregate root needed
- **Multiple entity types in same transaction?** → Consider smaller aggregates
- **Cross-aggregate reference?** → Reference by root ID only

### Performance Considerations
- Loading a large aggregate with all children is expensive
- Smaller aggregates → smaller transactions, less contention
- Eventual consistency between aggregates improves write throughput

### Related Rules
| Rule | Reference |
|---|---|
| Expose child entities only through root methods | `05-rules.md` |
| Reference other aggregates only by their root ID | `05-rules.md` |
| Keep aggregate roots small | `05-rules.md` |
| Enforce invariants at both entry and exit | `05-rules.md` |
| Use DB::transaction() for all root mutations | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Identify and Define an Aggregate Boundary | Foundation for root design |
| Implement Domain Methods on Models | Methods inside the root |
| Design a Domain Repository | Persistence abstraction for roots |

### Success Criteria
- Root is the only entry point for all child modifications
- Invariants are enforced before and after every mutation
- Cross-aggregate references use root IDs only
- Root operations are wrapped in transactions
- Methods use ubiquitous language names
