# Write Model Separation

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Write model separation isolates the persistence logic for mutations from the rest of the application. While read models focus on query optimization, write models focus on consistency, validation, and business rule enforcement. In Laravel, this means creating dedicated classes (command handlers, write-only repositories, or write-only models) that handle state changes. This prevents accidental reads through write paths and keeps the write side optimized for transactional integrity.

## Core Concepts
- **Write Model:** The part of the domain model that handles state changes, enforcing invariants and business rules.
- **Command Handler:** An action-like class that receives a command DTO and executes a write operation.
- **Write-Optimized Persistence:** Storage strategy optimized for writes (normalized tables, minimal indexes, no denormalization).
- **Transactional Consistency:** Ensuring the write model's state transitions are atomic and consistent.
- **Command Bus:** A dispatcher that routes commands to their handlers (Laravel's Bus is the natural fit).

## Mental Models
- **The Bank Teller vs. The ATM Screen:** The teller (write model) handles deposits, withdrawals — operations that must be correct and atomic. The ATM screen (read model) just shows the balance. They serve different purposes.
- **The Typewriter vs. The Printer:** The typewriter (write model) carefully validates every keystroke (business rules). The printer (read model) just outputs clean pages. You don't proofread on the printer.
- **The Vault vs. The Display Case:** The vault (write model) is where transactions happen — strict, secure, logged. The display case (read model) shows items in their best light, denormalized for viewing.

## Internal Mechanics
1. A command DTO is created with the input data for the operation.
2. The command is dispatched to its handler (via Laravel's Bus or direct injection).
3. The handler loads the write model (or creates it).
4. The handler calls domain logic methods that enforce invariants.
5. The handler persists the write model (or delegates to a write repository).
6. The handler dispatches domain events.

## Patterns
- **Command + Handler:** Separate command DTO and handler class per operation.
- **Command + Self-Handling Action:** The command DTO implements ShouldBeHandled or is handled by an action.
- **Write-Only Repository:** Repository interface only has store methods — no ind or query methods.
- **Event Sourcing Write Model:** Aggregate root methods append events instead of mutating state.
- **Optimistic Concurrency:** Write model uses a version column to prevent conflicting updates.

## Architectural Decisions
- Separate write models from read models when write operations have complex transactional requirements.
- Use command handlers when you want explicit, named operations for every state change.
- Separate when the write model uses event sourcing but reads need traditional queries.
- Separate when write performance and read performance have conflicting optimization strategies.
- Keep writes simple when the application is CRUD-dominant with minimal business rules.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Write side optimized for transactional integrity | Dual model maintenance — more classes | Worth it when write rules are complex |
| Clear audit trail of every command | Eventual consistency for reads | Acceptable for non-financial domains |
| Business rules explicitly enforced in one place | Higher initial build cost | Reduces bugs in complex domains |
| Easy to add command logging/auditing | Learning curve for CQRS-lite | Enforces discipline in state management |
| Write model can use different storage (event store, NoSQL) | Must keep read model in sync | Adds infrastructure complexity |

## Performance Considerations
- Write models should avoid expensive JOINs and denormalized queries (those belong in reads).
- Command handlers are ideal for queue dispatch — write-heavy operations can be async.
- Optimistic concurrency adds a version-check query per write — negligible for most applications.
- Event-sourced write models append only — significantly faster than UPDATE-heavy workloads.

## Production Considerations
- **Audit Logging:** Log every command with its input, timestamp, and user.
- **Concurrency:** Use Model::where('version', ) for optimistic locking.
- **Validation:** Command validation happens in the handler or a dedicated validator; never trust the client.
- **Idempotency:** Design command handlers to be idempotent (same command executed twice produces same result).
- **Monitoring:** Track command execution times and failure rates.

## Common Mistakes
- Reading from the write model in the same request that writes — use the returned model or refresh.
- Putting query logic in a write model — write models should not have get* query methods.
- Making write models anemic — all validation in the handler, none on the model.
- Using the write model for reporting — report queries should hit read models or a dedicated reporting database.
- Forgetting to handle command rejection (validation errors, concurrency conflicts).

## Failure Modes
- **Write Model Anemia:** All logic in the handler, model is just a property bag. Mitigate: push invariants to the model.
- **Command Explosion:** 100+ command classes for a simple CRUD app. Mitigate: use model methods for simple mutations; commands for complex transactions.
- **Stale Write Model:** Handler loads the model, another request modifies it, first handler overwrites. Mitigate: optimistic concurrency with version column.
- **Partial Command:** Handler saves some state but fails before completing. Mitigate: always wrap command handlers in transactions.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [Read Model Separation](../read-model-separation/02-knowledge-unit.md) — Complementary pattern (the read side).
- [Action Class Patterns](../action-class-patterns/02-knowledge-unit.md) — Actions are natural command handlers.
- [Ports and Adapters](../ports-and-adapters/02-knowledge-unit.md) — Write model behind an interface (port).
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Eloquent as the write adapter.

### Advanced Follow-up Topics

## Ecosystem Usage
- **Laravel Bus:** pp(HandleOrderPlaced::class)->handle() — Laravel's command bus is the native command handler dispatcher.
- **spatie/laravel-event-sourcing:** Aggregate roots as write models, projectors for read models.
- **Laravel Spark:** Command-like actions for team/user management with write separation.
- **Laravel Horizon:** Metrics commands (write) separated from display (read).
- **hexagonal-architecture projects:** Write model behind a write-only repository interface.

## Research Notes
- **Greg Young:** CQRS — commands mutate, queries return. Write model strictly for mutations.
- **Eric Evans (DDD):** Aggregate roots are the natural write model boundary.
- **Martin Fowler:** CQRS-lite — separate command/query models but same data store.
- **Laravel 11.x docs:** Bus, commands, handlers — framework provides the infrastructure.