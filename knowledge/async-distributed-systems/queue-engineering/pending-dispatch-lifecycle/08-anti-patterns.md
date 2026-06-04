# Anti-Patterns: PendingDispatch Lifecycle

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K007 — PendingDispatch Lifecycle |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Assigning dispatch() to a Variable | Reliability | High |
| 2 | Exception in Fluent Dispatch Chain | Reliability | Critical |
| 3 | Conditional Dispatch Wrapped in if-block | Design | Medium |
| 4 | Relying on Destructor Ordering | Reliability | Medium |
| 5 | Using dispatch() When Immediate Dispatch Is Needed | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Mixing Destructor-Based Dispatch with Explicit Dispatch | pending-dispatch-lifecycle, should-queue-contract | Medium |
| No Error Handling for Silent Dispatch Failures | pending-dispatch-lifecycle, failed-job-events | High |
| Chaining After Exception-Prone Methods Without Validation | pending-dispatch-lifecycle, job-middleware | High |

---

## Anti-Pattern 1: Assigning dispatch() to a Variable

### Category
Reliability — Unexpected Dispatch Timing

### Description
Assigning the result of `dispatch()` to a variable: `$pending = MyJob::dispatch()`. The `PendingDispatch` object dispatches in its destructor, not at the `dispatch()` call. The job doesn't queue until the variable goes out of scope — potentially much later than the developer expects.

### Why It Happens
Developers are unaware that `PendingDispatch` defers dispatch to the destructor. Assigning the result is a natural reflex when calling a method that returns a value. The code "works" in testing because the variable goes out of scope quickly, but timing differences emerge in complex scopes.

### Warning Signs
- `$var = Job::dispatch()` pattern in codebase
- Job dispatches later than expected (e.g., after other code in the same method)
- Jobs dispatched inside loops process with all loop iterations complete
- Scope-dependent timing bugs that are hard to reproduce
- Jobs don't dispatch if an exception occurs before the variable goes out of scope

### Why Harmful
Dispatch timing becomes unpredictable and scope-dependent. A job may dispatch after a database transaction commits (expected) or after a response is sent to the client (unexpected, causes race conditions).

### Real-World Consequences
A controller assigns `$pending = ProcessOrder::dispatch($order)` at the top of the method, then performs 2 seconds of additional processing. The job doesn't dispatch until the method returns and the variable goes out of scope. The user experiences 2 seconds of additional latency because the job doesn't start processing until the response is sent. After changing to fire-and-forget dispatch, the job starts immediately, and response time drops by 2 seconds.

### Preferred Alternative
Use fire-and-forget `MyJob::dispatch(...)` for immediate dispatch. Only assign the result when intentionally delaying dispatch (e.g., for further chaining).

### Refactoring Strategy
1. Remove variable assignment from standard dispatch calls
2. For chained dispatch: assign intentionally and document the timing
3. For conditional dispatch: switch to `dispatchIf()` / `dispatchUnless()`
4. Review all dispatch sites for assignment patterns
5. Test dispatch timing with `Queue::fake()` by inspecting `pushed()` timestamps

### Detection Checklist
- [ ] `dispatch()` result assigned to a variable
- [ ] Scope-dependent dispatch timing issues
- [ ] Response-time correlation with dispatch point
- [ ] Jobs not dispatched after exceptions in the same scope

### Related Rules/Skills/Decision Trees
- **Rule 1**: dont-assign-dispatch-to-variable (`05-rules.md`)
- **Decision 1**: dispatch() Assignment vs Fire-and-Forget (`07-decision-trees.md`)

---

## Anti-Pattern 2: Exception in Fluent Dispatch Chain

### Category
Reliability — Silent Job Loss

### Description
Using fluent chain methods (`onQueue()`, `onConnection()`, `delay()`) that may throw exceptions. If a chain method throws, the `PendingDispatch` destructor never fires — the job is silently lost with no error log, no failed entry, and no trace.

### Why It Happens
Developers assume chain methods are simple property setters. Some chain methods (especially `onQueue()` with invalid names, `onConnection()` with missing connections) validate inputs and throw exceptions.

### Warning Signs
- Chain methods involve dynamic values: `->onQueue($userInput)`, `->onConnection($envConfig)`
- Jobs disappear intermittently but no error is logged
- Queue monitoring shows fewer jobs dispatched than expected
- No try-catch around the dispatch chain
- Dynamic queue names or connections from user input or configuration

