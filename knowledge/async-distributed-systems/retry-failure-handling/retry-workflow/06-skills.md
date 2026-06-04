# Skill: Retry Failed Jobs Safely

## Purpose
Use `queue:retry` and Horizon retry to re-dispatched failed jobs without flooding the queue, accounting for attempt counter non-reset and payload age.

## When To Use
After fixing the root cause of a job failure; for ad-hoc recovery of transient failures; for automated retry pipelines of well-understood failures.

## When NOT To Use
Without investigating root cause first; `queue:retry all` on large failed_jobs tables without filtering; jobs with expired `retryUntil()`.

## Prerequisites
- Access to failed_jobs table or Horizon dashboard
- Root cause identified and fixed

## Inputs
- Failed job UUID(s) to retry
- Payload age for old failures

## Workflow
1. Investigate the failure cause from `failed_jobs.exception` first
2. Fix the underlying issue (code, config, data, downstream service)
3. Test a single retry: `php artisan queue:retry {uuid}`
4. If single retry succeeds: `php artisan queue:retry all` for remaining
5. For old failures: delete jobs older than threshold first
6. For batch retries: `php artisan queue:retry-batch {batchId}`
7. Account for attempt counter not resetting — retried job starts from existing attempt count

## Validation Checklist
- [ ] Root cause investigated before retrying
- [ ] Single test retry succeeds before retrying all
- [ ] Old failures (>7 days) pruned or skipped
- [ ] Attempt counter non-reset accounted for
- [ ] `retryUntil()` not expired for time-sensitive jobs
- [ ] Failed jobs table monitored after batch retry

## Common Failures
- Retrying without investigation — same exception, immediate re-failure
- `queue:retry all` without filtering — floods queue with hundreds of jobs
- Assuming retry resets attempt counter — job fails immediately if exceeds $tries
- Ignoring payload age — references to deleted data cause re-failure

## Decision Points
- Single failure: retry by UUID
- Batch failures: retry-batch
- All failures: retry all after verifying single success
- Old failures: prune before retrying

## Related Rules
- Rule 1: investigate-before-retrying
- Rule 2: retry-does-not-reset-attempts
- Rule 3: test-single-retry-before-all
- Rule 4: consider-payload-age-before-retry

## Related Skills
- Write Retry-Safe Job Classes
- Use Failure Taxonomy: Release vs Exception vs Fail

## Success Criteria
Failed jobs are retried only after root cause is fixed, single test retry confirms fix, attempt counter limitations are accounted for, and the queue isn't overwhelmed by retry flood.
