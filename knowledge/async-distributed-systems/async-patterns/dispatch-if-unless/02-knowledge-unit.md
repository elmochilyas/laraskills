# Metadata
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: dispatchIf/dispatchUnless Conditional Dispatch
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
`dispatchIf` and `dispatchUnless` are conditional dispatch methods on the `Bus` facade and `PendingDispatch` that gate job execution on a boolean condition evaluated at dispatch time. They eliminate if/else boilerplate in controllers and commands, making intent explicit. The condition is evaluated synchronously before the job is pushed to the queue — no runtime evaluation inside the worker.

# Core Concepts
- **dispatchIf($condition, $job)**: Dispatches the job only when `$condition` is truthy. Returns a `PendingDispatch` or null.
- **dispatchUnless($condition, $job)**: Dispatches the job only when `$condition` is falsy. Inverse of `dispatchIf`.
- **Eager condition evaluation**: The condition is evaluated immediately in the calling process. The queue worker receives the job or not — it has no knowledge of the condition.
- **Null return**: When the condition fails, `dispatchIf`/`dispatchUnless` return null instead of a `PendingDispatch`, which can break chaining.
- **Closure conditions**: `$condition` can be a callable for lazy evaluation, useful when the check involves an expensive computation or external state.

# Mental Models
- **Airport security**: dispatchIf is the gate — only passengers with boarding passes (condition true) proceed to the plane (queue). dispatchUnless sends everyone except VIPs through a different corridor.
- **Circuit breaker**: dispatchIf is a closed circuit — current flows when condition is met. dispatchUnless is the normally-closed contact — current flows when condition is NOT met.
- **Bouncer at a club**: dispatchIf checks IDs before letting people in. dispatchUnless lets everyone in except those on the banned list.

# Internal Mechanics
- `dispatchIf` creates a `PendingDispatch` instance internally, calls `dispatch()` on the condition branch, and returns the pending instance or null.
- The `Bus::dispatchIf()` static method wraps the dispatch logic, not the serialization — the job is fully serialized and pushed only when the condition passes.
- For chain dispatch (`Bus::chain()->dispatchIf()`), the condition gates the entire chain, not individual jobs.
- When using `dispatchIf` with `afterCommit`, the condition is evaluated before the transaction check — the condition gates dispatch, and `afterCommit` gates whether the dispatch is deferred until commit.

# Patterns
## Feature Flag Gating
- **Purpose**: Gate job dispatch behind a feature toggle.
- **Benefits**: Zero-cost toggle — disable the feature at the dispatch point without changing job logic.
- **Tradeoffs**: Feature state is read at dispatch time, not at execution time. Toggling between dispatch and execution has no effect.

## Role-Based Dispatch
- **Purpose**: Only dispatch notification jobs for users who have opted in.
- **Benefits**: No conditional logic inside the job. The job itself never checks user preferences.
- **Tradeoffs**: Preference changes between dispatch and execution are ignored — the job runs regardless.

## Skip Dispatch on Test Environments
- **Purpose**: Prevent jobs from dispatching in non-production environments.
- **Benefits**: Safe to run seeding and testing scripts without side effects.
- **Tradeoffs**: Environment check is hardcoded at the dispatch site — easy to forget updating when promoting environments.

# Architectural Decisions
- Use `dispatchIf`/`dispatchUnless` for business-rule conditions that are evaluated at the dispatch site (controller, command, observer).
- Move complex condition logic into dedicated middleware or job-level checks when the condition requires runtime data only available on the worker (e.g., fresh database state).
- Return-type consistency matters — if the caller chains on the dispatch result, provide a fallback `PendingDispatch` or null-safe chain.

# Tradeoffs
Eliminates if/else boilerplate at dispatch site | Returns null on failed condition — breaks method chaining
Condition evaluated once at dispatch time | Cannot react to state changes between dispatch and execution
Supports closure for lazy evaluation | Closure is evaluated eagerly in the same request — no performance gain over inline check
Makes dispatch intent explicit | Harder to grep for conditional dispatch logic than if/else blocks