### Why Harmful
Jobs silently disappear. A payment processing job, email send, or critical notification fails to dispatch with no indication. The first sign is a customer complaint or a missing business outcome.

### Real-World Consequences
A team dispatches `ProcessOrder::dispatch($order)->onQueue($order->priority)`. When `$order->priority` contains an invalid queue name (e.g., null or empty string), `onQueue()` throws an `InvalidArgumentException`. The `PendingDispatch` destructor never fires — the order is never processed. The team doesn't notice until customer complaints arrive because no error is logged.

### Preferred Alternative
Validate chain method inputs before calling `dispatch()`. Use try-catch around the dispatch chain, or set properties on the job instance before dispatching.

### Refactoring Strategy
1. Identify dynamic values used in chain methods
2. Validate inputs before the dispatch chain
3. Wrap the dispatch chain in try-catch
4. Log chain failures with context for debugging
5. Consider setting properties on the job object directly instead of using chain methods

### Detection Checklist
- [ ] Fluent chain uses dynamic/unvalidated values
- [ ] No try-catch around dispatch chain
- [ ] Jobs disappear without error logs
- [ ] Chain methods with validation (onQueue, onConnection)

### Related Rules/Skills/Decision Trees
- **Rule 3**: handle-exceptions-in-dispatch-chain (`05-rules.md`)
- **Decision 1**: dispatch() Assignment vs Fire-and-Forget (`07-decision-trees.md`)

---

## Anti-Pattern 3: Conditional Dispatch Wrapped in if-block

### Category
Design — Unnecessary Overhead

### Description
Wrapping `dispatch()` in an `if` block for conditional dispatch instead of using `dispatchIf()` or `dispatchUnless()`. The conditional block still creates and destroys a `PendingDispatch` object even when the condition is false, adding unnecessary overhead and obscuring intent.

### Why It Happens
Developers are unaware of `dispatchIf()` and `dispatchUnless()`. The `if` block pattern is the most intuitive approach and is used in many code examples.

### Warning Signs
- `if ($condition) { Job::dispatch(...); }` pattern throughout the codebase
- No use of `dispatchIf()` or `dispatchUnless()`
- Conditional dispatch is always a simple boolean check
- Code reviews don't flag the pattern

### Why Harmful
The conditional dispatch intent is less explicit. A `PendingDispatch` is created (and immediately destroyed) on every code path — even when the condition is false. The pattern also creates an extra indentation level and makes the code slightly harder to scan.

### Real-World Consequences
A method dispatches a notification conditionally: `if ($shouldNotify) { SendNotification::dispatch($user); }`. A code reviewer misses the conditional because it's buried in a block of other conditionals. After refactoring to `SendNotification::dispatchIf($shouldNotify, $user)`, the conditional dispatch is immediately visible on a single line, and review catches the missing condition.

### Preferred Alternative
Use `dispatchIf($condition, ...)` and `dispatchUnless($condition, ...)` for conditional dispatch with simple boolean conditions.

### Refactoring Strategy
1. Find all `if ($condition) { Job::dispatch(...); }` patterns
2. Replace with `Job::dispatchIf($condition, ...)`
3. For negative conditions, use `Job::dispatchUnless($condition, ...)`
4. For complex conditions, keep the if-block but consider extracting the condition

### Detection Checklist
- [ ] Conditional dispatch uses if-block wrapper
- [ ] `dispatchIf()` not used in codebase
- [ ] Simple boolean conditions in dispatch wrapper if-blocks
- [ ] Unnecessary PendingDispatch creation on false paths

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-dispatch-if-unless (`05-rules.md`)
- **Decision 2**: dispatchIf/dispatchUnless vs Conditional dispatch() (`07-decision-trees.md`)

---

## Anti-Pattern 4: Relying on Destructor Ordering

### Category
Reliability — Non-Deterministic Behavior

### Description
Relying on the order in which `PendingDispatch` destructors fire. PHP's garbage collector does not guarantee destructor ordering — jobs may dispatch in unexpected order, especially when multiple `PendingDispatch` objects exist in the same scope.

### Why It Happens
Developers assume that destructors fire in the reverse order of construction (like C++). PHP does not guarantee this — destructor order is determined by the garbage collector's reference counting, which is non-deterministic.

