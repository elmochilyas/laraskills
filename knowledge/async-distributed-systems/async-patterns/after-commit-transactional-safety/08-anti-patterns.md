---
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: K064 — afterCommit Transactional Safety
Knowledge ID: K064
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Global afterCommit Without Monitoring Dispatch Delays | Operations | Medium |
| 2 | afterCommit on Read-Only Connections | Implementation | Low |
| 3 | Relying on afterCommit for Idempotency | Architecture | High |
| 4 | Dual Transaction + Post-Response Deferral Confusion | Architecture | Medium |
| 5 | Assuming afterCommit Works Without Active Transaction | Implementation | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Unmonitored Dispatch Backlog | Medium — slow transactions delay all dispatches | Monitor registration-to-push gap |
| afterCommit as Idempotency Substitute | High — duplicate processing on commit | Use proper idempotency keys |
| No-Rollback Protection | Medium — transient errors silently discard jobs | Use outbox pattern for critical dispatches |

---

## 1. Global afterCommit Without Monitoring Dispatch Delays

### Category
Operations

### Description
Setting `queue.after_commit = true` globally and never monitoring the time between dispatch registration and actual queue push. A long transaction can accumulate hours of deferred dispatches — the gap between "job registered" and "job pushed" goes undetected.

### Why It Happens
- Setting the global default is the first step; monitoring is the forgotten second step
- Not knowing that `afterCommit` defers the push until after commit — which could be far in the future
- Assuming transactions are always short
- No metrics for dispatch registration vs actual push timing
- "It works in development" — development transactions are usually instantaneous

### Warning Signs
- Jobs dispatched at 10:00 AM appear in the queue at 10:05 AM (5-minute gap)
- Transaction duration increases and dispatch delay grows proportionally
- No monitoring for dispatch delay (time between registration and queue push)
- Developers unaware of how long the enclosing transactions take
- Password-reset jobs deferred behind a 30-second import transaction

### Why Harmful
A password-reset job is dispatched inside a long-running report generation transaction. The transaction takes 30 seconds. The user clicks "reset password" and waits minutes for the email — because the job was deferred behind the report transaction. The gap between dispatch registration (during the web request) and actual queue push (after commit) is 30 seconds, then queue processing adds more time. Without monitoring, this invisible delay goes undetected until users complain.

### Consequences
- User-facing delays: time-sensitive jobs deferred behind long transactions
- No visibility into why jobs are delayed (looks like queue latency)
- Debugging confusion: "the job was dispatched but hasn't appeared in the queue"
- Transaction profiling is required to understand dispatch delays
- Accidental coupling: job dispatch timing is now tied to transaction duration

### Alternative
- Monitor dispatch delay: log the time between `dispatch()` and actual queue push
- Profile transaction duration for any transaction containing dispatches
- Keep transactions with `afterCommit` dispatches short (< 1 second)
- For long transactions, use `afterCommit(false)` for time-sensitive dispatches

### Refactoring Strategy
1. Add logging around dispatch registration time (before commit) and actual queue push (after commit)
2. Set up alerting if dispatch delay exceeds 5 seconds
3. Profile all transactions that contain job dispatches
4. Split long transactions or move time-sensitive dispatches outside
5. Document transaction duration requirements for any code dispatching jobs

### Detection Checklist
- [ ] Dispatch delay (registration vs push) monitored
- [ ] Alert set for dispatch delay > 5 seconds
- [ ] Transaction duration profiled for code paths dispatching jobs
- [ ] Time-sensitive jobs use `afterCommit(false)` when inside long transactions
- [ ] No password-reset, payment, or notification jobs deferred behind batch processing

### Related Rules
- enable-global-after-commit-default, monitor-dispatch-delays

### Related Skills
- Use afterCommit for Transactional Dispatch Safety

### Related Decision Trees
- after_commit=true vs Manual afterCommit() per Dispatch

---

## 2. afterCommit on Read-Only Connections

### Category
Implementation

