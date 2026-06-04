# ECC Anti-Patterns — Laravel Wave SSE Package

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | SSE (Server-Sent Events) |
| **Knowledge Unit** | Laravel Wave SSE Package |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Wave for Bidirectional Features (Client Events, Whispers)
2. No Event Buffer TTL (Events Lost on Reconnect)
3. Multi-Server Wave Without Redis Pub/Sub
4. No PHP-FPM Worker Pool Sizing for SSE Connections
5. No Fallback Plan for Wave Deprecation

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Wave for Bidirectional Features (Client Events, Whispers)

### Category
Architecture

### Description
Using the Laravel Wave SSE package for features that require client-to-server real-time communication such as whispers, typing indicators, or client events — which Wave cannot support as SSE is unidirectional.

### Warning Signs
- Code calls `Echo.whisper()` or client event methods with Wave backend
- Typing indicators silently do not work
- Client events never reach other users
- Echo configured with `broadcaster: 'wave'` for chat features

### Why It Is Harmful
Wave implements the Echo server protocol over SSE, which is strictly server-to-client only. Client events require bidirectional WebSocket communication that SSE cannot provide. These features silently fail — no error is thrown, no console warning appears. Developers may spend hours debugging "broken" features that fundamentally cannot work with SSE.

### Real-World Consequences
A chat application uses Wave because it is simpler to set up than Reverb. The team implements typing indicators and read receipts using Echo's whisper API. Neither feature works. After three days of debugging, the team discovers SSE cannot support client events and must migrate to Reverb mid-project.

### Preferred Alternative
Use Reverb or Soketi for any application requiring bidirectional client events. Reserve Wave for server-to-client-only use cases (notifications, dashboards, status updates).

### Refactoring Strategy
1. Identify all Echo client event calls (whispers, client events)
2. Evaluate if the feature can use SSE + POST pattern instead
3. If bidirectional is truly needed, migrate to Reverb
4. Keep Wave only if no client event features are required

### Detection Checklist
- [ ] Wave used with `Echo.whisper()` or client events
- [ ] Typing indicators or read receipts not working
- [ ] Chat or collaborative editing built on SSE transport

### Related Rules
- (Rule: Never use Wave for bidirectional features)
- (Rule: Test Echo compatibility thoroughly with Wave)

---

## Anti-Pattern 2: No Event Buffer TTL (Events Lost on Reconnect)

### Category
Reliability

### Description
Not configuring Wave's event buffer TTL, causing all broadcast events dispatched during a client's disconnection window to be permanently lost.

### Warning Signs
- Wave config has no `buffer` setting
- Users miss events after brief network interruptions
- No event replay on reconnect
- Reconnection happens but no missed events arrive

### Why It Is Harmful
Wave's event buffer is the mechanism for replaying missed events to reconnecting clients. Without a configured TTL, events are not retained. When a client's SSE connection drops and reconnects (which happens frequently on unstable networks), all events dispatched during that window are lost. SSE's auto-reconnect feature becomes useless without buffered event replay.

### Real-World Consequences
Mobile users on a train experience brief signal drops. Every time the EventSource reconnects after a 3-second dropout, the user misses notifications dispatched during those 3 seconds. Cumulative over a day, 10% of notifications are silently dropped. Users report "I never got notified about that order."

### Preferred Alternative
Configure the event buffer with an appropriate TTL in `config/wave.php` (e.g., 30 seconds for short reconnections, longer for mobile users).

### Refactoring Strategy
1. Publish Wave config: `php artisan vendor:publish --tag=wave-config`
2. Set `'buffer' => ['ttl' => 30]` in `config/wave.php`
3. Adjust TTL based on expected reconnection time (30s typical)
4. Verify reconnection replay by disconnecting and reconnecting

### Detection Checklist
- [ ] Event buffer not configured in Wave config
- [ ] Events lost during client reconnection
- [ ] No buffer TTL set

### Related Rules
- (Rule: Always configure event buffer TTL for Wave)

---

## Anti-Pattern 3: Multi-Server Wave Without Redis Pub/Sub

### Category
Scalability

### Description
Running Wave across multiple application servers without Redis pub/sub, causing events broadcast on one server to never reach clients connected to other servers.

### Warning Signs
- Multiple application servers running Wave
- Events reach some clients but not others
- Clients connected to different servers see different data
- No Redis pub/sub configured in Wave config

