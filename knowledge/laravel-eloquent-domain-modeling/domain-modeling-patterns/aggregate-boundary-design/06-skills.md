# Aggregate Boundary Design — Skills

---

## Skill 1: Define an Aggregate Root with Consistency Boundaries

### Purpose
Identify the aggregate root and its boundary in an Eloquent model graph, ensuring that all writes to the aggregate happen through the root and consistency rules are enforced at the aggregate level.

### When To Use
- You have related models (Order + OrderItems) that must be consistent together
- You want to prevent direct manipulation of child entities outside the parent
- You need transactional integrity across multiple models

### When NOT To Use
- Models are independently consistent (no invariants spanning them)
- The aggregate would be too large (performance or complexity concerns)
- Your domain doesn't have clear consistency requirements

### Prerequisites
- Understanding of the domain's consistency rules
- List of models and their relationships
- Knowledge of transactional boundaries

### Inputs
- Aggregate root model class
- Child models (entities/value objects within the boundary)
- Invariants that must be enforced across the aggregate

### Workflow

1. **Identify the aggregate root** — the model that acts as the entry point for all writes

2. **Define the boundary** — which models are inside the aggregate (loaded together, consistent together)

3. **Enforce writes through the root** — add domain methods on the root that modify children:
   ```php
   public function addItem(Product $product, int $quantity): void
   {
       $this->items()->create(['product_id' => $product->id, 'quantity' => $quantity]);
       $this->total = $this->items()->sum(DB::raw('quantity * price'));
   }
   ```

4. **Prevent direct child manipulation** — do not expose child CRUD endpoints

5. **Load the entire aggregate** in one query where possible:
   ```php
   $order = Order::with('items.product')->findOrFail($id);
   ```

6. **Save the aggregate** — call `save()` on the root, which cascades to children

7. **Reference other aggregates by identity** (foreign key, not Eloquent relation)

### Validation Checklist

- [ ] Aggregate root is clearly identified
- [ ] Child entities are modified only through root methods
- [ ] No direct API endpoints for child CRUD
- [ ] Invariants span the aggregate (not just per-model)
- [ ] Aggregate is loaded in a single query (or minimal queries)
- [ ] Cross-aggregate references use IDs, not full relations
- [ ] Transaction boundary matches the aggregate

### Related Rules

| Rule | Reference |
|---|---|
| Identify aggregate root for consistency | `05-rules.md` Rule 1 |
| Writes go through the aggregate root | `05-rules.md` Rule 2 |
| Load entire aggregate for writes | `05-rules.md` Rule 3 |
| Reference other aggregates by ID | `05-rules.md` Rule 4 |
| Save the root, not individual children | `05-rules.md` Rule 5 |

### Success Criteria
- Aggregate root is the sole entry point for modifying its children
- All invariants within the boundary are enforced in one place
- Direct child manipulation is prevented (no separate endpoints/services)
- Cross-aggregate references use foreign keys, not nested models
