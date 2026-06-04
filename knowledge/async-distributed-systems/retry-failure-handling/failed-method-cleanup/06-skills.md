# Skill: Implement `failed()` Method for Job-Specific Cleanup

## Purpose
Override `failed(Throwable $e)` on job classes to perform per-job cleanup, compensation, and notification when the job permanently fails.

## When To Use
Jobs with temporary resources (file locks, temp files, API reservations) that must be released on failure; jobs needing job-specific failure logging with constructor context; dispatching to dead-letter queue.

## When NOT To Use
Global failure logging or metrics — use `Queue::failing` event instead; complex I/O that could itself throw (exceptions from `failed()` are silently caught).

## Prerequisites
- Job class with `$tries` set
- Understanding of `failed()` idempotency requirements

## Inputs
- `Throwable $e` — the final exception
- Constructor properties for job-specific context

## Workflow
1. Override `failed(Throwable $e)` on the job class
2. Keep body lightweight: log, release resources, dispatch notification
3. Make idempotent: guard with file_exists, status checks before cleanup
4. Call `parent::failed($e)` when extending a base job class
5. Never throw from `failed()` — exception is silently caught
6. Use `Queue::failing` event for cross-cutting concerns (metrics, alerting)
7. Dispatch DLQ routing from `failed()` if applicable

## Validation Checklist
- [ ] `failed()` overridden on classes needing cleanup
- [ ] Body is lightweight — no complex I/O
- [ ] Idempotent — safe to call multiple times
- [ ] `parent::failed($e)` called in subclasses
- [ ] No throw from `failed()` body
- [ ] Global concerns handled in `Queue::failing`, not `failed()`
- [ ] Resources released (locks, temp files, API reservations)

## Common Failures
- Not calling `parent::failed()` in subclasses — parent cleanup never runs
- Assuming single execution — double cleanup on retry causes errors
- Complex logic in `failed()` — silent failure if it throws
- Using for global logging — code duplication across all job classes

## Decision Points
- Job-specific cleanup: `failed()` method
- Cross-cutting alerting: `Queue::failing` event
- DLQ routing: `failed()` with dispatch to dead-letter queue

## Related Rules
- Rule 1: keep-failed-lightweight
- Rule 2: make-failed-idempotent
- Rule 3: use-event-for-global-failed
- Rule 4: call-parent-failed-in-subclasses

## Related Skills
- Listen to `Queue::failing` for Global Failure Monitoring
- Implement a Dead-Letter Queue for Permanently Failed Jobs
- Configure `failed_jobs` Storage and Pruning

## Success Criteria
`failed()` methods are lightweight, idempotent, release job-specific resources, call parent when extending, and global monitoring is handled via `Queue::failing`.
