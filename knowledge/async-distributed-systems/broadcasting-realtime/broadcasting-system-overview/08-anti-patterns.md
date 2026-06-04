---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K030 — Broadcasting System Overview
Knowledge ID: K030
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Broadcasting as Primary Data Transport | Architecture | High |
| 2 | Giant Broadcast Payloads | Performance | Medium |
| 3 | No Fallback for Disconnected Clients | Reliability | High |
| 4 | Over-Reliance on Broadcasting for Server-to-Server Communication | Architecture | Medium |
| 5 | Broadcasting All Events Without Selectivity | Performance | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| WebSocket as Sole Data Source | High — clients fail to render initial state on page load | Always fetch initial state via HTTP; use broadcasts for updates |
| Queue Backlog Blindness | Critical — broadcast delivery delays invisible until users complain | Monitor broadcast queue depth; alert on backlog growth |
| Public Channel for Private Data | High — sensitive data exposed to all subscribers | Auditing rule: flag public channels with user-specific payloads |

---

## 1. Broadcasting as Primary Data Transport

### Category
Architecture

### Description
Treating WebSocket broadcasts as the sole data transport for client-side state, requiring clients to maintain a persistent connection to receive critical data. Clients that load a page after the broadcast occurred never receive the initial state.

### Why It Happens
- Developer assumes WebSocket connection is always established
- Not designing for the "page reload" scenario where initial state must be fetched
- Broadcasting is easier than building HTTP endpoints for initial data fetch
- Real-time focus overshadows the need for reliable initial state loading
- Copying patterns from chat applications where messages are ephemeral and history is fetched separately

### Warning Signs
- Page content appears empty on reload until the next broadcast event arrives
- Client-side code has no initial data fetch on mount
- "Loading..." state persists until a broadcast event fires
- New page visits show blank UI for seconds until data arrives via WebSocket
- Error handling for WebSocket disconnect leaves UI permanently empty

### Why Harmful
- Broadcasting is push-only and unreliable by design — messages can be lost on disconnect
- Clients that miss the broadcast never get the data
- Page reload, tab restore, or navigation all require fresh data
- Mobile clients with intermittent connectivity lose all state
- The application appears broken to users who reload the page

### Consequences
- Blank screens on page load until a broadcast event arrives (may never come)
- Poor UX for users with intermittent connectivity
- Lost data for clients that briefly disconnect during broadcast
- Increased support tickets about "page not loading"
- Inconsistent state between clients

### Alternative
- Always fetch initial state via HTTP API on page load
- Use broadcasts only for subsequent real-time updates
- Design components to render with HTTP-fetched data, then subscribe for updates

### Refactoring Strategy
1. Identify all UI components that depend solely on broadcast events for data
2. Add HTTP endpoint or route to fetch initial state
3. Update components to fetch data on mount, then subscribe for updates
4. Handle loading state during initial fetch
5. Test with WebSocket disconnected — verify page renders with HTTP data

### Detection Checklist
- [ ] All UI components fetch initial state via HTTP on mount
- [ ] Broadcasts are used only for subsequent real-time updates
- [ ] Application works without WebSocket connection (falls back to HTTP data)
- [ ] No component shows blank/loading indefinitely waiting for broadcast
- [ ] Error handling for broadcast failures doesn't affect HTTP data display

### Related Rules
- keep-broadcast-payloads-minimal

### Related Skills
- Implement `ShouldBroadcast` for Real-Time Events

### Related Decision Trees
- ShouldBroadcast vs ShouldBroadcastNow

---

## 2. Giant Broadcast Payloads

### Category
Performance

### Description
Including full model serializations (entire user objects, complete order data with all relations) in broadcast events. Broadcasts are pushed through WebSocket connections — large payloads increase latency, bandwidth, and client-side processing time.

### Why It Happens
- Passing the full Eloquent model to the broadcast event constructor
- Not considering that broadcast payloads are serialized and sent over WebSocket
- Reusing the same event class for queued listeners AND broadcasts
- Convenience — the model has all the data, so pass the model
- Not profiling WebSocket message size

### Warning Signs
- Broadcast event constructor accepts full Eloquent models
- WebSocket messages exceed 10KB
- Client-side processing time spikes on event receipt
- Bandwidth usage correlates with broadcast event frequency
- Mobile clients experience lag or high data usage from broadcasts

### Why Harmful
- Serialization time increases with payload size — delays the broadcast
- WebSocket message delivery is slower through the wire
- Client-side JSON parsing and rendering is slower for large payloads
- Mobile clients consume cellular data for unnecessary fields
- Pusher/Reverb message size limits may be exceeded

