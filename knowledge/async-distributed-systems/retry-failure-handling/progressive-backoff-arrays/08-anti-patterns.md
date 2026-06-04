# Anti-Patterns: `$backoff` Array for Progressive Delays

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K019 — Progressive Backoff Arrays |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Backoff Array Mismatched to Retry Count | Design | Medium |
| 2 | First Backoff Element Set to 0 | Reliability | High |
| 3 | Steep Exponential Jumps in Backoff Array | Performance | Medium |
| 4 | Not Calculating Total Retry Window | Design | Medium |
| 5 | Modifying `$tries` Without Updating Backoff Array | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Backoff Arrays (Single Integer Only) | progressive-backoff-arrays, backoff-strategies | Medium |
| No Total Retry Window Calculation | progressive-backoff-arrays | Medium |

---

## Anti-Pattern 1: Backoff Array Mismatched to Retry Count

### Category
Design — Misleading Configuration

### Description
Setting a `$backoff` array whose length doesn't match `$tries - 1`. Extra elements are silently ignored (never used, misleading). Missing elements silently reuse the last value (unintended behavior). Neither case warns the developer.

### Why It Happens
Developers configure `$backoff` and `$tries` as independent properties. Changing one without updating the other is easy to overlook.

### Warning Signs
- `$tries = 3` with `$backoff = [10, 30, 60, 120]` (2 retries, 4 elements)
- `$tries = 5` with `$backoff = [10, 30]` (4 retries, 2 elements)
- Extra array elements with no effect on behavior
- Later retries unexpectedly use same delay as earlier one
- Code reviewer can't determine intended retry count

### Why Harmful
A reviewer sees 4 backoff values and assumes 5 total attempts (the job class has `$tries = 3`). The last 2 values are dead code. Conversely, a short array causes unplanned timing — retry 3 silently uses the same delay as retry 2.

### Real-World Consequences
A job has `$tries = 5` and `$backoff = [10, 30]`. The team believes retries 3-4 use `[60, 120]` (following the doubling pattern), but they actually use `[30, 30]`. The total retry window is `10 + 30 + 30 + 30 = 100s` — far shorter than the intended `10 + 30 + 60 + 120 = 220s`. A downstream API needs 150s to recover — the job exhausts retries at 100s and permanently fails.

### Preferred Alternative
Always ensure `count($backoff) === $tries - 1`. Add a CI linting rule to validate.

### Refactoring Strategy
1. Audit all job classes for backoff array length vs `$tries - 1`
2. Fix mismatches: add/remove elements to match
3. Add a static analysis rule or test to prevent future mismatches
4. Document the one-to-one correspondence in team coding standards

### Detection Checklist
- [ ] `count($backoff) !== $tries - 1`
- [ ] Extra array elements are dead code
- [ ] Later retries silently reuse last value
- [ ] No validation linking backoff and tries

### Related Rules/Skills/Decision Trees
- **Rule 1**: match-array-to-tries-minus-one (`05-rules.md`)
- **Skill**: Configure $backoff Array (`06-skills.md`)
- **Decision**: Backoff Array Length vs $tries Alignment (`07-decision-trees.md`)

---

## Anti-Pattern 2: First Backoff Element Set to 0

### Category
Reliability — No Recovery Window

### Description
Setting the first element of the `$backoff` array to 0 (e.g., `$backoff = [0, 30, 60]`). The first retry runs immediately — no recovery window for transient errors. The same condition that caused the failure is likely still present, causing immediate re-failure.

### Why It Happens
Developers think "retry quickly" and set a 0-second initial delay. They don't consider that even transient errors need at least a few seconds to resolve.

### Warning Signs
- `$backoff[0] === 0`
- First retry fails immediately (same exception within milliseconds)
- First retry is always wasted — second retry is the effective first retry
- Total retry window doesn't include the 0-second "first wait"
- Team complains about "first retry always failing"

### Why Harmful
The first retry is always wasted — the transient condition (network glitch, deadlock, rate limit) hasn't had time to resolve. This effectively reduces `$tries` by 1. With `$tries = 3` and `$backoff = [0, 30]`, only 2 meaningful attempts exist (initial + second retry).

