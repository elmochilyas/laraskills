# Skill: Configure $backoff Array for Progressive Delays

## Purpose
Use `$backoff` arrays to set per-attempt progressive delays with precise control over retry timing windows.

## When To Use
When fine-grained control over retry timing is needed; critical production paths with varying recovery profiles per attempt; when total retry window must fit within a specific SLA.

## When NOT To Use
Simple uniform backoff is sufficient — use a single integer instead.

## Prerequisites
- `$tries` set on the job class
- Understanding of total cumulative wait time

## Inputs
- Retry count ($tries - 1)
- Desired delay per retry attempt
- Total acceptable retry window

## Workflow
1. Determine array length = `$tries - 1` (one element per retry)
2. Set first element to 10-30 seconds (minimal recovery window)
3. Progress with gradual doubling: `[10, 20, 40, 80]`
4. Calculate total wait: sum of all array elements
5. Verify total wait fits within SLA
6. Update array when `$tries` changes
7. Never use 0 as first element

## Validation Checklist
- [ ] Array length = `$tries - 1`
- [ ] First element > 0
- [ ] Gradual doubling (not steep jumps)
- [ ] Total retry window fits SLA
- [ ] Array updated when $tries changes
- [ ] No extra unused elements

## Common Failures
- Array longer than `$tries - 1` — misleading configuration
- First element is 0 — no recovery window
- Exponential growth too steep — cumulative delay exceeds SLA
- $tries increased but array not updated — last value repeats

## Decision Points
- 3 retries: `$backoff = [10, 30]`
- 5 retries: `$backoff = [10, 20, 40, 80]`
- 10 retries: consider using retryUntil() instead for time-based cutoff

## Related Rules
- Rule 1: match-array-to-tries-minus-one
- Rule 2: first-backoff-element-greater-than-zero
- Rule 3: prefer-gradual-doubling
- Rule 4: calculate-total-retry-window

## Related Skills
- Configure Backoff Strategies for Retry Timing
- Write Retry-Safe Job Classes

## Success Criteria
Backoff array matches retry count, first retry has reasonable delay, values double gradually, and total retry window is calculated and fits within SLA.
