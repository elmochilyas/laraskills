# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Dependency Injection Testing (Null Driver Pattern)
 KU Code: ku-03-dependency-injection-testing
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
The Null Driver pattern uses no-op implementations of external services (mail, queue, cache, logger) to prevent real side effects during testing without mocking. Laravel's configuration-level "null drivers" (`'driver' => 'null'` for cache, `'default' => 'log'` for mail) are the most common expression. This pattern is essential for dependency injection testing: it provides safety guarantees (no real emails, no real queue jobs, no real cache writes) without requiring per-test mock setup. Combined with proper dependency injection, it ensures testable, decoupled code.

# Core Concepts
- **Null object pattern**: A class implementing an interface where all methods are no-ops. Returns sensible defaults (null, empty collection, false).
- **Laravel null drivers**: Built-in drivers for cache (`null`), session (`array`), mail (`log`), queue (`sync`), filesystem (`local`), broadcast (`log`).
- **Configuration-level safety**: Set in `.env.testing` or `config/testing/*`. Ensures entire test suite uses null drivers.
- **Per-test overrides**: `Storage::fake('s3')` replaces real S3 with in-memory fake. `Mail::fake()` replaces mailer with fake.
- **Testing service provider**: Binds null implementations for all external service interfaces. Registered only in testing environment.
- **Dependency injection for testability**: Classes should receive dependencies via constructor injection, not facades, for testability.

# When To Use
- Preventing accidental real service calls during any test
- Configuring baseline testing environment for new projects
- Testing classes that depend on external services (mail, queue, cache, HTTP)
- Replacing services that are not the focus of the current test
- Setting safe defaults that protect against developer oversight

# When NOT To Use
- Testing the service itself (use `Mail::fake()` + `assertSent()` for mail testing)
- When assertion on service interaction is needed (use fakes or spies instead)
- As a substitute for understanding how the real service works
- When the null driver's behavior differs significantly from production (test with real driver occasionally)
- For services that the test explicitly needs to exercise (override with `->fake()`)

# Best Practices (WHY)
- **Set null drivers for all external services in `.env.testing`**: Reason: `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array` prevent real service calls. Developers shouldn't need to remember to fake services.
- **Override null drivers per-test with fakes when testing the service**: Reason: `Mail::fake()` replaces the null driver with a testable fake. `Mail::assertSent()` verifies behavior. Leave null drivers for non-mail tests.
- **Use constructor injection, not facades, in application code**: Reason: constructor injection allows null drivers to be swapped naturally. Facades are tightly coupled to the container.
- **Create a `TestingServiceProvider` for custom null drivers**: Reason: third-party SDKs (Stripe, Twilio) don't have built-in null drivers. Bind null implementations in a provider registered only in testing.
- **Document null driver behavioral differences**: Reason: null cache never evicts (it stores nothing). Array cache never evicts. Redis evicts by policy. Tests using null drivers may pass while production fails.
- **Use `Storage::fake()` instead of null filesystem driver for file tests**: Reason: `Storage::fake()` provides an in-memory filesystem with assertion methods. The null driver just sits there silently.
- **Verify null driver safety with a CI check**: Reason: a CI step that detects unexpected external connections during tests catches missing null driver configurations.

# Architecture Guidelines
- **`.env.testing` defaults**: `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log`, `FILESYSTEM_DISK=local`.
- **Testing service provider**: Create `App\Providers\TestingServiceProvider` that binds null implementations. Register only when `APP_ENV=testing`.
- **Null driver interface**: Null drivers implement the same interface as real drivers. Application code cannot distinguish between null and real.
- **Third-party SDK nullification**: Bind null implementations for external SDKs. Set API keys to placeholder values in `.env.testing`.
- **Fail-closed default**: Testing environment defaults to "do nothing externally." Only enable real service interactions per-test.
- **Integration test separation**: Have a separate test suite that runs against real sandbox environments for critical services.

# Performance
- **Null operation speed**: <1μs per operation. No I/O overhead. Effectively free.
- **Queue sync in tests**: Executes jobs inline. For complex chains, this adds test time. Use `Queue::fake()` when testing dispatch logic.
- **Cache null driver impact**: Code heavily relying on cache executes full computation instead of reading cached values. Tests may be slower.
- **Session array driver**: In-memory session is faster than database or Redis sessions.
- **Mail log driver**: Writes to `laravel.log`. In long suites, this file can grow. Configure log rotation.

