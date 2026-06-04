# Skill: Unit Test Provider Register Method

## Purpose

Write unit tests that verify a service provider's `register()` method produces the expected container state — confirming all bindings, singletons, and config merges are correctly registered.

## When To Use

- Package development — ensuring provider works across Laravel versions.
- Critical infrastructure providers (auth, payments, database).
- After modifying a provider's `register()` method.
- CI gate to prevent binding regressions.

## When NOT To Use

- Trivial providers with a single binding — testing the binding behavior may be more valuable.
- Frequently changing providers during rapid development — let APIs stabilize first.
- Providers where testing the resolved service behavior is more important than testing registration.

## Prerequisites

- PHPUnit setup
- `Illuminate\Foundation\Application` or `Orchestra\Testbench` for package testing
- Understanding of `$app->bound()`, `$app->isShared()`

## Inputs

- Provider class under test
- List of expected bindings (interface/abstract → concrete)
- List of expected singletons

## Workflow

1. Create a test class for the provider.
2. Instantiate a minimal application: `$app = new Application(realpath(__DIR__.'/../../'));`
3. Instantiate the provider: `$provider = new PaymentServiceProvider($app);`
4. Call `$provider->register();`
5. Assert each expected binding exists: `$this->assertTrue($app->bound(PaymentGateway::class));`
6. Assert singletons are shared: `$this->assertTrue($app->isShared(LoggerInterface::class));`
7. Assert concrete types resolve correctly:
   ```php
   $this->assertInstanceOf(StripeGateway::class, $app->make(PaymentGateway::class));
   ```
8. For config merges, assert config values are accessible after registration.

## Validation Checklist

- [ ] Test verifies each binding registered via `$app->bound()`
- [ ] Test verifies singleton nature via `$app->isShared()`
- [ ] Test verifies concrete types resolve to correct implementation
- [ ] Real application container used (not mocked container)
- [ ] Provider's `parent::register()` calls respected (shortcuts processed)
- [ ] Config merges verified where applicable

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Test passes but provider fails in production | Mocked container doesn't behave like real container |
| `$app->bound()` returns false | `parent::register()` not called — shortcuts not processed |
| `$app->make()` returns wrong type | Different provider registered the same abstract — use `bound()` first |
| Application instantiation fails | Missing environment files or directory structure |

## Decision Points

- **bound() vs make()**: `bound()` verifies registration. `make()` verifies resolution. Use both for comprehensive testing.
- **Real Container vs Mock**: Prefer real container for `register()` tests. Use mocks only when testing specific container interactions.

## Performance Considerations

- Provider tests are CI-only — performance is not a runtime concern.
- Use test isolation to avoid full application bootstrap per test.
- Cache application instance across tests in the same class where possible.

## Security Considerations

- Ensure test fixtures don't contain real credentials or secrets.
- Test that security-related bindings (auth, encryption) are registered.
- For package providers, test that configuration doesn't override security-sensitive keys.

## Related Rules

- Rule 1: Unit-Test `register()` to Verify Expected Bindings Exist After Registration
- Rule 4: Use `$app->bound()` to Verify Provider-Specific Registration, Not `$app->make()`
- Rule 6: Prefer a Real Application Container Over Mocks for `register()` Tests

## Related Skills

- Test Deferred Provider provides() Method
- Integration Test Provider Boot Method
- Test That Development-Only Providers Are NOT Registered in Production

## Success Criteria

- Every binding in the provider is tested and verified via `$app->bound()`.
- Concrete types resolve to expected implementations.
- Test suite catches regressions when provider's `register()` changes.
---

# Skill: Test Deferred Provider provides() Method

## Purpose

Write dedicated contract tests for deferred providers that assert the `provides()` method returns exactly the set of service identifiers registered in `register()`, preventing the most common deferred provider bug — a mismatch between `provides()` and actual bindings.

## When To Use

- Every deferred provider — mandatory test.
- After adding or removing bindings in a deferred provider's `register()`.
- Package development where deferred providers are used.
- As part of CI to catch `provides()` drift.

## When NOT To Use

- Non-deferred (eager) providers that don't implement `provides()`.
- Providers where `provides()` is trivially obvious (single binding) — though still recommended.

## Prerequisites

- PHPUnit setup
- Understanding of `DeferrableProvider` interface and deferred manifest
- Provider's `register()` method implementation

## Inputs

- Deferred provider class under test
- List of expected service identifiers from `provides()`
- Provider's `register()` method (to verify alignment)

## Workflow

1. Create a test for the deferred provider.
2. Instantiate the provider: `$provider = new MailServiceProvider($this->app);`
3. Call `$provider->provides()` and capture the returned array.
4. Assert each expected service identifier is present:
   ```php
   $this->assertContains(MailManager::class, $provides);
   $this->assertContains('mailer', $provides);
   ```