### Why It Is Harmful
Wave's channel subscription registry is in-memory per server instance. Without shared state, an event broadcast from Server A only fans out to SSE connections on Server A. Clients connected to Server B never receive the event. This creates inconsistent application state — users on different servers see different data.

### Real-World Consequences
A horizontally scaled application has 3 servers behind a load balancer. An order is placed and a broadcast event fires on Server 2. Only the 30 clients connected to Server 2 receive the update. The 60 clients on Servers 1 and 3 see stale data until they refresh the page.

### Preferred Alternative
Configure Redis pub/sub in Wave's config for multi-server deployments to enable cross-server event distribution.

### Refactoring Strategy
1. Configure Redis connection in `config/wave.php`
2. Set `'redis' => ['connection' => 'default']` for pub/sub
3. Ensure all application servers connect to the same Redis instance
4. Verify cross-server delivery by testing event broadcast from one server

### Detection Checklist
- [ ] Multiple app servers without Redis pub/sub
- [ ] Inconsistent event delivery across servers
- [ ] Redis not configured in Wave config

### Related Rules
- (Rule: Always configure Redis for multi-server Wave deployments)

---

## Anti-Pattern 4: No PHP-FPM Worker Pool Sizing for SSE Connections

### Category
Maintainability

### Description
Not sizing `pm.max_children` to account for SSE connections consumed by Wave, causing PHP-FPM worker exhaustion and HTTP request queuing.

### Warning Signs
- HTTP requests time out or queue when Wave is active
- `pm.max_children` at default value
- No adjustment to worker pool after Wave deployment
- PHP-FPM status shows workers consumed by SSE connections

### Why It Is Harmful
Each Wave SSE connection holds one PHP-FPM worker for its entire duration. If `pm.max_children` is set to 50 and Wave has 30 connected clients, only 20 workers remain for HTTP requests. Under normal traffic, these 20 workers become saturated and HTTP requests queue or time out.

### Real-World Consequences
A team deploys Wave to a server with `pm.max_children = 30`. Wave has 25 connected dashboard clients. Only 5 workers remain for HTTP requests. During peak traffic, HTTP response times increase from 200ms to 10 seconds because requests queue behind the available 5 workers.

### Preferred Alternative
Size `pm.max_children` to accommodate expected SSE connections plus peak HTTP traffic headroom.

### Refactoring Strategy
1. Calculate: `pm.max_children = expected_SSE_connections + peak_HTTP_connections * 1.5`
2. Update PHP-FPM pool configuration
3. Monitor worker utilization with `pm.status` endpoint
4. Consider using Octane (FrankenPHP/Swoole) for non-blocking SSE

### Detection Checklist
- [ ] Worker pool not sized for SSE connections
- [ ] HTTP request queuing during Wave usage
- [ ] Default `pm.max_children` values unchanged

### Related Rules
- (Rule: Always monitor PHP-FPM worker pool for SSE connections)

---

## Anti-Pattern 5: No Fallback Plan for Wave Deprecation

### Category
Maintainability

### Description
Adopting the Wave community package for production real-time infrastructure without documenting a migration path to Reverb or native SSE if the package becomes unmaintained.

### Warning Signs
- Wave is used in production without a documented fallback
- No migration strategy to Reverb or native SSE
- Application architecture tightly coupled to Wave's Echo-compatible API
- No evaluation of community package maintenance status

### Why It Is Harmful
Wave is a community package (`qruto/laravel-wave`), not a first-party Laravel package. If development stops, a breaking Laravel update breaks compatibility, or critical bugs go unfixed, the application has no clear migration path. An emergency migration under time pressure is risky and expensive.

### Real-World Consequences
A Laravel update changes broadcasting internals. Wave is not updated for 6 months. The application cannot upgrade Laravel without losing all real-time functionality. The team must perform a rushed migration to Reverb under production pressure, risking downtime.

### Preferred Alternative
Document a migration path from Wave to Reverb or native SSE before deploying Wave in production. Evaluate Wave's maintenance history and community activity.

### Refactoring Strategy
1. Document the fallback plan in architecture docs
2. Implement broadcasting using standard Laravel interfaces (not Wave-specific)
3. Keep Echo client code transport-agnostic
4. Set a calendar reminder to evaluate Wave's maintenance status quarterly
5. Consider using first-party Reverb for production-critical features

### Detection Checklist
- [ ] No documented fallback from Wave
- [ ] Architecture tightly coupled to Wave-specific features
- [ ] No migration strategy to Reverb or native SSE

### Related Rules
- (Rule: Always have a fallback plan for Wave deprecation)