### Consequences
- Increased latency between server event and client display
- Higher bandwidth costs (especially for SaaS broadcasters like Pusher)
- Sluggish UI on clients with large event handlers
- Mobile data wastage for unnecessary payload fields
- Broadcast driver may refuse messages exceeding size limits

### Alternative
- Send only IDs and let clients fetch details via API
- Include only the fields the client needs for the real-time update
- Use `broadcastWith()` to customize the payload explicitly

### Refactoring Strategy
1. Identify broadcast events with large payloads (model instances, relation graphs)
2. Replace models with scalar values (IDs, status strings)
3. Update Echo event handlers to fetch details from API if needed
4. Measure payload size reduction (aim for <2KB per message)
5. Test real-time delivery latency improvement

### Detection Checklist
- [ ] Broadcast payloads contain only scalar values (IDs, strings, booleans)
- [ ] No Eloquent model instances passed to broadcast events
- [ ] WebSocket message size under 2KB
- [ ] `broadcastWith()` method used for explicit payload control
- [ ] Mobile client bandwidth profile shows minimal broadcast data usage

### Related Rules
- keep-broadcast-payloads-minimal

### Related Skills
- Implement `ShouldBroadcast` for Real-Time Events

### Related Decision Trees
- Broadcasting Driver Selection: Pusher vs Reverb vs Ably

---

## 3. No Fallback for Disconnected Clients

### Category
Reliability

### Description
Designing the real-time feature with the assumption that all clients are always connected and broadcasts always arrive. No mechanism to recover state after WebSocket disconnection, page reload, or tab restore.

### Why It Happens
- Development environments have stable WebSocket connections
- Not testing with WebSocket disconnection scenarios
- Assuming Echo handles reconnection automatically (it does, but missed messages are lost)
- Chat/app pattern where ephemeral messages are acceptable
- Not considering mobile clients with intermittent connectivity

### Warning Signs
- Users report missing data after network interruptions
- Page reload causes loss of broadcast state
- Mobile users see stale data on reconnect
- Reconnection logic not implemented in Echo configuration
- No `catch()` or error handling on Echo subscriptions

### Why Harmful
- WebSocket connections are inherently unreliable — disconnections happen
- Echo reconnects but does NOT replay missed messages
- Users lose all state that was delivered via broadcasts during disconnection
- No mechanism to reconcile server state after reconnect
- Data loss is invisible — no error, just missing updates

### Consequences
- Users see stale or incomplete data after reconnect
- Missed notifications, orders, or messages during disconnection window
- Poor mobile UX (frequent disconnections in transit)
- Support tickets about "missing data" that cannot be reproduced with stable connection
- Inconsistent state between users who did/didn't disconnect

### Alternative
- Always fetch initial state on page load (HTTP)
- Implement periodic state refresh (polling as fallback)
- Track last known state and reconcile on reconnect
- Use Echo's `connect`/`disconnect` events to trigger state refresh
- Display "reconnecting" indicator during disconnection

### Refactoring Strategy
1. Add HTTP API endpoints for initial state fetch per feature
2. Implement Echo reconnection handler: `Echo.connector.on('reconnected', () => fetchState())`
3. Add `connect`/`disconnect` event listeners for UI feedback
4. Implement periodic state refresh for critical data (every 30-60s)
5. Test with WebSocket server restart — verify state recovery

### Detection Checklist
- [ ] Initial state fetched via HTTP on page load
- [ ] Echo reconnection handler triggers state refresh
- [ ] `connect`/`disconnect` events show UI feedback
- [ ] Periodic polling fallback for critical data
- [ ] Mobile users recover state after connectivity loss
- [ ] No "blank" states after WebSocket reconnection

### Related Rules
- monitor-broadcast-queue-backlog

### Related Skills
- Implement `ShouldBroadcast` for Real-Time Events

### Related Decision Trees
- ShouldBroadcast vs ShouldBroadcastNow

---

## 4. Over-Reliance on Broadcasting for Server-to-Server Communication

### Category
Architecture

### Description
Using Laravel broadcasting (WebSockets) to push events between server-side processes or microservices. Broadcasting is designed for server-to-client push — using it for server-to-server communication creates unnecessary complexity and reliability issues.

### Why It Happens
- Broadcasting is already set up, so it's the path of least resistance
- Misunderstanding that broadcasting is for server-to-client only
- Not knowing about queues, message buses, or job dispatch for inter-process communication
- All services share the same Laravel codebase, so broadcasting seems convenient
- WebSocket pub/sub pattern is familiar from other systems

### Warning Signs
- Server-side code subscribes to broadcast channels via Echo
- Events are broadcast for the purpose of being caught by other services
- Queue jobs listen for broadcast events to trigger processing
- Broadcast events have no client-side consumers
- Services communicate through WebSocket channels

