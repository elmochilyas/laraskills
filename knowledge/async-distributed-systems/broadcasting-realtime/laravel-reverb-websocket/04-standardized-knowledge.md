# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K031 — Laravel Reverb WebSocket Server
- **Knowledge ID:** K031
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Reverb
  - Laravel Source — `laravel/reverb` package
  - FrankenPHP documentation
  - Pusher protocol specification

---

# Overview

Laravel Reverb is a first-party WebSocket server powered by FrankenPHP — a PHP application server built on top of the Go-based Caddy web server. Unlike traditional PHP WebSocket solutions (which require separate Node.js/Go services), Reverb runs as a long-lived PHP process using FrankenPHP's ability to keep PHP in memory between requests. This eliminates the bootstrap cost for each WebSocket message. Reverb implements the Pusher protocol, making it a drop-in replacement for Pusher without per-connection SaaS costs.

---

# Core Concepts

- **FrankenPHP:** A PHP application server (Caddy + PHP worker mode). Maintains a persistent PHP process that handles multiple requests over its lifetime.
- **Pusher protocol compatibility:** Reverb speaks the same protocol as Pusher. Laravel's broadcasting driver for Reverb sends HTTP requests the same way it does for Pusher.
- **In-memory state:** Reverb stores channel subscriptions and presence state in memory. No external database for runtime state.
- **Scaling via processes:** Multiple Reverb processes can run behind a load balancer, sharing state via Redis pub/sub.
- **Event loop:** Reverb runs its own event loop (via ReactPHP or FrankenPHP's internal loop) for non-blocking I/O.

---

# When To Use

- Self-hosted real-time features where data sovereignty or cost control is required
- High-volume WebSocket applications that would exceed Pusher plan limits
- Laravel 11+ applications where first-party integration reduces stack complexity
- Applications needing sub-50ms message delivery latency over a local network

---

# When NOT To Use

- Small applications with low connection counts — Pusher SaaS zero-ops approach is simpler
- When operations team cannot manage self-hosted processes (Supervisor, monitoring)
- When edge delivery (multi-region, global users) is required — Pusher global network is superior
- Non-PHP tech stacks — Reverb requires FrankenPHP, which is PHP-specific

---

# Best Practices

- **Set `ulimit -n` to at least `max_connections * 2 + 1000`.** Default ulimit (1024) is exhausted by even moderate WebSocket usage. *Why: Each WebSocket connection consumes a file descriptor. The OS default of 1024 is insufficient for production WebSocket servers.*
- **Always run Reverb under Supervisor.** If Reverb crashes (OOM, exception), all WebSocket connections drop with no auto-restart. *Why: Reverb is a long-lived process — without process management, a crash requires manual intervention.*
- **Share state across processes via Redis.** Without Redis pub/sub, clients on different Reverb processes cannot see each other's presence state. *Why: Each process has its own in-memory state — Redis pub/sub is required for multi-process coordination.*
- **Set Nginx `proxy_read_timeout` to 86400 seconds.** WebSocket connections idle longer than the default 60s get disconnected by Nginx. *Why: WebSocket connections are long-lived and may idle for extended periods.*
- **Monitor Reverb memory for leaks.** Memory should stabilize after initial connection load, not grow. *Why: Growing memory indicates a leak in application code or Reverb itself — early detection prevents OOM.*

---

# Architecture Guidelines

- A single Reverb process handles ~1K concurrent connections. Beyond that, use multiple processes per core.
- Reverb processes are stateless regarding channel subscriptions — state is in memory per process.
- For multi-process scaling, each Reverb process subscribes to Redis pub/sub channels. When one process receives a broadcast via HTTP, it publishes to Redis, and all other Reverb processes receive and forward to their clients.
- Reverb's Pusher protocol compatibility means Laravel's broadcasting driver treats Reverb identically to Pusher — the driver sends HTTP requests to the Reverb server.
- Reverb runs on `reverb:start` command, which boots a FrankenPHP worker that runs the `Reverb\Start` command as a long-lived process.
- Graceful shutdown via SIGTERM causes Reverb to close WebSocket connections with a 1001 (going away) status code.

---

# Performance Considerations

- Connection capacity is limited by file descriptors, memory (~50-100KB per connection), and PHP process limits.
- 10K connections require ~500MB-1GB PHP memory.
- Message delivery is sub-millisecond within the same process. Cross-process delivery adds Redis pub/sub latency (~1-5ms).
- FrankenPHP's worker mode eliminates PHP bootstrap cost — message handling is ~5-10x faster than traditional PHP.
- Open file limits must be set to at least `expected_connections * 2 + 1000`.

---

# Security Considerations

- Reverb handles WebSocket connections directly — ensure the server is behind a properly configured reverse proxy (Nginx) for SSL termination and DDoS protection.
- Channel authentication uses the same `routes/channels.php` callbacks regardless of driver — Reverb does not bypass authentication.
- WebSocket connections are long-lived — implement connection limits per user to prevent resource exhaustion.
- Reverb stores channel state in process memory — a server compromise exposes all active channel subscriptions and presence data.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not increasing open file limits | Default ulimit of 1024 | "Too many open files" errors at low connection counts | Set ulimit to at least `connections * 2 + 1000` |
| Running without Supervisor | Assuming Reverb will stay up | Extended downtime on crash with no auto-restart | Always manage Reverb via Supervisor |
| No Redis pub/sub across processes | Single process setup for >1K connections | Clients on one process can't see events from another | Add Redis and configure Reverb scaling |
| Nginx proxy_read_timeout too low | Leaving default 60s timeout | WebSocket disconnects after idle period | Set `proxy_read_timeout 86400s` |
| No SSL for WSS | Using ws:// in production | Browsers block insecure WebSocket on HTTPS pages | Terminate SSL at Nginx, configure WSS endpoint |

---

# Anti-Patterns

- **Running Reverb on the same server as PHP-FPM:** WebSocket connections consume resources that compete with HTTP request handling. Isolate Reverb to dedicated servers for production.
- **Scaling Reverb without load balancing:** Multiple processes need a load balancer that supports WebSocket upgrades (sticky sessions not required — all processes are identical).
- **Storing session-dependent data in Reverb memory:** Reverb state is per-process and lost on restart. Use Redis for any state that must survive process restart.
- **Using Reverb with shared-nothing architecture:** Reverb assumes a shared Redis backend for cross-process communication. Without it, multi-process setups are broken.

---

# Examples

```php
// Start Reverb
php artisan reverb:start

// With custom config
php artisan reverb:start --host=0.0.0.0 --port=8080 --debug

// Supervisor config for Reverb
// /etc/supervisor/conf.d/reverb.conf
[program:reverb]
command=php /var/www/artisan reverb:start
user=forge
numprocs=4
process_name=%(program_name)s_%(process_num)02d
autostart=true
autorestart=true
startretries=3
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
```

---

# Related Topics

- **K030 Broadcasting System Overview (K030)** — Context for the broadcasting stack
- **K032 Channel Types (K032)** — Auth mechanics for private/presence channels
- **K034 Reverb Production Deployment (K034)** — SSL, Nginx, production hardening
- **K035 Reverb Scaling (K035)** — Multi-process and multi-server scaling strategies

---

# AI Agent Notes

- When generating Reverb setup instructions, always include Supervisor configuration and ulimit recommendations.
- Reverb requires PHP 8.1+ and the `pcntl`, `posix`, and `socket` PHP extensions. Verify these in generated setup guides.
- For multi-server Reverb deployments, ensure all servers share the same Redis instance for cross-process coordination.
- Reverb uses the Pusher protocol — any client library that supports Pusher (including Laravel Echo) works with Reverb without modification.

---

# Verification

- [ ] Reverb process starts successfully — run `php artisan reverb:start` and verify no errors
- [ ] WebSocket connections accepted — connect via WebSocket client and verify upgrade handshake
- [ ] Broadcast events delivered — dispatch a `ShouldBroadcast` event and verify Echo callback fires
- [ ] Nginx proxy configured — verify `Upgrade` headers and `proxy_read_timeout` setting
- [ ] SSL termination working — confirm WSS connections succeed without certificate warnings
- [ ] Supervisor managing process — verify `supervisorctl status` shows Reverb as RUNNING
- [ ] ulimit increased — confirm `ulimit -n` shows appropriate value for expected connections
- [ ] Multi-process coordination — verify clients on different processes receive the same broadcast events
