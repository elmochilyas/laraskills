# Skill: Make an Action Queueable with Spatie QueueableAction

## Purpose

Add Spatie's `QueueableAction` trait to an existing action class so it can be dispatched to a queue worker without creating a separate job class, while preserving full constructor dependency injection.

## When To Use

- An action performs expensive or time-consuming work (PDF generation, email sending, report compilation) that should not block the HTTP response.
- An action's result is not needed by the caller — it produces side effects only.
- The team queues 5+ actions and wants to eliminate job wrapper classes.
- The action currently has a job class that only calls the action — eliminate the indirection.

## When NOT To Use

- The action's caller depends on a return value — `onQueue()->execute()` returns immediately without the action's result.
- The action's method parameters are non-serializable (resources, closures, deeply nested objects without `SerializesModels`).
- The team queues very few actions (1-2) — a manual job wrapper is simpler and avoids a package dependency.
- The action is bound as a singleton — queueable actions must be transient.
- The action has mutable properties set during execution — state leaks across dispatches.

## Prerequisites

- Spatie's `laravel-queueable-action` package installed (`composer require spatie/laravel-queueable-action`).
- An existing action class with a single public method and constructor dependency injection.
- Understanding of the serialization boundary: constructor = dependencies (never serialized), method = operational data (serialized).

## Inputs

- The action class file.
- The method name used by the action (`handle()`, `execute()`, or `__invoke()`).
- The target queue name (e.g., `'emails'`, `'pdfs'`, or default).
- Knowledge of whether the action is called inside or outside database transactions.

## Workflow

1. **Add the trait.** Add `use QueueableAction;` inside the action class. Do NOT implement `ShouldQueue` — the trait handles queue dispatch through its own `ActionJob` mechanism.

2. **Choose the method name.** Decide whether the action uses `execute()` (auto-detected by the trait) or `handle()` (requires override). If using `execute()`, no additional changes are needed. If using `handle()`, add:
   ```php
   public function queueMethod(): string
   {
       return 'handle';
   }
   ```

3. **Configure the queue (optional).** If the action always routes to a specific queue, declare the queue name on the action:
   ```php
   public string $queue = 'pdfs';
   ```
   For context-dependent queues, the caller uses the fluent API (`$action->onQueue('tenant-42')->execute($data)`).

4. **Configure retries and timeout (optional).** Add configurable properties:
   ```php
   public int $tries = 3;
   public int $timeout = 120;
   public int $maxExceptions = 3;
   public int $backoff = 5; // seconds between retries
   ```

5. **Ensure method parameters are serializable.** Replace any non-serializable parameters (resources, closures) with serializable alternatives (IDs, arrays, DTOs). Eloquent models are serializable (they include `SerializesModels`).

6. **Move side effects outside the transaction.** If the action is called inside a `DB::transaction()`, ensure it uses `DB::afterCommit()` for any queued dispatch — or dispatch the action itself via `afterCommit` to prevent dispatching before the transaction commits.

7. **Verify no singleton binding.** Check service providers for `$this->app->singleton(ActionName::class)`. Remove any singleton binding — the action must be transient.

8. **Update callers to use fluent API.** The existing `$action->execute($data)` still works synchronously. For async execution, callers use:
   ```php
   $this->generatePdfAction
       ->onQueue('pdfs')
       ->onConnection('redis')
       ->delay(now()->addMinutes(5))
       ->execute($contract);
   ```

9. **Configure queue monitoring.** Update queue monitoring (Horizon, Pulse, or custom) to log the action class name from `ActionJob::$actionClass`. Without this, all queued actions appear as "ActionJob" in monitoring tools.

10. **Write tests.** Use `QueueableActionFake` to intercept dispatches and verify the correct action was queued with the correct parameters.

## Validation Checklist

- [ ] `use QueueableAction;` added to the action class
- [ ] `queueMethod()` is overridden if using `handle()` (not `execute()`)
- [ ] `public string $queue` declared if the action routes to a specific queue
- [ ] All method parameters are serializable (no resources, closures)
- [ ] Action is NOT bound as a singleton
- [ ] Action is stateless (no mutable properties set during execution)
- [ ] Callers can choose sync (`->execute()`) or async (`->onQueue()->execute()`)
- [ ] Queue monitoring is configured to log the action class name
- [ ] Tests use `QueueableActionFake` for dispatch verification

## Common Failures