# Security
- **Accidental real service prevention**: Null drivers are the primary safety net against sending real emails, charging real cards, or making real API calls during testing.
- **API key validation**: Set API keys to placeholder values. Application code should check for missing/placeholder keys and fail gracefully.
- **Testing service provider isolation**: Register testing providers only in testing environment. Never register in production.
- **Log content**: Mail log driver writes email content to `laravel.log`. Ensure logs don't contain PII.

# Common Mistakes

**Mistake: Relying on null drivers for services under test**
- Description: Testing mail sending with `MAIL_MAILER=log` but not using `Mail::fake()`
- Cause: "The log driver prevents real emails; that's sufficient"
- Consequence: The log driver doesn't validate mail arguments; test passes but mail sending is broken
- Better: Use `Mail::fake()` + `Mail::assertSent()` for mail-testing tests. Leave null drivers for non-mail tests.

**Mistake: Null drivers hiding real integration problems**
- Description: All external calls are silently dropped with no verification
- Cause: "Null drivers are safe; no need to test real integration"
- Consequence: A Stripe API change that breaks your code won't be caught in tests
- Better: Have a separate integration test suite that runs against real sandbox environments.

**Mistake: Missing null driver for a new service**
- Description: Adding a new broadcast/notification service without updating `.env.testing`
- Cause: "It's just a new service; the test should work"
- Consequence: Tests may attempt real connections, fail, or incur costs
- Better: CI pipeline that detects unexpected external connections during test runs.

**Mistake: Relying on null drivers for services that need behavior verification**
- Description: Using null driver for a service that should have assertions on its usage
- Cause: "Null drivers prevent side effects; fakes are extra work"
- Consequence: No verification that the service was called correctly
- Better: Use fakes for services that need interaction verification. Null drivers for services not under test.

# Anti-Patterns
- **No null driver configuration**: Running tests without configuring null drivers. One developer error could send real emails.
- **Production driver in testing**: Using real Redis, real mail driver, or real queue connection in test environment.
- **Silent null driver failures**: Null cache returns `null` for every `get()` call, potentially causing N+1 queries in production. Test with real cache driver periodically.
- **Sync queue deadlock**: `sync` driver executes jobs inline. A job dispatching another job causes infinite recursion. Use `Queue::fake()` for jobs that dispatch sub-jobs.
- **No integration test safety net**: Depending entirely on null drivers with no real integration testing. Have a separate suite for real sandbox testing.

# Examples

**`.env.testing` null driver configuration**
```
MAIL_MAILER=log
QUEUE_CONNECTION=sync
CACHE_STORE=array
SESSION_DRIVER=array
BROADCAST_DRIVER=log
FILESYSTEM_DISK=local
```

**Testing service provider**
```php
<?php

namespace App\Providers;

use App\Services\PaymentGateway;
use App\Services\NullPaymentGateway;
use Illuminate\Support\ServiceProvider;

class TestingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('testing')) {
            $this->app->bind(PaymentGateway::class, NullPaymentGateway::class);
        }
    }
}
```

**Per-test override of null driver**
```php
test('sends welcome email on registration', function () {
    Mail::fake();
    Queue::fake();

    $this->post('/register', [
        'name' => 'Test',
        'email' => 'test@example.com',
    ]);

    Mail::assertSent(WelcomeEmail::class);
    Queue::assertPushed(ProcessWelcomeTasks::class);
});
```

# Related Topics
- Testing environment management
- Laravel fakes
- Service provider registration
- Test double taxonomy
- Integration test suite separation

# AI Agent Notes
- Always include null driver configuration when generating `.env.testing` files.
- Use `Mail::fake()`, `Queue::fake()`, `Storage::fake()` for per-test overrides, not direct null driver manipulation.
- When generating testing service providers, use `$this->app->environment('testing')` to guard provider registration.
- For third-party SDKs without Laravel-native fakes, generate custom null driver implementations.
- Never generate tests that rely on null drivers for behavioral verification. Use fakes with assertions.
- Include a CI step that detects unexpected external connections to catch missing null driver configurations.

# Verification
- [ ] `.env.testing` sets null/log drivers for all external services
- [ ] No test can accidentally send real emails, queue jobs, or cache writes
- [ ] `Mail::fake()` and `Queue::fake()` are used for services under test, not null drivers
- [ ] `TestingServiceProvider` binds null implementations for custom services
- [ ] Third-party SDK API keys are placeholder values in `.env.testing`
- [ ] Sync queue driver does not cause infinite recursion with chained jobs
- [ ] Integration test suite runs against real sandbox environments separately
- [ ] CI detects unexpected external connection attempts during tests
