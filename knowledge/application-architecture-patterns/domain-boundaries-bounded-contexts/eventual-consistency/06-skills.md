# Skill: Manage Eventual Consistency Across Context Boundaries

## Purpose
Use eventual consistency as the default pattern for cross-context data synchronization. Make event handlers idempotent. Design UIs to tolerate stale data. Monitor the consistency window. Implement read-your-writes consistency for initiating users. Define acceptable staleness windows per data type.

## When To Use
- Cross-context data doesn't need immediate consistency for correct behavior
- Context independence is valued over strong consistency

## When NOT To Use
- Operation depends on another context's data being current (use synchronous call instead)

## Prerequisites
- Understanding of event-driven communication
- Bounded contexts with event dispatching

## Inputs
- Cross-context data synchronization requirements
- Acceptable staleness windows per data type

## Workflow
1. **Default to eventual consistency for cross-context data synchronization.** Use events for data propagation across contexts. Eventual consistency enables context independence.

2. **Make all event handlers idempotent.** Use `updateOrCreate` or deduplication tracking. Events may be delivered more than once (at-least-once semantics).

3. **Design UIs to tolerate stale cross-context data.** Build interfaces that function correctly even when cross-context data is slightly stale. Show staleness indicators if needed.

4. **Monitor the consistency window.** Track the average time between event dispatch and processing. Set up alerting when the window exceeds the defined threshold.

5. **Implement read-your-writes consistency for the initiating user.** When a user initiates a change that triggers eventual consistency, ensure they see their own write immediately on subsequent reads.

6. **Use synchronous contract calls when current data is required for correctness.** For financial transactions, authorization checks, and other correctness-critical operations, use synchronous calls.

7. **Define and document acceptable staleness windows per data type.** Different data types have different freshness requirements. Document the maximum staleness for each type.

8. **Use conflict resolution strategies for concurrent writes.** Define explicit strategies (last-write-wins, version-based, or manual) for data that can be modified in multiple contexts.

9. **Set up alerting for consistency window breaches.** Configure alerts that fire when the consistency window exceeds defined thresholds for any data type.

## Validation Checklist
- [ ] Event handlers are idempotent
- [ ] Staleness window is defined and acceptable
- [ ] UIs handle stale cross-context data gracefully
- [ ] Consistency window is monitored
- [ ] Read-your-writes consistency implemented for writers
- [ ] Synchronous calls used for correctness-critical operations
- [ ] Acceptable staleness windows defined per data type
- [ ] Conflict resolution strategies defined for concurrent writes
- [ ] Alerting configured for consistency window breaches

## Common Failures
- **Assuming strongly consistent data.** Reading cross-context data without accounting for staleness — user sees old data.
- **No staleness tolerance.** Building UIs requiring perfectly consistent cross-context data — defeats event-driven decoupling.
- **No monitoring of inconsistency.** Not tracking consistency window — staleness grows silently.

## Decision Points
- **Eventual consistency vs synchronous call?** Eventual consistency for display data, non-critical operations. Synchronous calls for operations requiring current data (financial, authorization).

## Performance Considerations
- Eventual consistency is faster for writes (no distributed lock), but reads may be stale.
- Consistency window is typically milliseconds in a modular monolith (in-process event dispatch).

## Security Considerations
- Stale authorization data can cause security issues. If user permissions change, ensure propagation is fast enough.
- Idempotent handlers prevent duplicate security-sensitive operations.

## Related Rules
- Rule: Default to eventual consistency for cross-context data synchronization (DBC-12/05-rules.md)
- Rule: Make all event handlers idempotent (DBC-12/05-rules.md)
- Rule: Design UIs to tolerate stale cross-context data (DBC-12/05-rules.md)
- Rule: Monitor the consistency window (DBC-12/05-rules.md)
- Rule: Implement read-your-writes consistency (DBC-12/05-rules.md)
- Rule: Use synchronous contract calls when current data required (DBC-12/05-rules.md)
- Rule: Define and document acceptable staleness windows per data type (DBC-12/05-rules.md)
- Rule: Use conflict resolution strategies for concurrent writes (DBC-12/05-rules.md)
- Rule: Set up alerting for consistency window breaches (DBC-12/05-rules.md)

## Related Skills
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)
- Implement Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
- Implement Distributed Tracing (CPC-11/06-skills.md)

## Success Criteria
- Eventual consistency is the default pattern for all cross-context data synchronization.
- All event handlers are idempotent (use updateOrCreate or deduplication).
- UIs gracefully handle stale data with staleness indicators where needed.
- Consistency window is monitored with alerting for threshold breaches.
- Read-your-writes consistency ensures initiating users see their own changes immediately.
- Synchronous calls are used for correctness-critical operations (financial, authorization).
- Acceptable staleness windows are documented per data type with defined conflict resolution strategies.