- **Using `handle()` without overriding `queueMethod()`.** The trait auto-detects `__invoke()` then `execute()`, falling back to `queueMethod()`. If none match, the worker tries to call `execute()` — which does not exist. Error surfaces on the worker, not at dispatch.
- **Hardcoding dispatch inside the action.** `$this->dispatch(function () { ... })` forces async on all callers. The caller should decide sync vs async. Never hardcode dispatch logic inside the action.
- **Passing non-serializable parameters.** Resources, closures, and nested objects without `SerializesModels` cause serialization errors at dispatch time. The job is never queued.
- **Binding as singleton.** Dispatching a singleton action can cause cross-request contamination if the action has mutable properties.
- **Testing dispatch by asserting on database changes.** Without a queue worker, the dispatched action was never processed. Use `QueueableActionFake` to intercept and assert on the dispatch itself.
- **Dispatching inside `DB::transaction()` without `afterCommit`.** The job is dispatched before the transaction commits. If the transaction rolls back, the job was already dispatched for an operation that failed.

## Decision Points

- **`onQueue()` vs class-level `$queue`:** Use class-level `$queue` for actions that always route to the same queue (e.g., `GeneratePdfAction` → `'pdfs'`). Use the fluent API for context-dependent routing (e.g., per-tenant queues). Do NOT mix both for the same action.
- **Timeouts and retries:** Set `$timeout` based on the action's expected execution time. Set `$tries` based on idempotency — retryable actions can have more retries. Non-idempotent actions should have fewer retries or use a failure handler.

## Performance Considerations

- Each `onQueue()->execute()` incurs ~0.2-0.5ms overhead for container resolution, anonymous class creation, ActionJob serialization, and queue dispatch.
- On the worker, deserialization and action re-resolution add the same cost as synchronous resolution.
- Large payloads (deeply nested models, large arrays) increase serialization time and memory usage. Redis queues have a 512MB default payload limit.

## Security Considerations

- Authorization checks must happen at execution time on the worker, not just at dispatch time. The worker runs in a different process — the caller's authenticated user may not be the same context. For sensitive operations, re-check authorization on the worker.
- If the action uses the `SerializesModels` trait for Eloquent models, the worker re-retrieves the model from the database — it reflects the current state, not the state at dispatch time. This can lead to time-of-check/time-of-use issues.

## Related Rules

- Rule: Let the Caller Decide Sync vs Async Execution (queued-actions/05-rules.md)
- Rule: Override `queueMethod()` When Using Non-Standard Method Names (queued-actions/05-rules.md)
- Rule: Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API (queued-actions/05-rules.md)
- Rule: Log the Action Class Name in Queue Monitoring (queued-actions/05-rules.md)
- Rule: Drain Queues Before Deploying Incompatible Action Changes (queued-actions/05-rules.md)
- Rule: Do Not Use Queueable Actions for Operations That Must Return a Result (queued-actions/05-rules.md)
- Rule: Do Not Bind Queueable Actions as Singletons (queued-actions/05-rules.md)
- Rule: Do Not Pass Non-Serializable Parameters to Queued Action Methods (queued-actions/05-rules.md)

## Related Skills

- Test a Queued Action with QueueableActionFake (queued-actions/06-skills.md)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Drain Queues Before Deploying Incompatible Action Changes (queued-actions/06-skills.md)

## Success Criteria

- The action can be dispatched synchronously (`$action->execute($data)`) or asynchronously (`$action->onQueue()->execute($data)`) from any call site.
- The queue worker resolves the action with full constructor DI — no dependency is missing on the worker.
- Queue monitoring shows the action class name, not just "ActionJob."
- The action's constructor remains purely for service dependencies — no serialization concerns leak into constructor parameters.

---

# Skill: Drain Queues Before Deploying Incompatible Action Changes

## Purpose

Prevent queue worker failures when deploying changes that rename, remove, or alter the method signature of a queued action class.

## When To Use

- Renaming a queued action class.
- Changing a queued action's method signature (adding required parameters, removing parameters, changing parameter types).
- Removing a queued action class entirely.
- Deleploying any change that would cause a pending serialized job to fail on the worker.

## When NOT To Use

- Adding a new method or class (purely additive — no existing jobs reference the old class).
- Adding optional parameters with default values (backward-compatible).
- Changing internal implementation without changing the public method signature.
- The queue is empty (no pending jobs for the affected action).

## Prerequisites

- Access to the queue worker management commands (Horizon, `queue:work`, or supervisor).
- Knowledge of which queued actions are affected by the change.
- A maintenance window or low-traffic period (draining queues may take time).

## Inputs

