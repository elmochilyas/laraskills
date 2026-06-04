# Anti-Patterns: Reverb Connection Lifecycle & State Management

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Reverb Connection Lifecycle & State Management |
| Audience | Developers, DevOps Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-RCL-01 | No Distinction Between Connecting and Connected States in Monitoring | Medium | Medium | Low |
| AP-RCL-02 | Not Handling Zombie Connections | High | Medium | Medium |
| AP-RCL-03 | Single Connection Lifecycle Handler for All Events | Medium | High | Medium |
| AP-RCL-04 | activity_timeout Set Too Low | High | Medium | Low |
| AP-RCL-05 | Pulse Not Enabled on Reverb Server | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Confusing connections and subscriptions**: One connection may subscribe to multiple channels — track both separately
- **Ignoring 1024 file descriptor limit**: Without `ext-uv`, connections cap at ~1024
- **stopwaitsecs < activity_timeout**: Supervisor kills Reverb before pong timeout

---

## 1. No Distinction Between Connecting and Connected States in Monitoring

### Category
Observability · Operations

### Description
Monitoring Reverb connection counts without distinguishing between connections that are still in the handshake/auth phase and connections that are fully established and subscribed, hiding connection failure rates.

### Why It Happens
Most Reverb monitoring shows a single "current connections" metric. It's simpler to track one number. Developers don't realize that a large gap between "connections started" and "connections established" indicates an authentication or handshake problem.

### Warning Signs
- Monitoring dashboard shows only one connection metric
- No metrics for connection attempts vs successful connections
- Authentication failures are not tracked as separate metric
- Connection counts seem low, but server load is high (lots of failed handshakes)
- No visibility into why connections are failing

### Why Harmful
Without separating connecting and connected states, an authentication spike (e.g., a bug in channel auth) goes unnoticed. The dashboard still shows connections, but many are failing after the handshake. The team doesn't notice the high failure rate until users report they can't connect.

### Real-World Consequences
- Auth bug causes 50% of connections to fail after handshake — invisible in monitoring
- High server CPU from failed connections — misattributed to higher traffic
- Users reporting connection issues while dashboard shows "normal" connection counts
- Debugging takes hours because failure state isn't tracked separately
- Emergency fix deployed after user complaints — monitoring gap identified

### Preferred Alternative
Track connection attempts, successful connections, authentication failures, and active subscribed connections as separate metrics.

### Refactoring Strategy
1. Add monitoring for each connection lifecycle stage: handshake started, authenticated, subscribed, disconnected
2. Expose Reverb metrics endpoint: `/apps/{appId}/connections` for programmatic access
3. Create dashboard showing connection flow: attempts → authenticated → subscribed
4. Set alert on authentication failure rate >5%
5. Track connection duration distribution (short connections may indicate issues)
6. Log failed connection attempts with reason (auth failure, timeout, rate limit)

### Detection Checklist
- [ ] Are connection attempts tracked separately from successful connections?
- [ ] Is authentication failure rate monitored?
- [ ] Does the dashboard show lifecycle stages or just total count?
- [ ] Are failed connections visible in logs with reasons?
- [ ] Can a spike in auth failures be detected before users report it?

### Related Rules/Skills/Trees
- Track Connection Lifecycle Stages in Monitoring (05-rules.md)
- Configure Reverb Connection Lifecycle (06-skills.md)
- Reverb Metrics and Monitoring (06-skills.md)

---

## 2. Not Handling Zombie Connections

### Category
Reliability · Operations

### Description
Failing to detect and clean up zombie connections — connections where the client disconnected without sending a proper WebSocket close frame — causing stale connection accumulation and resource exhaustion.

### Why It Happens
WebSocket connections can be terminated abruptly: browser tab closes, network drops, mobile device enters tunnel. These leave the server with half-open connections. Reverb detects these via ping timeout, but without monitoring and alerting, stale connections accumulate and consume resources.

### Warning Signs
- Connection count does not decrease after known client-side events (tab close, navigation)
- Server memory usage grows over time without corresponding active user growth
- Reverb logs show "ping timeout" events
- Connections with long duration but no activity
- Monitoring shows connection count increasing but user activity metrics are flat

