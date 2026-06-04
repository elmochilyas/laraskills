# Anti-Patterns — Queued Actions

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Queued Actions |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Queue as Performance Crutch | Medium | High | Code review: queuing happens without execution time measurement |
| Eloquent Model in Queued Action | High | High | Code review: queued action receives Eloquent models in constructor |
| Ignoring Retry Limits | High | Medium | Code review: queued action has no `$tries` or `$backoff` configured |
| Dispatching Before Transaction Commit | High | Medium | Code review: job dispatched inside a transaction block |
| Not Handling Failure | Medium | Medium | Code review: queued action has no `failed()` method |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Serializing Non-Serializable Data | Passing closures, resources, or services to queued actions | Serialization failures at dispatch time, runtime errors on the queue worker |
| Queuing Fast Operations | Dispatching actions to the queue that complete in <100ms | Queue infrastructure overhead exceeds execution time savings |
| No Queue Configuration | Using default queue settings without considering connection, timeout, or retries | Production failures due to default limits that are too low |

---

## Anti-Pattern Details

### AP-QA-01: Queue as Performance Crutch

**Description**: Every operation that feels "slow" is queued without measuring actual execution time. Operations that take 50-100ms are dispatched to the queue because "it might be slow." The queue infrastructure complexity (workers, failed jobs, monitoring, eventual consistency) is added without measured justification.

**Root Cause**: Aversion to performance optimization. Instead of profiling the operation and optimizing the bottleneck (database query, external API call), the developer queues everything. The actual bottleneck remains but is now also harder to debug.

**Impact**:
- Queue infrastructure overhead exceeds execution time for fast operations
- Eventual consistency is introduced unnecessarily (users see stale data)
- Failed job monitoring becomes noisy with non-critical operations
- Debugging becomes harder: execution happens on workers, not in the request

**Detection**:
- Code review: operations with measured execution <100ms are queued
- Metrics: average queue job execution time is less than queue overhead
- Code review: queued action does one simple database write with no side effects

**Solution**:
- Measure execution time before queuing. Only queue operations >500ms.
- Optimize the actual bottleneck (database query, N+1, external API) before adding queue complexity
- Keep operations synchronous when the result is needed for the response
- Document the performance threshold: "queue only when execution exceeds 500ms"

**Example**:
```php
// BEFORE: Queuing without measurement
class UpdateUserProfileAction implements ShouldQueue // ❌ queued without justification
{
    public function handle(): void
    {
        User::where('id', $this->userId)->update($this->data);
    }
}
// A simple update query (<10ms) queued

// AFTER: Sync execution (measure first)
class UpdateUserProfileAction
{
    public function execute(UpdateProfileDto $dto): User
    {
        $user = User::findOrFail($dto->userId);
        $user->update($dto->toArray());
        return $user;
    }
}
// Only queue if profiling shows >500ms
```

---

### AP-QA-02: Eloquent Model in Queued Action

**Description**: An Eloquent model instance is passed as a constructor parameter to a queued action. When the job is serialized for the queue, the entire model (including relationships, attributes, and framework-specific data) is serialized. By the time the worker executes the job, the serialized model is stale — another request may have updated the record.

**Root Cause**: Convenience. Passing `$user` (an Eloquent model) is simpler than passing `$userId` and re-querying. The developer doesn't consider serialization cost or data freshness.

**Impact**:
- Large serialized payloads (a model with all relationships is megabytes)
- Workers operate on stale data (model was serialized minutes ago)
- Serialization failures for models with non-serializable attributes (files, closures)
- Memory pressure on the queue driver (Redis, database) from large payloads

**Detection**:
- Code review: queued action constructor accepts Eloquent model type hints
- Queue monitoring: large job payload sizes in the queue dashboard
- Bug reports: "the email was sent to the old email address" (stale data)

**Solution**:
- Pass only the model ID (or a DTO with IDs) to the queued action
- Let the worker re-query the model from the database
- The worker always operates on the current state of the data

**Example**:
```php
// BEFORE: Eloquent model in queued action
class SendWelcomeEmailAction implements ShouldQueue
{
    public function __construct(
        public User $user, // ❌ entire model serialized
    ) {}

    public function handle(): void
    {
        // $this->user might be minutes stale
        Mail::to($this->user)->send(new WelcomeMail($this->user));
    }
}

// AFTER: ID only, re-query on worker
class SendWelcomeEmailAction implements ShouldQueue
{
    public function __construct(
        public int $userId, // ✅ just the ID
    ) {}

    public function handle(): void
    {
        $user = User::findOrFail($this->userId); // fresh data
        Mail::to($user)->send(new WelcomeMail($user));
    }
}
```

---

### AP-QA-03: Dispatching Before Transaction Commit

**Description**: A queued action is dispatched inside a database transaction block. The job worker picks up the job and tries to query data that hasn't been committed yet (or worse, the transaction rolls back and the job operates on non-existent data).

**Root Cause**: The developer doesn't consider the timing of dispatch vs. commit. The job is dispatched immediately after the write operation, inside the `DB::transaction()` closure.

**Impact**:
- Job worker queries data that doesn't exist yet (transaction not committed)
- If the transaction rolls back, the job operates on rolled-back data or fails
- Idempotent operations may create duplicate records
- Debugging is confusing: "the record exists when I look, but the job says it doesn't"

**Detection**:
- Code review: `dispatch()` or `::dispatch()` call inside a `DB::transaction()` closure
- Bug reports: intermittent failures where the job can't find a record that exists
- Queue monitoring: jobs fail with "ModelNotFoundException" on recently created records

**Solution**:
- Move dispatch calls to AFTER the transaction commits
- Use `DB::afterCommit()` callback to dispatch after the transaction succeeds
- Or dispatch in the controller after the action/service returns

**Example**:
```php
// BEFORE: Dispatch inside transaction
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            SendWelcomeEmailAction::dispatch($user->id); // ❌ before commit
            return $user;
        });
    }
}

// AFTER: Dispatch after transaction commits
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        SendWelcomeEmailAction::dispatch($user->id); // ✅ after commit
        return $user;
    }
}
```
