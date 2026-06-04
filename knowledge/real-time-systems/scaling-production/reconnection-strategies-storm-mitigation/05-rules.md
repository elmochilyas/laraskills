## Always Implement Jitter with Exponential Backoff
---
## Reliability
---
Always add full jitter to exponential backoff: `sleep(random(0, min(cap, base * 2^n)))`.
---
Exponential backoff alone produces synchronized retry waves — all clients retry at the same exponential intervals. Jitter breaks this synchronization, spreading reconnection load across time.
---
```javascript
// Backoff without jitter — synchronized retry waves
function delay(attempt) { return Math.min(30000, 1000 * Math.pow(2, attempt)); }
```
---
```javascript
// Full jitter — randomized retry times
function delay(attempt) {
    const base = Math.min(30000, 1000 * Math.pow(2, attempt));
    return Math.random() * base;
}
```
---
Applications with fewer than 50 concurrent connections (storm unlikely). No common exceptions.
---
Synchronized reconnection waves; repeated server overload.

## Always Apply `throttle` Middleware to the Auth Endpoint
---
## Security
---
Always apply rate-limiting middleware to `/broadcasting/auth` to protect against reconnection storms.
---
The auth endpoint is the choke point during storms. Without rate limiting, thousands of simultaneous auth requests overwhelm the application server, database, and queue system.
---
```php
Broadcast::routes(); // No rate limiting — vulnerable
```
---
```php
Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']]);
```
---
Public-channel-only applications. No common exceptions for private/presence channels.
---
Auth endpoint collapse; cascading application failure during storms.

## Always Use Rolling Deployments with Connection Draining
---
## Reliability
---
Never restart all Reverb instances simultaneously; use rolling deployments with connection draining (stopwaitsecs).
---
Simultaneous restart drops all WebSocket connections at once, triggering a full reconnection storm. Rolling deployments drain and restart instances one at a time.
---
```ini
# Supervisor — simultaneous restart
[program:reverb]
numprocs=3
stopwaitsecs=10  # Too short, all instances restart together
```
---
```ini
# Rolling restart with drain
[program:reverb]
numprocs=3
stopwaitsecs=60
# Deploy one instance at a time: supervisorctl restart reverb:reverb_01
```
---
Single-instance deployments. No common exceptions for multi-instance.
---
Full reconnection storms; auth endpoint overload; degraded UX.

## Always Pre-Warm Authorization Caches Before Planned Deployments
---
## Performance
---
Always pre-populate authorization caches before planned maintenance or deployments.
---
When all clients reconnect after a deployment, auth cache entries from the previous session may have expired, causing a cache stampede. Every auth request hits the database simultaneously.
---
```bash
# No cache pre-warming — stampede on reconnect
```
---
```bash
# Pre-warm critical auth paths
php artisan auth:cache-warm --channel=orders.{id}
```
---
No common exceptions for deployments; cache pre-warming is a critical mitigation.
---
Database overload; slow auth responses; cascading failure.

## Always Implement a Circuit Breaker for Auth Endpoint Errors
---
## Reliability
---
Always increase client backoff multiplier when the auth endpoint returns 429 or 503 status codes.
---
Without a circuit breaker, clients continue retrying at aggressive intervals even when the server is overloaded, preventing recovery. The server stays in a degraded state because it's still handling retries.
---
```javascript
// No circuit breaker — retries continue regardless of server response
```
---
```javascript
async function authenticate() {
    const response = await fetch('/broadcasting/auth');
    if (response.status === 429 || response.status === 503) {
        backoffMultiplier *= 2; // Reduce retry frequency
    }
}
```
---
Low-traffic applications. No common exceptions for high-traffic systems.
---
Server unable to recover from overload; extended outage.

## Always Configure `max_connections_per_ip` in Reverb
---
## Security
---
Always set a per-IP connection limit in Reverb configuration to prevent individual IP abuse and limit storm impact.
---
Without per-IP limits, a single compromised client or NAT gateway can exhaust the server's connection capacity, denying service to other users.
---
```php
// config/reverb.php — no per-IP limit
'apps' => [['max_connections_per_ip' => -1]],
```
---
```php
// Per-IP connection limit configured
'apps' => [['max_connections_per_ip' => 100]],
```
---
Trusted internal networks with known client counts. No common exceptions for public-facing apps.
---
IP-based resource exhaustion; single-source DoS vulnerability.
