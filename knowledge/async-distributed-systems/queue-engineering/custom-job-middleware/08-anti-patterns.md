# Anti-Patterns — Custom Job Middleware Creation

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | Custom Job Middleware Creation |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Broken Pipeline — Skipping `$next($job)`
2. Exception Swallowing in Middleware
3. Global Lock Key Without Scoping
4. Slow Middleware Blocking Pipeline
5. Stateful Middleware Leaking Across Jobs

---

## 1. Broken Pipeline — Skipping `$next($job)`

### Category
Reliability

### Description
Not calling `$next($job)` in job middleware, silently breaking the execution pipeline and preventing the job from ever running.

### Why It Happens
The developer writes middleware that performs a check (rate limit, authorization) and returns early on success without calling `$next($job)`. The code looks correct: get to the end of the function, all checks pass, but the developer forgot to invoke the next layer. The job silently never executes — no error, no failed job, just a skipped execution.

### Warning Signs
- Middleware `handle()` ends without calling `$next($job)`
- Jobs pass through middleware successfully but never execute business logic
- No error or failure logged — jobs disappear without trace
- Debugging reveals `handle()` runs but business logic doesn't

### Why Harmful
The middleware pipeline is a nested closure chain. Each middleware wraps the next layer. Skipping `$next($job)` means the wrapped pipeline is never invoked — the job's `handle()` method never runs, and no outer middleware can detect this. The job is marked as processed successfully by the worker, so it's removed from the queue. The business operation is silently lost.

### Consequences
- Jobs silently removed from queue without execution
- Business operations lost with no error or alert
- Debugging extremely difficult — jobs appear to succeed
- No audit trail — the middleware ate the job

### Alternative
Always call `$next($job)` exactly once in middleware, except in intentional short-circuit scenarios where you call `$job->release()` or `$job->delete()`.

### Refactoring Strategy
1. Audit all middleware to verify `$next($job)` is called
2. For conditional middleware, structure as: `if (shouldSkip) { $job->release(...); return; } $next($job);`
3. Add a test that verifies middleware calls `$next`
4. Use static analysis to detect missing `$next` calls

### Detection Checklist
- [ ] `$next($job)` called once in all middleware
- [ ] Short-circuit paths call `$job->release()` or `$job->delete()`
- [ ] Tests verify pipeline completion
- [ ] No silent job skipping observed

### Related Rules
call-next-exactly-once

### Related Skills
Create Custom Job Middleware

### Related Decision Trees
Custom Middleware vs Built-in Middleware Selection

---

## 2. Exception Swallowing in Middleware

### Category
Reliability

### Description
Catching exceptions in job middleware without re-throwing, causing the job to appear successful when it actually failed.

### Why It Happens
The middleware tries to be helpful: catch exceptions, log the error, and proceed. The developer wraps `$next($job)` in a try-catch, logs the exception, and doesn't re-throw. The job pipeline continues as if nothing happened, and the worker marks the job as processed. The exception is visible only in logs.

### Warning Signs
- `catch (Throwable $e) { Log::error(...); }` without `throw $e;`
- Middleware catches exceptions but continues execution
- Jobs in `failed_jobs` table never appear
- Bugs detected only through log analysis, not monitoring

### Why Harmful
The worker relies on exceptions to determine job outcome. If all middleware catches and swallows exceptions, the worker never sees the failure. The job is removed from the queue and marked successful. No retry occurs. No `failed_jobs` entry is created. The error is invisible to operators unless they actively search logs. A critical billing job fails silently for weeks.

### Consequences
- Failed jobs treated as successful
- No retry on transient failures
- No `failed_jobs` entries for operator intervention
- Errors invisible to monitoring and alerting

### Alternative
Catch exceptions for side effects (logging, metrics, counter increments) but always re-throw. The worker handles failure and retry.

### Refactoring Strategy
1. Add `throw $e;` (or `throw;`) after logging in all catch blocks
2. Never suppress exceptions in middleware
3. Use `finally` blocks for cleanup that should happen regardless of outcome
4. Add test verifying exceptions propagate through middleware

### Detection Checklist
- [ ] Exceptions re-thrown after logging in middleware
- [ ] No try-catch without re-throw in middleware
- [ ] Failed jobs appear in `failed_jobs` table
- [ ] Monitoring detects middleware-level failures

### Related Rules
never-swallow-exceptions-in-middleware

### Related Skills
Create Custom Job Middleware

### Related Decision Trees
Custom Middleware vs Built-in Middleware Selection

---

## 3. Single Instance Return from `middleware()`

### Category
Code Organization

### Description
Returning a single middleware instance instead of an array from the `middleware()` method, causing a type error at runtime.

### Why It Happens
The developer writes `return new RateLimited('api')` instead of `return [new RateLimited('api')]`. The method signature expects `array`, and returning an object is a type error. The job is dispatched but never processed — the pipeline fails during construction.

### Warning Signs
- `middleware()` method returns a single object
- Job dispatched successfully but never processed
- Error logs contain type errors for middleware
- Code review misses array wrapping

