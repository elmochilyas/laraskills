# Aggregate Boundaries

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Aggregate boundaries define transactional consistency zones within a domain model. In Eloquent, identifying the correct aggregate boundary determines which models are saved together in a single transaction and which are eventually consistent. This KU explores how to map DDD aggregate concepts onto Eloquent relationships, balancing consistency, performance, and modeling fidelity.

## Core Concepts
- **Aggregate:** A cluster of domain objects treated as a single unit for data changes.
- **Aggregate Root:** The root entity that guards access to all objects within the aggregate.
- **Consistency Boundary:** All changes within a boundary must be atomic; changes outside may be eventually consistent.
- **Transaction Scope:** The database transaction that spans a single aggregate modification.
- **Invariant:** A condition that must always hold true for the aggregate.

## Mental Models
- **"One Transaction, One Aggregate":** A single database transaction should modify only one aggregate instance. Modifying multiple aggregates in one transaction suggests the boundary is wrong.
- **"The Root is the Only Door":** External code must only hold references to the aggregate root. Internal entities are accessed only through the root.
- **"Save the Root, Save the Whole":** Persisting the aggregate root persists all internal entities atomically.

## Internal Mechanics
Eloquent relationships map naturally to aggregate composition:
- `HasMany` and `BelongsToMany` define ownership within a potential aggregate boundary
- `cascade` on migrations and `dependent` options enforce referential integrity
- `save()` on the parent model does NOT automatically save related models; the application must explicitly call `push()` or save relations separately
- `push()` recursively saves the model and all associated relationships, but this is not transactional by default

The developer must wrap aggregate operations in `DB::transaction()` and manually manage related model persistence to achieve atomicity.

## Patterns
- **Root-Only Access:** Access child entities only through aggregate root methods.
- **Transactional Closure:** Wrap aggregate mutation in a `DB::transaction()` closure.
- **Relationship Loading:** Eager-load aggregate internals before mutation to avoid N+1 within the transaction.
- **Partially Loaded Aggregate:** Load only the data needed for the current operation to keep transactions fast.
- **Eventual Consistency Marker:** Flag operations that cross aggregate boundaries for queue-based synchronization.

## Architectural Decisions
- Where to draw the boundary between Order and OrderItems (same aggregate vs separate)
- Whether User and Address are the same aggregate (usually separate, as addresses are referenced independently)
- How to handle cross-aggregate validation (eventual consistency vs global transactions)
- Whether to use Eloquent's `push()` or manual relationship saving

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Strong consistency within boundaries | Larger aggregates increase transaction contention | Keep aggregates small; split when performance degrades |
| Clear ownership and lifecycle | May require eventual consistency across aggregates | Use domain events and queue workers for coordination |
| Natural mapping to Eloquent relationships | Eloquent does not enforce aggregate boundary rules | Discipline and code review needed |
| Simplified invariants within boundary | Cross-aggregate queries require joins or read models | Consider CQRS patterns for complex cross-aggregate reads |

## Performance Considerations
- Large aggregates increase transaction duration and lock contention. Profile aggregate loading time.
- Lazy loading inside a transaction increases connection occupancy. Always eager-load aggregate internals.
- Cross-aggregate consistency via queues introduces latency; design for milliseconds to seconds.
- Optimistic locking via `$model->refresh()` or version columns helps prevent lost updates on concurrent aggregate modifications.

## Production Considerations
- Monitor transaction duration for aggregate operations; alert on >200ms per aggregate.
- Use database-level constraints (foreign keys, unique indexes) to support aggregate invariants at the data layer.
- Implement deadlock detection and retry logic for aggregate updates under high concurrency.
- Log aggregate modification events with aggregate root ID and type for traceability.

## Common Mistakes
- Making User the root of every aggregate (User rarely needs to be the root for Order, Invoice, etc.)
- Loading the entire aggregate graph when only a subset is needed for the operation
- Using `push()` without a transaction, then getting partial saves
- Expecting Eloquent to enforce aggregate consistency automatically
- Putting two aggregates in a single transaction "because they're related"

## Failure Modes
- **Transaction Bloat:** One aggregate's transaction holds locks on unrelated tables. Mitigate by splitting aggregates.
- **Ghost Writes:** Calling `save()` on the root but forgetting to `save()` children, leaving data inconsistent.
- **Boundary Creep:** Aggregate grows over time as developers add "just one more" relationship. Refactor periodically.
- **Lazy Loading Avalanche:** An aggregate method triggers hundreds of lazy queries inside a transaction. Prevent with explicit eager-loading requirements.

## Ecosystem Usage
- Laravel Spark uses a Team aggregate (Team: members, subscriptions, invitations)
- Laravel Cashier's Subscription aggregate (Subscription: invoice items, payments)
- `spatie/laravel-beyond-crud` advocates for action classes and aggregate-aware design
- Many Laravel apps implicitly use aggregate boundaries through `DB::transaction()` without formalizing the concept

## Related Knowledge Units

### Prerequisites
- Eloquent Relationships (HasMany, BelongsTo, HasOne) — defining and using model relationships
- Database Transactions — atomic operations with DB::transaction
- active-record-domain-layer — domain entities as Eloquent models

### Related Topics
- aggregate-roots
- domain-repositories
- bounded-contexts

### Advanced Follow-up Topics
- domain-services
- event-projections

## Research Notes
- Evans: *Domain-Driven Design* (2003), Chapter 6 on Aggregates
- Vaughn Vernon: *Implementing Domain-Driven Design* (2013), aggregate design guidelines
- Vernon recommends small aggregates as a default position
- Jimmy Bogard: "Keep aggregates small" — practical DDD advice
- Laravel community: aggregate discussions often framed as "what should be in a form request vs model validation"
