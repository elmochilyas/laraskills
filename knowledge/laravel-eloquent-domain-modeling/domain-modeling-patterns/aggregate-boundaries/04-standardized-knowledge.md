# Aggregate Boundaries

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Aggregate Boundaries |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Aggregate boundaries define transactional consistency zones within a domain model. In Eloquent, correct aggregate boundary identification determines which models are saved together atomically and which are eventually consistent. This KU explores mapping DDD aggregate concepts onto Eloquent relationships while balancing consistency, performance, and modeling fidelity.

## Core Concepts

- **Aggregate**: A cluster of domain objects treated as a single unit for data changes
- **Aggregate Root**: The root entity guarding access to all objects within the aggregate
- **Consistency Boundary**: All changes within must be atomic; outside may be eventually consistent
- **Transaction Scope**: The database transaction spanning a single aggregate modification
- **Invariant**: A condition that must always hold true for the aggregate

## When To Use

- You need to define clear transaction boundaries for complex domain operations
- You want to prevent objects from being modified outside their owning aggregate
- You need eventual consistency between different domain concepts

## When NOT To Use

- The application is simple CRUD with no complex invariants
- All operations are on single models with no child entities
- Transactional boundaries are not a concern

## Best Practices

- **One transaction, one aggregate**: A single database transaction should modify only one aggregate instance. Modifying multiple aggregates in one transaction suggests the boundary is wrong.
- **The root is the only door**: External code must reference only the aggregate root. Internal entities are accessed through the root. This prevents inconsistent modifications bypassing the root's invariant enforcement.
- **Reference by ID, not object**: External aggregates reference each other by root ID, not by object reference. This prevents accidental modification across boundaries and enables eventual consistency.

## Architecture Guidelines

- Eloquent `HasMany` relationships define ownership within a potential aggregate boundary
- `save()` on the parent does NOT automatically save children — use `push()` or `DB::transaction()` with explicit saves
- Wrap aggregate operations in `DB::transaction()` and manually manage related model persistence
- Use `cascade` on foreign keys for referential integrity at the database level

## Performance Considerations

- Smaller aggregates mean smaller transactions and less locking
- Loading a large aggregate with many children can be expensive — consider lazy loading or pagination for children
- Eventual consistency across aggregate boundaries improves write throughput

## Security Considerations

- Aggregate roots enforce access control to internal entities
- The root is the enforcement point for all invariants — keep it consistent

## Examples

```php
class Order extends Model // Aggregate Root
{
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function addItem(Product $product, int $quantity): void
    {
        $this->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price_cents' => $product->price_cents,
        ]);

        $this->total_cents = $this->items->sum(fn ($i) => $i->unit_price_cents * $i->quantity);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Domain Methods on Models |
| Closely Related | Aggregate Roots |
| Closely Related | Domain Services |
| Advanced | Event Sourcing |

## AI Agent Notes

- One transaction modifies one aggregate
- Reference other aggregates by ID, not by object reference
- The root is the only entry point for modifications

## Verification

- [ ] Transaction boundaries align with aggregate boundaries
- [ ] External code references aggregate roots only
- [ ] Cross-aggregate references use IDs, not object references
- [ ] Aggregate operations are wrapped in `DB::transaction()`