### Description
Applying `afterCommit` to jobs dispatched when the application uses a read-only database connection. Read-only connections do not have transactions — the `afterCommit` setting has no effect, but the code implies a transactional guarantee that does not exist.

### Why It Happens
- Not knowing whether the database connection is read-only
- Applying `afterCommit` globally without considering connection types
- Using the same code path for read and write connections
- Copying `afterCommit` usage from write-context code without verifying
- Assuming all database connections support transactions

### Warning Signs
- `afterCommit` used on read-replica database connections
- Jobs dispatched on read-only connections have no transactional behavior
- Code comments say "dispatch after commit" but connection is read-only
- Confusion: "why did this job execute before the transaction committed?" — because there is no transaction
- Read-only connection used for reporting/read-models but dispatches jobs

### Why Harmful
A job is dispatched on a read-only connection with `->afterCommit()`. The developer believes the job will only execute after the data is committed. But read-only connections don't have transactions — the job dispatches immediately. If the data was written in a separate write-connection transaction that hasn't committed yet, the worker sees stale or missing data. The `afterCommit` call provided no protection because it assumed a transaction context that didn't exist.

### Consequences
- False sense of transactional safety
- Jobs read stale data from write connections (latency between write and read-replica propagation)
- Bugs that are hard to reproduce (timing-dependent)
- Debugging confusion: "afterCommit should prevent this" — doesn't work on read-only
- Data inconsistency from jobs reading uncommitted or stale data

### Alternative
- Only use `afterCommit` on write-capable database connections
- If using read-replicas, dispatch jobs on the write connection or verify the connection supports transactions
- Document which database connection is used for dispatching jobs
- Use explicit connection setting: `$job->onConnection('mysql-write')->afterCommit()`

### Refactoring Strategy
1. Identify all code paths dispatching jobs with `afterCommit`
2. Verify the database connection used supports transactions
3. Switch to write connection if `afterCommit` is needed
4. Remove `afterCommit` from read-only connection dispatches (no effect)
5. Add code review check: `afterCommit` requires writable connection

### Detection Checklist
- [ ] All `afterCommit` dispatches use a writable database connection
- [ ] No read-only connections dispatching jobs with `afterCommit`
- [ ] Read-replica dispatches are intentional (not assuming transactional safety)
- [ ] Connection type documented for each dispatch path
- [ ] Code review checks connection type when `afterCommit` is used

### Related Rules
- enable-global-after-commit-default

### Related Skills
- Use afterCommit for Transactional Dispatch Safety

### Related Decision Trees
- Transactional Job Dispatch Strategy

---

## 3. Relying on afterCommit for Idempotency

### Category
Architecture

### Description
Believing that `afterCommit` prevents duplicate job processing. `afterCommit` guarantees that the worker sees committed data, but it does not prevent the same job from being processed multiple times if the transaction commits more than once or if the job is dispatched from multiple code paths.

### Why It Happens
- Confusing "visibility" with "uniqueness"
- Assuming one `afterCommit` dispatch per transaction
- Not considering that the same job can be dispatched in multiple transactions
- Not understanding that `afterCommit` does not add any deduplication logic
- "I use afterCommit so my job is safe from duplicates" — incorrect

### Warning Signs
- Duplicate jobs processed despite using `afterCommit`
- `afterCommit` is cited as the idempotency strategy in documentation
- No idempotency keys or unique job IDs on critical dispatches
- "We use afterCommit so we don't need deduplication" — misunderstanding
- Duplicate records created by jobs that run multiple times

### Why Harmful
An order confirmation job dispatches with `afterCommit` inside an order creation transaction. The transaction commits, the job dispatches. But the order creation code is called twice due to a duplicate form submission — two transactions, two commits, two `afterCommit` dispatches, two confirmation emails. `afterCommit` only ensures each dispatch waits for its own transaction — it does not prevent the same logical job from being dispatched multiple times.

