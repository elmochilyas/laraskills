# Anti-Patterns: Backoff Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K018 — Backoff Strategies |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Backoff Set (Default Zero) | Performance | Critical |
| 2 | Single Integer for All Retries | Reliability | High |
| 3 | Backoff Array Mismatched to Retry Count | Reliability | Medium |
| 4 | No Jitter for External API Calls | Performance | High |
| 5 | Not Logging Backoff Values | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Backoff on Any Job Class | backoff-strategies, tries-max-exceptions-retry-until | Critical |
| Assuming Jitter Is Automatic | backoff-strategies, progressive-backoff-arrays | Medium |
| Fixed Backoff for External APIs Without Rate Limit Respect | backoff-strategies | High |

---

## Anti-Pattern 1: No Backoff Set (Default Zero)

### Category
Performance — Wasted Retries

### Description
Not setting an explicit `$backoff` value on a job class. The default backoff is `0` — the job is immediately re-queued (`release(0)`) on failure, creating a tight retry loop that burns all retry attempts in milliseconds.

### Why It Happens
Developers forget to set `$backoff` after configuring `$tries`. The default behavior (immediate retry) is not obvious — especially since `$tries` and `$backoff` are separate properties.

### Warning Signs
- Job class has `$tries` set but no `$backoff`
- All retries are consumed in <1 second for transient failures
- Worker CPU spikes when jobs fail — rapid retry loop
- A transient network glitch causes the job to fail all retries instantly
- No delay between retry attempts in logs

### Why Harmful
A transient error (network timeout, deadlock) that would resolve in 5 seconds burns through all retries in milliseconds. The job is permanently failed before the transient condition resolves. The tight retry loop also wastes CPU and generates excessive logs.

### Real-World Consequences
A payment processing job has `$tries = 5` but no `$backoff`. The payment gateway returns a 503 (temporary outage) lasting 10 seconds. The job fails on attempt 1 at t=0, is immediately retried at t=0.001, fails again, retries at t=0.002 — all 5 attempts are consumed in 4ms. The job permanently fails. The gateway recovers at t=10s. The payment is never processed and no one is alerted because the job used all its retries before the gateway recovered.

### Preferred Alternative
Always set explicit `$backoff` on every job class with `$tries > 1`.

### Refactoring Strategy
1. Audit all job classes — identify those with `$tries` but no `$backoff`
2. Add `public $backoff = [10, 30, 60, 120]` based on expected transient recovery time
3. For simple jobs: at minimum set `public $backoff = 30` (fixed 30s delay)
4. Verify total retry window fits within job SLA
5. Monitor retry timing in logs after deployment

### Detection Checklist
- [ ] Job has `$tries > 1` but no `$backoff` property
- [ ] Retries completed in <1 second for transient failures
- [ ] Worker CPU spikes during failure bursts
- [ ] SLA violations from instant retry exhaustion

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-set-explicit-backoff (`05-rules.md`)
- **Skill**: Configure Backoff Strategies (`06-skills.md`)
- **Decision**: Fixed vs Exponential Backoff Selection (`07-decision-trees.md`)

---

## Anti-Pattern 2: Single Integer for All Retries

### Category
Reliability — Ineffective Retry Timing

### Description
Using a single integer for `$backoff` (e.g., `public $backoff = 30`) for all retry attempts. Every retry waits the same delay, regardless of attempt number — late retries (which should have longer waits) are treated the same as early retries (which should be quick).

### Why It Happens
The simplest `$backoff` syntax is a single integer. Developers don't think about progressive timing — they just want "some delay between retries."

### Warning Signs
- `public $backoff = <number>` on all job classes
- Late retries (attempts 4-5) wait the same as early retries (attempts 1-2)
- Short delay for late retries insufficient for persistent issues
- Long delay for early retries wastes time on transient glitches
- Team doesn't distinguish between early and late retry timing

### Why Harmful
A fixed delay is always wrong for at least some retries: too short for late retries (persistent issues need longer recovery), too long for early retries (a 120s wait for a 1-second network blip is wasteful). The total retry window is either too short (all retries with short delay) or too long (all retries with long delay).

