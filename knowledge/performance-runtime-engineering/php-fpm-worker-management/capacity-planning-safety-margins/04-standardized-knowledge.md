# Standardized Knowledge: Capacity Planning Safety Margins

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Capacity Planning Safety Margins |
| Difficulty | Enterprise |
| Lifecycle | Plan, Architect |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Production capacity planning for PHP-FPM follows: `pm.max_children × P95_RSS × safety_factor = available_RAM`. The safety factor (1.2-1.5) accounts for RSS variance, OS page cache pressure, and measurement error. Using P95 RSS instead of average is the difference between a stable server and one that OOM-kills under peak load.

## Core Concepts

- **Capacity formula**: `max_children = floor(available_RAM / (P95_RSS × safety_factor))` — produces a conservative, production-safe value.
- **P95 RSS measurement**: Sample worker RSS every 10s for 24h of production traffic, sort, take 95th percentile. Repeat quarterly or after major code changes.
- **Safety factor components**: 1.1 for page cache pressure, 1.05 for measurement error, 1.05 for future growth buffer = ~1.2 minimum. 1.5 for workloads with high RSS variance.
- **Database connection budgeting**: max_children × connections_per_request must not exceed database max_connections. At 50 children × 2 DB connections = 100 DB connections needed.

## When To Use

- Capacity planning for new production deployments
- Annual/quarterly capacity reviews
- Before and after major infrastructure changes
- When diagnosing OOM or swap-related performance issues

## When NOT To Use

- When max_children is constrained by database connections (use that as the ceiling instead)
- For non-FPM runtimes (Octane, FrankenPHP, Swoole have different capacity models)
- As a one-time exercise — capacity planning must be ongoing

## Best Practices (WHY)

- **Use a safety factor of 1.2-1.5**: The safety factor is not optional. It accounts for real-world variance that static formulas miss.
- **Include database connection budgeting**: max_children × connections_per_request must fit within database max_connections. This is often the binding constraint.
- **Plan for growth**: Apply a future growth buffer (1.05-1.1) within the safety factor. A server at 95% capacity during normal operation has no room for traffic spikes.
- **Review quarterly**: Worker RSS, traffic patterns, and code all change. Recalculate capacity quarterly.

## Architecture Guidelines

- **Capacity planning spreadsheet**: Row 1: total_RAM, Row 2: OS_reserve, Row 3: DB_reserve, Row 4: cache_reserve, Row 5: available_RAM (R1-R2-R3-R4), Row 6: P95_RSS, Row 7: safety_factor, Row 8: max_children (R5/(R6×R7)).
- **Database connection budgeting**: max_children × peak_connections_per_request = DB_max_connections × 0.8. The 0.8 factor reserves 20% for administrative connections and background jobs.

## Performance

- A server sized with average RSS has 30-50% OOM risk during peak
- A server sized with P95 RSS + 1.2 safety factor has <1% OOM risk
- The safety factor reduces max_children by 20-50% but prevents catastrophic failures
- Database connection budgeting often gives a lower max_children than the RAM formula

## Security

- OOM events can cause data corruption in applications without proper error handling
- Proper capacity planning is a security control against resource exhaustion
- Database connection exhaustion is a denial-of-service risk — budget connections carefully
- Safety margins protect against traffic spikes that could otherwise overwhelm the server

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring database max_connections | Only planning for RAM | Connection exhaustion, query failures | Budget: max_children × conn_per_request < DB_max × 0.8 |
| No safety factor | Assuming static workload | OOM during page cache bursts or spikes | Apply 1.2-1.5 safety factor |
| Using average RSS | Simplicity | 30-50% OOM risk under peak variance | Use P95 RSS (1.3-1.6x average) |
| One-time planning | Static mindset | Gradual capacity drift leads to incidents | Review quarterly |

## Anti-Patterns

- **Sizing for average load**: Capacity must handle peak load, not average. Use P95 RSS and peak traffic estimates.
- **Ignoring the database ceiling**: The RAM formula may suggest 100 workers, but the database can only handle 50 connections. The lower value wins.
- **Zero safety margin**: Every percentage point of RAM used above 85% increases OOM risk non-linearly. The safety factor is essential.

## Examples

```bash
# Capacity planning formula in practice
# Server: 32GB RAM, 4 cores
# OS reserve: 2GB
# Database reserve (InnoDB buffer pool): 8GB
# Redis reserve: 2GB
# Available RAM: 32 - 2 - 8 - 2 = 20GB = 20480MB
# P95 worker RSS: 110MB
# Safety factor: 1.3
# max_children = 20480 / (110 * 1.3) = ~143
# 
# Database check: max_connections = 150
# connections_per_request = 2
# max_children × 2 <= 150 × 0.8 = 120
# max_children <= 60 (database bound)
# Final max_children = 60 (limited by database, not RAM)
```

## Related Topics

- PM Max Children P95 Calculation
- Pool Sizing Formula
- Worker RSS Capacity Ceiling
- CPU vs I/O Bound Worker Ratios
- Database Connection Management

## AI Agent Notes

- Safety factor (1.2-1.5) is essential — accounts for real-world variance.
- Database connection budgeting often gives a lower max_children than RAM.
- Review capacity quarterly — everything changes over time.
- P95 RSS + safety factor = <1% OOM risk.
- The formula: max_children = floor(available_RAM / (P95_RSS × safety_factor)).

## Verification

- [ ] Safety factor (1.2-1.5) applied in capacity calculation
- [ ] Database max_connections checked and budgeted
- [ ] P95 RSS used (not average)
- [ ] Available RAM calculated after reserving for all non-FPM services
- [ ] Capacity reviewed quarterly
- [ ] Growth buffer included in planning
- [ ] Monitoring confirms <85% RAM usage under peak load
