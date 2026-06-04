# ECC Anti-Patterns — Sticky Sessions & Load Balancing for WebSocket

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Scaling & Production Architecture |
| **Knowledge Unit** | Sticky Sessions & Load Balancing for WebSocket |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Round-Robin Load Balancing for WebSocket (No Sticky Sessions)
2. IP Hash with NAT Clients (Poor Distribution)
3. Default proxy_read_timeout (60s) for WebSocket
4. TCP-Only Health Checks for WebSocket
5. Reverb Exposed Directly Without Load Balancer

---

## Repository-Wide Anti-Patterns

- Overengineering
- Hidden Database Queries

---

## Anti-Pattern 1: Round-Robin Load Balancing for WebSocket (No Sticky Sessions)

### Category
Scalability

### Description
Using round-robin or least-connections load balancing without sticky sessions for multi-server Reverb deployments, causing WebSocket connections to break when subsequent requests route to different servers.

### Warning Signs
- Load balancer configured with round-robin alone
- WebSocket connections drop unpredictably
- Clients reconnect frequently without apparent cause
- No cookie-based or IP hash affinity configured
- Connection state (subscriptions) lost on each request

### Why It Is Harmful
WebSocket connections are stateful — the server that handles the upgrade handshake maintains the connection's subscription map, presence state, and session context. Without sticky sessions, each WebSocket message may be routed to a different server. That server has no knowledge of the connection and terminates it. The client reconnects, gets assigned to another server, and the cycle repeats. Private channel subscriptions and presence state are never stable.

### Real-World Consequences
A multi-server Reverb deployment behind an AWS ALB with round-robin experiences constant connection drops. Users report "I keep being disconnected from chat." Analysis shows Reverb logs with "Unknown connection ID" errors — messages are routed to servers that never handled the original handshake. Every reconnection cycle takes 2-3 seconds, making the chat feature nearly unusable.

### Preferred Alternative
Configure sticky sessions (cookie-based or IP hash) on the load balancer for WebSocket traffic.

### Refactoring Strategy
1. For Nginx: add `ip_hash;` to the upstream block
2. For HAProxy: add `cookie SERVERID insert indirect nocache`
3. For AWS ALB: enable stickiness on the target group with a 1-day duration
4. Test by verifying a WebSocket connection survives load balancer routing

### Detection Checklist
- [ ] No sticky session configuration for WebSocket
- [ ] Connections drop unexpectedly
- [ ] Load balancer distributes WebSocket traffic across servers

### Related Rules
- (Rule: Always use sticky sessions for multi-server Reverb deployments)

---

## Anti-Pattern 2: IP Hash with NAT Clients (Poor Distribution)

### Category
Scalability

### Description
Using IP hash load balancing for WebSocket when the user base includes clients behind NAT gateways (corporate networks, mobile carriers), causing thousands of users to route to a single server.

### Warning Signs
- IP hash configured for WebSocket load balancing
- One server handles significantly more connections than others
- Corporate users or mobile users all connect to the same server
- Load distribution chart shows spikes on specific servers

### Why It Is Harmful
IP hash maps clients to servers based on their IP address. Corporate NAT gateways route thousands of employees through a single public IP. Mobile carriers similarly use shared NAT IPs. All users behind the same NAT IP are hashed to the same backend server. One server receives 5000 connections while another receives 50. The overloaded server exhausts memory and CPU while other servers are idle.

### Real-World Consequences
A large enterprise customer with 3000 employees behind a single NAT IP accesses the application. All 3000 users are hashed to one Reverb instance. That instance's memory reaches 90%. The other 2 instances have 30 connections each. The overloaded instance starts dropping connections due to memory pressure, affecting all 3000 enterprise users.

### Preferred Alternative
Use cookie-based session affinity instead of IP hash for better distribution across all users.

### Refactoring Strategy
1. Switch from IP hash to cookie-based affinity
2. For Nginx: use `sticky` module or `$cookie_serverid` mapping
3. For HAProxy: use `cookie SERVERID insert indirect nocache`
4. For AWS ALB: use application-based stickiness
5. Verify connection distribution is even across instances

### Detection Checklist
- [ ] IP hash configured for WebSocket
- [ ] Uneven connection distribution across servers
- [ ] NAT clients concentrated on specific servers

### Related Rules
- (Rule: Always prefer cookie-based affinity over IP hash)

---

## Anti-Pattern 3: Default proxy_read_timeout (60s) for WebSocket

### Category
Reliability

### Description
Using the default Nginx `proxy_read_timeout` of 60 seconds for WebSocket connections, causing idle connections to be terminated prematurely.

### Warning Signs
- WebSocket connections drop every ~60 seconds
- No `proxy_read_timeout` explicitly set
- EventSource or Echo reconnects at regular 60-second intervals
- Proxy logs show "upstream timed out"

### Why It Is Harmful
Nginx's default `proxy_read_timeout` is 60 seconds. WebSocket connections may have idle periods longer than 60 seconds (e.g., a user reading content without triggering events). When the timeout fires, Nginx closes the connection. The client's Echo client detects the disconnect and reconnects, but this creates unnecessary overhead, potential event loss during the reconnection window, and a degraded user experience.

