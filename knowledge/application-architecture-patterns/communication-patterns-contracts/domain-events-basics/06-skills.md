# Skill: Design Domain Events Within and Across Contexts

## Purpose
Create immutable domain events named in past tense (`OrderPlaced`, `PaymentReceived`). Dispatch after DB commit using `dispatchAfterCommit`. Separate internal events (with entity references) from integration events (self-contained DTOs). Include aggregate ID. Keep payloads minimal.

## When To Use
- Decoupling side effects from primary operation
- Cross-context communication
- Triggering follow-up processes

## When NOT To Use
- Request-response flows (use contracts)
- Operations requiring immediate consistency (use sync contracts)

## Prerequisites
- Understanding of event-driven architecture
- Bounded contexts defined

## Inputs
- Business events that occur in the domain
- Cross-context integration needs

## Workflow
1. **Name domain events in past tense.** Events are immutable records of facts that already happened. `OrderPlaced`, not `PlaceOrder`. Past-tense reinforces this semantic.

2. **Dispatch events after DB commit.** Use `dispatchAfterCommit()` to dispatch events only if the transaction commits. Prevents phantom events for rolled-back changes.

3. **Separate internal events from integration events.** Internal events can carry entity references (e.g., `Order $order`). Integration events must be self-contained DTOs with no internal model references.

4. **Include the aggregate ID in every event.** Consumers use the aggregate ID to correlate events to the same business entity.

5. **Make domain events immutable.** Use `readonly` properties with promoted constructor. Events are facts — once published, they must never change.

6. **Model business facts, not technical events.** Name events after business concepts, not technical operations. `OrderShipped` conveys intent; `ModelUpdated` does not.

7. **Keep event payloads minimal.** Include only the data consumers need. Every field is a commitment — adding is easy, removing is breaking.

## Validation Checklist
- [ ] Events named in past tense
- [ ] Events dispatched after DB commit (`dispatchAfterCommit`)
- [ ] Integration events are self-contained (no entity references)
- [ ] Internal and integration events are separate classes
- [ ] Event payloads are minimal (not entire models)
- [ ] Aggregate ID included in every event
- [ ] Events are immutable (readonly properties)

## Common Failures
- **Technical events instead of domain events.** Firing `ModelSaved` instead of `OrderShipped` — consumers couple to technical details.
- **Too many fields.** Including unnecessary data — consumers depend on these fields, harder to change.
- **Dispatching before commit.** Events inside a transaction — rolled-back transactions send events anyway.

## Decision Points
- **Internal event vs Integration event?** Internal for same-context listeners. Integration for cross-context. Use separate classes to prevent leaking internals.

## Performance Considerations
- Sync event dispatching within a context: microseconds.
- Queued integration events: milliseconds to seconds latency.

## Security Considerations
- Integration events carry data across context boundaries. Ensure only necessary data is included.
- Never expose internal entity references across context boundaries.

## Related Rules
- Rule: Name domain events in past tense (CPC-02/05-rules.md)
- Rule: Dispatch events after DB commit (CPC-02/05-rules.md)
- Rule: Separate internal events from integration events (CPC-02/05-rules.md)
- Rule: Include the aggregate ID in every event (CPC-02/05-rules.md)
- Rule: Make domain events immutable (CPC-02/05-rules.md)
- Rule: Model business facts, not technical events (CPC-02/05-rules.md)
- Rule: Keep event payloads minimal (CPC-02/05-rules.md)

## Related Skills
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

## Success Criteria
- All domain events use past-tense naming with immutable readonly properties.
- Events are dispatched after DB commit using `dispatchAfterCommit`.
- Internal events are separate classes from integration events (no internals leaked across contexts).
- Every event includes the originating aggregate ID.
- Event payloads contain only the data consumers actually need.
