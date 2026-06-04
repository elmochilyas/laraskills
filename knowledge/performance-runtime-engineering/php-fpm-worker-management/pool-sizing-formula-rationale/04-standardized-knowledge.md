# Standardized Knowledge: Pool Sizing Formula Rationale

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Pool Sizing Formula Rationale |
| Difficulty | Foundation |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The fundamental PHP-FPM capacity formula: `pm.max_children = (total_RAM - reserved_RAM) / avg_worker_RSS`. Calculate available RAM after reserving for OS, database, Redis, and other services. Measure average worker RSS (Resident Set Size) under realistic load. Apply a safety factor of 0.7-0.8 (use P95 RSS, not average) to avoid OOM under peak variance.

## Core Concepts

- **Total RAM**: Physical memory (e.g., 16GB). Not burstable/swap — using swap degrades performance catastrophically.
- **Reserved RAM**: OS (~1-2GB), database (InnoDB buffer pool size), Redis (maxmemory), other services. Typically 30-50% of total RAM.
- **Worker RSS**: Measure via `ps --no-headers -o rss -C php-fpm | awk '{sum+=$1} END {print sum/NR/1024}'` (average RSS in MB).
- **P95 RSS**: 95th percentile worker RSS — accounts for memory spikes. For FPM, P95 is typically 1.3-1.6x the average RSS.
- **Safety factor**: Multiply available RAM by 0.7-0.8 to leave headroom for OS page cache and unexpected spikes.

## When To Use

- Initial PHP-FPM capacity planning for new servers
- Periodic capacity reviews and rebalancing
- After infrastructure changes (RAM upgrade, new services)
- When diagnosing OOM or swap-related performance issues

## When NOT To Use

- When pm.max_children is constrained by database connections (DB max_connections is the limiting factor)
- For environments where workers are not the primary resource consumer
- As a substitute for monitoring — the formula provides a starting point, not a final answer

## Best Practices (WHY)

- **Reserve RAM for non-FPM services first**: OS, database, Redis, and other services need guaranteed memory. Calculate available RAM after subtracting these reservations.
- **Use P95 RSS, not average**: P95 RSS is typically 1.3-1.6x average. Using average creates 30-50% oversubscription risk.
- **Apply a safety factor**: Multiply available RAM by 0.7-0.8. This leaves headroom for page cache growth and unexpected spikes.
- **Verify with monitoring**: After setting max_children, monitor listen queue and free RAM under peak load. Adjust if needed.

## Architecture Guidelines

- **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.
- **The formula is a starting point**: Production traffic may exceed estimates. Always monitor and adjust.

## Performance

- 16GB server example: reserve 6GB (OS + DB + Redis) = 10GB available
- Average worker RSS = 65MB, P95 = 95MB
- With P95: 10,000MB / (95MB × 1.2 safety) = ~87 children
- With average: 10,000MB / (65MB × 1.2) = ~128 children
- Average-based oversubscribes by 47%

## Security

- Over-provisioning workers (too high max_children) causes OOM kills
- OOM events may lead to data corruption in applications without proper error handling
- Reserve adequate memory for system processes and security services (firewall, monitoring, logging)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Sizing by average RSS | Simplicity | 30-50% OOM risk under peak variance | Always use P95 or P99 RSS |
| Not reserving OS memory | Forgetting non-FPM services | System instability, OOM kills of critical services | Reserve 30-50% of total RAM for non-FPM |
| Using total_RAM / memory_limit | Assuming worker uses php.ini limit | Overestimates capacity by 40-70% | Measure actual RSS, not configured limits |
| Setting once, never updating | Static configuration mindset | Gradual drift leads to production issues | Re-calibrate quarterly |

## Anti-Patterns

- **Formula-only without monitoring**: The formula provides a safe starting point. Always verify with status page and free memory monitoring.
- **Maximizing max_children**: The goal is adequate capacity, not maximum workers. More workers = more memory pressure.
- **Ignoring database connections**: max_children × connections_per_request must not exceed database max_connections.

## Examples

```bash
# Calculate available RAM
total_ram=$(free -m | awk '/^Mem:/{print $2}')
reserved_ram=6144  # 6GB for OS + DB + Redis
available_ram=$((total_ram - reserved_ram))

# Measure average worker RSS
avg_rss=$(ps --no-headers -o rss -C php-fpm | awk '{sum+=$1; count++} END {print int(sum/count/1024)}')

# Calculate max_children with P95 adjustment (P95 is typically 1.3-1.6x average)
p95_rss=$(echo "$avg_rss * 1.5" | bc)
safety_factor=1.2
max_children=$(echo "$available_ram / ($p95_rss * $safety_factor)" | bc)
echo "Recommended max_children: $max_children"
```

## Related Topics

- PM Max Children P95 Calculation
- Worker RSS Capacity Ceiling
- Capacity Planning Safety Margins
- FPM Status Page Monitoring
- CPU vs I/O Bound Worker Ratios

## AI Agent Notes

- Formula: max_children = (total_RAM - reserved_RAM) / (P95_RSS × safety_factor)
- Reserve 30-50% of total RAM for non-FPM services.
- P95 RSS is typically 1.3-1.6x average RSS.
- Safety factor 1.2-1.5 provides headroom for variance.
- The formula is a starting point — always verify with monitoring.

## Verification

- [ ] Total RAM known and documented
- [ ] Reserved RAM calculated (OS + database + Redis + other services)
- [ ] Worker RSS measured under realistic production load
- [ ] P95 RSS calculated (not average)
- [ ] Safety factor applied (1.2-1.5)
- [ ] pm.max_children set to calculated value
- [ ] Listen queue stays at 0 under peak load
- [ ] Free RAM stays above 15% under peak
