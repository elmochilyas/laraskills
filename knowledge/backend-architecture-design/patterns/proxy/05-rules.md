## Rule 1: Proxy controls access to the real subject—use it for cross-cutting concerns
---
## Category
Architecture
---
## Rule
Use a Proxy to control access to a real subject when you need: lazy loading, access control, logging, caching, or remote communication without modifying the real subject.
---
## Reason
Proxy allows adding cross-cutting behavior without changing the real subject's code, respecting SRP and OCP.
---
## Bad Example
```php
class ExpensiveReport
{
    public function generate(): string
    {
        // Loads data eagerly even if never used
    }
}
```
---
## Good Example
```php
interface Report { public function generate(): string; }

class ExpensiveReport implements Report
{
    public function generate(): string { /* expensive */ }
}

class LazyReportProxy implements Report
{
    private ?ExpensiveReport $real = null;

    public function generate(): string
    {
        return ($this->real ??= new ExpensiveReport())->generate();
    }
}
```
---
## Exceptions
When the additional behavior can be added directly to the real subject (trivial case).
---
## Consequences Of Violation
Cross-cutting concerns mixed in real subject, SRP violation.
---
## Rule 2: Proxy implements the same interface as the real subject
---
## Category
Architecture
---
## Rule
The Proxy must implement the same interface as the real subject so that clients cannot distinguish between proxy and real subject.
---
## Reason
Clients that know about the proxy become coupled to the proxy infrastructure; interface transparency allows swapping proxy with real subject without client changes.
---
## Bad Example
```php
class CachedUserRepository
{
    // Does not implement UserRepository — different API
    public function getCached(int $id): ?User { /* ... */ }
}
```
---
## Good Example
```php
class CachedUserRepository implements UserRepository
{
    public function __construct(private UserRepository $real) {}

    public function find(int $id): ?User
    {
        return Cache::remember("user.$id", 3600, fn() =>
            $this->real->find($id)
        );
    }
}
```
---
## Exceptions
When the proxy adds behavior that is intentionally visible to the caller (e.g., cache hit/miss stats).
---
## Consequences Of Violation
Client knows about proxy, tight coupling to infrastructure.
---
## Rule 3: Use Virtual Proxy for lazy loading and Protection Proxy for access control
---
## Category
Architecture
---
## Rule
Virtual Proxy: delays creation/loading until needed. Protection Proxy: checks access before delegating.
---
## Reason
Each proxy type serves a distinct purpose; mixing concerns in one proxy violates SRP.
---
## Bad Example
```php
class OrderProxy
{
    // Does lazy loading AND access control AND logging
    // Three responsibilities in one class
}
```
---
## Good Example
```php
$order = new LazyOrderProxy($orderId);
$order = new AccessControlProxy($order, $request->user());
$order = new LoggingProxy($order);
// Decorated independently
```
---
## Exceptions
When the proxy concerns are intrinsically coupled (e.g., lazy loading that also checks permissions).
---
## Consequences Of Violation
SRP violation, hard-to-compose proxies.
