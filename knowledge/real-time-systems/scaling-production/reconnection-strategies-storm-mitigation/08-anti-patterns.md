# ECC Anti-Patterns — Reconnection Strategies & Storm Mitigation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Scaling & Production Architecture |
| **Knowledge Unit** | Reconnection Strategies & Storm Mitigation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Exponential Backoff Without Jitter (Synchronized Retry Waves)
2. No Rate Limiting on Auth Endpoint
3. Simultaneous Restart of All WebSocket Instances
4. No Cache Pre-Warming Before Deployments
5. No Circuit Breaker for Auth Endpoint Errors

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Exponential Backoff Without Jitter (Synchronized Retry Waves)

### Category
Reliability

### Description
Implementing exponential backoff for reconnection timing without adding jitter, causing all disconnected clients to still retry in synchronized waves that overwhelm the server.

### Warning Signs
- `setTimeout(reconnect, Math.min(30000, 1000 * Math.pow(2, attempt)))`
- Reconnection attempts spike in periodic waves
- Server overload correlates with retry intervals
- No `Math.random()` in backoff calculation

### Why It Is Harmful
Exponential backoff without jitter produces deterministic retry timing. All clients that disconnected simultaneously compute the same backoff values for the same attempt number (e.g., all retry at 1s, 2s, 4s, 8s, 16s, 30s). The retry traffic arrives in synchronized spikes at each backoff interval, still overwhelming the auth endpoint and WebSocket server. The retry wave pattern persists indefinitely, preventing recovery.

### Real-World Consequences
After a server restart, 5000 clients all disconnect simultaneously. They all compute: attempt 1 retry at 1s, attempt 2 at 2s, attempt 3 at 4s. The auth endpoint receives 5000 requests at 1s, 5000 at 2s, 5000 at 4s. Each wave overwhelms the server. Recovery takes 30+ seconds of continuous overload rather than a smooth distribution.

### Preferred Alternative
Add full jitter: `Math.random() * Math.min(cap, base * Math.pow(2, attempt))` — randomizes each retry time, spreading connections across the entire backoff window.

### Refactoring Strategy
1. Replace deterministic backoff with jittered backoff
2. Use: `const delay = Math.random() * Math.min(cap, base * Math.pow(2, attempt))`
3. Test by simulating mass disconnection and observing retry distribution
4. Verify peak auth endpoint load drops by orders of magnitude

### Detection Checklist
- [ ] No jitter in reconnection backoff
- [ ] Retry attempts arrive in synchronized waves
- [ ] Server overload at each backoff interval

### Related Rules
- (Rule: Always implement jitter with exponential backoff)

---

## Anti-Pattern 2: No Rate Limiting on Auth Endpoint

### Category
Security

### Description
Registering `Broadcast::routes()` or the `/broadcasting/auth` endpoint without rate-limiting middleware, leaving the auth endpoint unprotected during reconnection storms.

### Warning Signs
- `Broadcast::routes()` called without middleware
- `/broadcasting/auth` has no `throttle` middleware
- Auth endpoint is the first failure point during storms
- Database connection pool exhausts from auth queries

### Why It Is Harmful
During a reconnection storm, all clients simultaneously request channel authorization. Without rate limiting, the auth endpoint receives thousands of concurrent requests. Each request may execute authorization callbacks that query the database. The auth pipeline collapses — PHP-FPM workers exhaust, database connections max out, and the entire application becomes unresponsive.

### Real-World Consequences
5000 clients reconnect after a deployment. Each sends an auth request for their private/presence channels. Without rate limiting, 5000 auth requests hit the server simultaneously. PHP-FPM `pm.max_children=50` is exhausted. The auth endpoint returns 503 for all requests. Clients retry with backoff, but the server stays overloaded because every retry also hits the saturated endpoint.

### Preferred Alternative
Apply `throttle` middleware to `Broadcast::routes()` and tune the limit for expected reconnect rates.

### Refactoring Strategy
1. Update Broadcast routes: `Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']])`
2. Tune throttle limit based on expected concurrent users and reconnect window
3. Monitor auth endpoint response times during deployments
4. Verify 429 responses during simulated storms

### Detection Checklist
- [ ] No rate limiting on `/broadcasting/auth`
- [ ] Auth endpoint overload during reconnection events
- [ ] Database connection pool exhausts during storms

### Related Rules
- (Rule: Always apply throttle middleware to the auth endpoint)

---

## Anti-Pattern 3: Simultaneous Restart of All WebSocket Instances

### Category
Reliability

### Description
Restarting all Reverb/Soketi instances simultaneously during deployment, causing all WebSocket connections to drop at once and triggering a full reconnection storm.

### Warning Signs
- All Reverb instances restarted together in deploy script
- `supervisorctl restart reverb:*` called on all instances
- No connection draining configured
- Deployment coincides with reconnection storm

