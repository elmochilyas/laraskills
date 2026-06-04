# Skill: Write Retry-Safe Job Classes ($tries, $maxExceptions, retryUntil)

## Purpose
Configure `$tries`, `$maxExceptions`, and `retryUntil()` on every job class to prevent infinite retries and match failure behavior to error types.

## When To Use
When creating any new job class. Always set explicit retry limits.

## When NOT To Use
Jobs with `retryUntil()` may safely leave `$tries` as null.

## Prerequisites
- Understanding of retry mechanism and attempt counter
- Knowledge of downstream service reliability characteristics

## Inputs
- Max attempt count
- Max exception tolerance
- Time-based cutoff (optional)

## Workflow
1. Set `public $tries = 3` on every job class
2. For time-sensitive jobs: define `retryUntil()` returning a Carbon instance
3. For jobs with unreliable downstream: set `$maxExceptions ≤ $tries`
4. Keep `$maxExceptions` smaller than `$tries` to fail early on persistent exceptions
5. Never leave `$tries = null` without `retryUntil()` defined
6. Match `--tries` worker flag to be >= max job `$tries` for safe worker-level fallback

## Validation Checklist
- [ ] `$tries` set explicitly on every job class
- [ ] `$maxExceptions ≤ $tries` (if both set)
- [ ] `retryUntil()` returns valid Carbon when used
- [ ] Not leaving `$tries = null` without time-based cutoff
- [ ] Worker `--tries` >= max job `$tries`

## Common Failures
- `$tries` not set (null) — infinite retries, job runs forever
- `$maxExceptions > $tries` — exception limit never triggers
- `retryUntil()` returns null — unlimited retries

## Decision Points
- Exact retry count needed: use `$tries`
- Time-based retry window: use `retryUntil()`
- Protection against exception bursts: use `$maxExceptions`

## Related Rules
- Rule 1: always-set-explicit-tries
- Rule 2: prefer-retryUntil-for-api-calls
- Rule 3: max-exceptions-less-than-tries
- Rule 4: no-infinite-retries-without-until

## Related Skills
- Configure Backoff Strategies for Retry Timing
- Use Failure Taxonomy: Release vs Exception vs Fail

## Success Criteria
Jobs have explicit retry limits, time-sensitive jobs use retryUntil(), exception burst protection prevents rapid re-failure, and no job retries indefinitely.
