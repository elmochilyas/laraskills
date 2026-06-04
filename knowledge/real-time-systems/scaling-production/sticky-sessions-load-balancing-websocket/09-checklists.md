# Metadata

**Domain:** real-time-systems
**Subdomain:** scaling-production
**Knowledge Unit:** sticky-sessions-load-balancing-websocket
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connection draining implemented for rolling deployments
- [ ] Cookie-based affinity tested through NAT, proxies, and mobile networks
- [ ] Health checks configured to verify WebSocket acceptance
- [ ] Always Implement WebSocket-Specific Health Checks
- [ ] Always Prefer Cookie-Based Affinity Over IP Hash
- [ ] Always Set Proxy Timeouts Higher Than Activity Timeout
- [ ] Always Terminate TLS at the Load Balancer
- [ ] Always Use Sticky Sessions for Multi-Server Reverb Deployments
- [ ] `proxy_read_timeout` higher than `activity_timeout`
- [ ] Connection draining for rolling deployments implemented
- [ ] Cookie-based affinity configured on load balancer
- [ ] Configure load balancer with cookie-based stickiness (e.g., HAProxy `cookie SERVERID insert indirect nocache`)
- [ ] Configure WebSocket-specific health checks (verify Reverb responds to Pusher protocol)
- [ ] Implement connection draining for rolling deployments
- [ ] Clients consistently route to the same Reverb instance for session duration
- [ ] Health checks correctly detect and remove failed Reverb instances
- [ ] NAT/mobile users distribute evenly across server instances

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure load balancer with cookie-based stickiness (e.g., HAProxy `cookie SERVERID insert indirect nocache`)
- [ ] Configure WebSocket-specific health checks (verify Reverb responds to Pusher protocol)
- [ ] Implement connection draining for rolling deployments
- [ ] Monitor server connection distribution for uneven balancing
- [ ] Set `proxy_read_timeout` higher than Reverb's `activity_timeout` (e.g., 3600s)
- [ ] Terminate TLS at the load balancer, forward plain WS to Reverb instances
- [ ] Test sticky session behavior from NAT, proxy, and mobile networks
- [ ] Use a dedicated subdomain (`ws.example.com`) for WebSocket traffic
- [ ] Always Implement WebSocket-Specific Health Checks
- [ ] Always Prefer Cookie-Based Affinity Over IP Hash
- [ ] Always Set Proxy Timeouts Higher Than Activity Timeout
- [ ] Always Terminate TLS at the Load Balancer

---

# Performance Checklist

- [ ] Cookie overhead: insertion cookies add ~30-50 bytes per response; negligible for WebSocket handshake
- [ ] IP hash distribution: ~1000 clients behind a /24 subnet all route to one server (poor distribution)
- [ ] Load balancer connection tracking memory scales with active connections
- [ ] TLS termination offloads CPU work from Reverb to the load balancer
- [ ] TLS termination offloads CPU from Reverb to the load balancer

---

# Security Checklist

- [ ] Health check endpoints should not expose sensitive information
- [ ] TLS termination at the load balancer means Reverb receives plain WS internallyâ€”ensure internal network is isolated
- [ ] Use cookie-based affinity with secure attributes (HttpOnly, Secure) to prevent client-side tampering
- [ ] IP hash causes poor distribution for NAT clients (all route to one server)
- [ ] TLS termination offloads CPU from Reverb to the load balancer
- [ ] Use Secure, HttpOnly cookie attributes to prevent client-side tampering

---

# Reliability Checklist

- [ ] All NAT users route to one server
- [ ] Connections dropped after 60s
- [ ] Round-robin routing to Reverb
- [ ] Traffic sent to dead Reverb
- [ ] Users can't reconnect after restart
- [ ] Always Implement WebSocket-Specific Health Checks
- [ ] Always Prefer Cookie-Based Affinity Over IP Hash
- [ ] Always Set Proxy Timeouts Higher Than Activity Timeout
- [ ] Always Terminate TLS at the Load Balancer
- [ ] Always Use Sticky Sessions for Multi-Server Reverb Deployments

---

# Testing Checklist

- [ ] `proxy_read_timeout` higher than `activity_timeout`
- [ ] Clients consistently route to the same Reverb instance for session duration
- [ ] Connection draining for rolling deployments implemented
- [ ] Connection draining implemented for rolling deployments
- [ ] Cookie-based affinity configured on load balancer
- [ ] Cookie-based affinity tested through NAT, proxies, and mobile networks
- [ ] Health checks configured to verify WebSocket acceptance
- [ ] Health checks correctly detect and remove failed Reverb instances
- [ ] Load balancer configured with sticky sessions (cookie-based preferred)
- [ ] NAT/mobile users distribute evenly across server instances

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Round-Robin Load Balancing for WebSocket (No Sticky Sessions)]
- [ ] [IP Hash with NAT Clients (Poor Distribution)]
- [ ] [Default proxy_read_timeout (60s) for WebSocket]
- [ ] [TCP-Only Health Checks for WebSocket]
- [ ] [Reverb Exposed Directly Without Load Balancer]
- [ ] Assuming round-robin balancing works for WebSocket
- [ ] Not testing sticky session behavior with the specific load balancer
- [ ] Using the same load balancer for HTTP and WebSocket without separating concerns

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