### Real-World Consequences
A job has `$tries = 5` and `$backoff = [0, 30, 60, 120]`. The first retry (t+0s) fails immediately — the transient network issue hasn't recovered. The second retry (t+30s) succeeds on a 10-second recovery. But the job has now consumed 3 attempts (original + 2 retries) out of 5, leaving only 2 more. The first retry was completely wasted. Over 10,000 jobs, 10,000 wasted executions.

### Preferred Alternative
Set the first backoff element to at least 5-10 seconds — enough time for transient conditions to resolve.

### Refactoring Strategy
1. Find all job classes with `$backoff[0] === 0`
2. Replace 0 with 5-30 seconds depending on expected transient duration
3. Standard minimum: `$backoff = [10, ...]`
4. Verify total retry window still fits within SLA after adjustment
5. Add a linting rule to reject 0 as first backoff element

### Detection Checklist
- [ ] `$backoff[0] === 0`
- [ ] First retry always fails (no recovery time)
- [ ] Effective `$tries` reduced by 1
- [ ] Wasted first retry execution

### Related Rules/Skills/Decision Trees
- **Rule 2**: first-backoff-element-greater-than-zero (`05-rules.md`)
- **Skill**: Configure $backoff Array (`06-skills.md`)

---

## Anti-Pattern 3: Steep Exponential Jumps in Backoff Array

### Category
Performance — Poor Timing Distribution

### Description
Using steep exponential jumps in the backoff array (e.g., `[5, 600, 3600]`). Early retries are too aggressive (5 seconds), and later retries are too conservative (600, 3600 seconds). The timing doesn't match realistic recovery behavior.

### Why It Happens
Developers try to "cover all bases" with extreme values — very quick first retry, very long last retry. They don't consider the middle, which is where most recoveries happen.

### Warning Signs
- Backoff values jump by 10x or more between consecutive elements
- `$backoff = [5, 600, 3600]` or similar extreme jumps
- Early retries too fast (no recovery), late retries too slow (wasted time)
- Most jobs recover at the second retry (if they recover at all)
- Total retry window is dominated by the last element

### Why Harmful
If the transient error needs 30 seconds to resolve: the 5-second retry is too early (fails), the 600-second retry is too late (wastes 570 seconds of waiting). The job could have succeeded at t+30s but waits until t+605s. This adds unnecessary latency to the recovery.

### Real-World Consequences
A job calls an external API with `$backoff = [5, 600, 3600]`. The API has a 2-minute recovery window. The job retries at 5s (fails — API still down), then waits 600s (10 minutes) to retry again. The API recovered at t+120s, but the job doesn't retry until t+605s. The job waits 485 extra seconds unnecessarily. The queue backlog grows while the job sits idle.

### Preferred Alternative
Use gradual doubling: `[10, 20, 40, 80]`. Each retry is 2x the previous, providing smooth progression.

### Refactoring Strategy
1. Identify arrays with >4x jumps between consecutive elements
2. Replace with gradual doubling starting at 10-30 seconds
3. Keep total retry window roughly the same by adjusting the count
4. Verify the middle retries have reasonable timing
5. Document the chosen progression pattern for consistency

### Detection Checklist
- [ ] >4x jump between consecutive backoff elements
- [ ] Early retries too fast, late retries too slow
- [ ] Most recoveries happen in middle range (ignored by steep jumps)
- [ ] Total retry window dominated by single long element

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-gradual-doubling (`05-rules.md`)
- **Decision**: Exponential Progression Multiplier Selection (`07-decision-trees.md`)

---

## Anti-Pattern 4: Not Calculating Total Retry Window

### Category
Design — Missed SLA

### Description
Setting `$backoff` and `$tries` without calculating the total retry window — the maximum time before permanent failure. Sum of all backoff delays + total execution time = maximum time. Without calculation, the total may far exceed the acceptable SLA.

