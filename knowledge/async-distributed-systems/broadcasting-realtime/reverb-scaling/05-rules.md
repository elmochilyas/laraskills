# Rule Card: K035 — Reverb Scaling

---

## Rule 1

**Rule Name:** scale-reverb-via-process-count

**Category:** Prefer

**Rule:** Prefer increasing Reverb process count over vertical scaling.

**Reason:** Reverb's event loop is single-threaded — more CPU cores require more processes.

**Bad Example:**
```ini
# Single process — one CPU core utilized
[program:reverb]
numprocs=1
```

**Good Example:**
```ini
# One process per CPU core
[program:reverb:01-{N})
numprocs=4
```

**Exceptions:** A single powerful server with many connections may benefit from vertical scaling first.

**Consequences Of Violation:** Most CPU cores sit idle while one core is saturated — concurrent connection capacity is artificially capped.

---

## Rule 2

**Rule Name:** reduce-reserved-listener-memory

**Category:** Prefer

**Rule:** Prefer reducing reserved list memory in `reverb.php` when scaling horizontally.

**Reason:** Each reserved list per channel consumes memory — under horizontal scaling, many processes duplicate these lists.

**Bad Example:**
```php
'reserved_list_memory' => 10000, // Allocated per process
```

**Good Example:**
```php
'reserved_list_memory' => 2000, // Sufficient with good scaling
```

**Exceptions:** Channels with thousands of concurrent subscribers need larger reserved lists.

**Consequences Of ViolATION:** Each process wastes memory on oversized reserved lists — when running 16 processes, total memory overhead grows unnecessarily, increasing cloud costs.

---

## Rule 3

**Rule Name:** enable-redis-pubsub-for-multi-process

**Category:** Always

**Rule:** Always enable Redis pub/sub when running multiple Reverb processes.

**Reason:** Without pub/sub, each process has an isolated state — clients on different processes can't discover each other.

**Bad Example:**
```php
// No pub/sub — state isolated per process
```

**Good Example:**
```php
'scaling' => [
    'enabled' => true,
    'channel' => 'reverb-app', // Shared key prefix
    'server' => ['host' => env('REDIS_HOST')],
],
```

**Exceptions:** Single-process deployments don't need pub/sub.

**Consequences Of Violation:** A client on process A broadcasts to a presence channel — clients on process B never see the event. Channel connection counts are per-process, not global.

---

## Rule 4

**Rule Name:** load-balance-with-sticky-session-less

**Category:** Prefer

**Rule:** Prefer using Redis pub/sub to avoid sticky sessions in load balancers.

**Reason:** Sticky sessions couple a user to a specific server — scaling down or server failure drops all their connections.

**Bad Example:**
```nginx
# Sticky session required — state is per-process
```

**Good Example:**
```nginx
# No sticky session needed — Redis pub/sub shares state
upstream reverb {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
```

**Exceptions:** Minimal two-server deployments where sticky sessions are acceptable.

**Consequences Of Violation:** Load balancer restarts drop all sticky session assignments — thousands of WebSocket connections reconnect simultaneously, causing a thundering herd on Reverb processes.
