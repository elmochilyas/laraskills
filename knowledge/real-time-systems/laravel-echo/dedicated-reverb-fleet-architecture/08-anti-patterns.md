# ECC Anti-Patterns — Dedicated Reverb Fleet Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Client-Side Subscriptions (Echo) |
| **Knowledge Unit** | Dedicated Reverb Fleet Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Sticky Sessions on Load Balancer
2. Shared Redis for Fleet Pub/Sub and Cache/Queue
3. No Connection Draining on Deployment
4. Under-Provisioned File Descriptors
5. Sharing Fleet Credentials Across Environments

---

## Repository-Wide Anti-Patterns

- God Services
- Massive Configuration Files

---

## Anti-Pattern 1: No Sticky Sessions on Load Balancer

### Category
Reliability

### Description
Using round-robin load balancing for the Reverb fleet without sticky sessions, causing clients to bounce between instances on reconnect and lose subscription state.

### Warning Signs
- Load balancer configured with round-robin or least-connections
- Clients disconnect and reconnect to a different instance
- Private channel subscriptions lost on reconnect
- Client-side errors: "Channel already exists" or "subscription denied"

### Why It Is Harmful
WebSocket connections are pinned to the instance that handled the upgrade. Without stickiness, reconnecting clients land on different instances that have no subscription state. Private channel authorizations, presence channel membership, and event listeners are all lost.

### Real-World Consequences
A user's network blips momentarily. The WebSocket reconnects but hits a different Reverb instance. The new instance has no record of their channel subscriptions. They stop receiving order updates. They refresh the page to recover, losing any unsaved state.

### Preferred Alternative
Configure cookie-based sticky sessions on the load balancer for the Reverb fleet.

### Refactoring Strategy
1. Add `ip_hash` to Nginx upstream block, or configure cookie-based affinity
2. Prefer cookie-based over IP hash for NAT/mobile support
3. Test: kill one Reverb instance and verify clients reconnect to same instance

### Detection Checklist
- [ ] Load balancer without sticky sessions
- [ ] Clients lose subscription state on reconnect
- [ ] Reconnection hits different instances

### Related Rules
- (Rule: Always configure sticky sessions on the load balancer)

### Related Skills
- (Related: Deploy and Operate a Dedicated Reverb Fleet)

---

## Anti-Pattern 2: Shared Redis for Fleet Pub/Sub and Cache/Queue

### Category
Reliability

### Description
Using the same Redis instance for Reverb fleet pub/sub, application cache, and queue backend, creating cross-component contention and a shared failure domain.

### Warning Signs
- Single `REDIS_HOST` for everything
- Cache stampedes coincide with broadcast delivery failures
- Queue backlog causes Reverb pub/sub latency
- Redis CPU/memory contention between services

### Why It Is Harmful
Shared Redis creates cross-component contention. A cache stampede or queue backlog can starve Reverb's pub/sub, dropping broadcast events. A single Redis failure takes down caching, queues, and real-time simultaneously.

### Real-World Consequences
A marketing campaign triggers a cache stampede (thousands of cache misses). Redis CPU spikes to 100%. Reverb pub/sub latency increases to 2 seconds. Broadcast events are delayed or dropped. Users don't receive real-time updates for 10 minutes.

### Preferred Alternative
Provision a dedicated Redis instance for the Reverb fleet pub/sub, isolated from cache and queue.

### Refactoring Strategy
1. Provision a separate Redis instance for Reverb
2. Configure `REVERB_REDIS_HOST` and `REVERB_REDIS_PORT`
3. Verify Reverb uses its own Redis via monitoring

### Detection Checklist
- [ ] Single Redis for cache, queue, and Reverb
- [ ] Cross-component contention observed
- [ ] Broadcast drops coincide with cache/queue load

### Related Rules
- (Rule: Always use a dedicated Redis instance for fleet pub/sub)

---

## Anti-Pattern 3: No Connection Draining on Deployment

### Category
Reliability

### Description
Restarting Reverb instances immediately during rolling deployments without connection draining, causing all WebSocket clients to disconnect simultaneously and triggering a reconnection storm.

