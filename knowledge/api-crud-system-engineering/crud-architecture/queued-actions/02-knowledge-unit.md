# Queued Actions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Queued Actions
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Queued actions are action classes that are dispatched to a Laravel queue for asynchronous execution. Instead of executing an action synchronously in the request lifecycle, the action is serialized as a job, pushed to a queue, and executed by a queue worker. This pattern is used for operations that don't need immediate completion — sending confirmation emails, generating reports, processing uploads, or performing batch operations.

The engineering significance is that queued actions preserve the action class pattern while enabling async execution. The same action class can be executed synchronously (in tests or simple workflows) or asynchronously (in production for slow operations). The action code doesn't change — only the dispatch mechanism changes.

---

## Core Concepts

### Dispatch Action to Queue

```php
class GenerateReportAction
{
    public function execute(GenerateReportDto $dto): void
    {
        $report = Report::createFromQuery($dto->criteria);
        Storage::put("reports/{$report->id}.csv", $report->toCsv());
        $this->notifyUser($report);
    }
}

// Dispatch to queue
dispatch(new ProcessReportJob($dto));
```

### Action as Job

An action can implement `ShouldQueue` to make itself dispatchable:

```php
class GenerateReportAction implements ShouldQueue
{
    use Queueable;

    public function execute(GenerateReportDto $dto): void
    {
        // Executed by queue worker
    }
}
```

```php
// Dispatch the action as a job
GenerateReportAction::dispatch($dto);
// Or
dispatch(new GenerateReportAction($dto));
```

---

## Mental Models

### The Mailbox

A queued action is like putting a letter in a mailbox. You drop it off (dispatch) and trust it will be delivered and processed (by a queue worker). You don't wait for the recipient to read it.

### The Fire and Forget

Queued actions are "fire and forget" — you fire the action and immediately return to the caller. The action processes in the background.

---

## Internal Mechanics

### Serialization of Actions

When dispatched, the action class is serialized (via `__serialize()` / `__unserialize()`). Only the properties that carry job data are serialized — constructor-injected services are NOT serialized because the container re-resolves them on the worker:

```php
class ProcessOrderAction implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private OrderDto $dto,         // Serialized — carries job data
        private ?InvoiceService $invoices = null,  // NOT serialized — re-resolved
    ) {}
}
```

The container re-injects dependencies when the worker runs the job.

### Queue Connection Configuration

Queued actions use the default Laravel queue configuration. The connection (database, redis, SQS) determines throughput and reliability.

---

## Patterns

### Action as Job Class

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
}

// Dispatch
SendWelcomeEmailAction::dispatch($userDto);
```

### Action Dispatching a Sub-Action to Queue

```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        // Sub-action dispatched to queue — not executed synchronously
        SendWelcomeEmailAction::dispatch(UserDto::fromModel($user));
        return $user;
    }
}
```

### Queue with Delay

```php
class SendFollowUpEmailAction implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private UserDto $user,
    ) {
        $this->delay(now()->addDays(3));
    }

    public function handle(Mailer $mailer): void
    {
        $mailer->sendFollowUp($this->user->email);
    }
}
```

---

## Architectural Decisions

### What to Queue vs Execute Synchronously

Queue operations that: take >500ms, are not time-sensitive, or can be retried independently. Execute synchronously when the result is needed for the response, the operation is fast (<100ms), or the operation must be strongly consistent with the request.

### Action Serialization Strategy

Only serialize the data the action needs (DTOs, IDs, scalars). Never serialize services, repositories, or framework instances — let the container re-resolve them on the worker.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast HTTP response — slow work goes to background | Queue infrastructure required (Redis, SQS, DB) | Additional operational complexity |
| Retry on failure — failed jobs retry automatically | Eventual consistency — queued work may not be visible immediately | Design for eventual consistency |
| Same action class for sync and async | Serialization constraints — no closures, no resources | Ensure all job data is serializable |

---

## Performance Considerations

Queue dispatch adds ~1-5ms for serialization and push (Redis) or ~10-50ms (database queue). The HTTP response is sent immediately after dispatch — the actual action execution time is removed from the request lifecycle.

---

## Production Considerations

### Queue Worker Monitoring

Monitor queue worker health — failed jobs, queue length, processing time. Use Laravel Horizon (Redis) or Laravel Pulse for visibility.

### Failed Job Handling

Failed jobs go to the `failed_jobs` table. Set up retry limits and failure notifications:

```php
class ProcessPaymentAction implements ShouldQueue
{
    public int $tries = 3;
    public int $backoff = 60; // seconds between retries

    public function failed(Throwable $e): void
    {
        Log::error('Payment processing failed after 3 retries', [
            'order_id' => $this->dto->orderId,
        ]);
    }
}
```

### Testing Queued Actions

```php
public function test_welcome_email_is_queued_after_registration()
{
    Queue::fake();

    $action = new CreateUserAction(...);
    $action->execute($dto);

    Queue::assertPushed(SendWelcomeEmailAction::class, function ($job) use ($user) {
        return $job->user->email === 'test@test.com';
    });
}
```

---

## Common Mistakes

### Queuing Everything
Why it happens: Queueing every action "for performance" without measuring actual execution time. Why it's harmful: Adds queue infrastructure complexity and eventual consistency to operations that could be synchronous. Better approach: Only queue actions that take >500ms or have retry requirements.

### Serializing Non-Serializable Data
Why it happens: Passing Eloquent models, closures, or resources to a queued action. Why it's harmful: Queue worker crashes with serialization errors. Better approach: Pass DTOs, IDs, or arrays — let the worker re-query the database.

### Not Handling Failure
Why it happens: Assuming queued actions always succeed. Why it's harmful: Failed jobs accumulate in the failed_jobs table with no notification. Better approach: Implement `failed()` method for critical job failure notifications.

---

## Failure Modes

### Queue Backlog
More jobs pushed than workers can process. Queue length grows unbounded. Mitigate: Monitor queue length, auto-scale workers, set job expiration (`retryUntil`).

### Stale Data on Worker
The action queries data that was modified between dispatch and execution. The worker operates on stale state. Mitigate: Re-query data in the worker, don't trust serialized state for critical decisions.

---

## Ecosystem Usage

### Laravel Cashier
Cashier queues subscription operations — invoice generation, payment processing, and webhook handling are dispatched to the queue.

### Laravel Horizon
Horizon itself uses queued actions for batch processing and metric aggregation.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — Action structure for queuing
- Laravel Queues Fundamentals — Queue configuration and workers

### Related Topics
- Transactional Actions — Sync vs async transactional decisions
- Action Composition — Composing queued and sync actions

### Advanced Follow-up Topics
- Horizon Configuration — Queue monitoring for queued actions
- Job Batching — Batch multiple queued actions together

---

## Research Notes

### Source Analysis
- Laravel Queue documentation: https://laravel.com/docs/queues
- Laravel Horizon: Queue monitoring and management
- Production pattern: Queue-heavy applications use actions as jobs for consistency

### Key Insight
The action class pattern maps naturally to Laravel's queue system. An action that implements `ShouldQueue` remains a standard action class — the only change is the dispatch mechanism. This minimizes the cognitive overhead of introducing async execution into an action-based architecture.

### Version-Specific Notes
- Laravel 10+: `ShouldQueue` on action classes with auto-resolution
- Laravel 11+: Queue configuration simplified in bootstrap file
- PHP 8.1+: Constructor promotion aligns with job serialization patterns
