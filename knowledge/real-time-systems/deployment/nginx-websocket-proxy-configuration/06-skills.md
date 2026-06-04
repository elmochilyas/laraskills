# Skill: Configure Nginx as a WebSocket Proxy for Reverb

## Purpose
Configure Nginx as a reverse proxy and TLS termination point for Reverb WebSocket connections with proper upgrade headers, timeouts, buffering, and security settings.

## When To Use
- Standard production reverse proxy for all self-hosted Reverb deployments
- Any deployment where Reverb must be accessed via port 443 (WSS) instead of directly
- Environments requiring TLS termination, domain routing, or connection management

## When NOT To Use
- Laravel Cloud (platform handles reverse proxying transparently)
- Local development (access Reverb directly without proxy)
- Managed WebSocket services (Pusher, Ably) that handle their own infrastructure

## Prerequisites
- Nginx installed (1.3.13+ for WebSocket proxy support)
- Reverb configured and running on internal port (`REVERB_SERVER_HOST=127.0.0.1`)
- SSL certificate for TLS termination
- Domain or subdomain for WebSocket endpoint (e.g., `ws.example.com`)

## Inputs
- Nginx server block configuration
- SSL certificate paths
- Reverb upstream server address (127.0.0.1:8080)
- Reverb activity_timeout value for proxy timeout alignment

## Workflow
1. Create an Nginx server block for the WebSocket subdomain
2. Configure SSL certificate and TLS settings (TLSv1.2, TLSv1.3)
3. Set up Reverb upstream in `http` block
4. Configure `/app/` location with WebSocket upgrade headers
5. Configure `/apps/` location with WebSocket upgrade headers
6. Set `proxy_read_timeout` to 3600s or higher
7. Disable proxy buffering (`proxy_buffering off`)
8. Forward `X-Forwarded-*` headers for correct client IP
9. Set Reverb to bind `127.0.0.1` only
10. Add HSTS header and security headers
11. Test WebSocket connection through Nginx proxy
12. Monitor Nginx connection metrics

## Validation Checklist
- [ ] `proxy_http_version 1.1` configured
- [ ] `proxy_set_header Upgrade $http_upgrade` and `Connection "Upgrade"` set
- [ ] Both `/app/` and `/apps/` location blocks configured
- [ ] `proxy_read_timeout` set to 3600s or higher
- [ ] `proxy_buffering off` for streaming endpoints
- [ ] Reverb binds to `127.0.0.1` (not `0.0.0.0`)
- [ ] TLS configured with valid certificate
- [ ] HSTS header set
- [ ] `X-Forwarded-*` headers forwarded to Reverb
- [ ] WebSocket connection works through Nginx proxy

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| WebSocket upgrade fails (200 instead of 101) | Missing upgrade headers | Add `proxy_set_header Upgrade $http_upgrade` and `Connection "Upgrade"` |
| Some Reverb API calls fail | Missing `/apps/` location block | Add location block for `/apps/` |
| Idle connections dropped after 60s | Default `proxy_read_timeout` too low | Set to 3600s |
| SSE events arrive in bursts | `proxy_buffering` enabled | Set `proxy_buffering off` |
| All clients appear as same IP | `X-Forwarded-*` headers not set | Forward headers to Reverb |
| Reverb accessible without TLS | `REVERB_SERVER_HOST=0.0.0.0` | Set to `127.0.0.1` |

## Decision Points
- **Timeout value**: 3600s is standard; match to expected maximum session duration
- **Multiple upstreams**: If using multiple Reverb instances, configure sticky sessions via `ip_hash`
- **HTTP/2**: Enable for SSE endpoints to improve multiplexing (removes 6-connection limit)

## Performance/Security Considerations
- TLS termination at Nginx is more efficient than PHP/ReactPHP handling TLS
- `proxy_buffering off` reduces memory usage per connection
- TLS session caching (`ssl_session_cache`) reduces handshake overhead
- Bind Reverb to `127.0.0.1` only — never expose directly to internet
- Configure `allowed_origins` in Reverb for defense in depth

## Related Rules (from 05-rules.md)
- Always Include WebSocket Upgrade Headers
- Always Configure Both `/app/` and `/apps/` Location Blocks
- Always Set `proxy_read_timeout` to Match Expected Session Duration
- Always Disable Proxy Buffering
- Always Bind Reverb to Internal-Only Port
- Always Configure `X-Forwarded-*` Headers

## Related Skills
- Deploy and Operate a Dedicated Reverb Fleet
- Set Up Sticky Sessions for Multi-Server Reverb Deployments

## Success Criteria
- WebSocket clients connect successfully via WSS on port 443
- WebSocket handshake returns HTTP 101 Switching Protocols
- Idle WebSocket connections stay alive for expected session duration
- SSE streaming delivers events without buffering delay
- Reverb is not directly accessible from the public internet