### Warning Signs
- Multiple dispatches in the same method where order matters
- Tests that depend on dispatch order
- Intermittent ordering failures that change with PHP version
- Jobs that must process in sequence (e.g., create record then process it)
- Destructor-based ordering relied upon for correctness

### Why Harmful
Jobs that must process in a specific order may process in the wrong order. A "create user" job may dispatch after a "send welcome email" job, causing the email to fail because the user doesn't exist yet.

### Real-World Consequences
A team dispatches `CreateUser::dispatch($data)` and then `SendWelcomeEmail::dispatch($user)`. They assume `CreateUser` dispatches first. Due to PHP's non-deterministic destructor ordering, `SendWelcomeEmail` dispatches first on PHP 8.2, and the welcome email fails because the user record doesn't exist yet. The team spent 3 days debugging before discovering that destructor ordering is not guaranteed.

### Preferred Alternative
Use `Bus::chain()` for sequential job processing. Use `Bus::batch()` for parallel processing with dependency ordering.

### Refactoring Strategy
1. Identify all code locations where dispatch order is assumed
2. Replace with `Bus::chain([...])->dispatch()` for sequential jobs
3. For parallel jobs with no ordering requirement, keep separate dispatches
4. Add integration tests that verify processing order
5. Document that destructor ordering is non-deterministic

### Detection Checklist
- [ ] Multiple dispatches in same method where order matters
- [ ] Tests depend on dispatch order
- [ ] Intermittent ordering failures
- [ ] No explicit ordering mechanism (chain, batch)

### Related Rules/Skills/Decision Trees
- **Rule 4**: use-bus-dispatchToQueue-pattern (`05-rules.md`)
- **Decision 1**: dispatch() Assignment vs Fire-and-Forget (`07-decision-trees.md`)

---

## Anti-Pattern 5: Using dispatch() When Immediate Dispatch Is Needed

### Category
Design — Inappropriate API

### Description
Using `dispatch()` (which relies on destructor timing) when immediate dispatch is required. For scenarios where dispatch timing must be precise (e.g., inside a loop where iteration timing matters), the destructor-based approach introduces unpredictability.

### Why It Happens
Developers use `dispatch()` as a one-size-fits-all API. The distinction between deferred (destructor) and immediate dispatch is not obvious from the method name.

### Warning Signs
- Loop dispatching jobs where timing between iterations matters
- Dispatch timing critical for correctness (e.g., rate limiting between dispatches)
- `Bus::dispatchToQueue()` not used anywhere in the codebase
- Jobs in loops dispatch all at once at loop end instead of per-iteration
- Destructor timing causes issues in production that are hard to reproduce

### Why Harmful
Jobs dispatch in batches at scope boundaries instead of precisely where the developer intended. In loops, all jobs dispatch at the end of the loop body, not after each iteration — this can overwhelm the queue or miss timing-dependent logic.

### Real-World Consequences
A loop dispatches jobs to process API pagination: `foreach ($pages as $page) { ProcessPage::dispatch($page); }`. The developer expects each job to dispatch immediately (to spread load). Instead, all jobs dispatch at the end of the loop because the `PendingDispatch` destructors fire when the `$pending` variable from iteration goes out of scope. 100 jobs hit the queue simultaneously, overwhelming the worker.

### Preferred Alternative
Use `Bus::dispatchToQueue()` when immediate dispatch is required. Reserve `dispatch()` for the standard fire-and-forget pattern.

### Refactoring Strategy
1. Identify loops with dispatch calls
2. Replace `Job::dispatch()` with `Bus::dispatchToQueue(new Job(...))` for immediate dispatch
3. For loops where timing matters, add small delays between dispatches if needed
4. Document the distinction between deferred and immediate dispatch APIs
5. Test dispatch timing behavior

### Detection Checklist
- [ ] Loop dispatching jobs where timing between iterations matters
- [ ] `Bus::dispatchToQueue()` not used
- [ ] Jobs dispatch in batches instead of individually
- [ ] Timing-dependent bugs hard to reproduce

### Related Rules/Skills/Decision Trees
- **Rule 4**: use-bus-dispatchToQueue-pattern (`05-rules.md`)
- **Decision 1**: dispatch() Assignment vs Fire-and-Forget (`07-decision-trees.md`)
