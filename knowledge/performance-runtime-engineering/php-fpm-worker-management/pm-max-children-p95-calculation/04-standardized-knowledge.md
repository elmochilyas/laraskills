# Standardized Knowledge: PM Max Children P95 Calculation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | PM Max Children P95 Calculation |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`pm.max_children` is the single most important FPM safety setting. The correct formula uses **P95 RSS** (not average) multiplied by a **safety factor** (1.2-1.5). Average-based sizing creates 30-50% oversubscription risk — when workers hit peak memory simultaneously during traffic spikes, the server OOM-kills FPM processes, causing mass 502 errors.

## Core Concepts

- **Average RSS trap**: Worker RSS varies significantly across requests. Memory-intensive pages (reports, admin dashboards) can consume 2-3x more RSS than average pages. Average-based sizing fails under concurrent memory-intensive requests.
- **P95 RSS collection**: Sample RSS across all workers over 1 hour of production traffic. Sort, discard top 5%. The 95th percentile value = P95 RSS. Formula: `max_children = (available_RAM / (P95_RSS × safety_factor))`.
- **Safety factor rationale**: 1.2 for well-characterized workloads, 1.5 for variable workloads. Accounts for: 1) OS memory pressure from page cache growth, 2) burst memory allocation before OOM killer, 3) measurement sampling error.

## When To Use

- Every PHP-FPM production deployment — this is the primary capacity safety setting
- After significant code changes that affect memory usage
- When adding new features or extensions that may increase worker RSS
- As part of regular capacity reviews

## When NOT To Use

- When PHP-FPM is not the web server (CLI scripts, Octane with alternative runtimes)
- For environments where pm.max_children is already constrained by other factors (e.g., database connections)
- As a substitute for fixing memory leaks — set max_children conservatively AND fix leaks

## Best Practices (WHY)

- **Always use P95 RSS, not average**: Average-based sizing creates 30-50% oversubscription risk. P95-based sizing is the difference between a stable server and one that OOM-kills under peak load.
- **Apply a safety factor of 1.2-1.5**: Even P95 has variance. The safety factor provides headroom for page cache pressure, measurement error, and future growth.
- **Measure over 24 hours**: One hour may not capture peak memory usage. Sample over a full business cycle.
- **Re-calibrate quarterly**: Worker RSS changes with code, data size, and traffic patterns. Regular recalibration prevents drift.

## Architecture Guidelines

- **Production measurement**: `ps -eo rss,pid,command --sort -rss | grep php-fpm` — capture at peak hours. Log to a file, calculate P95 after 24h.
- **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.

## Performance

- Over-provisioning (too many workers): causes OOM -> swap thrashing -> complete performance collapse
- Under-provisioning (too few workers): causes listen queue buildup -> 502/504 errors -> degraded user experience
- The optimal point: max_children where listen queue stays at 0 during peak traffic while keeping 10-20% RAM free

## Security

- OOM events can cause data corruption in applications without proper error handling
- A server under memory pressure (OOM or swapping) is vulnerable to denial of service
- Setting max_children correctly is a security control against resource exhaustion

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using total_RAM / memory_limit | Assuming worker uses memory_limit | Overestimates capacity by 40-70% | Measure actual worker RSS, not php.ini limits |
| Using average RSS instead of P95 | Simplicity, lack of awareness | 30-50% OOM risk under peak variance | Always use P95 or P99 RSS |
| No safety factor | Ignoring OS memory needs | OOM kills during page cache bursts | Apply 1.2-1.5x safety factor |
| Setting once, never updating | Assuming memory is static | Gradual RSS increase leads to OOM | Re-calibrate quarterly or after major changes |

## Anti-Patterns

- **Setting max_children to the number of CPU cores**: FPM workers are memory-constrained, not CPU-constrained. The formula must use RAM, not cores.
- **Maximizing max_children without monitoring**: Pushing max_children to the limit without status page monitoring risks silent OOM crashes.
- **Using the same max_children for all pools**: Each application and traffic pattern has different RSS. Size per-pool independently.

## Examples

```bash
# Capture worker RSS for P95 calculation
ps -eo rss,pid,command --sort -rss | grep php-fpm | awk '{print $1/1024}' > rss_samples.txt

# Calculate P95 from samples
sort -n rss_samples.txt | awk '{all[NR]=$1} END {p95=all[int(NR*0.95)]; print "P95 RSS: " p95 " MB"}'

# Calculate max_children
# Available RAM = 16GB total - 6GB reserved (OS + DB + Redis) = 10GB = 10240MB
# P95 RSS = 95MB
# Safety factor = 1.2
# max_children = 10240 / (95 * 1.2) = 89
```

## Related Topics

- Pool Sizing Formula
- Worker RSS Capacity Ceiling
- Capacity Planning Safety Margins
- FPM Status Page Monitoring
- CPU vs I/O Bound Worker Ratios

## AI Agent Notes

- P95 RSS (not average) is the correct basis for max_children calculation.
- Average-based sizing creates 30-50% oversubscription risk.
- Safety factor of 1.2-1.5 accounts for page cache, measurement error, and burst allocation.
- Re-calibrate quarterly — worker RSS changes with code and data.
- max_children = floor(available_RAM / (P95_RSS × safety_factor)).

## Verification

- [ ] Worker RSS sampled over 24+ hours of production traffic
- [ ] P95 RSS calculated from samples (not average)
- [ ] Safety factor (1.2-1.5) applied in formula
- [ ] pm.max_children set to calculated value
- [ ] FPM status page confirms listen queue stays at 0 under peak
- [ ] Server maintains 10-20% free RAM under peak load
- [ ] Re-calibration scheduled quarterly
