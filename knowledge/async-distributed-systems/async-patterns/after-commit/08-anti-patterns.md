# ECC Anti-Patterns — afterCommit

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | async-distributed-systems |
| **Subdomain** | 08-async-patterns |
| **Knowledge Unit** | afterCommit |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Dispatching Jobs Without afterCommit — Race Conditions on Uncommitted Data
2. Defaulting to afterCommit = false Globally — Forgotten Transactional Safety
3. Misunderstanding afterCommit Behavior Outside Transactions
4. Validating Data Inside the Transaction After Dispatch
5. Wrapping Single Queries in Transactions Just to Use afterCommit
6. Mixing afterCommit and Non-afterCommit Jobs in Same Transaction

---

## Repository-Wide Anti-Patterns

- Assuming All Dispatching Needs afterCommit
- Not Documenting afterCommit Decisions

---

## Anti-Pattern 1: Dispatching Jobs Without afterCommit — Race Conditions on Uncommitted Data

### Category
Data Integrity | Reliability

### Description
Dispatching a queue job within a database transaction without calling `afterCommit()`, causing the job to execute before the transaction commits and fail because it reads stale or missing data.

### Why It Happens
Developers forget to chain `->afterCommit()` on `dispatch()`. The race condition is intermittent — tests often pass because the transaction commits fast enough.

### Warning Signs
- Intermittent `ModelNotFoundException` in queue jobs
- Jobs fail on first retry but succeed on second (transaction committed by then)
- Race condition only occurs under high database load
- Tests rarely reproduce the issue

### Why It Is Harmful
Unreliable job processing — same job sometimes fails, sometimes succeeds depending on timing. Debugging is extremely difficult due to intermittency.

### Real-World Consequences
A worker picks up the job 10ms after dispatch — the order row isn't committed yet. The worker queries for the order, gets null, and fails. The job retries 3 times, all failing because the transaction hasn't committed. The order exists in the database but its associated job is permanently failed.

### Preferred Alternative
Always chain `->afterCommit()` when dispatching jobs that depend on data written in the current transaction.

### Refactoring Strategy
1. Audit all `dispatch()` calls inside database transactions
2. Identify jobs that read data written in the same transaction
3. Add `->afterCommit()` to those dispatch calls
4. Set `after_commit` to `true` in queue connection config as safety net
5. Write a test that verifies job waits for transaction commit

### Detection Checklist
- [ ] Jobs dispatched inside transactions without `->afterCommit()`
- [ ] Intermittent `ModelNotFoundException` in queue jobs
- [ ] Job retries succeed after initial failure
- [ ] Race conditions that are hard to reproduce

