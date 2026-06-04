# Anti-Patterns: Reverb Horizontal Scaling via Redis

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Reverb Horizontal Scaling via Redis |
| Audience | Developers, DevOps Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-RHS-01 | Shared Redis for Everything (Cache, Queue, Reverb) | Critical | High | Medium |
| AP-RHS-02 | No Sticky Sessions on Load Balancer | Critical | High | Low |
| AP-RHS-03 | REVERB_SCALING_ENABLED=false with Multiple Instances | High | High | Low |
| AP-RHS-04 | Predis in Production Instead of phpredis | Medium | High | Low |
| AP-RHS-05 | No Redis Auth/Network Isolation | Critical | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Single Redis for all environments**: Staging Reverb publishing to production Redis leaks events
- **Not testing reconnection during instance failure**: Clients must reconnect to remaining instances
- **Adding more Reverb instances without monitoring Redis throughput**: Redis becomes bottleneck

---

## 1. Shared Redis for Everything (Cache, Queue, Reverb)

### Category
Reliability · Performance

### Description
Using the same Redis instance for cache, queue, session storage, and Reverb pub/sub scaling, creating resource contention and cross-domain failure cascades.

### Why It Happens
Cost-saving and simplicity drive this anti-pattern. A single Redis instance is easier to manage. The different workloads seem compatible — they all use Redis. The contention and cascade risks are invisible until a failure occurs.

### Warning Signs
- Single Redis connection string used for `CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER`, and `REVERB_REDIS_HOST`
- Redis CPU consistently high under normal load
- Cache evictions cause performance degradation in one service due to another service's load
- Reverb pub/sub latency increases when cache operations spike
- A cache flush or queue purge affects Reverb scaling

### Why Harmful
Redis is single-threaded for data operations. Cache misses, queue operations, and Reverb pub/sub all compete for the same CPU. A cache-heavy endpoint can slow Reverb message delivery. A queue backlog can delay broadcast events. Most critically, a Redis outage takes down cache, queue, sessions, and real-time simultaneously — a full application outage.

### Real-World Consequences
- Cache stampede causes Redis CPU spike — Reverb messages delayed by 500ms
- Queue backlog fills Redis memory — cache evictions slow the application
- Redis OOM from queue data — Reverb scaling stops, events don't cross instances
- Redis restart clears cache, queue, AND Reverb state — full restart required
- Single Redis failure takes down four critical services

### Preferred Alternative
Use a dedicated Redis instance for Reverb pub/sub. Keep cache and queue on separate Redis instances (or at minimum, separate logical databases).

### Refactoring Strategy
1. Provision a dedicated Redis instance for Reverb scaling
2. Update environment: `REVERB_REDIS_HOST`, `REVERB_REDIS_PORT` for the dedicated instance
3. Keep `CACHE_STORE` and `QUEUE_CONNECTION` pointing to the original Redis
4. Verify Reverb pub/sub works on the dedicated instance
5. Monitor both Redis instances for resource usage
6. Document the Redis architecture: which instance serves which purpose

### Detection Checklist
- [ ] Is Reverb sharing a Redis instance with cache and queue?
- [ ] Is there resource contention between Reverb and other Redis users?
- [ ] Would a Redis outage affect both application and real-time services?
- [ ] Is there a dedicated Redis instance for Reverb?
- [ ] Are there separate Redis instances by domain (cache, queue, Reverb)?

### Related Rules/Skills/Trees
- Use Dedicated Redis for Reverb Scaling (05-rules.md)
- Configure Reverb Horizontal Scaling (06-skills.md)
- Redis Architecture for Multi-Service Deployments (06-skills.md)

---

## 2. No Sticky Sessions on Load Balancer

### Category
Reliability · Architecture

### Description
Configuring a load balancer without sticky sessions in front of multiple Reverb instances, causing clients to be routed to different instances on reconnection and losing their channel subscriptions.

### Why It Happens
Load balancers default to round-robin distribution. Developers familiar with stateless HTTP applications apply the same configuration to WebSocket traffic. They don't realize that Reverb (like all Pusher-protocol servers) maintains per-connection state that must be pinned to one instance.

### Warning Signs
- Load balancer uses round-robin or least-connections algorithm
- No `sticky-sessions` or `session-affinity` configured
- Clients reconnect to different instances after brief disconnections
- Private channel messages missed on reconnect
- Presence channel state inconsistent after reconnection

### Why Harmful
When a client reconnects to a different Reverb instance, the new instance has no record of the client's subscriptions. Private and presence channel subscriptions are lost. The client must re-authenticate and re-subscribe to all channels. During this re-subscription window, the client misses events.

