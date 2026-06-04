# Skill: Prevent Duplicate Job Dispatches with ShouldBeUnique

## Purpose
Implement `ShouldBeUnique` to prevent duplicate instances of the same job from being queued, using entity-scoped unique IDs and TTL to avoid stale locks.

## When To Use
When duplicate job dispatch must be prevented (webhook processing, recurring tasks); when you need only one instance of a job per entity in the queue.

## When NOT To Use
When you need to prevent concurrent execution (use `WithoutOverlapping` middleware instead); when the second dispatch should wait (not be dropped); when duplicates are harmless (idempotent jobs).

## Prerequisites
- Cache driver configured (for unique lock storage)
- Understanding of dispatch vs execution prevention

## Inputs
- Job class
- Entity identifier for uniqueness scoping
- Maximum expected queue wait + execution time

## Workflow
1. Add `implements ShouldQueue, ShouldBeUnique` to job class
2. Override `uniqueId()`: return entity-scoped key (e.g., `$this->eventId`)
3. Override `uniqueFor()`: set TTL = max queue wait + max execution + buffer
4. Optionally combine with `WithoutOverlapping` middleware for execution-level prevention
5. For locks that release when processing starts: use `ShouldBeUniqueUntilProcessing`

## Validation Checklist
- [ ] `uniqueId()` overridden to return entity-scoped key (not default class name)
- [ ] `uniqueFor()` set to reasonable TTL (default 0 is dangerous — never expires on crash)
- [ ] TTL covers queue wait time + execution time + buffer
- [ ] `ShouldBeUnique` combined with `WithoutOverlapping` for strict guarantees
- [ ] Second dispatch correctly dropped (not executed)

## Common Failures
- Not overriding `uniqueId()` — only ONE instance of the job can ever be queued
- Not setting `uniqueFor` (default 0) — crashed job blocks all future dispatches forever
- Confusing with `WithoutOverlapping` — ShouldBeUnique prevents dispatch, not execution

## Decision Points
- Prevent duplicate DISPATCH: use ShouldBeUnique
- Prevent duplicate EXECUTION: use WithoutOverlapping middleware
- Both: combine ShouldBeUnique + WithoutOverlapping

## Performance Considerations
- Lock acquisition: cache operation (~1-5ms) per dispatch
- Lock release: cache operation per job completion
- Dropped dispatches save queue storage and worker time

## Security Considerations
- Stale lock from crash blocks all future dispatches — always set `uniqueFor`
- Unique key must not leak sensitive information

## Related Rules
- Rule 1: override-unique-id-per-entity
- Rule 2: always-set-unique-for-ttl
- Rule 3: match-unique-for-to-total-time
- Rule 4: combine-with-without-overlapping

## Related Skills
- Prevent Concurrent Job Execution with WithoutOverlapping
- Add RateLimited Middleware to Jobs

## Success Criteria
Duplicate dispatches of the same job for the same entity are silently dropped, the lock auto-releases after the TTL, and a stale lock from a crash does not permanently block future dispatches.
