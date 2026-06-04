# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Broadcasting & Real-Time
- **Knowledge Unit:** K034 — Reverb Production Deployment
- **Knowledge ID:** K034
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Reverb: Running Reverb
  - Laravel Forge documentation
  - FrankenPHP deployment guide

---

# Overview

Deploying Reverb to production requires specific infrastructure configuration beyond typical Laravel applications. Key concerns: SSL termination (WSS requires valid certificate), Nginx proxying (WebSocket upgrade headers, long timeouts), operating system limits (open file descriptors for WebSocket connections), event loop health (no blocking I/O in the Reverb process), and process management (Supervisor for auto-restart). Misconfiguration in any of these areas causes silent connection failures, unexpected disconnections, or inability to scale.

---

# Core Concepts

- **WSS:** WebSocket Secure — WebSocket over TLS. Required for secure connections from browsers.
- **Nginx WebSocket proxy:** Nginx must forward `Upgrade` and `Connection` headers to the Reverb backend.
- **`proxy_read_timeout`:** Nginx setting for how long to keep the connection open. Must be set to hours for WebSockets.
- **Open file descriptors (`ulimit -n`):** Each WebSocket connection uses a file descriptor. Default ulimit (1024) is insufficient.
- **Event loop:** Reverb's PHP event loop must handle I/O without blocking. Synchronous calls (HTTP requests, DB queries) block all other connections.
- **Supervisor process management:** `numprocs` > 1 enables multi-process Reverb.

---

# When To Use

- Deploying Reverb to any production environment with WebSocket connections
- Self-hosted WebSocket infrastructure requiring SSL/WSS support
- Multi-process or multi-server Reverb deployments
- Any environment where Reverb must be managed as a production service

---

# When NOT To Use

- Development environments — the default Reverb setup without Nginx or SSL is sufficient
- Environments already using Pusher SaaS — no self-hosted deployment needed
- Serverless environments (Vapor, Lambda) — Reverb requires a persistent process

---

# Best Practices

- **Always proxy Reverb through Nginx.** Direct Reverb exposure misses SSL termination, load balancing, and rate limiting. *Why: Nginx handles SSL certificates, connection management, and provides a single ingress point. Reverb should not handle TLS directly.*
- **Set `proxy_read_timeout` to 86400 seconds.** Default 60s causes WebSocket disconnects every 60 seconds. *Why: WebSocket connections may idle for extended periods — Nginx must not close them prematurely.*
- **Set `ulimit -n` via Supervisor's `minfds` setting.** Setting it in the shell doesn't affect Supervisor-managed processes. *Why: Each WebSocket connection consumes a file descriptor — the OS default of 1024 is exhausted by even moderate connection counts.*
- **Never block the event loop.** Avoid `sleep()`, synchronous HTTP calls, or DB queries in Reverb event handlers. *Why: Reverb's event loop is single-threaded — one blocking operation freezes ALL connections.*
- **Monitor Reverb RSS memory.** It should stabilize after initial connection load. Growth indicates a memory leak. *Why: A memory leak in Reverb causes OOM kill and mass disconnection.*

---

# Architecture Guidelines

- Nginx performs SSL termination, WebSocket upgrade header forwarding, and load balancing. Reverb receives HTTP from Nginx.
- Open file limits affect both Nginx and Reverb. Nginx needs `worker_connections >= max_expected_connections`. Reverb needs equivalent `ulimit`.
- The event loop is shared across all connections on one Reverb process. Blocking operations in any connection's handler freeze all connections.
- Supervisor configuration: `numprocs` matches CPU cores, `minfds` sets file descriptor limit, `autorestart=true` ensures recovery.
- Using Unix sockets instead of TCP for single-server deployments avoids TCP overhead.

---

# Performance Considerations

- Each WebSocket connection uses ~50-100KB PHP memory. 10K connections = ~500MB-1GB memory.
- Nginx proxy adds ~1ms latency per message — acceptable for most use cases.
- A single `sleep(1)` in a request handler blocks ALL Reverb connections on that process for 1 second.
- CPU per message: ~0.01ms for delivery. 10K messages/second ≈ 100% of one CPU core.
- Nginx `worker_connections` must be set to at least the expected concurrent connection count.

