# ECC Anti-Patterns — Real-Time Dashboard Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Real-Time Notifications |
| **Knowledge Unit** | Real-Time Dashboard Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Broadcasting Individual Metric Events Instead of Aggregates
2. No Client-Side Data Windowing (Browser Memory Exhaustion)
3. State-Change-Based Dispatch Instead of Timer-Based
4. Public Channels for Dashboard Metrics
5. No Graceful Degradation When Backend Is Unavailable

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Broadcasting Individual Metric Events Instead of Aggregates

### Category
Architecture

### Description
Broadcasting every individual metric change (each request, each queue job, each error) as a separate event instead of aggregating over time windows, overwhelming the broadcast system and frontend rendering.

### Warning Signs
- Every HTTP request triggers a broadcast event
- Broadcast system shows high message rates (1000+/s)
- Frontend receives more events per second than it can render
- Dashboard charts flicker or lag from update overload

### Why It Is Harmful
Broadcasting individual events generates orders of magnitude more messages than necessary. A system handling 1000 requests/second would broadcast 1000 events/second — each requiring serialization, Redis pub/sub, WebSocket delivery, and frontend processing. The frontend cannot render 1000 chart updates per second meaningfully. The broadcast system, Redis, and WebSocket server all bear unnecessary load.

### Real-World Consequences
A dashboard broadcasts every HTTP request as an event. At peak traffic (5000 requests/second), Reverb processes 5000 messages/second. The frontend receives 5000 chart updates/second but renders at 60fps maximum. Dashboards jitter, CPU spikes on the client, and the broadcast system reaches capacity limits.

### Preferred Alternative
Pre-aggregate metrics over time windows (5-10 seconds) and broadcast window summaries containing count, avg, p95, and min/max values.

### Refactoring Strategy
1. Implement in-memory metric counters (count, sum, min, max, p95 buffer)
2. Set up a timer (every 5 seconds) to compute and broadcast the window summary
3. Remove per-event broadcast calls
4. Verify broadcast message rate drops from 1000/s to 0.2/s

### Detection Checklist
- [ ] Individual events broadcast for each metric change
- [ ] Broadcast rate exceeds human perception threshold
- [ ] Frontend overwhelmed by update frequency

### Related Rules
- (Rule: Always pre-aggregate metrics before broadcasting)

---

## Anti-Pattern 2: No Client-Side Data Windowing (Browser Memory Exhaustion)

### Category
Performance

### Description
Accumulating all received data points on the client indefinitely without implementing a rolling window, causing browser memory exhaustion and degraded performance.

### Warning Signs
- Dashboard tab memory usage grows over time
- Chart library stores all historical data points
- No `.shift()` or rolling window logic
- Dashboard becomes sluggish after extended use

### Why It Is Harmful
Dashboards left open for hours accumulate thousands or millions of data points. Without windowing, each new data point is appended to an ever-growing array. The browser's memory usage increases linearly with time. Eventually, the tab uses hundreds of MB of memory, chart rendering becomes sluggish, and the browser may crash or kill the tab.

### Real-World Consequences
An operations dashboard is left open on a wall display for 8 hours. Metrics arrive every 5 seconds. After 8 hours, the client has 5,760 data points. The chart library attempts to render all 5,760 points every update. Memory reaches 500MB. The chart re-render takes 2 seconds. The display freezes periodically.

### Preferred Alternative
Maintain a rolling window of data points (e.g., last 100 points), discarding old entries with `.shift()` when the window is full.

### Refactoring Strategy
1. Define a maximum window size (e.g., 100 data points)
2. On each new data point, `push()` then `shift()` if over limit
3. Configure chart library to display only the windowed data
4. Verify memory usage stabilizes after extended runtime

### Detection Checklist
- [ ] No data windowing on client
- [ ] Memory usage grows linearly over time
- [ ] Dashboard performance degrades with session duration

### Related Rules
- (Rule: Always implement client-side data windowing)

---

## Anti-Pattern 3: State-Change-Based Dispatch Instead of Timer-Based

### Category
Design

### Description
Dispatching dashboard metric broadcasts on every state change (event-driven) instead of on a timer, creating bursty, unpredictable broadcast patterns.

### Warning Signs
- Metrics dispatched in `updated()` or event listeners
- Broadcast rate spikes during traffic bursts
- Dashboard updates arrive in bursts then pause
- No periodic dispatch mechanism