### Why It Happens
Developers add backoff values intuitively without summing them. They don't realize that `[300, 600, 1800, 3600]` + execution time = over 6,300 seconds (1.75 hours) of waiting before failure.

### Warning Signs
- No documented total retry window calculation
- `$backoff` values are large (300+) with multiple retries
- Job fails 2+ hours after first dispatch for persistent errors
- Users experience long delays while waiting for failure notification
- SLA for job completion is shorter than total retry window

### Why Harmful
A critical job (payment processing, password reset) takes 2 hours to fail permanently. The user receives no feedback during that time. They retry manually (creating duplicates) or assume the system is broken. Meanwhile, the job burns through all retry attempts with long delays between them.

### Real-World Consequences
A password reset email job has `$tries = 5` and `$backoff = [300, 600, 1800, 3600]`. Total retry window: 6,300 seconds (1.75 hours). The email service is down for 30 minutes. The job retries at 5min, 15min, 45min, 1.75h. The service recovers at 30min, but the job doesn't retry until 45min. The user waits 45 minutes for their password reset email.

### Preferred Alternative
Calculate total retry window: `sum(backoff) + (avg_execution_time * tries)`. Verify it fits within SLA.

### Refactoring Strategy
1. For each job class, calculate total retry window
2. Compare to job's SLA
3. If window > SLA: reduce `$tries`, reduce backoff values, or use `retryUntil()` for time-based cutoff
4. Document the calculated window in a comment or metadata
5. Monitor actual failure times to verify the window is respected

### Detection Checklist
- [ ] Total retry window not calculated
- [ ] Large backoff values with multiple retries
- [ ] Job takes hours to fail permanently
- [ ] Retry window exceeds SLA

### Related Rules/Skills/Decision Trees
- **Rule 4**: calculate-total-retry-window (`05-rules.md`)
- **Skill**: Configure $backoff Array (`06-skills.md`)

---

## Anti-Pattern 5: Modifying `$tries` Without Updating Backoff Array

### Category
Reliability — Configuration Drift

### Description
Increasing or decreasing `$tries` without corresponding updates to the `$backoff` array. Increased `$tries` causes silent reuse of the last backoff value for new retries. Decreased `$tries` leaves unused elements in the array.

### Why It Happens
`$tries` and `$backoff` are separate lines in the job class. A developer changes one without thinking about the relationship.

### Warning Signs
- Git history shows `$tries` changes without `$backoff` changes in the same commit
- Backoff array no longer matches `$tries - 1`
- New retries use the same delay as the previous last retry
- Removed retries leave unused array elements
- Code review process doesn't check backoff when tries changes

### Why Harmful
After increasing `$tries` from 3 to 5 without updating `$backoff`, the original `$backoff = [10, 30]` now covers 2 of 4 retries. Retries 3 and 4 silently use `30` (the last value) — progressively shorter than intended. The job runs out of retries faster than expected.

### Real-World Consequences
A team increases `$tries` from 3 to 10 for call reliability but forgets to update `$backoff = [10, 30]`. The first retry waits 10s, second waits 30s, then retries 3-9 all wait 30s. Total wait: `10 + 30 + 30*7 = 250s`. The team expected progressive backoff up to 5+ minutes. The job exhausts retries in 4 minutes instead of the intended 15+ minutes.

### Preferred Alternative
When modifying `$tries`, always review and update the backoff array to maintain the progressive timing pattern.

### Refactoring Strategy
1. Add code review checklist item: "Does this `$tries` change need a `$backoff` update?"
2. When increasing `$tries`: extend the array following the existing progression pattern
3. When decreasing `$tries`: trim the array to match
4. Add a test that validates backoff array length equals `$tries - 1`
5. Consider using a constant or helper to define both together

### Detection Checklist
- [ ] `$tries` changed without `$backoff` update
- [ ] Array doesn't match new `$tries - 1`
- [ ] New retries silently reuse last value
- [ ] No code review check for tries-backoff alignment

### Related Rules/Skills/Decision Trees
- **Rule 1**: match-array-to-tries-minus-one (`05-rules.md`)
