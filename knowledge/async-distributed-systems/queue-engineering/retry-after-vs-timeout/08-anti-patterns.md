# Anti-Patterns — `retry_after` vs `--timeout` Semantics

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | `retry_after` vs `--timeout` Semantics |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. `--timeout` Exceeds `retry_after` — Double Processing
2. Equal `--timeout` and `retry_after` — Race Condition
3. Job `$timeout` Silently Overrides Worker `--timeout`
4. Shared `retry_after` for Mixed Runtime Queues

---

## 1. `--timeout` Exceeds `retry_after` — Double Processing

### Category
Reliability

### Description
Setting the worker `--timeout` higher than the connection's `retry_after`, causing the queue backend to release the job reservation before the worker is killed, guaranteeing double processing.

### Why It Happens
The developer configures `retry_after` in `config/queue.php` and `--timeout` in the Supervisor command independently, without understanding their relationship. If `--timeout=90` and `retry_after=60`, the queue backend releases the job after 60 seconds (assumes worker died), but the worker continues processing until the 90-second timeout. A second worker picks up the released job while the first still processes — both execute.

### Warning Signs
- Worker `--timeout` >= connection `retry_after`
- Double processing incidents traced to timeout configuration
- Jobs executing simultaneously for the same ID
- `retry_after` logs show expired reservations during normal processing

### Why Harmful
A job that takes 75 seconds processes on Worker A. At 60 seconds (`retry_after`), the queue backend decrements the job's attempt count and makes it available again. Worker B picks it up. Worker A is still processing — killed at 90 seconds (`--timeout`). Both workers execute the same job. For a payment job, this means double charges. The configuration guarantees double processing every time a job exceeds `retry_after`.

### Consequences
- Guaranteed double processing for jobs exceeding `retry_after`
- Duplicate side effects (charges, notifications, data writes)
- Configuration bug causes permanent data corruption risk
- Hard to debug — logs show normal execution on both workers

### Alternative
Always keep `--timeout` at least 10 seconds less than `retry_after`.

### Refactoring Strategy
1. Calculate: `retry_after = --timeout + 10` (minimum 70s for `--timeout=60`)
2. Update `config/queue.php` with new `retry_after`
3. Update Supervisor command with new `--timeout`
4. Verify: `--timeout` < `retry_after` by at least 10 seconds
5. Document the values and the relationship

### Detection Checklist
- [ ] `--timeout` < `retry_after` (at least 10s gap)
- [ ] No double processing from reservation expiry
- [ ] Configuration documented with timeout relationship
- [ ] Values validated on every queue configuration change

### Related Rules
Always Keep --timeout at Least 10s Below retry_after

### Related Skills
Configure retry_after and --timeout to Prevent Double Processing

### Related Decision Trees
retry_after vs --timeout Configuration

---

## 2. Equal `--timeout` and `retry_after`

### Category
Reliability

### Description
Setting `--timeout` equal to `retry_after`, creating a race condition where clock skew between the worker and queue backend can cause the reservation to expire before the worker is killed.

### Why It Happens
The developer knows `--timeout` should be less than `retry_after`, but sets them equal thinking "close enough." The 1-2 seconds of clock skew between the worker server and the queue backend (Redis) can cause the backend to release the reservation moments before the worker is killed. The result is intermittent double processing that's hard to reproduce.

### Warning Signs
- `--timeout == retry_after` (e.g., both 60)
- Intermittent double processing incidents
- Jobs occasionally execute twice without clear pattern
- Clock skew detected between worker and queue servers

### Why Harmful
Worker A starts Job X at T=0. At T=60 (`retry_after` = `--timeout`), two things happen nearly simultaneously: the queue backend releases Job X's reservation (based on its clock), and the worker sends SIGALRM to kill process (based on its clock). If the backend's clock is 500ms ahead, the reservation expires at T=59.5 (backend time) and Worker B picks up the job. Worker A continues until T=60 (kill signal). Both execute. The 500ms clock gap causes double processing.

### Consequences
- Intermittent double processing from clock skew
- Hard-to-reproduce production incidents
- No consistent pattern — depends on server clock synchronization
- Duplicate side effects without clear root cause

### Alternative
Always maintain at least 10 seconds of buffer: `retry_after = --timeout + 10`.

### Refactoring Strategy
1. Increase `retry_after` by 10-15 seconds in `config/queue.php`
2. Keep `--timeout` at current value
3. Ensure NTP synchronization on all worker servers
4. Verify: `retry_after` - `--timeout` >= 10 seconds

### Detection Checklist
- [ ] `retry_after` > `--timeout` by at least 10 seconds
- [ ] No intermittent double processing
- [ ] NTP configured on all servers
- [ ] Clock skew within acceptable bounds (< 1s)

