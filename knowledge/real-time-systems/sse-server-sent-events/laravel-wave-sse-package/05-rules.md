## Always Configure Event Buffer TTL for Wave
---
## Reliability
---
Always set an event buffer with appropriate TTL in the Wave SSE configuration to prevent event loss on reconnect.
---
Without a buffer, events dispatched while a client is reconnecting are lost permanently. SSE's auto-reconnect feature is useless without buffered event replay.
---
```php
// No buffer configured — events lost on disconnect
```
---
```php
// config/wave.php
'buffer' => ['ttl' => 30], // Replay events from last 30 seconds
```
---
Applications where missed events are acceptable. No common exceptions for production.
---
Event loss on reconnect; inconsistent client state.

## Always Configure Redis for Multi-Server Wave Deployments
---
## Scalability
---
Always set up Redis pub/sub for Wave when running multiple application servers.
---
Without shared state, Wave events only reach clients connected to the server that dispatched the event. Clients connected to other servers never receive the broadcast.
---
```php
// Single server only — events lost on other servers
```
---
```php
// config/wave.php
'redis' => ['connection' => 'default'], // Cross-server event distribution
```
---
Single-server deployments. No common exceptions for multi-server.
---
Partial event delivery; inconsistent UI state across clients.

## Always Set `X-Accel-Buffering: no` for SSE Through Nginx
---
## Framework Usage
---
Always send the `X-Accel-Buffering: no` header from Wave/SSE endpoints when behind Nginx.
---
Nginx buffers response bodies by default. Without this header, SSE events are buffered and delivered in chunks rather than streamed in real-time, defeating the purpose of SSE.
---
```php
// Missing header — Nginx buffers SSE stream
```
---
```php
return response()->stream($callback)->header('X-Accel-Buffering', 'no');
```
---
Non-Nginx deployments (Apache, Caddy). No common exceptions for Nginx.
---
Delayed events; SSE appears non-functional.

## Never Use Wave for Bidirectional Features
---
## Architecture
---
Never use the Wave SSE package for features requiring client-to-server real-time communication (whispers, typing indicators).
---
Wave is unidirectional (server-to-client only). Client events and whispers require bidirectional WebSocket communication that SSE cannot provide.
---
```php
// Expecting client events to work with Wave
Echo.private('chat.1').whisper('typing', { isTyping: true }); // Silent failure
```
---
```php
// Use Reverb for bidirectional features
// Wave for server-to-client only
```
---
Pure notification/dashboard applications with no client events. No common exceptions.
---
Silent failure of client features; incomplete implementation.

## Always Monitor PHP-FPM Worker Pool for SSE Connections
---
## Maintainability
---
Always size PHP-FPM `pm.max_children` to accommodate expected SSE connections plus normal HTTP traffic.
---
Each SSE connection holds a PHP-FPM worker for its entire duration. Without adequate worker headroom, SSE connections starve HTTP request handling capacity.
---
```ini
pm.max_children = 10  // 5 SSE connections = 50% of workers consumed
```
---
```ini
pm.max_children = 50  // Sufficient headroom for SSE + HTTP traffic
```
---
Deployments using ReactPHP or other async runtimes (Octane). No common exceptions for PHP-FPM.
---
HTTP request queuing; degraded application responsiveness.

## Always Have a Fallback Plan for Wave Deprecation
---
## Maintainability
---
Always document a migration path from Wave to Reverb or native SSE in case the package becomes unmaintained.
---
Wave is a community package, not first-party Laravel. If development stops or a breaking change isn't fixed, the application's real-time infrastructure has no clear migration path.
---
```php
// No documented fallback — locked into unsupported package
```
---
```php
// In architecture docs:
// Fallback: migrate to native SSE endpoints or Reverb
```
---
Short-lived prototypes. No common exceptions for production applications.
---
Infrastructure deadlock; emergency migration under time pressure.