5. Assert the count matches expectations: `$this->assertCount(3, $provides);`
6. Cross-check with `register()`: each identifier bound in `register()` must appear in `provides()`.
7. Optionally, write a meta-test that reflects over `register()` and dynamically generates the expected list (maintenance-heavy but thorough).

## Validation Checklist

- [ ] Test asserts each service identifier from `provides()` is expected
- [ ] Test asserts no unexpected identifiers in `provides()`
- [ ] Assertion count matches total registered bindings (including aliases)
- [ ] `provides()` identifiers match what `register()` registers
- [ ] Test runs as part of CI on every change to the provider

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Test passes but provider doesn't load in production | `provides()` test passes but manifest is stale — rebuild manifest |
| Identifiers mismatch after refactoring | Binding renamed in `register()` but not updated in `provides()` |
| Test asserts each identifier but misses new ones | Count assertion not updated after adding a binding — test still passes with stale count |
| Dynamic `provides()` logic | `provides()` uses runtime logic instead of returning static array — test may not cover all paths |

## Decision Points

- **Static vs Dynamic Test**: Static test (list expected IDs) is simpler and more explicit. Dynamic test (reflect over `register()`) is more thorough but harder to maintain.
- **Count Assertion**: Include `assertCount()` to catch both missing and extra entries.

## Performance Considerations

- Tests are CI-only — no runtime performance impact.
- The cost of a missing `provides()` entry in production is a silent resolution failure, which takes hours to debug — the test cost is negligible by comparison.

## Security Considerations

- `provides()` can leak information about internal service identifiers — though this is typically low-risk.
- Test in CI, not production.

## Related Rules

- Rule 2: Always Test `provides()` for Deferred Providers

## Related Skills

- Unit Test Provider Register Method
- Implement a Deferred Provider

## Success Criteria

- Every deferred provider has a `provides()` contract test.
- Test catches any mismatch between `provides()` and `register()`.
- CI fails when `provides()` is out of sync with actual bindings.
---

# Skill: Integration Test Provider Boot Method

## Purpose

Write integration tests for a provider's `boot()` method by registering all dependent providers first, then verifying that `boot()` completes without errors and produces the expected side effects (routes registered, events listened, views loaded).

## When To Use

- Providers whose `boot()` registers routes, views, event listeners, or middleware.
- Providers that depend on other providers' bindings in `boot()`.
- Package providers that need to verify boot-time setup.
- After modifying a provider's `boot()` method.

## When NOT To Use

- Providers with trivial `boot()` methods that only make simple bindings.
- Providers where unit-testing `register()` is sufficient.
- During rapid development where boot logic changes frequently.

## Prerequisites

- PHPUnit / Orchestra Testbench setup
- Understanding of the application bootstrap sequence
- Knowledge of provider dependencies in `boot()`

## Inputs

- Provider class under test
- List of dependent providers that must be registered before the tested provider's `boot()`
- Expected boot-time side effects

## Workflow

