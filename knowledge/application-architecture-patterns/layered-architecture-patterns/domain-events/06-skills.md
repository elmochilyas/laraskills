# Skill: Define and Dispatch Domain Events in Laravel

## Purpose
Decouple domain logic from side effects by raising Domain Events when significant business events occur, allowing Infrastructure to manage persistence, notifications, and integration in separate listeners.

## When To Use
- Multiple side effects follow a single domain operation (send email, update search index, log audit)
- Need to decouple business logic from infrastructure concerns
- Cross-aggregate communication required
- Audit trail of domain operations needed

## When NOT To Use
- Simple CRUD with no side effects beyond persistence
- Event is infrastructure-only (e.g., SQL triggers, cache invalidation)
- Side effects MUST happen atomically in the same transaction

## Prerequisites
- Understanding of Domain-Driven Design tactical patterns
- Laravel event system or message bus
- Clean/Hexagonal Architecture for layer separation

## Inputs
- Identified domain occurrences (InvoicePaid, OrderShipped, UserRegistered)
- List of side effects per event
- Event dispatch timing requirements (immediate vs deferred)

## Workflow
1. **Identify Domain Events.** Work with domain experts to identify significant business occurrences. Name them in past tense with the Ubiquitous Language (e.g., `InvoicePaid`, not `InvoicePaymentDone`). Events are facts — things that already happened.

2. **Create Event classes in Application/Domain boundary layer.** Create plain PHP event classes (may implement an `DomainEvent` marker interface). Include only relevant data as immutable constructor parameters. Never include Laravel-specific traits.

3. **Dispatch events in Domain or Application layer.** Record events inside Aggregate methods before persistence. Dispatch through a DomainEventCollector or directly to an event bus. Dispatch BEFORE persisting.

4. **Create Listener classes in Infrastructure.** Create Infrastructure listeners that handle each Domain Event. Listeners may persist, send notifications, update search indexes, or dispatch integration events. One listener per side effect.

5. **Register Event-Listener mapping in Service Provider.** Use Laravel's `EventServiceProvider` `$listen` array or an infrastructure-aware event registration. Keep Infrastructre listeners outside Domain/Application layers.

6. **Handle event failures gracefully.** Use Laravel's `ShouldQueue` on listeners for reliability. Implement `failed()` for dead-letter tracking. Consider `dispatchAfterCommit` for atomicity.

7. **Test Domain Events.** Write unit tests verifying the correct events are dispatched from Aggregate methods. Write integration tests verifying Infrastructure listeners respond correctly.

## Validation Checklist
- [ ] Event class is in Domain/Application or has a `DomainEvent` marker interface
- [ ] Event names are past tense and express business meaning
- [ ] Events carry only relevant immutable data
- [ ] Events are dispatched BEFORE persistence
- [ ] Listener is in Infrastructure, not Domain/Application
- [ ] Event-Listener mapping in Service Provider
- [ ] Critical listeners are queued for reliability
- [ ] Tests verify event dispatch from business operations
- [ ] Tests verify listener side effects
- [ ] No Laravel traits in Domain Event classes

## Common Failures
- **Commands vs Events confusion.** Domain Events are facts about the past (`InvoicePaid`). Commands are intentions (`PayInvoice`). Use commands for CQRS, events for facts.
- **Events carrying too much data.** Include only data needed by listeners. Prefer identifiers (e.g., aggregate IDs) over full object serialization.
- **Infrastructure leaks into event classes.** Event classes with `ShouldQueue` trait or `SerializesModels`. Keep events pure.
- **Ordering assumptions.** Listeners should not assume other listeners execute first. Event processing must be idempotent.
- **Missing events.** Forgetting to dispatch common lifecycle events (created, updated, deleted). Be systematic.

## Decision Points
- **Synchronous vs Async dispatch?** Synchronous for intra-aggregate consistency; async for cross-context integration. Default to async for non-critical side effects.
- **In-process bus vs Laravel Events vs Message Queue?** Laravel Events for simple cases; separate message queue (RabbitMQ/SQS) for distributed systems.
- **Stored Events vs in-memory dispatch?** Store events in database for audit/event sourcing; in-memory dispatch for simpler integration.

## Performance Considerations
- Synchronous events add latency proportional to listener execution time.
- Queued events offload processing but add eventual consistency.
- For high-throughput applications, batch event processing improves throughput.

## Security Considerations
- Events may contain sensitive data — avoid including user secrets, passwords, tokens.
- Access control decisions should not be based on Event data alone — events are facts, not authorization checks.
- Event replay attacks: ensure event processing is idempotent.

## Related Rules
- Rule: Domain Events Are Past Tense Facts (LAP-08/05-rules.md)
- Rule: Dispatch Before Persistence (LAP-08/05-rules.md)
- Rule: Events at Domain Boundary (LAP-08/05-rules.md)
- Rule: Listener in Infrastructure Layer (LAP-08/05-rules.md)
- Rule: No Laravel Traits in Domain Events (LAP-08/05-rules.md)
- Rule: Events Carry Minimal Required Data (LAP-08/05-rules.md)
- Rule: Critical Listeners Use Queue (LAP-08/05-rules.md)
- Rule: Events Must Be Idempotent (LAP-08/05-rules.md)

## Related Skills
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Design Event-Driven Integrations via Queue (SLP-11/06-skills.md)
- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)

## Success Criteria
- Domain Events represent significant business occurrences with past tense names.
- Infrastructure handles all side effects — Domain/Application layers dispatch events and proceed.
- Listeners are idempotent, queued for reliability, and do not assume execution order.
- Tests verify correct event dispatch from business operations.
