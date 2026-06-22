# Skill: Applying After-Commit Events, Jobs & Side Effects

## Purpose
Correctly defer external side effects (emails, queued jobs, external API calls, cache invalidation) until after the database transaction commits, while preserving atomicity guarantees and implementing compensating actions for external call failures.

## When To Use
- Writing billing or subscription code that calls Stripe inside a transaction boundary
- Dispatching queued jobs that read database state written inside a transaction
- Sending notifications or emails triggered by persisted state changes
- Building team creation, ownership transfer, invitation acceptance, or entitlement update flows
- Implementing webhook processors that persist raw payloads then dispatch processing jobs
- Any SaaS flow where local DB state and external system state must stay consistent

## When NOT To Use
- Pure read-only operations with no side effects
- Synchronous in-process computations that do not touch external systems
- Side effects that must be atomic with the transaction and have a compensating action designed for rollback
- Non-database workflows where no transaction boundary exists

## Prerequisites
- Understanding of Laravel `DB::transaction()` and nested transactions (savepoints)
- Familiarity with `dispatchAfterCommit()`, `event(...)->afterCommit()`, and `DB::afterCommit()`
- Knowledge of queue retry configuration (`#[Tries]`, `#[Backoff]`)
- Understanding of `SerializesModels` and why IDs are preferred over full models in job payloads

## Inputs
- The business operation being implemented (e.g., create team, upgrade subscription, accept invitation)
- The list of side effects the operation triggers (email, Stripe API call, cache flush, search index update)
- Whether each side effect is external (needs after-commit) or internal (can stay in transaction)
- The transaction nesting level and whether the code may be called from within an outer transaction

## Workflow
1. **Classify each side effect** — Is it external (email, Stripe, HTTP, webhook) or internal (audit row in same DB)? External side effects need after-commit; internal side effects can stay in the transaction.
2. **Wrap multi-step local state changes in `DB::transaction()`** — Team creation + owner membership, subscription update + invoice creation, role change + permission cache invalidation row.
3. **Dispatch jobs with `->afterCommit()`** — Any queued job that reads database state written in the transaction must be dispatched with `->afterCommit()` to avoid the job executing before the commit is visible.
4. **Dispatch events with `->afterCommit()`** — Events that trigger queued listeners must use `->afterCommit()`. Synchronous listeners still execute immediately; use `DB::afterCommit()` if synchronous listeners also need to wait.
5. **Add retry logic to after-commit jobs** — The race condition gap (commit not yet visible to the job's connection) means the first attempt may fail. Configure `#[Tries(5)]` and `#[Backoff]`.
6. **Design compensating actions for external API failures** — If the after-commit Stripe call fails, update local state to reflect the failure (mark subscription as `failed`) so operators can investigate.
7. **Orchestrate multiple side effects with a single job** — When a transaction triggers email + analytics + search index + cache flush, dispatch one orchestration job after commit rather than multiple independent callbacks.
8. **Test the race condition gap** — Write tests that verify the job can handle a brief visibility delay (retry logic) and that compensating actions fire on external failures.

## Validation Checklist
- [ ] All external side effects are dispatched after commit, not inside the transaction
- [ ] Queued jobs that depend on transaction data use `->afterCommit()` or `dispatchAfterCommit()`
- [ ] Events that trigger queued listeners use `->afterCommit()` when dispatched inside a transaction
- [ ] After-commit jobs have retry logic (`#[Tries]`, `#[Backoff]`)
- [ ] Compensating actions exist for after-commit external API call failures
- [ ] No fire-and-forget side effects (mail, Stripe, HTTP) inside `DB::transaction()` blocks
- [ ] Multiple side effects are orchestrated by a single after-commit job where ordering matters
- [ ] Cache invalidation is deferred to after-commit or uses tags flushed after commit

## Common Failures
- Dispatching a job inside a transaction without `afterCommit()`, causing "record not found" when the worker picks it up before commit
- Sending email inside a transaction that rolls back — the customer receives a confirmation for an order that doesn't exist
- Calling Stripe inside a transaction — the charge survives even if the DB record rolls back
- No compensating action when the after-commit Stripe call fails — local state says "active" but Stripe has no subscription
- Assuming `event(...)->afterCommit()` affects synchronous listeners — it only defers queued listeners

## Decision Points
- **Is the side effect external or internal?** — External needs after-commit; internal can stay in transaction
- **Does the job read database state written in the transaction?** — If yes, `afterCommit()` is required
- **Are there multiple side effects that need deterministic ordering?** — Use a single orchestration job
- **Can the external call fail independently?** — Design a compensating action before writing the code

## Performance Considerations
- After-commit dispatching adds negligible overhead — it's a lightweight callback registration
- The real performance concern is the race condition gap: jobs retrying because committed state isn't visible yet. Mitigate with short initial delays rather than aggressive backoff
- `DB::afterCommit()` callbacks should be lightweight; heavy work belongs in a queued job

## Security Considerations
- Do not store sensitive data in serialized job payloads — use `SerializesModels` to store only the model ID
- After-commit external API calls must carry the same auth context (user identity, tenant scope) as the original request
- Rate-limit after-commit external calls the same way as synchronous calls — after-commit does not bypass rate limits

## Related Rules (from 05-rules.md)
- Defer External Side Effects Until After the Transaction Commits
- Add Retry Logic to After-Commit Dispatched Jobs
- External API Calls Must Have Compensating Actions
- Multiple Side Effects Should Be Orchestrated by a Single After-Commit Job

## Related Skills
- Webhook queue design (persist payload before dispatching processing job)
- Queue deployment safety (worker lifecycle during deploys)
- Billing queue topology (separating side-effect jobs by concern)

## Success Criteria
- No external side effect executes inside an uncommitted transaction
- After-commit jobs survive the race condition gap via retry logic
- External API failures leave the local database in a diagnosable state via compensating actions
- Multiple side effects execute in deterministic order via a single orchestration job