# Performance Considerations
- Zero overhead when condition is false — no serialization, no queue push, no Redis/DB write.
- Closure conditions add marginal overhead compared to inline boolean checks — negligible unless the closure performs DB/API calls.
- No impact on queue worker performance — the condition is sandboxed entirely in the dispatch process.

# Production Considerations
- Log dispatch skips when conditions fail in production — `Bus::dispatchIf` returning null is silent. Add explicit logging when the skip is unexpected.
- Avoid expensive condition computations at dispatch time — use lazy evaluation (closure) but understand the closure still runs synchronously in the HTTP request.
- `dispatchUnless` with complex conditions can reduce readability. Prefer `dispatchIf(!$condition)` over `dispatchUnless($condition)` for clarity.

# Common Mistakes
- **Chaining on null**: `Bus::dispatchIf(false, $job)->onQueue('high')` throws a null method call. Guard or use `optional()`.
- **Assuming worker re-evaluation**: The condition does not run again on the worker. If the condition involves database state, use `dispatchAfterResponse` or a middleware that rechecks.
- **Forgetting falsy edge cases**: Empty strings, zero, empty arrays, and null are all falsy. Explicit comparison (`$condition === true`) may be safer.
- **Nesting dispatchIf inside dispatchIf**: Multiple conditions are better expressed as a single boolean expression.

# Failure Modes
- **Race condition on condition data**: The condition reads state that changes before the worker runs. The job dispatches based on obsolete data. Mitigation: move condition inside the job if staleness is unacceptable.
- **Silent skip without audit**: A condition that always fails causes the job to never dispatch. No error, no failed job, no alert. Mitigation: add monitoring for expected dispatch counts per job class.

# Ecosystem Usage
- **Laravel Horizon**: Dispatched jobs are visible in Horizon regardless of condition at dispatch — Horizon only shows what has been pushed to Redis.
- **Laravel Pulse**: Pulse records dispatched job counts — conditional skips are invisible in Pulse metrics.

# Related Knowledge Units
- K062 dispatchAfterResponse (post-response alternative) | K064 afterCommit transactional safety (dispatch timing control)

# Research Notes
Simple syntactic sugar but powerful for intent communication. The null-return gotcha is the most common source of subtle bugs. Teams should decide on a convention — always use `dispatchIf` for conditional dispatch, or use traditional if/else with explicit null handling — and enforce it in code review.

## Research Notes
- The dispatchAfterResponse() method pushes the job to the queue after the HTTP response is sent to the client — this is useful for non-critical background tasks that can be lost if the process crashes after response delivery.
- The dispatchIf() and dispatchUnless() conditional dispatch methods evaluate a condition at dispatch time — if the condition changes before the job processes, the job still executes; conditions are not re-evaluated on the worker.
- The fterCommit method defers job dispatch until the current database transaction commits — this prevents workers from processing jobs that reference uncommitted data, avoiding the "phantom read" problem in queue workers.
- The Defer pattern (Laravel 12+) provides Defer::create() for deferred execution within the same request lifecycle — unlike queued jobs, deferred functions execute synchronously after the response is sent but within the same PHP process.
- dispatchAfterResponse does not use the queue system at all — it registers a shutdown function that executes after the response is sent, meaning it runs in the web server process, not in a dedicated queue worker.
- Community best practice for transactional safety recommends always using fterCommit() when dispatching jobs within database transactions, even for seemingly independent operations.
- The dispatchIf pattern combined with fterCommit creates a potential race condition — the dispatch condition is evaluated before the transaction commits, but the job is only dispatched after commit, leading to scenarios where the condition may no longer be valid.
- Understanding the distinction between deferred execution (same process, after response) and queued execution (worker process, potentially much later) is critical for choosing the right dispatch pattern.
