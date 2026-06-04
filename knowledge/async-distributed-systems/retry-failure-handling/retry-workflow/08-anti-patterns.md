# Anti-Patterns: Retry Workflow (`queue:retry`, Horizon Retry)

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K024 — Retry Workflow |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Retrying Without Investigating Root Cause | Operations | Critical |
| 2 | Assuming Retry Resets Attempt Counter | Reliability | High |
| 3 | `queue:retry all` Without Testing Single First | Operations | High |
| 4 | Retrying Old Failed Jobs Without Checking Payload Age | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Automated Retry Without Root Cause Fix | retry-workflow, dead-letter-queue-pattern | Critical |
| Retry Flood Saturating Workers | retry-workflow | High |

---

## Anti-Pattern 1: Retrying Without Investigating Root Cause

### Category
Operations — Repeated Failure

### Description
Running `queue:retry` or clicking Horizon's retry button without first investigating the failure's root cause. The same exception occurs again, wasting worker time and queue capacity. The retry cycle repeats until someone investigates.

### Why It Happens
Urgency — the team sees failed jobs and wants to fix the problem quickly. Retrying is immediate; investigation takes time. The intuitive response is "retry and see if it works this time."

### Warning Signs
- `queue:retry all` executed multiple times for the same failures
- Same exception appearing repeatedly across retry cycles
- Workers processing immediately-failing jobs in a loop
- Operator retries without checking `failed_jobs.exception` first
- High retry volume but low success rate

### Why Harmful
Each retry cycle without investigation floods the queue with jobs that will fail again immediately. Workers waste time on doomed jobs. The queue backlog grows. Legitimate jobs are delayed. The `failed_jobs` table fills with duplicate entries, making investigation harder.

### Real-World Consequences
An API key expires. 5,000 jobs fail with 401 errors. The on-call engineer runs `queue:retry all` without checking the exception. All 5,000 jobs fail again in 2 minutes. The engineer runs `queue:retry all` again — same result. After 3 cycles, 15,000 failed_jobs entries exist. Workers spent 6 minutes processing failing jobs instead of legitimate work. The engineer finally checks the exception, finds "401 Unauthorized," updates the API key, and retries — all 5,000 succeed.

### Preferred Alternative
Always check the exception type in `failed_jobs.exception` before retrying. Investigate unknown or permanent-looking errors first.

### Refactoring Strategy
1. Establish retry SOP: check exception -> fix cause -> test single retry -> retry all
2. Add automation: script that reads exception types and blocks retry for known permanent errors
3. During incident response: require at least glance at exception before retrying
4. Monitor retry-to-success ratio — high ratio indicates retry-without-investigation pattern
5. Add a delay before automated retry to force investigation window

### Detection Checklist
- [ ] Retries executed without checking exception
- [ ] Same exception repeats across retry cycles
- [ ] Operators retry "hoping it works this time"
- [ ] No retry SOP or investigation requirement

### Related Rules/Skills/Decision Trees
- **Rule 1**: investigate-before-retrying (`05-rules.md`)
- **Skill**: Retry Failed Jobs Safely (`06-skills.md`)
- **Decision**: Automated Retry vs Manual Retry Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: Assuming Retry Resets Attempt Counter

### Category
Reliability — Immediate Re-Failure on Retry

### Description
Assuming that retrying a job resets the attempt counter to 0. The attempt counter is stored in the serialized payload — when re-dispatched from `failed_jobs`, the payload still shows the previous attempt count. A job with `$tries=3` that failed after 3 attempts gets only 1 more attempt on retry.

### Why It Happens
Intuitively, "retry" sounds like "try again from the beginning." The framework doesn't reset the counter, and this behavior is not prominently documented.

### Warning Signs
- Retried jobs fail immediately with "MaxAttemptsExceeded" or similar
- Operator confused that "retry didn't work"
- Retried job's `attempts()` value is >1 on the first execution
- Jobs with `$tries=3` that exhausted all attempts fail again immediately on retry
- Team discovers that retry gives only 1 additional attempt

### Why Harmful
The retried job fails before doing any meaningful work — `attempts()` returns the original count, which already exceeds `$tries`. The operator thinks the retry mechanism is broken. The job permanently fails again without processing.

### Real-World Consequences
A job with `$tries = 5` exhausts all 5 attempts and lands in `failed_jobs`. The operator fixes the underlying issue (renews API key) and runs `queue:retry`. The job is re-dispatched with `attempts = 5` in the payload. At execution, the worker sees `attempts(5) >= tries(5)` and marks it as failed immediately without calling `handle()`. The job fails again. The operator is confused — "I fixed the API key, why did it fail again?" The job requires a 6th attempt that exceeds `$tries`.

### Preferred Alternative
Account for existing attempts before retrying. If needed, increase `$tries` for retried jobs, or use `retryUntil()` instead.

### Refactoring Strategy
1. Before retrying a job that exhausted `$tries`: consider manually increasing `$tries` in the payload
2. Use `retryUntil()` for time-based cutoff instead of `$tries` count-based
3. When retrying: test with one job first and check `$attempts` in retry logs
4. For automated retry pipelines: increment `$tries` in payload before re-dispatch
5. Document the non-reset behavior in team runbooks

