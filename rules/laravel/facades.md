---
paths:
  - "**/*.php"
---

# Laravel 13 Facade Rules

> This file extends [common/patterns.md](../common/patterns.md) with Facade-specific rules.

## Allowed Usage

Facades are acceptable for infrastructure concerns:

```php
Cache::put('key', 'value', 3600);
Log::info('Order processed', ['id' => 1]);
DB::transaction(fn () => ...);
Event::dispatch(new OrderPlaced($order));
Queue::push(new SendEmail($user));
```

## Forbidden in Business Logic

```php
class OrderService
{
    public function process(Order $order): void
    {
        // FORBIDDEN — hidden dependencies, untestable
        Cache::put('order_' . $order->id, $order);
        Log::info('Processing order');
        Event::dispatch(new OrderProcessing($order));
    }
}
```

## Preferred Alternative

Inject Laravel contracts instead:

```php
use Illuminate\Contracts\Cache\Repository as CacheInterface;
use Illuminate\Contracts\Log\Log as LogInterface;

class OrderService
{
    public function __construct(
        private CacheInterface $cache,
        private LogInterface $logger,
    ) {}
}
```

## Hidden Dependency Rule

Every dependency must be visible through the constructor. Facades hide dependencies.

## Custom Facades

- **Allowed** in packages and framework abstractions
- **Avoid** in standard application code — use DI instead

## See Also

- Skill: `laravel-core-internals` for facade internals
- Skill: `laravel-tdd` for facade testing
- Rule: `rules/laravel/contracts.md` for contract-based alternatives
