---
paths:
  - "**/*.php"
---

# Laravel 13 Contract Rules

> This file extends [common/patterns.md](../common/patterns.md) with Contract-specific rules.

## Interface-First Design

Business services depend on contracts, not concrete implementations:

```php
class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway,  // Contract
    ) {}
}
```

## When to Create Interfaces

| Condition | Example |
|-----------|---------|
| Multiple implementations exist | PaymentGateway, Cache, Mailer |
| Future implementations expected | SmsProvider, SearchEngine |
| External services may change | GeoLocationApi |
| Testing requires swapping | All external integrations |

**Do NOT** create interfaces for classes with a single, stable implementation:

```php
// BAD
interface UserServiceInterface {}
class UserService implements UserServiceInterface {}

// GOOD
class UserService {}
```

## Liskov Substitution Principle

All implementations of an interface must support the same operations:

```php
// BAD — gateway throws "not supported" on refund
interface PaymentGatewayInterface {
    public function refund(string $transactionId): RefundResult;
}

class PaypalGateway implements PaymentGatewayInterface {
    public function refund(string $transactionId): RefundResult {
        throw new \Exception('Not supported');  // BREAKS LSP
    }
}
```

If some implementations cannot support an operation, the interface needs redesign.

## Swappable Implementations

Services must never know which implementation is in use. The container decides:

```php
// Testing: swap to fake
$this->app->instance(PaymentGatewayInterface::class, new FakePaymentGateway);
```

## Preferred Laravel Contracts

Use these over facades in business code:

```php
use Illuminate\Contracts\Cache\Repository as CacheInterface;
use Illuminate\Contracts\Mail\Mailer as MailerInterface;
use Illuminate\Contracts\Queue\Queue as QueueInterface;
use Illuminate\Contracts\Bus\Dispatcher as BusDispatcherInterface;
use Illuminate\Contracts\Log\Log as LogInterface;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcherInterface;
```

## See Also

- Skill: `laravel-core-internals` for contract-based architecture
- Skill: `laravel-tdd` for testing with contracts
- Rule: `rules/laravel/service-container.md` for binding interfaces
- Rule: `rules/laravel/facades.md` for facade alternatives
