# Metadata
Domain: Real-Time Systems
Subdomain: Scaling & Production Architecture
Knowledge Unit: Sticky Sessions & Load Balancing for WebSocket
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
WebSocket connections require session affinity (sticky sessions) when multiple server instances are deployed behind a load balancer. Unlike HTTP, where any server can handle any request, a WebSocket connection is pinned to the specific server instance that handled its initial upgrade handshake. The load balancer must consistently route subsequent WebSocket traffic from the same client to the same server. Sticky sessions are implemented via IP hash balancing, cookie-based affinity (insertion or learned), or application-layer routing. Nginx uses `ip_hash`, HAProxy uses `stick-table` with cookies, and AWS ALB uses target group stickiness. Without sticky sessions, WebSocket reconnections may land on different servers, losing channel subscriptions and presence state.

## Core Concepts
A WebSocket connection is a long-lived TCP socket bound to a specific server process. The server maintains in-memory state for the connection: channel subscriptions, presence membership, authentication context. If a client reconnects and hits a different server, that server has no knowledge of the previous connection's state. Sticky sessions ensure the load balancer sends each client to the same server for the duration of their session. For Reverb with Redis pub/sub, sticky sessions are still required because each connection's subscription state is local to the instance—Redis only handles event fan-out, not subscription migration.

## Mental Models
Think of sticky sessions as coat check tags. You hand your coat (WebSocket connection) to a specific server and get a tag. When you return (reconnect), you show your tag, and the coat check directs you to the same server where your coat (connection state) is stored.

## Internal Mechanics
Sticky sessions work at the load balancer level. For **IP hash**, the load balancer hashes the client's IP address to deterministically select a backend server. All requests from that IP go to the same server. For **cookie-based** affinity, the load balancer inserts a cookie (e.g., `SERVERID`) on the first response that identifies the backend server. Subsequent requests with that cookie are routed to the same server. For **learned** cookie affinity, the load balancer observes the server that responds and associates the client's cookie with that server. Nginx upstream `ip_hash` directive enables IP hash. HAProxy uses `cookie SERVERID insert indirect` for cookie-based. AWS ALB uses target group stickiness with a configurable duration (default 1 day).

## Patterns
- **IP hash for simple deployments**: Works when clients have stable IPs (no NAT hairpinning, no large ISP pools)
- **Cookie-based for flexibility**: Works through NAT, proxies, and mobile networks where client IPs change
- **Dedicated load balancer**: Nginx, HAProxy, AWS ALB, or GCP HTTP(S) LB with WebSocket support
- **Sticky session duration**: Align with expected session length; too short causes frequent reconnections

## Architectural Decisions
- **IP hash vs. cookie**: IP hash is simpler but fails with shared IPs (corporate NAT, mobile carriers); cookie-based is more reliable but adds header overhead
- **Load balancer termination**: TLS should be terminated at the load balancer, then pass plain WebSocket traffic to Reverb
- **Health check path**: Load balancer health checks must use a WebSocket-friendly endpoint, not the HTTP health check

## Tradeoffs
- **Uneven distribution**: IP hash may distribute connections unevenly if client IPs cluster (e.g., all users behind one corporate NAT)
- **Cookie dependency**: Cookie-based affinity fails if clients block or clear cookies
- **Cold server handling**: New server added to the pool has zero connections; clients are gradually routed to it
- **Graceful removal complexity**: Draining connections from a server before removal requires careful coordination
- **Load balancer as single point of failure**: The load balancer itself must be highly available

## Performance Considerations
- IP hash distribution: With ~1000 clients behind a /24 subnet, all route to one server (poor distribution)
- Cookie overhead: Insertion cookies add ~30-50 bytes per response; negligible for WebSocket handshake
- Load balancer connection tracking: Stateful load balancers track connection state; memory scales with active connections
- TLS termination offloads CPU work from Reverb to the load balancer (more efficient)

## Production Considerations
- Always test sticky session behavior with your specific load balancer before production
- Configure health checks to verify Reverb is accepting WebSocket connections, not just TCP
- Set appropriate timeout values matching Reverb's `activity_timeout` (typically 60-120s)
- Monitor backend server connection distribution to detect uneven balancing
- Implement connection draining for rolling deployments (allow in-flight connections to complete before shutdown)
- For cookie-based affinity, set the cookie name to avoid collisions with application cookies
- Consider using a dedicated subdomain (e.g., `ws.example.com`) for WebSocket traffic to separate from HTTP routing

## Common Mistakes
- Assuming round-robin load balancing works for WebSocket (it breaks reconnections)
- Forgetting that IP hash breaks for users behind large NAT gateways (all users map to one server)
- Not configuring health checks (load balancer keeps sending traffic to dead Reverb instances)
- Setting proxy timeouts lower than the WebSocket heartbeat interval (connections get prematurely terminated)
- Using HTTP health checks instead of WebSocket-specific health checks (false healthy/unhealthy states)

## Failure Modes
- **Sticky session loss**: Cookie expires or is cleared; client reconnects to wrong server; subscription state lost
- **IP hash flapping**: Client IP changes mid-session (mobile network handoff); client routed to different server
- **Load balancer saturation**: Connection tracking table fills; new WebSocket connections rejected
- **Health check false positive**: Health check passes but Reverb is not accepting WebSocket connections
- **Backend server crash**: All connections to the crashed server are lost; sticky sessions cause reconnection storm to remaining servers

## Ecosystem Usage
- Required for all multi-server Reverb deployments
- Nginx upstream configuration (`ip_hash` directive; `sticky` module for cookie-based)
- HAProxy backend configuration (`cookie SERVERID insert indirect`)
- AWS ALB target group stickiness (enable "Stickiness" with 1-day duration)
- GCP HTTP(S) Load Balancer with backend service session affinity
- Kubernetes ingress controllers (NGINX Ingress, Traefik) with session affinity configuration

## Related Knowledge Units
- K04: Reverb Horizontal Scaling via Redis
- K32: Nginx WebSocket Proxy Configuration
- K33: Dedicated Reverb Fleet Architecture
- K15: Reconnection Strategies & Storm Mitigation

## Research Notes
Sticky session configuration varies significantly between load balancer providers. Nginx's `ip_hash` is the simplest but has the distribution issue with NAT clients. The `nginx-sticky-module` (third-party) or `nginx-plus` session persistence provides cookie-based affinity. AWS ALB stickiness is the easiest managed option but limits control. HAProxy offers the most flexible sticky session configuration. Laravel Forge supports multiple Reverb instances behind a load balancer with automatic sticky session configuration for supported providers.
