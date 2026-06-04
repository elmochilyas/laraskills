# Decomposition: Nginx Websocket Proxy Configuration

## Topic Overview
Nginx acts as a reverse proxy and TLS termination point for Reverb WebSocket connections in production. WebSocket proxying requires specific Nginx directives beyond standard HTTP proxying: the `Upgrade` and `Connection` headers must be explicitly set to facilitate the WebSocket protocol upgrade. Key configuration includes `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, `proxy_set_header Connection "Upgrade"`, and appropriate timeout directives. Nginx typically listens on p...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scaling-production-architecture/K32-nginx-websocket-proxy-configuration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Nginx Websocket Proxy Configuration
- **Purpose:** Nginx acts as a reverse proxy and TLS termination point for Reverb WebSocket connections in production. WebSocket proxying requires specific Nginx directives beyond standard HTTP proxying: the `Upgrade` and `Connection` headers must be explicitly set to facilitate the WebSocket protocol upgrade. Key configuration includes `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, `proxy_set_header Connection "Upgrade"`, and appropriate timeout directives. Nginx typically listens on p...
- **Difficulty:** Intermediate
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K27: Supervisor & Production Process Management
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K27: Supervisor & Production Process Management
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **TLS termination at Nginx**: Reverb receives plain WS internally; Nginx handles WSS externally**Internal-only Reverb port**: Reverb binds to `127.0.0.1:8080`, never exposed to the internet**Location-based routing**: `/app/` routes to WebSocket traffic; `/` routes to PHP-FPM for HTTP**Separate subdomain**: `ws.example.com` for WebSocket, `app.example.com` for HTTP**Nginx as reverse proxy**: Industry standard for PHP application deployments; adds security layer**TLS termination at proxy**: Offloads encryption from PHP/ReactPHP to Nginx (more efficient)**Buffering disabled for streaming**: `proxy_buffering off` for WebSocket and SSE endpoints**Long timeouts for WebSocket**: `proxy_read_timeout` set to hours/days to match expected connection lifetimes**Nginx connection memory**: Each proxied WebSocket connection consumes Nginx memory and worker connections**Timeout management**: Too-short timeouts kill idle connections; too-long timeouts risk zombie connections**Debugging complexity**: WebSocket errors may be Nginx-caused or Reverb-caused; requires checking both logs**SSL termination CPU usage**: TLS termination at Nginx adds CPU load (mitigated by modern hardware and session caching)Nginx worker connections limit (`worker_connections`) must accommodate concurrent WebSocket connections`proxy_buffering off` reduces memory usage per connection (no buffer allocation)TLS session caching (`ssl_session_cache shared:SSL:10m`) reduces TLS handshake overhead for new connectionsOCSP stapling reduces certificate validation latencyHTTP/2 support for SSE endpoints improves multiplexing efficiency`proxy_http_version 1.1` (required for WebSocket upgrade)`proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "Upgrade"``proxy_set_header Host $host` for correct host header forwarding`proxy_set_header X-Real-IP $remote_addr` for client IP logging in Reverb`proxy_read_timeout 3600s` and `proxy_send_timeout 3600s` for long-lived connections`proxy_buffering off` for streaming endpoints`proxy_cache_bypass $http_upgrade` to bypass cache for WebSocket requests`ssl_protocols TLSv1.2 TLSv1.3` with strong cipher suites`add_header Strict-Transport-Security` for HSTSForgetting `proxy_set_header Upgrade $http_upgrade` (WebSocket upgrade fails silently)Not including both `/app` and `/apps` location blocks (some WebSocket operations fail)Setting `proxy_read_timeout` to default 60s (idle connections are killed prematurely)Leaving `proxy_buffering on` for WebSocket streams (connection hangs or buffers unexpectedly)Binding Reverb to `0.0.0.0:8080` without firewall (exposes Reverb directly to the internet)Not configuring `X-Forwarded-*` headers (Reverb doesn't see correct client IPs)**WebSocket upgrade failure**: Missing headers cause Nginx to return 200 instead of 101; client fails to connect**Timeout disconnection**: `proxy_read_timeout` expires for idle connections; clients disconnected prematurely**Connection limit hit**: `worker_connections` limit reached; new WebSocket connections rejected**SSL certificate expiry**: WSS connections fail with certificate errors; clients cannot connect**Nginx crash**: Nginx process dies; all WebSocket connections drop simultaneously (reconnection storm)Standard production reverse proxy for Reverb deploymentsUsed with Laravel Forge, Ploi, Vapor, and manual server provisioningAlternative reverse proxies: Caddy (auto-TLS, simpler config), HAProxy, Traefik (K8s)Required for self-hosted Reverb; optional for managed Reverb (Laravel Cloud handles this)Also used for Soketi and other Pusher-protocol WebSocket serversK03: Reverb Installation & ConfigurationK14: Sticky Sessions & Load Balancing for WebSocketK27: Supervisor & Production Process ManagementK24: WebSocket Security (TLS, CORS, Auth, CSWSH)**TLS termination**: Terminate WSS at the load balancer (Nginx, ALB) rather than Reverb itself. Configure wss certificate and proxy protocol support.**Process supervision**: Use Supervisor or systemd to manage Reverb processes. Configure min_workers and max_workers based on traffic patterns.**Health checks**: Implement WebSocket health check endpoints. Monitor connection counts, message rates, and error rates per node.**Connection limits**: Set maximum connections per Reverb process. Laravel's config allows max_connections per server. Plan for 10,000-20,000 connections per node.**Graceful shutdown**: Configure signal handling for Reverb to drain connections before process termination. This prevents mid-message disconnections.**Monitoring**: Track metrics: connected clients, messages/sec, failed messages, channel counts, Redis pub/sub latency. Set alerts for connection drop rate spikes.**Logging**: Log connection events (connect, disconnect, error) with client IP and channel subscription information for debugging.

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