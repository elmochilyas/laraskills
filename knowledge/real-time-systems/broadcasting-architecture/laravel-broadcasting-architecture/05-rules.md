## Always Run a Queue Worker for Broadcast Events
---
## Framework Usage
---
Always run a queue worker when using broadcasting.
---
Without a queue worker, broadcast events are queued but never dispatched by `BroadcastEvent` jobs, leaving clients without real-time updates.
---
```bash
php artisan reverb:start
# No queue worker running — broadcasts silently fail
```
---
```bash
php artisan queue:work --queue=broadcasts
php artisan reverb:start
```
---
Local development with `QUEUE_CONNECTION=sync` bypasses queue requirement.
---
Silent broadcast failures; stale real-time data.

## Never Use `ShouldBroadcastNow` as the Default for All Events
---
## Performance
---
Avoid `ShouldBroadcastNow` for routine broadcasts; reserve it for latency-critical events only.
---
`ShouldBroadcastNow` bypasses the queue entirely, making the HTTP response wait for WebSocket publishing. This degrades response times and couples request lifecycle to broadcast availability.
---
```php
class AllEvents implements ShouldBroadcastNow { /* all events bypass queue */ }
```
---
```php
class LatencyCriticalEvent implements ShouldBroadcastNow { /* only when <10ms matters */ }
```
---
When you need sub-100ms delivery for a specific event and accept the HTTP latency trade-off.
---
Degraded HTTP response times; request queuing under broadcast load.

## Always Override `broadcastWith()` to Control Payload
---
## Security
---
Always define `broadcastWith()` on broadcast events instead of relying on public property serialization.
---
Public properties auto-serialize, potentially exposing internal objects, loaded relationships, or sensitive data to all channel subscribers.
---
```php
class OrderShipped implements ShouldBroadcast {
    public function __construct(public Order $order) {}
    // $order->internal_notes is broadcast automatically
}
```
---
```php
class OrderShipped implements ShouldBroadcast {
    public function broadcastWith(): array {
        return ['order_id' => $this->order->id, 'status' => $this->order->status];
    }
}
```
---
When the event has no sensitive data and all public properties are safe to expose.
---
Data leakage; exposure of internal model state to clients.

## Configure a Dedicated Queue Connection for Broadcasts
---
## Scalability
---
Prefer a dedicated queue connection for broadcast events to prevent broadcast backlog from starving other job types.
---
A flood of broadcast events can fill the default queue, delaying email dispatch, notification processing, and other critical jobs.
---
```php
// All jobs share the same queue
class OrderShipped implements ShouldBroadcast { /* default queue */ }
```
---
```php
class OrderShipped implements ShouldBroadcast {
    public function broadcastQueue(): string { return 'broadcasts'; }
}
```
---
Low-volume applications where broadcast events are infrequent. No common exceptions.
---
Queue contention; delayed critical jobs during broadcast spikes.

## Always Apply Auth Middleware and Rate Limiting to `Broadcast::routes()`
---
## Security
---
Always apply authentication and rate-limiting middleware when registering `Broadcast::routes()`.
---
Without middleware, unauthenticated users can access the `/broadcasting/auth` endpoint, and attackers can flood it with requests.
---
```php
Broadcast::routes(); // No auth or rate limiting
```
---
```php
Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']]);
```
---
Public-channel-only applications that never use private or presence channels.
---
Unauthorized channel access; auth endpoint DoS vulnerability.

## Prefer Environment-Driven Broadcast Driver Selection
---
## Maintainability
---
Never hardcode the broadcast driver in application code; configure it via `config/broadcasting.php` with env-driven selection.
---
Hardcoding ties the application to a specific provider, requiring code changes to switch between Reverb, Pusher, or Ably across environments.
---
```php
config(['broadcasting.default' => 'reverb']); // Hardcoded
```
---
```php
// config/broadcasting.php
'default' => env('BROADCAST_CONNECTION', 'reverb'),
```
---
No common exceptions; env-driven configuration is always preferred.
---
Inflexible deployments; environment-specific bugs; harder testing.

## Use `ShouldDispatchAfterCommit` for Transaction-Dependent Broadcasts
---
## Reliability
---
Always implement `ShouldDispatchAfterCommit` on events that should only broadcast after the database transaction commits.
---
Broadcasting within an uncommitted transaction sends stale or incomplete data to clients. If the transaction rolls back, clients have already seen phantom data.
---
```php
class OrderCreated implements ShouldBroadcast { /* dispatched before commit */ }
```
---
```php
class OrderCreated implements ShouldBroadcast, ShouldDispatchAfterCommit { /* waits for commit */ }
```
---
Events that don't depend on database state. No common exceptions.
---
Clients see phantom data; inconsistent UI state after rollbacks.

## Always Use `toOthers()` with `X-Socket-ID` for Sender Exclusion
---
## Design
---
Always combine `broadcast()->toOthers()` with the `X-Socket-ID` header to prevent the event initiator from receiving redundant updates.
---
Without sender exclusion, the user who triggered an action receives their own update, causing duplicate UI updates and wasted processing.
---
```php
event(new MessageSent($message)); // Sender also receives the event
```
---
```php
broadcast(new MessageSent($message))->toOthers(); // Sender excluded
```
---
Admin panels where the initiator should see their own action reflected immediately. No common exceptions.
---
Duplicate notifications; wasted bandwidth; poor UX for the acting user.

## Never Broadcast on Public Channels for User-Specific Data
---
## Security
---
Never use public channels for data that should be scoped to a specific user or group.
---
Public channels require no authorization — any connected WebSocket client can subscribe and receive all events broadcast to that channel.
---
```php
return [new Channel('user.'.$this->userId)]; // Public — anyone can listen
```
---
```php
return [new PrivateChannel('user.'.$this->userId)]; // Authorized access only
```
---
Global announcements, system status messages, or public dashboards intended for all users.
---
Unauthorized data access; PII exposure; compliance violations.

## Monitor Queue Backlog with Horizon or Pulse
---
## Maintainability
---
Always monitor broadcast queue backlog using Horizon or Pulse to detect broadcast processing delays.
---
A growing broadcast queue backlog indicates queue worker starvation or driver issues. Without monitoring, broadcast failures go undetected until users report stale data.
---
```bash
# No monitoring configured — backlog invisible
```
---
```php
// config/pulse.php with horizon or pulse
'recorders' => [
    \Laravel\Pulse\Recorders\Queues::class => ['enabled' => true],
],
```
---
1-connection development environments. No common exceptions.
---
Undetected broadcast failures; stale real-time data in production.