### Consequences
- Duplicate processing despite "afterCommit" protection
- Double charges, duplicate emails, double inventory deduction
- False confidence: team believes they have idempotency coverage
- Duplicate detection is not implemented (thought to be unnecessary)
- Incident response discovers duplicate processing — root cause is not `afterCommit` misunderstanding

### Alternative
- `afterCommit` provides visibility guarantees, NOT idempotency
- Implement actual idempotency for critical jobs:
  - Idempotency key: unique key per logical operation
  - `ShouldBeUnique`: Laravel's built-in unique job mechanism
  - Conditional insert: check before creating records
- Combine `afterCommit` (visibility) + idempotency (uniqueness) for complete safety

### Refactoring Strategy
1. Audit all jobs that rely on `afterCommit` for duplicate prevention
2. Implement proper deduplication:
   - Add `ShouldBeUnique` to jobs that should only run once
   - Add idempotency key validation in `handle()` method
   - Use database unique constraints for job-created records
3. Remove "afterCommit guarantees idempotency" from documentation
4. Educate the team: afterCommit is visibility, not uniqueness

### Detection Checklist
- [ ] No critical job relies solely on `afterCommit` for duplicate prevention
- [ ] Idempotency keys or `ShouldBeUnique` used for critical jobs
- [ ] `afterCommit` understood as visibility-only guarantee
- [ ] Duplicate prevention strategy documented separately from transactional safety
- [ ] Duplicate processing incidents reduced

### Related Rules
- enable-global-after-commit-default, test-rollback-scenarios

### Related Skills
- Use afterCommit for Transactional Dispatch Safety

### Related Decision Trees
- Transactional Job Dispatch Strategy

---

## 4. Dual Transaction + Post-Response Deferral Confusion

### Category
Architecture

### Description
Combining `afterCommit` and `dispatchAfterResponse` without understanding the ordering semantics. The job is dispatched after the transaction commits and then queued — neither executes synchronously after the response, nor is it literally executed "post-response" in the way developers expect.

### Why It Happens
- Not reading that `dispatchAfterResponse` is orthogonal to `afterCommit`
- Assuming both together means "run after both transaction and response"
- Not testing the actual execution timing
- Misunderstanding that `afterCommit` affects queue push timing, `dispatchAfterResponse` affects execution timing
- Documentation doesn't clearly state the interaction

### Warning Signs
- Jobs dispatched with both `afterCommit` and `dispatchAfterResponse` are not executing when expected
- Confusion about job lifecycle: "I expected it to run after the response" or "I expected it to wait for commit"
- The job runs in a worker (not post-response) because `dispatchAfterResponse` with `afterCommit` falls back to queue
- No clear documentation of the combined behavior
- Tests don't verify the combined timing

### Why Harmful
`Bus::dispatchAfterResponse((new Job())->afterCommit())` — the developer expects the job to:
1. Wait for transaction commit (afterCommit)
2. Execute after response (dispatchAfterResponse)

But the actual behavior is:
1. The job is deferred until transaction commit (afterCommit works)
2. After commit, the job is dispatched via `dispatchAfterResponse` — which silently falls back to queue dispatch because `ShouldQueue`-type jobs are queued

The job ends up in the queue, not running post-response. The behavior is unexpected and may cause issues if the developer assumed post-response execution timing.

### Consequences
- Job runs in queue worker instead of post-response in web process
- Timing assumptions are wrong — job may run much later than expected
- `dispatchAfterResponse` is silently ignored (falls back to queue)
- No error or warning when the fallback occurs
- Debugging confusion: "why isn't this job running after the response?"

### Alternative
- Understand that `afterCommit` and `dispatchAfterResponse` are NOT composable in the way you'd expect
- `afterCommit` controls queue push timing (before worker can pick it up)
- `dispatchAfterResponse` controls execution in the web process (post-response)
- When combined, the `afterCommit` behavior works, but `dispatchAfterResponse` may fall back to queue
- Use explicit sequence:
  - `->afterCommit()` for transactional safety
  - Use separate job classes for post-response work and transactional work
  - Or use `Bus::defer()` (Laravel 12+) for post-response work inside the same flow

