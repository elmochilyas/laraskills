## Always calculate available RAM by subtracting reserved memory for all non-FPM services
---
Category: Architecture
---
Before applying the pool sizing formula, subtract guaranteed reservations for OS, database, Redis, monitoring agents, and all co-located services from total physical RAM.
---
Reason: Non-FPM services require guaranteed memory for stable operation. Using total RAM in the pool formula double-counts memory that belongs to the OS page cache, InnoDB buffer pool, Redis datasets, and monitoring agents. The OS itself needs 1-2GB minimum. Failing to reserve typically oversubscribes capacity by 30-50%.
---
Bad Example:
```bash
# Using total RAM — double-counts non-FPM memory
total_ram=32768 # 32GB
max_children=$((32768 / 110)) # 297 workers — 100+ too many
```

Good Example:
```bash
# Proper reservations: 32GB total - 2GB OS - 8GB DB - 2GB Redis = 20GB available
available_ram=$((32768 - 2048 - 8192 - 2048)) # 20480 MB
max_children=$((20480 / (110 * 13 / 10))) # 143 workers — correct
```
---
Exceptions: Dedicated FPM-only servers still need OS reservation (1-2GB minimum).
---
Consequences Of Violation: System instability, OOM kills of critical services, SWAP thrashing, complete server crash under peak load.

## Use P95 RSS multiplied by a 1.2-1.5 safety factor in pool sizing
---
Category: Performance
---
Calculate max_children = available_RAM / (P95_RSS × safety_factor), where P95_RSS is measured under peak production load and safety_factor is 1.2-1.5.
---
Reason: Average RSS understates peak memory needs by 30-50% because per-worker memory varies significantly between requests and over time. P95 RSS captures the typical peak, and the safety factor covers remaining variance, page cache pressure, and measurement error. This combined approach produces a conservative capacity value with <1% OOM risk.
---
Bad Example:
```bash
# Average RSS, no safety factor — 30-50% OOM risk
max_children=$((10000 / 65)) # 153 workers — dangerously high
```

Good Example:
```bash
# P95 RSS with safety factor — <1% OOM risk
p95_rss=95 # Measured under peak load
safety_factor=13 # 1.3 represented as integer for shell math
max_children=$((10000 * 10 / (p95_rss * safety_factor))) # 80 workers — safe
```
---
Exceptions: When P99 RSS data is available and the workload has extreme variance, use P99 instead of P95.
---
Consequences Of Violation: Capacity oversubscription by 30-50%, OOM kills under peak memory variance, server crashes during normal traffic spikes.

## Verify pool size with status page monitoring after applying the formula
---
Category: Monitoring
---
After setting pm.max_children from the formula, monitor the FPM status page for one full traffic cycle to confirm listen queue stays at 0 and free RAM stays above 15%.
---
Reason: The formula provides a safe starting point, not a final answer. Actual production traffic may differ from assumptions — request mix, concurrency, and external service latency all affect the optimal pool size. Monitoring confirms the formula was correct or reveals the need for adjustment.
---
Bad Example:
```ini
; Formula applied, never verified
pm.max_children = 80 ; Calculated but listen queue may be building up — no one checks
```

Good Example:
```ini
; Formula applied, then verified
pm.max_children = 80 ; Calculated value
```
```bash
# Verification: scrape status page for 24 hours
# Listen queue: 0 (all 24h) — confirmed
# Free RAM: 22% — safety margin confirmed
```
---
Exceptions: None. Verification is mandatory for every initial pool configuration and every significant change.
---
Consequences Of Violation: Missed sizing errors, undetected pool saturation, incorrect capacity assumptions persist until an incident occurs.

## Never size by average RSS alone
---
Category: Performance
---
Always use P95 or P99 RSS — measured under realistic production load — as the memory-per-worker input to the pool sizing formula.
---
Reason: Average RSS ignores the memory spikes that occur during peak request processing. A worker at P95 typically uses 1.3-1.6x the average RSS. Sizing by average allocates capacity for the typical case but not the worst case within normal operation, creating 30-50% oversubscription risk that manifests as OOM during the busiest times.
---
Bad Example:
```bash
# Average RSS — misses memory spikes
avg_rss=65 # Hides the 95MB P95 value
max_children=150 # Based on average — 30% too many
```

Good Example:
```bash
# P95 RSS — captures realistic peak
p95_rss=95 # 1.46x average — realistic
max_children=80 # Based on actual peak usage — safe
```
---
Exceptions: When only average monitoring data is available, multiply average by 1.5 as an emergency estimate, then collect P95 data within 24 hours.
---
Consequences Of Violation: 30-50% capacity oversubscription, OOM kills during peak traffic, server crashes that could have been prevented with percentile-based sizing.

## Re-calibrate pool sizing quarterly
---
Category: Maintainability
---
Re-measure worker RSS and recalculate max_children at least every quarter, and within one week of any code or infrastructure change that affects memory usage.
---
Reason: Worker RSS changes as the application evolves — new dependencies, larger datasets, and code restructuring all affect per-request memory allocation. Without regular recalibration, the pool size silently drifts from optimal to dangerous. A quarterly cadence catches drift before it becomes critical.
---
Bad Example:
```ini
; Sized once in 2024, untouched in 2025
pm.max_children = 100 ; Application has since added 20 packages — RSS has grown 30%
```

Good Example:
```bash
# Q1 2026: P95_RSS=95MB, max_children=80
# Q2 2026: P95_RSS=110MB, max_children=70 (adjusted after RSS growth detected)
```
```ini
pm.max_children = 70 ; Updated — stays within safety margin
```
---
Exceptions: Frozen applications with no code changes and flat traffic may extend to semi-annual reviews.
---
Consequences Of Violation: Silent capacity degradation, unnoticed increase in OOM risk, emergency resizing during an incident rather than planned maintenance.
