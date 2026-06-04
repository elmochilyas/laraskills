---
id: KU-049
title: "Nginx Proxy Buffering for SSE"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/07-streaming/nginx-proxy-buffering-sse/04-standardized-knowledge.md"
---

# Nginx Proxy Buffering for SSE

## Overview

Nginx proxy buffering is the most common production issue for SSE streaming. Default buffering delays all token delivery until the complete response is generated â€” defeating the purpose of streaming. Configuration changes (`proxy_buffering off; X-Accel-Buffering: no`) are essential for real-time token delivery through Nginx reverse proxies.

## Core Concepts

- **`proxy_buffering off;`**: Disables Nginx response buffering â€” tokens forwarded immediately
- **`X-Accel-Buffering: no`**: HTTP response header that tells Nginx not to buffer
- **`proxy_cache off;`**: Disables caching for streaming responses
- **FastCGI buffering**: PHP-FPM also buffers â€” `fastcgi_buffering off;` for direct FPM connections
- **Chunked transfer encoding**: SSE requires chunked encoding for streaming
- **Connection timeout**: `proxy_read_timeout` must match longest expected stream duration

## When To Use

- Production applications requiring Nginx Proxy Buffering for SSE functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Location-specific config**: Apply buffering off only to SSE endpoints â€” don't disable globally
- **Header-based control**: Laravel sets `X-Accel-Buffering: no` on streaming responses â€” Nginx honors this
- **Worker-specific upstream**: Dedicated upstream for streaming endpoints with specific proxy config
- **Timeout matching**: Set `proxy_read_timeout 120s` for SSE endpoints

- **Pipe vs. bucket**: Default Nginx buffers like a bucket â€” fills completely, then dumps. SSE needs a pipe â€” each drop flows through immediately.
- **Reverse proxy transparency**: For SSE, Nginx should be transparent â€” pass data as it arrives, not accumulate and forward.

## Architecture Guidelines

- **Decision**: Header-based vs. config-based â†’ Both. Laravel SDK sets `X-Accel-Buffering: no` header. Nginx config as backup for environments that don't honor headers.
- **Decision**: Location-based vs. server-wide config â†’ Location-based (`location /ai/stream`). Server-wide would disable buffering for all responses.

## Performance Considerations

- Nginx without buffering: slightly higher CPU per request (no buffer reuse)
- Memory: each streaming connection holds connection state in Nginx worker
- Connection count: SSE connections are long-lived â€” Nginx worker_connections must be sufficient
- PHP-FPM: same considerations as SSE â€” worker held for stream duration
- Keepalive: configure `keepalive_requests` for SSE connections

Config | Result | Risk
-------|--------|------
`proxy_buffering off;` | Real-time streaming | Slightly more Nginx CPU (no buffering)
`proxy_buffering off;` + `proxy_cache off;` | Streaming + no caching | Repeat requests hit origin
Global `proxy_buffering off` | All endpoints stream | Non-streaming endpoints lose buffering benefits

## Security Considerations

- **Nginx worker configuration**: For SSE streaming endpoints, ensure worker_connections is set high enough to accommodate concurrent streaming connections. Each SSE connection holds a worker connection for the duration of the stream. Calculate worker_connections as max_concurrent_streams * 1.5 for headroom.
- **Load balancer compatibility**: Ensure upstream load balancers (ALB, HAProxy, Traefik) support long-lived connections and HTTP/1.1 keepalive. Some load balancers have default idle timeouts (60s) that kill SSE connections prematurely. Configure idle timeout to match the maximum expected SSE stream duration.
- **PHP-FPM pool sizing**: Each SSE connection holds a PHP-FPM worker for the entire stream duration. Traditional PHP-FPM pm.max_children must account for SSE connections plus regular HTTP requests. For high-concurrency SSE, consider using a separate PHP-FPM pool with dedicated worker allocation for streaming endpoints.
- **CDN and caching**: Ensure CDN (CloudFront, Cloudflare) does not cache SSE responses or buffer the stream. Configure CDN to pass through 	ext/event-stream content without buffering or caching. Use X-Accel-Buffering: no and Cache-Control: no-cache headers on the origin response.
- **Graceful shutdown**: Provide a mechanism for clients to detect server shutdown (e.g., a final SSE event with type "shutdown"). This allows clients to reconnect to a healthy instance without waiting for the TCP timeout.
- **Application-level keepalive**: Send periodic SSE comment events (: heartbeat\n\n) every 15-30 seconds to prevent proxies and load balancers from closing idle connections. This also confirms server health to the client.

## Common Mistakes

- No Nginx configuration â€” most common SSE failure: user sees nothing until response complete
- Global `proxy_buffering off` â€” applies to all endpoints, unnecessary overhead for non-streaming
- Forgetting `proxy_cache off` â€” cached SSE responses return stale/empty data
- Not matching proxy timeouts â€” `proxy_read_timeout` default 60s kills longer streams
- Using HTTP/1.0 backend â€” chunked transfer encoding requires HTTP/1.1
- No `Connection ''` header â€” Nginx may not honor keepalive for streaming

## Anti-Patterns

- **Buffer full delay**: Default buffering holds first 4KB â€” user waits until buffer fills or generation completes
- **Proxy timeout**: Stream exceeds `proxy_read_timeout` â€” connection dropped mid-response
- **Cache interference**: Cached SSE response served â€” returns empty or partial response
- **Gzip compression delay**: Gzip on streaming â€” must wait for buffer before compressing. Disable gzip for SSE.
- **SSL buffer delay**: SSL buffering in Nginx â€” same behavior as proxy buffering. Nginx SSL buffers independently.

## Examples

The following ecosystem packages provide reference implementations:

- Required for any Laravel AI streaming in production behind Nginx
- Laravel Forge: default Nginx config doesn't include SSE-specific settings
- Laravel Cloud: managed infrastructure handles SSE configuration
- Docker: configure Nginx in Dockerfile or docker-compose for streaming endpoints

## Related Topics

- KU-045: SSE Streaming
- KU-046: Livewire wire:stream Integration

## AI Agent Notes

- When asked about Nginx Proxy Buffering for SSE, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