### Real-World Consequences
A user opens a dashboard with real-time updates but doesn't interact for 2 minutes. After 60 seconds, the WebSocket connection is silently terminated by Nginx's proxy timeout. Echo reconnects after 3 seconds. During those 3 seconds, a critical notification is broadcast and lost. The user never sees the notification because the WebSocket was briefly disconnected.

### Preferred Alternative
Set `proxy_read_timeout` to at least 3600 seconds (1 hour) or higher for WebSocket connections.

### Refactoring Strategy
1. Add `proxy_read_timeout 3600s;` to the WebSocket location block
2. Add `proxy_send_timeout 3600s;` for symmetry
3. Verify connections survive extended idle periods
4. Monitor for any timeout-related disconnection logs

### Detection Checklist
- [ ] No explicit `proxy_read_timeout` for WebSocket
- [ ] Connections drop at ~60-second intervals
- [ ] Default timeout not overridden

### Related Rules
- (Rule: Always set proxy_read_timeout higher than activity_timeout)

---

## Anti-Pattern 4: TCP-Only Health Checks for WebSocket

### Category
Reliability

### Description
Using TCP-level health checks for Reverb instances, which pass even when Reverb is crashed but the port is still open (zombie process), causing the load balancer to route traffic to dead instances.

### Warning Signs
- Health checks only verify TCP port is open
- Load balancer sends traffic to instances where Reverb is unresponsive
- Clients receive connection errors despite "healthy" instances
- No HTTP or WebSocket-specific health check endpoint

### Why It Is Harmful
TCP health checks only verify that something is listening on the port. A crashed Reverb process may leave the port open (zombie), or another process may bind to the same port. TCP health checks cannot distinguish between a healthy Reverb accepting WebSocket connections and a dead Reverb with an open port. The load balancer continues routing traffic to dead instances, causing persistent connection failures for a portion of users.

### Real-World Consequences
One of three Reverb instances crashes due to a memory leak. The port remains open (zombie process). TCP health checks pass. The load balancer continues routing 33% of WebSocket connections to the dead instance. 33% of users cannot connect. The health check shows "all instances healthy" — the issue is invisible in monitoring.

### Preferred Alternative
Configure HTTP health checks that verify Reverb responds to WebSocket protocol requests (e.g., check the `/apps/{id}/connections` endpoint).

### Refactoring Strategy
1. Add an HTTP health check endpoint in Reverb (or use the existing HTTP API)
2. Configure the load balancer to hit `/apps/{app_id}/connections` or a custom health endpoint
3. Set the health check interval to 5 seconds
4. Mark instances as unhealthy on 3 consecutive failures
5. Verify traffic stops routing to instances where Reverb is killed

### Detection Checklist
- [ ] TCP-only health checks for WebSocket
- [ ] Load balancer routes to dead Reverb instances
- [ ] No HTTP health check configured for Reverb

### Related Rules
- (Rule: Always implement WebSocket-specific health checks)

---

## Anti-Pattern 5: Reverb Exposed Directly Without Load Balancer

### Category
Security

### Description
Running Reverb bound to `0.0.0.0:8080` or exposing it directly to the internet without an Nginx reverse proxy, bypassing TLS termination, header forwarding, and rate limiting.

### Warning Signs
- `REVERB_SERVER_HOST=0.0.0.0` in production
- Clients connect directly to Reverb on port 8080
- No Nginx reverse proxy in front of Reverb
- No TLS on the WebSocket connection (plain WS://)
- Direct Reverb port accessible from the internet

### Why It Is Harmful
Direct Reverb exposure bypasses TLS termination (unencrypted WebSocket traffic), removes Nginx's security features (rate limiting, header filtering, WAF), exposes the internal port to the internet, and complicates certificate management. Clients connect over unencrypted WS instead of secure WSS. The Reverb process handles TLS directly, which is less efficient than Nginx's TLS implementation.

### Real-World Consequences
A team deploys Reverb on `0.0.0.0:8080` for convenience. Clients connect via `ws://example.com:8080`. All WebSocket traffic is unencrypted. An attacker on the same network captures WebSocket frames containing user IDs and channel subscription patterns. The application has no WAF protection for the WebSocket endpoint.

### Preferred Alternative
Configure Reverb to bind to `127.0.0.1` only and proxy WebSocket traffic through Nginx with TLS termination.

### Refactoring Strategy
1. Set `REVERB_SERVER_HOST=127.0.0.1` and `REVERB_SERVER_PORT=8080`
2. Configure Nginx with SSL termination and WebSocket proxy headers
3. Update client connection to use WSS://
4. Block port 8080 in the firewall for external access
5. Verify Reverb is not accessible from outside the server

### Detection Checklist
- [ ] `REVERB_SERVER_HOST=0.0.0.0` in production
- [ ] Direct WebSocket access without proxy
- [ ] No TLS on WebSocket connection
- [ ] Reverb port accessible from internet

### Related Rules
- (Rule: Always bind Reverb to internal-only port behind Nginx)
