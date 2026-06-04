# Aggregate Boundary Design — Standardized Knowledge

## Overview

Aggregate boundary design is the practice of identifying which models belong together in a consistency boundary, with one model acting as the aggregate root. All writes to models within the boundary must go through the root, ensuring invariants that span multiple models are enforced consistently.

## Key Concepts

- **Aggregate root** — the single entry point for all writes within the boundary
- **Consistency boundary** — the set of models that must be transactionally consistent
- **Invariants** — business rules that span multiple models within the boundary
- **Child entities** — models inside the boundary, modified only through the root
- **Cross-aggregate references** — reference other aggregates by ID, not by Eloquent relation
- **Transactional integrity** — the aggregate is loaded and saved as a unit

## Implementation Details

```php
class Order extends Model
{
    public function addItem(Product $product, int $quantity): void
    {
        $this->items()->create(['product_id' => $product->id, 'quantity' => $quantity]);
        $this->total = $this->items()->sum(DB::raw('quantity * price'));
    }

    public function removeItem(OrderItem $item): void
    {
        $item->delete();
        $this->total = $this->items()->sum(DB::raw('quantity * price'));
    }
}
```

## Best Practices

- Identify the aggregate root as the consistency guardian for its children
- Enforce all cross-model invariants in the aggregate root's domain methods
- Load the entire aggregate in one query for write operations
- Reference other aggregates by their ID, not by loading the full model
- Do not expose child CRUD endpoints — all modifications go through the root
