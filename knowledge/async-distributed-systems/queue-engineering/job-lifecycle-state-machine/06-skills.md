# Skill: Debug Jobs Using the Lifecycle State Machine

## Purpose
Trace a job through the lifecycle (dispatched → popped → processing → completed/failed) to debug retry loops, stuck jobs, and timeout anomalies.

## When To Use
When jobs behave unexpectedly (infinite retries, phantom processing, stuck in queue); when debugging timeout issues; when building custom monitoring.

## When NOT To Use
Normal job processing where no issues exist; when the state machine understanding isn't needed for the current task.

## Prerequisites
- Access to queue backend (Redis, database, SQS)
- Understanding of retry, timeout, and failure configuration
- Access to failed_jobs table or Horizon dashboard

## Inputs
- Job ID or UUID
- Queue backend type
- Job configuration ($tries, $maxExceptions, $timeout)

## Workflow
1. Identify the anomalous job in queue or failed_jobs table
2. Check current state: is it queued, reserved, processing, or failed?
3. If stuck in reserved: `retry_after` may have expired — check clock skew
4. If infinite retries: check `release()` is called with a delay
5. If processing forever: check `$timeout` properties and `--timeout`/`retry_after` relationship
6. If in failed_jobs: check `$tries` count and `$maxExceptions` — one may have been exceeded
7. Trace state transitions: has the job been released, deleted, or failed?

## Validation Checklist
- [ ] Job state identified correctly (queued, reserved, processing, failed)
- [ ] `release()` calls include a delay (no tight retry loops)
- [ ] `delete()` and `release()` not both called in error handlers
- [ ] `$tries` and `$maxExceptions` correctly configured
- [ ] Failed jobs are terminal — no auto-retry without `queue:retry`
- [ ] `retry_after` > `--timeout` to prevent reservation expiry

## Common Failures
- `release()` without delay — tight infinite retry loop
- Both `delete()` and `release()` called — `delete()` wins, retry skipped
- `$maxExceptions` exceeded before `$tries` — job fails "prematurely"

## Decision Points
- If job is in tight retry loop: check `release()` delay parameter
- If job fails with "too many exceptions": check `maxExceptions` config
- If job disappears and reappears: check `retry_after` vs `--timeout`

## Performance Considerations
- Each state transition = at least one backend operation
- Failed jobs add another backend write (DB insert)
- Tight retry loops cause CPU spikes

## Security Considerations
- Failed jobs may contain sensitive data in payload — configure failed_jobs table access
- Scheduled `queue:retry all` may retry jobs with side effects

## Related Rules
- Rule 1: always-delay-on-release
- Rule 2: never-call-delete-and-release
- Rule 3: drain-queue-before-changing-tries
- Rule 4: failed-jobs-are-terminal

## Related Skills
- Configure retry_after and --timeout to Prevent Double Processing
- Configure Retry Workflow for Failed Jobs

## Success Criteria
Anomalous job behavior is traced to a specific state transition issue, the root cause (release delay, timeout config, maxExceptions) is identified, and the fix is applied.
