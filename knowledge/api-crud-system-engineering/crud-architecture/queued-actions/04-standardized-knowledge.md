# ECC Standardized Knowledge — Queued Actions

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Queued Actions |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Queued actions are action classes that are dispatched to a Laravel queue for asynchronous execution. Instead of executing an action synchronously in the request lifecycle, the action is serialized as a job, pushed to a queue, and executed by a queue worker. This pattern is used for operations that don't need immediate completion — sending confirmation emails, generating reports, processing uploads, or performing batch operations. The key advantage is that the same action class can be executed synchronously (in tests or simple workflows) or asynchronously (in production for slow operations) — only the dispatch mechanism changes.

## Core Concepts

- **Action as Job**: An action can implement `ShouldQueue` and use the `Queueable` trait to make itself dispatchable. The same class works as an action and a job.
- **Serialization Strategy**: When dispatched, only the data properties (DTOs, IDs, scalars) are serialized. Constructor-injected services are NOT serialized — the container re-resolves them on the worker.
- **Sync vs Async Decision**: Queue operations that take >500ms, are not time-sensitive, or need retry capability. Execute synchronously when the result is needed for the response or the operation must be strongly consistent.
- **Failure Handling**: Implement `failed()` method for critical job failure notifications. Set `$tries` and `$backoff` for retry configuration.

## When To Use

- Slow operations that would delay the HTTP response (>500ms)
- Operations that can be retried independently without side effects
- Background tasks (email sending, report generation, file processing)
- Operations where eventual consistency is acceptable
- When the same action needs sync and async execution paths

## When NOT To Use

- Fast operations (<100ms) — queue overhead exceeds execution time
- Operations where the result is needed for the HTTP response
- Operations requiring strong consistency with the current request state
- Operations that modify state in ways that conflict with retry semantics

## Best Practices

- Only serialize DTOs, IDs, or scalars — never serialize services, repositories, or framework instances
- Implement `failed()` on critical jobs for alerting
- Set `$tries` and `$backoff` to prevent infinite retries
- Use `Queue::fake()` in tests to assert jobs are pushed with correct data
- Monitor queue length, failed jobs, and processing time in production

## Architecture Guidelines

- Queue actions that: take >500ms, are not time-sensitive, can be retried independently
- Execute synchronously when: result is needed for response, operation is fast (<100ms), strong consistency is required
- The action class pattern maps naturally to Laravel's queue system — an action implementing `ShouldQueue` remains a standard action class
- For sub-actions dispatched to a queue from a sync action, dispatch after the transaction commits to avoid dispatching jobs for rolled-back transactions

## Performance Considerations

- Queue dispatch adds ~1-5ms for serialization and push (Redis) or ~10-50ms (database queue)
- The HTTP response is sent immediately after dispatch — actual execution time is removed from the request lifecycle
- Failed job handling and retry infrastructure adds minimal overhead

## Security Considerations

- Queued actions operate with the permissions of the queue worker, not the original user — pass the authenticated user ID explicitly in the DTO for authorization checks
- Stale data: the action may query data that was modified between dispatch and execution — re-query data in the worker for critical decisions
- Sensitive data in serialized DTOs is stored in the queue — ensure queue connections are properly secured
- Transaction safety: dispatch after commit to prevent dispatching jobs for rolled-back operations

## Common Mistakes

- **Queuing Everything**: Adding queue infrastructure complexity and eventual consistency to operations that could be synchronous. Solution: Only queue actions >500ms or with retry requirements.
- **Serializing Non-Serializable Data**: Passing Eloquent models, closures, or resources to a queued action. Solution: Pass DTOs, IDs, or arrays — let the worker re-query the database.
- **Not Handling Failure**: Assuming queued actions always succeed. Solution: Implement `failed()` method for critical job failure notifications.
- **Dispatching Before Transaction Commit**: Job executes before the transaction commits, querying state that doesn't exist yet. Solution: Dispatch after the transaction commits.

## Anti-Patterns

- **Queue as Performance Crutch**: Queuing every action without measuring actual execution time. Adds complexity without measured benefit.
- **Eloquent Model in Queued Action**: Passing `User $user` to a queued action. The serialized model may be stale by the time the worker executes it.
- **Ignoring Retry Limits**: No `$tries` or `$backoff` configured — failed jobs retry indefinitely, consuming worker resources.

## Examples

### Action as Queued Job
```php
class SendWelcomeEmailAction implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private UserDto $user,
    ) {}

    public function handle(UserMailer $mailer): void
    {
        $mailer->sendWelcome($this->user);
    }

    public function failed(Throwable $e): void
    {
        Log::error('Welcome email failed', ['user_id' => $this->user->id]);
    }
}

// Dispatch
SendWelcomeEmailAction::dispatch($userDto);
```

### Sync Action Dispatching Queued Sub-Action
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        SendWelcomeEmailAction::dispatch(UserDto::fromModel($user));
        return $user;
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Action Class Design | Action structure for queuing | Prerequisite |
| Laravel Queues Fundamentals | Queue configuration and workers | Prerequisite |
| Transactional Actions | Sync vs async transactional decisions | Related |
| Action Composition | Composing queued and sync actions | Related |
| Horizon Configuration | Queue monitoring for queued actions | Follow-up |
| Job Batching | Batch multiple queued actions together | Follow-up |

## AI Agent Notes

- The action class pattern maps naturally to Laravel's queue system — implementing `ShouldQueue` is the only change needed
- An action that is sometimes sync and sometimes async should NOT implement `ShouldQueue`; instead, create a separate job class that wraps the action
- Only serialize data (DTOs, IDs), never services or framework instances
- When generating queued actions, always include `$tries`, `$backoff`, and `failed()` for production readiness
- Test with `Queue::fake()` to assert dispatch without executing the job

## Verification

- [ ] Queued action does not serialize services or framework instances
- [ ] `ShouldQueue` and `Queueable` are applied correctly
- [ ] Retry limits (`$tries`, `$backoff`) are configured
- [ ] `failed()` method is implemented for critical jobs
- [ ] Test uses `Queue::fake()` to assert dispatch
- [ ] Queue dispatch happens after transaction commit
- [ ] Queue connection is properly secured for sensitive data
