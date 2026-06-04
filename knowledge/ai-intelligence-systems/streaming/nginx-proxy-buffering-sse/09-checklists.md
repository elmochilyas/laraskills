# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** nginx-proxy-buffering-sse
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Header-based control
- [ ] Location-specific config
- [ ] Pipe vs. bucket
- [ ] Reverse proxy transparency
- [ ] Timeout matching
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Nginx Proxy Buffering for SSE
- [ ] Chunked transfer encoding enabled (proxy_http_version 1.1)
- [ ] FastCGI buffering off (if direct FPM connection)
- [ ] gzip disabled for text/event-stream content type
- [ ] Non-streaming endpoints still benefit from default Nginx buffering
- [ ] SSE tokens delivered to client in real-time through Nginx (no buffering delay)
- [ ] Streaming works reliably under production load

---

# Architecture Checklist

- [ ] Header
- [ ] Location
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Header-based control
- [ ] Location-specific config
- [ ] Pipe vs. bucket
- [ ] Reverse proxy transparency
- [ ] Timeout matching
- [ ] Worker-specific upstream
- [ ] Rules for Nginx Proxy Buffering for SSE
- [ ] gzip_types exclusion vs gzip off
- [ ] Location-level vs global config

---

# Performance Checklist

- [ ] Connection count: SSE connections are long-lived â€” Nginx worker_connections must be sufficient
- [ ] Keepalive: configure `keepalive_requests` for SSE connections
- [ ] Memory: each streaming connection holds connection state in Nginx worker
- [ ] Nginx without buffering: slightly higher CPU per request (no buffer reuse)
- [ ] PHP-FPM: same considerations as SSE â€” worker held for stream duration
- [ ] No gzip on SSE: bandwidth slightly higher, but latency much lower
- [ ] proxy_buffering off: slightly higher Nginx CPU/memory per connection
- [ ] Set appropriate client_max_body_size if streaming receives uploads

---

# Security Checklist

- [ ] Application-level keepalive
- [ ] CDN and caching
- [ ] Graceful shutdown
- [ ] Load balancer compatibility
- [ ] Nginx worker configuration
- [ ] PHP-FPM pool sizing
- [ ] Rate-limit streaming endpoint to prevent resource exhaustion
- [ ] Validate streaming endpoint authentication before Nginx proxy

---

# Reliability Checklist

- [ ] Forgetting `proxy_cache off` â€” cached SSE responses return stale/empty data
- [ ] Global `proxy_buffering off` â€” applies to all endpoints, unnecessary overhead for non-streaming
- [ ] No `Connection ''` header â€” Nginx may not honor keepalive for streaming
- [ ] No Nginx configuration â€” most common SSE failure: user sees nothing until response complete
- [ ] Not matching proxy timeouts â€” `proxy_read_timeout` default 60s kills longer streams
- [ ] Using HTTP/1.0 backend â€” chunked transfer encoding requires HTTP/1.1

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Chunked transfer encoding enabled (proxy_http_version 1.1)
- [ ] Core concepts are understood and applied correctly.
- [ ] FastCGI buffering off (if direct FPM connection)
- [ ] gzip disabled for text/event-stream content type
- [ ] Non-streaming endpoints still benefit from default Nginx buffering
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] proxy_buffering off applied only to streaming location (not globally)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Location-specific config

---

# Anti-Pattern Prevention Checklist

- [ ] [Nginx Buffering SSE Responses â€” Chunks Delayed Until Buffer Full]
- [ ] [No proxy_buffering off for Streaming Endpoints]
- [ ] [Proxy Timeout Shorter Than Stream Duration]
- [ ] [No Connection Upgrade Headers for WebSocket]
- [ ] [Load Balancer Terminating Idle Streaming Connections]
- [ ] Buffer full delay
- [ ] Cache interference
- [ ] Gzip compression delay
- [ ] Proxy timeout
- [ ] SSL buffer delay

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


