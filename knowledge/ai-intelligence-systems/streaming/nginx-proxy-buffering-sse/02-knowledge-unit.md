# Knowledge Unit: Nginx Proxy Buffering for SSE

## Metadata

- **ID:** KU-049
- **Subdomain:** Streaming & Real-Time AI Responses
- **Slug:** nginx-proxy-buffering-sse
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Nginx proxy buffering is the most common production issue for SSE streaming. Default buffering delays all token delivery until the complete response is generated — defeating the purpose of streaming. Configuration changes (`proxy_buffering off; X-Accel-Buffering: no`) are essential for real-time token delivery through Nginx reverse proxies.

## Core Concepts

- **`proxy_buffering off;`**: Disables Nginx response buffering — tokens forwarded immediately
- **`X-Accel-Buffering: no`**: HTTP response header that tells Nginx not to buffer
- **`proxy_cache off;`**: Disables caching for streaming responses
- **FastCGI buffering**: PHP-FPM also buffers — `fastcgi_buffering off;` for direct FPM connections
- **Chunked transfer encoding**: SSE requires chunked encoding for streaming
- **Connection timeout**: `proxy_read_timeout` must match longest expected stream duration

## Mental Models

- **Pipe vs. bucket**: Default Nginx buffers like a bucket — fills completely, then dumps. SSE needs a pipe — each drop flows through immediately.
- **Reverse proxy transparency**: For SSE, Nginx should be transparent — pass data as it arrives, not accumulate and forward.

## Internal Mechanics

Without buffering off:
1. PHP begins streaming tokens
2. Nginx receives first bytes but holds them in buffer
3. Nginx waits for buffer to fill (default 4KB/8KB) or response complete
4. Only then forwards to client — user sees nothing until full response or buffer filled

With buffering off:
1. PHP begins streaming tokens
2. Nginx forwards each chunk immediately as received
3. Client receives tokens in real-time
4. Connection stays open until stream complete

## Patterns

- **Location-specific config**: Apply buffering off only to SSE endpoints — don't disable globally
- **Header-based control**: Laravel sets `X-Accel-Buffering: no` on streaming responses — Nginx honors this
- **Worker-specific upstream**: Dedicated upstream for streaming endpoints with specific proxy config
- **Timeout matching**: Set `proxy_read_timeout 120s` for SSE endpoints

## Architectural Decisions

- **Decision**: Header-based vs. config-based → Both. Laravel SDK sets `X-Accel-Buffering: no` header. Nginx config as backup for environments that don't honor headers.
- **Decision**: Location-based vs. server-wide config → Location-based (`location /ai/stream`). Server-wide would disable buffering for all responses.

## Tradeoffs

Config | Result | Risk
-------|--------|------
`proxy_buffering off;` | Real-time streaming | Slightly more Nginx CPU (no buffering)
`proxy_buffering off;` + `proxy_cache off;` | Streaming + no caching | Repeat requests hit origin
Global `proxy_buffering off` | All endpoints stream | Non-streaming endpoints lose buffering benefits

## Performance Considerations

- Nginx without buffering: slightly higher CPU per request (no buffer reuse)
- Memory: each streaming connection holds connection state in Nginx worker
- Connection count: SSE connections are long-lived — Nginx worker_connections must be sufficient
- PHP-FPM: same considerations as SSE — worker held for stream duration
- Keepalive: configure `keepalive_requests` for SSE connections

## Production Configuration

```
location /ai/stream {
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header X-Accel-Buffering no;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    chunked_transfer_encoding on;
}
```

Also for PHP-FPM direct:
```
location ~ \.php$ {
    fastcgi_buffering off;
    fastcgi_read_timeout 120s;
}
```

## Common Mistakes

- No Nginx configuration — most common SSE failure: user sees nothing until response complete
- Global `proxy_buffering off` — applies to all endpoints, unnecessary overhead for non-streaming
- Forgetting `proxy_cache off` — cached SSE responses return stale/empty data
- Not matching proxy timeouts — `proxy_read_timeout` default 60s kills longer streams
- Using HTTP/1.0 backend — chunked transfer encoding requires HTTP/1.1
- No `Connection ''` header — Nginx may not honor keepalive for streaming

## Failure Modes

- **Buffer full delay**: Default buffering holds first 4KB — user waits until buffer fills or generation completes
- **Proxy timeout**: Stream exceeds `proxy_read_timeout` — connection dropped mid-response
- **Cache interference**: Cached SSE response served — returns empty or partial response
- **Gzip compression delay**: Gzip on streaming — must wait for buffer before compressing. Disable gzip for SSE.
- **SSL buffer delay**: SSL buffering in Nginx — same behavior as proxy buffering. Nginx SSL buffers independently.

## Ecosystem Usage

- Required for any Laravel AI streaming in production behind Nginx
- Laravel Forge: default Nginx config doesn't include SSE-specific settings
- Laravel Cloud: managed infrastructure handles SSE configuration
- Docker: configure Nginx in Dockerfile or docker-compose for streaming endpoints

## Related Knowledge Units

- KU-045: SSE Streaming
- KU-046: Livewire wire:stream Integration

## Research Notes

- Nginx buffering is the #1 cause of "streaming not working in production" issues
- Header-based control (`X-Accel-Buffering`) added in Laravel AI SDK v0.2.0
- Apache users need `mod_proxy` with `SetEnv proxy-sendcl 0` for streaming
- Same issue applies to any reverse proxy (HAProxy, Traefik, Caddy)
- Vapor (serverless) doesn't support SSE — use Reverb or queue-based approaches

## Production Considerations

- **Nginx worker configuration**: For SSE streaming endpoints, ensure worker_connections is set high enough to accommodate concurrent streaming connections. Each SSE connection holds a worker connection for the duration of the stream. Calculate worker_connections as max_concurrent_streams * 1.5 for headroom.
- **Load balancer compatibility**: Ensure upstream load balancers (ALB, HAProxy, Traefik) support long-lived connections and HTTP/1.1 keepalive. Some load balancers have default idle timeouts (60s) that kill SSE connections prematurely. Configure idle timeout to match the maximum expected SSE stream duration.
- **PHP-FPM pool sizing**: Each SSE connection holds a PHP-FPM worker for the entire stream duration. Traditional PHP-FPM pm.max_children must account for SSE connections plus regular HTTP requests. For high-concurrency SSE, consider using a separate PHP-FPM pool with dedicated worker allocation for streaming endpoints.
- **CDN and caching**: Ensure CDN (CloudFront, Cloudflare) does not cache SSE responses or buffer the stream. Configure CDN to pass through 	ext/event-stream content without buffering or caching. Use X-Accel-Buffering: no and Cache-Control: no-cache headers on the origin response.
- **Graceful shutdown**: Provide a mechanism for clients to detect server shutdown (e.g., a final SSE event with type "shutdown"). This allows clients to reconnect to a healthy instance without waiting for the TCP timeout.
- **Application-level keepalive**: Send periodic SSE comment events (: heartbeat\n\n) every 15-30 seconds to prevent proxies and load balancers from closing idle connections. This also confirms server health to the client.