### Refactoring Strategy
1. Identify all combined `afterCommit` + `dispatchAfterResponse` usages
2. Decide which guarantee is needed:
   - Transactional safety only: use `afterCommit` alone, queue dispatch
   - Post-response execution only: use `dispatchAfterResponse` alone (no transaction)
   - Both: consider splitting into two jobs or use `Bus::defer()`
3. Test the actual execution timing
4. Document the combined behavior if both must be used

### Detection Checklist
- [ ] No unexpected combined `afterCommit` + `dispatchAfterResponse` usage
- [ ] Combined usage tested and documented
- [ ] Team understands they are orthogonal, not composable
- [ ] `dispatchAfterResponse` fallback to queue is understood
- [ ] For both guarantees, `Bus::defer()` considered as alternative

### Related Rules
- enable-global-after-commit-default

### Related Skills
- Use afterCommit for Transactional Dispatch Safety

### Related Decision Trees
- after_commit=true vs Manual afterCommit() per Dispatch

---

## 5. Assuming afterCommit Works Without Active Transaction

### Category
Implementation

### Description
Expecting `afterCommit` to defer job dispatch when no database transaction is active. `afterCommit` only has an effect inside a `DB::transaction()` or equivalent — outside a transaction, the job dispatches immediately, silently ignoring the `afterCommit` setting.

### Why It Happens
- Assuming `afterCommit` always delays dispatch (not understanding its conditional nature)
- Not verifying whether a transaction is active at the dispatch site
- Using `afterCommit` in middleware or service classes that may or may not be inside a transaction
- Copying `afterCommit` usage from transactional code without checking context
- Not testing: the behavior is identical with or without `afterCommit` outside transactions, so tests pass

### Warning Signs
- `afterCommit` used in code paths that may execute outside a transaction
- Code review: "this path doesn't have a transaction, why does it use afterCommit?"
- Service method dispatches with `afterCommit` but is called from both transactional and non-transactional contexts
- Test passes but behavior differs in production (where transactions are used differently)
- "I use afterCommit everywhere" — without checking transaction context

### Why Harmful
A service method dispatches a job with `afterCommit()` but is called from an event listener that fires outside any database transaction. The job dispatches immediately — the `afterCommit` has no effect. If the caller expected the job to wait for a transaction, the job may execute before data is committed. The developer believes there's a safety guarantee that doesn't exist.

### Consequences
- False sense of safety: developer thinks the job is protected
- Job executes before data is committed (dispatch was outside transaction)
- Transaction-visibility race condition that was thought to be prevented
- Intermittent bugs depending on whether the code path happens to be inside a transaction
- Debugging is confusing: "sometimes it works, sometimes it doesn't"

### Alternative
- Only use `afterCommit` when a database transaction is definitely active
- If the dispatch site may be inside or outside a transaction:
  - Check `DB::transactionLevel() > 0` before using `afterCommit`
  - Or restructure to always dispatch inside a transaction
  - Or accept that `afterCommit` is best-effort (with documentation)
- Better: set global `queue.after_commit = true` — outside transactions, it's a no-op; inside transactions, it works

### Refactoring Strategy
1. Audit all `afterCommit` usages — verify transaction context
2. For code paths without transactions: remove `afterCommit` (no effect) or add explicit transaction
3. For shared service methods: document that `afterCommit` requires a transaction
4. Set global `queue.after_commit = true` for catch-all coverage
5. Add debug logging: log when `afterCommit` is used without an active transaction

### Detection Checklist
- [ ] All `afterCommit` usages are inside active transactions
- [ ] Shared methods document transaction requirement
- [ ] Global `queue.after_commit = true` set (catch-all)
- [ ] No false assumption that `afterCommit` works without transactions
- [ ] Transaction context verified at dispatch site

### Related Rules
- enable-global-after-commit-default

### Related Skills
- Use afterCommit for Transactional Dispatch Safety

### Related Decision Trees
- after_commit=true vs Manual afterCommit() per Dispatch
