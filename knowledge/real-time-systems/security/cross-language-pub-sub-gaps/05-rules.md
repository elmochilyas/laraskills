## Always Use a Laravel Broadcast Gateway for External Services
---
## Architecture
---
Always create a dedicated Laravel API endpoint for external services to publish broadcast events, instead of publishing directly to Redis or Pusher.
---
Directly publishing to Reverb's Redis channel or Pusher HTTP API from external services couples them to internal infrastructure. A gateway endpoint provides a stable contract, authentication, validation, and versioning.
---
```python
# Python service publishing directly to Redis — brittle
import redis
r = redis.Redis(host='reverb-redis')
r.publish('reverb-production', malicious_payload)
```
---
```python
# Python service publishing via Laravel gateway — stable
requests.post('https://api.example.com/broadcast', json={
    'api_key': 'scoped-key',
    'channel': 'orders',
    'event': 'Shipped',
    'payload': {'orderId': '123'}
})
```
---
No common exceptions; a gateway endpoint is always preferred over direct infrastructure access.
---
Brittle integration; internal schema exposure; security vulnerabilities.

## Never Expose Laravel Broadcast Credentials to External Services
---
## Security
---
Never share `REVERB_KEY`, `REVERB_SECRET`, or `PUSHER_APP_SECRET` with non-Laravel services.
---
Broadcast credentials grant full access to the WebSocket broadcasting system. External service compromise leads to the ability to broadcast arbitrary events to all connected clients.
---
```python
# Exposing broadcast secret to external service
PUSHER_APP_SECRET='s3cret'  // Compromised if external service is breached
```
---
```php
// Scoped API key in gateway endpoint
'gateway_key' => env('BROADCAST_GATEWAY_KEY'),  // Revocable, scoped
```
---
No common exceptions; broadcast credentials must never leave the Laravel application.
---
Full broadcast system compromise; arbitrary event injection.

## Always Validate External Event Payloads
---
## Security
---
Always validate and sanitize payloads from external services before broadcasting them.
---
External services may send malformed, oversized, or malicious payloads that crash echo clients, expose data, or inject XSS. Laravel's gateway must validate all incoming data.
---
```php
// No validation — external payload broadcast directly
broadcast(new ExternalEvent($request->all()));
```
---
```php
$validated = $request->validate([
    'channel' => 'required|string|regex:/^[a-zA-Z0-9\.]+$/',
    'event' => 'required|string|max:100',
    'payload' => 'required|array|max:10',
]);
broadcast(new ExternalEvent($validated));
```
---
Trusted external services on isolated networks. No common exceptions for internet-facing gateways.
---
Malformed payload crashes; XSS in broadcast data; oversized payload attacks.

## Always Version the External Broadcast API
---
## Maintainability
---
Always version the broadcast gateway endpoint (e.g., `/api/v1/broadcast`) to allow independent evolution.
---
Without versioning, changes to the broadcast payload format or authentication mechanism break all external consumers simultaneously. Versioning allows gradual migration.
---
```php
Route::post('/broadcast', ...); // Unversioned — breaking changes affect all consumers
```
---
```php
Route::prefix('api/v1')->group(function () {
    Route::post('/broadcast', [V1BroadcastController::class, '__invoke']);
});
```
---
Internal-only gateways with a single consumer. No common exceptions.
---
Breaking changes cascade; simultaneous consumer breakage.

## Always Log Cross-Language Broadcast Events for Audit
---
## Maintainability
---
Always log all broadcast events originating from external services for debugging and security auditing.
---
Without logging, diagnosing issues from external service integrations is nearly impossible. Events that fail validation, fail to broadcast, or contain unexpected payloads leave no trace.
---
```php
// No logging — undiagnosable failures
```
```php
Log::info('External broadcast', [
    'service' => $request->header('X-Service-Name'),
    'channel' => $validated['channel'],
    'event' => $validated['event'],
]);
```
---
No common exceptions; audit logging is essential for cross-language integrations.
---
Undiagnosable failures; security blind spots; debugging difficulty.
