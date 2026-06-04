# Metadata
Domain: Real-Time Systems
Subdomain: Scaling & Production Architecture
Knowledge Unit: Nginx WebSocket Proxy Configuration
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Nginx acts as a reverse proxy and TLS termination point for Reverb WebSocket connections in production. WebSocket proxying requires specific Nginx directives beyond standard HTTP proxying: the `Upgrade` and `Connection` headers must be explicitly set to facilitate the WebSocket protocol upgrade. Key configuration includes `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, `proxy_set_header Connection "Upgrade"`, and appropriate timeout directives. Nginx typically listens on port 443 (WSS) and proxies to Reverb running on an internal port (e.g., 8080). The `X-Accel-Buffering: no` header must be set for streaming endpoints that should not be buffered.

## Core Concepts
WebSocket connections start as HTTP requests that are "upgraded" to the WebSocket protocol. Nginx must recognize the upgrade request and forward it to Reverb with the upgrade headers intact. Without these headers, Nginx treats the connection as standard HTTP and the upgrade fails. Nginx also handles TLS termination (HTTPS/WSS), so the client connects securely while Reverb receives plain WebSocket traffic internally. The `/app` and `/apps` location paths are the default Reverb WebSocket endpoints.

## Mental Models
Nginx is a security guard at the server's front door. It handles all incoming traffic, decrypts TLS (so Reverb doesn't have to), and directs WebSocket connections to the right internal port. Without the proper configuration, the guard doesn't understand WebSocket protocol and blocks the upgrade.

## Internal Mechanics
The WebSocket handshake is an HTTP GET request with `Upgrade: websocket` and `Connection: Upgrade` headers. Nginx's `proxy_set_header Upgrade $http_upgrade` passes the upgrade request to Reverb. The `$http_upgrade` variable contains the value of the client's `Upgrade` header. When the server responds with `101 Switching Protocols`, the connection transitions to WebSocket mode. Nginx then acts as a transparent TCP proxy for the duration of the connection. The `proxy_read_timeout` and `proxy_send_timeout` control how long Nginx keeps idle WebSocket connections open (default 60s—must be increased for long-lived connections).

## Patterns
- **TLS termination at Nginx**: Reverb receives plain WS internally; Nginx handles WSS externally
- **Internal-only Reverb port**: Reverb binds to `127.0.0.1:8080`, never exposed to the internet
- **Location-based routing**: `/app/` routes to WebSocket traffic; `/` routes to PHP-FPM for HTTP
- **Separate subdomain**: `ws.example.com` for WebSocket, `app.example.com` for HTTP

## Architectural Decisions
- **Nginx as reverse proxy**: Industry standard for PHP application deployments; adds security layer
- **TLS termination at proxy**: Offloads encryption from PHP/ReactPHP to Nginx (more efficient)
- **Buffering disabled for streaming**: `proxy_buffering off` for WebSocket and SSE endpoints
- **Long timeouts for WebSocket**: `proxy_read_timeout` set to hours/days to match expected connection lifetimes

## Tradeoffs
- **Nginx connection memory**: Each proxied WebSocket connection consumes Nginx memory and worker connections
- **Timeout management**: Too-short timeouts kill idle connections; too-long timeouts risk zombie connections
- **Debugging complexity**: WebSocket errors may be Nginx-caused or Reverb-caused; requires checking both logs
- **SSL termination CPU usage**: TLS termination at Nginx adds CPU load (mitigated by modern hardware and session caching)

## Performance Considerations
- Nginx worker connections limit (`worker_connections`) must accommodate concurrent WebSocket connections
- `proxy_buffering off` reduces memory usage per connection (no buffer allocation)
- TLS session caching (`ssl_session_cache shared:SSL:10m`) reduces TLS handshake overhead for new connections
- OCSP stapling reduces certificate validation latency
- HTTP/2 support for SSE endpoints improves multiplexing efficiency

## Production Configuration
- `proxy_http_version 1.1` (required for WebSocket upgrade)
- `proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "Upgrade"`
- `proxy_set_header Host $host` for correct host header forwarding
- `proxy_set_header X-Real-IP $remote_addr` for client IP logging in Reverb
- `proxy_read_timeout 3600s` and `proxy_send_timeout 3600s` for long-lived connections
- `proxy_buffering off` for streaming endpoints
- `proxy_cache_bypass $http_upgrade` to bypass cache for WebSocket requests
- `ssl_protocols TLSv1.2 TLSv1.3` with strong cipher suites
- `add_header Strict-Transport-Security` for HSTS

## Common Mistakes
- Forgetting `proxy_set_header Upgrade $http_upgrade` (WebSocket upgrade fails silently)
- Not including both `/app` and `/apps` location blocks (some WebSocket operations fail)
- Setting `proxy_read_timeout` to default 60s (idle connections are killed prematurely)
- Leaving `proxy_buffering on` for WebSocket streams (connection hangs or buffers unexpectedly)
- Binding Reverb to `0.0.0.0:8080` without firewall (exposes Reverb directly to the internet)
- Not configuring `X-Forwarded-*` headers (Reverb doesn't see correct client IPs)

## Failure Modes
- **WebSocket upgrade failure**: Missing headers cause Nginx to return 200 instead of 101; client fails to connect
- **Timeout disconnection**: `proxy_read_timeout` expires for idle connections; clients disconnected prematurely
- **Connection limit hit**: `worker_connections` limit reached; new WebSocket connections rejected
- **SSL certificate expiry**: WSS connections fail with certificate errors; clients cannot connect
- **Nginx crash**: Nginx process dies; all WebSocket connections drop simultaneously (reconnection storm)

## Ecosystem Usage
- Standard production reverse proxy for Reverb deployments
- Used with Laravel Forge, Ploi, Vapor, and manual server provisioning
- Alternative reverse proxies: Caddy (auto-TLS, simpler config), HAProxy, Traefik (K8s)
- Required for self-hosted Reverb; optional for managed Reverb (Laravel Cloud handles this)
- Also used for Soketi and other Pusher-protocol WebSocket servers

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K14: Sticky Sessions & Load Balancing for WebSocket
- K27: Supervisor & Production Process Management
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## Research Notes
The Nginx configuration for Reverb WebSocket proxying is documented in the official Laravel Reverb deployment guide. The two location blocks (`/app` and `/apps`) correspond to Reverb's WebSocket endpoint and its HTTP API endpoint. The `proxy_read_timeout` default of 60s is a common production issue—it must be extended to match the expected WebSocket session duration. The `$http_upgrade` variable evaluates to `null` for non-WebSocket requests, so the location block safely handles both HTTP and WS traffic. For SSE proxying, `X-Accel-Buffering: no` must be set on the upstream response headers.

## Production Considerations

- **TLS termination**: Terminate WSS at the load balancer (Nginx, ALB) rather than Reverb itself. Configure wss certificate and proxy protocol support.
- **Process supervision**: Use Supervisor or systemd to manage Reverb processes. Configure min_workers and max_workers based on traffic patterns.
- **Health checks**: Implement WebSocket health check endpoints. Monitor connection counts, message rates, and error rates per node.
- **Connection limits**: Set maximum connections per Reverb process. Laravel's config allows max_connections per server. Plan for 10,000-20,000 connections per node.
- **Graceful shutdown**: Configure signal handling for Reverb to drain connections before process termination. This prevents mid-message disconnections.
- **Monitoring**: Track metrics: connected clients, messages/sec, failed messages, channel counts, Redis pub/sub latency. Set alerts for connection drop rate spikes.
- **Logging**: Log connection events (connect, disconnect, error) with client IP and channel subscription information for debugging.
