# Standardized Knowledge: Worker RSS Capacity Ceiling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Worker RSS Capacity Ceiling |
| Difficulty | Foundation |
| Lifecycle | Plan, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The server's maximum concurrent request capacity is `pm.max_children` — but this value is constrained by available RAM divided by worker RSS. More workers do not equal more throughput: beyond the optimal point, context switching overhead and memory pressure degrade performance. The capacity ceiling is a product of **worker count × worker RSS = available RAM**.

## Core Concepts

- **Capacity equation**: Concurrent request ceiling = min(CPU capacity, RAM capacity). RAM is typically the binding constraint.
- **CPU vs RAM bound**: CPU-bound workloads saturate CPU before memory (workers idle less). I/O-bound workloads accumulate many waiting workers, consuming memory without using CPU.
- **Worker RSS determination**: Average memory per worker under load. Varies by application complexity (50MB for simple sites, 120MB+ for large frameworks with heavy memory usage).
- **Optimal max_children**: The highest value where: 1) RAM stays 15%+ free, 2) CPU is utilized but not saturated, 3) Listen queue stays at 0.

## When To Use

- Capacity planning for new servers
- Determining whether to scale vertically (more RAM) or horizontally (more servers)
- Diagnosing OOM or swap-related performance issues
- Right-sizing existing deployments

## When NOT To Use

- When the limiting factor is database connections or other external resources
- For non-FPM runtimes (Octane, FrankenPHP, Swoole have different capacity models)
- As a substitute for load testing — the formula provides a ceiling, not the optimal operating point

## Best Practices (WHY)

- **RAM is the typical bottleneck**: CPU-bound workloads are rare in PHP web apps. Most deployments are RAM-constrained by worker count.
- **Measure actual RSS, don't guess**: Worker RSS varies by application, framework, and even specific request paths. Always measure under realistic load.
- **The optimal point is below the ceiling**: Don't set max_children to the absolute maximum. Leave 15%+ RAM free for OS page cache and unexpected spikes.
- **Monitor to find the optimal point**: Start conservative, increase gradually while monitoring listen queue and free RAM.

## Architecture Guidelines

- **Scaling methodology**: Start with conservative max_children -> stress test -> monitor RSS and CPU -> increase until listen queue disappears or RAM hits 85% utilization -> back off 10% for safety margin.
- **The capacity ceiling is not the target**: The ceiling is the theoretical maximum. The optimal operating point is below the ceiling, balancing throughput and safety margin.

## Performance

- Too many workers: context switching overhead degrades CPU-bound performance
- Too few workers: listen queue buildup causes latency spikes
- Optimal point: workers sufficient to keep CPU busy during I/O wait without exceeding RAM
- For I/O-bound workloads: more workers improve throughput (up to RAM limit)
- For CPU-bound workloads: workers > cores degrades throughput

## Security

- OOM from over-provisioned workers can crash the entire server
- Swap usage from memory pressure severely degrades performance and can cause timeouts
- Proper capacity planning is a security control against resource exhaustion
- Worker RSS varies — monitor for unexpected increases (potential memory leak or attack)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting max_children too high | "More workers = more throughput" | OOM, swap thrashing, performance collapse | Calculate from available RAM / RSS |
| Ignoring context switching overhead | Only considering RAM | CPU-bound performance degrades with too many workers | Profile CPU utilization; adjust worker count |
| Not measuring RSS under load | Using idle RSS | Underestimates memory needs by 30-50% | Measure RSS during peak traffic |
| Assuming ceiling = optimal | Maximizing without testing | Pushes server to edge of stability | Back off 10-20% from the ceiling |

## Anti-Patterns

- **Maximizing max_children**: The highest possible value is not the best value. Leave headroom for variance and OS needs.
- **Setting max_children once and forgetting**: Worker RSS changes with code, data size, and traffic patterns. Review quarterly.
- **Ignoring the CPU dimension**: RAM provides the ceiling, but CPU utilization determines the optimal operating point below that ceiling.

## Examples

```bash
# Measure worker RSS under load
ps -eo rss,command | grep php-fpm | awk '{print $1/1024, $2}' | sort -rn

# Calculate capacity ceiling
# Server: 16GB RAM, 8 CPU cores
# Worker RSS: 85MB average under load
# OS + services reserve: 4GB
# Available RAM: 12GB = 12288MB
# RAM capacity ceiling: 12288 / 85 = ~144 workers
# But at 8 cores, CPU-bound limit may be 32-64 workers
# I/O-bound limit: 64-96 workers
# Actual optimal: start at 50, stress test, increase to find the inflection point
```

## Related Topics

- Pool Sizing Formula
- PM Max Children P95 Calculation
- CPU vs I/O Bound Worker Ratios
- Capacity Planning Safety Margins
- FPM Status Page Monitoring

## AI Agent Notes

- The capacity ceiling is worker count × worker RSS = available RAM.
- RAM is typically the binding constraint, not CPU.
- The optimal operating point is below the ceiling (back off 10-20%).
- More workers ≠ more throughput beyond the optimal point.
- Measure RSS under load, not at idle.

## Verification

- [ ] Worker RSS measured under realistic production load
- [ ] Capacity ceiling calculated from available RAM
- [ ] max_children set below the ceiling (10-20% headroom)
- [ ] CPU utilization monitored to check for context switching overhead
- [ ] FPM status page confirms listen queue stays at 0
- [ ] RAM stays 15%+ free under peak load
- [ ] Capacity reviewed quarterly
