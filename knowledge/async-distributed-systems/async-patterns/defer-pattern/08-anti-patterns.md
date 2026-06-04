---
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: K065 — Defer Pattern (Laravel 12)
Knowledge ID: K065
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Deferring Slow Work (> 1 Second) | Performance | High |
| 2 | Deferring Critical Business Logic | Architecture | Critical |
| 3 | Using Defer as Queue Replacement | Architecture | High |
| 4 | Ignoring Octane Incompatibility | Operations | Critical |
| 5 | Forgetting `cancel()` on Request Failure | Implementation | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Deferred Slow Work | High — blocks PHP-FPM child, reduces throughput | Use queue dispatch for work > 1 second |
| Deferred Critical Logic | Critical — lost on process crash | Queue dispatch for durable operations |
| Defer as Queue Replacement | High — no retry, no persistence, no monitoring | Real queue for anything needing reliability |
| Missing Cancellation | Medium — callbacks run on invalid state | Always call `cancel()` in exception handlers |

---

## 1. Deferring Slow Work (> 1 Second)

### Category
Performance

### Description
Using `Bus::defer()` to execute work that takes more than 1 second. Deferred callbacks run in the same PHP process that handled the HTTP request — slow work blocks the process, preventing it from serving the next request.

### Why It Happens
- Not realizing deferred callbacks run in the web process (not a queue worker)
- Assuming "after response" means it's safe to run anything
- Not measuring callback execution time
- Using defer for work that should be queued (report generation, image processing)
- Confusing defer with queue dispatch

### Warning Signs
- PHP-FPM `active_processes` spikes after responses are sent
- Server throughput drops when deferred work is present
- `max_execution_time` exceeded by deferred callbacks
- Users report slow responses even though the response is sent quickly (process pool saturated)
- CPU usage remains high after request volume drops (deferred work still running)

### Why Harmful
Every web process that defers a 5-second report generation is blocked for 5 seconds. A server with 10 workers processes 10 requests in 5 seconds instead of 100 — throughput drops by 90%. The pool of available workers is exhausted by deferred work, causing new incoming requests to queue up at the web server. Users experience slow responses (waiting for a free worker) even though the HTTP handler itself is fast.

### Consequences
- Throughput drops significantly (90%+ reduction for 5-second deferred tasks)
- PHP-FPM pool saturation — new requests wait for workers to become available
- Cascading delay: one slow deferred callback delays the next response
- Monitoring shows high active_processes but low request volume
- Emergency scaling: need more PHP-FPM workers to compensate

### Alternative
- Keep deferred callbacks under 1 second total batch time
- Use queue dispatch for any work > 1 second:
  ```php
  // BAD — blocks web process for 30 seconds
  defer(fn() => ReportGenerator::generate(now()->subMonth()));
  
  // GOOD — queue worker handles heavy work
  dispatch(new GenerateMonthlyReport());
  ```
- Profile callback execution time and set timeouts

### Refactoring Strategy
1. Measure total deferred callback execution time per request
2. Move any callback > 1 second to queue dispatch
3. Add time tracking to remaining deferred callbacks
4. Alert if any deferred callback exceeds 500ms
5. Consider switching to queue workers for any batch processing

### Detection Checklist
- [ ] Total deferred batch time < 1 second
- [ ] No report generation, image processing, or batch operations in deferred callbacks
- [ ] PHP-FPM active_processes is stable during deferred execution
- [ ] Throughput is not impacted by deferred work
- [ ] Execution time of deferred callbacks is monitored

### Related Rules
- keep-deferred-callbacks-fast, never-defer-crash-critical-operations

### Related Skills
- Use Defer Pattern for Batched Post-Response Work

### Related Decision Trees
- Defer vs Queue Job for Response-Neutral Work

---

## 2. Deferring Critical Business Logic

### Category
Architecture

### Description
Using `Bus::defer()` for operations like payment processing, order fulfillment, or charge operations that must not be lost. Deferred callbacks have no persistence — if PHP crashes during execution, the work is permanently lost.

### Why It Happens
- "It's simpler than setting up a queue" — defer has no infrastructure requirements
- Not considering crash scenarios
- Assuming PHP never crashes after sending the response
- Confusing "after response" with "safe from crashes"
- Not understanding that deferred callbacks are in-memory only

### Warning Signs
- Payment processing or financial transactions in deferred callbacks
- Order fulfillment or inventory deduction in deferred callbacks
- Data writes that must not be lost in deferred callbacks
- No compensating transaction or retry mechanism for deferred work
- "We use defer for all our async work because it's simple"

### Why Harmful
PHP hits memory limit after sending the response — the deferred `chargeCustomer` never runs. The order is created but never charged, and there's no record of the failure. Revenue is lost, the customer gets a free order, and the error is completely silent (response was already sent). The business impact of this crash is catastrophic — and entirely preventable by using a real queue.