### Real-World Consequences
- Client reconnects to different instance — misses private channel messages
- Presence channel shows user as "offline" until they re-subscribe
- Reconnection storms amplify the problem — each reconnect goes to a random instance
- Support tickets: "I keep missing notifications after my connection drops"
- Emergency sticky session configuration after user complaints

### Preferred Alternative
Configure sticky sessions (session affinity) on the load balancer for WebSocket connections. Use source IP or cookie-based affinity.

### Refactoring Strategy
1. Configure sticky sessions on the load balancer:
   - Nginx: `ip_hash` directive for upstream
   - AWS ALB: `stickiness` enabled with duration-based cookie
2. Set the sticky session duration longer than expected connection lifetime
3. Verify clients consistently reach the same Reverb instance on reconnect
4. Test: drop a client connection, verify it reconnects to the same instance
5. Monitor instance connection distribution to ensure stickiness is working
6. Document the load balancer configuration for future reference

### Detection Checklist
- [ ] Are sticky sessions configured on the load balancer?
- [ ] What affinity method is used (cookie, source IP)?
- [ ] Do clients reconnect to the same instance after disconnection?
- [ ] Are private channel subscriptions preserved on reconnect?
- [ ] Is the load balancer configuration documented?

### Related Rules/Skills/Trees
- Configure Sticky Sessions for Multi-Instance Reverb (05-rules.md)
- Configure Reverb Horizontal Scaling (06-skills.md)
- Load Balancer Configuration for WebSocket (06-skills.md)

---

## 3. REVERB_SCALING_ENABLED=false with Multiple Instances

### Category
Reliability · Architecture

### Description
Running multiple Reverb instances behind a load balancer without setting `REVERB_SCALING_ENABLED=true`, causing events broadcast from one instance to never reach clients connected to other instances.

### Why It Happens
The scaling feature must be explicitly enabled via environment variable. Developers deploy multiple Reverb instances for high availability or capacity but forget to configure the scaling flag. Each instance operates independently, unaware of the others.

### Warning Signs
- Multiple Reverb instances are running
- `REVERB_SCALING_ENABLED` is not set or set to `false`
- Events published by the web application reach only a subset of clients
- Some users receive real-time updates, others don't
- No Redis pub/sub channel activity visible in Redis monitor

### Why Harmful
When `REVERB_SCALING_ENABLED=false`, each Reverb instance only knows about its own connected clients. Events published by the Laravel application (via Redis broadcast driver) are received by one Reverb instance and forwarded only to that instance's clients. Clients on other instances never receive the event.

### Real-World Consequences
- 50% of users receive real-time updates — those connected to the wrong instance miss all events
- Support tickets: "Notifications work for some users but not others"
- Debugging shows events are published but only some clients receive them
- Team doesn't realize the issue for weeks — hard to reproduce consistently
- Emergency enabling of scaling during production incident

### Preferred Alternative
Always set `REVERB_SCALING_ENABLED=true` when deploying multiple Reverb instances.

### Refactoring Strategy
1. Set `REVERB_SCALING_ENABLED=true` in the environment
2. Configure `REVERB_SCALING_DRIVER=redis` (default)
3. Ensure `REVERB_REDIS_HOST` points to a shared Redis instance
4. Verify: publish a test event, confirm all connected clients receive it
5. Restart all Reverb instances to apply the configuration change
6. Add a startup check: Reverb should warn if multiple instances are running without scaling enabled

### Detection Checklist
- [ ] Is `REVERB_SCALING_ENABLED` set to `true`?
- [ ] Does the environment have multiple Reverb instances?
- [ ] Do all connected clients receive broadcast events?
- [ ] Is there a shared Redis instance configured for scaling?
- [ ] Is the Redis pub/sub channel active?

### Related Rules/Skills/Trees
- Enable REVERB_SCALING_ENABLED for Multi-Instance Deployments (05-rules.md)
- Configure Reverb Horizontal Scaling (06-skills.md)
- Reverb Scaling Configuration (06-skills.md)

---

## 4. Predis in Production Instead of phpredis

### Category
Performance · Reliability

### Description
Using the `predis/predis` PHP library instead of the `ext-redis` (`phpredis`) extension in production for Reverb's Redis pub/sub, adding 2-3x latency and CPU overhead.

### Why It Happens
Predis is a pure PHP implementation that requires no extension installation — it works out of the box. phpredis requires a PHP extension to be compiled and configured. For development, Predis is fine. In production, the performance difference is significant.

