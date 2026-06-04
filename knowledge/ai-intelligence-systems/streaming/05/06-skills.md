# Skill: Scale Streaming Connections to Production

## Purpose
Infrastructure configuration for handling thousands of concurrent streaming connections using event-loop servers (Octane/RoadRunner), Laravel Reverb horizontal scaling, connection limits, and auto-scaling based on active connection metrics.

## When To Use
- Production streaming services expected to handle 500+ concurrent connections
- Applications where streaming connections last 30+ seconds (long responses, agent loops)
- WebSocket-based applications that need horizontal scaling across multiple servers
- Any streaming application with availability requirements (no single point of failure)

## When NOT To Use
- Low-traffic internal tools (under 50 concurrent connections)
- SSE-only applications where nginx handles connections and the PHP backend has low concurrency
- Prototypes where scaling infrastructure is premature

## Prerequisites
- KU-01 (Streaming Fundamentals) — understanding of streaming connection lifecycle
- KU-02 (WebSockets & Real-Time Communication) — WebSocket server architecture
- KU-04 (Performance Optimization) — buffering, flushing, connection pooling
- Laravel Octane installed (RoadRunner or Swoole) or Reverb configured
- Redis configured for cross-server communication
- Load balancer configured with sticky session support

## Inputs
- Expected peak concurrent connections
- Average streaming duration (seconds)
- Server specification (CPU cores, RAM, network)
- WebSocket vs. SSE ratio
- Auto-scaling configuration parameters
- Current connection metrics and server capacity

## Workflow
1. **Assess current capacity**: Determine the maximum concurrent streaming connections the current infrastructure can handle based on PHP-FPM workers, memory, and network.
2. **Move to event-loop server**: Deploy Laravel Octane with RoadRunner or Swoole. Configure worker count (4-8 workers typically) based on CPU cores. Each worker handles 1000-5000 concurrent connections.
3. **Separate streaming from API traffic**: Route streaming endpoints to dedicated Octane workers (or separate server instances) from regular HTTP API traffic. Use separate RoadRunner worker pools or separate server instances.
4. **Configure connection limits**: Implement a middleware that tracks active connections per server using Redis (INCR/ DECR). Reject new connections with 503 when the limit is exceeded. Set `Retry-After` header.
5. **Set up Redis pub/sub for cross-server routing**: Configure Reverb (or Octane) with Redis pub/sub as the shared message bus. Each server subscribes to channels for its connected clients.
6. **Configure sticky sessions**: Enable session affinity at the load balancer (nginx `ip_hash`, AWS ALB stickiness, HAProxy cookie insertion) for WebSocket connections.
7. **Implement graceful draining**: Handle server shutdown signals (SIGTERM) by stopping new connections, finishing existing streams within a timeout, then shutting down.
8. **Set up auto-scaling**: Configure auto-scaling based on `active_connections` metric (not CPU). Scale up when connections exceed 80% of per-server capacity. Scale down when sustained below 40%.
9. **Monitor connection metrics**: Track active connections per server, connection rate, disconnection rate, and disconnection reasons. Set alerts for connection saturation (>90%).
10. **Load test**: Run load tests simulating expected peak concurrent connections. Measure TTFT, TPS, and error rate at capacity. Adjust configuration based on results.

## Validation Checklist
- [ ] Event-loop server (Octane/RoadRunner/Swoole) is used for high-concurrency streaming (not PHP-FPM)
- [ ] WebSocket connections use sticky sessions or Redis pub/sub for horizontal scaling
- [ ] Connection limits are configured per server (max concurrent connections)
- [ ] Redis pub/sub is configured for cross-server message routing
- [ ] Connection metrics (active connections, connection rate) are monitored
- [ ] Auto-scaling is configured based on connection count metric
- [ ] Graceful connection draining is implemented for server shutdown

## Common Failures
- **Worker pool exhaustion**: Streaming connections and API requests share the same worker pool. Fix: separate streaming and API traffic into dedicated worker pools or server instances.
- **WebSocket messages lost in multi-server deployments**: No Redis pub/sub or sticky sessions configured. Fix: configure Redis pub/sub scaling for Reverb, enable sticky sessions at the load balancer.
- **Server OOM under load**: No connection limits. Fix: implement Redis-based connection counter with per-server limits and 503 rejection.
- **Auto-scaling doesn't trigger**: Scaling on CPU while streaming connections are CPU-light. Fix: scale on `active_connections` metric.
- **Connections dropped during scaling down**: No graceful draining. Fix: implement SIGTERM handler that stops accepting new connections and drains existing ones.

## Decision Points
- **PHP-FPM vs. Octane**: PHP-FPM for <50 concurrent streams (one process per connection). Octane for >50 (event-loop handles 1000+ per worker).
- **Self-hosted Reverb vs. managed Pusher**: Reverb for full control and no per-connection cost at scale. Pusher for zero ops but higher cost at high connection counts.
- **Connection limit strategy**: Hard limit (reject over capacity) for availability. Soft limit (queue with position) for better UX. Implement hard limit first, add queuing as needed.
- **Scale up vs. scale out**: Scale up (single large server) up to 64GB RAM for simplicity. Scale out (multiple smaller servers) for HA and beyond 64GB.

## Performance Considerations
- PHP-FPM: 50-200 concurrent streams (1 process per connection)
- Octane/RoadRunner: 1000-5000 concurrent streams per worker (4-8 workers = 4000-40000 total)
- Reverb: 10,000+ concurrent WebSocket connections per process
- Memory: PHP-FPM ~1-5MB per connection, Octane ~50-100KB per connection
- Redis pub/sub: 100K+ messages/second, adds 1-5ms per message
- nginx connection limit: typically 4096-65536 concurrent connections

## Security Considerations
- Connection limits prevent resource exhaustion attacks (one user cannot consume all connections)
- Sticky sessions must not bypass authentication — re-authenticate on new server if session state is lost
- Redis pub/sub channels should not expose sensitive data in channel names
- Graceful draining must complete within a timeout; forcibly close remaining connections after timeout
- Monitor for connection storms (rapid connect/disconnect cycles) that could indicate attack patterns

## Related Rules
- Always implement connection limits per server with a clear 503 rejection response
- Separate streaming traffic from API traffic onto dedicated servers or worker pools
- Use Redis pub/sub for cross-server WebSocket message routing, never direct server-to-server connections
- Implement sticky sessions (session affinity) for WebSocket connections at the load balancer
- Monitor active streaming connection count as the primary auto-scaling metric

## Related Skills
- Skill: Implement LLM Response Streaming with SSE (ku-01)
- Skill: Implement WebSocket Streaming for Bidirectional AI Communication (ku-02)
- Skill: Stream Tool Calls and Agent Loops (ku-03)
- Skill: Optimize Streaming Performance (ku-04)

## Success Criteria
- Server handles target concurrent streaming connections (p99) with <1% error rate
- TTFT and TPS remain within SLA at peak connection count
- Dedicated streaming workers don't starve API request workers
- Auto-scaling triggers before connection saturation causes 503s
- WebSocket messages reach all connected clients across multi-server deployment
- Graceful connection draining completes within 30 seconds during scale-down
- Connection limits prevent one user/server from exhausting the pool