### Consequences
- Revenue loss: critical operations silently lost on crash
- Data inconsistency: partial operations without completion
- No error log: PHP crash after response may not log the failure
- Customer impact: orders not fulfilled, payments not processed
- Legal liability: financial operations not reliably completed
- No retry mechanism: each crash permanently loses work

### Alternative
- NEVER defer critical business logic — always use queue dispatch:
  ```php
  // BAD — critical operation lost on crash
  defer(fn() => $this->chargeCustomer($order));
  
  // GOOD — durable, retries on failure
  dispatch(new ChargeCustomer($order));
  ```
- Critical operations include: payments, orders, inventory, email delivery, user data changes
- Use defer only for: logging, cache warming, analytics, metrics — operations where loss is acceptable

### Refactoring Strategy
1. Audit all deferred callbacks for critical business logic
2. Move any financial, user-impacting, or data-critical operation to queue dispatch
3. Add testing: verify critical operations survive process termination
4. Document which operations are safe to defer (loss-tolerant) and which require queue
5. Add code review rule: no critical business logic in deferred callbacks

### Detection Checklist
- [ ] No payment, order, fulfillment, or user data operations in deferred callbacks
- [ ] Critical business logic uses queue dispatch
- [ ] Deferred callbacks are loss-tolerant (analytics, cache, logging)
- [ ] Code review rejects critical logic in defer()
- [ ] Crash scenario tested: critical operations survive process termination

### Related Rules
- never-defer-crash-critical-operations

### Related Skills
- Use Defer Pattern for Batched Post-Response Work

### Related Decision Trees
- Defer vs Queue Job for Response-Neutral Work

---

## 3. Using Defer as Queue Replacement

### Category
Architecture

### Description
Adopting `Bus::defer()` for all asynchronous work because "it's simpler" than setting up a queue system. Defer loses retry, persistence, monitoring, and worker isolation — it is not a substitute for a proper queue worker.

### Why It Happens
- Defer requires no infrastructure (no Redis, no workers)
- Defer appears simpler at first glance
- Not realizing the limitations until a crash causes data loss
- Assuming "after response" is sufficient for all async patterns
- Building an application on defer where queue dispatch was appropriate

### Warning Signs
- All async work uses `Bus::defer()` — no queue dispatches exist
- Application has no queue infrastructure (no Redis connection for queue)
- Deferred callbacks exceed 5+ per request (accumulating complexity)
- No monitoring for deferred work execution
- Team hasn't considered crash scenarios for deferred work

### Why Harmful
The application grows to rely on deferred callbacks for email sending, data export, notification delivery, and third-party API calls. A PHP crash during a batch of deferred work loses all of them — 50 emails not sent, 3 API calls not made, 2 reports not generated. There's no retry, no persistence, no way to know what was lost. The application has built its entire async architecture on a mechanism designed for lightweight, best-effort post-response tasks.

### Consequences
- All async work lost on any PHP crash or fatal error
- No retry mechanism for failed operations
- No queue monitoring (Horizon, Pulse) for async work
- Worker isolation: deferred work competes with request handling in the same process
- Scaling: cannot move deferred work to separate infrastructure
- Technical debt: migration from defer to queue is significant

### Alternative
- Use defer only for its intended purpose: lightweight, loss-tolerant post-response tasks
- Use queue dispatch for anything needing:
  - Retry on failure
  - Persistence across process crashes
  - Worker isolation
  - Monitoring and observability
  - Dedicated infrastructure (separate workers)
- Defer is complementary to queues, not a replacement

### Refactoring Strategy
1. Categorize all deferred work: loss-tolerant vs must-complete
2. Move must-complete work to queue dispatch
3. Set up queue infrastructure (Redis, workers, Horizon)
4. Keep defer only for analytics, cache warming, logging
5. Add code review rule: defer = loss-tolerant only
6. Document the decision criteria for defer vs queue

### Detection Checklist
- [ ] Queue infrastructure exists for reliable async work
- [ ] Defer used only for loss-tolerant operations
- [ ] No business-critical work in deferred callbacks
- [ ] Retry, persistence, monitoring for queue-dispatched jobs
- [ ] Team understands defer vs queue decision criteria

### Related Rules
- use-defer-for-response-time-sensitivity, never-defer-crash-critical-operations

### Related Skills
- Use Defer Pattern for Batched Post-Response Work

### Related Decision Trees
- Defer vs Queue Job for Response-Neutral Work

---

## 4. Ignoring Octane Incompatibility

### Category
Operations

### Description
Deploying `Bus::defer()` to Laravel Octane (or Roadrunner) without testing. These runtimes do not trigger kernel termination reliably — deferred callbacks may never execute, or may execute at unexpected times.

### Why It Happens
- Not reading that defer requires terminating middleware support
- Assuming defer works in all Laravel environments
- Deploying to Octane after developing on PHP-FPM without testing
- Not including Octane compatibility in testing matrix
- "It works in development" — development uses PHP-FPM, production uses Octane

