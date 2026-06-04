# Decomposition: Scaling Streaming Connections

## Topic Overview

Scaling streaming connections addresses the infrastructure challenges of handling thousands of concurrent long-lived streaming connections. Unlike traditional HTTP requests (which complete in milliseconds), streaming connections can last 30-300 seconds, consuming server resources for the entire duration. Scaling requires moving from PHP-FPM's process-per-request model to event-loop-based architectures (Swoole, RoadRunner, ReactPHP) and managing WebSocket connections across multiple servers. In the Laravel ecosystem, Laravel Reverb and Octane provide the foundation for scalable streaming.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-05/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Scaling Streaming Connections
- **Purpose:** Scaling streaming connections addresses the infrastructure challenges of handling thousands of concurrent long-lived streaming connections. Unlike traditional HTTP requests (which complete in milliseconds), streaming connections can last 30-300 seconds, consuming server resources for the entire duration. Scaling requires moving from PHP-FPM's process-per-request model to event-loop-based architectures (Swoole, RoadRunner, ReactPHP) and managing WebSocket connections across multiple servers. In the Laravel ecosystem, Laravel Reverb and Octane provide the foundation for scalable streaming.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-04, ku-01, ku-03

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-04
- ku-01
- ku-03

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Concurrent Connections:** The number of simultaneous streaming connections the server maintains. Each connection consumes memory and CPU.
- **Process-Per-Connection (PHP-FPM):** Each streaming connection occupies one PHP-FPM worker process. Limits concurrent connections to `pm.max_children`.
- **Event Loop (Swoole/RoadRunner):** A single process handles many concurrent connections using non-blocking I/O. Thousands of connections per process.
- **Horizontal Scaling:** Adding more servers behind a load balancer. WebSocket connections need sticky sessions or a shared pub/sub backend.
- **Sticky Sessions (Session Affinity):** Routing a client's requests to the same server. Required for WebSocket connections (stateful).
- **Shared State (Redis):** WebSocket connection state stored in Redis so any server can route messages to the correct server.
- **Graceful Degradation:** When the server reaches capacity, reject new connections with a clear error instead of crashing existing connections.
- **Auto-Scaling:** Automatically adding server instances based on connection count and CPU utilization.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

