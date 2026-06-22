# Decision Trees for After-Commit Events, Jobs & Side Effects

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Layered Architecture Patterns |
| Knowledge Unit | After-Commit Events, Jobs & Side Effects |
| Related KUs | Billing webhook queues, Queue deployment safety, Billing queue topology |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-AC-001 | Should this side effect execute inside the transaction or after commit? | P0 |
| DT-AC-002 | Which after-commit mechanism should I use? | P0 |
| DT-AC-003 | Does this after-commit job need retry logic? | P0 |
| DT-AC-004 | Should multiple side effects be orchestrated by a single job or dispatched independently? | P1 |

---

## DT-AC-001: Should This Side Effect Execute Inside the Transaction or After Commit?

### Decision Context
Every side effect triggered by a transaction-bound operation must be classified: does it need to run inside the transaction (atomic with the DB change) or after commit (external systems should only see committed state)? Misclassifying leads to phantom side effects (email for a rolled-back order) or lost external state (Stripe charge with no DB record).

### Decision Criteria
- Does the side effect touch an external system (email, Stripe, HTTP API, webhook)?
- Does the side effect read database state written in this transaction?
- Can the side effect be undone if the transaction rolls back?
- Is the side effect a database write within the same connection?

### Decision Tree

```
Does the side effect touch an external system (email, Stripe, HTTP)?
├── YES → AFTER COMMIT. External systems cannot be rolled back.
│   └── Does the external call depend on DB state written in the transaction?
│       ├── YES → Use ->afterCommit() on the job/event dispatch
│       └── NO → Use DB::afterCommit() for the call itself
├── NO → Does the side effect read DB state written in this transaction?
    ├── YES → Is it a queued job?
    │   ├── YES → Use ->afterCommit() (worker may pick up before commit)
    │   └── NO → Can stay inside the transaction (same connection sees uncommitted state)
    └── NO → Is it a cache invalidation?
        ├── YES → AFTER COMMIT (another process may re-cache stale uncommitted state)
        └── NO → Can stay inside the transaction
```

### Rationale
External systems have no knowledge of your database transaction. If you call Stripe inside a transaction that rolls back, the Stripe charge persists with no corresponding DB record. If you send email inside a transaction that rolls back, the customer receives a phantom notification. The only safe approach is to defer external side effects until after the commit guarantees the DB state is durable.

### Recommended Default
**Default to after-commit for all external side effects.** Only keep side effects inside the transaction when they are database writes on the same connection and need atomicity with the transaction.

### Risks Of Wrong Choice
- **After-commit when in-transaction was fine**: Negligible risk — after-commit is always safe, just slightly more complex
- **In-transaction when after-commit was needed**: Phantom emails, orphaned Stripe charges, cache corruption. These are production incidents.

### Related Rules
- Defer External Side Effects Until After the Transaction Commits

---

## DT-AC-002: Which After-Commit Mechanism Should I Use?

### Decision Context
Laravel provides three after-commit mechanisms: `dispatchAfterCommit()` / `->afterCommit()` on job dispatch, `event(...)->afterCommit()` on event dispatch, and `DB::afterCommit()` for arbitrary callbacks. Each has a different use case. Choosing the wrong one leads to side effects that still execute inside the transaction or listeners that don't defer as expected.

### Decision Criteria
- Is the side effect a queued job?
- Is the side effect an event with queued listeners?
- Is the side effect an arbitrary callback (cache flush, direct API call)?
- Are there synchronous listeners on the event that also need to defer?

### Decision Tree

```
Is the side effect a queued job?
├── YES → Use ->afterCommit() on dispatch: MyJob::dispatch($data)->afterCommit()
├── NO → Is the side effect an event with listeners?
    ├── YES → Do the listeners implement ShouldQueue?
        ├── YES → Use event(new MyEvent($data))->afterCommit()
        ├── NO → Synchronous listeners run immediately regardless of afterCommit()
        │   └── Do the synchronous listeners also need to defer?
        │       ├── YES → Move the logic to DB::afterCommit() inside the listener
        │       └── NO → event() without afterCommit() is fine (synchronous = immediate)
    └── NO → Is the side effect an arbitrary callback?
        ├── YES → Use DB::afterCommit(fn () => ...)
        └── NO → Re-evaluate: is this actually a side effect?
```

### Rationale
`->afterCommit()` on job dispatch ensures the job is only dispatched after the outermost transaction commits. `event(...)->afterCommit()` defers queued listeners until commit, but synchronous listeners still execute immediately — this is a common source of confusion. `DB::afterCommit()` is the lowest-level mechanism: it registers a callback that runs after the outermost transaction commits, or immediately if no transaction is active.

