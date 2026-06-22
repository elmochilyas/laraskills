# Skill: Distinguishing Laravel Events from Event Sourcing

## Purpose
Use precise terminology when describing event-driven architecture in Laravel applications. Correctly identify when Laravel events (decoupling mechanism) are sufficient and when full event sourcing (event store, aggregates, projections, replay) is genuinely required. Prevent architectural miscommunication with stakeholders, auditors, and team members.

## When To Use
- Describing an event-driven architecture to stakeholders, auditors, or new team members
- Deciding whether to adopt event sourcing for a new feature or domain
- Reviewing code that uses Laravel events and needs to determine if it's being described incorrectly as "event sourcing"
- Writing architecture documentation or ADRs that mention events
- Building audit logging and needing to name it correctly (audit log, not event store)

## When NOT To Use
- When no event-driven patterns are being discussed
- For simple CRUD with no events, listeners, or audit logging
- When the team already has deep event sourcing expertise and terminology is consistently correct

## Prerequisites
- Understanding of Laravel's `event()` system and event listeners
- Familiarity with Eloquent model lifecycle events (`$dispatchesEvents`, observers)
- Awareness of `spatie/laravel-event-sourcing` as a real event sourcing package
- Understanding of audit logging vs. event store as distinct concepts

## Inputs
- The architectural claim being evaluated (e.g., "we use event sourcing for orders")
- The actual implementation (Laravel events? Audit log table? spatie/laravel-event-sourcing?)
- The business requirements (audit history? temporal queries? undo/redo? compliance?)
- The audience for the terminology (stakeholders, auditors, developers, compliance team)

## Workflow
1. **Identify what the system actually does** — Does it fire `event()` and have listeners? Does it persist events to a table? Does it have aggregates, projections, and replay? Map the implementation to the correct terminology.
2. **Check for event sourcing components** — Verify the presence of: append-only event store, aggregates that produce events, projections that build read models, snapshots, versioned events, and replay capability. All six are required for event sourcing.
3. **Classify the pattern** — If only `event()` + listeners: "domain events" or "side-effect events." If events persisted for debugging/compliance: "audit log" or "event audit table." If all six components present: "event sourcing."
4. **Correct imprecise terminology** — If the system is described as "event sourcing" but lacks the components, correct the terminology. Explain the distinction to stakeholders without condescension.
5. **Evaluate whether event sourcing is needed** — Check for concrete requirements: legal audit history, temporal queries, undo/redo, compliance-mandated immutability. If none exist, recommend plain CRUD + domain events + audit log.
6. **Name persisted event records correctly** — If events are stored for debugging, name the table `model_events`, `audit_log`, or `activity_log` — not `event_store` or `domain_events`.
7. **Dispatch domain events at the right boundary** — Domain events (`OrderPlaced`, `SubscriptionCancelled`) should be dispatched explicitly in actions/services, not via model lifecycle hooks (`$dispatchesEvents`).

## Validation Checklist
- [ ] Terminology is precise: "domain events" vs "event sourcing" vs "audit log" vs "lifecycle hooks"
- [ ] Event sourcing claims are backed by all six components (event store, aggregates, projections, snapshots, versioning, replay)
- [ ] Laravel events are described as "side-effect decoupling," not "state derivation"
- [ ] Audit log tables are named `model_events`, `audit_log`, or `activity_log` — not `event_store`
- [ ] Domain events are dispatched explicitly in business logic, not via `$dispatchesEvents`
- [ ] No claims about "replaying events to rebuild state" unless event sourcing infrastructure exists
- [ ] Documentation and ADRs use correct terminology consistently

## Common Failures
- Calling Laravel events "event sourcing" because the system fires `event()` and has listeners
- Naming an audit log table `event_store` because "we store events"
- Dispatching domain events via `$dispatchesEvents` and having them fire during seeders and imports
- Adopting event sourcing for a simple CRUD app because it "sounds more architectural"
- Describing side-effect listeners as "projections" when they don't rebuild read models

## Decision Points
- **Is the system using `event()` + listeners only?** — That's domain events, not event sourcing
- **Are events persisted to a table?** — If for debugging/compliance, it's an audit log. If for state derivation, it may be event sourcing (check for all six components)
- **Does the business need temporal queries or replay?** — If yes, event sourcing may be justified. If no, plain CRUD + domain events is sufficient
- **Is the audience expecting replay capability?** — If stakeholders expect replay and the system can't replay, the terminology is wrong

## Performance Considerations
- Laravel events add minimal overhead (microseconds for synchronous dispatch)
- Event sourcing replay on large streams is slow without snapshots — plan for snapshotting every N events
- Audit log tables grow unboundedly — plan for partitioning, archiving, or cleanup
- Event store growth: millions of events consume significant storage; plan for partitioning or archiving

## Security Considerations
- Event payloads in an event store persist forever — never include secrets, tokens, or raw passwords
- Audit logs may contain PII — apply GDPR right-to-erasure considerations
- Projections may cache sensitive data from events — apply the same access controls as the source data
- For event sourcing with GDPR requirements, consider crypto-shredding (delete encryption key, not the event)

## Related Rules (from 05-rules.md)
- Never Call Laravel Events "Event Sourcing"
- Dispatch Domain Events Explicitly in Business Logic, Not via Model Lifecycle Hooks
- If You Store Events for Debugging, Call It an "Audit Log"
- Only Adopt Event Sourcing When Requirements Demand It
- Event Sourcing Requires Append-Only Immutability

## Related Skills
- After-commit events and jobs (deferring side-effect events until transaction commits)
- Domain events in Eloquent (explicit business event dispatching)
- Audit logging patterns (model_events table for compliance)

## Success Criteria
- No Laravel event system is described as "event sourcing" in code, docs, or communication
- Audit log tables are named correctly (not `event_store`)
- Event sourcing is only adopted when concrete requirements (temporal queries, legal audit, replay) exist
- Domain events are dispatched at business boundaries, not ORM lifecycle boundaries
- Stakeholders understand exactly what the event system does and doesn't do