### Why Harmful
Zombie connections consume memory, file descriptors, and subscription state. Over hours or days, they accumulate and reduce the server's capacity for legitimate connections. In extreme cases, the server runs out of file descriptors and rejects new connections.

### Real-World Consequences
- Server reaches file descriptor limit after 48 hours without restart
- Legitimate users cannot connect because server thinks it's at capacity
- Memory grows 2x over normal levels due to stale connection objects
- Emergency Reverb restart drops all connections (including legitimate ones)
- Monitoring shows "connection leak" pattern — steady growth without plateau

### Preferred Alternative
Monitor zombie connection accumulation. Configure Reverb's ping timeout to aggressively clean dead connections. Set alerts on stale connection count.

### Refactoring Strategy
1. Configure Reverb's `activity_timeout` and `ping_interval` for timely dead connection detection
2. Set up monitoring on connection duration distribution (connections with very long duration but no activity are suspicious)
3. Enable Pulse on the Reverb server to track connection state
4. Configure alert: alert if connection count exceeds expected active users by 20%
5. Implement a health check that reports the number of "stale" connections
6. Schedule periodic connection state audits to identify and clean zombie connections

### Detection Checklist
- [ ] Are zombie connections monitored?
- [ ] Does connection count decrease after client disconnects?
- [ ] Is there a "connection leak" pattern in monitoring?
- [ ] Is `ping_interval` configured appropriately?
- [ ] Are there alerts for stale connection accumulation?

### Related Rules/Skills/Trees
- Monitor and Clean Up Zombie Connections (05-rules.md)
- Configure Reverb Connection Lifecycle (06-skills.md)
- Reverb Ping/Timeout Configuration (06-skills.md)

---

## 3. Single Connection Lifecycle Handler for All Events

### Category
Architecture · Maintainability

### Description
Using a single callback or handler for all connection lifecycle events (connect, subscribe, disconnect, error), making the code difficult to maintain, debug, and test.

### Why It Happens
The simplest implementation is a single event listener that switches on event type. It works for small applications. As the application grows, the handler becomes a long switch statement mixing auth logic, subscription management, logging, and error handling.

### Warning Signs
- Single class or callback handles multiple lifecycle stages
- `switch` or `if/elseif` chain on event type in one method
- Mixing authentication, logging, and subscription management in one handler
- Debugging connection issues requires tracing through a complex handler
- Testing one lifecycle stage requires mocking unrelated stages

### Why Harmful
A monolithic lifecycle handler violates the single responsibility principle. Changes to subscription logic risk breaking authentication. Debugging is harder because all stages are entangled. Testing requires complex setup for each test case.

### Real-World Consequences
- Fixing an auth bug breaks subscription handling — unrelated feature fails
- Adding logging for disconnections accidentally logs sensitive subscription data
- Testing disconnect handling requires setting up a full connection first
- Code review of lifecycle handler takes twice as long
- New team member cannot understand the handler's flow

### Preferred Alternative
Separate concerns: distinct handlers for connection, subscription, authentication, and disconnection events.

### Refactoring Strategy
1. Identify all lifecycle event types: connecting, connected, authenticating, subscribing, disconnecting, disconnected, error
2. Create separate handler classes for each event type
3. Register each handler independently in the Reverb configuration
4. Move shared logic (logging, metrics) to traits or middleware
5. Write unit tests for each handler independently
6. Document the lifecycle event flow and handler responsibilities

### Detection Checklist
- [ ] Are lifecycle events handled by a single class or multiple?
- [ ] Is there a switch or if/elseif chain on event type?
- [ ] Can a change to subscription logic affect authentication?
- [ ] Are lifecycle events independently testable?
- [ ] Is the event handling documented?

### Related Rules/Skills/Trees
- Separate Connection Lifecycle Handlers by Event Type (05-rules.md)
- Configure Reverb Connection Lifecycle (06-skills.md)
- Reverb Event Handler Architecture (06-skills.md)

---

## 4. activity_timeout Set Too Low

### Category
Performance · Reliability

### Description
Setting `activity_timeout` too low, causing legitimate but idle connections to be disconnected prematurely, forcing unnecessary reconnections.

### Why It Happens
The default `activity_timeout` (30s) works for most applications. But some use cases — reading a long article, dashboard monitoring, passive data display — have extended idle periods during which the user is still engaged but not sending data.

