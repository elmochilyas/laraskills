# Rules

## Rule 1: Unit-Test `register()` to Verify Expected Bindings Exist After Registration
---
## Category
Testing
---
## Rule
Write a unit test that instantiates the provider with a real (or minimal) application container, calls `register()`, and asserts expected bindings exist using `$app->bound()`.
---
## Reason
Provider registration is the composition root — if bindings are wrong, every dependent service breaks. Testing `register()` catches missing bindings, wrong concretes, and silent shortcut failures before they reach production.
---
## Bad Example
```php
// No provider test — trusting that register() works
// Binding changes go undetected until production
```
---
## Good Example
```php
public function test_provider_registers_payment_gateway_binding(): void
{
    $app = new Application(realpath(__DIR__.'/../../'));
    $provider = new PaymentServiceProvider($app);
    $provider->register();

    $this->assertTrue($app->bound(PaymentGateway::class));
    $this->assertTrue($app->isShared(LoggerInterface::class));
}
```
---
## Exceptions
Trivial providers with a single binding may be adequately covered by testing the service behavior rather than the provider itself.
---
## Consequences Of Violation
Binding regressions undetected until runtime; incorrect concretes resolving in production; silent failures when `parent::register()` is not called; difficult attribution of binding bugs.

## Rule 2: Always Test `provides()` for Deferred Providers
---
## Category
Testing
---
## Rule
Write a dedicated test for every deferred provider that asserts `provides()` returns exactly the set of service identifiers registered in `register()`.
---
## Reason
Mismatch between `provides()` and actual registrations is the most common deferred provider bug. A `provides()` contract test catches stale entries, missing identifiers, and sync failures — the manifest is only as correct as `provides()`.
---
## Bad Example
```php
class MailServiceProvider extends ServiceProvider implements DeferrableProvider
{
    // provides() not tested — mismatch with register() goes undetected
}
```
---
## Good Example
```php
public function test_provides_returns_all_registered_services(): void
{
    $provider = new MailServiceProvider($this->app);
    $provides = $provider->provides();

    $this->assertContains(MailManager::class, $provides);
    $this->assertContains(Mailer::class, $provides);
    $this->assertContains('mailer', $provides);
    $this->assertCount(3, $provides);
}
```
---
## Exceptions
No common exceptions. Every deferred provider must have a `provides()` test.
---
## Consequences Of Violation
Deferred provider silently never loads; services resolve to nothing on specific routes; intermittent failures that are hard to reproduce; wasted debugging hours tracing the manifest.

## Rule 3: Integration-Test `boot()` with All Dependent Providers Registered
---
## Category
Testing
---
## Rule
When testing `boot()`, first register all providers that the tested provider depends on, then call `boot()` and verify the expected side effects.
---
## Reason
`boot()` depends on bindings, routes, and services registered by other providers. Testing `boot()` in isolation produces false failures when dependencies are absent, or false passes when dependencies are mocked incorrectly.
---
## Bad Example
```php
public function test_boot(): void
{
    $provider = new PaymentServiceProvider($this->app);
    $provider->boot(); // Fails because Router dependency not registered
}
```
---
## Good Example
```php
public function test_boot_completes_with_dependencies(): void
{
    $app = new Application(realpath(__DIR__.'/../../'));
    $app->register(RouteServiceProvider::class); // Prerequisite
    $app->register(EventServiceProvider::class); // Prerequisite

    $provider = new PaymentServiceProvider($app);
    $app->register($provider);
    $app->boot(); // Should not throw

    $gateway = $app->make(PaymentGateway::class);
    $this->assertInstanceOf(StripeGateway::class, $gateway);
}
```
---
## Exceptions
Providers with pure `boot()` methods that only call `$this->loadRoutesFrom()` or similar helpers may be tested at a higher integration level (feature test that hits a route defined by the provider).
---
## Consequences Of Violation
False test failures that waste debugging time; tests that don't reflect real bootstrap conditions; production bugs missed because test isolation misrepresents the container state.

