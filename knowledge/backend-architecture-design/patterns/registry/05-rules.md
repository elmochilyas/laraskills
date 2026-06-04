## Rule 1: Use Registry to provide global access to well-known service instances
---
## Category
Architecture
---
## Rule
Registry holds well-known instances (e.g., database connection, request context) and makes them accessible from anywhere in the codebase.
---
## Reason
Registry provides a controlled global access point for instances that are needed throughout the application without passing them through every constructor.
---
## Bad Example
```php
// Global constant
define('DB_HOST', 'localhost');
```
---
## Good Example
```php
class Registry
{
    private static array $services = [];

    public static function set(string $key, object $service): void
    {
        self::$services[$key] = $service;
    }

    public static function get(string $key): ?object
    {
        return self::$services[$key] ?? null;
    }
}
```
---
## Exceptions
When DI container can manage all instances; Registry is a fallback for cases where DI is not possible.
---
## Consequences Of Violation
Hidden global dependencies, testing difficulty.
---
## Rule 2: Registry should not be used where DI is available
---
## Category
Architecture
---
## Rule
If the instance can be injected via constructor, prefer DI over Registry. Registry is for cross-cutting concerns that would pollute many constructors.
---
## Reason
Registry creates hidden global state, making testing and reasoning about code harder. DI is explicit.
---
## Bad Example
```php
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        $logger = Registry::get('logger'); // hidden dependency
        $logger->log('Order placed');
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private LoggerInterface $logger // explicit dependency
    ) {}
}
```
---
## Exceptions
Framework-level services (request object, application config) that are accessed pervasively.
---
## Consequences Of Violation
Hidden dependencies, untestable code, hard to trace.
---
## Rule 3: Thread-safe Registry access for concurrent environments
---
## Category
Reliability
---
## Rule
In concurrent environments (queues, async), ensure Registry access is thread-safe or use request-scoped containers.
---
## Reason
Static Registry can leak data between concurrent executions, causing hard-to-debug cross-request contamination.
---
## Bad Example
```php
class RequestRegistry
{
    private static array $data = [];

    public static function set(string $key, mixed $value): void
    {
        self::$data[$key] = $value; // not thread-safe
    }
}
```
---
## Good Example
```php
class RequestRegistry
{
    public function __construct(
        private array $data = []
    ) {}
    // Scoped to request via DI container
}
```
---
## Exceptions
When the Registry holds genuinely global (not request-scoped) data like application configuration.
---
## Consequences Of Violation
Data leakage between requests/threads, concurrency bugs.
"""