- The list of renamed, removed, or signature-changed action classes.
- The current queue driver (Redis, database, SQS).
- The queue names that contain pending jobs for the affected actions.

## Workflow

1. **Identify affected actions.** List all action classes that are being renamed, removed, or whose method signature is changing. Include actions that are referenced directly, as well as actions that are NOT renamed but whose parameter types changed.

2. **Check for backward compatibility.** If the change is purely additive (new method, new optional parameter with default value), queue draining is unnecessary. Only non-backward-compatible changes require draining.

3. **Pause queue workers.** Prevent workers from picking up new jobs while you drain.
   ```bash
   php artisan horizon:pause
   # Or for queue:work workers:
   # supervisorctl stop laravel-worker:*
   ```

4. **Wait for in-flight jobs to complete.** Monitor the queue to ensure currently processing jobs finish. Do not force-kill workers during job execution.
   ```bash
   php artisan horizon:status
   # Or check supervisor status
   ```

5. **Clear pending jobs for the affected action.** If the queue has pending jobs referencing the old action class, clear them. For Redis queues, use `queue:clear`:
   ```bash
   php artisan queue:clear --queue=pdfs
   ```
   For targeted clearing, use Laravel Horizon's job purging or directly delete keys from Redis.

6. **Verify the queue is empty.** Check that no pending jobs reference the old action class. Use queue monitoring tools or directly inspect the queue:
   ```bash
   php artisan queue:size pdfs
   ```

7. **Deploy the change.** Deploy the code that renames, removes, or changes the action's method signature.

8. **Restart queue workers.** Resume queue processing.
   ```bash
   php artisan horizon:continue
   # Or: supervisorctl start laravel-worker:*
   ```

9. **Monitor for failures.** Watch queue monitoring dashboards for the first hour after deployment. Check `failed_jobs` table for any jobs that reference old class names or signatures.

## Validation Checklist

- [ ] All affected action classes are identified (not just renamed ones, but also signature-changed ones)
- [ ] Backward compatibility is checked (additive changes skip draining)
- [ ] Queue workers are paused before draining
- [ ] In-flight jobs are allowed to complete
- [ ] Pending jobs referencing old action classes are cleared
- [ ] Queue is verified empty before deployment
- [ ] Change is deployed after draining
- [ ] Queue workers are restarted after deployment
- [ ] `failed_jobs` table is monitored for 1 hour post-deployment

## Common Failures

- **Not pausing workers before draining.** A worker picks up a pending job while you are still clearing the queue, and the job fails because the old action class no longer exists.
- **Only checking the default queue.** Pending jobs for the affected action may be on `pdfs`, `emails`, or custom queue names. Check every queue the action dispatches to.
- **Assuming additive changes are safe when they are not.** Adding a required parameter to a method signature is NOT backward-compatible — existing serialized jobs call the old signature without the new parameter.
- **Draining not coordinated with the deployment pipeline.** The drain happens but the deployment is rolled back, leaving an empty queue and no ability to reprocess the cleared jobs. Coordinate with the deployment pipeline.
- **Not monitoring after deployment.** A few pending jobs that were missed during draining fail on the worker and fill `failed_jobs` silently.

## Decision Points

- **Clear vs reprocess:** If the old action's behavior is acceptable but the class has been renamed, consider keeping the old class as an alias (not recommended — creates technical debt). Otherwise, clear the jobs and accept the data loss, or reprocess them with the updated logic manually.
- **Backward-compatible rename:** If renaming an action, keep the old class name as a deprecated alias that delegates to the new class. This allows pending jobs to complete without draining. Remove the alias in the next deployment after the queue is empty.

## Performance Considerations

- Draining a queue with thousands of pending jobs can take minutes to hours depending on queue throughput.
- For high-throughput queues, consider a rolling drain strategy rather than pausing all workers.

## Security Considerations

- Jobs that are cleared are permanently lost. If the operation is critical (financial transactions, data mutations), ensure the cleared jobs are logged with enough context to manually re-process them.

## Related Rules

- Rule: Drain Queues Before Deploying Incompatible Action Changes (queued-actions/05-rules.md)

## Related Skills

- Make an Action Queueable with Spatie QueueableAction (queued-actions/06-skills.md)

## Success Criteria

- Zero queue worker failures after deploying incompatible action changes.
- The `failed_jobs` table has no entries referencing old class names or signatures.
- Queue monitoring shows the new action class names processing successfully.
- If jobs were cleared, the data loss was documented and accepted (or reprocessed manually).