### Warning Signs
- Deferred work never executes in production (Octane)
- Logging from deferred callbacks is absent
- Cache warming, analytics never happen in production
- Team uses Octane but defer calls are still in the codebase
- No conditional logic: defer is not gated by runtime environment

### Why Harmful
Deferred cache warming, analytics flushing, and logging never execute in production — the application silently loses all post-response work. Cache entries are not warmed, analytics data is lost, audit logs are missing. The team doesn't notice until someone investigates: "why is the cache always cold?" or "why are analytics numbers wrong?" By then, hours or days of deferred work have been silently lost.

### Consequences
- All deferred work silently lost in Octane production
- Cache not warmed (all requests are cache misses)
- Analytics data never flushed (gaps in reporting)
- Log entries missing (audit trail incomplete)
- Silent failure: no error, no alert, just absence of expected behavior
- Debugging time: "why isn't my deferred code running?"

### Alternative
- NEVER use `Bus::defer()` in Octane or Roadrunner
- Use queue dispatch instead for all post-response work in Octane:
  ```php
  // BAD — silently fails in Octane
  defer(fn() => Cache::warm('dashboard'));
  
  // GOOD — works in all environments
  dispatch(new WarmDashboardCache());
  ```
- Gate defer usage behind environment check:
  ```php
  if (! app()->environment('octane')) {
      defer(fn() => Metrics::flush());
  }
  ```

### Refactoring Strategy
1. Check if the application runs on Octane (check `APP_RUNNING_IN_OCTANE` constant)
2. Replace all `Bus::defer()` with queue dispatch in Octane environments
3. Add environment check: skip defer if running in Octane
4. Test deferred work execution in Octane staging
5. Document Octane compatibility requirements in team conventions

### Detection Checklist
- [ ] `Bus::defer()` not used in Octane/Roadrunner environments
- [ ] Queue dispatch used as alternative for async work in Octane
- [ ] Environment check gates defer usage
- [ ] Deferred work tested in target production runtime
- [ ] No silent failure of deferred work in production

### Related Rules
- use-defer-for-response-time-sensitivity

### Related Skills
- Use Defer Pattern for Batched Post-Response Work

### Related Decision Trees
- Defer vs Queue Job for Response-Neutral Work

---

## 5. Forgetting `cancel()` on Request Failure

### Category
Implementation

### Description
Registering deferred callbacks but not calling `Bus::defer()->cancel()` when the primary request logic fails due to validation, authorization, or other errors. Deferred callbacks execute even though the request failed, operating on incomplete or invalid state.

### Why It Happens
- Not considering that deferred callbacks execute regardless of request outcome
- Assuming deferred work only runs on successful requests
- Not implementing exception handling that calls `cancel()`
- Focusing on the "happy path" — deferred work is set up, cancellation is forgotten
- Not testing error scenarios

### Warning Signs
- Deferred callbacks execute after failed requests (validation errors, authorization failures)
- Cache warming runs even when data creation failed
- Analytics records "success" for failed operations
- Log entries show post-response work for requests that should have been rolled back
- Exception handlers don't reference `Bus::defer()->cancel()`

### Why Harmful
A user submits an order but validation fails (invalid payment details). The deferred callback that warms the order details cache still runs — it tries to cache data for an order that doesn't exist (transaction rolled back). The cache now contains partial or invalid data. Subsequent requests read this cached data and display errors. The deferred callback operated on state that should not have existed.

### Consequences
- Deferred work operates on invalid/partial state
- Cache populated with invalid data
- Analytics records operations that didn't succeed
- Downstream systems receive notifications for failed operations
- Data inconsistency: deferred work assumes success that didn't occur
- Debugging complexity: "why did the cache warming run for a failed order?"

### Alternative
- Always call `cancel()` in exception/error handlers:
  ```php
  try {
      $order = Order::create($data);
      Bus::defer(fn() => Cache::warmOrderStats($order->id));
  } catch (Exception $e) {
      Bus::defer()->cancel();
      throw $e;
  }
  ```
- Use a `finally` block to ensure cancellation on any failure path
- Consider registering cancellation in the application exception handler

### Refactoring Strategy
1. Audit all `Bus::defer()` usages — check for `cancel()` calls in error paths
2. Add `cancel()` in exception handlers for each defer usage
3. If applicable, add global cancellation in the exception handler
4. Test: simulate request failure and verify deferred callbacks don't execute
5. Add code review rule: `Bus::defer()` must have corresponding `cancel()` path

### Detection Checklist
- [ ] `cancel()` called in all exception/error handlers for deferred work
- [ ] Deferred callbacks don't execute on failed requests
- [ ] Error scenarios tested: deferred work cancelled appropriately
- [ ] Code review checks for `cancel()` with every `Bus::defer()`
- [ ] No deferred work runs on invalid/partial state

### Related Rules
- use-defer-for-response-time-sensitivity

### Related Skills
- Use Defer Pattern for Batched Post-Response Work

### Related Decision Trees
- Defer vs Queue Job for Response-Neutral Work
