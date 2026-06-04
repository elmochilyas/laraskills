## Rule 1: Use Singleton only when exactly one instance is required and globally accessible
---
## Category
Architecture
---
## Rule
Use Singleton only for truly global, stateless, or resource-constrained objects (e.g., a shared logger, a config registry). Prefer DI with shared instance for most cases.
---
## Reason
Singletons create hidden global state, make testing difficult, and introduce implicit coupling.
---
## Bad Example
```php
class DatabaseConnection
{
    private static ?self $instance = null;

    public static function getInstance(): self
    {
        return self::$instance ??= new self();
    }
}
// Called throughout the code
```
---
## Good Example
```php
// DI container manages single instance
$this->app->singleton(DatabaseConnection::class);

// Injected where needed
class OrderRepository
{
    public function __construct(
        private DatabaseConnection $db
    ) {}
}
```
---
## Exceptions
When the object is a pure utility (Logger) and DI would pass it through every single class.
---
## Consequences Of Violation
Hidden global state, untestable code, implicit coupling.
---
## Rule 2: Singletons must not hold mutable application state
---
## Category
Architecture
---
## Rule
If a Singleton holds mutable data (counters, flags, cached data), it becomes a global variable and is unsafe in concurrent or test environments.
---
## Bad Example
```php
class AppCache
{
    private array $data = [];

    public function set(string $key, $value): void { $this->data[$key] = $value; }
    public function get(string $key): mixed { return $this->data[$key] ?? null; }
}
```
---
## Good Example
```php
class Logger
{
    public function log(string $message, string $level = 'info'): void
    {
        // Pure functionality, no mutable state
    }
}
```
---
## Exceptions
Read-only configuration that is loaded once and never modified.
---
## Consequences Of Violation
Global mutable state, test pollution, concurrency bugs.
---
## Rule 3: Testability takes priority—favor DI over Singleton
---
## Category
Testing
---
## Rule
If using a Singleton prevents mocking or makes tests order-dependent, refactor to DI.
---
## Reason
Singletons make unit testing difficult because they cannot be replaced with mocks in test scenarios.
---
## Bad Example
```php
// Hard to test: UserService creates Singleton internally
class UserService
{
    public function register(array $data): void
    {
        $logger = Logger::getInstance(); // cannot mock
        $logger->log('User registered');
    }
}
```
---
## Good Example
```php
// Easy to test: Logger injected
class UserService
{
    public function __construct(
        private LoggerInterface $logger
    ) {}
}
// Test: inject mocked logger
```
---
## Exceptions
When the Singleton wraps a native resource (e.g., a file handle) that cannot be meaningfully mocked.
---
## Consequences Of Violation
Untestable code, order-dependent tests, mocking workarounds.
---
## Rule 4: Never create a Singleton that depends on other Singletons
---
## Category
Architecture
---
## Rule
Singletons calling other Singletons create a hidden dependency graph that is invisible without reading the implementation.
---
## Reason
Hidden dependencies make the code hard to understand, test, and refactor.
---
## Bad Example
```php
class OrderService
{
    public static function getInstance(): self
    {
        return self::$instance ??= new self(
            Logger::getInstance(), // hidden dependency
            Config::getInstance(), // hidden dependency
            Database::getInstance() // hidden dependency
        );
    }
}
```
---
## Good Example
```php
// DI container manages all dependencies explicitly
class OrderService
{
    public function __construct(
        private LoggerInterface $logger,
        private ConfigInterface $config,
        private DatabaseInterface $db
    ) {}
}
```
---
## Exceptions
None—this should always be refactored to DI.
---
## Consequences Of Violation
Hidden dependency graphs, tight coupling, impossible to test in isolation.
