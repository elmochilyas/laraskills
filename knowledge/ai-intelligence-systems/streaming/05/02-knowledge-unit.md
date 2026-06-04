# Knowledge Unit: Scaling Streaming Connections

## Metadata

- **ID:** ku-05
- **Subdomain:** Streaming & Real-Time AI
- **Slug:** scaling-streaming-connections
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

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

## Mental Models

- **Concurrent Connections:** The number of simultaneous streaming connections the server maintains. Each connection consumes memory and CPU.
- **Process-Per-Connection (PHP-FPM):** Each streaming connection occupies one PHP-FPM worker process. Limits concurrent connections to `pm.max_children`.
- **Event Loop (Swoole/RoadRunner):** A single process handles many concurrent connections using non-blocking I/O. Thousands of connections per process.


## Internal Mechanics

The internal mechanics of Scaling Streaming Connections follow established patterns within the Streaming & Real-Time AI domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use an event-loop server** (RoadRunner, Swoole) for high-concurrency streaming â€” they handle 10x more connections than PHP-FPM with the same hardware.
- **Separate streaming from API traffic.** Dedicated servers or processes for streaming endpoints avoid starving API requests.
- **Implement connection limits.** Set a maximum number of concurrent connections per server and return 503 when exceeded.
- **Use Redis for shared state.** WebSocket connections on different servers share session state via Redis pub/sub.
- **Auto-scale based on connection count.** Cloud auto-scaling groups should scale on `active_connections` metric, not CPU.
- **Monitor connections per server.** Track connection count, connection rate, and disconnection reasons.

## Patterns

- **Use an event-loop server** (RoadRunner, Swoole) for high-concurrency streaming â€” they handle 10x more connections than PHP-FPM with the same hardware.
- **Separate streaming from API traffic.** Dedicated servers or processes for streaming endpoints avoid starving API requests.
- **Implement connection limits.** Set a maximum number of concurrent connections per server and return 503 when exceeded.
- **Use Redis for shared state.** WebSocket connections on different servers share session state via Redis pub/sub.
- **Auto-scale based on connection count.** Cloud auto-scaling groups should scale on `active_connections` metric, not CPU.
- **Monitor connections per server.** Track connection count, connection rate, and disconnection reasons.

## Architectural Decisions

- Deploy **Laravel Octane** (RoadRunner or Swoole) for PHP applications that need high-concurrency streaming.
- For WebSocket streaming, use **Laravel Reverb** as the WebSocket server with **Redis** as the pub/sub backend.
- Use a **load balancer** (nginx, HAProxy, ALB) that supports sticky sessions for WebSocket connections.
- For SSE streaming over HTTP, use **Octane workers** â€” they keep PHP in memory between requests.
- Implement a **connection registry** (Redis) that tracks which server holds which connection â€” enables targeted message delivery.
- Use **container orchestration** (Kubernetes, ECS) for auto-scaling streaming servers.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- PHP-FPM streaming capacity: `pm.max_children` (typically 50-200) concurrent streams.
- Octane/RoadRunner streaming capacity: 1000-5000 concurrent streams per process (depending on memory).
- Reverb capacity: 10,000+ concurrent WebSocket connections per process.
- Memory per streaming connection: ~1-5MB in PHP-FPM (entire process), ~50-100KB in event-loop server (per-connection state only).
- Redis pub/sub throughput: 100K+ messages/second. Sufficient for most streaming applications.
- Horizontal scaling overhead: Redis pub/sub and sticky routing add 1-5ms per message.

## Production Considerations



## Common Mistakes

- Using PHP-FPM for high-concurrency streaming â€” each stream holds an entire PHP process, limiting concurrency.
- Not implementing sticky sessions for WebSocket â€” requests are routed to different servers, breaking the connection.
- No connection limits â€” the server accepts connections until it runs out of memory and crashes.
- Single-server deployment â€” when the server goes down, all connections are lost.
- Not monitoring connection metrics â€” discovering connection limits through user complaints.
- Using long polling instead of WebSockets or SSE â€” long polling creates more server load than streaming connections.

## Failure Modes

- **Monolithic Streaming Server:** Handling streaming, API, and WebSocket on the same server. Separate concerns for scalability.
- **Infinite Connections:** No limit on connections per user or per IP. One user can exhaust server resources.
- **No Capacity Planning:** Deploying streaming without load testing. Streaming connections consume very different resources than API requests.
- **Process-Per-Stream Forever:** Using PHP-FPM for streaming without considering that streams last 30+ seconds.
- **Ignoring Connection Draining:** When scaling down, active connections are dropped. Implement graceful draining (finish existing streams before shutting down).

## Ecosystem Usage

### Octane Configuration for Streaming
```php
// config/octane.php
return [
    'server' => env('OCTANE_SERVER', 'roadrunner'),
    'max_requests' => 500,
    'workers' => env('OCTANE_WORKERS', 4),  // 4 workers Ã— 1000 connections each
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

## Related Knowledge Units

- ku-01 (Streaming Fundamentals): Foundation for scaling.
- ku-02 (WebSockets & Real-Time Communication): WebSocket scaling.
- ku-04 (Performance Optimization): Optimization complements scaling.
- ai-middleware-gateway/ku-01: Gateway-level connection management.
- cost-management-observability/ku-03: Monitoring streaming connections.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

