# Skill: Implement ShouldQueue Correctly Across All Queueable Types

## Purpose
Apply the `ShouldQueue` marker interface correctly on jobs, mail, notifications, broadcast events, and event listeners to ensure proper async processing.

## When To Use
When creating any new queueable class — job, listener, mailable, notification, or broadcast event.

## When NOT To Use
Jobs that must always execute synchronously — use `dispatchSync()` instead of removing the interface.

## Prerequisites
- Understanding of ShouldQueue as a marker interface (no methods to implement)
- Queue connection configured

## Inputs
- Queueable class type (job, listener, mail, notification, broadcast event)
- Sync vs async requirements for each caller

## Workflow
1. Add `implements ShouldQueue` to job class (always, even if some callers need sync)
2. For sync callers: use `Job::dispatchSync()` — never remove the interface
3. For queued listeners: add `implements ShouldQueue` and `use SerializesModels`
4. For mail: use `Mail::queue()` not `Mail::send()` in production
5. For notifications: send normally — channels determine queuing
6. For broadcast events: implement `ShouldBroadcast` (extends ShouldQueue)
7. Verify `instanceof ShouldQueue` check passes for all proper types

## Validation Checklist
- [ ] Job classes always implement `ShouldQueue`
- [ ] Sync callers use `dispatchSync()`, not interface removal
- [ ] Queued listeners use `SerializesModels` trait
- [ ] `Mail::queue()` used in production (not `Mail::send()`)
- [ ] Broadcast events use `ShouldBroadcast` or `ShouldBroadcastNow`
- [ ] Interface not conditionally removed for sync behavior

## Common Failures
- Removing `ShouldQueue` for sync callers — breaks async for all other callers
- No `SerializesModels` on queued listeners — full event payload serialized
- `Mail::send()` in production — blocks HTTP request for SMTP
- Confusing `ShouldQueue` with `Dispatchable` trait

## Decision Points
- Jobs: always implement ShouldQueue, use dispatchSync for sync
- Listeners: implement ShouldQueue for I/O operations
- Mail: always use `Mail::queue()` in production

## Performance Considerations
- `instanceof ShouldQueue` check is a single bitwise operation — immeasurably fast
- Overhead comes from serialization and queue transport, not from the contract check

## Security Considerations
- Sensitive jobs should implement ShouldQueue even when dispatchSync is common — keeps the interface contract intact
- Mail queuing prevents SMTP latency information leaks

## Related Rules
- Rule 1: always-implement-should-queue
- Rule 2: add-serializes-models-to-listeners
- Rule 3: never-mail-send-in-production
- Rule 4: dont-remove-shouldQueue-for-sync

## Related Skills
- Use PendingDispatch Correctly to Prevent Silent Job Loss
- Configure Queueable Mail, Notifications, and Broadcast Events

## Success Criteria
All queueable types use ShouldQueue consistently, sync callers use dispatchSync without removing the interface, listeners use SerializesModels, and mail is always queued in production.
