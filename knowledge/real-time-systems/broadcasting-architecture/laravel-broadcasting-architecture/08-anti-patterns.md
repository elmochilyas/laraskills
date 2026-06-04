# ECC Anti-Patterns — Laravel Broadcasting Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Event Broadcasting Architecture |
| **Knowledge Unit** | Laravel Broadcasting Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Synchronous Broadcasting for All Events
2. No Queue Worker Running for Broadcasts
3. Shared Queue Connection With Other Job Types
4. Hardcoded Broadcast Driver in Application Code
5. No Auth Middleware on Broadcast::routes()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries
- God Services

---

## Anti-Pattern 1: Synchronous Broadcasting for All Events

### Category
Performance

### Description
Using `ShouldBroadcastNow` for all broadcast events instead of the default queued path, causing HTTP response times to be blocked by WebSocket publishing.

### Warning Signs
- All broadcast events implement `ShouldBroadcastNow`
- HTTP response times increase proportionally to broadcast volume
- Response latency spikes when many broadcasts fire in a single request

### Why It Is Harmful
Synchronous broadcasting couples the HTTP response lifecycle to WebSocket delivery. Every broadcast blocks the response until the driver publishes the event. Under high broadcast volume, response times degrade and requests queue up.

### Real-World Consequences
A chat application broadcasts every message via `ShouldBroadcastNow`. At 100 messages/second, average HTTP response time increases from 50ms to 400ms. Users perceive the app as slow and laggy.

### Preferred Alternative
Use the default queued `ShouldBroadcast` interface. Reserve `ShouldBroadcastNow` for latency-critical events only.

### Refactoring Strategy
1. Change all events from `ShouldBroadcastNow` to `ShouldBroadcast`
2. Ensure queue worker is running for the broadcast queue
3. Reserve `ShouldBroadcastNow` only for sub-100ms delivery requirements

### Detection Checklist
- [ ] Events use `ShouldBroadcastNow` as default
- [ ] HTTP response time correlated with broadcast volume
- [ ] No queue worker configured for broadcasts

### Related Rules
- (Rule: Never use ShouldBroadcastNow as the default for all events)

---

## Anti-Pattern 2: No Queue Worker Running for Broadcasts

### Category
Reliability

### Description
Running a WebSocket server (Reverb, Soketi) without a corresponding queue worker, causing broadcast events to be queued but never dispatched to connected clients.

### Warning Signs
- Broadcast events fire but clients never receive them
- Queue backlog for `BroadcastEvent` jobs growing
- No `php artisan queue:work` process running
- Broadcast silently fails with no error output

### Why It Is Harmful
Broadcast events are queued by default as `BroadcastEvent` jobs. Without a queue worker consuming these jobs, they accumulate in the queue and are never processed. No error is raised — the events simply never reach clients.

### Real-World Consequences
Team deploys Reverb and configures broadcasting. Events are dispatched correctly. Clients connect. But no queue worker is running. 24 hours later, the team notices no real-time updates are working. The queue has 50K unprocessed `BroadcastEvent` jobs.

### Preferred Alternative
Always run a queue worker for the broadcast queue. Monitor queue backlog with Horizon or Pulse.

### Refactoring Strategy
1. Start queue worker: `php artisan queue:work --queue=broadcasts`
2. Configure Supervisor to keep the queue worker alive
3. Add queue backlog monitoring to detect worker failures

### Detection Checklist
- [ ] No queue worker process running
- [ ] Broadcast `BroadcastEvent` jobs accumulating
- [ ] Clients not receiving events

### Related Rules
- (Rule: Always run a queue worker for broadcast events)

---

## Anti-Pattern 3: Shared Queue Connection With Other Job Types

### Category
Scalability

### Description
Routing broadcast events through the same queue connection as emails, notifications, and other jobs, allowing a broadcast storm to starve critical job processing.

### Warning Signs
- All jobs share the default queue connection
- Broadcast events flood the queue under high load
- Email and notification delivery delayed during broadcast spikes
- No `broadcastQueue()` method defined on events

