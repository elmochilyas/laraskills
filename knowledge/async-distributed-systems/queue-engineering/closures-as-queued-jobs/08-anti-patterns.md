# Anti-Patterns: Closures as Queued Jobs

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K078 — Closures as Queued Jobs |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Complex Logic in Queued Closures | Design | Critical |
| 2 | $this Used Inside Closure Body | Reliability | Critical |
| 3 | Missing Class Imports in Closure Scope | Reliability | High |
| 4 | Pass-by-Reference in Closure use Clause | Reliability | High |
| 5 | Closures in High-Throughput Paths | Performance | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Using Closures When Class Jobs With Same Complexity Exist | closures-as-queued-jobs, job-serialization-payload-envelope | Medium |
| Closure Jobs Without catch() Callbacks | closures-as-queued-jobs, retry-workflow | Medium |
| No Code Review Guidelines for Closure Jobs | closures-as-queued-jobs, job-lifecycle-state-machine | Low |

---

## Anti-Pattern 1: Complex Logic in Queued Closures

### Category
Design — Untestable and Fragile

### Description
Dispatching closures containing complex multi-step business logic (multiple database operations, external API calls, error handling branches). Closure serialization is fragile, the logic is untestable in isolation, and the job lacks access to `$this->release()`, `$this->delete()`, `$this->batch()`, or a dedicated `failed()` method.

### Why It Happens
Prototyping convenience — writing a closure inline is faster than creating a job class. Closures are appealing for rapid development, and teams plan to refactor later but never do. The closure grows in complexity as requirements evolve.

### Warning Signs
- Closure body exceeds 10 lines
- Closure contains database queries, API calls, or file system operations
- Multiple error handling branches in the closure
- The same closure logic is needed from a second call site
- Tests for the closure logic are absent or use HTTP integration tests
- Catch callback attempts manual retry logic

### Why Harmful
Closure jobs cannot be tested in isolation — you cannot construct a closure in a test and assert on its behavior. Debugging failures is harder because there's no `failed()` method. The serialization is 5-10x slower than class jobs. When the logic needs retry controls, you cannot use `$this->release()`.

### Real-World Consequences
A team dispatches a 50-line closure that processes orders, calls a payment gateway, and sends notifications. The payment gateway is temporarily down, and the job fails. The `catch()` callback logs the error but can't release the job for retry (closures don't support `$this->release()`). The order is never processed, and the customer never receives their product — all because a quick closure was never refactored to a class job.

### Preferred Alternative
Use class jobs for anything complex (>10 lines), reusable, or requiring retry controls.

### Refactoring Strategy
1. Extract the closure body into a new job class implementing `ShouldQueue`
2. Move captured variables to constructor parameters
3. Add a `handle()` method with the logic
4. Add a `failed()` method for error handling
5. Replace the closure dispatch with `ComplexJob::dispatch(...)`
6. Write unit tests for the job class

### Detection Checklist
- [ ] Closure body exceeds 10 lines
- [ ] Closure contains DB or API operations
- [ ] Multiple call sites use the same closure
- [ ] No unit tests for the closure logic
- [ ] Closure needs retry or release controls

### Related Rules/Skills/Decision Trees
- **Rule 1**: prefer-class-jobs-over-closures (`05-rules.md`)
- **Rule 4**: closures-only-for-simple-tasks (`05-rules.md`)
- **Decision 1**: Closure Job vs Class Job for Async Tasks (`07-decision-trees.md`)

---

## Anti-Pattern 2: $this Used Inside Closure Body

### Category
Reliability — Serialization Failure

### Description
Using `$this` inside a queued closure body. The `$this` variable may not serialize correctly or may reference a different object context on deserialization, causing hard-to-debug runtime errors.

### Why It Happens
Developers write closures as if they have the same scope as the surrounding code — using `$this` to reference the enclosing class. In non-queued contexts, `$this` works fine in closures. The serialization boundary is invisible until it breaks in production.

### Warning Signs
- `$this->` appears anywhere inside a `dispatch(function () { ... })` block
- Serialization exceptions at dispatch time related to closure
- `Serialization of 'Closure' is not allowed` errors
- Worker fails with "Using $this when not in object context"
- Closure depends on private/protected properties of the enclosing class

