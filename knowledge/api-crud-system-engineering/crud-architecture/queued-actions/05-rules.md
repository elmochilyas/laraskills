# Queued Actions — Rules

## Rule 1: Only Serialize Data — Never Services or Framework Instances
---
## Category
Reliability
---
## Rule
Never pass Eloquent models, services, closures, or framework instances to a queued action; only pass DTOs, IDs, or scalar values.
---
## Reason
Queued actions are serialized to the queue and unserialized by a different process. Services and framework instances cannot be serialized — they cause `MaxAttemptsExceededException` or silently fail. Models passed to queues become stale by execution time.
---
## Bad Example
```php
class SendWelcomeEmailAction implements ShouldQueue
{
    public function __construct(
        private User $user, // ❌ Model — stale by execution time, may not serialize
        private MailService $mailer, // ❌ Service — won't serialize
    ) {}
}
```
---
## Good Example
```php
class SendWelcomeEmailAction implements ShouldQueue
{
    public function __construct(
        private UserDto $user, // ✅ DTO — serializable, immutable
    ) {}

    public function handle(MailService $mailer): void
    {
        $mailer->sendWelcome($this->user); // Service resolved fresh on worker
    }
}
```
---
## Exceptions
No common exceptions. Only data objects should be serialized.
---
## Consequences Of Violation
Job failures, stale data processing, untraceable serialization errors.
</rule>

## Rule 2: Always Configure Retry Limits and Failure Handling
---
## Category
Reliability
---
## Rule
Always set `$tries` and `$backoff` on queued actions and implement the `failed()` method for alerting on critical failures.
---
## Reason
Without retry limits, failed jobs retry indefinitely, consuming worker resources and masking the failure. Without `failed()`, critical job failures go undetected until a user reports the issue.
---
## Bad Example
```php
class ProcessPaymentAction implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        // ❌ No retry limits — infinite retries on failure
        // ❌ No failed() — silent failure
    }
}
```
---
## Good Example
```php
class ProcessPaymentAction implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public array $backoff = [5, 30, 120];

    public function handle(PaymentProcessor $processor): void
    {
        $processor->charge($this->paymentDto);
    }

    public function failed(Throwable $e): void
    {
        Log::critical('Payment processing failed after 3 attempts', [
            'payment_id' => $this->paymentDto->id,
            'error' => $e->getMessage(),
        ]);
        $this->notifyAdmin->execute($this->paymentDto);
    }
}
```
---
## Exceptions
Idempotent, non-critical jobs (cache warming, log cleanup) may omit `failed()` but must still set `$tries`.
---
## Consequences Of Violation
Infinite retry loops exhausting workers, undetected production failures, no audit trail for failed operations.
</rule>

## Rule 3: Dispatch After Transaction Commit
---
## Category
Reliability
---
## Rule
Never dispatch queued actions inside a database transaction; always dispatch after the transaction commits.
---
## Reason
A job dispatched inside a transaction may execute before the transaction commits. The worker queries data that doesn't exist yet (read-uncommitted) or the job runs after the transaction rolls back, processing phantom data.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            SendWelcomeEmailAction::dispatch($dto); // ❌ Dispatched before commit
            return $user;
        });
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        SendWelcomeEmailAction::dispatch(UserDto::fromModel($user)); // ✅ After commit
        return $user;
    }
}
```
---
## Exceptions
Use `DB::afterCommit()` callback if the dispatch must be guaranteed — it runs the dispatch only if the transaction commits.
---
## Consequences Of Violation
Jobs that process data that doesn't exist, phantom jobs from rolled-back transactions, data inconsistency.
</rule>

## Rule 4: Only Queue Operations That Take >500ms
---
## Category
Performance
---
## Rule
Never queue operations that execute in under 100ms; only queue operations that take >500ms or have explicit retry/reliability requirements.
---
## Reason
Queue dispatch adds 1-50ms overhead. Queuing fast operations adds latency without benefit. The queue infrastructure (Redis, database, workers) has operational costs — only justify it for operations that measurably benefit.
---
## Bad Example
```php
class LogUserLoginAction implements ShouldQueue // ❌ ~5ms operation queued
{
    public function handle(): void
    {
        Log::info("User {$this->userId} logged in");
    }
}
```
---
## Good Example
```php
class LogUserLoginAction
{
    public function execute(int $userId): void
    {
        Log::info("User {$userId} logged in"); // ✅ Sync — trivial operation
    }
}

class GenerateMonthlyReportAction implements ShouldQueue // ✅ >500ms — justified
{
    public function handle(ReportGenerator $generator): void
    {
        $generator->generate(); // Takes 30 seconds
    }
}
```
---
## Exceptions
Operations that must be retried on failure (payment webhooks, third-party API calls) may be queued regardless of duration.
---
## Consequences Of Violation
Unnecessary queue infrastructure complexity, eventual consistency where not needed, slower total response time due to dispatch overhead.
</rule>

## Rule 5: Test with Queue::Fake() to Assert Dispatch
---
## Category
Testing
---
## Rule
Always use `Queue::fake()` in tests to assert that queued actions were dispatched with the correct data, without executing them.
---
## Reason
Executing queued actions in tests adds complexity (workers, serialization). Faking the queue lets you verify dispatch behavior in milliseconds while testing the job's logic separately.
---
## Bad Example
```php
public function test_user_registration_sends_email(): void
{
    $this->postJson('/api/users', $payload);
    // ❌ No assertion that the job was dispatched
    // Actual execution may happen or not — test doesn't verify
}
```
---
## Good Example
```php
public function test_user_registration_sends_email(): void
{
    Queue::fake();

    $this->dto = new CreateUserDto(name: 'John', email: 'john@test.com');
    $this->createUserAction->execute($this->dto);

    Queue::assertPushed(SendWelcomeEmailAction::class, function ($job) {
        return $job->user->email === 'john@test.com';
    });
}
```
---
## Exceptions
Integration tests for the queue worker itself may execute jobs, but unit tests should always fake the queue.
---
## Consequences Of Violation
Slow tests, unverified dispatch behavior, jobs may not be dispatched in production despite passing tests.
</rule>