### Warning Signs
- Users report frequent disconnections during normal use
- Echo reconnection events are frequent in browser dev tools
- Connection duration average is low (many short-lived connections)
- Users with long idle periods are disconnected
- `activity_timeout` is set below 15 seconds

### Why Harmful
Too-low timeout causes unnecessary disconnections for users who are engaged but not actively interacting. Each disconnection triggers a reconnection handshake, adding latency and server load. For presence channels, frequent connect/disconnect cycles create noisy presence events.

### Real-World Consequences
- Reading a document for 2 minutes — disconnected, must reconnect
- Dashboard user monitoring metrics disconnects every 30 seconds
- Presence channel shows users constantly joining/leaving
- Server CPU increased by frequent handshake processing
- User complaints: "I keep getting disconnected"

### Preferred Alternative
Set `activity_timeout` based on the expected idle pattern of the application's users. Test with real usage patterns before adjusting.

### Refactoring Strategy
1. Analyze user idle patterns: how long do users typically go between interactions?
2. Set `activity_timeout` to 2x the typical idle time (e.g., if users idle for 30s, set timeout to 60s)
3. Ensure `ping_interval` is proportionally longer (typically 2x `activity_timeout`)
4. Test with real users: monitor reconnection rates after adjustment
5. For passive applications (dashboards, monitoring), set timeout higher (60-120s)
6. Document the `activity_timeout` setting and the rationale

### Detection Checklist
- [ ] What is the current `activity_timeout` setting?
- [ ] Are users reporting frequent disconnections?
- [ ] What is the average connection duration?
- [ ] What is the typical idle pattern for users?
- [ ] Is the timeout aligned with the application's usage pattern?

### Related Rules/Skills/Trees
- Tune activity_timeout to Application Usage Patterns (05-rules.md)
- Configure Reverb Connection Lifecycle (06-skills.md)
- Reverb Timeout and Heartbeat Configuration (06-skills.md)

---

## 5. Pulse Not Enabled on Reverb Server

### Category
Observability · Operations

### Description
Running Reverb without enabling Pulse on the Reverb server, losing visibility into connection states, memory usage, and throughput metrics.

### Why It Happens
Pulse is typically configured on the main application server. The Reverb server is a separate process, and teams forget to configure Pulse there too. Reverb provides its own metrics endpoint, but Pulse aggregates this with other application metrics.

### Warning Signs
- Pulse dashboard shows no Reverb-specific metrics
- Reverb server is not included in Pulse configuration
- Monitoring relies solely on Reverb's `/apps/{appId}/connections` endpoint
- Connection state changes are not visible in the operations dashboard
- Pulse is installed but shows empty Reverb section

### Why Harmful
Without Pulse on the Reverb server, the operations team lacks visibility into WebSocket health. Connection counts, message throughput, error rates, and memory usage are invisible. Performance issues and connection problems go unnoticed until users report them.

### Real-World Consequences
- Memory leak on Reverb server undetected until OOM
- Connection count grows silently until limit reached
- Error rate spike from auth failures unnoticed
- Operations dashboard has a blind spot for WebSocket infrastructure
- Incident response takes longer without Pulse metrics

### Preferred Alternative
Install and configure Pulse on the Reverb server to expose connection metrics, memory usage, and throughput.

### Refactoring Strategy
1. Install Pulse on the Reverb server: `composer require laravel/pulse`
2. Configure Pulse to capture Reverb-specific metrics
3. Point Pulse to a shared database or Redis for metric aggregation
4. Add a Reverb section to the Pulse dashboard
5. Verify Pulse is collecting Reverb connection counts and throughput
6. Set up alerts based on Pulse Reverb metrics

### Detection Checklist
- [ ] Is Pulse installed on the Reverb server?
- [ ] Does Pulse show Reverb-specific metrics?
- [ ] Are connection counts visible in Pulse?
- [ ] Is message throughput tracked?
- [ ] Is there a Pulse dashboard for WebSocket health?

### Related Rules/Skills/Trees
- Enable Pulse on Reverb Server for Connection Metrics (05-rules.md)
- Configure Reverb Connection Lifecycle (06-skills.md)
- Pulse Configuration for Reverb (06-skills.md)
