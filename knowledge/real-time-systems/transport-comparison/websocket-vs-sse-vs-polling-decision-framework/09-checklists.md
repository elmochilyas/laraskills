# Metadata

**Domain:** real-time-systems
**Subdomain:** transport-comparison
**Knowledge Unit:** websocket-vs-sse-vs-polling-decision-framework
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Fallback strategy defined for legacy browsers
- [ ] HTTP/2 available for SSE deployments
- [ ] SSE preferred for server-to-client use cases
- [ ] Always Consider Long Polling as Fallback Only
- [ ] Always Default to SSE for Server-to-Client Real-Time
- [ ] Always Implement Progressive Enhancement for Transport Selection
- [ ] Always Use HTTP/2 to Eliminate SSE's 6-Connection Limit
- [ ] Never Use Short Polling for Sub-10 Second Intervals
- [ ] Fallback strategy defined for legacy browsers
- [ ] HTTP/2 available for SSE deployments
- [ ] Progressive enhancement implemented where appropriate
- [ ] Check browser support: `EventSource` API covers 96%+ of browsers
- [ ] Check HTTP/2 availability: removes SSE's 6-connection-per-domain limit
- [ ] Determine directionality: is bidirectional (clientâ†’server) communication needed?
- [ ] Legacy browsers have an appropriate fallback
- [ ] No polling at sub-10s intervals where a push transport could be used
- [ ] SSE is default for server-to-client features

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Check browser support: `EventSource` API covers 96%+ of browsers
- [ ] Check HTTP/2 availability: removes SSE's 6-connection-per-domain limit
- [ ] Determine directionality: is bidirectional (clientâ†’server) communication needed?
- [ ] Document the transport decision with rationale
- [ ] For bidirectional but simple client actions: consider SSE + POST pattern
- [ ] If bidirectional â†’ WebSocket is required for <50ms bidirectional latency
- [ ] If SSE not supported â†’ evaluate Long Polling for <2s latency, Short Polling for >30s intervals
- [ ] If SSE supported â†’ implement SSE over HTTP/2
- [ ] If unidirectional â†’ evaluate SSE as the primary option
- [ ] Implement progressive enhancement: start with WebSocket, fall back to SSE, then Long Polling
- [ ] Always Consider Long Polling as Fallback Only
- [ ] Always Default to SSE for Server-to-Client Real-Time

---

# Performance Checklist

- [ ] SSE has auto-reconnect built into `EventSource` â€” WebSocket requires custom reconnection logic
- [ ] SSE over HTTP/2 removes the browser's 6-connection limit
- [ ] WebSocket has lower memory overhead than Long Polling (0.4GB vs 1.8GB at 10k connections)

---

# Security Checklist

- [ ] Long Polling: standard HTTP security; vulnerable to same attacks as regular requests
- [ ] Short Polling: standard HTTP security
- [ ] SSE: same HTTP security model applies; validate origin, use HTTPS
- [ ] WebSocket: requires origin validation for CSWSH prevention; WSS for encryption
- [ ] WebSocket requires origin validation for CSWSH prevention; SSE uses standard HTTP security model

---

# Reliability Checklist

- [ ] 6 SSE connections per domain limit
- [ ] Long Polling as primary transport
- [ ] Short Polling at <10s intervals
- [ ] WebSocket for simple notifications
- [ ] Always Consider Long Polling as Fallback Only
- [ ] Always Default to SSE for Server-to-Client Real-Time
- [ ] Always Implement Progressive Enhancement for Transport Selection
- [ ] Always Use HTTP/2 to Eliminate SSE's 6-Connection Limit
- [ ] Never Use Short Polling for Sub-10 Second Intervals
- [ ] Never Use WebSocket When SSE Post Pattern Suffices

---

# Testing Checklist

- [ ] Fallback strategy defined for legacy browsers
- [ ] HTTP/2 available for SSE deployments
- [ ] Legacy browsers have an appropriate fallback
- [ ] No polling at sub-10s intervals where a push transport could be used
- [ ] Progressive enhancement implemented where appropriate
- [ ] SSE is default for server-to-client features
- [ ] SSE preferred for server-to-client use cases
- [ ] Transport choice matches feature requirements (directionality, latency, scale)
- [ ] Transport decision documented based on directionality and latency requirements
- [ ] Transport selection tested with realistic network conditions

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [WebSocket as Default Transport for All Real-Time Features]
- [ ] [Short Polling at Sub-10 Second Intervals]
- [ ] [Long Polling as Primary Transport]
- [ ] [WebSocket on Infrastructure Without Sticky Session Support]
- [ ] [No Transport Fallback (Progressive Enhancement)]
- [ ] Defaulting to WebSocket for all features
- [ ] No progressive enhancement
- [ ] Using short polling at <5s intervals

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] SSE has auto-reconnect built into `EventSource` â€” WebSocket requires custom reconnection logic

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


