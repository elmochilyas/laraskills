# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Reverb Production: SSL, Nginx, Open Files, Event Loop
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Deploying Reverb to production requires specific infrastructure configuration beyond typical Laravel applications. Key concerns: SSL termination (WSS requires valid certificate), Nginx proxying (WebSocket upgrade headers, long timeouts), operating system limits (open file descriptors for WebSocket connections), event loop health (no blocking I/O in the Reverb process), and process management (Supervisor for auto-restart). Misconfiguration in any of these areas causes silent connection failures, unexpected disconnections, or inability to scale.

# Core Concepts
- **WSS**: WebSocket Secure — WebSocket over TLS. Required for secure connections from browsers.
- **Nginx WebSocket proxy**: Nginx must forward `Upgrade` and `Connection` headers to the Reverb backend.
- **`proxy_read_timeout`**: Nginx setting for how long to keep the connection open. Must be set to hours for WebSockets.
- **Open file descriptors (`ulimit -n`)**: Each WebSocket connection uses a file descriptor. Default ulimit (1024) is insufficient.
- **Event loop**: Reverb's PHP event loop must handle I/O without blocking. Synchronous calls (HTTP requests, DB queries) block all other connections.
- **Supervisor process management**: `numprocs` > 1 enables multi-process Reverb.

# Mental Models
- **Highway tunnel**: WebSocket connections are like cars in a tunnel. Nginx is the tunnel entrance (with toll booth for SSL). The tunnel must stay open (proxy_read_timeout) for the car to exit. The tunnel's capacity (open file limit) limits how many cars can be inside simultaneously.
- **Pipeline**: The event loop is a pipeline. If one package blocks the pipeline (blocking I/O), all packages behind it wait. Non-blocking I/O ensures smooth flow.

# Internal Mechanics
- Nginx configuration for WebSocket proxy:
  ```nginx
  location /app {
      proxy_pass http://localhost:8080;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_read_timeout 86400s;
  }
  ```
- `proxy_read_timeout 86400s` — 24-hour timeout. Without this, Nginx closes idle WebSocket connections after 60 seconds.
- Open file limit: Set via `ulimit -n 65536` in Supervisor config or system-wide `/etc/security/limits.conf`.
- Reverb runs on a configurable port (default 8080). Standard HTTP/HTTPS ports (80/443) require additional proxy.
- Event loop health: Reverb uses FrankenPHP's event loop. Blocking operations (file_get_contents, sleep, DB queries) freeze the loop.
- Supervisor config: `numprocs` = number of Reverb processes. Each handles a subset of connections.

# Patterns
## Nginx TLS Termination
- **Purpose**: Handle SSL at Nginx level, Reverb talks HTTP internally.
- **Benefit**: SSL certificate managed by Nginx; Reverb process doesn't handle TLS.
- **Tradeoff**: Nginx must be configured for WebSocket upgrades.

## Supervisor-Managed Multi-Process
- **Purpose**: Run multiple Reverb processes behind Nginx load balancing.
- **Benefit**: Scale beyond single-process limitations.
- **Tradeoff**: Inter-process state via Redis pub/sub required.

## Health Check Endpoint
- **Purpose**: Monitor Reverb process health.
- **Benefit**: Detect stuck/frozen processes.
- **Tradeoff**: Additional endpoint configuration.

# Architectural Decisions
- **Nginx proxy vs direct Reverb**: Always proxy through Nginx for SSL, load balancing, and rate limiting. Direct Reverb exposure is only acceptable in controlled environments.
- **Number of processes**: Match `numprocs` to CPU cores. Each process handles ~1K-2K concurrent connections.
- **SSL termination at Nginx vs Reverb**: Terminate at Nginx. Reverb doesn't need to handle certificate management.
- **Unix socket vs TCP**: For single-server deployments, Unix sockets avoid TCP overhead. For multi-server, TCP.

# Tradeoffs
Nginx proxy | SSL, load balancing, rate limiting | Additional latency (microseconds); configuration complexity
Direct Reverb | Simpler setup, no proxy latency | Must handle SSL in Reverb; no built-in rate limiting
Single process | Simple, no coordination needed | Limited to ~1K connections; no HA

# Performance Considerations
- Open file limit: Each WebSocket connection = 1 file descriptor + system overhead. Set `ulimit -n` to `max_connections * 2 + reserve`.
- Nginx proxy adds ~1ms latency per message. Acceptable for most use cases.
- Event loop blocking: a single `sleep(1)` in a request handler blocks ALL Reverb connections for 1 second.
- Memory per connection: ~50-100KB. 10K connections = ~500MB-1GB.
- CPU per message: ~0.01ms for delivery. 10K messages/second ≈ 100% of one CPU core.

# Production Considerations
- Monitor `ulimit -n` current usage: `lsof -p <reverb_pid> | wc -l`.
- Set `proxy_read_timeout` to 86400 in Nginx. Test with idle connections.
- Configure Nginx `worker_connections` to at least the expected concurrent connection count.
- Use Supervisor's `minfds` setting to raise the file descriptor limit for managed processes.
- Monitor Reverb process RSS memory. It should stabilize; growth indicates a memory leak.
- Set up connection count monitoring — alert on approaching `ulimit` limits.
- Test event loop responsiveness: periodically send a ping message and measure response time.

# Common Mistakes
- **Not increasing Nginx `worker_connections`**: Nginx default 512 is too low. Set to at least expected concurrent connections.
- **Not configuring `proxy_read_timeout`**: Default 60s causes WebSocket disconnects every 60 seconds.
- **Blocking the event loop**: Making HTTP requests or DB queries in Reverb event handlers blocks ALL connections.
- **Running Reverb without process monitoring**: If Reverb crashes, all connections drop. Supervisor/systemd required.
- **Setting `ulimit` in shell but not in Supervisor**: `ulimit -n 65536` in shell doesn't affect Supervisor-managed processes. Set `minfds=65536` in Supervisor config.

# Failure Modes
- **File descriptor exhaustion**: New connections fail with "socket: too many open files." Clients receive 503. Existing connections survive until they close.
- **Nginx timeout disconnecting users**: `proxy_read_timeout` too low — connections drop after timeout. Clients reconnect automatically but experience interruption.
- **Event loop frozen**: A synchronous I/O operation blocks the loop. No connections are served during the block. All clients experience latency spike.
- **Memory leak crash**: Reverb process grows unbounded, eventually OOM killed. Supervisor restarts, but all connections drop.
- **SSL certificate expiration**: WSS connections fail. Browsers block connections to endpoints with expired certificates.

# Ecosystem Usage
- **Laravel Framework**: Reverb documentation covers Nginx configuration, ulimit, and Supervisor setup.
- **Laravel Forge**: Forge provides Reverb deployment recipes with Nginx configuration, Supervisor, and SSL setup.
- **FrankenPHP**: Handles the event loop and PHP worker mode. Configuration via `frankenphp.yml` or environment variables.

# Related Knowledge Units
- K031 Laravel Reverb (architecture) | K035 Reverb Scaling (multi-process)

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
