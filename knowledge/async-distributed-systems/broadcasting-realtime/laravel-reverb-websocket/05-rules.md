# Rule Card: K031 — Laravel Reverb WebSocket Server

---

## Rule 1

**Rule Name:** set-ulimit-for-websockets

**Category:** Always

**Rule:** Always set `ulimit -n` to at least `max_connections * 2 + 1000`.

**Reason:** Each WebSocket connection consumes a file descriptor — the OS default of 1024 is insufficient for production.

**Bad Example:**
```bash
# Default ulimit 1024 — exhausted at 512 connections
```

**Good Example:**
```ini
# Supervisor config
[program:reverb]
minfds=65536
```

**Exceptions:** Development environments with few test connections don't need high ulimits.

**Consequences Of Violation:** "Too many open files" errors at moderate connection counts — WebSocket connections are silently rejected.

---

## Rule 2

**Rule Name:** manage-reverb-under-supervisor

**Category:** Always

**Rule:** Always run Reverb under Supervisor for process management.

**Reason:** Reverb is a long-lived process — without process management, a crash requires manual intervention.

**Bad Example:**
```bash
php artisan reverb:start & # No auto-restart on crash
```

**Good Example:**
```ini
[program:reverb]
command=php artisan reverb:start
autostart=true
autorestart=true
```

**Exceptions:** Development environments where manual restart is acceptable.

**Consequences Of Violation:** Reverb crashes (OOM, exception) — all WebSocket connections drop and stay dropped until an operator manually restarts the process.

---

## Rule 3

**Rule Name:** share-state-via-redis-multiprocess

**Category:** Always

**Rule:** Always configure Redis pub/sub for multi-process Reverb deployments.

**Reason:** Each process has its own in-memory state — without Redis, clients on different processes can't see each other's events.

**Bad Example:**
```php
// No Redis pub/sub — processes can't coordinate
```

**Good Example:**
```php
// config/reverb.php
'scaling' => [
    'enabled' => true,
    'channel' => 'reverb',
    'server' => ['host' => env('REDIS_HOST')],
],
```

**Exceptions:** Single-process Reverb deployments don't need Redis pub/sub.

**Consequences Of Violation:** A client connected to process A broadcasts an event — clients on process B never receive it. Presence channels show incomplete user lists.

---

## Rule 4

**Rule Name:** increase-nginx-proxy-read-timeout

**Category:** Always

**Rule:** Always set Nginx `proxy_read_timeout` to 86400 seconds for WebSocket connections.

**Reason:** WebSocket connections may idle for extended periods — Nginx default 60s disconnects them prematurely.

**Bad Example:**
```nginx
proxy_read_timeout 60s; # WebSocket drops after 60 seconds idle
```

**Good Example:**
```nginx
proxy_read_timeout 86400s; # 24 hours — no premature disconnect
```

**Exceptions:** None — WebSocket timeouts must be measured in hours, not minutes.

**Consequences Of Violation:** Users experience random disconnections after 60 seconds of inactivity — typing a long message results in WebSocket closure mid-send.
