## Always use P95 RSS, never average, for max_children calculation
---
Category: Configuration
---
Calculate pm.max_children using P95 worker RSS (not average) multiplied by a safety factor of 1.2-1.5.
---
Reason: Average-based sizing creates 30-50% oversubscription risk. When memory-intensive endpoints hit simultaneously (P95 scenario), average-based sizing causes OOM kills. P95 provides headroom for these peaks.
---
Bad Example:
```bash
# Using average RSS — dangerous
avg_rss=65MB
max_children = 10240 / 65 = 157 # Overestimates capacity by 50%
```

Good Example:
```bash
# Using P95 RSS — safe
p95_rss=95MB
max_children = 10240 / (95 * 1.2) = 89 # Realistic capacity
```
---
Exceptions: Applications with perfectly uniform RSS across all requests (extremely rare).
---
Consequences Of Violation: 30-50% OOM risk under peak load, mass 502 errors.

## Re-calibrate max_children quarterly
---
Category: Maintainability
---
Recalculate pm.max_children every quarter or after significant code changes that affect memory usage.
---
Reason: Worker RSS changes with code, data size, traffic patterns, and package updates. A correctly sized value becomes dangerous over months. Regular recalibration prevents gradual drift toward OOM risk.
---
Bad Example:
```ini
; Set once 18 months ago, never updated
pm.max_children = 50
; RSS has grown 40% since then — now oversubscribed
```

Good Example:
```ini
; Quarterly recalibration
; Q1: P95=95MB → max_children=89
; Q2: P95=110MB → max_children=77
```
---
Exceptions: Applications with perfectly stable code and data size (rare).
---
Consequences Of Violation: Gradual OOM risk increase, eventual worker crashes during peak traffic.

## Never use memory_limit as the basis for max_children calculation
---
Category: Configuration
---
Calculate max_children from actual worker RSS measurement, not from php.ini memory_limit.
---
Reason: memory_limit is a hard cap that causes 500 errors when reached. Workers typically use 20-40% of memory_limit. Using it as the basis overestimates capacity by 40-70%.
---
Bad Example:
```bash
# Using memory_limit — 40-70% overestimation
memory_limit=256MB
max_children = 10240 / 256 = 40 # Actual RSS is only 95MB
```

Good Example:
```bash
# Measured P95 RSS
ps -eo rss,command | grep php-fpm | awk '{print $1/1024}' | sort -n | awk '{all[NR]=$1} END {print all[int(NR*0.95)]}'
# → 95MB P95 RSS
max_children = 10240 / (95 * 1.2) = 89
```
---
Exceptions: None. Always measure actual RSS, never rely on memory_limit.
---
Consequences Of Violation: 40-70% overestimation of capacity, guaranteed OOM under peak load.
