---
id: ku-05
title: "Scaling Streaming Connections"
subdomain: "streaming-real-time-ai"
ku-type: "infrastructure"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/streaming-real-time-ai/ku-05/04-standardized-knowledge.md"
---

# Scaling Streaming Connections

## Overview

Scaling streaming connections addresses the infrastructure challenges of handling thousands of concurrent long-lived streaming connections. Unlike traditional HTTP requests (which complete in milliseconds), streaming connections can last 30-300 seconds, consuming server resources for the entire duration. Scaling requires moving from PHP-FPM's process-per-request model to event-loop-based architectures (Swoole, RoadRunner, ReactPHP) and managing WebSocket connections across multiple servers. In the Laravel ecosystem, Laravel Reverb and Octane provide the foundation for scalable streaming.

## Core Concepts

- **Concurrent Connections:** The number of simultaneous streaming connections the server maintains. Each connection consumes memory and CPU.
- **Process-Per-Connection (PHP-FPM):** Each streaming connection occupies one PHP-FPM worker process. Limits concurrent connections to `pm.max_children`.
- **Event Loop (Swoole/RoadRunner):** A single process handles many concurrent connections using non-blocking I/O. Thousands of connections per process.
- **Horizontal Scaling:** Adding more servers behind a load balancer. WebSocket connections need sticky sessions or a shared pub/sub backend.
- **Sticky Sessions (Session Affinity):** Routing a client's requests to the same server. Required for WebSocket connections (stateful).
- **Shared State (Redis):** WebSocket connection state stored in Redis so any server can route messages to the correct server.
- **Graceful Degradation:** When the server reaches capacity, reject new connections with a clear error instead of crashing existing connections.
- **Auto-Scaling:** Automatically adding server instances based on connection count and CPU utilization.

## When To Use

- Production streaming services expected to handle 500+ concurrent connections.
- Applications where streaming connections last 30+ seconds (long responses, agent loops).
- WebSocket-based applications that need horizontal scaling.
- Any streaming application with availability requirements (no single point of failure).

## When NOT To Use

- Low-traffic internal tools (under 50 concurrent connections).
- SSE-only applications where nginx can handle many concurrent connections (PHP-FPM still the bottleneck for the streaming source).

## Best Practices

- **Use an event-loop server** (RoadRunner, Swoole) for high-concurrency streaming — they handle 10x more connections than PHP-FPM with the same hardware.
- **Separate streaming from API traffic.** Dedicated servers or processes for streaming endpoints avoid starving API requests.
- **Implement connection limits.** Set a maximum number of concurrent connections per server and return 503 when exceeded.
- **Use Redis for shared state.** WebSocket connections on different servers share session state via Redis pub/sub.
- **Auto-scale based on connection count.** Cloud auto-scaling groups should scale on `active_connections` metric, not CPU.
- **Monitor connections per server.** Track connection count, connection rate, and disconnection reasons.

## Architecture Guidelines

- Deploy **Laravel Octane** (RoadRunner or Swoole) for PHP applications that need high-concurrency streaming.
- For WebSocket streaming, use **Laravel Reverb** as the WebSocket server with **Redis** as the pub/sub backend.
- Use a **load balancer** (nginx, HAProxy, ALB) that supports sticky sessions for WebSocket connections.
- For SSE streaming over HTTP, use **Octane workers** — they keep PHP in memory between requests.
- Implement a **connection registry** (Redis) that tracks which server holds which connection — enables targeted message delivery.
- Use **container orchestration** (Kubernetes, ECS) for auto-scaling streaming servers.

## Performance Considerations

- PHP-FPM streaming capacity: `pm.max_children` (typically 50-200) concurrent streams.
- Octane/RoadRunner streaming capacity: 1000-5000 concurrent streams per process (depending on memory).
- Reverb capacity: 10,000+ concurrent WebSocket connections per process.
- Memory per streaming connection: ~1-5MB in PHP-FPM (entire process), ~50-100KB in event-loop server (per-connection state only).
- Redis pub/sub throughput: 100K+ messages/second. Sufficient for most streaming applications.
- Horizontal scaling overhead: Redis pub/sub and sticky routing add 1-5ms per message.

