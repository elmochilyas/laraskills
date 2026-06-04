# Skill: Choose Between Synchronous and Queued Event Handling

## Purpose
Default to synchronous handlers within a context (for consistency) and queued handlers across contexts (for availability). Keep critical side effects synchronous. Queue expensive operations. Always set `$afterCommit = true` on queued handlers.

## When To Use
- When registering event listeners that may be sync or queued
- When designing cross-context event communication

## When NOT To Use
- No event-driven communication (no events used)

## Prerequisites
- Domain events defined (CPC-02)
- Queue worker configured

## Inputs
- Event listener list
- Criticality and cost assessment per handler

## Workflow
1. **Default to sync within context, queue across contexts.** Within a context, events are part of the same transactional boundary — sync ensures consistency. Across contexts, queuing decouples availability.

2. **Keep critical side effects synchronous.** Operations requiring transactional consistency (inventory deduction, balance updates) must run synchronously. Queuing these risks inconsistent state on worker failure.

3. **Queue expensive or slow operations.** Defer email sending, PDF generation, report building, and third-party API calls to the queue. Synchronous execution blocks the HTTP response.

4. **Always set `$afterCommit = true` on queued handlers.** This ensures the event is only queued if the database transaction commits. Prevents phantom events for rolled-back changes.

5. **Do not queue everything indiscriminately.** Mix sync and queued handlers intentionally. If all handlers are queued and the worker goes down, the entire system becomes inconsistent.

6. **A single event can have both sync and queued listeners.** Register some listeners as sync (critical), others as queued (expensive or cross-context).

## Validation Checklist
- [ ] Sync handlers used within context
- [ ] Queued handlers used across contexts
- [ ] `$afterCommit` is set on all queued event handlers
- [ ] Critical side effects are sync (not queued)
- [ ] Expensive operations are queued (not sync)
- [ ] Not all handlers are queued (mix of sync and queue)

## Common Failures
- **Queuing everything.** Every event queued, even critical side effects — worker down = inconsistent state.
- **Sync for expensive operations.** Processing email/report synchronously — user waits unnecessarily.
- **Not configuring `afterCommit` for queued events.** Dispatched in transaction, transaction rolls back, event already queued — phantom events.

## Decision Points
- **Sync vs Queue for a specific handler?** Sync if the side effect must be consistent within the transaction. Queue if it can tolerate eventual consistency or is expensive.

## Performance Considerations
- Sync: adds microseconds per handler. Blocks response.
- Queue: request completes faster (work deferred). Adds milliseconds to seconds of latency for the handler.

## Security Considerations
- Queued handlers run as the application, not as the original user. Authorization context is lost.
- Ensure queued handlers don't need user-specific authorization context.

## Related Rules
- Rule: Default to sync within context, queue across contexts (CPC-03/05-rules.md)
- Rule: Keep critical side effects synchronous (CPC-03/05-rules.md)
- Rule: Queue expensive or slow operations (CPC-03/05-rules.md)
- Rule: Always set `$afterCommit = true` on queued handlers (CPC-03/05-rules.md)
- Rule: Do not queue everything indiscriminately (CPC-03/05-rules.md)

## Related Skills
- Design Domain Events (CPC-02/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

## Success Criteria
- Within-context events use synchronous handlers for consistency.
- Cross-context integration events use queued handlers with `$afterCommit = true`.
- Critical side effects (inventory, balance) are always sync.
- Expensive operations (email, PDF, API calls) are always queued.
- Event listeners are a deliberate mix of sync and queued — not all queued.
