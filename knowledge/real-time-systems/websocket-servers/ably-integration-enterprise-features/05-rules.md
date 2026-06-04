## Never Expose the Ably API Key in Client-Side Code
---
## Security
---
Always use server-generated token authentication for Ably client connections; never expose the `ABLY_KEY` in client-side code.
---
The `ABLY_KEY` provides full API access to your Ably application. Exposed in client-side code, it allows anyone to publish, subscribe, and manage channels without restriction.
---
```javascript
// API key exposed in client bundle — full access leaked
const ably = new Ably.Realtime('xVLyHw.api-key-here');
```
---
```php
// Server generates ephemeral token
$token = $ably->auth->createTokenRequest(['clientId' => $user->id]);
return response()->json($token);
```
---
Backend-only integrations with no client connections. No common exceptions for client-facing apps.
---
Full Ably API access leaked; unauthorized channel operations.

## Always Configure Message Retention Limits
---
## Maintainability
---
Always set explicit message retention policies on Ably channels to control storage costs.
---
Without retention limits, Ably stores all messages indefinitely, causing unbounded storage growth and escalating costs proportional to message volume.
---
```php
// No retention policy — unbounded storage and cost
```
```php
// Ably channel rules — set retention
'channels' => [
    'chat:*' => ['persistLast' => 10], // Keep last 10 messages
    'orders:*' => ['persist' => 3600],  // Keep for 1 hour
]
```
---
Applications not using message history features. No common exceptions.
---
Unbounded storage costs; performance degradation; surprise bills.

## Always Set `ABLY_LOG_LEVEL=error` in Production
---
## Performance
---
Always set `ABLY_LOG_LEVEL=error` in production environments to prevent performance degradation from verbose logging.
---
Ably's debug logging is extremely verbose, logging every API call, message send, and connection state change. In production, this creates significant I/O overhead and log noise.
---
```env
ABLY_LOG_LEVEL=debug  // Production performance impact
```
---
```env
ABLY_LOG_LEVEL=error  // Production — errors only
```
---
Development environments. No common exceptions for production.
---
Performance degradation; log flooding; disk I/O contention.

## Always Use Ably Webhooks for Presence and Error Monitoring
---
## Maintainability
---
Always configure Ably webhooks for presence events, channel lifecycle, and error state notifications.
---
Without webhooks, presence join/leave events and error conditions are invisible to the application. Issues like unauthorized connection attempts or channel limits go undetected.
---
```php
// No webhooks — blind to Ably events
```
```php
Route::post('/ably/webhook', function (Request $request) {
    foreach ($request->input('events') as $event) {
        Log::info('Ably event', $event);
        if ($event['type'] === 'channel.occupied') handleNewChannel($event);
    }
});
```
---
No common exceptions; webhooks provide essential operational visibility.
---
Undetected errors; missing presence events; operational blind spots.

## Never Use Laravel's Generic Broadcast Interface for Advanced Ably Features
---
## Framework Usage
---
Use Ably's native SDK for advanced features (Spaces, history, exactly-once) not exposed through Laravel's generic broadcasting interface.
---
Laravel's broadcasting abstraction provides a common interface but doesn't expose Ably-specific features. Assuming feature parity leads to attempts to use features that aren't available through the broadcast driver.
---
```php
// Attempting Ably Spaces through Laravel broadcast — not possible
broadcast(new AblySpaceUpdate($cursor)); // Spaces not in broadcast interface
```
---
```php
// Use Ably SDK directly for advanced features
$ably = new Ably\AblyRest(env('ABLY_KEY'));
$space = $ably->spaces->get('document-1');
$space->cursors->set($userId, $position);
```
---
Applications using only basic pub/sub. No common exceptions for advanced features.
---
Frustration with missing features; workarounds that bypass Laravel abstractions.
