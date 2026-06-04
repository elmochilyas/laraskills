# Metadata

**Domain:** real-time-systems
**Subdomain:** deployment
**Knowledge Unit:** nginx-websocket-proxy-configuration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `proxy_buffering off` for streaming endpoints
- [ ] `proxy_http_version 1.1` configured
- [ ] `proxy_read_timeout` set to 3600s or higher
- [ ] Always Bind Reverb to Internal-Only Port
- [ ] Always Configure Both /app/ and /apps/ Location Blocks
- [ ] Always Configure X-Forwarded-* Headers
- [ ] Always Disable Proxy Buffering
- [ ] Always Include WebSocket Upgrade Headers
- [ ] `proxy_buffering off` for streaming endpoints
- [ ] `proxy_http_version 1.1` configured
- [ ] `proxy_read_timeout` set to 3600s or higher
- [ ] Add HSTS header and security headers
- [ ] Configure `/app/` location with WebSocket upgrade headers
- [ ] Configure `/apps/` location with WebSocket upgrade headers
- [ ] Idle WebSocket connections stay alive for expected session duration
- [ ] Reverb is not directly accessible from the public internet
- [ ] SSE streaming delivers events without buffering delay

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add HSTS header and security headers
- [ ] Configure `/app/` location with WebSocket upgrade headers
- [ ] Configure `/apps/` location with WebSocket upgrade headers
- [ ] Configure SSL certificate and TLS settings (TLSv1.2, TLSv1.3)
- [ ] Create an Nginx server block for the WebSocket subdomain
- [ ] Disable proxy buffering (`proxy_buffering off`)
- [ ] Forward `X-Forwarded-*` headers for correct client IP
- [ ] Monitor Nginx connection metrics
- [ ] Set `proxy_read_timeout` to 3600s or higher
- [ ] Set Reverb to bind `127.0.0.1` only
- [ ] Set up Reverb upstream in `http` block
- [ ] Test WebSocket connection through Nginx proxy

---

# Performance Checklist

- [ ] `proxy_buffering off` reduces memory usage per connection (no buffer allocation)
- [ ] HTTP/2 support for SSE endpoints improves multiplexing efficiency
- [ ] Nginx worker connections limit (`worker_connections`) must accommodate concurrent WebSocket connections
- [ ] OCSP stapling reduces certificate validation latency
- [ ] TLS session caching (`ssl_session_cache shared:SSL:10m`) reduces TLS handshake overhead
- [ ] `proxy_buffering off` reduces memory usage per connection
- [ ] TLS session caching (`ssl_session_cache`) reduces handshake overhead

---

# Security Checklist

- [ ] Allowed origins in both Nginx and Reverb config provide defense in depth
- [ ] HSTS header (`Strict-Transport-Security`) enforces secure connections
- [ ] Internal-only Reverb port prevents direct exposure to the internet
- [ ] TLS termination at Nginx encrypts all WebSocket traffic in transit
- [ ] TLS session caching (`ssl_session_cache`) reduces handshake overhead
- [ ] TLS termination at Nginx is more efficient than PHP/ReactPHP handling TLS

---

# Reliability Checklist

- [ ] All clients appear as same IP
- [ ] Idle connections dropped after 60s
- [ ] Reverb accessible without TLS
- [ ] Some Reverb API calls fail
- [ ] SSE events arrive in bursts
- [ ] WebSocket upgrade fails (200 instead of 101)
- [ ] Always Bind Reverb to Internal-Only Port
- [ ] Always Configure Both /app/ and /apps/ Location Blocks
- [ ] Always Configure X-Forwarded-* Headers
- [ ] Always Disable Proxy Buffering

---

# Testing Checklist

- [ ] `proxy_buffering off` for streaming endpoints
- [ ] `proxy_http_version 1.1` configured
- [ ] `proxy_read_timeout` set to 3600s or higher
- [ ] `proxy_set_header Upgrade $http_upgrade` and `Connection "Upgrade"` set
- [ ] `X-Forwarded-*` headers forwarded to Reverb
- [ ] Both `/app/` and `/apps/` location blocks configured
- [ ] HSTS header set
- [ ] Idle WebSocket connections stay alive for expected session duration
- [ ] Reverb binds to `127.0.0.1` (not `0.0.0.0`)
- [ ] Reverb is not directly accessible from the public internet

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Missing WebSocket Upgrade Headers]
- [ ] [Single Location Block Only (/app Without /apps)]
- [ ] [Default 60s proxy_read_timeout]
- [ ] [proxy_buffering Not Disabled]
- [ ] [No X-Forwarded- Headers Forwarded]
- [ ] No health check configuration
- [ ] Single location block for all traffic
- [ ] SSL certificate management neglected

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


