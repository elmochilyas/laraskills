# Read Model Separation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Read Model Separation |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Read model separation (CQRS-lite) splits the data model used for reads from the model used for writes. Instead of querying the same Eloquent model you write to, you create dedicated read models — often backed by database views, denormalized tables, or dedicated read connections. This optimizes the read side for presentation without constraining the write model's domain design. It is a middle ground between full CQRS/Event Sourcing and a single Active Record model.

## Core Concepts

- **Read Model**: A lightweight, typically immutable class representing data as it should be displayed — not as it is stored
- **Write Model**: The domain model enforcing business rules and encapsulating state changes
- **CQRS-lite**: Command Query Responsibility Segregation at the model level (separate PHP classes, same data store)
- **Denormalization**: Read models pre-join data that the write model stores normalized
- **Projection**: The transformation from write-model format to read-model format

## When To Use

- The read representation differs significantly from the write model's structure
- Read performance is critical and the write model's query patterns are slow (multiple joins, complex aggregations)
- The read model needs data from multiple aggregates (dashboards, reports)
- Write model refactoring (splitting tables, changing columns) would break existing queries

## When NOT To Use

- Reads and writes use the same structure and queries are simple
- The overhead of maintaining a separate read model outweighs the query performance gain
- The application cannot tolerate eventual consistency

## Best Practices

- **Use database views as the simplest read model**: A SQL view pre-joins data without requiring a projection system. Map an Eloquent model with `$table = 'view_name'` to query it. This is the easiest CQRS-lite implementation.
- **Define acceptable staleness per read model**: Real-time critical features should read from the write model. Dashboard analytics can tolerate 5-15 minute delays. Document the SLA for each read model.
- **Provide a rebuild command**: Every read model needs an Artisan command to rebuild from scratch. Without this, data corruption or projection bugs become unrecoverable without manual database fixes.
- **Monitor projection lag**: Track the time between a write occurring and the read model reflecting it. Sudden increases in lag indicate projection failures or performance degradation.

## Architecture Guidelines

- Read models in `App\Models\Read\*` — read-only, no `save()`/`update()` methods
- Populated by projectors, event handlers, or database views
- Read models are independently indexable from write models
- Controllers and actions query read models directly, never the write model for display
- Write model remains free to evolve its internal structure without breaking queries

## Performance Considerations

- Read models can use dedicated read replicas without affecting write throughput
- Database views add negligible query overhead (the database optimizes them)
- Denormalized read models eliminate JOINs — significantly faster for complex queries
- Read model tables can have different indexing strategies than write tables
- Queue-based projections may introduce latency; measure acceptable staleness

## Security Considerations

- Read models should never expose sensitive write-model columns (password hashes, internal flags)
- Read-only models enforce immutability at the code level — no accidental writes through read paths
- Projection code must validate that only authorized data flows into read models (tenant isolation)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Read model for every write model | Habit | Overhead without benefit | Separate only when there's structural/performance benefit |
| Exact copy of write model columns | No real separation | Duplication with zero value | Keep single model when structure matches |
| No rebuild mechanism | Oversight | Irrecoverable data corruption | Always provide rebuild Artisan command |
| Using read models for writes | Convenience | Mutation through read path | Read models are strictly read-only |
| Mixing read concerns in write events | Coupling | Write model knows about read shapes | Events should be domain-focused, not projection-focused |

## Anti-Patterns

- **Stale Data**: Read model lags too far behind write model. Set max acceptable lag; use synchronous projection for critical data.
- **Projection Failure**: A bug in the projector stops updating the read model. Monitor projection error rates; provide rebuild command.
- **Schema Drift**: Read model's expected structure diverges from what the projector writes. Integration tests that run the projector and assert read model shape.
- **Over-Engineering**: Read model separation for a simple blog. Start with a single model; extract only when query patterns become painful.

## Examples

```php
// View-backed read model
class UserOrderSummary extends Model
{
    protected $table = 'user_order_summaries'; // database view
    public $incrementing = false;
    public $timestamps = false;
}

// SQL view definition
// CREATE VIEW user_order_summaries AS
// SELECT u.id AS user_id, u.name AS user_name,
//   COUNT(o.id) AS total_orders,
//   COALESCE(SUM(o.total_cents), 0) AS lifetime_value_cents
// FROM users u LEFT JOIN orders o ON o.user_id = u.id
// GROUP BY u.id, u.name, u.email;
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | Write Model Separation |
| Closely Related | Query Object Alternative |
| Closely Related | When Repositories Help |
| Closely Related | Framework Decoupling |

## AI Agent Notes

- Read model classes never have `save()`, `create()`, `update()`, or `delete()` calls
- Read models are populated by projectors, event handlers, or database views
- Read model rebuild must be possible (Artisan command + replay mechanism)
- Read model is independently indexable from the write model

## Verification

- [ ] Read model classes never have `save()`, `create()`, `update()`, or `delete()` calls
- [ ] Read models are populated by projectors, event handlers, or database views
- [ ] Read model tests assert the projected output, not the internal query
- [ ] Read model rebuild is possible (Artisan command + replay mechanism)
- [ ] Read model is independently indexable from the write model
