# Decomposition: Sticky Sessions Load Balancing Websocket

## Topic Overview
WebSocket connections require session affinity (sticky sessions) when multiple server instances are deployed behind a load balancer. Unlike HTTP, where any server can handle any request, a WebSocket connection is pinned to the specific server instance that handled its initial upgrade handshake. The load balancer must consistently route subsequent WebSocket traffic from the same client to the same server. Sticky sessions are implemented via IP hash balancing, cookie-based affinity (insertion o...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scaling-production-architecture/K14-sticky-sessions-load-balancing-websocket/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sticky Sessions Load Balancing Websocket
- **Purpose:** WebSocket connections require session affinity (sticky sessions) when multiple server instances are deployed behind a load balancer. Unlike HTTP, where any server can handle any request, a WebSocket connection is pinned to the specific server instance that handled its initial upgrade handshake. The load balancer must consistently route subsequent WebSocket traffic from the same client to the same server. Sticky sessions are implemented via IP hash balancing, cookie-based affinity (insertion o...
- **Difficulty:** Advanced
- **Dependencies:
  - K04: Reverb Horizontal Scaling via Redis
  - K32: Nginx WebSocket Proxy Configuration
  - K33: Dedicated Reverb Fleet Architecture
  - K15: Reconnection Strategies & Storm Mitigation

## Dependency Graph
**Depends on:**
  - K04: Reverb Horizontal Scaling via Redis
  - K32: Nginx WebSocket Proxy Configuration
  - K33: Dedicated Reverb Fleet Architecture
  - K15: Reconnection Strategies & Storm Mitigation

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **IP hash for simple deployments**: Works when clients have stable IPs (no NAT hairpinning, no large ISP pools)**Cookie-based for flexibility**: Works through NAT, proxies, and mobile networks where client IPs change**Dedicated load balancer**: Nginx, HAProxy, AWS ALB, or GCP HTTP(S) LB with WebSocket support**Sticky session duration**: Align with expected session length; too short causes frequent reconnections**IP hash vs. cookie**: IP hash is simpler but fails with shared IPs (corporate NAT, mobile carriers); cookie-based is more reliable but adds header overhead**Load balancer termination**: TLS should be terminated at the load balancer, then pass plain WebSocket traffic to Reverb**Health check path**: Load balancer health checks must use a WebSocket-friendly endpoint, not the HTTP health check**Uneven distribution**: IP hash may distribute connections unevenly if client IPs cluster (e.g., all users behind one corporate NAT)**Cookie dependency**: Cookie-based affinity fails if clients block or clear cookies**Cold server handling**: New server added to the pool has zero connections; clients are gradually routed to it**Graceful removal complexity**: Draining connections from a server before removal requires careful coordination**Load balancer as single point of failure**: The load balancer itself must be highly availableIP hash distribution: With ~1000 clients behind a /24 subnet, all route to one server (poor distribution)Cookie overhead: Insertion cookies add ~30-50 bytes per response; negligible for WebSocket handshakeLoad balancer connection tracking: Stateful load balancers track connection state; memory scales with active connectionsTLS termination offloads CPU work from Reverb to the load balancer (more efficient)Always test sticky session behavior with your specific load balancer before productionConfigure health checks to verify Reverb is accepting WebSocket connections, not just TCPSet appropriate timeout values matching Reverb's `activity_timeout` (typically 60-120s)Monitor backend server connection distribution to detect uneven balancingImplement connection draining for rolling deployments (allow in-flight connections to complete before shutdown)For cookie-based affinity, set the cookie name to avoid collisions with application cookiesConsider using a dedicated subdomain (e.g., `ws.example.com`) for WebSocket traffic to separate from HTTP routingAssuming round-robin load balancing works for WebSocket (it breaks reconnections)Forgetting that IP hash breaks for users behind large NAT gateways (all users map to one server)Not configuring health checks (load balancer keeps sending traffic to dead Reverb instances)Setting proxy timeouts lower than the WebSocket heartbeat interval (connections get prematurely terminated)Using HTTP health checks instead of WebSocket-specific health checks (false healthy/unhealthy states)**Sticky session loss**: Cookie expires or is cleared; client reconnects to wrong server; subscription state lost**IP hash flapping**: Client IP changes mid-session (mobile network handoff); client routed to different server**Load balancer saturation**: Connection tracking table fills; new WebSocket connections rejected**Health check false positive**: Health check passes but Reverb is not accepting WebSocket connections**Backend server crash**: All connections to the crashed server are lost; sticky sessions cause reconnection storm to remaining serversRequired for all multi-server Reverb deploymentsNginx upstream configuration (`ip_hash` directive; `sticky` module for cookie-based)HAProxy backend configuration (`cookie SERVERID insert indirect`)AWS ALB target group stickiness (enable "Stickiness" with 1-day duration)GCP HTTP(S) Load Balancer with backend service session affinityKubernetes ingress controllers (NGINX Ingress, Traefik) with session affinity configurationK04: Reverb Horizontal Scaling via RedisK32: Nginx WebSocket Proxy ConfigurationK33: Dedicated Reverb Fleet ArchitectureK15: Reconnection Strategies & Storm Mitigation

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization