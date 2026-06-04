## Always Default to SSE for Server-to-Client Real-Time
---
## Architecture
---
Always choose SSE over WebSocket when the application only needs server-to-client real-time data delivery.
---
Approximately 80% of real-time use cases are unidirectional (server to client). WebSocket adds infrastructure complexity (sticky sessions, upgrade handling, connection management) that SSE avoids by running over standard HTTP.
---
```php
// WebSocket for simple notification feed — over-engineered
// Reverb + Echo + queue worker required
```
---
```php
// SSE for server-to-client — simpler infrastructure
Route::get('/stream', fn() => response()->stream($callback, 200, [
    'Content-Type' => 'text/event-stream',
]));
```
---
Chat, collaborative editing, gaming, financial tickers requiring bidirectional <50ms latency.
---
Unnecessary infrastructure complexity; higher operational cost.

## Never Use WebSocket When SSE Post Pattern Suffices
---
## Architecture
---
Never default to WebSocket when client actions can be regular HTTP POST requests with SSE for server push.
---
The SSE + POST pattern achieves bidirectional-like behavior using standard HTTP for client actions and SSE for server push, avoiding WebSocket's infrastructure requirements entirely.
---
```php
// WebSocket for a simple "submit and receive update" pattern
```
---
```javascript
// SSE for push + POST for client actions
const source = new EventSource('/api/stream');
async function sendAction(data) {
    await fetch('/api/actions', { method: 'POST', body: JSON.stringify(data) });
}
```
---
Real-time chat, gaming, or any feature requiring sub-50ms bidirectional latency.
---
Unnecessary complexity; higher hosting and operational costs.

## Always Use HTTP/2 to Eliminate SSE's 6-Connection Limit
---
## Performance
---
Always deploy SSE over HTTP/2 to remove the browser's 6-connection-per-domain limit.
---
HTTP/1.1 browsers limit SSE to 6 concurrent connections per domain. HTTP/2 multiplexing removes this limit, making SSE viable for applications needing many simultaneous streams.
---
```php
// HTTP/1.1 SSE — limited to 6 connections per domain
```
---
```nginx
# HTTP/2 enabled — unlimited SSE connections
listen 443 ssl http2;
```
---
Internal enterprise applications on IE11 or legacy browsers without HTTP/2. No common exceptions.
---
SSE connection limits; inability to scale real-time features.

## Always Implement Progressive Enhancement for Transport Selection
---
## Reliability
---
Always implement transport fallback: start with WebSocket, fall back to SSE, then to long polling, based on browser capabilities.
---
Without fallback, users on restrictive networks, legacy browsers, or corporate proxies cannot use real-time features. The application fails silently with no real-time updates.
---
```javascript
// Single transport — fails for unsupported clients
const echo = new Echo({ broadcaster: 'reverb' });
```
---
```javascript
// Progressive transport selection
const transport = detectTransport(); // 'websocket' | 'sse' | 'long-polling'
const echo = new Echo({ broadcaster: transport });
```
---
Applications targeting only modern browsers with known WebSocket support. No common exceptions.
---
Broken real-time features for users on restrictive networks.

## Never Use Short Polling for Sub-10 Second Intervals
---
## Performance
---
Avoid short polling at intervals below 10 seconds; use SSE or long polling instead.
---
Short polling at <10s intervals generates massive redundant HTTP traffic. Most requests return no new data, wasting bandwidth and server resources proportionally to polling frequency.
---
```javascript
setInterval(fetchUpdates, 3000); // 20 requests/minute per client — wasteful
```
---
```javascript
const source = new EventSource('/api/stream'); // Push-based — no polling
```
---
Low-frequency updates (>30s intervals) where polling overhead is negligible. No common exceptions.
---
Excessive server load; bandwidth waste; poor mobile battery life.

## Always Consider Long Polling as Fallback Only
---
## Architecture
---
Always use long polling as a fallback transport for legacy browsers, never as the primary real-time transport.
---
Long polling consumes more memory (1.8 GB vs 0.4 GB at 10k connections), higher CPU (45% vs 5%), and delivers orders of magnitude higher latency (15,000ms vs 8ms) compared to WebSocket.
---
```javascript
// Long polling as primary — 375x higher latency at scale
```
---
```javascript
// Long polling as IE11 fallback only
try { new EventSource('/stream'); } catch {
    startLongPolling('/stream'); // Legacy fallback
}
```
---
Enterprise environments where IE11 is the only supported browser. No common exceptions.
---
Excessive resource consumption; poor latency at scale.