### Why It Is Harmful
A broadcast storm (e.g., 10K users triggering events simultaneously) fills the default queue with millions of `BroadcastEvent` jobs. Time-sensitive jobs like password reset emails or payment confirmations are delayed behind the broadcast backlog.

### Real-World Consequences
A live event causes 5K users to trigger broadcast events simultaneously. The shared queue fills with 500K broadcast jobs. Password reset emails are delayed by 15 minutes. Users report "forgot password not working."

### Preferred Alternative
Define a dedicated queue connection for broadcasts using `broadcastQueue()`.

### Refactoring Strategy
1. Add `broadcastQueue()` method to return `'broadcasts'`
2. Create dedicated queue worker: `php artisan queue:work --queue=broadcasts`
3. Monitor broadcast queue separately from other queues

### Detection Checklist
- [ ] Broadcast events share default queue
- [ ] No `broadcastQueue()` defined
- [ ] Critical jobs delayed during broadcast volume spikes

### Related Rules
- (Rule: Configure a dedicated queue connection for broadcasts)

---

## Anti-Pattern 4: Hardcoded Broadcast Driver in Application Code

### Category
Maintainability

### Description
Hardcoding the broadcast driver (`config(['broadcasting.default' => 'reverb'])`) in application code instead of using environment-driven configuration, requiring code changes to switch between environments.

### Warning Signs
- Broadcast driver set in service providers or controllers
- Environment-specific broadcast config not driven by `.env`
- Switching between Pusher, Reverb, or Ably requires code deploy
- Different environments use hardcoded values

### Why It Is Harmful
Hardcoding ties the application to a specific provider. Testing with a different driver, switching from self-hosted to managed, or adjusting per-environment config all require code commits and deployments.

### Real-World Consequences
Development uses Reverb and production uses Pusher. The broadcast driver is hardcoded to `'reverb'` in a service provider. Production deploys with Reverb config but actually needs Pusher. Broadcasting silently fails in production.

### Preferred Alternative
Configure the broadcast driver via `.env` and `config/broadcasting.php`.

### Refactoring Strategy
1. Set `BROADCAST_CONNECTION` in `.env` per environment
2. Use `env('BROADCAST_CONNECTION', 'reverb')` in `config/broadcasting.php`
3. Remove hardcoded driver setting from application code

### Detection Checklist
- [ ] Broadcast driver hardcoded in code
- [ ] Env-driven selection not configured
- [ ] Driver switched via code change

### Related Rules
- (Rule: Prefer environment-driven broadcast driver selection)

---

## Anti-Pattern 5: No Auth Middleware on Broadcast::routes()

### Category
Security

### Description
Registering `Broadcast::routes()` without authentication and rate-limiting middleware, allowing unauthenticated access to the channel authorization endpoint.

### Warning Signs
- `Broadcast::routes()` called without middleware
- No authentication check on `/broadcasting/auth`
- No rate limiting on auth endpoint
- Private/presence channel subscriptions accessible without login

### Why It Is Harmful
Without auth middleware, unauthenticated users can access the channel authorization endpoint. Without rate limiting, attackers can flood it with requests. Private and presence channel authorization becomes bypassable.

### Real-World Consequences
A public page includes JavaScript that subscribes to a private channel without user authentication. The `/broadcasting/auth` endpoint allows the subscription because no auth middleware checks the user's session. Private data is exposed.

### Preferred Alternative
Always apply authentication and rate-limiting middleware to `Broadcast::routes()`.

### Refactoring Strategy
1. Update `Broadcast::routes()`: `Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']])`
2. Test that unauthenticated requests to `/broadcasting/auth` return 403
3. Verify rate limiting on auth endpoint under load

### Detection Checklist
- [ ] `Broadcast::routes()` without auth middleware
- [ ] No rate limiting on auth endpoint
- [ ] Unauthenticated users can access channel authorization

### Related Rules
- (Rule: Always apply auth middleware and rate limiting to Broadcast::routes())
