# Standardized Knowledge: Multi-Pool Isolation Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Multi-Pool Isolation Strategies |
| Difficulty | Intermediate |
| Lifecycle | Architect, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Multi-tenant PHP-FPM deployments should use **separate pools per tenant** — each with its own `pm.max_children`, `pm.max_requests`, and `request_terminate_timeout`. This prevents one tenant's traffic spike from exhausting workers needed by other tenants. Pool isolation is the FPM equivalent of cgroups: it provides resource guarantees at the process-management level.

## Core Concepts

- **Pool configuration**: Each pool has its own `.conf` file in `/etc/php/*/fpm/pool.d/`. Separate Unix sockets, separate `pm.*` settings, separate slow logs, separate status pages.
- **Per-tenant budgeting**: `pool_1.max_children = 20`, `pool_2.max_children = 10`. Total allocated children = total server capacity / safety margin. Over-allocation defeats isolation.
- **Shared memory**: OpCache memory is shared across all pools. A tenant filling OpCache affects all other tenants. Consider separate FPM instances with separate OpCache for strong isolation.
- **Listen queue per pool**: Each pool has its own listen queue. Tenant A's queue buildup does not affect Tenant B's queue.

## When To Use

- Multi-tenant hosting environments (Plesk, cPanel, custom)
- Applications serving multiple clients with isolated resource budgets
- Environments where noisy-neighbor problems must be prevented
- Shared hosting platforms offering tiered service levels

## When NOT To Use

- Single-tenant applications (one pool is sufficient)
- When strong OpCache isolation is required (separate FPM instances needed)
- For environments where the total worker budget is very small (<10 workers total)
- When the operational complexity of managing many pools outweighs the isolation benefit

## Best Practices (WHY)

- **Always use per-tenant pools in multi-tenant environments**: A single shared pool means one tenant's traffic spike can exhaust all workers, causing downtime for all tenants.
- **Budget total workers across pools**: Sum of all pool max_children must not exceed server capacity. Over-allocation defeats isolation.
- **Consider separate FPM instances for OpCache isolation**: OpCache memory is shared across pools within one FPM instance. For strong isolation, run separate FPM instances with separate OpCache.
- **Monitor per-pool status**: Each pool has its own status page. Monitor listen queue and max_children_reached per pool.

## Architecture Guidelines

- **Tiered pricing by pool**: Basic plan pool = 5 max_children, Professional = 20, Enterprise = 50. Each pool independently constrained. No noisy-neighbor problem.
- **Separate Unix sockets**: Each pool listens on its own Unix socket. Nginx routes requests to the appropriate socket based on server_name or URL prefix.
- **Per-pool logging**: Each pool has its own slow log, access log, and error log. Troubleshooting is isolated and focused.

## Performance

- Each pool has its own worker budget — isolation prevents one tenant from consuming all workers
- Total worker budget across pools must fit within server RAM
- OpCache is shared across pools — a tenant with many unique files can evict other tenants' cached opcodes
- For strong OpCache isolation, use separate FPM instances (separate processes)

## Security

- Pool isolation prevents one tenant's traffic spike from affecting other tenants
- Separate Unix sockets with different permissions control which users can communicate with each pool
- A compromised tenant cannot exhaust workers needed by other tenants
- For strong security isolation, consider separate FPM instances or containerization

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| One pool for all tenants | Simplifying configuration | Traffic spike in one tenant exhausts all workers | Use per-tenant pools with individual budgets |
| Over-allocating total workers | Sum of max_children exceeds RAM | Server OOM kills workers from all tenants | Budget total workers = server capacity / safety margin |
| Ignoring OpCache sharing | Only considering worker isolation | One tenant's code evicts others' cached opcodes | Consider separate FPM instances for strong isolation |
| Not monitoring per-pool | Only checking aggregate | Miss individual tenant saturation | Monitor each pool's status page independently |

## Anti-Patterns

- **Single pool for all tenants**: The default configuration is a shared pool. This is acceptable for single-tenant apps but dangerous for multi-tenant environments.
- **Setting per-pool budgets without total budget**: The sum of per-pool max_children must fit within available RAM. Over-allocation defeats the purpose of isolation.
- **Assuming pool isolation includes OpCache**: OpCache is shared across pools in a single FPM instance. Worker isolation ≠ data isolation.

## Examples

```ini
; Tenant A pool — /etc/php/8.3/fpm/pool.d/tenant-a.conf
[tenant-a]
listen = /run/php/php8.3-fpm-tenant-a.sock
pm.max_children = 20
pm.max_requests = 500
request_terminate_timeout = 60s

; Tenant B pool — /etc/php/8.3/fpm/pool.d/tenant-b.conf
[tenant-b]
listen = /run/php/php8.3-fpm-tenant-b.sock
pm.max_children = 10
pm.max_requests = 1000
request_terminate_timeout = 30s
```

## Related Topics

- Pool Sizing Formula
- FPM Status Page Monitoring
- FPM Process Manager Modes
- Capacity Planning Safety Margins
- PM Max Children P95 Calculation

## AI Agent Notes

- Use per-tenant pools in multi-tenant environments to prevent noisy-neighbor problems.
- Budget total workers across pools — sum must fit within server RAM.
- OpCache is shared across pools — separate FPM instances for strong OpCache isolation.
- Each pool has independent status page, slow log, and timeout settings.
- Tiered pricing maps naturally to per-pool resource budgets.

## Verification

- [ ] Separate pool configurations per tenant
- [ ] Total worker budget calculated and within server capacity
- [ ] Each pool has its own Unix socket
- [ ] Nginx configured to route requests to the correct pool
- [ ] Per-pool status pages accessible and monitored
- [ ] Per-pool slow logs configured
- [ ] OpCache isolation strategy considered (separate FPM instances if needed)
