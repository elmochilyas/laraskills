# ECC Anti-Patterns — SSE Implementation in Laravel

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | SSE (Server-Sent Events) |
| **Knowledge Unit** | SSE Implementation in Laravel |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Maximum Connection Duration (PHP-FPM Worker Exhaustion)
2. Missing Headers for SSE Streaming
3. No Heartbeat Events (Proxy Timeout Disconnections)
4. No connection_aborted() Check
5. No Last-Event-ID Replay for Reconnected Clients

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering

---

## Anti-Pattern 1: No Maximum Connection Duration (PHP-FPM Worker Exhaustion)

### Category
Performance

### Description
Using `set_time_limit(0)` or an infinite loop in SSE stream handlers without a connection duration ceiling, causing PHP-FPM workers to be held indefinitely and the worker pool to exhaust.

### Warning Signs
- `set_time_limit(0)` called in SSE endpoint
- PHP-FPM worker count rises over time
- HTTP requests start queuing after SSE connections accumulate
- `pm.max_children` reached within minutes of deployment

### Why It Is Harmful
Each SSE connection holds one PHP-FPM worker for its entire duration. Without a maximum duration, workers are never freed. After N connections equal to `pm.max_children`, all workers are consumed by SSE streams — HTTP requests cannot be served and the application becomes unresponsive.

### Real-World Consequences
A dashboard with 50 simultaneous viewers opens 50 SSE connections. With `pm.max_children = 50` and no duration ceiling, all workers are consumed. New HTTP requests (login, API calls) queue indefinitely. The application appears down even though the server process is running.

### Preferred Alternative
Implement a maximum connection duration (e.g., 60 seconds) and rely on `EventSource` auto-reconnect to transparently establish a new connection with a freed worker.

### Refactoring Strategy
1. Set a `$maxDuration` variable (30-60s) in the stream callback
2. Track start time with `$start = time()`
3. Loop while `(time() - $start) < $maxDuration`
4. Remove `set_time_limit(0)` — let the request expire naturally
5. Verify in logs that connections cycle every `$maxDuration` seconds

### Detection Checklist
- [ ] `set_time_limit(0)` or infinite loop in SSE handler
- [ ] No connection duration ceiling
- [ ] PHP-FPM worker pool exhausts under SSE load

### Related Rules
- (Rule: Always set a maximum connection duration for SSE streams)

---

## Anti-Pattern 2: Missing Headers for SSE Streaming

### Category
Framework Usage