### Why Harmful
The job either fails to serialize at dispatch time (causing immediate failure) or deserializes with a different or corrupted `$this` context, leading to subtle logic errors. Both scenarios are hard to debug because the serialization trace is complex.

### Real-World Consequences
A controller dispatches: `dispatch(function () { $this->logAnalytics('order_placed'); })`. At dispatch time, `$this` is the controller instance. The closure serializes correctly because the controller happens to be serializable. But on deserialization, `$this` is reconstructed in a different context — `$this->logAnalytics()` calls a method that doesn't exist on the deserialized scope. The job fails with a cryptic error that takes hours to trace back to `$this` in a closure.

### Preferred Alternative
Capture needed values explicitly with `use ($value)` — never use `$this` inside a queued closure.

### Refactoring Strategy
1. Identify all `$this->` references inside the closure
2. Capture each needed value as a variable before `dispatch()`, then pass via `use ($value)`
3. If multiple $this references exist, extract to a class job
4. Test serialization by dispatching with `Queue::fake()` and inspecting the job

### Detection Checklist
- [ ] `$this->` appears inside a dispatch closure
- [ ] Closure depends on enclosing class state
- [ ] Serialization errors at dispatch time
- [ ] Worker errors related to missing method on deserialized scope

### Related Rules/Skills/Decision Trees
- **Rule 2**: never-use-dollar-this-in-closure (`05-rules.md`)
- **Decision 2**: Closure Variable Capture Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: Missing Class Imports in Closure Scope

### Category
Reliability — Class Not Found Errors

### Description
Using class references inside a queued closure without importing them explicitly. The serialized closure stores source code, not namespaced references — the worker's auto-import context may differ from the dispatch context, causing class-not-found errors.

### Why It Happens
In standard PHP code, auto-imports and the `use` statements at the top of the file make classes available. Developers forget that the closure is serialized as source code and executed in the worker's global scope, which has different auto-imports.

### Warning Signs
- Closure uses facades (`Cache::`, `Log::`, `DB::`) without explicit imports
- "Class not found" errors in queue worker for closures
- Errors that appear only in production workers (different auto-import context)
- Closure references a custom class without a fully qualified name or import
- Intermittent failures that resolve when the worker restarts (different autoloader state)

### Why Harmful
The job fails with a class-not-found error, which is typically non-retryable (the error will occur on every attempt). The failure is environment-dependent — it may work in development but fail in production, making debugging extremely difficult.

### Real-World Consequences
A team dispatches `dispatch(function () { Mail::send(...) })` without importing `Illuminate\Support\Facades\Mail`. The closure works in development where auto-imports from the service provider are in scope. In production, the worker's scope lacks the auto-import — `Mail` is not found, and the confirmation email is never sent. The team spends hours debugging because the error only appears in the worker log, not in the HTTP response.

### Preferred Alternative
Always import classes explicitly inside queued closures using `use` statements.

### Refactoring Strategy
1. Identify all class references in the closure body
2. Add explicit `use` statements inside the closure (before the class usage)
3. For facades: `use Illuminate\Support\Facades\Cache;`
4. For custom classes: `use App\Services\ReportGenerator;`
5. Test by running `php artisan queue:work --once` in production-like environment

### Detection Checklist
- [ ] Closure uses facades (`Cache::`, `Log::`) without imports
- [ ] "Class not found" errors in worker logs
- [ ] Errors environment-specific (dev vs prod)
- [ ] Closure references non-global classes

### Related Rules/Skills/Decision Trees
- **Rule 3**: import-classes-explicitly-in-closures (`05-rules.md`)
- **Decision 2**: Closure Variable Capture Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 4: Pass-by-Reference in Closure use Clause

### Category
Reliability — Unexpected Values

### Description
Passing variables by reference in the closure's `use (&$var)` clause. References are captured at serialization time, not at execution time — the intended late-binding behavior does not survive serialization, leading to unpredictable values at job execution.

