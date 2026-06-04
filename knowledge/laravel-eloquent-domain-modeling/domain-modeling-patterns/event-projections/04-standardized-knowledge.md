# Event Projections

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Event Projections |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Event projections build and maintain read-optimized data structures from domain events. Instead of querying the primary domain model (normalized for writes), projections aggregate event data into denormalized read models tailored for specific use cases. This KU covers projection patterns in Laravel, whether using event sourcing or simply updating read tables from domain events.

## Core Concepts

- **Projection**: A read-only data structure derived from processing domain events
- **Projector**: A listener class receiving domain events and updating the projection
- **Read Model**: The projection's output — a table or structure optimized for querying
- **Replay**: Re-processing all historical domain events to rebuild a projection from scratch
- **Async Projection**: Processing events via a queue, trading immediacy for scalability
- **Sync Projection**: Updating in real-time within the same transaction/request

## When To Use

- The same data needs multiple read representations (dashboard, report, API)
- Read queries on the write model are slow due to normalization
- You need to provide data from multiple aggregates in a single query
- You want to decouple read optimization from write model design

## When NOT To Use

- A simple eager-loaded query on the write model is fast enough
- The projection would duplicate the write model exactly
- You cannot tolerate eventual consistency for the projected data

## Best Practices

- **Projections are disposable**: A projection can be dropped and rebuilt from events at any time. Design accordingly — if a projection can't be rebuilt, it's not a projection, it's primary data.
- **Make projectors idempotent**: Running the same event through a projector twice should produce the same result. Use `updateOrCreate()` rather than `create()` to prevent duplicates on replay.
- **Project the minimum needed fields**: A projection should contain only the fields required for its specific read use case. Adding extra fields couples the read model to write internals.

## Architecture Guidelines

- Projectors in `App\Projectors\*`
- Read models in `App\Models\Read\*` — read-only Eloquent models
- Provide an Artisan command to rebuild projections from scratch
- Monitor projection lag for async projections

## Performance Considerations

- Async projections scale better — writes don't wait for projection updates
- Sync projections keep read models consistent but slow the write path
- Projection tables can have different indexes and storage engines than write tables

## Examples

```php
class UserOrderSummary
{
    protected $table = 'user_order_summaries';
    public $timestamps = false;
}

class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        UserOrderSummary::updateOrCreate(
            ['user_id' => $event->customerId],
            [
                'total_orders' => DB::raw('total_orders + 1'),
                'lifetime_value_cents' => DB::raw('lifetime_value_cents + ' . $event->totalCents),
                'last_order_at' => now(),
            ]
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Dispatching Domain Events |
| Prerequisite | Domain Event vs Model Event |
| Closely Related | Read Model Separation |
| Closely Related | Event Sourcing |
| Advanced | CQRS |

## AI Agent Notes

- Projections are rebuildable from events — design as disposable
- Make projectors idempotent for replay safety
- Project minimum fields needed for the read use case

## Verification

- [ ] Projectors use `updateOrCreate()` or equivalent for idempotency
- [ ] Rebuild Artisan command exists for each projection
- [ ] Projection contains only required fields
- [ ] Projection lag is monitored for async projections