### Why Harmful
The job is pushed to the queue successfully because `middleware()` is called lazily (at processing time). When the worker pops the job and calls `middleware()`, it receives an object instead of an array. PHP throws a type error, the job fails immediately, and is moved to `failed_jobs`. The job never executed even once. Every dispatch results in a permanent failure.

### Consequences
- Every job dispatch results in immediate failure
- Workers waste time failing jobs that can never succeed
- No processing occurs despite successful dispatch
- Debugging requires examining failed_jobs for type errors

### Alternative
Always wrap middleware instances in an array: `return [new Middleware]`.

### Refactoring Strategy
1. Search codebase for `middleware()` methods returning non-array
2. Wrap all single instances: `return [new Middleware]` instead of `return new Middleware`
3. Add a type hint: `public function middleware(): array`
4. Use PHPStan or Psalm to catch type violations

### Detection Checklist
- [ ] `middleware()` always returns array
- [ ] Return type hint `: array` present
- [ ] Static analysis passes for middleware return type
- [ ] No type errors from middleware in failed jobs

### Related Rules
call-next-exactly-once

### Related Skills
Create Custom Job Middleware

### Related Decision Trees
Custom Middleware vs Built-in Middleware Selection

---

## 4. Slow Middleware Blocking Pipeline

### Category
Performance

### Description
Performing heavy computation or I/O in job middleware, adding latency to every job that uses it and reducing overall worker throughput.

### Why It Happens
The middleware is convenient for cross-cutting concerns, and the developer adds an API call, database query, or file read without considering the performance impact. Each microsecond in middleware multiplies across all job executions. A 100ms middleware check on a 1-second job adds 10% overhead per execution.

### Warning Signs
- Middleware makes external API calls, database queries, or file I/O
- Jobs take significantly longer than their `handle()` logic
- Worker throughput drops when middleware is enabled
- Profiling shows middleware consumes a significant portion of execution time

### Why Harmful
Middleware blocks the job pipeline synchronously — the worker cannot proceed to the next job until the middleware completes. A 200ms middleware check on 10,000 jobs per day adds 33 minutes of worker time per day. At 10 workers, that's 5.5 hours of cumulative delay. The middleware designed for "lightweight infrastructure" becomes a significant throughput bottleneck.

### Consequences
- Reduced worker throughput from middleware overhead
- Longer queue wait times for all jobs
- Wasted worker CPU on non-business-logic operations
- Infrastructure costs increase without business value

### Alternative
Keep middleware lightweight — cache any data needed, defer heavy I/O to the job's `handle()` method, and only perform essential pre/post operations.

### Refactoring Strategy
1. Profile middleware execution time with a timing wrapper
2. Move heavy I/O to job `handle()` or a separate job
3. Cache lookup results in Redis for middleware checks
4. Consider pre-computing middleware data and passing it as job constructor data
5. Set a max middleware execution budget (e.g., 50ms)

### Detection Checklist
- [ ] Middleware execution time measured and budgeted
- [ ] No heavy I/O in middleware
- [ ] Database queries in middleware cached or eliminated
- [ ] Middleware overhead < 5% of total job execution time

### Related Rules
keep-middleware-fast

### Related Skills
Create Custom Job Middleware

### Related Decision Trees
Custom Middleware vs Built-in Middleware Selection

---

## 5. Stateful Middleware Leaking Across Jobs

### Category
Reliability

### Description
Storing mutable state in job middleware class properties that leaks across different job executions on the same worker, causing data contamination.

### Why It Happens
The developer adds a class property to cache a value, track state, or accumulate data during middleware execution. Since middleware instances are shared across job executions on the same worker (the `handle()` method is called repeatedly with different jobs), the state from one job execution is visible to the next. This causes non-deterministic, hard-to-debug failures.

### Warning Signs
- Middleware class has mutable instance properties
- Job execution behavior depends on previous job execution
- Workers exhibit non-deterministic failures
- Resetting middleware state fixes the issue temporarily

### Why Harmful
Two sequential jobs execute on the same worker. The first job sets `$this->cachedResult = 'abc'` in middleware. The second job reads `$this->cachedResult` and gets 'abc' — a value from a completely different context. If the value is used for authorization or rate limiting, the second job may be incorrectly authorized or throttled based on the first job's data.

### Consequences
- Cross-job data contamination on the same worker
- Non-deterministic failures that depend on execution order
- Hard-to-reproduce bugs that vanish on single-job testing
- Authorization or rate limiting bypass from stale middleware state

### Alternative
Make middleware stateless — use local variables within `handle()` and rely on job properties for data. Cache data in external stores (Redis) rather than middleware properties.

### Refactoring Strategy
1. Remove all mutable instance properties from middleware classes
2. Use local variables inside `handle()` for temporary data
3. Move caching to Redis or shared cache, not middleware properties
4. For pre-computed data, pass it via job constructor
5. Add test verifying middleware produces same result for same job regardless of order

### Detection Checklist
- [ ] Middleware class has no mutable instance properties
- [ ] All state stored in local variables within `handle()`
- [ ] No cross-job contamination observed
- [ ] Workers produce deterministic results

### Related Rules
keep-middleware-fast

### Related Skills
Create Custom Job Middleware

### Related Decision Trees
Custom Middleware vs Built-in Middleware Selection