## Rule 4: Use `$app->bound()` to Verify Provider-Specific Registration, Not `$app->make()`
---
## Category
Testing
---
## Rule
Assert with `$app->bound(Interface::class)` to verify a provider registered the expected binding, rather than resolving with `$app->make()` which may succeed even if a different provider registered the binding.
---
## Reason
`$app->make()` resolves a concrete — it doesn't verify *who* registered it. `$app->bound()` confirms the binding exists. If multiple providers register the same interface, `make()` may pass even when the tested provider's registration is broken.
---
## Bad Example
```php
public function test_registers_gateway(): void
{
    $provider = new PaymentServiceProvider($this->app);
    $provider->register();

    // Passes even if another provider registered PaymentGateway
    $this->assertInstanceOf(StripeGateway::class, $this->app->make(PaymentGateway::class));
}
```
---
## Good Example
```php
public function test_registers_gateway(): void
{
    $provider = new PaymentServiceProvider($this->app);
    $provider->register();

    $this->assertTrue($this->app->bound(PaymentGateway::class));
}
```
---
## Exceptions
When you also need to verify the concrete implementation, chain both assertions: `$this->assertTrue($app->bound(I::class))` followed by `$this->assertInstanceOf(Concrete::class, $app->make(I::class))`.
---
## Consequences Of Violation
Tests pass but provider registration is broken; false confidence in provider correctness; another provider's registration masks the tested provider's failure.

## Rule 5: Test That Development-Only Providers Are NOT Registered in Production Environments
---
## Category
Security
---
## Rule
Write a production-environment integration test that verifies no development-only providers (Debugbar, Telescope, IDE helpers) are registered.
---
## Reason
Development providers in production leak sensitive data (stack traces, config values, queries). A deployment-time test catches accidental inclusions before they affect users.
---
## Bad Example
```php
// No guard — development providers may be registered in production
// Silent data leakage until someone notices
```
---
## Good Example
```php
public function test_no_development_providers_in_production(): void
{
    $app = $this->createApplication();
    $app->useEnvironmentPath(realpath(__DIR__.'/../../'));
    $app->loadEnvironmentFrom('.env.testing');
    putenv('APP_ENV=production');
    (new \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables)->bootstrap($app);

    $providers = $app->getProviders(ServiceProvider::class);
    $blocked = ['Debugbar', 'Telescope', 'Clockwork', 'IdeHelper'];

    foreach ($providers as $provider) {
        foreach ($blocked as $b) {
            $this->assertFalse(
                str_contains(get_class($provider), $b),
                "Development provider registered in production: " . get_class($provider)
            );
        }
    }
}
```
---
## Exceptions
Applications running in staging/demo environments that intentionally include development tooling behind IP-restricted middleware should document each exception explicitly.
---
## Consequences Of Violation
Sensitive data leaked to end users; security audit findings; compliance violations; increased attack surface; config values and queries exposed.

## Rule 6: Prefer a Real Application Container Over Mocks for `register()` Tests
---
## Category
Testing
---
## Rule
Use `new Application()` or a minimal test application instance for `register()` tests instead of mocking the container.
---
## Reason
Mocked containers don't behave like real containers — `bind()`, `singleton()`, and `bound()` may not work as expected. A real container provides accurate test feedback and requires no mock setup overhead.
---
## Bad Example
```php
public function test_register(): void
{
    $container = $this->createMock(Container::class);
    $container->expects($this->once())->method('bind');
    $provider = new PaymentServiceProvider($container);
    $provider->register();
    // Mock verifies bind() was called, but doesn't test binding actually works
}
```
---
## Good Example
```php
public function test_register(): void
{
    $app = new Application(realpath(__DIR__.'/../../'));
    $provider = new PaymentServiceProvider($app);
    $provider->register();

    $this->assertTrue($app->bound(PaymentGateway::class));
}
```
---
## Exceptions
When testing a provider's interaction with the container in unusual ways (e.g., verifying that specific methods are called with specific arguments) — but prefer real container for most cases.
---
## Consequences Of Violation
Tests pass with mock but provider fails in production; mock setup is brittle and breaks on refactoring; false confidence in test coverage; missed integration bugs.