### Detection Checklist
- [ ] Retried jobs fail immediately without calling handle()
- [ ] Operator confused by retry behavior
- [ ] Attempt counter not accounted for before retry
- [ ] Jobs with exhausted `$tries` retried without adjustment

### Related Rules/Skills/Decision Trees
- **Rule 2**: retry-does-not-reset-attempts (`05-rules.md`)
- **Skill**: Retry Failed Jobs Safely (`06-skills.md`)

---

## Anti-Pattern 3: `queue:retry all` Without Testing Single First

### Category
Operations — Queue Flooding

### Description
Running `queue:retry all` without first testing a single retry. If the underlying issue isn't resolved, all failed jobs flood the queue and fail again immediately — saturating workers and delaying legitimate work.

### Why It Happens
Speed — "fix the issue and retry everything at once" is the fastest apparent path. Testing a single retry adds a verification step that seems unnecessary when the fix is believed to be correct.

### Warning Signs
- `queue:retry all` executed as the standard retry workflow
- No test-retry-batch step in the SOP
- Retry floods correlate with worker saturation and backlog growth
- `failed_jobs` grows by hundreds of rows in minutes after retry all
- Operators express surprise that "the fix didn't work" after retrying all

### Why Harmful
If the fix didn't work, `queue:retry all` amplifies the damage. 500 jobs are re-dispatched and fail again in seconds. Workers are saturated with failing jobs for minutes. Legitimate jobs are delayed. The `failed_jobs` table gains 500 more entries. The queue backlog takes time to drain.

### Real-World Consequences
A team fixes a supposed API issue and runs `queue:retry all` for 1,200 failed jobs. The "fix" was incorrect — the API is still returning errors. All 1,200 jobs fail again in 4 minutes. Workers spend 4 minutes processing nothing but failures. The queue grows by 2,000 new legitimate jobs during this time (normal traffic). It takes 30 minutes to catch up. If they had tested one first, they would have discovered the fix was incomplete and saved the 1,200 re-failures.

### Preferred Alternative
Test a single retry first. If it succeeds, retry the rest. If it fails, investigate further.

### Refactoring Strategy
1. Add single-retry step to retry SOP: `queue:retry {uuid}` for one representative job
2. Monitor the single retry for 30-60 seconds
3. If success: `queue:retry {uuid1} {uuid2} ...` in batches of 100
4. If failure: check exception and fix again
5. Consider automated retry pipelines that use batch retry with verification

### Detection Checklist
- [ ] `queue:retry all` without single test first
- [ ] Multiple retry-all cycles for same failures
- [ ] Workers saturated with re-failing jobs
- [ ] No test-retry SOP

### Related Rules/Skills/Decision Trees
- **Rule 3**: test-single-retry-before-all (`05-rules.md`)
- **Decision**: queue:retry Specific vs queue:retry all (`07-decision-trees.md`)

---

## Anti-Pattern 4: Retrying Old Failed Jobs Without Checking Payload Age

### Category
Reliability — Stale Data

### Description
Retrying failed jobs that are days or weeks old without checking whether the payload data still exists. A job that failed 30 days ago may reference model IDs that have been deleted, archived, or invalidated — retrying it causes a new failure with "model not found."

### Why It Happens
Teams focus on the "retry" action without considering the temporal context. The `failed_jobs` table stores all failures chronologically, and `queue:retry all` retries everything regardless of age.

### Warning Signs
- `queue:retry all` includes jobs weeks or months old
- Retried old jobs fail with `ModelNotFoundException` or similar
- Jobs referencing user-generated content (posts, comments) fail when data is deleted
- Old retries produce "record not found" errors
- Team manually skips old jobs when retrying

### Why Harmful
Old job retries waste worker time on invalid payloads. Every retry of an old job that references deleted data fails again immediately. The same job may cycle through retry → fail → retry if automated retry is configured.

### Real-World Consequences
A `ProcessPost` job references a post by ID. The post was deleted by the user 3 weeks ago. The job failed originally due to a temporary API outage. Now, 3 weeks later, an operator runs `queue:retry all` without checking ages. The job is re-dispatched. At execution, `SerializesModels` calls `Post::find($id)` — returns null. The job crashes with "call to a member function on null." It fails again, consuming another retry slot.

### Preferred Alternative
Before retrying, prune or skip jobs older than a reasonable threshold (e.g., 7 days).

### Refactoring Strategy
1. Before `queue:retry all`: delete jobs older than retention window: `DB::table('failed_jobs')->where('failed_at', '<', now()->subDays(7))->delete()`
2. Use `queue:retry` with specific IDs for recent failures only
3. For automated retry pipelines: add an age filter to skip old jobs
4. Set `ShouldDeleteMissing` on jobs where model deletion is expected
5. Consider payload age in root cause analysis — if old, the data may be gone

### Detection Checklist
- [ ] Retrying jobs weeks or months old
- [ ] Old jobs fail with "model not found"
- [ ] No age filter before retry all
- [ ] Payload data may have been deleted

### Related Rules/Skills/Decision Trees
- **Rule 4**: consider-payload-age-before-retry (`05-rules.md`)
- **Skill**: Retry Failed Jobs Safely (`06-skills.md`)
