## Use Unary gRPC from PHP; Avoid Streaming
---
## Category
Architecture
---
## Rule
Use only unary (request-response) gRPC calls from PHP; never implement streaming RPCs directly in PHP.
---
## Reason
PHP's synchronous model and per-request lifecycle don't support persistent streams; direct streaming causes resource leaks and hangs.
---
## Bad Example
```php
// Streaming RPC in PHP — will hang or leak resources
$call = $client->ServerStreamingRPC($request);
foreach ($call->responses() as $response) { ... }
```
---
## Good Example
```php
// Unary RPC only — safe for PHP
$response = $client->UnaryRPC($request);
```
---
## Exceptions
Streaming via Envoy proxy or dedicated streaming service.
---
## Consequences Of Violation
Resource leaks, hanging connections, worker exhaustion, application instability.
## Reuse gRPC Channels Across Requests
---
## Category
Performance
---
## Rule
Create one gRPC channel per target service and reuse it across requests; never create a new channel per request.
---
## Reason
Channel creation involves TCP + TLS handshake (10-50ms); reusing a channel amortizes this cost and maintains persistent HTTP/2 connection.
---
## Bad Example
```php
// New channel per request — costly handshakes
$client = new MyServiceClient('localhost:50051', ['credentials' => ...]);
```
---
## Good Example
```php
// Singleton channel — reused across requests
class GrpcChannelManager {
    private static array $channels = [];
    public static function get(string $service): Channel {
        if (!isset(self::$channels[$service])) {
            self::$channels[$service] = new Channel(...);
        }
        return self::$channels[$service];
    }
}
```
---
## Exceptions
None — always reuse channels.
---
## Consequences Of Violation
Excessive TLS handshake overhead, connection churn, increased latency, unnecessary load on target service.
## Set gRPC Deadlines on All Calls
---
## Category
Reliability
---
## Rule
Always set a deadline (timeout) on every gRPC call to prevent indefinite hangs.
---
## Reason
gRPC calls without deadlines can hang forever if the server becomes unresponsive, exhausting worker processes.
---
## Bad Example
```php
$response = $client->Charge($request); // no deadline — may hang forever
```
---
## Good Example
```php
$response = $client->Charge($request, ['deadline' => 30]); // 30s timeout
```
---
## Exceptions
None — always set deadlines on gRPC calls.
---
## Consequences Of Violation
Indefinite hangs on unresponsive server, worker exhaustion, cascading failures.
## Compile .proto Files in CI; Commit Generated Stubs
---
## Category
Code Organization
---
## Rule
Compile .proto files in CI and commit the generated PHP stubs to the repository; never regenerate on production.
---
## Reason
Committing stubs ensures reproducible builds and allows code review of changes; generating on production adds deployment dependency on protoc.
---
## Bad Example
```php
// Generation on production — fails if protoc not installed
```
---
## Good Example
```yaml
# CI: compile proto files and check for changes
- run: protoc --php_out=./generated *.proto
- run: git diff --exit-code ./generated # ensure stubs are up to date
```
---
## Exceptions
Continuous generation workflows with protoc available in all environments.
---
## Consequences Of Violation
Build failures in environments without protoc, unreproducible builds, review bypass for generated code changes.
## Keep REST Fallback for Environments Without gRPC Extension
---
## Category
Reliability
---
## Rule
Always implement a REST fallback path for environments where the gRPC PHP extension is unavailable.
---
## Reason
The gRPC extension may not be available in all environments (shared hosting, CI, local development); a REST fallback ensures consistent functionality.
---
## Bad Example
```php
// Only gRPC path — fails in environments without extension
```
---
## Good Example
```php
if (extension_loaded('grpc')) {
    $response = $client->Charge($request);
} else {
    $response = Http::post($restUrl, $data); // REST fallback
}
```
---
## Exceptions
Environments where gRPC extension installation is guaranteed.
---
## Consequences Of Violation
Complete failure in environments without gRPC extension, development and CI pipelines broken, blocking deployments.
## Handle gRPC Status Codes Explicitly
---
## Category
Reliability
---
## Rule
Handle gRPC status codes (OK, UNAVAILABLE, DEADLINE_EXCEEDED, etc.) explicitly; don't treat them as generic exceptions.
---
## Reason
gRPC status codes convey specific error semantics (UNAVAILABLE vs INVALID_ARGUMENT) that determine retry vs rejection behavior; generic handling misses this distinction.
---
## Bad Example
```php
try { $client->Charge($request); } catch (\Exception $e) { // retries everything
```
---
## Good Example
```php
try {
    $response = $client->Charge($request);
} catch (UnavailableException $e) {
    // Service unavailable — retry
} catch (DeadlineExceededException $e) {
    // Timeout — retry with backoff
} catch (InvalidArgumentException $e) {
    // Bad request — don't retry
}
```
---
## Exceptions
None — always map gRPC status codes to appropriate handling.
---
## Consequences Of Violation
Retrying non-retryable errors (INVALID_ARGUMENT) or not retrying retryable ones (UNAVAILABLE), incorrect error handling.
