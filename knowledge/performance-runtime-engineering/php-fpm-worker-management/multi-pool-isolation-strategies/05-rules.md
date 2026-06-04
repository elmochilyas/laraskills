## Use per-tenant pools in multi-tenant environments
---
Category: Architecture
---
Configure separate PHP-FPM pools per tenant in multi-tenant deployments. Never share one pool across tenants.
---
Reason: A single shared pool allows one tenant's traffic spike to exhaust all workers, causing downtime for all tenants. Per-tenant pools enforce individual resource budgets, preventing noisy-neighbor problems.
---
Bad Example:
```ini
; One pool for all tenants — dangerous
[www]
pm.max_children = 50
```

Good Example:
```ini
; Per-tenant pools
[tenant-a]
pm.max_children = 20

[tenant-b]
pm.max_children = 10
```
---
Exceptions: Single-tenant applications where isolation is unnecessary.
---
Consequences Of Violation: One tenant's traffic spike causes OOM or queue buildup for all tenants.

## Budget total workers across pools — never over-allocate
---
Category: Configuration
---
Ensure the sum of all per-pool max_children values does not exceed server capacity divided by the safety factor.
---
Reason: Per-pool budgets that sum to more than available RAM defeat the purpose of isolation. When all pools reach peak usage simultaneously, the server OOM-kills processes from all pools, not just the overloaded one.
---
Bad Example:
```ini
; Over-allocated — 50 workers total, RAM supports 30
[tenant-a] pm.max_children = 25
[tenant-b] pm.max_children = 25
```

Good Example:
```bash
# Available: 10GB for FPM after OS/DB/Redis
# P95 RSS: 95MB, safety factor: 1.2
# Total capacity: 10240 / (95 * 1.2) = 89
# Allocate: tenant-a=50, tenant-b=39
```
---
Exceptions: Environments where simultaneous peak usage across all pools is impossible (staggered traffic patterns).
---
Consequences Of Violation: OOM kills across all tenants when multiple pools peak simultaneously.

## Consider separate FPM instances for strong OpCache isolation
---
Category: Architecture
---
Run separate FPM instances with separate OpCache configurations when tenants must not affect each other's cached opcodes.
---
Reason: OpCache memory is shared across all pools within a single FPM instance. One tenant's code can evict another tenant's cached opcodes. Separate FPM instances provide complete OpCache isolation.
---
Bad Example:
```ini
; Same FPM instance for tenants with large codebases
; Tenant A (Magento, 50K files) evicts Tenant B (WordPress) opcodes
```

Good Example:
```ini
; Separate FPM instances, separate OpCache
# Instance 1: Tenant A
php8.5-fpm-tenant-a.service
# Instance 2: Tenant B
php8.5-fpm-tenant-b.service
```
---
Exceptions: Single-tenant applications or environments where OpCache pressure is not a concern.
---
Consequences Of Violation: OpCache thrashing across tenants, hit rate drops, CPU spikes.
