## Always apply a 1.2-1.5 safety factor in worker capacity calculations
---
Category: Reliability
---
Always multiply P95 RSS by a safety factor of 1.2-1.5 when calculating max_children from available RAM.
---
Reason: The safety factor accounts for RSS variance, OS page cache pressure, measurement error, and future growth. A server sized without a safety factor has 30-50% OOM risk during peak load vs <1% with a proper safety factor applied.
---
Bad Example:
```ini
; No safety factor — OOM risk under peak load
pm.max_children = 150 ; Calculated from average RSS, no safety factor
```

Good Example:
```ini
; With safety factor
; available_RAM = 20480MB, P95_RSS = 110MB, safety_factor = 1.3
pm.max_children = 143 ; 20480 / (110 * 1.3) = 143
```
---
Exceptions: None. A safety factor is never optional for production capacity planning.
---
Consequences Of Violation: 30-50% OOM risk during peak load, server crashes, potential data corruption, and cascading failures from resource exhaustion.

## Use P95 RSS, not average RSS, for capacity planning
---
Category: Performance
---
Always measure and use the 95th percentile worker RSS when calculating the capacity ceiling.
---
Reason: P95 RSS is typically 1.3-1.6x the average. Using average RSS oversubscribes capacity by 30-50%, creating severe OOM risk during memory spikes that occur under normal peak load variance.
---
Bad Example:
```bash
# Using average RSS — dangerous
avg_rss=65 # Average RSS in MB
max_children=150 # 10000 / (65 * 1.2) = 128 — oversubscribed
```

Good Example:
```bash
# Using P95 RSS
p95_rss=95 # P95 RSS in MB
max_children=87 # 10000 / (95 * 1.2) = 87 — safe
```
---
Exceptions: When P99 RSS data is available and the workload has extreme variance, use P99 instead of P95.
---
Consequences Of Violation: Capacity oversubscription by 30-50%, OOM kills under peak memory variance, server instability.

## Always budget database connections alongside RAM when sizing max_children
---
Category: Scalability
---
Calculate max_children × peak_connections_per_request ≤ database_max_connections × 0.8 and use the lower of the RAM-based or database-based ceiling.
---
Reason: Database connection exhaustion is a denial-of-service condition that affects all consumers of the database, not just the web pool. Reserving 20% of connections for administrative tasks and background jobs prevents production outages during deployment or maintenance.
---
Bad Example:
```ini
; RAM-sized capacity without database check — 100 workers × 2 DB connections = 200
pm.max_children = 100 ; Database max_connections = 150 — overflow!
```

Good Example:
```ini
; Database-budgeted capacity
; DB max_connections = 150, 20% reserved = 120 available
; 120 / 2 connections per request = 60 workers max
pm.max_children = 60 ; Database-bound, not RAM-bound
```
---
Exceptions: When the application uses a connection pooler (PgBouncer, ProxySQL) that decouples web workers from database connections, the database constraint is relaxed.
---
Consequences Of Violation: Database connection exhaustion, query failures, cascading application outages, blocked administrative access to the database.

## Always reserve RAM for non-FPM services before calculating available memory
---
Category: Architecture
---
Subtract guaranteed reservations for OS, database buffer pool, Redis, and all other co-located services before computing RAM available for PHP-FPM workers.
---
Reason: Non-FPM services need guaranteed memory for stable operation. Without explicit reservation, capacity planning double-counts memory that belongs to the OS page cache, InnoDB buffer pool, or Redis. Typically 30-50% of total RAM must be reserved for non-FPM services.
---
Bad Example:
```bash
# Using total RAM without reservations
max_children = 32000 / (110 * 1.3) = 223 # OOM — OS and DB have no reserved memory
```

Good Example:
```bash
# With proper reservations: 32GB total - 2GB OS - 8GB DB - 2GB Redis = 20GB available
max_children = 20480 / (110 * 1.3) = 143 # Safe
```
---
Exceptions: Dedicated PHP-FPM servers with no co-located services still need OS reservation (~1-2GB).
---
Consequences Of Violation: System instability, OOM kills of critical services (database, monitoring, SSH), SWAP thrashing, complete server crash.

## Recalculate capacity planning quarterly or after major code changes
---
Category: Maintainability
---
Re-run worker RSS measurements and recalculate max_children at least every quarter and within one week of any significant code or infrastructure change.
---
Reason: Worker RSS, traffic patterns, and database usage all change over time. Static capacity planning drifts into danger as the application evolves. A 10% increase in worker RSS across 100 workers adds 1GB+ of memory pressure that goes undetected without recalculation.
---
Bad Example:
```bash
# One-time capacity calculation, never revisited
# Set in 2024, still in use in 2026
pm.max_children = 100 # Worker RSS may have doubled since set
```

Good Example:
```bash
# Quarterly recalculation in monitoring runbook
# Q2 2026: P95_RSS = 95MB, max_children = 87
# Q3 2026: P95_RSS = 102MB, max_children = 81 (adjusted down)
```
---
Exceptions: Applications with frozen code and stable traffic may extend to semi-annual reviews.
---
Consequences Of Violation: Gradual capacity drift, unnoticed OOM risk increase, eventual production incident from resource exhaustion.

## Include a future growth buffer within the safety factor
---
Category: Scalability
---
Apply a 1.05-1.1 growth buffer component within the 1.2-1.5 safety factor to account for anticipated traffic or RSS increases.
---
Reason: A server at 95% capacity during normal operation has zero room for traffic spikes, code changes that increase RSS, or organic growth. The growth buffer ensures the capacity plan remains valid between quarterly reviews without requiring emergency resizing.
---
Bad Example:
```ini
; Tightly sized with no growth room
; 20GB available / (95MB RSS * 1.2) = 175 children — server at 95% on day one
pm.max_children = 175 ; No growth buffer
```

Good Example:
```ini
; Growth buffer included: 1.2 safety = 1.1 variance + 1.05 growth + 1.05 measurement
; 20GB / (95MB * 1.35) = 156 children — 12% headroom for growth
pm.max_children = 155 ; Room for growth
```
---
Exceptions: Auto-scaling environments where new servers are provisioned automatically may use a smaller buffer.
---
Consequences Of Violation: No headroom for traffic spikes or code changes, emergency capacity scrambling, increased incident risk between review cycles.