1. Create an integration test that instantiates the application.
2. Register all dependent providers first (those the tested provider's `boot()` depends on):
   ```php
   $app->register(RouteServiceProvider::class);
   $app->register(EventServiceProvider::class);
   ```
3. Register the tested provider: `$app->register(PaymentServiceProvider::class);`
4. Boot the application: `$app->boot();`
5. Assert expected side effects:
   - Routes loadable: `$this->get('/payments/invoice')->assertOk();`
   - Events dispatched: use `Event::fake()` and assert listener attached.
   - Config merged: `$this->assertEquals('expected', config('payments.driver'));`
6. For resolution tests: resolve a service and assert instance type.

## Validation Checklist

- [ ] All dependent providers registered before the tested provider
- [ ] `$app->boot()` called to trigger all `boot()` methods
- [ ] Routes registered by provider are accessible
- [ ] Event listeners are attached and fire correctly
- [ ] View namespaces are loadable (where applicable)
- [ ] Service resolves to expected concrete after boot
- [ ] Test does not produce false failures from missing dependencies

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Test fails with "binding not found" | Missing dependent provider registration |
| Test passes but provider fails in production | Environment differences — boot behavior may differ with full application |
| Route test fails with 404 | Routes registered in `register()` instead of `boot()` |
| Test too slow | Full bootstrap per test — consider using cached application instance |

## Decision Points

- **Unit vs Integration**: Pure `boot()` with only resolution calls → unit test with `register()` first, then `call_user_func([$provider, 'boot'])`. Complex `boot()` with route/view/event registration → full integration test.
- **Testbench vs Application**: For package providers → Orchestra Testbench. For application providers → `Illuminate\Foundation\Application` with minimal setup.

## Performance Considerations

- Integration tests with full bootstrap are slower — limit to critical providers.
- Cache application instance across tests where boot state is shared.
- Use `RefreshDatabase` or `DatabaseTransactions` traits carefully — they add overhead.

## Security Considerations

- Test security-relevant boot registrations (auth guards, policies) are applied.
- Ensure boot-time registration of security middleware or filters is verified.
- Test that development-only boot registrations don't apply in production environments.

## Related Rules

- Rule 3: Integration-Test `boot()` with All Dependent Providers Registered

## Related Skills

- Unit Test Provider Register Method
- Test Deferred Provider provides() Method
- Test That Development-Only Providers Are NOT Registered in Production

## Success Criteria

- Provider's `boot()` is verified to complete successfully with all dependencies.
- Expected boot-time side effects (routes, events, views) are confirmed.
- Test catches regressions when `boot()` dependencies change.
---

# Skill: Test That Development-Only Providers Are NOT Registered in Production

## Purpose

Write an automated test that verifies no development-only service providers are registered when the application is configured for production, preventing sensitive data leakage.

## When To Use

- As a CI/CD deployment gate step.
- After adding new development packages.
- Security-sensitive applications requiring production provider validation.
- Quarterly security review automation.

## When NOT To Use

- When no development-only packages are installed.
- Applications where all packages are required in all environments.
- Local or staging development where development tooling is intentional.

## Prerequisites

- PHPUnit setup
- List of known development-only provider class name substrings
- Environment configuration to simulate production

## Inputs

- List of blocked provider substrings: `['Debugbar', 'Telescope', 'Clockwork', 'IdeHelper', 'Debug']`
- Application's provider resolution mechanism

## Workflow

1. Create a test that sets `APP_ENV=production`:
   ```php
   public function test_no_development_providers_in_production(): void
   {
       $app = $this->createApplication();
       $app->useEnvironmentPath(realpath(__DIR__.'/../../'));
       $app->loadEnvironmentFrom('.env.testing');
       putenv('APP_ENV=production');
       (new LoadEnvironmentVariables)->bootstrap($app);
   ```
2. Get all registered providers: `$providers = $app->getProviders(ServiceProvider::class);`
3. Check each provider against the blocked list:
   ```php
   $blocked = ['Debugbar', 'Telescope', 'Clockwork'];
   foreach ($providers as $provider) {
       foreach ($blocked as $b) {
           $this->assertFalse(
               str_contains(get_class($provider), $b),
               "Provider registered in production: " . get_class($provider)
           );
       }
   }
   ```
4. Fix any failures by using `dont-discover` or conditional registration.
5. Add the test to the CI pipeline as a deployment gate.

## Validation Checklist

- [ ] Test sets `APP_ENV=production` correctly
- [ ] All registered providers are retrieved (manual + discovered)
- [ ] Blocked provider list is comprehensive and kept up to date
- [ ] Test fails if any blocked provider is registered
- [ ] Exceptions are documented for legitimate staging environments with tooling
- [ ] CI pipeline includes this test as a deployment gate

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Test passes but development provider still in production | Auto-discovered provider not caught — ensure the test runs with the production `APP_ENV` |
| Provider name changed between versions | Blocked list needs updating — use substring match that covers version changes |
| False positive for staging with intentional tooling | Document exceptions and skip test for staging environments |
| Test infrastructure too complex | Use `Orchestra\Testbench` or simplify by checking `bootstrap/cache/packages.php` directly |

## Decision Points

- **String Match vs Full Class Name**: Substring match catches version-related name changes but may have false positives. Full class name is precise but requires updates.
- **CI vs Manual**: Automated CI test catches regressions immediately; manual audit is for initial cleanup.

## Performance Considerations

- Test runs in CI only — no runtime performance impact.
- Provider iteration is fast (typically <50 providers).
- Consider caching the registered provider list if the test is in a critical CI path.

## Security Considerations

- This test is a security control — development providers in production leak: config values, database queries, stack traces, request data.
- Telescope exposes all application data to anyone with the Telescope dashboard URL.
- Debugbar exposes detailed debug information, including environment variables and session data.
- IDE helper generators should never run in production (may produce files in production environment).

## Related Rules

- Rule 5: Test That Development-Only Providers Are NOT Registered in Production Environments

## Related Skills

- Conditionally Register Environment-Specific Providers
- Audit Production Provider List for Development Providers

## Success Criteria

- CI pipeline fails deployment if any development provider is registered in a production-configured environment.
- Blocked provider list is maintained and comprehensive.
- Production environment has zero development providers.
