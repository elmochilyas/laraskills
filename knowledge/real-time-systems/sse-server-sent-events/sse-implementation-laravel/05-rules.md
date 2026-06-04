## Always Set `Content-Type: text/event-stream` and Required Headers
---
## Framework Usage
---
Always set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `X-Accel-Buffering: no` headers on SSE endpoints.
---
Without these headers, the browser's `EventSource` API cannot parse the stream correctly, and Nginx/Proxies buffer the response, preventing real-time delivery.
---
```php
return response()->stream($callback); // Missing required headers
```
---
```php
return response()->stream($callback, 200, [
    'Content-Type' => 'text/event-stream',
    'Cache-Control' => 'no-cache',
    'X-Accel-Buffering' => 'no',
]);
```
---
No common exceptions; these headers are required for correct SSE behavior.
---
EventSource parsing errors; buffered delivery; non-functional SSE.

## Always Set a Maximum Connection Duration
---
## Performance
---
Always implement a connection duration ceiling (e.g., 60 seconds) on SSE streams instead of using `set_time_limit(0)`.
---
Without a duration ceiling, each SSE connection holds a PHP-FPM worker indefinitely. Workers accumulate until the pool is exhausted and the application stops responding to HTTP requests.
---
```php
set_time_limit(0); // Worker held forever
while (true) { /* stream loop */ }
```
---
```php
$maxDuration = 60;
$start = time();
while ((time() - $start) < $maxDuration) { /* stream loop */ }
// EventSource auto-reconnects with new worker
```
---
Non-FPM deployments (Octane, Swoole). No common exceptions for PHP-FPM.
---
Worker pool exhaustion; HTTP request queuing; application outage.

## Always Check `connection_aborted()` in the Stream Loop
---
## Performance
---
Always check `connection_aborted()` in the SSE stream loop to stop processing when the client disconnects.
---
Without the check, the server continues generating and flushing events for disconnected clients, wasting CPU and memory on dead connections.
---
```php
while ((time() - $start) < $maxDuration) {
    // No connection check — works for disconnected clients
    echo "data: $data\n\n"; ob_flush(); flush();
}
```
---
```php
while ((time() - $start) < $maxDuration) {
    if (connection_aborted()) break; // Stop on disconnect
    echo "data: $data\n\n"; ob_flush(); flush();
}
```
---
No common exceptions; connection checks prevent resource waste.
---
CPU waste; memory leaks; degraded server performance.

## Always Implement Heartbeat Events
---
## Reliability
---
Always send periodic heartbeat comments (`: heartbeat\n\n`) in the SSE stream to prevent proxy timeouts.
---
Without heartbeats, proxies and load balancers with idle timeouts (60s default for Nginx) terminate the connection, causing unnecessary reconnection cycles.
---
```php
echo "data: $data\n\n"; // No heartbeat — proxy may time out
sleep(1);
```
---
```php
while (true) {
    echo "data: $data\n\n";
    echo ": heartbeat\n\n"; // Keeps connection alive
    ob_flush(); flush();
    sleep(1);
}
```
---
Connections to servers without proxy timeouts. No common exceptions for production.
---
Proxy timeout disconnections; frequent EventSource reconnections.

## Always Call `ob_flush()` and `flush()` After Each Event
---
## Framework Usage
---
Always call both `ob_flush()` and `flush()` after writing each SSE event to ensure immediate delivery.
---
Without flushing, data stays in PHP's output buffer and is delivered in large chunks instead of individual events, defeating SSE's real-time nature.
---
```php
echo "data: $data\n\n"; // Data stays in buffer — not delivered
sleep(1);
```
---
```php
echo "data: $data\n\n";
ob_flush(); flush(); // Force immediate delivery
sleep(1);
```
---
No common exceptions; flushing is required for SSE streaming.
---
Buffered delivery; delayed events; SSE appears non-functional.

## Always Implement Rate Limiting on SSE Endpoints
---
## Security
---
Always apply rate limiting to SSE endpoints to prevent connection exhaustion attacks.
---
SSE endpoints hold PHP-FPM workers for each connection. Without rate limiting, an attacker can exhaust the worker pool by opening many connections, effectively DoS-ing the application.
---
```php
Route::get('/events/stream', fn() => ...); // No rate limiting
```
---
```php
Route::get('/events/stream', fn() => ...)->middleware('throttle:10,1');
```
---
Internal-only SSE endpoints on trusted networks. No common exceptions for public endpoints.
---
Worker pool exhaustion; application-wide DoS vulnerability.

## Always Use `Last-Event-ID` for Missed Event Replay
---
## Reliability
---
Always include event IDs in SSE data and implement `Last-Event-ID` replay logic for missed events.
---
Without event IDs, reconnecting clients receive only future events. Events dispatched during the disconnection window are permanently lost.
---
```php
echo "data: " . json_encode($event) . "\n\n"; // No event ID — no replay
```
---
```php
echo "id: {$event['id']}\n";
echo "data: " . json_encode($event) . "\n\n"; // Client sends Last-Event-ID on reconnect
```
---
Applications where missed events are acceptable. No common exceptions for critical updates.
---
Event loss on reconnect; inconsistent client state.