---

# Security Considerations

- SSL termination at Nginx is mandatory for production — browsers reject insecure WebSocket on HTTPS pages.
- WebSocket connections bypass typical HTTP middleware — implement authentication at the application level in channel auth callbacks.
- Rate limiting at Nginx level prevents connection flood attacks on the Reverb process.
- Monitor for connection exhaustion attacks — a malicious client can open many WebSocket connections and exhaust the file descriptor limit.
- Reverb's internal HTTP endpoint should not be exposed to the public internet — always proxy through Nginx.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not increasing Nginx `worker_connections` | Nginx default 512 too low | Nginx rejects new WebSocket connections under load | Set `worker_connections` to expected concurrent connections |
| Not configuring `proxy_read_timeout` | Leaving default 60s | WebSocket disconnects every 60 seconds of idle | Set `proxy_read_timeout 86400s` |
| Blocking the event loop | `sleep()`, HTTP calls, DB queries in handlers | All connections freeze during blocking operation | Use non-blocking alternatives or offload to queue |
| Running without process monitoring | No Supervisor or systemd | Crash = all connections dropped permanently | Always use Supervisor with `autorestart=true` |
| ulimit set in shell only | `ulimit -n` in shell doesn't affect Supervisor | Supervisor-managed Reverb hits file limit | Set `minfds=65536` in Supervisor config |

---

# Anti-Patterns

- **Direct Reverb exposure to internet:** Running Reverb on a public port without Nginx proxy. Loses SSL termination, rate limiting, and DDoS protection.
- **Running Reverb alongside PHP-FPM on overloaded server:** Competing for CPU and memory with HTTP request handling. Use dedicated servers for high-traffic Reverb.
- **Using `sleep()` or infinite loops in event handlers:** Freezes the event loop, disconnecting all clients.
- **Ignoring file descriptor limits:** Assuming default ulimit works for production. Always configure limits explicitly.

---

# Examples

```nginx
# Nginx WebSocket proxy configuration
upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl;
    server_name ws.example.com;

    ssl_certificate /etc/ssl/certs/example.com.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    location /app {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

```ini
# Supervisor configuration for Reverb
[program:reverb]
command=php /var/www/html/artisan reverb:start
user=forge
numprocs=4
process_name=%(program_name)s_%(process_num)02d
autostart=true
autorestart=true
startretries=3
minfds=65536
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
```

---

# Related Topics

- **K031 Laravel Reverb (K031)** — Core Reverb architecture
- **K035 Reverb Scaling (K035)** — Multi-process and multi-server scaling
- **K030 Broadcasting System Overview (K030)** — Broadcasting system context

---

# AI Agent Notes

- When generating Reverb deployment guides, always include: Nginx proxy config with WebSocket headers, SSL certificate setup, Supervisor config with `minfds`, and ulimit recommendations.
- The Nginx `proxy_read_timeout` must be in seconds and should be 86400 for production. Generating less than 3600 will cause idle disconnects.
- Supervisor `minfds` is the correct way to raise file descriptor limits for managed processes. Shell-level `ulimit` is not inherited.
- Never generate code that does blocking I/O inside Reverb event handlers — this is a critical anti-pattern.

---

# Verification

- [ ] Nginx WebSocket proxy configured — verify `Upgrade` and `Connection` headers forwarded
- [ ] `proxy_read_timeout` set to 86400 — confirm no premature disconnects after idle period
- [ ] SSL certificate valid — verify WSS connections succeed without certificate warnings
- [ ] Supervisor configures `minfds` — verify `ulimit -n` for Reverb process shows correct value
- [ ] No blocking I/O in event handlers — audit code for `sleep()`, synchronous HTTP, DB queries
- [ ] Memory stabilizes — monitor RSS over 24h, confirm no growth trend
- [ ] Nginx `worker_connections` sufficient — verify against expected concurrent connection count
- [ ] Reverb process auto-restarts on crash — test by killing process, verify Supervisor restarts
