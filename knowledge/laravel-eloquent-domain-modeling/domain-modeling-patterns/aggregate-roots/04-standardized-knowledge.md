# Aggregate Roots

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Aggregate Roots |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

The aggregate root is the gateway to an aggregate — the only entity external code can reference directly. It enforces invariants, controls access to child entities, and defines the transactional boundary. In Eloquent, the aggregate root is the primary model in a relationship graph (e.g., `Order` as root of `OrderItem` children). This KU covers aggregate root design and implementation with Eloquent.

## Core Concepts

- **Aggregate Root**: The root entity maintaining the consistency boundary
- **Global Identity**: The root has an ID unique across the entire system
- **Local Identity**: Child entities have IDs unique only within the aggregate
- **Invariant Enforcement**: The root ensures all business rules within the boundary are satisfied
- **Transaction Boundary**: All changes happen in a single transaction through the root
- **Reference by ID**: External aggregates reference each other only by root ID

## When To Use

- You need to enforce consistency across multiple related entities
- There is a clear "ownership" hierarchy (order owns items, invoice owns lines)
- Modifications to children must always go through the parent

## When NOT To Use

- Entities are independent and don't need coordinated consistency
- The "aggregate" would include everything (too large — make smaller aggregates)
- The root adds no invariant enforcement (just pass-through)

## Best Practices

- **Don't expose child collections directly**: Instead of `$order->items->each(...)`, provide domain methods on the root: `$order->addItem(...)`, `$order->removeItem(...)`. This allows the root to enforce invariants on every modification.
- **Reference other aggregates by ID**: External aggregates should store the root's ID, not an object reference. This prevents accidental modification across boundaries and supports eventual consistency.
- **Keep aggregates small**: A common mistake is making aggregates too large. If an aggregate has dozens of child entities, question whether they all need transactional consistency. Smaller aggregates perform better and are easier to reason about.

## Architecture Guidelines

- The root model has `HasMany`/`HasOne` relationships to child models
- Root methods coordinate changes across children
- `push()` recursively saves root + children but requires manual transaction wrapping
- Access to children is guarded through root methods

## Performance Considerations

- Loading a large aggregate with all children is expensive — consider lazy loading children or paginating
- Smaller aggregates mean smaller transactions and less contention
- Eventual consistency between aggregates improves write throughput

## Examples

```php
class Order extends Model // Aggregate Root
{
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function addItem(Product $product, int $quantity): OrderItem
    {
        $item = $this->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price_cents' => $product->price_cents,
        ]);
        $this->recalculateTotal();
        return $item;
    }

    private function recalculateTotal(): void
    {
        $this->total_cents = $this->items()
            ->get()
            ->sum(fn ($i) => $i->unit_price_cents * $i->quantity);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Aggregate Boundaries |
| Closely Related | Domain Services |
| Closely Related | Domain Repositories |
| Advanced | Event Sourcing |

## AI Agent Notes

- The root is the only entry point for aggregate modifications
- Reference other aggregates by ID, not object reference
- Keep aggregates small — question large transaction boundaries

## Verification

- [ ] Child entities are only modified through root methods
- [ ] Cross-aggregate references use IDs
- [ ] Aggregate invariants are enforced in root methods
- [ ] Aggregate operations are wrapped in `DB::transaction()`
