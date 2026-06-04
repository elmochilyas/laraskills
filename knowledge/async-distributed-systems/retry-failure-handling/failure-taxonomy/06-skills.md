# Skill: Use Failure Taxonomy — Release vs Exception vs Fail

## Purpose
Correctly categorize job errors as release (controlled backoff), exception (automatic retry), or fail (terminal), applying the right response per error type.

## When To Use
When handling errors in job `handle()` methods; when designing retry and failure behavior.

## When NOT To Use
Jobs with uniform failure characteristics where one response fits all.

## Prerequisites
- Understanding of release, exception, and fail state machine
- Knowledge of downstream service error types

## Inputs
- Exception types thrown by the job
- Recovery profile per error type

## Workflow
1. Map each exception type to appropriate response
2. For known rate limits: use `$this->release($delay)` — consumes no retry attempt
3. For transient errors (timeouts, 503s): throw exception — let retry mechanism handle
4. For permanent errors (400s, validation, auth): call `$this->fail()` — immediate terminal
5. Never throw exception when `release()` is appropriate
6. Never `fail()` for transient errors
7. Log the release/retry type explicitly for monitoring

## Validation Checklist
- [ ] Exception types mapped to correct response
- [ ] Rate limits use `release()` not exceptions
- [ ] Permanent errors use `fail()` not exceptions
- [ ] Release doesn't consume retry attempts
- [ ] Release ratio vs success rate monitored
- [ ] Retry type logged explicitly

## Common Failures
- Throwing exception when `release()` is appropriate — consumes retry attempt
- `fail()` for transient errors — job fails permanently on recoverable error
- Not distinguishing release from exception in logs — cannot differentiate controlled vs uncontrolled retries

## Decision Points
- Rate limit hit: `release()` with delay from Retry-After header
- Connection timeout: throw exception (transient)
- Invalid input data: `fail()` (permanent)
- 429 response: `release()` controlled delay
- 400 response: `fail()` permanent
- 500 response: throw exception (transient)

## Related Rules
- Rule 1: map-exceptions-to-retry-behavior
- Rule 2: prefer-fail-for-unrecoverable
- Rule 3: no-exception-when-release-appropriate
- Rule 4: monitor-release-ratio

## Related Skills
- Write Retry-Safe Job Classes
- Configure Backoff Strategies for Retry Timing

## Success Criteria
Each error type receives the correct response, retry attempts are not wasted on permanent failures, rate limits use controlled release, and release frequency is monitored separately from failure frequency.
