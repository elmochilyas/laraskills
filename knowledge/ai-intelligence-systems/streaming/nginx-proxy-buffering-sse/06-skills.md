# Skill: Configure Nginx Proxy Buffering for SSE
## Purpose
Configure Nginx to properly proxy SSE streams by disabling buffering, disabling gzip, and setting appropriate timeouts for real-time token delivery.
## When To Use
- Deploying any SSE streaming endpoint behind Nginx
- Diagnosing streaming issues where tokens arrive in bursts or not at all
- Production deployment of AI streaming features
## When NOT To Use
- Non-streaming endpoints (keep default buffering for performance)
- Development environments without Nginx
## Prerequisites
- Nginx access (configuration files)
- SSE streaming endpoint defined in Laravel
- Understanding of Nginx location blocks
## Inputs
- SSE endpoint URL path (e.g., /ai/stream)
- Nginx configuration file path
- Expected max stream duration (for timeout config)
## Workflow (numbered)
1. Add `location /ai/stream { ... }` block to Nginx site config
2. Set `proxy_buffering off;` — only within streaming location (not globally)
3. Set `proxy_cache off;` — disable caching for streaming responses
4. Send `proxy_set_header X-Accel-Buffering no;` header
5. Disable gzip: `gzip off;` or exclude `text/event-stream` from `gzip_types`
6. Configure `proxy_read_timeout` to match longest expected stream duration
7. Set `proxy_http_version 1.1;` for chunked transfer encoding support
8. For PHP-FPM: `fastcgi_buffering off;` if connecting directly
9. Reload Nginx and test streaming endpoint
## Validation Checklist
- [ ] proxy_buffering off applied only to streaming location (not globally)
- [ ] gzip disabled for text/event-stream content type
- [ ] proxy_cache off for streaming location
- [ ] proxy_read_timeout set for expected max stream duration
- [ ] Chunked transfer encoding enabled (proxy_http_version 1.1)
- [ ] FastCGI buffering off (if direct FPM connection)
- [ ] Streaming verified working through Nginx (no burst delay)
## Common Failures
- Applying proxy_buffering off globally — unnecessary CPU overhead on non-streaming responses
- Not disabling gzip — compression buffers tokens before delivering
- Timeout too short — stream cut off mid-response
- FastCGI buffering still on — PHP-FPM buffers despite Nginx config
- Forgetting to reload Nginx after config change
## Decision Points
- **Location-level vs global config**: Always location-level for streaming; keep global defaults for non-streaming
- **gzip_types exclusion vs gzip off**: Exclude text/event-stream from gzip_types for MIME-specific control; gzip off for simplicity
## Performance Considerations
- proxy_buffering off: slightly higher Nginx CPU/memory per connection
- No gzip on SSE: bandwidth slightly higher, but latency much lower
- Timeout matching stream duration: prevents premature disconnection
## Security Considerations
- Validate streaming endpoint authentication before Nginx proxy
- Rate-limit streaming endpoint to prevent resource exhaustion
- Set appropriate client_max_body_size if streaming receives uploads
## Related Rules (from 05-rules.md)
- Apply proxy_buffering off only to streaming locations, never globally
- Always disable gzip compression for SSE streaming responses
## Related Skills
- Implement SSE Streaming for AI Responses
- Implement WebSocket Broadcasting with Reverb
## Success Criteria
- SSE tokens delivered to client in real-time through Nginx (no buffering delay)
- Non-streaming endpoints still benefit from default Nginx buffering
- Timeout matches expected max stream duration
- Streaming works reliably under production load
