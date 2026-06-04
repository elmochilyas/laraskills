---
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: K062 — dispatchAfterResponse for Post-Response Execution
Knowledge ID: K062
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Mock Queue Substitute — Using dispatchAfterResponse as Queue Replacement | Architecture | Critical |
| 2 | Heavy Processing After Response | Performance | High |
| 3 | Transactional Work After Response Without Error Handling | Operations | Medium |
| 4 | Mixing with ShouldQueue (Silent Fallback) | Implementation | Medium |
| 5 | Nested Post-Response Chains | Architecture | Low |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Queue Substitute | Critical — lost jobs, process pool saturation | Use real queue for reliability |
| Heavy Post-Response Processing | High — blocks PHP-FPM child | Use queue dispatch for work > 1 second |
| Silent ShouldQueue Fallback | Medium — job goes to queue instead of post-response | Check job class does not implement ShouldQueue |

---

## 1. Mock Queue Substitute — Using dispatchAfterResponse as Queue Replacement

### Category
Architecture

### Description
Using `dispatchAfterResponse` as the primary mechanism for all asynchronous work because "it's simpler than setting up a queue." This leads to lost jobs (no persistence), PHP-FPM pool saturation (blocking web processes), and no retry capability.

### Why It Happens
- Queue infrastructure (Redis, workers, Horizon) seems complex
- `dispatchAfterResponse` works without any setup
- Small applications start with it and never migrate as they grow
- Not understanding the fundamental differences in reliability
- "We don't have a queue yet, so we use dispatchAfterResponse"

### Warning Signs
- All async work uses `dispatchAfterResponse` — no queue dispatches exist
- Application has no queue infrastructure
- PHP-FPM active_processes is consistently high
- Random job loss: some operations don't complete, no error logged
- On-call: "the cache wasn't warmed" or "analytics data is missing"

### Why Harmful
A simple confirmation email dispatch goes through the full queue pipeline (serialize, Redis push, worker pop, deserialize) — the web process could have sent it directly after response in under 1ms without any infrastructure dependency. But the same argument is used for payment processing, order fulfillment, and inventory deduction — operations that must not be lost. The critical operations are treated the same as trivial cache warming, and when PHP crashes after the response, critical jobs are lost.

### Consequences
- Critical jobs lost on any PHP crash
- No retry mechanism for failed post-response work
- PHP-FPM pool saturation from increasing post-response work
- Cannot scale async work independently of web servers
- No queue monitoring (Horizon dashboard) for async work
- Technical debt: entire async architecture must be rebuilt when reliability is needed

### Alternative
- Use `dispatchAfterResponse` ONLY for fast (< 1 second), non-critical, loss-tolerant work
- Use real queue dispatch for anything requiring:
  - Reliability (job must complete)
  - Retry on failure
  - Persistence across crashes
  - Isolated worker processing
- Set up queue infrastructure early — even simple Redis-based queues

### Refactoring Strategy
1. Audit all `dispatchAfterResponse` usages — categorize by criticality
2. Move critical jobs to queue dispatch
3. Keep `dispatchAfterResponse` only for logging, analytics, cache warming
4. Set up queue infrastructure if not already present
5. Add code review rule: `dispatchAfterResponse` = non-critical only

### Detection Checklist
- [ ] No critical business logic uses `dispatchAfterResponse`
- [ ] Queue infrastructure available for reliable async work
- [ ] `dispatchAfterResponse` used only for non-critical tasks
- [ ] PHP-FPM pool not saturated by post-response work
- [ ] Crash tolerance: critical jobs survive process termination

### Related Rules
- use-dispatch-after-response-for-non-critical, never-use-for-crash-critical-work

### Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks

### Related Decision Trees
- dispatchAfterResponse vs Queue Job for Post-Response Processing

---

## 2. Heavy Processing After Response

### Category
Performance

### Description
Running CPU-intensive computations, image processing, PDF generation, or other heavy work via `dispatchAfterResponse`. The web process is blocked for the duration, reducing server throughput and potentially hitting `max_execution_time`.

### Why It Happens
- "The response is already sent, so the user doesn't wait" — correct, but the process is still occupied
- Not considering that web processes are a shared, limited resource
- Assuming "after response" means "free processing"
- Using `dispatchAfterResponse` for work that should go to a queue worker
- Not measuring the execution time of the post-response work

### Warning Signs
- Post-response work takes > 2 seconds
- PHP-FPM `active_processes` increases after request completion (due to ongoing post-response work)
- Server throughput degrades under load (processes occupied with post-response work)
- `max_execution_time` is hit by post-response work
- Monitoring shows process lifetime extending beyond response time

### Why Harmful
Every web process that dispatches a 5-second report generation via `dispatchAfterResponse` is blocked for 5 seconds. A server with 10 workers processes 10 requests in 5 seconds instead of 100. Throughput drops by 90%. The pool of available workers is exhausted by post-response work, causing new incoming requests to queue up at the web server. Users experience slow responses not because of their own request, but because all processes are busy finishing post-response work from previous requests.

