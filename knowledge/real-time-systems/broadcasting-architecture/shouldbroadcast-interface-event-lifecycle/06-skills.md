# Skill: Create and Customize ShouldBroadcast Events

## Purpose
Design and implement `ShouldBroadcast` events with full control over channels, payloads, naming, conditional dispatch, and queue routing.

## When To Use
- Creating new broadcast events for real-time features
- Refactoring existing events to add payload control or conditional broadcasting
- Setting up transaction-aware broadcasting with `ShouldDispatchAfterCommit`

## When NOT To Use
- Simple CRUD broadcasting (use model broadcasting with `BroadcastsEvents` trait)
- Client-originated events (use client events/whispers instead)

## Prerequisites
- Laravel broadcasting configured (queue worker, broadcast driver)
- Understanding of channel types (public, private, presence)

## Inputs
- Event class implementing `ShouldBroadcast`
- `broadcastOn()` returning channel array
- Optional: `broadcastWith()`, `broadcastAs()`, `broadcastWhen()`, `broadcastQueue()`

## Workflow
1. Create event class: `php artisan make:event OrderShipped`
2. Implement `ShouldBroadcast` interface
3. Define `broadcastOn()` to return channel instances (`Channel`, `PrivateChannel`, `PresenceChannel`)
4. Override `broadcastWith()` to control the serialized payload (never send entire models)
5. Override `broadcastAs()` to provide a stable dot-notation event name
6. Implement `broadcastWhen()` to gate dispatch on business conditions
7. Add `ShouldDispatchAfterCommit` for events dispatched within database transactions
8. Define `broadcastQueue()` to route to a dedicated broadcasts queue
9. Mark sensitive properties as `protected` or `private` to exclude from serialization
10. Dispatch via `event()`, `broadcast()`, or `::dispatch()`

## Validation Checklist
- [ ] `broadcastOn()` returns valid channel instances
- [ ] `broadcastWith()` controls payload explicitly (no auto-serialized public properties with sensitive data)
- [ ] `broadcastAs()` provides a stable event name (not the FQCN default)
- [ ] `broadcastWhen()` gates dispatch for business-appropriate conditions
- [ ] `ShouldDispatchAfterCommit` implemented for transaction-dependent events
- [ ] Sensitive data is `protected` or `private` (never `public`)
- [ ] Events route to a dedicated broadcast queue

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Entire model sent to clients | No `broadcastWith()` override | Add `broadcastWith()` returning only needed fields |
| Client never receives event | Namespace mismatch in Echo config | Set `namespace: ''` when using `broadcastAs()` |
| Events dispatched before DB commit | `ShouldDispatchAfterCommit` missing | Implement the interface for transaction-dependent events |
| Queue backlog of broadcast events | No dedicated broadcast queue | Set `broadcastQueue()` or `$queue` property |

## Decision Points
- **`ShouldBroadcastNow`**: Use only for sub-100ms latency-critical events; accept HTTP response delay
- **`broadcastWhen()`**: Filter early to prevent unnecessary queue jobs
- **Dedicated queue**: Always isolate broadcast events from other job types

## Performance/Security Considerations
- `broadcastWith()` is the primary control for payload size—keep lean
- Public properties are auto-serialized; mark sensitive data as `protected` or `private`
- `ShouldBroadcastNow` bypasses the queue—use sparingly
- Route to a dedicated queue connection to prevent broadcast backlog from starving other jobs

## Related Rules (from 05-rules.md)
- Always Override `broadcastWith()` to Control Event Payload
- Always Use `broadcastAs()` for Stable Client-Side Event Names
- Always Use `ShouldDispatchAfterCommit` for Transactional Consistency
- Always Define `broadcastWhen()` to Gate Unnecessary Broadcasts
- Always Route Broadcast Events to a Dedicated Queue
- Never Expose Sensitive Data in Public Event Properties

## Related Skills
- Configure and Operate Laravel Broadcasting Architecture
- Use Model Broadcasting with the BroadcastsEvents Trait

## Success Criteria
- Events deliver correct payload to authorized clients
- Sensitive data is never exposed in broadcast payloads
- Events only dispatch when business conditions are met
- Queue backlog for broadcasts is isolated from other job types
