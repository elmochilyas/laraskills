# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Laravel Fakes
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel built-in fakes (Bus, Event, Http, Mail, Notification, Queue, Storage) provide working in-memory implementations of framework services that record calls for later assertion. They replace real service interactions (HTTP calls, email sending, queue dispatching) with zero-side-effect alternatives. Fakes are preferred over mocks for Laravel applications because they provide more realistic behavior, require less setup, and are less brittle. The Laravel ecosystem convention is: "prefer fakes over mocks."

# Core Concepts
- **`Bus::fake()`**: Fakes the command bus. Records dispatched commands/jobs. Assert with `assertDispatched()`, `assertNotDispatched()`.
- **`Event::fake()`**: Fakes the event dispatcher. Records dispatched events. Assert with `assertDispatched()`, `assertListening()`.
- **`Http::fake()`**: Fakes the HTTP client. Returns predefined responses instead of making real HTTP calls. Assert with `assertSent()`, `assertNotSent()`.
- **`Mail::fake()`**: Fakes the mailer. Records sent mails. Assert with `assertSent()`, `assertNotSent()`, `assertSentTo()`.
- **`Notification::fake()`**: Fakes the notification system. Records sent notifications. Assert with `assertSentTo()`, `assertNotSentTo()`.
- **`Queue::fake()`**: Fakes the queue. Records pushed jobs. Assert with `assertPushed()`, `assertNotPushed()`.
- **`Storage::fake()`**: Fakes a storage disk. Stores files in memory. Assert with `assertExists()`, `assertMissing()`.
- **`Exceptions::fake()`**: Fakes the exception handler. Records reported exceptions. Assert with `assertReported()`.

# Mental Models
- **Fake as lightweight implementation**: A fake is not a mock; it's a real implementation that does something simpler. `HttpFake` doesn't mock the HTTP client interface—it implements it with in-memory storage.
- **Fake as call recorder**: Every fake records which methods were called with which arguments. Assertions query this recording.
- **Fake as safety net**: Calling `Mail::fake()` at the start of a test prevents any real email from being sent, even if the code under test has a bug that triggers unexpected email sending.
- **All-or-nothing faking**: `Mail::fake()` fakes all mailers. For selective faking, use `Mail::fake($mailerName)`.

# Internal Mechanics
- **Fake registration**: Each `*::fake()` method replaces the service container binding with the fake implementation. Example: `Mail::fake()` calls `$this->app->instance('mailer', new MailFake(...))`.
- **`MailFake` implementation**: Implements `Mail\Mailer` interface. `send()` stores the `Mailable` in an internal array and returns immediately (no SMTP connection).
- **`HttpFake`**: Implements `Http\Client` interface. Maintains a queue of predefined responses. `get()`/`post()` return the next response from the queue.
- **`QueueFake`**: Implements `Queue\Queue` interface. `push()` stores the job in an internal array. No queue worker needed.
- **Assertion methods**: Each fake provides `assert*()` methods that search the recorded calls array. Assertions can match by class, closure, or count.
- **Fake reset**: Fakes are automatically reset after each test (Pest) or via `tearDown()` (PHPUnit). The original service binding is restored.

# Patterns
- **Pattern: Fake at start of test**
  - Purpose: Prevent any real service calls during the test
  - Benefits: Safety guarantee; test doesn't depend on external services
  - Tradeoffs: Must remember to call `::fake()` for each service used
  - Implementation: `Mail::fake(); Event::fake(); Http::fake();` at the top of feature tests

- **Pattern: Verify dispatch with callback**
  - Purpose: Assert a specific action was performed with specific data
  - Benefits: Precise verification without checking full object state
  - Tradeoffs: Closure can be complex for deeply nested assertions
  - Implementation: `Bus::assertDispatched(fn (SendWelcomeEmail $job) => $job->user->id === $user->id)`

- **Pattern: HTTP response sequence**
  - Purpose: Simulate multiple API responses in sequence
  - Benefits: Test multi-step API interactions (polling, pagination)
  - Tradeoffs: Sequence must match call order exactly
  - Implementation: `Http::fake([...$responses])` or `Http::sequence($responses)`

- **Pattern: Selective faking**
  - Purpose: Fake only specific mailers/connections/storage disks
  - Benefits: Allows some real services while faking others
  - Tradeoffs: Configuration complexity increases
  - Implementation: `Mail::fake('smtp')` fakes only the `smtp` mailer; other mailers work normally