### Why It Is Harmful
Event-driven dispatch creates broadcast storms during traffic peaks and silence during lulls. The broadcast system must handle burst capacity 10-100x the average rate. Dashboard updates arrive erratically — rapid updates during bursts, then a sudden pause. This creates a confusing user experience and inefficient resource utilization.

### Real-World Consequences
A dashboard dispatches on every queue job completion. During peak hours (1000 jobs/s), the broadcast system handles 1000 messages/second. During off-peak hours (10 jobs/s), the dashboard receives updates every 100ms then pauses for 100ms then receives another. The chart updates in unpredictable bursts.

### Preferred Alternative
Use timer-based dispatch at a fixed interval (5 seconds) to produce predictable, throttled broadcast updates.

### Refactoring Strategy
1. Replace event-driven broadcast calls with a scheduled daemon or command
2. Set a loop with `sleep(5)` for the dispatch interval
3. Compute and broadcast aggregated metrics each cycle
4. Verify broadcast rate is constant regardless of traffic

### Detection Checklist
- [ ] Metrics dispatched on state change events
- [ ] Broadcast rate varies with traffic patterns
- [ ] Dashboard updates arrive in bursts

### Related Rules
- (Rule: Always use timer-based metric dispatch)

---

## Anti-Pattern 4: Public Channels for Dashboard Metrics

### Category
Security

### Description
Using public channels for dashboard broadcasting, exposing sensitive operational metrics (error rates, user counts, revenue data) to any connected client.

### Warning Signs
- Dashboard uses `new Channel()` instead of `new PrivateChannel()`
- No authorization check for dashboard subscription
- Unauthenticated users can access dashboard data
- Public channel used for internal metrics

### Why It Is Harmful
Public channels allow any client with the channel name to subscribe and receive all broadcast data. Dashboard metrics often include sensitive information: error rates (security posture), concurrent user counts (business intelligence), revenue data (financial), or system architecture details. Public exposure leaks competitive intelligence and security-relevant information.

### Real-World Consequences
An internal operations dashboard broadcasts to `dashboard.metrics` as a public channel. An attacker discovers the channel name via browser DevTools and subscribes. They receive real-time error rates, user counts, and system load — information used to plan a targeted attack during peak traffic.

### Preferred Alternative
Always use private (or presence) channels for dashboard data, scoped per user or team.

### Refactoring Strategy
1. Change `new Channel()` to `new PrivateChannel('dashboard.team.' . $team->id)`
2. Register auth callback in `routes/channels.php`
3. Scope dashboard access to authenticated users
4. Verify unauthenticated subscription attempts return 403

### Detection Checklist
- [ ] Dashboard uses public channels
- [ ] No authorization check for subscriptions
- [ ] Sensitive metrics exposed to unauthenticated clients

### Related Rules
- (Rule: Always use private channels for dashboard data)

---

## Anti-Pattern 5: No Graceful Degradation When Backend Is Unavailable

### Category
Design

### Description
Designing dashboards that show blank charts, loading spinners, or error states when the broadcast backend disconnects, instead of displaying stale data with a freshness indicator.

### Warning Signs
- Dashboard shows a loading spinner when WebSocket disconnects
- Charts go blank during network interruptions
- No stale data fallback
- Users see empty dashboards with no indication of connection status

### Why It Is Harmful
WebSocket connections are inherently less reliable than HTTP. Network interruptions, proxy timeouts, server restarts, and brief connectivity issues cause disconnections. During these windows, the dashboard shows a blank state — even if the data source is still operational. Users cannot make decisions with a blank dashboard. They perceive the application as broken.

### Real-World Consequences
A network blip causes a 5-second WebSocket disconnection. The dashboard shows a loading spinner for 5 seconds — the same spinner it shows on initial load. A manager looking at the dashboard during this window sees "loading..." and assumes the system is down. They page the on-call engineer unnecessarily.

### Preferred Alternative
Design dashboards to show the last known data with a visual freshness indicator (stale banner, dimmed colors) when the broadcast backend disconnects.

### Refactoring Strategy
1. Store the last received dashboard data in client state
2. Monitor Echo connection status
3. On disconnect: keep displaying last data, show "stale data" banner
4. On reconnect: update data, remove banner
5. Verify the dashboard is never blank (except initial load)

### Detection Checklist
- [ ] Dashboard shows blank/loading state on disconnect
- [ ] No stale data fallback
- [ ] No connection status indicator for users

### Related Rules
- (Rule: Always implement graceful degradation when backend is unavailable)
