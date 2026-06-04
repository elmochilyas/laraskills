# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K035 — Reverb Scaling via Multiple Processes
- **Knowledge ID:** K035
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Reverb: Running Reverb (Scaling)
  - Laravel Forge Reverb documentation
  - Redis pub/sub documentation

---

# Overview

Reverb scales horizontally by running multiple independent processes, typically one per CPU core, behind a load balancer. Each process handles a subset of WebSocket connections. Inter-process communication for broadcasting and presence state is achieved via Redis pub/sub — when one process receives a broadcast event, it publishes to Redis, and all other subscribed processes receive and forward to their clients. This architecture enables near-linear scaling: doubling the processes doubles the concurrent connection capacity.

---

# Core Concepts

- **Process-per-core:** Each Reverb process is a single-threaded event loop. Optimal scaling is one process per CPU core.
- **Connection affinity:** A WebSocket client connects to one Reverb process and stays there. No connection migration.
- **Redis pub/sub:** Cross-process communication channel. Process A broadcasts to Redis → Redis fan-outs to all subscribed processes → each forwards to its clients.
- **Sticky sessions:** Load balancer must route a client's WebSocket connections to the same Reverb process (sticky sessions / IP hash).
- **Linear scaling:** Connection capacity scales linearly with process count. Broadcast message capacity scales sub-linearly due to Redis pub/sub overhead.

---

# When To Use

- Beyond ~1,000 concurrent WebSocket connections on a single server
- Multiple CPU cores available — one process per core maximizes throughput
- Horizontal scaling across multiple servers for >10K connections
- Any production Reverb deployment expected to serve more than a single process can handle

---

# When NOT To Use

- Low-traffic applications (<1K connections) — single process is simpler and avoids Redis dependency
- Single-core servers — no benefit from multiple processes
- Development environments — scaling adds unnecessary complexity
- When Redis is not available or cannot be added to the infrastructure

---

# Best Practices

- **Match `numprocs` to CPU cores.** Each process is single-threaded. More processes than cores causes context switching overhead without throughput gain. *Why: Reverb processes compete for CPU time — over-provisioning adds scheduling overhead without connection capacity improvement.*
- **Configure sticky sessions on the load balancer.** Without stickiness, clients randomly reconnect to different processes on each page load, fragmenting presence state. *Why: WebSocket connections are stateful at the process level — presence data and channel subscriptions live in process memory.*
- **Monitor Redis pub/sub throughput separately from other Redis usage.** Redis pub/sub performance degrades with many subscribers (O(n) per message). *Why: Each broadcast message is delivered to ALL processes — at scale, Redis pub/sub becomes the bottleneck.*
- **Use a dedicated Redis instance for Reverb if possible.** Queue operations on the same Redis compete for CPU and connections with Reverb pub/sub. *Why: Queue operations (BLPOP, BRPOPLPUSH) can block and delay pub/sub message delivery.*
- **Implement health checks on the Reverb process, not just TCP port.** The TCP port may be open while the event loop is frozen. *Why: A frozen event loop accepts TCP connections but never processes messages.*

---

# Architecture Guidelines

- Process-per-core: 4-core server → 4 Reverb processes. Each handles ~1K-2K connections.
- Redis pub/sub is fire-and-forget — if a process is disconnected from Redis briefly, it misses messages. There is no message replay.
- Connection affinity means idle connections still occupy a process slot. Connection distribution may become uneven with sticky sessions.
- For multi-server scaling: each server runs its Reverb processes, all sharing the same Redis pub/sub channels.
- Graceful scaling: to reduce processes, stop Reverb gradually. Clients reconnect to remaining processes.

---

# Performance Considerations

- Each Redis pub/sub message is delivered to ALL processes. At 100 processes and 10K messages/sec, Redis handles 1M message deliveries/sec.
- Connection distribution may be uneven with sticky sessions (IP hash). Monitor per-process connection counts.
- Memory per-process scales with connections. A 4-server setup with 2K connections each uses less per-server memory than 1 server with 8K connections.
- Redis pub/sub latency adds ~1-5ms to cross-process message delivery.
- Process restart causes all connections on that process to drop. Clients reconnect to another process.

