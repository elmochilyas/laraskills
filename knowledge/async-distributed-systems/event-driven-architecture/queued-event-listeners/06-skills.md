# Skill: Queue Event Listeners with `ShouldQueue`

## Purpose
Implement `ShouldQueue` on event listeners to dispatch them asynchronously via the queue system, preventing I/O-heavy listeners from blocking the event dispatcher.

## When To Use
Listeners making external network calls (HTTP APIs, SMTP, SMS); expensive I/O (file processing, image manipulation); listeners tolerating eventual consistency (notifications, analytics).

## When NOT To Use
Listeners updating local database state needing immediate consistency; listeners running in same transaction as dispatch; listeners with <5ms execution time (queue overhead dominates); critical event ordering.

## Prerequisites
- Event class with serializable properties (no closures, resources)
- Queue connection configured
- Listener class in `app/Listeners`

## Inputs
- Event class to listen for
- Queue configuration (connection, queue, tries, backoff)

## Workflow
1. Implement `ShouldQueue` on listener: `class SendNotification implements ShouldQueue`
2. Add `InteractsWithQueue, Queueable, SerializesModels` traits
3. Set `$tries = 3` explicitly — never leave as null
4. Set `$connection` and `$queue` for dedicated listener processing
5. Set `$backoff` array for retry timing
6. Add `SerializesModels` if event contains Eloquent models
7. Keep event properties serializable — no closures, no resources
8. Implement `failed()` on listener if cleanup needed on permanent failure
9. Test listener's `handle()` method directly — NOT through `Event::fake()` alone

## Validation Checklist
- [ ] `ShouldQueue` implemented on listener
- [ ] `$tries` set to finite number (or `retryUntil()` defined)
- [ ] `SerializesModels` added if event has Eloquent models
- [ ] Event properties serializable (no closures, resources)
- [ ] Queue connection and queue assigned
- [ ] `$backoff` set for retry timing
- [ ] Listener `handle()` tested directly
- [ ] `failed()` implemented if cleanup needed
- [ ] Inline fast listeners still synchronous

## Common Failures
- No `$tries` — listener retries forever on permanent failure
- No `SerializesModels` — full model graph serialized, large payloads
- Non-serializable event properties — job fails at dispatch time
- Testing only with `Event::fake()` — listener logic never executed
- Queuing ALL listeners — fast listeners add unnecessary overhead

## Decision Points
- Network I/O: always queue
- Local DB update with 5ms execution: inline
- Mixed: queue the heavy listener, keep fast one inline

## Related Rules
- Rule 1: set-tries-on-queued-listeners
- Rule 2: add-serializes-models-to-listener
- Rule 3: keep-events-serializable
- Rule 4: test-queued-listeners-directly

## Related Skills
- Write Retry-Safe Job Classes
- Configure Backoff Strategies for Retry Timing
- Implement `failed()` Method for Job-Specific Cleanup

## Success Criteria
Heavy listeners are queued with finite retries, model serialization uses `SerializesModels`, events remain serializable, and listener logic is tested directly.