### Related Rules
Always use afterCommit when the job depends on data written in the current transaction (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Defaulting to afterCommit = false Globally — Forgotten Transactional Safety

### Category
Reliability | Configuration

### Description
Leaving `after_commit` set to `false` (default) in queue connection configuration, requiring every developer to remember `->afterCommit()` on every dispatch.

### Warning Signs
- `config/queue.php` has `after_commit` absent or set to `false`
- Some dispatches use `->afterCommit()` and some don't — inconsistent
- New team members forget to add `->afterCommit()` on first dispatch
- Code review repeatedly catches missing `->afterCommit()`

### Why It Is Harmful
Relies on human memory for transactional safety. One forgotten `->afterCommit()` can cause hard-to-debug race conditions. Inconsistent pattern across codebase.

### Real-World Consequences
A senior developer adds a new dispatch inside a transaction without `->afterCommit()`. In production, 0.1% of jobs fail with `ModelNotFoundException` — an intermittent race condition that's nearly impossible to reproduce in development. Debugging takes 3 days.

### Preferred Alternative
Set `after_commit` to `true` in queue connection configuration as the default. Only opt out explicitly when a job must dispatch before commit.

### Refactoring Strategy
1. Set `after_commit => true` in `config/queue.php` for all queue connections
2. Audit existing dispatches — remove explicit `->afterCommit()` since it's now default
3. Document that `->beforeCommit()` (or dispatch without afterCommit) is for exceptions
4. Add a CI lint rule that flags missing afterCommit awareness

### Detection Checklist
- [ ] `after_commit` absent or `false` in queue connection config
- [ ] Inconsistent use of `->afterCommit()` across the codebase
- [ ] Code reviews catch missing afterCommit regularly
- [ ] New developers unknowingly create race conditions

### Related Rules
Prefer setting the queue connection's after_commit to true globally (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Misunderstanding afterCommit Behavior Outside Transactions

### Category
Knowledge | Correctness

### Description
Believing that `afterCommit` delays job execution when called outside a transaction, or wrapping code in unnecessary transactions to "make afterCommit work."

### Why It Happens
Developers don't understand that `afterCommit` dispatches immediately when no transaction is active. The "commit" in afterCommit refers to the current transaction, not a general delay mechanism.

### Warning Signs
- Code creates empty transactions around single queries to "use afterCommit"
- `afterCommit` used on dispatches that are never inside a transaction
- Documentation or comments suggest afterCommit "delays" the job
- Developers are surprised that afterCommit doesn't delay without a transaction

### Why It Is Harmful
False sense of safety — developers think jobs are deferred when they aren't. Unnecessary transaction overhead for no benefit. Confusion about when jobs actually execute.

### Real-World Consequences
A developer wraps a single SELECT query in a database transaction to "make afterCommit work," adding unnecessary database overhead and transaction ID consumption. The job still dispatches immediately because there's no write to commit.

### Preferred Alternative
Understand and document that `afterCommit` only defers execution when called inside an active database transaction. Outside a transaction, it dispatches immediately.

### Refactoring Strategy
1. Audit unnecessary transactions created solely for afterCommit
2. Remove empty or read-only transactions around dispatches
3. Document the afterCommit behavior in team wiki or code comments
4. Add a CI check that warns on transaction-wrapped single queries
5. Educate team during code review

### Detection Checklist
- [ ] Transactions created only to wrap a single dispatch
- [ ] `afterCommit` used on dispatches never inside transactions
- [ ] Developer confusion about when the job actually runs
- [ ] Unnecessary `DB::transaction()` around read-only operations

### Related Rules
Understand that afterCommit dispatches immediately when no transaction is active (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Validating Data Inside the Transaction After Dispatch

### Category
Data Integrity | Architecture

### Description
Performing validation inside the queued job that runs after the transaction commits, allowing invalid data to be committed to the database.

### Why It Happens
Validation logic is placed in the job for convenience. Team assumes validation always passes.

### Warning Signs
- Queue job contains validation rules that could fail
- Database has records whose associated jobs failed validation
- Manual cleanup required for "orphaned" records
- Validation logic duplicated in controller and job

### Why It Is Harmful
Invalid data committed to the database. Zombie records with no associated processing. Manual reconciliation required. Data integrity violations.

### Real-World Consequences
2% of orders have invalid data that's only caught inside `ProcessOrder`. The order is committed, but the job fails — the order exists in the database but was never processed. Customer support manually handles each case. Audit trail shows committed-but-unprocessed orders.

### Preferred Alternative
Validate data before the transaction. Fail fast with a validation error so the user can correct input immediately, before any data is committed.

### Refactoring Strategy
1. Identify validation logic inside queue jobs
2. Move validation to before the transaction in the controller or service
3. Add form request validation or service-level validation
4. Keep only business processing logic in the queue job
5. Verify that committed records always have a corresponding successful job

### Detection Checklist
- [ ] Queue jobs contain validation rules
- [ ] Database has records whose associated jobs failed
- [ ] Manual reconciliation required for partially processed records
- [ ] Orphan cleanup scripts exist for specific job types

### Related Rules
Always validate data before the transaction (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Wrapping Single Queries in Transactions Just to Use afterCommit

### Category
Performance | Architecture

### Description
Wrapping single, simple database operations in unnecessary transactions solely to leverage `afterCommit` behavior.

### Why It Happens
Developers misunderstand that `afterCommit` requires a transaction and create one even when not needed.

### Warning Signs
- Transactions wrapping a single `UPDATE` or `INSERT` with no other operations
- Transactions used only to enable `afterCommit` on a dispatch
- Transaction nesting where the inner transaction serves no purpose
- Database transaction metrics show high volume of single-statement transactions

### Why It Is Harmful
Unnecessary transaction overhead — connection pool consumption, lock duration, transaction ID usage. No benefit for single-statement operations that are atomic by nature.

### Real-World Consequences
A developer wraps every order dispatch in a transaction: `DB::transaction(fn() => ProcessOrder::dispatch($order)->afterCommit())`. Each transaction acquires a connection from the pool and holds it for the duration. Under load, the connection pool is exhausted by transactions that do nothing.

### Preferred Alternative
Only use transactions when multiple operations must be atomic. For single-statement operations, the statement itself is atomic — dispatch without a transaction or afterCommit.

### Refactoring Strategy
1. Identify transactions wrapping only a single database operation
2. Determine if atomicity requires the transaction
3. Remove unnecessary transactions
4. If transactional safety is needed, ensure the transaction includes all related operations
5. Monitor transaction metrics after cleanup

### Detection Checklist
- [ ] Transactions wrapping single INSERT/UPDATE statements
- [ ] AfterCommit used as the sole reason for transaction existence
- [ ] High volume of single-statement transactions in metrics
- [ ] Connection pool pressure correlates with dispatch volume

### Related Rules
Understand that afterCommit dispatches immediately when no transaction is active (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 6: Mixing afterCommit and Non-afterCommit Jobs in Same Transaction

### Category
Data Integrity | Consistency

### Description
Dispatching both `afterCommit` and non-afterCommit jobs in the same transaction, causing inconsistent ordering where some jobs may run before others unpredictably.

### Why It Happens
Team doesn't consider the ordering implications of mixing dispatch strategies within one transaction.

### Warning Signs
- Same transaction dispatches jobs with and without `afterCommit`
- Job ordering doesn't match the dispatch order
- Jobs that depend on other jobs complete before those jobs run
- Inconsistent processing sequence in production

### Why It Is Harmful
Processing order is unpredictable. Jobs that run before commit see stale data. Jobs that run after commit see committed data. Dependencies between jobs break intermittently.

### Real-World Consequences
A transaction creates an order and dispatches `SendConfirmation` (afterCommit) and `TrackAnalytics` (no afterCommit). The analytics job runs immediately, queries order count, and gets the stale pre-transaction count. The confirmation email references data not yet committed.

### Preferred Alternative
Use the same dispatch strategy (all afterCommit or all immediate) within a single transaction. If mixing is necessary, document the ordering explicitly.

### Refactoring Strategy
1. Audit transactions that mix dispatch strategies
2. Group dispatches by strategy requirement
3. Convert all dispatches to `afterCommit` by setting global default
4. If immediate dispatch is truly needed, move it outside the transaction
5. Document any remaining mixed cases with explicit reasoning

### Detection Checklist
- [ ] Same transaction dispatches jobs with and without afterCommit
- [ ] Job processing order inconsistent with dispatch order
- [ ] Dependencies between jobs break intermittently
- [ ] No documentation explaining mixed dispatch strategy

### Related Rules
Always use afterCommit when the job depends on data written in the current transaction (05-rules.md)

### Related Skills
Implement afterCommit for Transactional Job Dispatching (06-skills.md)

### Related Decision Trees
Transactional Dispatch Strategy (07-decision-trees.md)