## Common Mistakes

- Using PHP-FPM for high-concurrency streaming — each stream holds an entire PHP process, limiting concurrency.
- Not implementing sticky sessions for WebSocket — requests are routed to different servers, breaking the connection.
- No connection limits — the server accepts connections until it runs out of memory and crashes.
- Single-server deployment — when the server goes down, all connections are lost.
- Not monitoring connection metrics — discovering connection limits through user complaints.
- Using long polling instead of WebSockets or SSE — long polling creates more server load than streaming connections.

## Anti-Patterns

- **Monolithic Streaming Server:** Handling streaming, API, and WebSocket on the same server. Separate concerns for scalability.
- **Infinite Connections:** No limit on connections per user or per IP. One user can exhaust server resources.
- **No Capacity Planning:** Deploying streaming without load testing. Streaming connections consume very different resources than API requests.
- **Process-Per-Stream Forever:** Using PHP-FPM for streaming without considering that streams last 30+ seconds.
- **Ignoring Connection Draining:** When scaling down, active connections are dropped. Implement graceful draining (finish existing streams before shutting down).

## Examples

### Octane Configuration for Streaming
```php
// config/octane.php
return [
    'server' => env('OCTANE_SERVER', 'roadrunner'),
    'max_requests' => 500,
    'workers' => env('OCTANE_WORKERS', 4),  // 4 workers × 1000 connections each
];
```

### Connection Limit Middleware
```php
class ConnectionLimitMiddleware {
    public function __construct(private Redis $redis) {}

    public function handle(Request $request, Closure $next): Response {
        $serverId = gethostname();
        $connectionsKey = "stream:connections:{$serverId}";
        $maxConnections = config('streaming.max_connections_per_server', 1000);
        $current = $this->redis->incr($connectionsKey);
        $this->redis->expire($connectionsKey, 60);

        if ($current > $maxConnections) {
            $this->redis->decr($connectionsKey);
            return response()->json([
                'error' => 'Server at capacity. Try again later.',
                'retry_after' => 5,
            ], 503);
        }

        $response = $next($request);

        // Decrement on response finish
        $this->redis->decr($connectionsKey);

        return $response;
    }
}
```

### Reverb Scaling Configuration
```php
// config/reverb.php (multi-server deployment)
return [
    'scaling' => [
        'enabled' => true,
        'server_id' => env('REVERB_SERVER_ID', gethostname()),
        'redis' => [
            'connection' => 'default',
            'prefix' => 'reverb:',
        ],
    ],
];
```

## Related Topics

- ku-01 (Streaming Fundamentals): Foundation for scaling.
- ku-02 (WebSockets & Real-Time Communication): WebSocket scaling.
- ku-04 (Performance Optimization): Optimization complements scaling.
- ai-middleware-gateway/ku-01: Gateway-level connection management.
- cost-management-observability/ku-03: Monitoring streaming connections.

## AI Agent Notes

- When asked to scale streaming, first determine: current connection limits (PHP-FPM vs. Octane), expected concurrency, and WebSocket requirements.
- For scaling issues, check: PHP-FPM `pm.max_children`, Octane worker count, Reverb scaling config, and Redis pub/sub.
- Prefer reading the infrastructure configuration (supervisor, Docker, K8s) before the application code.
- When generating scaling code, include: connection limits, sticky session config, Redis shared state, and connection metrics.

## Verification

- [ ] Event-loop server (Octane/RoadRunner/Swoole) is used for high-concurrency streaming (not PHP-FPM).
- [ ] WebSocket connections use sticky sessions or Redis pub/sub for horizontal scaling.
- [ ] Connection limits are configured per server (max concurrent connections).
- [ ] Redis pub/sub is configured for cross-server message routing.
- [ ] Connection metrics (active connections, connection rate) are monitored.
- [ ] Auto-scaling is configured based on connection count metric.
- [ ] Graceful connection draining is implemented for server shutdown/scaling down.