### Why It Is Harmful
When all instances restart simultaneously, every connected client is disconnected at the same moment. All clients then attempt to reconnect simultaneously, creating a full-scale reconnection storm. The auth endpoint, database, and WebSocket server all experience maximum load simultaneously. The simultaneous drop also means all in-flight broadcast events are lost.

### Real-World Consequences
A deployment script runs `supervisorctl restart reverb:*` on 3 instances simultaneously. 10,000 connected clients all drop. All 10,000 reconnect within 1-3 seconds (auth endpoint receives 10,000 requests/second). PHP-FPM exhausts. Database connections max out. Clients receive 503 errors and retry, extending the outage to 5+ minutes.

### Preferred Alternative
Use rolling deployments: restart instances one at a time with connection draining via `stopwaitsecs`.

### Refactoring Strategy
1. Configure `stopwaitsecs=60` in Supervisor
2. Restart instances sequentially: `supervisorctl restart reverb:reverb_01` then wait, `supervisorctl restart reverb:reverb_02`, etc.
3. During each restart, the remaining instances handle reconnecting clients
4. Verify peak reconnect rate drops to 1/numprocs of simultaneous restart rate

### Detection Checklist
- [ ] All Reverb instances restarted simultaneously
- [ ] No connection draining configured
- [ ] Reconnection storm correlates with deployments

### Related Rules
- (Rule: Always use rolling deployments with connection draining)

---

## Anti-Pattern 4: No Cache Pre-Warming Before Deployments

### Category
Performance

### Description
Not pre-populating authorization caches before planned deployments, causing a cache stampede when all reconnecting clients trigger auth callbacks simultaneously.

### Warning Signs
- Auth cache entries all expire during maintenance windows
- Database query spikes during reconnection after deployment
- No cache pre-warming step in deployment script
- Auth callbacks take 500ms+ during storms

### Why It Is Harmful
Authorization decisions are typically cached (e.g., "is user X authorized for channel Y?"). During normal operation, cache entries are warm. After a deployment, all clients reconnect and their cached auth decisions from the previous session may have expired. Every auth request misses the cache and queries the database. The database receives thousands of auth queries simultaneously — a cache stampede that can overwhelm the database connection pool.

### Real-World Consequences
A deployment takes 30 seconds. During this window, all channel auth cache entries (TTL 60s) from before the deployment expire. When 5000 clients reconnect, every auth request hits the database. 5000 simultaneous database queries. The database connection pool (max 150 connections) is saturated. Auth responses time out at 30 seconds.

### Preferred Alternative
Pre-warm auth caches during deployment before restarting Reverb instances, or use cache stampede prevention (mutex locks, early recomputation).

### Refactoring Strategy
1. Add a pre-warm step to the deployment script: `php artisan auth:cache-warm`
2. Verify cache entries exist before reconnection traffic arrives
3. Implement early recomputation for cache entries approaching expiry
4. Monitor cache hit ratio during reconnection

### Detection Checklist
- [ ] No cache pre-warming step in deployment
- [ ] Database query spikes during reconnection
- [ ] Auth cache TTL shorter than deployment duration

### Related Rules
- (Rule: Always pre-warm authorization caches before deployments)

---

## Anti-Pattern 5: No Circuit Breaker for Auth Endpoint Errors

### Category
Reliability

### Description
Not implementing a circuit breaker that increases client backoff when the auth endpoint returns 429 or 503, allowing retries to continue at aggressive intervals and prevent server recovery.

### Warning Signs
- Auth endpoint returns 429/503 but clients don't slow retries
- Server stuck in overload — retries prevent recovery
- No backoff multiplier adjustment based on server response
- Clients retry at same rate regardless of server status

### Why It Is Harmful
Without a circuit breaker, clients maintain their standard backoff schedule even when the server is returning errors. The server stays overloaded because each retry consumes auth endpoint capacity. This creates a positive feedback loop: server overload → 503 responses → clients retry at same rate → server stays overloaded. The system cannot recover until clients stop or slow their retries.

### Real-World Consequences
During a reconnection storm, the auth endpoint returns 503. Clients don't adjust their retry schedule. At the next retry interval (e.g., 4s), all clients retry simultaneously, again overwhelming the server. The server receives 503 responses for 30+ retry cycles, extending the outage far beyond what the initial storm would have caused.

### Preferred Alternative
Implement a circuit breaker: when the auth endpoint returns 429 or 503, increase the client's backoff multiplier (e.g., double it) to reduce retry frequency.

### Refactoring Strategy
1. Detect 429/503 responses from the auth endpoint
2. When detected, multiply the backoff base by 2
3. Reset the multiplier on successful authorization
4. Test by simulating auth endpoint failure and verifying retry cadence decreases

### Detection Checklist
- [ ] No circuit breaker for server errors
- [ ] Retry rate doesn't decrease when server returns errors
- [ ] Extended outage from retry-amplified overload

### Related Rules
- (Rule: Always implement a circuit breaker for auth endpoint errors)