### Description
Returning an SSE response without the required `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `X-Accel-Buffering: no` headers, causing the browser or proxy to buffer or reject the stream.

### Warning Signs
- Events never reach the client
- Nginx buffers response in large chunks
- EventSource fires `onerror` immediately
- Browser receives `text/html` content type instead of `text/event-stream`

### Why It Is Harmful
Without `Content-Type: text/event-stream`, the browser's EventSource API cannot parse the response. Without `Cache-Control: no-cache`, proxies may cache the stream. Without `X-Accel-Buffering: no`, Nginx buffers the entire response and delivers it as a single chunk rather than streaming individual events.

### Real-World Consequences
A team implements SSE with `response()->stream()` but omits all headers. Nginx buffers the 60-second stream and delivers the entire payload as one response after the connection closes. The EventSource receives no events for 60 seconds, then receives all events at once — defeating real-time delivery.

### Preferred Alternative
Always pass the three required headers in the response array: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.

### Refactoring Strategy
1. Add headers to the `response()->stream()` call as the third argument
2. Set `Content-Type: text/event-stream`
3. Set `Cache-Control: no-cache`
4. Set `X-Accel-Buffering: no` when behind Nginx
5. Verify in browser DevTools that the response has the correct content type

### Detection Checklist
- [ ] `Content-Type: text/event-stream` missing from SSE response
- [ ] `X-Accel-Buffering: no` missing when behind Nginx
- [ ] Events arrive in bursts or not at all

### Related Rules
- (Rule: Always set Content-Type, Cache-Control, and X-Accel-Buffering headers on SSE endpoints)

---

## Anti-Pattern 3: No Heartbeat Events (Proxy Timeout Disconnections)

### Category
Reliability

### Description
SSE stream with no periodic heartbeat comments, causing proxies and load balancers to terminate idle connections after their default timeout (typically 60s).

### Warning Signs
- EventSource fires `onerror` and reconnects every ~60 seconds
- Proxy logs show "upstream timed out" messages
- Users see the dashboard reconnect periodically
- No heartbeat output in the SSE response body

### Why It Is Harmful
Proxies and load balancers (Nginx, HAProxy, AWS ALB) have idle timeout defaults of 60 seconds. An SSE stream with no data for 60s appears idle and is terminated. The client reconnects via EventSource, but this causes unnecessary connection overhead, missed events during the reconnection window, and a degraded user experience.

### Real-World Consequences
An SSE dashboard stream has no data for 30 seconds (slow metrics). Nginx's 60s `proxy_read_timeout` fires. Connection drops. EventSource reconnects in 3 seconds — but the 3-second gap shows "reconnecting" in the dashboard. This happens every minute, creating a poor user experience.

### Preferred Alternative
Send periodic heartbeat comments (`: heartbeat\n\n`) every 5-10 seconds to keep the connection alive.

### Refactoring Strategy
1. Add `echo ": heartbeat\n\n"; ob_flush(); flush();` in the stream loop
2. Set heartbeat interval to 5-10 seconds
3. Configure `proxy_read_timeout` higher than the heartbeat interval
4. Verify in DevTools Network tab that the connection stays open

### Detection Checklist
- [ ] No heartbeat output in SSE response
- [ ] Connections drop at predictable intervals
- [ ] EventSource reconnects periodically without data changes

### Related Rules
- (Rule: Always implement heartbeat events in SSE streams)

---

## Anti-Pattern 4: No connection_aborted() Check

### Category
Performance

### Description
SSE stream loop does not check `connection_aborted()`, causing the server to continue generating and flushing events for clients that have already disconnected.

### Warning Signs
- CPU usage stays high after clients disconnect
- Stream continues writing after client navigation
- Logs show events dispatched to disconnected clients
- No `connection_aborted()` call in the stream loop

### Why It Is Harmful
When a client navigates away or closes the tab, the PHP process continues running until the maximum duration is reached. The loop wastes CPU on `ob_flush()` and `flush()` calls that go nowhere, consumes memory for event data, and holds the PHP-FPM worker for the full duration despite no active client.

### Real-World Consequences
A user opens a dashboard SSE stream, views it for 10 seconds, then navigates away. The SSE loop continues for another 50 seconds (out of 60s max), generating 50 heartbeat events and 50 event checks — all writing to a closed TCP connection. With 1000 users doing this daily, the wasted CPU minutes accumulate significantly.

### Preferred Alternative
Check `connection_aborted()` at the top of each stream loop iteration and `break` immediately if the client disconnected.

### Refactoring Strategy
1. Add `if (connection_aborted()) break;` at the start of the stream loop
2. Verify that PHP processes end promptly when clients disconnect
3. Check `pm.status` for reduced worker consumption

### Detection Checklist
- [ ] No `connection_aborted()` check in stream loop
- [ ] CPU usage persists after client disconnects
- [ ] Workers held for max duration despite no active client

### Related Rules
- (Rule: Always check connection_aborted() in SSE stream loops)

---

## Anti-Pattern 5: No Last-Event-ID Replay for Reconnected Clients

### Category
Reliability

### Description
Omitting event IDs (`id:` fields) from SSE events and not implementing `Last-Event-ID` replay logic, causing events dispatched during disconnections to be permanently lost.

### Warning Signs
- Events have no `id:` field
- Reconnecting clients miss events from the disconnection window
- No server-side logic to retrieve missed events
- `$_SERVER['HTTP_LAST_EVENT_ID']` never checked

### Why It Is Harmful
Without event IDs, the browser's EventSource cannot send the `Last-Event-ID` header on reconnect. The server has no way to know which events the client missed. All events dispatched during the disconnection window are lost forever. For notifications, metric updates, or status changes, this creates data gaps that never resolve.

### Real-World Consequences
An SSE notification feed with no event IDs drops connection for 5 seconds. During those 5 seconds, 3 critical alerts are dispatched. The client reconnects but receives no missed events. The user believes no alerts were generated. A production incident goes unnoticed because the alert events were lost.

### Preferred Alternative
Include an `id:` field in every SSE event and implement server-side replay logic that reads `Last-Event-ID` from the reconnection request and replays missed events.

### Refactoring Strategy
1. Add `echo "id: {$event['id']}\n";` to each event output
2. Store events in a fast store (Redis with TTL) keyed by event ID
3. On reconnection, read `Last-Event-ID` from `$_SERVER['HTTP_LAST_EVENT_ID']`
4. Replay events with IDs greater than the last received ID
5. Verify replay by disconnecting and reconnecting programmatically

### Detection Checklist
- [ ] No `id:` field in SSE event format
- [ ] Events lost during disconnection windows
- [ ] `Last-Event-ID` header not handled server-side

### Related Rules
- (Rule: Always include event IDs and implement Last-Event-ID replay)

---

## Anti-Pattern 6: No Rate Limiting on SSE Endpoints

### Category
Security

### Description
SSE endpoint exposed without rate limiting, allowing attackers to exhaust PHP-FPM workers by opening many connections simultaneously.

### Warning Signs
- SSE endpoint has no `throttle` middleware
- Worker pool exhausts rapidly under concurrent connections
- No auth check before establishing SSE stream
- Public SSE endpoint accessible without authentication

### Why It Is Harmful
Each SSE connection holds a PHP-FPM worker. Without rate limiting, an attacker can open hundreds of connections from a single client, consuming `pm.max_children` and denying service to legitimate HTTP requests. SSE endpoints are particularly vulnerable to this because connections are long-lived.

### Real-World Consequences
An attacker opens 50 SSE connections to a public endpoint. With `pm.max_children = 50`, all workers are consumed. The application cannot handle any HTTP requests for the duration of those connections (up to 60 seconds each). Repeated connections create a sustained DoS.

### Preferred Alternative
Apply `throttle` middleware to SSE endpoints, and require authentication where appropriate.

### Refactoring Strategy
1. Add `->middleware('throttle:10,1')` to the SSE route
2. Set a per-IP connection limit appropriate for expected usage
3. Add authentication middleware if the endpoint should be user-specific
4. Monitor connection rates in production

### Detection Checklist
- [ ] No rate limiting on SSE route
- [ ] Public SSE endpoint without authentication
- [ ] Worker pool exhaustable by single client

### Related Rules
- (Rule: Always apply rate limiting to SSE endpoints)
