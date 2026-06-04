# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Multi-Server Horizon Deployment
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Horizon supports deployment across multiple servers without additional configuration — each server runs its own Horizon master process, all sharing the same Redis backend. Horizon uses Redis to coordinate: job locking ensures no job is processed twice, supervisor states are tracked independently per server, and metrics/statistics aggregate across all servers in the shared Redis. This enables linear scaling of worker capacity by adding servers, but requires careful management of supervisor config consistency and Redis capacity.

# Core Concepts
- **No coordination protocol**: Horizon doesn't use a leader-election protocol. Each server is independent. Redis provides the shared state.
- **Job locks**: Redis atomic operations (e.g., `SETNX` for unique jobs) prevent double-processing across servers.
- **Independent supervisors**: Each server runs its own set of supervisors defined in `config/horizon.php`. Supervisors on different servers don't communicate directly.
- **Shared metrics**: All servers write metrics to the same Redis. The dashboard aggregates across all servers.
- **Server-specific termination**: `horizon:terminate` on server A only terminates Horizon on server A. Other servers continue unaffected.

# Mental Models
- **Multiple kitchens, one menu**: Each server is a kitchen with its own chefs (workers). They all cook from the same menu (config/horizon.php). Orders (jobs) come from a shared ticket system (Redis). No kitchen knows about the others.
- **Horizontal scaling**: Like adding more checkout lanes at a supermarket. Each lane has its own cashier (worker), but they share the same line of customers (queue). More lanes = more throughput.

# Internal Mechanics
- Server A runs `horizon:start`. It reads `config/horizon.php`, creates supervisors and workers.
- Server B runs `horizon:start`. Same config, same Redis. Creates its own supervisors and workers.
- When both servers process jobs from the same queue, Redis's `BRPOP` ensures each job goes to exactly one worker (no duplication).
- For unique jobs: Redis `SETNX` lock prevents the same unique job from being reserved by both servers.
- The dashboard shows combined metrics from all servers. Supervisor list shows all supervisors across all servers.
- When server A's `horizon:terminate` runs, only server A's processes stop. Server B continues.
- There is NO global orchestrator. Servers don't discover each other. Each is a standalone Horizon instance sharing Redis.

# Patterns
## Symmetric Supervisor Config
- **Purpose**: All servers run the same `config/horizon.php`.
- **Benefit**: Simple, predictable, any server can replace any other.
- **Tradeoff**: Each server's worker pool is identical. May not match heterogeneous hardware.

## Asymmetric Supervisor Config (Specialized Servers)
- **Purpose**: Different servers handle different queue types.
- **Benefit**: Server A handles webhooks, Server B handles emails. Optimized per workload.
- **Tradeoff**: Complexity; failure of a specialized server affects only that workload.

## Elastic Scaling with Auto-Scaling Group
- **Purpose**: Add/remove servers based on queue depth.
- **Benefit**: Automated capacity management.
- **Tradeoff**: Server startup time (minutes) > worker scaling (seconds). Warm-up period for Redis connections.

# Architectural Decisions
- **Use symmetric config by default**: Simpler to manage. Any server can be terminated without capacity loss for any queue.
- **Use per-server `minProcesses` tuning**: If servers have different resources (e.g., 4-core vs 16-core), adjust `maxProcesses` per server.
- **Run `horizon:terminate` in deployment scripts across all servers**: Deployments require rolling restarts. No global restart command.
- **Shared Redis must handle all servers**: Monitor Redis connection count, memory, CPU. Multi-server Horizon multiplies Redis load.

# Tradeoffs
Symmetric config | Simple, predictable, interchangeable | Wastes resources if servers have different capacity
Asymmetric config | Optimized per workload | Complexity; single point of failure per queue type
Elastic ASG | Auto-scaling, cost-effective | Startup lag; warm-up time before capacity available

# Performance Considerations
- Each server adds: N workers × 1 Redis connection each + Horizon master Redis connection.
- At 5 servers × 20 workers = 100 workers + 5 masters = 105 Redis connections.
- Redis `BRPOP` scales well across servers — Redis handles concurrent blocking pops efficiently.
- Unique job locking uses Redis `SETNX` — cross-server locking adds ~1ms per unique job dispatch.
- Metrics aggregation: all servers write to same Redis keys. At high server count, Redis write load increases linearly.

# Production Considerations
- Ensure all servers use the same Redis credentials and host.
- `config/horizon.php` must be identical across all servers (for symmetric config). Use a shared config deployment (CI/CD across all servers).
- Monitor per-server worker counts and memory. One server with a memory leak can consume more than its share, but doesn't affect other servers.
- Rolling restart: terminate Horizon on server A, wait for workers to finish, deploy, restart. Repeat for each server.
- When adding a new server, workers don't start processing until Horizon starts and connects to Redis. There's a brief initialization period.
- `APP_ENV` must match across all servers. A server with a different `APP_ENV` runs different supervisor config.

# Common Mistakes
- **Assuming cross-server balancing**: The auto balancer operates per-server. Server A's auto balancer doesn't know about Server B's workload. Both may scale up simultaneously, over-allocating workers.
- **Not monitoring global connection count**: 5 servers × 50 workers = 250 Redis connections. Redis connection limit (`maxclients`) must accommodate this.
- **Different config/horizon.php across servers**: One server may not process certain queues that others do, leading to uneven load.
- **Not terminating Horizon during deploy**: A deploy on server A without `horizon:terminate` means server A runs old code while server B runs new code (if config changed).
- **Forgetting to update config on all servers**: If queue names change in config, some servers may reference stale queue names.

# Failure Modes
- **Redis becomes bottleneck**: All servers share the same Redis. Under high job volume, Redis CPU or memory contention affects all servers.
- **Split-brain without impact**: Since servers don't coordinate, there's no "split brain" in the traditional sense. A network partition between servers doesn't cause double-processing — each server independently reads from Redis.
- **Server failure silently reduces capacity**: Server A crashes. Server B continues. No automatic alert that capacity dropped by 50%.
- **Config mismatch leads to job starvation**: Server A has email queue enabled, Server B doesn't. Server A goes down, email processing stops — Server B can't pick up because it's not configured for it.
- **Redis connection limit reached**: Too many workers/connections exhaust `maxclients`. New connections rejected. Horizon servers fail to start.

# Ecosystem Usage
- **Laravel Horizon**: Multi-server support is built-in and automatic. No additional packages needed.
- **Laravel Forge**: Forge supports multi-server Horizon via its server provisioning. Each server runs Horizon independently.
- **Spatie packages**: Not affected, but multi-server Horizon with high webhook volume is a common production pattern.

# Related Knowledge Units
- K041 Horizon Supervisor Configuration | K042 Auto Balancing (per-server)

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
