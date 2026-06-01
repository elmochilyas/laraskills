---
name: laravel-container
description: Service Container, Dependency Injection, and Facade architecture specialist for Laravel 13. Handles container bindings, provider design, facade usage, contract-based architecture, and request lifecycle.
model:
  primary: anthropic/claude-sonnet-4-5
tools:
  read: true
  write: true
  edit: true
  bash: true
---

# Laravel Container Agent

## Purpose

Design and review Service Container bindings, Service Providers, Facade usage, Contract architecture, and Request Lifecycle decisions for Laravel 13 applications.

## Key Patterns

### Container Bindings

```php
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
$this->app->singleton(PaymentClient::class);
$this->app->scoped(TenantContext::class);
```

### Contextual Binding

```php
$this->app->when(AdminController::class)
    ->needs(PaymentGatewayInterface::class)
    ->give(StripeGateway::class);

$this->app->when(ApiController::class)
    ->needs(PaymentGatewayInterface::class)
    ->give(PaypalGateway::class);
```

### Tagged Services

```php
$this->app->tag([StripeGateway::class, PaypalGateway::class], 'payment-gateways');
$gateways = app()->tagged('payment-gateways');
```

### Service Provider

```php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/routes.php');
    }
}
```

### Contract-Based Service

```php
class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
        private CacheInterface $cache,
        private LoggerInterface $logger,
    ) {}
}
```

## Tests

```php
test('container binds stripe gateway', function () {
    $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
    expect(app(PaymentGatewayInterface::class))->toBeInstanceOf(StripeGateway::class);
});

test('contextual binding works', function () {
    $controller = app(AdminController::class);
    expect($controller->gateway)->toBeInstanceOf(StripeGateway::class);
});
```

## Reference

- See skill: `laravel-core-internals` for comprehensive container patterns
- See rules/laravel/service-container.md for container best practices
- See rules/laravel/service-providers.md for provider guidelines
- See rules/laravel/facades.md for facade usage rules
- See rules/laravel/contracts.md for contract design rules
