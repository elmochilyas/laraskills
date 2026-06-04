# Rule Card: K049 — Multi-Server Horizon Deployment

---

## Rule 1

**Rule Name:** use-symmetric-config-across-servers

**Category:** Prefer

**Rule:** Prefer using the same supervisor config on all servers.

**Reason:** Any server can replace any other — simplifies deployment, monitoring, and capacity management.

**Bad Example:**
```php
// Server A: processes webhooks and emails
// Server B: processes emails and reports
// Server A goes down — reports never process
```

**Good Example:**
```php
// Identical config on all servers
config/horizon.php same across all servers
```

**Exceptions:** Heterogeneous hardware (different RAM/CPU per server) may need per-server tuning.

**Consequences Of ViolATION:** Server A (webhooks + emails) crashes — emails still process on Server B, but webhooks stop completely. The ops team doesn't notice because Server A appears in the dashboard as "offline" but no alert fires.

---

## Rule 2

**Rule Name:** monitor-global-redis-connections

**Category:** Always

**Rule:** Always monitor the total Redis connection count from all Horizon servers.

**Reason:** Each worker needs a Redis connection — adding servers multiplies total connections.

**Bad Example:**
```php
// 5 servers × 20 workers + 5 masters = 105 connections
// Redis maxclients = 100 — some connections rejected
```

**Good Example:**
```php
// Budget connections:
// 3 servers × 15 workers = 45 + 3 master = 48 connections
// Set Redis maxclients to 80 (48 + headroom)
```

**Exceptions:** Development environments with few workers.

**Consequences Of ViolATION:** The 5th server's Horizon master starts, using 80 of 100 connections. When workers try to connect, Redis rejects them — the server's workers start failing, but only half of capacity is available.

---

## Rule 3

**Rule Name:** rolling-restart-all-servers

**Category:** Always

**Rule:** Always run `horizon:terminate` across ALL servers during deployments.

**Reason:** No global restart command exists — only the terminated server restarts with new code.

**Bad Example:**
```bash
# Deploy script — terminates only one server
ssh server-a "php artisan horizon:terminate"
```

**Good Example:**
```bash
# Rolling restart across all servers
for server in server-a server-b server-c; do
    ssh "$server" "php artisan horizon:terminate"
    sleep 10  # Wait for restart
done
```

**Exceptions:** Blue-green deployments where entire server groups are replaced.

**Consequences Of ViolATION:** Only Server A is terminated — it restarts with new code. Server B and C continue running old code. Some jobs run the old logic, some run the new logic — inconsistent behavior and hard-to-debug side effects.

---

## Rule 4

**Rule Name:** expect-per-server-auto-balancing

**Category:** Always

**Rule:** Always expect each server's auto-balancer to operate independently.

**Reason:** Auto-balancing is per-server, not global — both servers may scale up simultaneously.

**Bad Example:**
```php
// Expecting global balancing across servers
// Both servers scale up to maxProcesses for the same queue
```

**Good Example:**
```php
// Design for independent balancing
// Each server balances its own queues — total workers = sum of all servers
```

**Exceptions:** None — Horizon has no cross-server load balancing.

**Consequences Of ViolATION:** A webhook burst hits both servers simultaneously — both auto-balancers detect high wait time and scale to maxProcesses. Total workers = 2× maxProcesses, potentially exhausting server resources or overwhelming downstream APIs.
