# Skill: Configure Backoff Strategies for Retry Timing

## Purpose
Set `$backoff` on job classes with exponential progression and jitter to control retry timing, prevent thundering herds, and match recovery windows.

## When To Use
Every job class with `$tries > 1`. Essential for external API calls where thundering herd prevention is critical.

## When NOT To Use
Jobs with custom middleware that handles release delay; testing environments (zero backoff acceptable for tests).

## Prerequisites
- `$tries` set on the job class
- Understanding of downstream service recovery profile

## Inputs
- Total retry count (`$tries`)
- Acceptable total retry window (SLA)
- Downstream recovery characteristics

## Workflow
1. Set `public $backoff = [10, 20, 40, 80]` — array length = `$tries - 1`
2. First element > 0 (minimum 5-10 seconds for transient recovery)
3. Use gradual doubling (not steep jumps)
4. Calculate total wait = sum of array values + total execution time — ensure fits SLA
5. For external APIs: add jitter via custom middleware to spread retry timing
6. For internal infrastructure: fixed backoff may be sufficient
7. Log the backoff value on each retry attempt

## Validation Checklist
- [ ] `$backoff` set on every job with `$tries > 1`
- [ ] Array length equals `$tries - 1`
- [ ] First element > 0
- [ ] Gradual doubling used (not steep jumps)
- [ ] Total retry window calculated and fits within SLA
- [ ] Jitter implemented for external API calls
- [ ] Backoff values logged on retry

## Common Failures
- No backoff set (default 0) — immediate retry loop burns CPU
- Single integer for all retries — late retries wait same as early ones
- Array longer than `$tries - 1` — extra elements never used, misleading
- Assuming jitter is automatic — all workers retry simultaneously

## Decision Points
- External API: exponential + jitter
- Internal DB: fixed or exponential
- Critical SLA: calculate total retry window precisely

## Related Rules
- Rule 1: always-set-explicit-backoff
- Rule 2: prefer-exponential-jitter-for-apis
- Rule 3: match-backoff-array-to-tries
- Rule 4: log-backoff-value-on-retry

## Related Skills
- Write Retry-Safe Job Classes
- Configure $backoff Array for Progressive Delays

## Success Criteria
Retries use progressive delays that match recovery profiles, thundering herds are prevented via jitter, total retry window fits within SLA, and backoff behavior is observable in logs.