### Why Harmful
- Broadcasting is push-only with no delivery guarantees — messages can be lost
- No persistence — if the subscriber is down, the message is gone
- Adds WebSocket infrastructure dependency for internal communication
- Slower than direct queue dispatch (serialize → push → broadcast → WebSocket → receive → deserialize)
- Channels intended for user data may leak system events

### Consequences
- Lost internal messages on WebSocket disconnect
- Unnecessary WebSocket infrastructure for internal traffic
- Debugging complexity (messages go through WebSocket instead of direct dispatch)
- Channel auth conflicts (server-to-server channels mixed with user channels)
- Scaling limitations (WebSocket connections between services)

### Alternative
- Use queue jobs for server-to-server async communication
- Use message buses (RabbitMQ, Kafka) for service-to-service events
- Use Laravel event system + queue for internal async processing
- Use HTTP callbacks for cross-service notification

### Refactoring Strategy
1. Identify all broadcast events consumed only by server-side code
2. Replace with queue job dispatch: `ProcessOrderShipped::dispatch($data)`
3. Remove server-side Echo subscription code
4. Remove unnecessary broadcast channels (no client consumers)
5. Keep broadcast events only where client-side Echo listeners exist

### Detection Checklist
- [ ] All broadcast events have client-side Echo listeners
- [ ] No server-side code subscribes to broadcast channels
- [ ] Server-to-server communication uses queue jobs or message buses
- [ ] No events broadcast solely for internal consumption
- [ ] Architecture documented: broadcast = server→client, queues = server→server

### Related Rules
- keep-broadcast-payloads-minimal

### Related Skills
- Implement `ShouldBroadcast` for Real-Time Events

### Related Decision Trees
- Broadcasting Driver Selection: Pusher vs Reverb vs Ably

---

## 5. Broadcasting All Events Without Selectivity

### Category
Performance

### Description
Implementing `ShouldBroadcast` on every event class in the application regardless of whether clients need real-time updates. This creates unnecessary queue load, WebSocket traffic, and broadcasting driver costs.

### Why It Happens
- Developer wants "full real-time" without evaluating what features benefit
- Convenience — implementing the interface takes seconds
- Not considering that each broadcast creates a queue job and WebSocket message
- Copy-paste from other event classes that have a legitimate need
- "It works, so it must be fine" mindset

### Warning Signs
- Every event class implements `ShouldBroadcast`
- Broadcast queue workers are saturated with unnecessary traffic
- Broadcasting driver connection/usage limits are hit
- WebSocket bandwidth is high despite few real-time features
- Developer cannot list which features depend on each broadcast event

### Why Harmful
- Each broadcast creates a queue job — unnecessary load on queue workers
- WebSocket traffic from irrelevant events consumes bandwidth
- Broadcasting driver costs scale with message count (Pusher/Ably charge per message)
- `ShouldBroadcastNow` events block the HTTP response for unnecessary broadcasts
- Client-side code must process and discard irrelevant events

### Consequences
- Higher infrastructure costs (more queue workers, higher broadcasting plan)
- Worker resources wasted on unnecessary broadcasts
- Client-side performance degradation from processing irrelevant events
- Broadcasting driver rate limits hit by non-essential traffic
- Debugging difficulty — real-time event stream is noisy with irrelevant events

### Alternative
- Only implement `ShouldBroadcast` on events that user-facing features consume
- Evaluate each event: "does a connected client need to know this immediately?"
- For non-real-time events, remove `ShouldBroadcast` and use standard queue jobs
- Use broadcast event naming (`broadcastAs()`) to clearly identify real-time events

### Refactoring Strategy
1. List all events implementing `ShouldBroadcast` or `ShouldBroadcastNow`
2. For each, identify the client-side Echo listener that consumes it
3. Remove `ShouldBroadcast` from events with no client consumer
4. For events with consumers, verify the broadcast is truly needed over polling
5. Monitor broadcast queue depth — expect reduction after pruning

### Detection Checklist
- [ ] Only events with client-side consumers implement `ShouldBroadcast`
- [ ] No event implements `ShouldBroadcast` without an Echo `.listen()` handler
- [ ] Broadcast queue volume correlates with actual real-time features
- [ ] Broadcasting driver costs are proportional to real-time usage
- [ ] Client-side code receives only relevant broadcast events

### Related Rules
- use-broadcast-now-for-realtime
- monitor-broadcast-queue-backlog

### Related Skills
- Implement `ShouldBroadcast` for Real-Time Events

### Related Decision Trees
- ShouldBroadcast vs ShouldBroadcastNow
