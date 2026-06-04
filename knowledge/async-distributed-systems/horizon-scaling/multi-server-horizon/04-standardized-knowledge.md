# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K049 — Multi-Server Horizon Deployment
- **Knowledge ID:** K049
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Multi-Server Deployment
  - Laravel Source — `Laravel\Horizon\MasterSupervisor`

---

# Overview

Horizon supports deployment across multiple servers without additional configuration — each server runs its own Horizon master process, all sharing the same Redis backend. Horizon uses Redis to coordinate: job locking ensures no job is processed twice, supervisor states are tracked independently per server, and metrics/statistics aggregate across all servers in the shared Redis. This enables linear scaling of worker capacity by adding servers.

---

# Core Concepts

- **No coordination protocol:** Horizon doesn't use leader-election. Each server is independent. Redis provides shared state.
- **Job locks:** Redis atomic operations prevent double-processing across servers.
- **Independent supervisors:** Each server runs its own supervisors. No direct cross-server communication.
- **Shared metrics:** All servers write metrics to same Redis. Dashboard aggregates across all servers.
- **Server-specific termination:** `horizon:terminate` on server A only terminates Horizon on server A.

---

# When To Use

- Scaling worker capacity beyond a single server's resource limits
- High-availability requirement — one server failure doesn't stop job processing
- Elastic auto-scaling groups adding/removing servers based on queue depth
- Heterogeneous workloads requiring specialized server configurations

---

# When NOT To Use

- Single-server deployments adequate for current and near-future throughput
- When Redis cannot handle the connection load from multiple servers
- Simple applications where `queue:work` with Supervisor is sufficient

---

# Best Practices

- **Use symmetric supervisor config by default.** All servers run the same `config/horizon.php`. *Why: Any server can replace any other — simplifies deployment, monitoring, and capacity management.*
- **Monitor global Redis connection count.** 5 servers × 50 workers = 250 connections — ensure `maxclients` is set appropriately. *Why: Redis has a connection limit — adding servers multiplies connection count, potentially exhausting Redis resources.*
- **Run `horizon:terminate` in deployment scripts across ALL servers.** Deployments require rolling restarts — no global restart command exists. *Why: Without termination, servers run old code. A rolling restart pattern ensures zero-downtime code updates.*
- **Use per-server `minProcesses`/`maxProcesses` tuning for asymmetric hardware.** Larger servers can handle more workers. *Why: Identical process counts on different-sized servers waste capacity on large servers or overload small ones.*

---

# Architecture Guidelines

- Each server reads `config/horizon.php`, creates supervisors and workers. No server discovers others.
- Redis `BRPOP` ensures each job goes to exactly one worker — no duplication.
- Unique jobs use Redis `SETNX` locks — cross-server locking prevents double-processing.
- Dashboard shows combined metrics from all servers. Supervisor list shows all supervisors across all servers.
- No global orchestrator exists — each server is a standalone Horizon instance sharing Redis.

---

# Performance Considerations

- Each server adds N workers × 1 Redis connection each + Horizon master connection.
- 5 servers × 20 workers = 100 workers + 5 masters = 105 Redis connections.
- Redis `BRPOP` scales well across servers — concurrent blocking pops are handled efficiently.
- Unique job locking across servers adds ~1ms per unique job dispatch.
- Metrics writes increase linearly with server count — all servers write to the same Redis keys.

---

# Security Considerations

- All servers share the same Redis credentials — ensure Redis is network-isolated and requires authentication.
- A compromised server can read/modify all queue data through the shared Redis connection.
- Multi-server Horizon does not encrypt inter-server communication — all coordination goes through Redis.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming cross-server balancing | Auto balancer is per-server | Both servers may scale up simultaneously, over-allocating | Monitor per-server worker counts globally |
| Not monitoring global connection count | Ignoring Redis maxclients | New connections rejected, Horizon fails to start | Monitor connections across all servers |
| Different config per server | Config drift | Some queues not processed on some servers | CI/CD for config across all servers |
| Skipping horizon:terminate on deploy | Only terminating on one server | Other servers run old code | Rolling restart pattern |

---

# Anti-Patterns

- **No capacity monitoring after server failure:** Server A crashes, Server B continues. No alert that capacity dropped by 50%.
- **Asymmetric config without documentation:** Different servers run different queue configs — when one fails, its queues stop processing silently.
- **Single Redis connection pool exhaustion:** All servers creating connections without accounting for Redis `maxclients`.

---

# Examples

```php
// config/horizon.php — symmetric config for multi-server
'production' => [
    'supervisor-default' => [
        'connection' => 'redis',
        'queue' => ['default', 'webhooks', 'emails'],
        'balance' => 'auto',
        'minProcesses' => 2,
        'maxProcesses' => 10,
        'tries' => 3,
        'timeout' => 60,
    ],
],
```

---

# Related Topics

- **K041 Horizon Supervisor Configuration (K041)** — Supervisor config basis
- **K042 Auto Balancing (K042)** — Per-server balancing behavior

---

# AI Agent Notes

- When generating multi-server Horizon docs, emphasize that auto-balancing is per-server — no global load balancing across servers.
- Symmetric config is the recommended default — asymmetric config should only be used with clear documentation.
- `horizon:terminate` must be run on each server individually during deployments.

---

# Verification

- [ ] Multiple servers process jobs from same queue without duplication — verify no double-processing
- [ ] Dashboard shows combined metrics from all servers — verify supervisor list includes all servers
- [ ] Server failure doesn't stop processing — verify other servers continue while one is down
- [ ] `horizon:terminate` on one server doesn't affect others — verify other servers continue processing
