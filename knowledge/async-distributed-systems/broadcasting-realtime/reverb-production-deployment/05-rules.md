# Rule Card: K034 — Reverb Production Deployment

---

## Rule 1

**Rule Name:** proxy-reverb-through-nginx

**Category:** Always

**Rule:** Always proxy Reverb through Nginx — never expose it directly.

**Reason:** Nginx handles SSL termination, load balancing, rate limiting, and connection management that Reverb should not manage directly.

**Bad Example:**
```bash
# Reverb on public port 8080 — no SSL, no rate limiting
```

**Good Example:**
```nginx
location /app {
    proxy_pass http://reverb;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

**Exceptions:** Development environments where direct Reverb access is convenient.

**Consequences Of Violation:** WebSocket connections bypass SSL termination (browsers reject ws:// on HTTPS pages), and there's no rate limiting — a connection flood can overwhelm Reverb.

---

## Rule 2

**Rule Name:** never-block-reverb-event-loop

**Category:** Never

**Rule:** Never perform blocking I/O in Reverb event handlers.

**Reason:** Reverb's event loop is single-threaded — one blocking operation freezes ALL connections.

**Bad Example:**
```php
// Inside a Reverb event handler
$response = Http::post('https://api.example.com', $data); // Blocks ALL connections
```

**Good Example:**
```php
// Offload blocking work to a queued job
dispatch(new ProcessWebhook($data)); // Returns immediately
```

**Exceptions:** None — blocking operations in event handlers are always unacceptable.

**Consequences Of Violation:** A single `sleep(1)` or synchronous HTTP call blocks ALL WebSocket connections on that process for the duration — every user experiences a 1-second freeze simultaneously.

---

## Rule 3

**Rule Name:** set-ulimit-via-supervisor-minfds

**Category:** Always

**Rule:** Always set file descriptor limits via Supervisor's `minfds` setting, not shell `ulimit`.

**Reason:** Shell-level `ulimit` doesn't affect Supervisor-managed processes.

**Bad Example:**
```bash
# Shell ulimit — not inherited by Supervisor
ulimit -n 65536
```

**Good Example:**
```ini
[program:reverb]
minfds=65536
```

**Exceptions:** None — Supervisor `minfds` is the only reliable way to set limits.

**Consequences Of ViolATION:** Supervisor-managed Reverb runs with default file descriptor limits (1024) — "too many open files" errors at low connection counts, but shell `ulimit` appears correct.

---

## Rule 4

**Rule Name:** stabilize-memory-no-leaks

**Category:** Always

**Rule:** Always monitor Reverb RSS memory — it should stabilize, not grow.

**Reason:** Growing memory indicates a leak — early detection prevents OOM crashes.

**Bad Example:**
```php
// No memory monitoring — leak undetected until OOM
```

**Good Example:**
```php
// Monitor via external tooling
$memory = memory_get_usage(true);
if ($memory > 500 * 1024 * 1024) { alert('Reverb memory high'); }
```

**Exceptions:** Short-lived Reverb processes (restarted hourly) can tolerate some memory growth.

**Consequences Of ViolATION:** A memory leak grows over hours or days — Reverb eventually hits the process memory limit and crashes, disconnecting all WebSocket clients simultaneously.
