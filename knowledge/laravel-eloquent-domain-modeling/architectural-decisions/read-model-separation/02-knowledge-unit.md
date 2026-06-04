# Read Model Separation

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Read model separation (CQRS-lite) splits the data model used for reads from the model used for writes. Instead of querying the same Eloquent model you write to, you create dedicated read models — often backed by a database view, a denormalized table, or a dedicated read connection. This allows the read side to be optimized for presentation without constraining the write model's domain design. It's a middle ground between full CQRS/Event Sourcing and a single Active Record model.

## Core Concepts
- **Read Model:** A lightweight, typically immutable class that represents data as it should be displayed (not as it's stored).
- **Write Model:** The domain model that enforces business rules and encapsulates state changes.
- **CQRS-lite:** Command Query Responsibility Segregation applied at the model level, not the system level (separate PHP classes, not separate databases).
- **Denormalization:** Read models often pre-join data that the write model stores normalized.
- **Projection:** The transformation from write-model format to read-model format.

## Mental Models
- **The Stage vs. The Workshop:** The stage (read model) is where the audience sees the polished performance. The workshop (write model) is where the messy, careful construction happens. They don't share the same space.
- **The Airport Departure Board:** The departure board (read model) is optimized for travelers to read — big text, colors, sorted. The backend system (write model) stores structured data about flights, gates, and times. They serve different needs.
- **The Menu vs. The Kitchen:** The menu (read model) describes what you get, simply. The kitchen (write model) deals with raw ingredients, prep times, inventory — details the diner doesn't need.

## Internal Mechanics
1. Define an Eloquent model (or plain class) for the read side.
2. Optionally back it with a database view that pre-joins data.
3. Populate the read model synchronously (via model events) or asynchronously (via jobs).
4. Controllers and actions query the read model directly, never the write model.
5. The write model remains free to evolve its internal structure without breaking queries.

## Patterns
- **Database View Read Model:** A SQL view (CREATE VIEW) sits on top of normalized tables; an Eloquent model maps to it with $table = 'view_name'.
- **Elasticsearch Read Model:** Write model emits events ? event handler indexes into Elasticsearch ? read model queries Elasticsearch.
- **Redis Read Model:** Simple denormalized data stored in Redis hashes/sets for ultra-fast reads.
- **Cache-Tier Read Model:** Query results cached by key; write model invalidates cache on mutation.
- **Same-DB Read Table:** A dedicated MySQL/Postgres table populated by a projector, separate from the write model's tables.

## Architectural Decisions
- Separate read and write models when the read representation differs significantly from the write model's structure.
- Separate when read performance is critical and the write model's query patterns are slow (multiple joins, complex aggregations).
- Separate when the read model needs data from multiple aggregates (dashboards, reports).
- Separate when the write model's internal refactoring (splitting tables, changing column names) would break existing queries.
- Keep a single model when reads and writes use the same structure and queries are simple.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Read queries optimized without constraining write model | Data duplication — read model must be kept in sync | Eventually consistent read models add complexity |
| Write model can be refactored freely | Additional infrastructure (views, queues, projectors) | More moving parts to maintain |
| Better read performance (denormalization, caching) | Eventual consistency — reads may lag behind writes | Acceptable for most non-financial applications |
| Clear separation of concerns | More code and more classes | Worth it for complex domains |
| Enables different storage for reads/writes | Team must learn CQRS-lite patterns | Not needed for simple CRUD apps |

## Performance Considerations
- Read models can use dedicated read replicas without affecting write throughput.
- Database views add negligible query overhead (the database optimizes them).
- Queue-based projections may introduce latency; measure acceptable staleness.
- Denormalized read models eliminate JOINs — significantly faster for complex queries.
- Read model tables can have different indexing strategies than write tables.

## Production Considerations
- **Consistency:** Define acceptable staleness for each read model. Real-time critical features should read from the write model.
- **Rebuilding:** Provide an Artisan command to rebuild read models from scratch (replay all events or re-run all projections).
- **Monitoring:** Track projection lag (time between write and read model update).
- **Migration:** When changing a read model, you can independently migrate the read and write tables.

## Common Mistakes
- Creating a read model for every write model — only separate when there's a performance or structural benefit.
- Building read models that are exact copies of write model columns — no benefit, just overhead.
- Forgetting to handle read model rebuilds in deployment scripts.
- Using read models for writes — read models should be read-only (no save()).
- Mixing read model concerns in write model events.

## Failure Modes
- **Stale Data:** Read model lags too far behind write model, causing users to see outdated information. Mitigate: set maximum acceptable lag; use synchronous projection for critical data.
- **Projection Failure:** A bug in the projector stops updating the read model. Mitigate: monitor projection error rates; provide rebuild command.
- **Schema Drift:** Read model's expected structure diverges from what the projector writes. Mitigate: integration tests that run the projector and assert read model shape.
- **Over-Engineering:** Read model separation added for a simple blog with one content type. Mitigate: start with a single model; extract a read model only when the write model's query patterns become painful.

## Ecosystem Usage
- **Laravel + spatie/laravel-event-sourcing:** Projectors create read models from event streams. Standard CQRS-lite approach.
- **Laravel + Elasticsearch:** Scout / custom indexers for full-text search read models.
- **Laravel + Redis:** Real-time dashboards and leaderboards using denormalized Redis read models.
- **Laravel Spark:** Uses a User model for writes and separate query scopes/optimized queries for the dashboard (light read model separation).
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Complementary pattern (the write side).
- [Query Object Alternative](../query-object-alternative/02-knowledge-unit.md) — Query objects often return read models.
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Repositories can abstract read model retrieval.
- [Framework Decoupling](../framework-decoupling/02-knowledge-unit.md) — Read models can be framework-agnostic.

### Advanced Follow-up Topics

## Research Notes
- **Greg Young (CQRS originator):** Introduced CQRS as a pattern for separating read and write models.
- **Martin Fowler:** CQRS — notes that CQRS-lite (separate models, same DB) is a common starting point.
- **Laravel community (2020-2024):** Growing adoption of CQRS-lite patterns using spatie/laravel-event-sourcing.
- **Ride The Lightning (Laracon talk, 2022):** Case study of read model separation improving query performance by 20x using database views.