### Real-World Consequences
A job calls an external API with `$tries = 5` and `$backoff = 60`. If the API has a 3-second outage, the job waits 60 seconds before retrying — the API recovered at t=3s, but the retry happens at t=60s. If the API has a 5-minute outage, the job waits 60s, retries, waits 60s, retries — runs out of retries at t=240s while the API recovers at t=300s. Fixed delay is never optimal.

### Preferred Alternative
Use exponential backoff array: `$backoff = [10, 30, 60, 120]` — early retries are quick, later retries are progressively longer.

### Refactoring Strategy
1. Identify jobs with fixed `$backoff` (single integer)
2. Research downstream service recovery profile
3. Replace with exponential array: first element = quick retry, last = long wait
4. Match array length to `$tries - 1`
5. Calculate total retry window: `sum(array) + sum(job execution time * tries)`

### Detection Checklist
- [ ] Single integer `$backoff` used
- [ ] Late retries wait the same as early retries
- [ ] Total retry window suboptimal
- [ ] No progressive backoff pattern

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-exponential-jitter-for-apis (`05-rules.md`)
- **Decision**: Fixed vs Exponential Backoff Selection (`07-decision-trees.md`)

---

## Anti-Pattern 3: Backoff Array Mismatched to Retry Count

### Category
Reliability — Silent Misconfiguration

### Description
Backoff array length doesn't match `$tries - 1`. Extra array elements are silently ignored; missing elements silently reuse the last value. Neither case produces a warning or error — the misconfiguration is invisible.

### Why It Happens
Developers add or remove retries without updating the backoff array. The array and `$tries` are separate properties with no validation linking them.

### Warning Signs
- `$tries = 5` with `$backoff = [10, 20]` (2 elements for 4 retries)
- `$tries = 3` with `$backoff = [10, 20, 40, 80]` (4 elements for 2 retries)
- Later retries unexpectedly use the same backoff as an earlier retry
- Changing `$tries` without updating `$backoff`
- Team unsure whether extra array elements are used

### Why Harmful
With a shorter array, retries 3 and 4 silently use the backoff of retry 2 — potentially too short for persistent issues. With a longer array, the extra elements are dead code — misleading documentation of intent.

### Real-World Consequences
A job has `$tries = 10` and `$backoff = [10, 30]`. Retries 1-2 use [10, 30] as intended. Retries 3-9 silently reuse `30` for all remaining retries. The developer believes retries 3-9 use `[60, 120, 240, ...]` pattern but the actual delays are `[10, 30, 30, 30, 30, 30, 30, 30, 30]`. The total retry window is 270s instead of the expected 5110s. Retries exhaust before the downstream service recovers.

### Preferred Alternative
Always ensure `count($backoff) === $tries - 1`. Each array element corresponds to one retry attempt.

### Refactoring Strategy
1. For each job: verify `count($backoff) === $tries - 1`
2. If array is shorter: add elements following the exponential pattern
3. If array is longer: remove extra elements or adjust `$tries`
4. Add a linting rule or test to validate backoff array length
5. Document the one-to-one correspondence between array elements and retries

### Detection Checklist
- [ ] `count($backoff) !== $tries - 1`
- [ ] Later retries silently reuse last array value
- [ ] Extra array elements are dead code
- [ ] No validation linking `$backoff` and `$tries`

### Related Rules/Skills/Decision Trees
- **Rule 3**: match-backoff-array-to-tries (`05-rules.md`)
- **Skill**: Configure Backoff Strategies (`06-skills.md`)

---

## Anti-Pattern 4: No Jitter for External API Calls

### Category
Performance — Thundering Herd

### Description
Using exponential backoff without jitter for external API calls. Without random variance, all workers that failed at roughly the same time retry at exactly the same time — creating a synchronized retry flood that can overwhelm the just-recovered downstream service.

### Why It Happens
Jitter is not automatic — Laravel's `$backoff` doesn't add random variance. Developers set the exponential array and assume that's sufficient. They don't know about the thundering herd problem.

