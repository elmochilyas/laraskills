# Rule Card: K003 — QueueManager and Connector Pattern

---

## Rule 1

**Rule Name:** custom-connectors-must-return-full-contract

**Category:** Always

**Rule:** Always ensure custom connectors return a full `Queue` contract implementation.

**Reason:** All framework code (Worker, dispatch, commands) depends on the Queue contract — missing methods cause runtime errors on first operation.

**Bad Example:**
```php
class CustomConnector implements ConnectorInterface
{
    public function connect(array $config): CustomQueue
    {
        return new CustomQueue(); // Must implement Queue contract fully
    }
}
```

**Good Example:**
```php
class CustomQueue implements Queue
{
    public function push($job, $data = '', $queue = null) { ... }
    public function pop($queue = null) { ... }
    public function delete($queue, $id) { ... }
    public function release($queue, $job, $delay) { ... }
    public function size($queue = null) { ... }
    // ... all Queue contract methods implemented
}
```

**Exceptions:** None — partial Queue implementations cause unrecoverable runtime errors.

**Consequences Of Violation:** The first push, pop, or release operation crashes with a "method not implemented" error — in production, this means silent job loss.

---

## Rule 2

**Rule Name:** register-drivers-in-service-provider

**Category:** Always

**Rule:** Always register custom queue drivers in a service provider's `boot()` method, not in routes.

**Reason:** Service provider boot runs before middleware and controllers — the driver is registered before any queue operations happen.

**Bad Example:**
```php
// In routes/web.php
Queue::extend('custom', function () { ... }); // May not be loaded when queue resolves
```

**Good Example:**
```php
// In AppServiceProvider::boot()
public function boot(): void
{
    Queue::extend('custom', function () { ... });
}
```

**Exceptions:** Very late-bound queue resolution (e.g., queuing only in a rarely-called command) may tolerate route-based registration, but provider registration is always safer.

**Consequences Of Violation:** When the queue manager resolves the `custom` connection, the connector isn't registered — "Driver [custom] is not supported" error in production.

---

## Rule 3

**Rule Name:** lazy-connect-in-custom-drivers

**Category:** Prefer

**Rule:** Prefer lazy connections in custom queue drivers — defer TCP/HTTP connects inside `connect()`, not in the constructor.

**Reason:** The manager creates connector instances eagerly — a lazy connect avoids establishing backends that may never be used.

**Bad Example:**
```php
class CustomConnector implements ConnectorInterface
{
    public function __construct()
    {
        $this->client = new HttpClient('https://queue.example.com'); // Connected on construction
    }
}
```

**Good Example:**
```php
class CustomConnector implements ConnectorInterface
{
    public function connect(array $config): CustomQueue
    {
        $client = new HttpClient($config['endpoint']); // Connected only when used
        return new CustomQueue($client);
    }
}
```

**Exceptions:** When the backend connection is required for configuration validation, eager connection may be desirable during development.

**Consequences Of Violation:** Unused queue connections waste resources — in a multi-connection setup, every connection establishes a backend TCP/HTTP session on every request or worker start.

---

## Rule 4

**Rule Name:** one-connection-not-per-queue

**Category:** Never

**Rule:** Never create a new connection per queue name.

**Reason:** A single connection can host many queue names — separate connections per queue create unnecessary infrastructure overhead.

**Bad Example:**
```php
// config/queue.php — separate connections for each queue
'high' => ['driver' => 'redis', 'queue' => 'high'],
'default' => ['driver' => 'redis', 'queue' => 'default'],
'low' => ['driver' => 'redis', 'queue' => 'low'],
```

**Good Example:**
```php
// One connection, many queue names
'redis' => ['driver' => 'redis', 'queue' => 'default'],
```

**Exceptions:** Separate connections are justified when using different driver types (e.g., Redis for latency-sensitive, SQS for bulk) or fully isolated Redis instances.

**Consequences Of Violation:** Infrastructure multiplication — separate TCP connection pools, separate Redis instances, and separate monitoring per queue, when a single instance serves all queues.
