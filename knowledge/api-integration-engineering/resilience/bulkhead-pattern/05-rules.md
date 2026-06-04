## Use Separate Guzzle Client/Connector Per Service
---
## Category
Reliability
---
## Rule
Create a separate Guzzle client (or Saloon connector) instance per external service, each with its own connection pool.
---
## Reason
A shared client means all services share the same connection pool; a latency spike in one service exhausts the pool, starving all other services.
---
## Bad Example
```php
// Single shared Guzzle client
$client = new Client();
$stripeResponse = $client->get('https://api.stripe.com/...');
$mailgunResponse = $client->get('https://api.mailgun.net/...'); // blocked if Stripe slow
```
---
## Good Example
```php
class StripeConnector extends Connector { // own connection pool
    protected function defaultHandler(): HandlerStack { return HandlerStack::create(CurlMultiHandler::create(['max_handles' => 5])); }
}
class MailgunConnector extends Connector { // own connection pool
    protected function defaultHandler(): HandlerStack { return HandlerStack::create(CurlMultiHandler::create(['max_handles' => 5])); }
}
```
---
## Exceptions
Very low-traffic applications where resource contention is impossible.
---
## Consequences Of Violation
Cascading failures: one service's latency exhausts the shared pool, blocking all outbound HTTP calls.
## Configure Connection Pool Limits Per Service
---
## Category
Reliability
---
## Rule
Set maximum concurrent connections per service pool (2-10 typical) via Guzzle's CurlMultiHandler.
---
## Reason
Unbounded pools exhaust OS file descriptors, causing EMFILE errors and application crashes.
---
## Bad Example
```php
$client = new Client(['handler' => HandlerStack::create()]); // default — unlimited
```
---
## Good Example
```php
$handler = CurlMultiHandler::create(['max_handles' => 5]);
$stack = HandlerStack::create($handler);
$client = new Client(['handler' => $stack]);
```
---
## Exceptions
Very low-traffic services where limits won't be reached.
---
## Consequences Of Violation
Socket exhaustion under load, EMFILE errors, application crash.
## Assign Dedicated Queue Workers Per Critical Integration
---
## Category
Scalability
---
## Rule
Route each critical integration's jobs to a dedicated Redis queue with its own Horizon worker pool.
---
## Reason
A backlog on one integration (e.g., webhook storm) should not delay processing of other integrations (e.g., payments).
---
## Bad Example
```php
ProcessStripeWebhook::dispatch($data); // all integrations on default queue
```
---
## Good Example
```php
ProcessStripeWebhook::dispatch($data)->onQueue('stripe');
ProcessMailgunEmail::dispatch($email)->onQueue('mailgun');
// config/horizon.php with separate worker pools per queue
```
---
## Exceptions
Non-critical integrations where best-effort processing is acceptable.
---
## Consequences Of Violation
Webhook backlog delays payment processing, cross-service contention, revenue impact from delayed critical jobs.
## Isolate Critical from Non-Critical Workers
---
## Category
Architecture
---
## Rule
Place critical integration workers (payments) in a separate process pool from non-critical (analytics, logging).
---
## Reason
A non-critical integration crash or resource leak should not affect payment processing availability.
---
## Bad Example
```php
// All integrations share the same Horizon worker pool
```
---
## Good Example
```php
// config/horizon.php
'environments' => [
    'production' => [
        'payments' => ['connection' => 'redis', 'queue' => ['payments'], 'balance' => 'auto', 'processes' => 3],
        'integrations' => ['connection' => 'redis', 'queue' => ['analytics', 'logging'], 'balance' => 'false', 'processes' => 1],
    ],
],
```
---
## Exceptions
Non-production environments where isolation isn't warranted.
---
## Consequences Of Violation
Non-critical job crash takes down payment workers, revenue impact during non-critical job failures.
## Monitor Per-Service Pool Utilization
---
## Category
Observability
---
## Rule
Track connection pool utilization and exhaustion rates per service for capacity planning and incident detection.
---
## Reason
Rising utilization indicates growing demand; exhaustion indicates the pool limit is too low or a service is degrading.
---
## Bad Example
```php
// No pool monitoring — connection exhaustion surprises in production
```
---
## Good Example
```php
Metrics::gauge('connections.active.stripe', $stripePool->activeConnections());
Metrics::gauge('connections.available.stripe', $stripePool->availableConnections());
```
---
## Exceptions
Non-critical services where monitoring overhead isn't justified.
---
## Consequences Of Violation
Unexpected connection exhaustion under peak load, no data for capacity planning, reactive vs proactive scaling.
