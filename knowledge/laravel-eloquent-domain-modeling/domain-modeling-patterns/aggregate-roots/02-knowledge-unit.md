# Aggregate Roots

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
The aggregate root is the gateway to an aggregate — the only entity that external code can reference directly. It enforces invariants, controls access to child entities, and defines the transactional boundary. In Eloquent, the aggregate root is typically the primary model in a relationship graph (e.g., `Order` as root of `OrderItem` children). This KU covers aggregate root design, implementation with Eloquent, and common patterns for maintaining consistency.

## Core Concepts
- **Aggregate Root:** The root entity of an aggregate, responsible for maintaining its consistency boundary.
- **Global Identity:** The aggregate root has an ID that is unique across the entire system.
- **Local Identity:** Child entities within the aggregate have IDs unique only within the aggregate.
- **Invariant Enforcement:** The aggregate root ensures all business rules within the boundary are satisfied.
- **Transaction Boundary:** All changes to the aggregate happen in a single transaction through the root.
- **Reference by ID Only:** External aggregates reference each other only by root ID, never by object reference.

## Mental Models
- **"The Root is the Only Door":** No external code should ever hold a reference to an internal entity. All operations go through the root.
- **"The Root Owns the Transaction":** When you save the root, everything inside the boundary is saved atomically.
- **"The Root Decides":** If a business rule involves multiple entities, the root has final authority.

## Internal Mechanics
In Eloquent, the aggregate root pattern maps to:
- A model with `HasMany` or `HasOne` relationships to child models
- Domain methods on the root model that coordinate changes across children
- `push()` to recursively save root + children (but with manual transaction wrapping)
- Access to children guarded through root methods, not direct `$order->items->each(...)`

```
class Order extends Model
{
    public function items(): HasMany { ... }

    public function addItem(Product $product, int $quantity): void
    {
        $this->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $product->price,
        ]);
        $this->recalculateTotal();
    }

    public function recalculateTotal(): void
    {
        $this->total = $this->items->sum(fn($item) => $item->unit_price * $item->quantity);
    }
}
```

## Patterns
- **Root Method Orchestration:** Root methods that modify child collections and enforce invariants.
- **Child Access Through Root Only:** No public route to retrieve a child without going through the root.
- **Identity Assignment:** Root assigns local identities to children (or uses auto-increment scoped to root).
- **Transactional Save:** Wrap root mutation in `DB::transaction()` + `$root->push()`.
- **Snapshot Comparison:** Load the aggregate, perform operations, compare before/after to determine changes.
- **Versioned Root:** Use a `version` or `lock_version` column on the root for optimistic concurrency.

## Architectural Decisions
- Which entity should be the root in a given relationship graph
- How deep the aggregate should be (one level of children vs nested children)
- Whether to load the entire aggregate eagerly for every operation
- How to handle deletions within the aggregate (cascade vs soft delete vs archive)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear transactional boundaries | Requires discipline to avoid bypassing the root | Enforce via code review; guard child access |
| Single point of invariant enforcement | Can become a god object if too many responsibilities | Keep aggregates small; extract value objects |
| Optimistic concurrency is straightforward | Loading the full aggregate is required for writes | Profile aggregate size; split if loading is excessive |
| Natural consistency model | Cross-aggregate consistency requires eventual consistency | Acceptable for most business domains |

## Performance Considerations
- Full aggregate loading can be expensive if the aggregate is deep. Keep aggregates shallow (1-2 levels).
- Eager-load the entire aggregate for write operations to avoid N+1 inside transaction.
- Consider lazy-loading for read-only operations that don't need the full graph.
- Large child collections (>1000 items) inside an aggregate may indicate a boundary issue.
- Version column updates add a tiny overhead but prevent lost updates.

## Production Considerations
- Log aggregate root operations with root ID and type.
- Monitor aggregate load times — slow loads suggest the aggregate is too large.
- Implement aggregate version checking for concurrent modification detection.
- Test aggregate invariants with property-based testing for complex rules.
- Provide admin tooling to view aggregate state for debugging.

## Common Mistakes
- Making every model an aggregate root (defines no boundaries, no consistency)
- Using a model as root when it's clearly part of another aggregate (e.g., making `OrderItem` a root)
- Exposing child collection directly (`$order->items->add()`) bypassing root methods
- Not enforcing transactional saves — partial updates when root and children save separately
- Loading the aggregate for read-only operations where a simple query would suffice

## Failure Modes
- **Orphaned Children:** A root is deleted but children remain due to missing cascade. Use database foreign keys with CASCADE.
- **Ghost Modification:** An external process modifies a child without going through the root, breaking invariants. No prevention in Eloquent; enforce via application architecture.
- **Concurrent Overwrite:** Two processes load the aggregate, both modify and save. Last writer wins. Use optimistic locking.
- **Aggregate Explosion:** The root accumulates too many related entities and performance degrades. Split into smaller aggregates.

## Ecosystem Usage
- Laravel's `HasMany` and `BelongsTo` naturally suggest aggregate relationships
- `spatie/laravel-event-sourcing` uses aggregate root classes for event-sourced aggregates
- `spatie/laravel-beyond-crud` demonstrates aggregate-like action classes
- E-commerce apps: Order aggregate (Order + OrderItems + OrderTotals)
- CRM apps: Contact aggregate (Contact + Addresses + PhoneNumbers)

## Related Knowledge Units

### Prerequisites
- active-record-domain-layer — Eloquent models as domain entities
- Eloquent Relationships (HasMany, HasOne) — defining and using relationships
- aggregate-boundaries — understanding transactional consistency zones

### Related Topics
- aggregate-boundaries
- domain-repositories
- bounded-contexts

### Advanced Follow-up Topics
- domain-services
- dispatching-domain-events

## Research Notes
- Evans: *Domain-Driven Design* (2003), Chapter 6 — Aggregate pattern definition and rules
- Vernon: *Implementing Domain-Driven Design* (2013) — aggregate design best practices
- Vernon recommends: (1) protect invariants, (2) keep aggregates small, (3) reference by identity
- Eloquent doesn't enforce aggregate boundaries; discipline and convention fill the gap
- Community: "Aggregate roots are just fancy Eloquent models" — simplification, but captures the essence