### Related Rules
Always Keep --timeout at Least 10s Below retry_after

### Related Skills
Configure retry_after and --timeout to Prevent Double Processing

### Related Decision Trees
retry_after vs --timeout Configuration

---

## 3. Job `$timeout` Silently Overrides Worker `--timeout`

### Category
Reliability

### Description
Defining `public $timeout` on a job class that exceeds `retry_after`, silently bypassing the worker's `--timeout` flag and causing the job to run longer than the reservation.

### Why It Happens
The job's `$timeout` property overrides the worker's `--timeout` flag. A developer sets `public $timeout = 300` on a specific job without checking the connection's `retry_after`. The worker's `--timeout=60` is ignored for this job. The job runs for 300 seconds, exceeding `retry_after=90`, and double processing occurs.

### Warning Signs
- Job class has `public $timeout` property
- Job `$timeout` exceeds connection `retry_after`
- Specific job types experience double processing
- Worker logs show jobs running longer than worker `--timeout`

### Why Harmful
A `GenerateReport` job sets `public $timeout = 300` for a large report. The worker `--timeout=60` is overridden. `retry_after=90` is unchanged. The job runs for 300 seconds. At 90 seconds, the reservation expires and another worker picks up the same job. Two workers now generate the same report. The worker `--timeout` provided no protection because the job overrode it silently.

### Consequences
- Job-level timeout silently bypasses worker timeout
- `retry_after` exceeded despite worker `--timeout` setting
- Double processing for specific job types
- Worker timeout configuration provides false confidence

### Alternative
Always verify that no job's `$timeout` exceeds `retry_after`. Adjust `retry_after` if long-running jobs are needed.

### Refactoring Strategy
1. Audit all job `$timeout` properties: `grep -r 'public \$timeout' app/Jobs/`
2. Compare each against connection `retry_after`
3. For jobs that legitimately need long timeouts, increase `retry_after`
4. For others, remove `$timeout` and let worker `--timeout` apply
5. Add CI check: job `$timeout` must be < `retry_after`

### Detection Checklist
- [ ] No job `$timeout` exceeds `retry_after`
- [ ] Long-running jobs have correspondingly high `retry_after`
- [ ] Short-running jobs rely on worker `--timeout`
- [ ] CI enforces timeout/retry_after relationship

### Related Rules
Never Ignore Job $timeout Override

### Related Skills
Configure retry_after and --timeout to Prevent Double Processing

### Related Decision Trees
retry_after vs --timeout Configuration

---

## 4. Shared `retry_after` for Mixed Runtime Queues

### Category
Scalability

### Description
Using a single `retry_after` value for all queues on the same connection when queues have significantly different job runtimes, causing fast jobs to have unnecessarily long failure recovery delays.

### Why It Happens
The developer defines one Redis connection with one `retry_after` value. Both a fast queue (jobs complete in 1 second) and a slow queue (jobs complete in 120 seconds) share the same connection. `retry_after=130` is set for the slow queue. But the fast queue now waits 130 seconds to retry a failed job — 129 seconds longer than necessary.

### Warning Signs
- Single `retry_after` for connection with mixed runtime queues
- Fast-queue jobs fail but take 60+ seconds to retry
- Slow-queue `retry_after` set high to accommodate one long job type
- Failure recovery latency unnecessarily long for fast jobs

### Why Harmful
A notification queue (50ms per job) and a report generation queue (up to 180s per job) share the same connection. `retry_after=190` accommodates the report queue. When a notification job fails, it takes 190 seconds before the retry attempt — 189 seconds of unnecessary delay. Users don't receive their password reset email for 3+ minutes because of the slow queue's `retry_after` requirement.

### Consequences
- Fast-queue failure recovery unnecessarily slow
- User-facing delays for quick jobs on shared connections
- Capacity planning distorted by mixed timeouts
- Retry latency varies based on worst-case queue

### Alternative
Use separate queue connections with independently tuned `retry_after` values for queues with significantly different job runtimes.

### Refactoring Strategy
1. Group queues by job runtime: fast (<10s), medium (<60s), slow (>60s)
2. Create separate Redis connections with distinct `retry_after` values
3. Route jobs to appropriate connections
4. Update worker commands to use the correct connection

### Detection Checklist
- [ ] Separate connections for different runtime tiers
- [ ] Each `retry_after` tuned to its queue's jobs
- [ ] Fast queues recover quickly from failures
- [ ] No shared `retry_after` for mixed runtimes

### Related Rules
Remember retry_after Is Per-Connection, Not Per-Queue

### Related Skills
Configure retry_after and --timeout to Prevent Double Processing

### Related Decision Trees
retry_after vs --timeout Configuration