# Architectural Decisions
- **Fake vs Mock**: Always prefer fakes when available. Use mocks only for services without built-in fakes (third-party SDKs, custom interfaces).
- **Fake all vs fake selectively**: Fake all services at the start of integration tests. Fake selectively in unit tests.
- **Assertion granularity**: Use `assertSent(Class)` for simple existence checks. Use `assertSent(fn ($mailable) => ...)` for detailed verification.
- **Count assertions**: `assertSentTimes('Class', 3)` verifies exactly 3 dispatches. Useful for idempotency testing.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fakes are realistic (implement real interface) | Not all services have built-in fakes | Write custom fakes for missing services |
| Fakes are less brittle than mocks | Less precise control over behavior | Acceptable for most test scenarios |
| Assertion API is fluent and readable | Some complex assertions require closures | Keep closures focused; extract helpers |
| Auto-reset between tests | Slight overhead on test setup (~1ms total) | Negligible |

# Performance Considerations
- Fake registration: <1ms per fake (container binding replacement).
- Fake operation: In-memory operations. <0.1ms per recorded call.
- Assertion execution: <1ms per assertion (array search).
- Storage fakes with large files: In-memory storage for large files may increase memory. Clear between tests.
- Http fake with many responses: Sequence grows with response count. Manageable for <1000 responses.

# Production Considerations
- **CI enforcement**: Always call `::fake()` for all external services in feature test setUp. Prevents accidental external calls in CI.
- **Fake behavior drift**: Fakes may not perfectly match real service behavior (e.g., `MailFake` doesn't validate email addresses). Document known differences.
- **Custom fake development**: For third-party services without fakes, create custom fakes implementing the same interface. Test custom fakes alongside real implementations.
- **Fake vs null driver**: Fakes record calls for assertion. Null drivers silently do nothing. Use fakes for services under test; null drivers for services not under test.

# Common Mistakes
- **Mistake: Not calling `::fake()` before code that uses the service**
  - Why: `::fake()` called after service already resolved
  - Why harmful: Real service instance is already bound; fake doesn't take effect
  - Better: Call `::fake()` early (in `setUp()` or at test start)

- **Mistake: Assuming fakes validate input**
  - Why: `Http::fake()` accepts any URL without validation
  - Why harmful: A URL typo in the test is not caught; test passes with wrong URL
  - Better: Use `assertSent(fn ($request) => $request->url() === 'https://correct-url.com')`

- **Mistake: Mocking instead of using fakes**
  - Why: Familiarity with Mockery; `shouldReceive` pattern
  - Why harmful: More brittle tests; more setup code
  - Better: Use `::fake()` for all Laravel-native services. Mock only custom interfaces.

- **Mistake: Not asserting on fake after the action**
  - Why: Setting up the fake but not verifying its calls
  - Why harmful: Action may not have used the service at all; test passes anyway
  - Better: Always assert that the expected call was made: `Mail::assertSent(OrderConfirmation::class)`

# Failure Modes
- **Fake registration order**: If a service provider resolves a service before `::fake()` is called, the fake doesn't replace the already-resolved instance. Call `::fake()` in `setUp()` or before any service access.
- **Partial fake restoration**: After `::fake()` is called, the original binding is stored. If a test creates a new service instance directly (not via container), the fake won't intercept it.
- **QueueFake job execution**: `Queue::fake()` does NOT execute jobs. If your code depends on synchronous job execution, use `Queue::fake()` with `assertPushed()` and manually call `handle()` on the job.
- **StorageFake driver mismatch**: `Storage::fake('s3')` must match the disk name used by the code under test. Mismatch = fake not applied.

# Ecosystem Usage
- **Laravel core**: Every Laravel service that has a `::fake()` method is tested internally using those same fakes.
- **Laravel Spark**: Spark's subscription tests use `Mail::fake()`, `Event::fake()`, and `Queue::fake()` extensively.
- **Laravel Cashier**: Stripe integration tests use `Http::fake()` to mock Stripe API responses.
- **Spatie packages**: Spatie packages use `Event::fake()` for event-driven features, `Mail::fake()` for mail-based workflows.

# Related Knowledge Units
- **Prerequisites**: Service container, Facade system, Test double taxonomy
- **Related Topics**: HTTP Client faking, Mail/notification testing, Queue/job testing, Storage fake testing
- **Advanced Follow-up**: Custom fake development, Fake vs mock decision matrix, Partial faking patterns

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
