# ECC Anti-Patterns — Nginx WebSocket Proxy Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Scaling & Production Architecture |
| **Knowledge Unit** | Nginx WebSocket Proxy Configuration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Missing WebSocket Upgrade Headers
2. Single Location Block Only (/app Without /apps)
3. Default 60s proxy_read_timeout
4. proxy_buffering Not Disabled
5. No X-Forwarded-* Headers Forwarded

---

## Repository-Wide Anti-Patterns

- Overengineering
- Hidden Database Queries

---

## Anti-Pattern 1: Missing WebSocket Upgrade Headers

### Category
Framework Usage

### Description
Configuring an Nginx location block for Reverb without the `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, and `proxy_set_header Connection "Upgrade"` headers, causing the WebSocket upgrade handshake to fail.

### Warning Signs
- Client receives HTTP 200 instead of 101 Switching Protocols
- WebSocket connection immediately closed after handshake
- No `Upgrade` header in Nginx location block
- Echo logs show "WebSocket connection failed" in network tab

### Why It Is Harmful
The WebSocket protocol upgrade requires specific HTTP headers. Without `Upgrade: websocket` and `Connection: Upgrade`, the server cannot recognize the request as a WebSocket upgrade and responds with a standard HTTP 200. The client receives an ordinary HTTP response instead of a WebSocket connection. The connection appears to "work" (returns 200) but no WebSocket frames can be exchanged.

### Real-World Consequences
A team deploys Reverb behind Nginx but forgets the upgrade headers. The frontend Echo client attempts WebSocket connection. Nginx returns 200 without upgrading the protocol. Echo shows "connected" in logs (because the HTTP response was successful) but never sends or receives WebSocket frames. Real-time features silently don't work. Debugging takes hours because the HTTP status code is 200.

### Preferred Alternative
Always include the three required directives: `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`, `proxy_set_header Connection "Upgrade";`.

### Refactoring Strategy
1. Add the three upgrade directives to both `/app/` and `/apps/` location blocks
2. Test by verifying HTTP 101 response code on WebSocket handshake
3. Confirm WebSocket frame exchange in browser DevTools

### Detection Checklist
- [ ] `proxy_http_version 1.1` not set
- [ ] `proxy_set_header Upgrade` missing
- [ ] `proxy_set_header Connection "Upgrade"` missing
- [ ] Client receives 200 instead of 101

### Related Rules
- (Rule: Always include WebSocket upgrade headers)

---

## Anti-Pattern 2: Single Location Block Only (/app Without /apps)

### Category
Framework Usage

### Description
Configuring only the `/app/` location block for WebSocket proxying while omitting the `/apps/` location block, causing Reverb's HTTP API endpoints to be unreachable.

### Warning Signs
- WebSocket connections work but HTTP API calls fail
- `/apps/{app_id}/connections` returns 404
- Reverb status/health checks not working
- Only `/app/` location block configured in Nginx

### Why It Is Harmful
Reverb exposes two endpoint categories: `/app/` for WebSocket connections and `/apps/` for HTTP API operations (connection counts, server metrics, health checks). Missing the `/apps/` location means HTTP API requests are not proxied to Reverb. Health checks fail, monitoring cannot retrieve connection metrics, and any operations that depend on Reverb's HTTP API silently fail.

### Real-World Consequences
A team configures Nginx with only `/app/` for WebSocket. Health checks targeting `/apps/1/connections` return 404. The load balancer marks the Reverb instance as unhealthy and routes all traffic away from it. The remaining instances become overloaded. Meanwhile, the Reverb process is actually healthy — it's just the Nginx config that's incomplete.

### Preferred Alternative
Configure both `/app/` and `/apps/` location blocks in the Nginx server block.

### Refactoring Strategy
1. Add a second location block: `location /apps/ { ... proxy_pass http://reverb; ... }`
2. Include the same upgrade headers and timeout directives
3. Verify health check endpoint returns proper response
4. Test that both WebSocket and HTTP API calls work

### Detection Checklist
- [ ] Only `/app/` location block configured
- [ ] `/apps/` requests return 404 or not proxied
- [ ] Reverb HTTP API unreachable through Nginx

### Related Rules
- (Rule: Always configure both `/app/` and `/apps/` location blocks)

---

## Anti-Pattern 3: Default 60s proxy_read_timeout

### Category
Reliability

### Description
Leaving `proxy_read_timeout` at the default 60 seconds for WebSocket connections, causing Nginx to terminate idle connections prematurely.

### Warning Signs
- WebSocket connections drop after exactly 60 seconds of inactivity
- No `proxy_read_timeout` explicitly configured
- EventSource reconnects at 60-second intervals
- Nginx logs show "upstream timed out" every 60 seconds

### Why It Is Harmful
Nginx's default `proxy_read_timeout` (60 seconds) defines how long Nginx waits for data from the upstream server before closing the connection. A WebSocket connection may have no server-sent data for longer than 60 seconds (e.g., a user is reading content). When the timeout fires, Nginx closes the TCP connection. The client must reconnect, losing any subscription state and potentially missing events.

### Real-World Consequences
A chat application has periods of no activity for 1-2 minutes. Every 60 seconds, Nginx kills idle WebSocket connections. Echo reconnects within 3 seconds, but during those 3 seconds a message is sent and lost. Users report "I sometimes miss messages even when I'm online."

### Preferred Alternative
Set `proxy_read_timeout` to 3600 seconds (1 hour) or higher for WebSocket connections.

### Refactoring Strategy
1. Add `proxy_read_timeout 3600s;` to WebSocket location blocks
2. Add `proxy_send_timeout 3600s;` for send-side matching
3. Verify connections survive extended idle periods
4. Remove any error monitoring alerts triggered by timeout events

### Detection Checklist
- [ ] No `proxy_read_timeout` explicitly configured
- [ ] Connections drop at ~60-second intervals
- [ ] Timeout value inherited from Nginx default

### Related Rules
- (Rule: Always set proxy_read_timeout to match expected session duration)

---

## Anti-Pattern 4: proxy_buffering Not Disabled

### Category
Performance

### Description
Leaving `proxy_buffering on` (Nginx default) for WebSocket and SSE streaming endpoints, causing Nginx to buffer response data and deliver it in chunks rather than real-time.

### Warning Signs
- WebSocket frames arrive in bursts
- SSE events are delayed and delivered in groups
- Connection seems to "freeze" then "catch up" periodically
- `proxy_buffering` not explicitly set in location block

### Why It Is Harmful
Nginx buffering collects upstream response data before sending it to the client. For WebSocket connections, buffering can delay frame delivery. For SSE streams, buffering is catastrophic — events accumulate in the Nginx buffer and are only delivered when the buffer fills or the connection closes, destroying real-time delivery.

### Real-World Consequences
An SSE dashboard stream has `proxy_buffering on` (default). Events are dispatched every 5 seconds from PHP. Nginx buffers them for 15-30 seconds before flushing. The dashboard appears to update every 20 seconds in bursts rather than every 5 seconds smoothly. Users complain the dashboard is "laggy."

### Preferred Alternative
Set `proxy_buffering off;` in WebSocket and SSE location blocks.

### Refactoring Strategy
1. Add `proxy_buffering off;` to the location blocks
2. Add `proxy_cache_bypass $http_upgrade;` to prevent caching issues
3. Verify real-time event delivery in browser DevTools
4. Test that SSE events arrive individually, not in batches

### Detection Checklist
- [ ] `proxy_buffering not explicitly disabled`
- [ ] Events arrive in bursts
- [ ] Streaming delivery appears non-real-time

### Related Rules
- (Rule: Always disable proxy buffering for streaming)

---

## Anti-Pattern 5: No X-Forwarded-* Headers Forwarded

### Category
Framework Usage

### Description
Not forwarding `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers from Nginx to Reverb, causing all clients to appear as the Nginx proxy IP address rather than their real IP.

### Warning Signs
- All WebSocket connections show the same client IP (Nginx's IP)
- Per-IP rate limiting does not work correctly
- Logs show incorrect client IPs for WebSocket connections
- `max_connections_per_ip` blocks legitimate traffic from different clients sharing the same proxy IP

### Why It Is Harmful
Without forwarded headers, Reverb sees all connections as originating from the Nginx proxy's IP address. Per-IP rate limiting counts all clients as one, so `max_connections_per_ip` blocks the second client that connects through the same proxy. Authentication logs attribute all WebSocket activity to the Nginx server IP. IP-based security features (geolocation, allowlists) malfunction.

### Real-World Consequences
Reverb has `max_connections_per_ip=100` configured. Without `X-Forwarded-For`, all clients appear as 127.0.0.1 (or the Nginx server IP). After 100 clients connect, all subsequent connection attempts are rejected. User 101 through 1000 cannot connect to WebSocket — all because Reverb sees them as the same IP.

### Preferred Alternative
Forward `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers in the Nginx location blocks.

### Refactoring Strategy
1. Add `proxy_set_header X-Real-IP $remote_addr;` to location blocks
2. Add `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
3. Add `proxy_set_header X-Forwarded-Proto $scheme;`
4. Configure Laravel's trusted proxies to correctly interpret forwarded headers
5. Verify client IPs are correctly logged and rate-limited

### Detection Checklist
- [ ] No forwarded headers in Nginx config
- [ ] All WebSocket connections appear from same IP
- [ ] Per-IP rate limiting or logging malfunctioning

### Related Rules
- (Rule: Always configure X-Forwarded-* headers)
