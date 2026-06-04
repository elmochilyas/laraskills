# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Unit Testing |
| Knowledge Unit | Null Driver Pattern |
| Difficulty | Intermediate |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel configuration fundamentals, Service container binding, Testing environment management |
| Related KUs | Laravel fakes, Testing environment configuration, Service provider registration |
| Source | domain-analysis.md K046 |

# Overview

The Null Driver pattern uses no-op implementations of external services (mail, queue, cache, logger) to prevent real side effects during testing without mocking. Laravel's configuration-level "null drivers" (`'driver' => 'null'` for cache, `'default' => 'log'` for mail) are the most common expression. The pattern provides safety guarantees: no real emails, no real queue jobs, no real cache writes during test execution—without requiring per-test mock setup.

# Core Concepts

- **Null object pattern**: A class implementing an interface where all methods are no-ops. Does nothing, returns sensible defaults (null, empty collection, false).
- **Laravel null drivers**: Built-in drivers for cache (`null`), session (`array`), mail (`log`), queue (`sync`), filesystem (`local` with testing disk), broadcast (`log`).
- **Configuration-level safety**: Set in `.env.testing` or `config/testing/*`. Ensures entire test suite uses null drivers without per-test configuration.
- **Per-test overrides**: `Storage::fake('s3')` replaces real S3 driver with in-memory fake. `Mail::fake()` replaces mailer with a fake.
- **Null drivers in production vs testing**: Production never uses null drivers. Testing uses null drivers as the default.

# When To Use

- Baseline safety for all external services during testing
- Preventing accidental real API calls (Stripe, Twilio, AWS)
- Preventing accidental email sending during test runs
- Default configuration for mail, queue, cache, session, broadcast drivers
- As a foundation for targeted per-test faking

# When NOT To Use

- For services being tested (use `Mail::fake()` + `Mail::assertSent()` instead)
- When you need to verify interaction patterns (use fakes with assertion capability)
- In production environments (null drivers silently drop data)
- When testing cache behavior specific to a driver (use the real driver in integration tests)

# Best Practices (WHY)

- **Default null, override per-test**: Reason: `.env.testing` sets null/log/sync drivers by default. Specific tests use `Mail::fake()` etc. when testing that service.
- **Configure in `.env.testing`, not in test code**: Reason: null drivers are configuration-level concerns. Test code should be about behavior, not driver setup.
- **Create custom null drivers for third-party SDKs**: Reason: prevents real API calls to Stripe, Twilio, etc. without mocking every call.
- **Use `TestingServiceProvider` for binding null implementations**: Reason: register all null driver bindings in one place. Conditionally register only in testing.
- **Document null driver behavioral differences**: Reason: null drivers may behave differently from real drivers (e.g., null cache never evicts). Document known gaps.

# Architecture Guidelines

- **Configuration defaults**: Set `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log` in `.env.testing`.
- **Third-party SDK nullification**: Set API keys to placeholder values in `.env.testing`. Application code should handle missing keys gracefully.
- **Null driver scope**: Nullify at the driver level, not the application level. Allows individual services to be turned back on with `->fake()`.
- **Fail-closed default**: The testing environment should default to "do nothing externally." Only enable real interactions per-test when explicitly testing that service.

# Performance Considerations

- **Null driver speed**: Null operations are essentially free (<1μs per operation). No I/O overhead.
- **Queue sync in tests**: `sync` driver executes jobs inline. For complex job chains, this adds test time. Use `Queue::fake()` when testing dispatching logic.
- **Cache null driver impact**: Code heavily relying on cache executes the full computation path. Tests may be slower without cached data.
- **Session array driver**: In-memory session is faster than database or Redis sessions. Good default for testing.

# Security Considerations

- **Silent failure risk**: Null drivers silently drop all operations. A bug where the application fails to send critical emails won't be caught.
- **Integration blind spots**: Layer integration test suites for critical services. Null drivers for non-critical paths.
- **Forgotten null configuration**: Adding a new service without configuring its null driver may cause real API calls in tests.

# Common Mistakes

**Mistake: Relying on null drivers for services under test**
- Description: Testing mail sending with mail driver set to `log`
- Cause: "Null driver covers everything"
- Consequence: The `log` driver doesn't validate mail arguments; test passes but mail is broken
- Better: Use `Mail::fake()` + `Mail::assertSent()` for mail-testing tests.

**Mistake: Null drivers hiding real integration problems**
- Description: All external calls silently dropped
- Cause: "Tests don't need real services"
- Consequence: A Stripe API change that breaks your code won't be caught in tests
- Better: Have a separate integration test suite that runs against real sandbox environments.

**Mistake: Missing null driver for a new service**
- Description: Team adds a new broadcast/notification service but doesn't update `.env.testing`
- Cause: Forgetting to configure the testing driver
- Consequence: Tests may attempt real connections, fail, or cost money
- Better: CI pipeline that detects unexpected external connections during test run.

# Anti-Patterns

- **Using null drivers for test assertions**: Null drivers don't record calls. Use fakes when assertion is needed.
- **Inconsistent driver configuration**: Some services use null, others use real drivers. Inconsistency causes unpredictable test behavior.
- **Null driver production deployment**: Accidentally deploying null driver configuration to production.

# Examples

**Standard null driver configuration in `.env.testing`**
```
MAIL_MAILER=log
QUEUE_CONNECTION=sync
CACHE_STORE=array
SESSION_DRIVER=array
BROADCAST_DRIVER=log
FILESYSTEM_DISK=local
```

**Custom null driver for Stripe**
```php
class NullStripeClient implements StripeClientInterface
{
    public function charges(): array { return []; }
    public function createCustomer(array $data): Customer { return new Customer(id: 'cus_null'); }
}
```

**Testing service provider**
```php
class TestingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('testing')) {
            $this->app->bind(StripeClientInterface::class, NullStripeClient::class);
        }
    }
}
```

# Related Topics

- Laravel fakes (Http, Mail, Queue, Notification, Event, Storage, Bus)
- Testing environment configuration
- Service provider registration patterns
- Integration test suite separation
- Config caching and testing environments

# AI Agent Notes

- Always generate `.env.testing` with null/log/sync drivers for mail, queue, cache, session, and broadcast.
- For third-party SDKs, generate placeholder API keys in testing configuration.
- When generating service provider code, include environment-gated bindings for testing.
- Never generate null driver configuration for services that are being tested with `->fake()`.
- Document known behavioral differences between null and real drivers in generated test configuration.

# Verification

- [ ] `.env.testing` sets null/log/sync drivers for all external services
- [ ] Third-party API keys are placeholder values in testing configuration
- [ ] Custom null drivers exist for non-Laravel external services
- [ ] TestingServiceProvider binds null implementations in testing environment
- [ ] Integration test suite covers critical services where null drivers mask behavior
- [ ] CI pipeline detects unexpected external connections during test runs
- [ ] Null driver behavioral differences are documented