### Consequences
- Throughput drops significantly (90%+ for 5-second post-response work)
- PHP-FPM pool saturation — all processes busy with post-response work
- Cascading delay: new requests wait for processes to finish previous requests' post-response work
- `max_execution_time` errors as post-response work accumulates
- Users see slow responses even though their own request completed quickly

### Alternative
- Keep `dispatchAfterResponse` work under 1 second
- Use queue dispatch for heavy work:
  ```php
  // BAD — blocks web process for 30 seconds
  Bus::dispatchAfterResponse(new GenerateMonthlyReport());
  
  // GOOD — queue worker handles heavy work
  dispatch(new GenerateMonthlyReport());
  ```
- Set hard timeout guards inside the job to prevent runaway execution

### Refactoring Strategy
1. Measure execution time of all `dispatchAfterResponse` work
2. Move any work > 1 second to queue dispatch
3. Add timeout guards to remaining post-response jobs
4. Monitor PHP-FPM active_processes for post-response work
5. Alert if any `dispatchAfterResponse` job exceeds 1 second

### Detection Checklist
- [ ] All `dispatchAfterResponse` work < 1 second
- [ ] No image processing, PDF generation, or report building post-response
- [ ] PHP-FPM active_processes not impacted by post-response work
- [ ] Timeout guards in post-response jobs
- [ ] Heavy work dispatched to queue workers

### Related Rules
- use-dispatch-after-response-for-non-critical

### Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks

### Related Decision Trees
- dispatchAfterResponse vs Queue Job for Post-Response Processing

---

## 3. Transactional Work After Response Without Error Handling

### Category
Operations

### Description
Writing to the database after the response has been sent via `dispatchAfterResponse` without proper error handling. If the write fails, there is no recovery path — the response was already sent, the user has moved on, and there's no way to notify them or retry.

### Why It Happens
- Not considering that post-response work can fail
- Assuming database writes always succeed
- No retry mechanism for post-response operations
- Not logging failures (response already sent, "who will see the log?")
- Using `dispatchAfterResponse` for data operations that should be in the main request or in a proper queue

### Warning Signs
- Database writes in `dispatchAfterResponse` jobs with no error handling
- No retry logic for failed post-response database operations
- No compensating transaction for partial writes
- Silent failures: database errors in post-response work go unlogged
- Data inconsistency: records partially updated, no reconciliation

### Why Harmful
A post-response job decrements inventory after an order is placed. The database write fails due to a deadlock. The order is confirmed (response sent) but inventory is not decremented. The next customer who orders the same item also gets a confirmation — but there's only one in stock. Over-selling occurs because the post-response inventory update silently failed. No error was logged, no retry was attempted, no compensating action was taken.

### Consequences
- Data inconsistency: writes fail silently after response
- Over-selling, double-charging, missing records from failed post-response operations
- No recovery path: user has already received confirmation
- No retry mechanism: operation is lost permanently
- Debugging complexity: "the data should be there but it's not"

### Alternative
- Do NOT perform critical data writes in `dispatchAfterResponse`
- Use queue dispatch for critical writes (with retry):
  ```php
  // BAD — no recovery on failure
  Bus::dispatchAfterResponse(new DecrementInventory($order));
  
  // GOOD — retry on failure, alert on persistent failure
  dispatch(new DecrementInventory($order))->onQueue('inventory');
  ```
- If post-response writes are necessary, implement:
  - Error logging (must be logged)
  - Compensating transaction or reconciliation
  - Monitoring for failed post-response operations

### Refactoring Strategy
1. Audit all `dispatchAfterResponse` jobs for database writes
2. Move critical data writes to queue dispatch
3. For non-critical writes: add error logging and reconciliation
4. Implement compensating transactions for failed writes
5. Add monitoring: track failed post-response database operations

### Detection Checklist
- [ ] No critical database writes in `dispatchAfterResponse`
- [ ] Critical writes use queue dispatch with retry
- [ ] Non-critical writes have error logging
- [ ] Reconciliation process for failed post-response writes
- [ ] Monitoring for failed post-response database operations

### Related Rules
- never-use-for-crash-critical-work, use-for-sync-side-effects-only

### Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks

### Related Decision Trees
- dispatchAfterResponse vs Queue Job for Post-Response Processing

---

## 4. Mixing with ShouldQueue (Silent Fallback)

### Category
Implementation

### Description
Calling `dispatchAfterResponse` on a job class that implements `ShouldQueue`. The method silently falls back to queue dispatch — the job goes to the queue instead of executing post-response. The developer expects post-response behavior but gets queue behavior with no warning.

### Why It Happens
- Not reading that `ShouldQueue` overrides `dispatchAfterResponse`
- Adding `ShouldQueue` to a job class for other reasons (unique, middleware) without checking
- Refactoring a job to implement `ShouldQueue` but missing the dispatch site change
- Copy-pasting `dispatchAfterResponse` usage without verifying the job class
- Not testing whether the job actually executes post-response

### Warning Signs
- Jobs dispatched via `dispatchAfterResponse` appear in the queue (Horizon dashboard)
- No post-response execution when expected
- Job class implements `ShouldQueue` but is dispatched via `dispatchAfterResponse`
- Tests pass but behavior is wrong in production (queue processing vs post-response)
- Confusion: "I used dispatchAfterResponse but the job runs in a worker"