### Recommended Default
**For queued jobs: `->afterCommit()`. For events with queued listeners: `event(...)->afterCommit()`. For everything else: `DB::afterCommit()`.** When in doubt, use `DB::afterCommit()` — it always works and is the most explicit.

### Risks Of Wrong Choice
- **Using `event(...)->afterCommit()` expecting synchronous listeners to defer**: They won't. Synchronous listeners execute immediately regardless. This is the #1 source of after-commit bugs.
- **Using `DB::afterCommit()` for a queued job**: Works but misses the job's built-in retry semantics. Prefer `->afterCommit()` on dispatch.

### Related Rules
- Defer External Side Effects Until After the Transaction Commits

---

## DT-AC-003: Does This After-Commit Job Need Retry Logic?

### Decision Context
`afterCommit()` guarantees the job is dispatched after the transaction commits, but it does NOT guarantee that the job's database read will see the committed data immediately. On read replicas, there's replication lag. Even on the primary, write buffers may not have flushed. The first execution attempt may fail with "record not found."

### Decision Criteria
- Does the job read from the database (vs. pure computation or external API only)?
- Is the application using read replicas?
- Is the job dispatched from inside a transaction?
- Can the job tolerate a brief delay before the committed data is visible?

### Decision Tree

```
Does the job read from the database?
├── NO → Retry not strictly needed (but cheap insurance)
├── YES → Is the application using read replicas?
    ├── YES → RETRY REQUIRED. Replication lag is guaranteed to cause occasional failures.
    │   └── Configure #[Tries(5)] #[Backoff([1, 3, 10, 30, 60])]
    ├── NO → Is the job dispatched from inside a transaction with ->afterCommit()?
        ├── YES → RETRY RECOMMENDED. Write buffer flush delay can cause first-attempt failure.
        │   └── Configure #[Tries(3)] #[Backoff([1, 5, 15])]
        └── NO → Retry optional — no transaction visibility gap
```

### Rationale
The race condition gap is real but often invisible in development (single connection, no replicas). In production with read replicas, it manifests as intermittent "No query results for model" exceptions on after-commit jobs. The retry with short initial backoff (1 second) gives the replica time to catch up.

### Recommended Default
**Always add retry logic to after-commit jobs that read from the database.** The cost is minimal (`#[Tries(3)]`) and the benefit is avoiding intermittent production failures that are nearly impossible to reproduce locally.

### Risks Of Wrong Choice
- **No retry on after-commit job with replicas**: Intermittent failures in production. Jobs lost. Manual replay required.
- **Excessive retry (tries=20, long backoff)**: Worker occupied for minutes on a job that will never succeed (permanent failure). Use `maxExceptions` to cap.

### Related Rules
- Add Retry Logic to After-Commit Dispatched Jobs

---

## DT-AC-004: Should Multiple Side Effects Be Orchestrated by a Single Job or Dispatched Independently?

### Decision Context
A transaction may need to trigger multiple side effects: send email, update search index, sync to CRM, invalidate cache. These can be dispatched as independent jobs/callbacks or orchestrated by a single job. The choice affects ordering guarantees, failure handling, and debuggability.

### Decision Criteria
- Does the ordering of side effects matter?
- Can a partial failure (email sent but CRM sync failed) leave the system in an inconsistent state?
- Do the side effects share a correlation context (order ID, team ID)?
- Is there a single "success" or "failure" outcome that downstream systems need to know about?

### Decision Tree

```
Does the ordering of side effects matter?
├── YES → SINGLE ORCHESTRATION JOB. Dispatch one job that executes side effects in order.
├── NO → Can a partial failure leave the system inconsistent?
    ├── YES → SINGLE ORCHESTRATION JOB. The job can handle partial failures and retries atomically.
    ├── NO → Are the side effects truly independent (failure of one doesn't affect others)?
        ├── YES → INDEPENDENT DISPATCH is acceptable. Each side effect retries independently.
        └── NO → SINGLE ORCHESTRATION JOB. Safer default.
```

### Rationale
Multiple independent `DB::afterCommit()` callbacks have non-deterministic ordering and independent failure modes. If cache invalidation succeeds but CRM sync fails, the system is in a partially-consistent state with no orchestrated recovery. A single orchestration job can handle ordering, partial failures, and retries as a unit.

### Recommended Default
**When in doubt, use a single orchestration job.** The cost is one extra job class; the benefit is deterministic ordering, single failure point, and easier debugging.

### Risks Of Wrong Choice
- **Independent dispatch when ordering matters**: Non-deterministic side effect ordering. Debugging inconsistent state is difficult because the order changes between runs.
- **Single job when side effects are truly independent**: One slow side effect (CRM sync) blocks fast ones (cache flush). Consider independent dispatch for truly independent, latency-sensitive side effects.

### Related Rules
- Multiple Side Effects Should Be Orchestrated by a Single After-Commit Job
