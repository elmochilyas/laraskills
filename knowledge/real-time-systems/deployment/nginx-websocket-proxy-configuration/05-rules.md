## Always Include WebSocket Upgrade Headers
---
## Framework Usage
---
Always set `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, and `proxy_set_header Connection "Upgrade"` in Nginx WebSocket proxy configuration.
---
Without these headers, the WebSocket upgrade handshake fails — the client receives an HTTP 200 instead of the 101 Switching Protocols response.
---
```nginx
location /app/ {
    proxy_pass http://reverb; // Missing upgrade headers — connection fails
}
```
---
```nginx
location /app/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass http://reverb;
}
```
---
No common exceptions; upgrade headers are required for WebSocket proxying.
---
WebSocket handshake failures; clients receive HTTP 200 instead of 101.

## Always Configure Both `/app/` and `/apps/` Location Blocks
---
## Framework Usage
---
Always include location blocks for both `/app/` and `/apps/` paths when proxying Reverb.
---
Reverb exposes WebSocket endpoints at `/app/` and HTTP API endpoints at `/apps/`. Missing either causes partial functionality — certain operations silently fail.
---
```nginx
location /app/ { ... } // Missing /apps/ — HTTP API calls fail
```
---
```nginx
location /app/ { ... }
location /apps/ { ... } // Both configured
```
---
No common exceptions; both paths are required for complete Reverb functionality.
---
Partial Reverb functionality; silent API call failures.

## Always Set `proxy_read_timeout` to Match Expected Session Duration
---
## Reliability
---
Always set `proxy_read_timeout` to at least 3600 seconds for WebSocket connections.
---
Default Nginx `proxy_read_timeout` is 60 seconds. Without extension, idle WebSocket connections are killed by Nginx before the application's heartbeat has a chance to keep them alive.
---
```nginx
proxy_read_timeout 60s; // Default — kills idle WS connections
```
---
```nginx
proxy_read_timeout 3600s; // Extended — keeps WS alive
```
---
Applications with very short-lived WebSocket connections. No common exceptions for long-lived connections.
---
Frequent disconnections; unnecessary reconnection overhead.

## Always Disable Proxy Buffering
---
## Performance
---
Always set `proxy_buffering off` for WebSocket and SSE streaming endpoints.
---
Nginx buffering collects response data before sending it to the client. For streaming protocols, this causes delayed delivery, bursty output, and can cause the connection to hang.
---
```nginx
proxy_buffering on; // Default — delays streaming delivery
```
---
```nginx
proxy_buffering off;
```
---
No common exceptions; buffering must be disabled for streaming protocols.
---
Delayed SSE events; WebSocket frame buffering; connection hangs.

## Always Bind Reverb to Internal-Only Port
---
## Security
---
Always configure `REVERB_SERVER_HOST=127.0.0.1` so Reverb listens only on the loopback interface, proxied through Nginx.
---
Exposing Reverb directly on a public port bypasses TLS termination, WSS encryption, and Nginx's security features, creating an unencrypted attack surface.
---
```env
REVERB_SERVER_HOST=0.0.0.0 // Open to all interfaces — security risk
```
---
```env
REVERB_SERVER_HOST=127.0.0.1 // Loopback only — proxied through Nginx
```
---
Local development environments behind a firewall. No common exceptions for production.
---
Missing TLS encryption; direct attack surface; CORS bypass.

## Always Configure `X-Forwarded-*` Headers
---
## Framework Usage
---
Always forward `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers so Reverb sees the correct client IP.
---
Without forwarded headers, Reverb sees all connections as coming from the Nginx proxy IP. Rate limiting, logging, and `max_connections_per_ip` all break.
---
```nginx
# No forwarded headers — all clients appear as proxy IP
```
---
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
---
No common exceptions; forwarded headers are required for correct client IP detection.
---
Broken per-IP rate limiting; incorrect logging; security misattribution.