---

# Security Considerations

- Redis pub/sub channels used by Reverb (`reverb:message`, `reverb:presence`) should be protected with Redis authentication and network isolation.
- Load balancer health check endpoints should not expose internal Reverb state.
- Sticky session cookies may leak information about internal server topology. Use IP hash for simpler security model.
- Multi-server deployments require secure Redis communication — use Redis TLS or trusted network segments.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No sticky sessions | Load balancer without session affinity | Presence state fragmented — online users inconsistent | Configure IP hash or cookie-based stickiness |
| More processes than CPU cores | Setting `numprocs` too high | Context switching overhead without throughput gain | Set `numprocs` = CPU core count |
| Not monitoring Redis pub/sub | Ignoring Redis throughput | Redis becomes bottleneck at scale — message delivery delayed | Monitor Redis CPU and pub/sub message rate |
| Assuming durable messages | Expecting Redis pub/sub to replay missed messages | Process briefly disconnected = missed broadcasts permanently | Design clients to handle missed events gracefully |
| Shared Redis without monitoring | Queue and Reverb on same Redis | Queue operations delay pub/sub delivery | Use dedicated Redis or monitor carefully |

---

# Anti-Patterns

- **Scaling Reverb without Redis:** Multiple processes without Redis pub/sub — clients on different processes never see each other's events or presence state.
- **Over-provisioning processes:** Running 16 processes on a 4-core server. Creates contention and reduces per-process throughput.
- **Ignoring connection distribution imbalance:** Some processes handle 5K connections while others handle 500. Uneven resource utilization.
- **No health checks on Reverb:** Load balancer continues routing to a frozen or crashed process.

---

# Examples

```ini
# Supervisor multi-process scaling (4-core server)
[program:reverb]
command=php /var/www/html/artisan reverb:start
user=forge
numprocs=4
process_name=%(program_name)s_%(process_num)02d
autostart=true
autorestart=true
minfds=65536
```

```nginx
# Nginx load balancing with IP hash stickiness
upstream reverb {
    ip_hash;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
    server 127.0.0.1:8084;
}

server {
    listen 443 ssl;
    server_name ws.example.com;

    location /app {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }
}
```

```php
// Reverb config for multi-process (config/reverb.php)
'apps' => [
    [
        'app_id' => env('REVERB_APP_ID'),
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'allowed_origins' => ['*'],
        'ping_interval' => 30,
        'max_connections' => 2000,
    ],
],
'scaling' => [
    'enabled' => true,
    'channel' => 'reverb',
    'server' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'password' => env('REDIS_PASSWORD'),
        'database' => env('REDIS_DB', 0),
    ],
],
```

---

# Related Topics

- **K031 Laravel Reverb (K031)** — Core Reverb architecture and single-process configuration
- **K034 Reverb Production Deployment (K034)** — Baseline production setup (SSL, Nginx, ulimit)

---

# AI Agent Notes

- When generating multi-process Reverb config, always include Redis pub/sub configuration in `reverb.php`. Processes cannot coordinate without it.
- Generate Supervisor `numprocs` matching the target server's CPU count. Default to 4 for standard cloud instances.
- Load balancer configuration must include sticky sessions (IP hash or cookie-based). Without it, multi-process Reverb has inconsistent presence state.
- Redis pub/sub is fire-and-forget — no message persistence. Document this limitation when generating scaling guides.

---

# Verification

- [ ] Multi-process Reverb starts successfully — verify all `numprocs` processes are running
- [ ] Redis pub/sub configured — verify Reverb subscribes to `reverb:message` and `reverb:presence` channels
- [ ] Load balancer sticky sessions — verify client consistently routes to same process
- [ ] Cross-process broadcast works — verify client on process A receives event from client on process B
- [ ] Process crash handling — verify clients reconnect to another process on crash
- [ ] Connection distribution even — verify each process handles roughly equal connections
- [ ] Redis pub/sub throughput monitored — verify no bottleneck at expected message volume
- [ ] Process-per-core ratio — verify `numprocs` <= CPU cores (not over-provisioned)