### Why Harmful
A cache warming job that used to run post-response is refactored to implement `ShouldBeUnique` (which requires `ShouldQueue`). The dispatch site still uses `dispatchAfterResponse`. The job silently falls back to queue dispatch — the cache is now warmed by a worker, potentially minutes later instead of immediately after the response. The site's cache-hit ratio drops, users experience slower page loads, and the team doesn't know why. No error, no warning, just different behavior.

### Consequences
- Post-response execution silently converted to queue dispatch
- Timing changes: job runs later than expected
- Cache warming delayed, affecting response times
- No error or warning when the fallback occurs
- Debugging complexity: "why is the cache cold after a write?"

### Alternative
- Ensure job dispatched via `dispatchAfterResponse` does NOT implement `ShouldQueue`:
  ```php
  // BAD — should not implement ShouldQueue for post-response
  class WarmCacheJob implements ShouldQueue, ShouldBeUnique
  {
      // Silently falls back to queue
  }
  Bus::dispatchAfterResponse(new WarmCacheJob($id));
  
  // GOOD — no ShouldQueue, genuine post-response execution
  class WarmCacheJob
  {
      // No ShouldQueue interface
  }
  Bus::dispatchAfterResponse(new WarmCacheJob($id));
  ```
- If the job needs both: split into two jobs (one post-response, one queued)

### Refactoring Strategy
1. Audit all `dispatchAfterResponse` usages against their job classes
2. If job implements `ShouldQueue`: decide between queue or post-response
3. For queue: change dispatch to `dispatch()`
4. For post-response: remove `ShouldQueue` from job class
5. If both needed: split into separate jobs
6. Add code review check: `dispatchAfterResponse` + `ShouldQueue` flag

### Detection Checklist
- [ ] No `dispatchAfterResponse` job implements `ShouldQueue`
- [ ] Post-response jobs genuinely run in the web process
- [ ] Queue jobs use `dispatch()` (not `dispatchAfterResponse`)
- [ ] If both behaviors needed, separate jobs are used
- [ ] Code review catches `dispatchAfterResponse` + `ShouldQueue` combination

### Related Rules
- use-dispatch-after-response-for-non-critical

### Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks

### Related Decision Trees
- dispatchAfterResponse vs Queue Job for Post-Response Processing

---

## 5. Nested Post-Response Chains

### Category
Architecture

### Description
Dispatching a job via `dispatchAfterResponse` that itself dispatches another `dispatchAfterResponse` job. Creates unpredictable execution ordering, memory pressure, and violates the assumption of a single post-response execution context.

### Why It Happens
- Not considering that `dispatchAfterResponse` runs inside the web process, not a queue worker
- Chaining post-response work through job handler calls
- Treating `dispatchAfterResponse` like queue dispatch (where nesting is fine)
- Adding new post-response work into existing handlers
- Not tracking execution context

### Warning Signs
- Second `dispatchAfterResponse` call made inside a post-response job's `handle()` method
- Post-response execution extends beyond the initial terminating callback stack
- Memory usage grows during post-response phase (unreleased contexts)
- Execution ordering is non-deterministic
- Terminating middleware stack grows unexpectedly

### Why Harmful
A post-response cache warming job dispatches another `dispatchAfterResponse` job to flush analytics. The analytics flush job runs after the cache warming job completes — which is within the same process, but now the terminating callback stack is modified during execution. The timing of the analytics flush depends on when the cache warming job finishes, which itself depends on external factors. The nested dispatch creates unmanaged execution depth and makes it impossible to reason about post-response execution ordering.

### Consequences
- Unpredictable execution ordering of post-response work
- Increased memory pressure during post-response phase
- Stack grows as nested dispatches accumulate
- Debugging confusion: "why did analytics run after the process should have been free?"
- PHP-FPM process stays alive longer than expected (waiting for nested dispatches)
- Some nested dispatches may not execute (process termination during nesting)

### Alternative
- NEVER dispatch `dispatchAfterResponse` inside a post-response job
- For multiple post-response tasks: use `Bus::defer()` (Laravel 12+) to accumulate them in a single batch
- Or dispatch all post-response work at the same level in the request handler
- For work that needs ordering: create a single post-response job that calls multiple operations synchronously

### Refactoring Strategy
1. Audit all `dispatchAfterResponse` handler methods for nested dispatches
2. Convert nested dispatches to synchronous calls within the parent job
3. Or use `Bus::defer()` to accumulate all post-response work at the request level
4. Test post-response execution ordering (should be predictable)
5. Add code review rule: no `dispatchAfterResponse` inside handler methods

### Detection Checklist
- [ ] No `dispatchAfterResponse` dispatched inside a handler method
- [ ] All post-response work dispatched from request level
- [ ] Execution ordering is predictable and documented
- [ ] `Bus::defer()` used for multiple post-response tasks
- [ ] Memory usage is stable during post-response phase

### Related Rules
- use-dispatch-after-response-for-non-critical

### Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks

### Related Decision Trees
- dispatchAfterResponse vs Queue Job for Post-Response Processing
