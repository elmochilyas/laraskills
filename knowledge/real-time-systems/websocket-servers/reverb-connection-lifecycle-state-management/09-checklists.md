# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** reverb-connection-lifecycle-state-management
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `/apps/{appId}/connections` monitored for health checks
- [ ] `activity_timeout` and `ping_interval` configured appropriately
- [ ] `ext-uv` or `ext-event` installed for >1024 connections
- [ ] Always Configure activity_timeout and ping_interval Appropriately
- [ ] Always Configure max_connections_per_ip
- [ ] Always Enable Pulse on the Reverb Server
- [ ] Always Install ext-uv or ext-event for High-Connection Deployments
- [ ] Always Monitor the /apps/{appId}/connections Endpoint
- [ ] `/apps/{appId}/connections` monitored for health checks
- [ ] `activity_timeout` and `ping_interval` tuned appropriately
- [ ] `ext-uv` or `ext-event` installed for >1024 connections
- [ ] Configure `max_connections_per_ip` to prevent single-source exhaustion
- [ ] Enable Pulse on the Reverb server for connection lifecycle metrics
- [ ] Install `ext-uv` or `ext-event` for deployments exceeding 1024 concurrent connections
- [ ] `/apps/{appId}/connections` endpoint provides accurate health data
- [ ] Connection lifecycle from handshake to disconnection is understood and debuggable
- [ ] Connection limits (per-IP, message size, fd limit) are configured appropriately

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `max_connections_per_ip` to prevent single-source exhaustion
- [ ] Enable Pulse on the Reverb server for connection lifecycle metrics
- [ ] Install `ext-uv` or `ext-event` for deployments exceeding 1024 concurrent connections
- [ ] Monitor connection state transitions via Echo's `state_change` hook
- [ ] Poll `/apps/{appId}/connections` regularly for health and capacity monitoring
- [ ] Set `max_message_size` to prevent oversized payload abuse (default 10KB)
- [ ] Set Supervisor `stopwaitsecs` > `activity_timeout` for graceful drain
- [ ] Tune `activity_timeout` and `ping_interval` based on connection patterns (default 30s/60s)
- [ ] Always Configure activity_timeout and ping_interval Appropriately
- [ ] Always Configure max_connections_per_ip
- [ ] Always Enable Pulse on the Reverb Server
- [ ] Always Install ext-uv or ext-event for High-Connection Deployments

---

# Performance Checklist

- [ ] Connection limits: OS file descriptor limits (`ulimit -n`) often hit before PHP memory limits
- [ ] Memory per connection: ~1-2KB base plus subscription and presence metadata
- [ ] Ping frequency: default 60s is appropriate for most deployments
- [ ] Pulse writes: each cycle writes state for all connections; at 50k connections, this is significant write throughput
- [ ] Without `ext-uv`, `stream_select` engine limits to ~1024 concurrent connections
- [ ] `max_connections_per_ip` prevents single-source DoS
- [ ] `max_message_size` prevents memory exhaustion
- [ ] Memory per connection: ~1-2KB base plus subscription/presence metadata

---

# Security Checklist

- [ ] `max_connections_per_ip` prevents abuse from single source
- [ ] Channel authorization via `/broadcasting/auth` provides per-channel access control
- [ ] Connection lifecycle logs should not expose sensitive data
- [ ] Presence channel notifications include user informationâ€”ensure proper authorization

---

# Reliability Checklist

- [ ] Connections capped at 1024
- [ ] Dead connections accumulate
- [ ] Legitimate idle connections disconnected
- [ ] Mass disconnections on restart
- [ ] Pulse shows no Reverb data
- [ ] Single IP consumes all connections
- [ ] Always Configure activity_timeout and ping_interval Appropriately
- [ ] Always Configure max_connections_per_ip
- [ ] Always Enable Pulse on the Reverb Server
- [ ] Always Install ext-uv or ext-event for High-Connection Deployments

---

# Testing Checklist

- [ ] `/apps/{appId}/connections` endpoint provides accurate health data
- [ ] `/apps/{appId}/connections` monitored for health checks
- [ ] `activity_timeout` and `ping_interval` configured appropriately
- [ ] `activity_timeout` and `ping_interval` tuned appropriately
- [ ] `ext-uv` or `ext-event` installed for >1024 connections
- [ ] `max_connections_per_ip` configured
- [ ] `max_message_size` configured
- [ ] `stopwaitsecs` in Supervisor > `activity_timeout`
- [ ] Connection lifecycle from handshake to disconnection is understood and debuggable
- [ ] Connection lifecycle understood for debugging

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No distinction between connecting and connected states in monitoring
- [ ] Not handling zombie connections
- [ ] Single connection lifecycle handler for all events

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


