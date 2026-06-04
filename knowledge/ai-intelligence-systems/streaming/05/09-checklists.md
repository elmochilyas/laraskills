# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Auto-scale based on connection count.
- [ ] Implement connection limits.
- [ ] Monitor connections per server.
- [ ] Separate streaming from API traffic.
- [ ] Use an event-loop server
- [ ] Auto-scaling is configured based on connection count metric.
- [ ] Connection limits are configured per server (max concurrent connections).
- [ ] Connection metrics (active connections, connection rate) are monitored.
- [ ] Rules for Scaling Streaming Connections
- [ ] Auto-scaling is configured based on connection count metric
- [ ] Connection limits are configured per server (max concurrent connections)
- [ ] Connection metrics (active connections, connection rate) are monitored
- [ ] **Assess current capacity**: Determine the maximum concurrent streaming connections the current infrastructure can handle based on PHP-FPM workers, memory, and network.
- [ ] **Configure connection limits**: Implement a middleware that tracks active connections per server using Redis (INCR/ DECR). Reject new connections with 503 when the limit is exceeded. Set `Retry-After` header.
- [ ] **Configure sticky sessions**: Enable session affinity at the load balancer (nginx `ip_hash`, AWS ALB stickiness, HAProxy cookie insertion) for WebSocket connections.
- [ ] Auto-scaling triggers before connection saturation causes 503s
- [ ] Connection limits prevent one user/server from exhausting the pool
- [ ] Dedicated streaming workers don't starve API request workers

---

# Architecture Checklist

- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement immediate secret management improvements
- [ ] Implement input validation and output sanitization layers
- [ ] Implement reconnection logic with last-event-id tracking
- [ ] Implement response caching with appropriate TTL and invalidation strategy
- [ ] Implement with typed tool definitions and structured output schemas

---

# Implementation Checklist

- [ ] Auto-scale based on connection count.
- [ ] Implement connection limits.
- [ ] Monitor connections per server.
- [ ] Separate streaming from API traffic.
- [ ] Use an event-loop server
- [ ] Use Redis for shared state.
- [ ] **Assess current capacity**: Determine the maximum concurrent streaming connections the current infrastructure can handle based on PHP-FPM workers, memory, and network.
- [ ] **Configure connection limits**: Implement a middleware that tracks active connections per server using Redis (INCR/ DECR). Reject new connections with 503 when the limit is exceeded. Set `Retry-After` header.
- [ ] **Configure sticky sessions**: Enable session affinity at the load balancer (nginx `ip_hash`, AWS ALB stickiness, HAProxy cookie insertion) for WebSocket connections.
- [ ] **Implement graceful draining**: Handle server shutdown signals (SIGTERM) by stopping new connections, finishing existing streams within a timeout, then shutting down.
- [ ] **Load test**: Run load tests simulating expected peak concurrent connections. Measure TTFT, TPS, and error rate at capacity. Adjust configuration based on results.
- [ ] **Monitor connection metrics**: Track active connections per server, connection rate, disconnection rate, and disconnection reasons. Set alerts for connection saturation (>90%).

---

# Performance Checklist

- [ ] Horizontal scaling overhead: Redis pub/sub and sticky routing add 1-5ms per message.
- [ ] Memory per streaming connection: ~1-5MB in PHP-FPM (entire process), ~50-100KB in event-loop server (per-connection state only).
- [ ] Octane/RoadRunner streaming capacity: 1000-5000 concurrent streams per process (depending on memory).
- [ ] PHP-FPM streaming capacity: `pm.max_children` (typically 50-200) concurrent streams.
- [ ] Redis pub/sub throughput: 100K+ messages/second. Sufficient for most streaming applications.
- [ ] Reverb capacity: 10,000+ concurrent WebSocket connections per process.
- [ ] Connection limits prevent resource exhaustion attacks (one user cannot consume all connections)
- [ ] Graceful draining must complete within a timeout; forcibly close remaining connections after timeout

---

# Security Checklist

- [ ] Sticky sessions must not bypass authentication â€” re-authenticate on new server if session state is lost

---

# Reliability Checklist

- [ ] No connection limits â€” the server accepts connections until it runs out of memory and crashes.
- [ ] Not implementing sticky sessions for WebSocket â€” requests are routed to different servers, breaking the connection.
- [ ] Not monitoring connection metrics â€” discovering connection limits through user complaints.
- [ ] Single-server deployment â€” when the server goes down, all connections are lost.
- [ ] Using long polling instead of WebSockets or SSE â€” long polling creates more server load than streaming connections.
- [ ] Using PHP-FPM for high-concurrency streaming â€” each stream holds an entire PHP process, limiting concurrency.

---

# Testing Checklist

- [ ] Auto-scaling is configured based on connection count metric
- [ ] Auto-scaling is configured based on connection count metric.
- [ ] Auto-scaling triggers before connection saturation causes 503s
- [ ] Connection limits are configured per server (max concurrent connections)
- [ ] Connection limits are configured per server (max concurrent connections).
- [ ] Connection limits prevent one user/server from exhausting the pool
- [ ] Connection metrics (active connections, connection rate) are monitored
- [ ] Connection metrics (active connections, connection rate) are monitored.
- [ ] Dedicated streaming workers don't starve API request workers
- [ ] Event-loop server (Octane/RoadRunner/Swoole) is used for high-concurrency streaming (not PHP-FPM)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Client Waiting for Full Response Before Rendering]
- [ ] [No Reconnection Logic on Network Interrupt]
- [ ] [No Exponential Backoff on Reconnection Attempts]
- [ ] [Client-Side Buffer Overflow from Fast Stream]
- [ ] [No Visual Indicator for Stream State (Connecting/Streaming/Error/Complete)]
- [ ] Ignoring Connection Draining:
- [ ] Infinite Connections:
- [ ] Monolithic Streaming Server:
- [ ] No Capacity Planning:
- [ ] Process-Per-Stream Forever:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor for connection storms (rapid connect/disconnect cycles) that could indicate attack patterns

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


