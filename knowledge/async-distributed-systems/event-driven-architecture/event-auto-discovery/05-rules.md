# Rule Card: K025 — Event Auto-Discovery via Directory Scanning

---

## Rule 1

**Rule Name:** run-event-cache-in-production

**Category:** Always

**Rule:** Always run `php artisan event:cache` in production.

**Reason:** Without caching, the filesystem is scanned on every request, adding 5-15ms to boot time.

**Bad Example:**
```bash
# No event:cache in deployment — filesystem scanned on every request
```

**Good Example:**
```bash
# Deploy script
php artisan event:cache
```

**Exceptions:** Development environments where frequent listener changes make caching impractical.

**Consequences Of Violation:** Every request pays 5-15ms filesystem scanning overhead — at 1000 requests/second, that's 5-15 seconds of CPU time per second wasted on discovery.

---

## Rule 2

**Rule Name:** add-event-cache-to-deployment

**Category:** Always

**Rule:** Always add `event:cache` to the deployment script.

**Reason:** Without regenerating the cache, new listeners from the deploy won't fire — the old cached mapping is still active.

**Bad Example:**
```bash
# Deployment — no event:cache
git pull
# New listeners never fire — old cache still active
```

**Good Example:**
```bash
# Deployment
git pull
php artisan event:cache
```

**Exceptions:** Deployments that don't add or modify any listeners.

**Consequences Of Violation:** New listeners silently don't fire — the feature depending on the event handler appears broken, but debugging shows the event is dispatched correctly.

---

## Rule 3

**Rule Name:** one-event-per-listener

**Category:** Always

**Rule:** Always keep listeners focused on one event — one `handle()` method per class.

**Reason:** The scanner maps the first discovered `handle()` or `__invoke()` method — multiple methods are ignored.

**Bad Example:**
```php
class OrderListener
{
    public function handle(OrderShipped $event): void { ... }
    public function handle(OrderPaid $event): void { ... } // Silent duplicate — ignored
}
```

**Good Example:**
```php
class SendShipmentNotification
{
    public function handle(OrderShipped $event): void { ... }
}

class UpdateAccounting
{
    public function handle(OrderPaid $event): void { ... }
}
```

**Exceptions:** Event subscribers (which use `subscribe()` not auto-discovery) can handle multiple events.

**Consequences Of Violation:** Only one of the events is handled — the second `handle()` is silently ignored with no error or warning.

---

## Rule 4

**Rule Name:** no-skip-event-cache-for-convenience

**Category:** Never

**Rule:** Never skip `event:cache` in production for convenience.

**Reason:** Every request pays the filesystem scanning cost — the cache is a one-time effort that eliminates it permanently.

**Bad Example:**
```bash
# "Auto-discovery is good enough" — skipping event:cache
```

**Good Example:**
```bash
php artisan event:cache
# Consistent <1ms boot time, always
```

**Exceptions:** None — there is no valid reason to skip `event:cache` in production.

**Consequences Of Violation:** 5-15ms overhead on every request — at scale, this is wasted CPU that could be serving more requests.
