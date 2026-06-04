## Never Attempt to Run Reverb on Serverless Platforms
---
## Architecture
---
Never attempt to run Laravel Reverb on AWS Lambda, Vapor, or other serverless platforms that don't support long-running processes.
---
Reverb is a long-running PHP process built on ReactPHP's event loop. Serverless functions are invoked per-request and have no persistent memory. These models are fundamentally incompatible.
---
```env
# Attempting Reverb on Vapor — fails to deploy
BROADCAST_CONNECTION=reverb
```
---
```env
# Vapor deployment — use managed WebSocket service
BROADCAST_CONNECTION=pusher
VAPOR_BROADCAST=true
```
---
Cloudflare Workers (supports WebSocket natively). No common exceptions for Lambda/Vapor.
---
Deployment failure; broken real-time features.

## Always Use Managed WebSocket Service with Serverless Laravel
---
## Architecture
---
Always pair serverless Laravel (Vapor, Lambda) with a managed WebSocket service (Pusher, Ably, API Gateway) for real-time features.
---
Serverless functions handle stateless HTTP requests well but cannot maintain WebSocket connections. Managed services handle the stateful WebSocket layer; serverless functions handle auth and broadcast dispatch.
---
```env
# Serverless without WebSocket service — no real-time features
```
---
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=...
PUSHER_APP_KEY=...
VAPOR_BROADCAST=true
```
---
Applications not needing real-time features. No common exceptions for serverless + real-time.
---
No real-time capabilities; architectural dead end.

## Always Implement Connection Heartbeat for API Gateway
---
## Reliability
---
Always send periodic heartbeat messages when using AWS API Gateway WebSocket to prevent 10-minute idle timeout disconnection.
---
API Gateway WebSocket connections have a 10-minute idle timeout. Without heartbeats, connections are silently dropped, and clients only discover the issue when they miss events.
---
```javascript
// No heartbeat — connections drop at 10 minutes
```
```javascript
// Periodic heartbeat to prevent timeout
setInterval(() => {
    Echo.connector.pusher.connection.send('ping');
}, 300000); // Every 5 minutes
```
---
API Gateway deployments with continuous message traffic. No common exceptions for idle connections.
---
Silent disconnections; missed events after idle period.

## Always Account for Cold Start Latency in Auth Endpoint
---
## Performance
---
Always design reconnection strategies to handle the increased latency of serverless auth endpoints during cold starts.
---
Serverless functions have cold start latency of 500ms+. During reconnection storms, cold starts compound and auth responses become orders of magnitude slower, causing subscription failures.
---
```javascript
// Standard backoff — doesn't account for cold start delay
```
```javascript
// Extended backoff for serverless auth
function reconnectDelay(attempt) {
    const base = Math.min(60000, 2000 * Math.pow(2, attempt)); // Starts at 2s
    return base + Math.random() * 2000; // Extra jitter for cold starts
}
```
---
Provisioned concurrency environments with no cold starts. No common exceptions.
---
Auth timeouts; failed reconnections; cascading delays.

## Never Exceed API Gateway Message Size Limits
---
## Framework Usage
---
Always ensure broadcast payloads stay under API Gateway's 32KB message size limit.
---
API Gateway silently drops messages exceeding 32KB. Without error handling, broadcast events disappear with no indication to the sender or receiver.
---
```php
public function broadcastWith(): array {
    return ['data' => $largePayload]; // May exceed 32KB
}
```
---
```php
public function broadcastWith(): array {
    return ['summary' => 'Event occurred', 'id' => $this->id]; // Small payload
}
// Chunk large data via separate API calls if needed
```
---
Self-hosted Reverb deployments with no message size constraints. No common exceptions for API Gateway.
---
Silent message drops; missing broadcasts with no error indication.

## Always Have a Migration Path from Serverless to Self-Hosted
---
## Maintainability
---
Always document the migration path from serverless + managed WebSocket to self-hosted Reverb as the application grows.
---
Serverless real-time architectures hit limits at scale (connection caps, message volume limits, cost). Without a documented migration path, teams are locked into a platform that no longer meets requirements.
---
```php
// No migration plan — vendor lock-in risk
```
```php
/**
 * MIGRATION PATH: Serverless → Self-Hosted
 * 1. Update BROADCAST_CONNECTION from pusher to reverb
 * 2. Deploy Reverb behind Nginx on EC2
 * 3. Configure Supervisor and load balancer
 * 4. Update Echo config to point to new WebSocket host
 * No event or channel code changes needed
 */
```
---
Applications staying within serverless limits long-term. No common exceptions.
---
Vendor lock-in; inability to scale; costly infrastructure rewrite.