### Warning Signs
- `stopwaitsecs` not configured or too short
- Deployment causes mass client disconnections
- Auth endpoint overloaded after deployment
- Clients reconnecting in waves, then disconnecting again

### Why It Is Harmful
Immediate Reverb process termination drops all WebSocket connections simultaneously. Thousands of clients reconnect at the same time, overloading the auth endpoint and causing a cascade of failures as each reconnect triggers subscription reauthorization.

### Real-World Consequences
A rolling deployment restarts all 5 Reverb instances within 30 seconds. Each restart drops ~10,000 connections. 50,000 clients reconnect simultaneously. The auth endpoint receives 50,000 POST requests in 5 seconds and returns 503. Clients can't re-subscribe for 2 minutes.

### Preferred Alternative
Configure connection draining with `stopwaitsecs` set to at least 2x the `activity_timeout`, and implement rolling deployments one instance at a time.

### Refactoring Strategy
1. Set `stopwaitsecs=60` in Supervisor config
2. Configure health check that removes instance from rotation before stopping
3. Implement rolling deployments: restart one instance, wait for drain, next instance
4. Monitor reconnection rate during deployments

### Detection Checklist
- [ ] No connection draining configured
- [ ] Deployment causes mass disconnections
- [ ] Auth endpoint overloaded after deploy

### Related Rules
- (Rule: Always implement connection draining on deployment)

### Related Skills
- (Related: Deploy and Operate a Dedicated Reverb Fleet — connection draining)

---

## Anti-Pattern 4: Under-Provisioned File Descriptors

### Category
Scalability

### Description
Using default file descriptor limits (1024) on Reverb fleet instances, silently capping concurrent WebSocket connections far below production requirements.

### Warning Signs
- `ulimit -n` at default (1024)
- Reverb stops accepting new connections at low count
- No error in logs — connections silently rejected
- Connection metrics plateau unexpectedly

### Why It Is Harmful
Each WebSocket connection consumes a file descriptor. Default ulimits (1024) cap connections far below production requirements. When the limit is reached, new connections are silently rejected — no error is raised, clients just can't connect.

### Real-World Consequences
A Reverb fleet instance has default ulimit of 1024. At 1025 connections, new WebSocket handshakes are silently rejected. Monitoring shows 1024 connections but capacity was planned for 10,000. The connection plateau is noticed only during incident response.

### Preferred Alternative
Configure `ulimit -n` to exceed expected maximum concurrent connections by at least 25%.

### Refactoring Strategy
1. Calculate expected max concurrent connections + 25% buffer
2. Set `minfds` in Supervisor config (e.g., `minfds=65536`)
3. Verify limit with `ulimit -n` on running process
4. Monitor file descriptor usage in production

### Detection Checklist
- [ ] Default ulimit (1024) on Reverb instances
- [ ] Connection count plateau below target
- [ ] Silent connection rejections

### Related Rules
- (Rule: Always set file descriptor limits adequately)

---

## Anti-Pattern 5: Sharing Fleet Credentials Across Environments

### Category
Security

### Description
Using the same Reverb app key, secret, and app ID across staging and production in a fleet setup, causing cross-environment event leakage.

### Warning Signs
- Same `REVERB_APP_KEY` in `.env` and `.env.staging`
- Staging events appearing in production clients
- Production events received in staging dashboards
- No unique credentials per environment

### Why It Is Harmful
Staging and production sharing the same app credentials means staging events can reach production clients and vice versa. Staging test data appears in production UIs, and production notifications can be viewed in staging dashboards.

### Real-World Consequences
A QA tester runs a load test in staging that broadcasts 10,000 test events. The staging Reverb shares credentials with production. Production users receive 10,000 fake order notifications. Customer support is flooded with calls.

### Preferred Alternative
Use unique Reverb app credentials per environment.

### Refactoring Strategy
1. Generate separate Reverb app credentials for production, staging, and development
2. Configure via environment-specific `.env` files
3. Verify staging clients can't receive production events
4. Audit credential usage across environments

### Detection Checklist
- [ ] Same credentials across environments
- [ ] Cross-environment event leakage
- [ ] No unique credentials per environment

### Related Rules
- (Rule: Never share fleet credentials across environments)