### Warning Signs
- Exponential `$backoff` array without custom jitter implementation
- Downstream API shows periodic synchronized load spikes at retry intervals
- The API recovers from an outage, then is immediately overloaded by retry requests
- Monitoring shows all workers retrying at the same second
- Downstream provider reports "abuse pattern" after outages

### Why Harmful
The downstream API recovers from an outage — then immediately receives all retry requests simultaneously. The thundering herd can push the API back into degraded mode, resetting the recovery. The system wastes retries on a service that alternates between "failing" and "overloaded by retries."

### Real-World Consequences
A payment gateway has a 30-second outage. 50 workers fail simultaneously (same API call). All 50 jobs have `$backoff = [10, 30, 120]`. After 10 seconds, all 50 workers retry simultaneously — 50x API calls in the same millisecond. The payment gateway, which just recovered, is overwhelmed and returns 429 (rate limit). All 50 fail again. At t=40s (30s after first retry), all 50 retry simultaneously again. The gateway returns 503 again. The pattern repeats until retries exhaust.

### Preferred Alternative
Implement jitter for all external API calls. Add random variance to each backoff delay.

### Refactoring Strategy
1. Implement custom backoff middleware that adds jitter
2. For each backoff value: `$delay = $baseDelay + rand(0, $baseDelay * 0.1)` (10% jitter)
3. Apply middleware to all jobs making external API calls
4. Verify in staging that retry times are spread across a window, not synchronized
5. Monitor downstream API load during retry windows

### Detection Checklist
- [ ] Exponential backoff without jitter
- [ ] Synchronized retry timing across workers
- [ ] Downstream API retry floods after recovery
- [ ] No custom jitter implementation

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-exponential-jitter-for-apis (`05-rules.md`)
- **Decision**: Jitter: Add vs Don't Add (`07-decision-trees.md`)

---

## Anti-Pattern 5: Not Logging Backoff Values

### Category
Observability — Invisible Retry Timing

### Description
Not logging the backoff value on each job retry. Without logging, you can't verify that backoff is working as intended — a misconfigured array (e.g., `[0, 0, 0, 0]`) silently produces unexpected delays.

### Why It Happens
Teams log job start and completion but don't log retry metadata. The `$backoff` property isn't obviously an observable concern.

### Warning Signs
- Job logs show "retry attempt N" but no backoff value
- `$backoff` misconfiguration discovered during incident retro, not during normal operations
- Backoff behavior is "trust but don't verify"
- No metric tracking actual delays vs configured delays
- Team relies on manual inspection for backoff debugging

### Why Harmful
A zero backoff array (`[0, 0, 0, 0]`) goes undetected: jobs retry instantly, burn all attempts, and fail permanently — but the logs show only "retry 1/5, retry 2/5, retry 3/5..." without revealing the zero delay. The root cause is invisible.

### Real-World Consequences
A misconfigured job has `$backoff = [0, 0, 0]` (all zeros) due to a copy-paste error. The job fails 5 times instantly on a transient error. Logs show "Job failed, retrying (attempt 2/5)", "Job failed, retrying (attempt 3/5)", etc. — all within 10ms. The team suspects the downstream service but can't tell that the job didn't wait between retries. Debugging takes 2 hours. If the backoff value were logged, the zero delay would be immediately visible.

### Preferred Alternative
Log the backoff value on each retry attempt. Include attempt number and scheduled delay.

### Refactoring Strategy
1. Add logging in `handle()`: `$this->attempts()` and the backoff for this attempt
2. Log the actual delay before `release()`
3. Add a metric for actual vs configured delay
4. Create a dashboard showing retry timing distributions
5. Alert on backoff values that are suspiciously low ([0, 0, ...])

### Detection Checklist
- [ ] No backoff value logged on retry
- [ ] Backoff misconfiguration invisible in logs
- [ ] Retry timing not observable
- [ ] No metric for actual vs configured delay

### Related Rules/Skills/Decision Trees
- **Rule 4**: log-backoff-value-on-retry (`05-rules.md`)