### Why It Happens
Developers use pass-by-reference for variables that change after `dispatch()` but before the closure executes, expecting the closure to see the latest value. This pattern works in synchronous PHP but breaks with serialization.

### Warning Signs
- `use (&$var)` syntax in a queued closure
- Variable modified after `dispatch()` call, expected to be reflected in the job
- Job executes with unexpected or stale variable values
- Synchronous tests pass but queued tests fail
- Reference to loop variable in closure: `use (&$i)` in a loop

### Why Harmful
The reference is resolved at serialization time (when `dispatch()` is called), not when the closure executes. The developer's mental model is broken — they expect the value to be dynamic, but it's frozen at dispatch time. In loops, all iterations may receive the same final value.

### Real-World Consequences
A loop dispatches multiple closures: `foreach ($items as $item) { dispatch(function () use (&$item) { ... }); }`. The developer expects each closure to have a different `$item`. But by the time closures execute, the loop has finished and `$item` is the last element of the array — all closures process the same item. Orders are processed multiple times, and the discrepancy is discovered days later.

### Preferred Alternative
Pass variables by value with `use ($var)`. The value is captured at dispatch time, which is the correct and predictable behavior.

### Refactoring Strategy
1. Replace `use (&$var)` with `use ($var)` in all queued closures
2. If a dynamic value is needed at execution time, pass an identifier and re-query the database inside the closure
3. For loops: capture a copy within the loop scope: `$current = $item; dispatch(function () use ($current) { ... });`
4. Test that each closure receives the correct value

### Detection Checklist
- [ ] `use (&$var)` in queued closure
- [ ] Variable modified after `dispatch()` expected inside closure
- [ ] Loop dispatching closures with reference capture
- [ ] Synchronous tests pass but queued tests show unexpected values

### Related Rules/Skills/Decision Trees
- **Rule 5**: no-pass-by-reference-in-closures (`05-rules.md`)
- **Decision 2**: Closure Variable Capture Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 5: Closures in High-Throughput Paths

### Category
Performance — Slow Serialization

### Description
Using closure dispatch in high-throughput code paths (>100 jobs/minute). Closure serialization uses AST analysis and source extraction — 5-10x slower than class job serialization — creating unnecessary CPU overhead at scale.

### Why It Happens
Closures are convenient for quick implementation. Teams use them in performance-sensitive paths without measuring serialization overhead. The performance impact is negligible at low volume but compounds at scale.

### Warning Signs
- Closure dispatch in a loop or hot code path
- High-throughput job (100+ jobs/minute) uses closure
- Dispatch latency is higher than expected for queue-heavy operations
- CPU profiling shows significant time in `SerializableClosure` or `Opis\Closure`
- Serialization time appears as a bottleneck in dispatch profiling

### Why Harmful
Dispatch throughput is bottlenecked by serialization. At 1000 jobs/minute, the 5-10x slower serialization adds seconds of CPU time per minute. This delays the HTTP response (since `dispatch()` happens inline) and reduces the number of jobs that can be dispatched per second.

### Real-World Consequences
An analytics pipeline dispatches closures for each page view event (500/min). Closure serialization takes 2ms vs class job serialization at 0.3ms. The extra 1.7ms per dispatch adds 850ms of serialization overhead per minute — the application server CPU is at 60% for serialization alone. After switching to class jobs, serialization CPU drops to 10%.

### Preferred Alternative
Use class jobs for all high-throughput paths. Reserve closures for low-volume, non-performance-sensitive tasks.

### Refactoring Strategy
1. Identify high-throughput closure dispatches (check call frequency)
2. Extract each into a job class
3. Benchmark dispatch throughput before and after
4. Deploy and monitor CPU reduction
5. Add a code review guideline: "No closures in hot paths"

### Detection Checklist
- [ ] Closure dispatch in a loop or hot code path
- [ ] Job throughput > 100 jobs/minute
- [ ] Serialization time visible in profiling
- [ ] CPU usage correlates with dispatch calls

### Related Rules/Skills/Decision Trees
- **Rule 1**: prefer-class-jobs-over-closures (`05-rules.md`)
- **Decision 1**: Closure Job vs Class Job for Async Tasks (`07-decision-trees.md`)
