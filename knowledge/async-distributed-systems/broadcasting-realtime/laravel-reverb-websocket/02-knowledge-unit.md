# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Laravel Reverb — WebSocket Server, FrankenPHP Engine
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Reverb is a first-party WebSocket server powered by FrankenPHP — a PHP application server built on top of the Go-based Caddy web server. Unlike traditional PHP WebSocket solutions (which require separate Node.js/Go services), Reverb runs as a long-lived PHP process using FrankenPHP's ability to keep PHP in memory between requests. This eliminates the bootstrap cost for each WebSocket message. Reverb implements the Pusher protocol, making it a drop-in replacement for Pusher without per-connection SaaS costs.

# Core Concepts
- **FrankenPHP**: A PHP application server (Caddy + PHP worker mode). Maintains a persistent PHP process that handles multiple requests over its lifetime.
- **Pusher protocol compatibility**: Reverb speaks the same protocol as Pusher. Laravel's broadcasting driver for Reverb sends HTTP requests the same way it does for Pusher.
- **In-memory state**: Reverb stores channel subscriptions and presence state in memory. No external database for runtime state.
- **Scaling via processes**: Multiple Reverb processes can run behind a load balancer, sharing state via Redis (or broadcasting internal events).
- **Event loop**: Reverb runs its own event loop (via ReactPHP or FrankenPHP's internal loop) for non-blocking I/O.

# Mental Models
- **PHP as a WebSocket server**: Reverb breaks the "PHP is request-response only" stereotype. It runs a persistent PHP process that handles WebSocket connections like Node.js or Go.
- **Pusher replacement**: Reverb is like running your own Pusher server. The API is identical; only the infrastructure location differs.

# Internal Mechanics
- `reverb:start` boots a FrankenPHP worker that runs `App\Console\Commands\Reverb\Start` as a long-lived process.
- The process registers routes from `routes/channels.php` for authorization.
- On WebSocket connection, Reverb handles the upgrade handshake, parses Pusher-protocol frames.
- On receiving a broadcast event from Laravel (HTTP request from the broadcasting driver), Reverb pushes the message to all connected clients subscribed to that channel.
- Presence channels track user state (join/leave events, current users).
- For multi-process scaling: Reverb processes use Redis pub/sub to propagate messages between instances. When one process receives a broadcast, it publishes to Redis, and all other subscribed Reverb processes receive and forward to their clients.
- Graceful shutdown: SIGTERM causes Reverb to close WebSocket connections with a 1001 (going away) status code.

# Patterns
## Reverb Behind Nginx
- **Purpose**: Proxy WebSocket connections through Nginx for SSL termination and load balancing.
- **Benefit**: Single ingress point; SSL handled by Nginx.
- **Tradeoff**: Nginx proxy_read_timeout must be high enough for long-lived WebSockets.

## Multi-Process Reverb
- **Purpose**: Scale WebSocket capacity across CPU cores.
- **Benefit**: Linear scaling with process count.
- **Tradeoff**: Process coordination requires Redis pub/sub.

## Reverb with Supervisor
- **Purpose**: Keep Reverb running across crashes and deploys.
- **Benefit**: Automatic restart; can scale via `numprocs`.
- **Tradeoff**: Additional process management complexity.

# Architectural Decisions
- **Single Reverb process for <1K concurrent connections**: One process handles the load. No scaling complexity.
- **Multiple Reverb processes for >1K connections**: Process-per-core. Requires Redis for inter-process communication.
- **Reverb vs Pusher**: Choose Reverb for cost control and data sovereignty; Pusher for zero operations overhead.
- **Reverb with FrankenPHP vs RoadRunner**: Reverb uses FrankenPHP natively. RoadRunner is an alternative but requires separate configuration.

# Tradeoffs
Reverb (self-hosted) | Zero per-connection fees, full data control, PHP-native | Operations overhead; scaling requires planning
Pusher (SaaS) | No server management, global edge, 99.9% SLA | Per-connection cost; data traverses third-party network
Single Reverb process | Simple deployment, no inter-process coordination | Limited to ~1K concurrent connections; single point of failure

# Performance Considerations
- Reverb connection capacity is primarily limited by: file descriptors (ulimit -n), memory (per-connection overhead), PHP process limits.
- Each WebSocket connection uses ~50-100KB of PHP memory. 10K connections = ~500MB-1GB memory.
- Message throughput: message delivery time is sub-millisecond in the same process. Cross-process delivery adds Redis pub/sub latency (~1-5ms).
- FrankenPHP's worker mode eliminates PHP bootstrap cost — each message handling is ~5-10x faster than traditional PHP.
- Open file limits must be set high enough for expected connections + system overhead.

# Production Considerations
- Set `ulimit -n` (open files) to at least `max_connections * 2 + 1000`.
- Configure Nginx `proxy_read_timeout` to 86400s (24 hours) — WebSocket connections are long-lived.
- Use Supervisor or systemd to manage Reverb processes. Auto-restart on crash.
- Monitor Reverb memory usage — it should stabilize, not grow. Growing memory indicates a leak.
- Configure SSL termination at Nginx level. WSS requires valid SSL certificate.
- For multi-server deployments: Reverb processes on each server share Redis. Each server's Nginx proxies to local Reverb.

# Common Mistakes
- **Not increasing open file limits**: Default ulimit is 1024. WebSocket connections quickly exhaust this.
- **Running Reverb without Supervisor**: If Reverb crashes (OOM, exception), connections drop and no auto-restart.
- **Not sharing state across processes**: Without Redis pub/sub, clients connected to different Reverb processes can't see each other's presence state or receive broadcasts.
- **Setting Nginx `proxy_read_timeout` too low**: Default 60s. WebSocket connections idle for longer than 60s are disconnected by Nginx.

# Failure Modes
- **OOM kill**: Reverb process exceeds memory limit. Supervisor restarts it, but all WebSocket connections drop. Clients must reconnect.
- **Redis pub/sub outage**: Cross-process broadcasting fails. Clients on different processes don't receive each other's events.
- **File descriptor exhaustion**: New connections fail with "too many open files." Existing connections remain but new ones can't connect.
- **FrankenPHP worker crash**: The persistent PHP process crashes (segfault, fatal error). All WebSocket connections on that process drop.
- **Network partition**: Reverb process loses connectivity to Redis. Can't authenticate new connections via channel auth callbacks.

# Ecosystem Usage
- **Laravel framework**: Reverb is bundled with Laravel 11+ as a first-party package. `laravel/reverb` composer package.
- **Laravel Echo**: Standard client for Reverb. No client-side changes needed.
- **FrankenPHP**: The underlying engine. Handles the Go-to-PHP bridge, TLS, and HTTP/1.1/2 support.

# Related Knowledge Units
- K030 Broadcasting System Overview (context) | K034 Reverb Production Deployment (SSL, Nginx) | K035 Reverb Scaling

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
