# Provider Testing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Testing |
| Difficulty | Advanced |
| Lifecycle Phase | Bootstrap (Testing) |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Service providers are critical infrastructure — if a provider registers the wrong binding, misses a binding, or has a bug in `boot()`, the entire application is affected. Yet providers are rarely tested directly. Provider testing strategies verify that `register()` produces the expected container state, `boot()` completes without errors, and `provides()` (for deferred providers) matches the actual registered bindings. The most bug-prone aspect of providers is the mismatch between `provides()` and actual bindings — this should be the primary test focus.

## Core Concepts
- **Contract Testing** — Assert that specific bindings exist after `register()`: `$this->assertTrue($app->bound(MyInterface::class))`.
- **Resolution Testing** — Resolve a service and assert its type: `$this->assertInstanceOf(Concrete::class, $app->make(Interface::class))`.
- **Provides() Testing** — For deferred providers, assert `$provider->provides()` returns correct identifiers.
- **Boot Integration Testing** — Register all dependent providers, boot, and verify side effects.
- **Isolation Testing** — Use mock container to verify `$app->bind()` called with expected parameters.

## When To Use
- Package development — ensure provider works across Laravel versions.
- Critical infrastructure providers (auth, payments, database).
- Deferred providers — verify `provides()` matches actual registrations.
- CI gate — prevent regressions when providers are modified.

## When NOT To Use
- Trivial providers with single binding — test the binding behavior, not the provider itself.
- Frequently changing providers during rapid development — let APIs stabilize first.
- Providers where testing the resolved service behavior is more valuable than testing registration.

## Best Practices
- **Unit-test `register()` with real or mock container** — Fast and precise; verify each binding exists.
- **Integration-test `boot()` with minimal application** — Slower but catches issues unit tests miss.
- **Always test `provides()` for deferred providers** — Mismatch between `provides()` and actual bindings is the most common deferred provider bug.
- **Test resolution order** — If multiple providers register the same abstract, verify the expected one wins.
- WHY: Provider tests catch regressions that no other test type can — they verify the composition root is correctly wired before any service is used.

## Architecture Guidelines
- Unit tests: use `$app = new Application()` or `$this->createMock(Container::class)`.
- Integration tests: use `Orchestra\Testbench` for package testing.
- Assertions: `$app->bound()`, `$app->isShared()`, `$app->make()`, `$this->assertInstanceOf()`.
- For `boot()` testing, register all dependent providers first, then call `$provider->boot()`.

## Performance Considerations
- Provider tests are CI-only — production performance not relevant.
- Full bootstrap per test can slow test suites — use test isolation (mock container) for `register()` tests.
- Cache application instance across tests where possible.
- Limit full-bootstrap tests to few critical integration scenarios.

## Security Considerations
- Provider tests should verify security-related bindings (auth, encryption) are registered.
- Ensure test fixtures don't contain real credentials or secrets.
- Test that development-only providers are NOT registered in production-like environments.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Testing resolution but not registration | `make()` doesn't verify who registered it | Test passes even if another provider registered the binding | Use `$app->bound()` to verify specific provider's registration |
| Not testing `provides()` for deferred providers | Missing `provides()` test | Mismatch between `provides()` and actual bindings goes undetected | Add `provides()` assertion for every deferred provider |
| Testing `boot()` without prerequisite providers | Missing dependency registration | False failures — binding not found is not the tested provider's fault | Register all dependencies before testing `boot()` |
| Over-mocking container | Mock doesn't behave like real container | Passes with mock, fails in production | Prefer real container for `register()` tests |

## Anti-Patterns
- **Testing Resolution Instead of Registration** — Passing `$app->make()` doesn't verify the provider registered the binding.
- **No Provides() Test** — Deferred provider `provides()` mismatch silently causes resolution failures.
- **Over-Isolated Tests** — Mock container that doesn't actually bind/resolve services.

## Examples

### Register contract test
```php
public function test_provider_registers_bindings(): void
{
    $app = new Application(realpath(__DIR__.'/../../'));
    $provider = new PaymentServiceProvider($app);
    $provider->register();

    $this->assertTrue($app->bound(PaymentGateway::class));
    $this->assertTrue($app->isShared(LoggerInterface::class));
}
```

### Provides() test for deferred provider
```php
public function test_provider_returns_correct_services(): void
{
    $provider = new MailServiceProvider($this->app);
    
    $provides = $provider->provides();
    
    $this->assertContains(MailManager::class, $provides);
    $this->assertContains(Mailer::class, $provides);
    $this->assertContains('mailer', $provides);
}
```

### Boot integration test
```php
public function test_provider_boot_completes(): void
{
    $app = new Application(realpath(__DIR__.'/../../'));
    $app->register(CoreServiceProvider::class);
    
    $provider = new PaymentServiceProvider($app);
    $app->register($provider);
    
    $app->boot(); // Should not throw
    
    $gateway = $app->make(PaymentGateway::class);
    $this->assertInstanceOf(StripeGateway::class, $gateway);
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, PHPUnit/Mockery, Service Container
- **Closely Related:** Register vs Boot Methods, Deferred Providers
- **Advanced:** Architecture Testing, CI/CD Provider Validation
- **Cross-Domain:** Testing (Orchestra Testbench, integration testing patterns)

## AI Agent Notes
- When a deferred provider doesn't work in production but tests pass, check if `provides()` was updated after the test was written.
- Use `$app->bound()` to verify provider-specific registration — `$app->make()` may resolve from another provider.
- Orchestra Testbench is the standard tool for package provider testing.

## Verification
- [ ] Can write a unit test for `register()` using `$app->bound()` assertions
- [ ] Can write `provides()` contract test for deferred providers
- [ ] Can write boot integration test with dependent providers
- [ ] Understand the difference between testing registration vs resolution
- [ ] Can set up Orchestra Testbench for package provider testing
