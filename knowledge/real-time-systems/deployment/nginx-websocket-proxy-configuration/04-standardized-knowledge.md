# Standardized Knowledge: Nginx WebSocket Proxy Configuration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Scaling & Production Architecture |
| Knowledge Unit ID | K32 |
| Title | Nginx WebSocket Proxy Configuration |
| Difficulty | Intermediate |
| Dependencies | K03, K14, K27, K24 |

## Overview
Nginx acts as a reverse proxy and TLS termination point for Reverb WebSocket connections in production. WebSocket proxying requires specific Nginx directives beyond standard HTTP proxying: the `Upgrade` and `Connection` headers must be explicitly set to facilitate the WebSocket protocol upgrade. Key configuration includes `proxy_http_version 1.1`, `proxy_set_header Upgrade $http_upgrade`, `proxy_set_header Connection "Upgrade"`, and appropriate timeout directives.

## Core Concepts
- WebSocket connections start as HTTP requests that are "upgraded" to the WebSocket protocol via the `Upgrade: websocket` header
- Without the upgrade headers, Nginx treats the connection as standard HTTP and the upgrade fails
- Nginx handles TLS termination (HTTPS/WSS), so the client connects securely while Reverb receives plain WebSocket traffic internally
- The `/app` and `/apps` location paths are the default Reverb WebSocket endpoints

## When To Use
- Standard production reverse proxy for all self-hosted Reverb deployments
- Any deployment where Reverb must be accessed via port 443 (WSS) instead of directly
- Environments requiring TLS termination, domain routing, or connection management

## When NOT To Use
- Laravel Cloud (the platform handles reverse proxying transparently)
- Local development (access Reverb directly without proxy)
- Managed WebSocket services (Pusher, Ably) that handle their own infrastructure

## Best Practices (Why)
- **Always terminate TLS at Nginx**: Offloads encryption from PHP/ReactPHP to Nginx (more efficient CPU usage for TLS); Reverb receives plain WS on internal port
- **Set `proxy_read_timeout` to match expected session duration**: Default 60s kills idle WebSocket connections; set to 3600s or more for long-lived connections
- **Disable proxy buffering**: `proxy_buffering off` is required for WebSocket and SSE streaming endpoints; otherwise connections hang
- **Bind Reverb to internal-only port**: `REVERB_SERVER_HOST=127.0.0.1` and `REVERB_SERVER_PORT=8080`—never expose Reverb directly to the internet

## Architecture Guidelines
- Use a separate subdomain for WebSocket (`ws.example.com`) to isolate from HTTP routing
- Include both `/app/` and `/apps/` location blocks for Reverb's WebSocket and HTTP API endpoints
- Configure `X-Forwarded-*` headers so Reverb sees correct client IPs
- Set `ssl_protocols TLSv1.2 TLSv1.3` with strong cipher suites

## Performance Considerations
- Nginx worker connections limit (`worker_connections`) must accommodate concurrent WebSocket connections
- `proxy_buffering off` reduces memory usage per connection (no buffer allocation)
- TLS session caching (`ssl_session_cache shared:SSL:10m`) reduces TLS handshake overhead
- OCSP stapling reduces certificate validation latency
- HTTP/2 support for SSE endpoints improves multiplexing efficiency

## Security Considerations
- TLS termination at Nginx encrypts all WebSocket traffic in transit
- Internal-only Reverb port prevents direct exposure to the internet
- HSTS header (`Strict-Transport-Security`) enforces secure connections
- Allowed origins in both Nginx and Reverb config provide defense in depth

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Missing upgrade headers | WebSocket upgrade fails silently | Forgetting `proxy_set_header Upgrade $http_upgrade` | Client receives 200 instead of 101; connection fails | Always include both Upgrade and Connection headers |
| Missing /apps location | Some WebSocket operations fail | Only configuring /app location | Partial functionality | Include both /app/ and /apps/ location blocks |
| Default 60s proxy_read_timeout | Idle connections killed prematurely | Not tuning timeouts for WebSocket | Frequent disconnections | Set to 3600s or more |
| proxy_buffering on | Connection hangs or buffers unexpectedly | Default Nginx behavior | SSE streams buffer, WebSocket frames delayed | Set `proxy_buffering off` for streaming |
| Reverb on 0.0.0.0:8080 | Exposes Reverb directly to internet | Default config not changed | Security risk, direct attack surface | Bind to 127.0.0.1 only |

## Anti-Patterns
- **Single location block for all traffic**: Mixing HTTP and WebSocket routing in one location without proper header differentiation
- **No health check configuration**: Load balancer cannot detect dead Reverb instances
- **SSL certificate management neglected**: Expired certificates cause WSS connection failures

## Examples

### Nginx WebSocket proxy configuration
```nginx
upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl http2;
    server_name ws.example.com;

    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /app/ {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://reverb;
    }

    location /apps/ {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_pass http://reverb;
    }
}
```

## Related Topics
- K03: Reverb Installation & Configuration
- K14: Sticky Sessions & Load Balancing for WebSocket
- K27: Supervisor & Production Process Management
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The `$http_upgrade` variable evaluates to `null` for non-WebSocket requests, so location blocks safely handle both HTTP and WS traffic
- Common production issue: `proxy_read_timeout` default of 60s must be extended
- For SSE proxying, `X-Accel-Buffering: no` must be set on upstream response headers

## Verification
- [ ] `proxy_http_version 1.1` configured
- [ ] `proxy_set_header Upgrade $http_upgrade` and `Connection "Upgrade"` set
- [ ] Both `/app/` and `/apps/` location blocks configured
- [ ] `proxy_read_timeout` set to 3600s or higher
- [ ] `proxy_buffering off` for streaming endpoints
- [ ] Reverb binds to `127.0.0.1` (not `0.0.0.0`)
- [ ] TLS configured with valid certificate
- [ ] HSTS header set
- [ ] `X-Forwarded-*` headers forwarded to Reverb
