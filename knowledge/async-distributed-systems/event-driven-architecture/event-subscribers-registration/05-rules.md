# Rule Card: K027 — Event Subscribers and Manual Registration

---

## Rule 1

**Rule Name:** subscribers-in-subscribe-array

**Category:** Always

**Rule:** Always register subscribers in the `$subscribe` array, not `$listen`.

**Reason:** Putting a subscriber in `$listen` tries to instantiate it as a direct listener class — the `subscribe()` method is never called.

**Bad Example:**
```php
protected $listen = [
    OrderShipped::class => [
        OrderEventSubscriber::class, // Mistake — subscriber never works
    ],
];
```

**Good Example:**
```php
protected $subscribe = [
    OrderEventSubscriber::class, // Correct — subscribe() is called
];
```

**Exceptions:** None — subscribers and direct listeners use different registration mechanisms.

**Consequences Of Violation:** The subscriber's `subscribe()` method is never called — none of its event handlers are registered, and all events it was supposed to handle silently go unhandled.

---

## Rule 2

**Rule Name:** subscriber-handlers-public

**Category:** Always

**Rule:** Always make subscriber handler methods `public`.

**Reason:** The dispatcher calls subscriber methods using class method strings — PHP only allows calling public methods this way.

**Bad Example:**
```php
class OrderEventSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(OrderShipped::class, [$this, 'onOrderShipped']);
    }

    private function onOrderShipped(OrderShipped $event): void { ... } // Private — callable error
}
```

**Good Example:**
```php
class OrderEventSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(OrderShipped::class, [$this, 'onOrderShipped']);
    }

    public function onOrderShipped(OrderShipped $event): void { ... } // Public — works
}
```

**Exceptions:** Closure handlers inside `subscribe()` don't have visibility constraints.

**Consequences Of Violation:** PHP throws a "Callable" error when the dispatcher tries to invoke the private method — the event handler silently fails.

---

## Rule 3

**Rule Name:** recache-after-subscriber-change

**Category:** Always

**Rule:** Always run `event:cache` after adding or modifying a subscriber.

**Reason:** Subscriber-registered listeners are included in the cached mapping — without regeneration, new handlers don't fire.

**Bad Example:**
```bash
# Added new subscriber — no event:cache
# Handlers never fire — old cache still active
```

**Good Example:**
```bash
php artisan event:cache
# Subscriber handlers are now compiled into the cache
```

**Exceptions:** Development environments where caching is impractical.

**Consequences Of Violation:** The new subscriber's handlers silently never fire — debugging shows the subscriber is registered, but the cached mapping doesn't include its handlers.

---

## Rule 4

**Rule Name:** keep-subscribers-domain-focused

**Category:** Prefer

**Rule:** Prefer keeping subscribers focused on one domain.

**Reason:** Subscribers handling both Order and Inventory events violate cohesion — unrelated events in one subscriber obscure the event flow.

**Bad Example:**
```php
class AllEventsSubscriber // Handles orders, payments, inventory, users — too broad
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(OrderShipped::class, [$this, 'onOrderShipped']);
        $events->listen(InventoryLow::class, [$this, 'onInventoryLow']);
        $events->listen(PasswordReset::class, [$this, 'onPasswordReset']);
    }
}
```

**Good Example:**
```php
class OrderEventSubscriber // Focused on one domain
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(OrderShipped::class, [$this, 'onOrderShipped']);
        $events->listen(OrderPaid::class, [$this, 'onOrderPaid']);
    }
}
```

**Exceptions:** Cross-cutting infrastructure subscribers (logging, metrics) may span multiple domains by design.

**Consequences Of Violation:** A subscriber grows beyond 10 handlers — any single change to the subscriber risks breaking unrelated event handling paths.