### Warning Signs
- `Laravel\Reverb\Publishing\RedisPublishr` is configured but `ext-redis` is not installed
- `php -m` does not list `redis`
- `composer.json` includes `predis/predis`
- Reverb pub/sub latency is higher than expected (10-15ms vs 2-5ms)
- Redis CPU usage is higher than expected (Predis deserializes responses in PHP)

### Why Harmful
Predis is 2-3x slower than phpredis for Redis operations. For Reverb's pub/sub, each event must be published via Redis and forwarded to clients. Additional latency compounds with each scaling hop. On high-traffic applications, the CPU overhead from Predis's PHP-based protocol parsing becomes significant.

### Real-World Consequences
- Reverb message delivery latency: 15ms with Predis vs 5ms with phpredis
- CPU usage 10-15% higher from Predis's serialization overhead
- Redis connection overhead: Predis opens multiple connections vs phpredis's multiplexed connection
- Scaling bottlenecks hit earlier due to higher base latency
- High-traffic events show 300% latency increase with Predis

### Preferred Alternative
Install the phpredis extension and configure Laravel to use it. Fall back to Predis only if phpredis cannot be installed.

### Refactoring Strategy
1. Install phpredis: `pecl install redis` or add to Dockerfile
2. Update `composer.json`: remove `predis/predis` if no other service uses it
3. Verify `config/database.php` prefers phpredis over predis
4. Test Redis operations work with phpredis
5. Measure Reverb pub/sub latency improvement
6. Monitor CPU reduction on the Reverb server

### Detection Checklist
- [ ] Is `ext-redis` (phpredis) installed?
- [ ] Is Predis being used instead of phpredis?
- [ ] What is the Reverb pub/sub latency?
- [ ] Is CPU usage higher than expected on the Reverb server?
- [ ] Has the Redis extension been benchmarked for the workload?

### Related Rules/Skills/Trees
- Use phpredis Extension Over Predis in Production (05-rules.md)
- Configure Reverb Horizontal Scaling (06-skills.md)
- PHP Redis Extension Installation (06-skills.md)

---

## 5. No Redis Auth/Network Isolation

### Category
Security · Critical

### Description
Running Redis used for Reverb scaling without authentication (`requirepass`) or network isolation, exposing the Redis instance to unauthorized access and potential exploitation.

### Why It Happens
Development Redis instances often run without auth for convenience. This configuration is carried to production. The Redis instance is assumed to be on an internal network and therefore protected. Attackers who gain access to the internal network can access Redis without a password.

### Warning Signs
- `REQUIREPASS` not configured in `redis.conf`
- Redis is accessible from outside the application servers
- No firewall rules restrict Redis access to specific IPs
- Redis is not running with TLS encryption
- `redis-cli` can connect without authentication

### Why Harmful
Redis without authentication is a well-known attack vector (CVE-2026-23524 related to Reverb Redis deserialization RCE). An attacker with Redis access can:
- Subscribe to all Reverb pub/sub messages, intercepting real-time data
- Inject fake events into the broadcast stream
- Access and modify cached data, queued jobs, and sessions (if shared Redis)
- Exploit deserialization vulnerabilities to execute code on the Reverb server

### Real-World Consequences
- Attacker subscribes to Reverb pub/sub, intercepts private real-time data
- Fake events injected into broadcast stream — users receive manipulated data
- Redis deserialization RCE (CVE-2026-23524) — full server compromise
- Compliance violation: Redis data accessible without authentication
- Security audit identifies unauthenticated Redis as critical finding

### Preferred Alternative
Require authentication for Redis. Restrict network access to only the Reverb server IPs. Use TLS for Redis in production.

### Refactoring Strategy
1. Set `requirepass` in `redis.conf` to a strong, generated password
2. Update `REVERB_REDIS_PASSWORD` in the application environment
3. Restrict Redis network access: bind to internal interface or configure security group
4. Enable TLS for Redis if data-in-transit protection is required
5. Update Reverb to use TLS connection: `redis://user:password@host:port` with `tls://` scheme
6. Verify Reverb connections work with authentication enabled
7. Rotate the Redis password and verify all services reconnect

### Detection Checklist
- [ ] Is Redis `requirepass` configured?
- [ ] Is Redis bound to localhost or internal network interface?
- [ ] Are firewall rules restricting Redis access?
- [ ] Is TLS enabled for Redis connections?
- [ ] Is the Reverb Redis password set in the environment?

### Related Rules/Skills/Trees
- Secure Redis with Authentication and Network Isolation (05-rules.md)
- Configure Reverb Horizontal Scaling (06-skills.md)
- Redis Security Hardening (06-skills.md)
