## Always report throughput and latency together
---
Category: Performance
---
Never present throughput (RPS) without corresponding latency percentiles. High throughput with high latency is not a valid improvement.
---
Reason: Throughput and latency are inversely related but independently meaningful. High RPS at p99=5s is worse than moderate RPS at p99=50ms. Always present both metrics side by side for a complete picture.
---
Bad Example:
```bash
# Reporting only throughput
"New config: 2,200 RPS (+69%)"
```

Good Example:
```bash
"New config: 2,200 RPS (+69%), p50=15ms, p95=45ms, p99=120ms"
```
---
Exceptions: Quick smoke tests where only error rate matters.
---
Consequences Of Violation: Misleading performance conclusions, optimizing throughput at the expense of user experience.

## Report multiple latency percentiles — never only the average
---
Category: Performance
---
Always report p50, p95, and p99 latency percentiles. Never report only average latency.
---
Reason: Average latency hides outliers. A system with p50=20ms and p99=2s serves half of users well but 1 in 100 has a terrible experience. Average latency of 40ms hides this bimodal distribution entirely.
---
Bad Example:
```bash
"Average latency: 42ms" # Hides p99=2s outliers
```

Good Example:
```bash
"Latency: p50=20ms, p95=85ms, p99=350ms" # Complete distribution
```
---
Exceptions: None. Always report percentiles for meaningful latency analysis.
---
Consequences Of Violation: Hidden latency outliers, undetected user experience problems.

## Track the p50-to-p99 gap — alert when >5x
---
Category: Monitoring
---
Monitor the ratio between p99 and p50 latency. Investigate when p99 exceeds 5x p50.
---
Reason: A small gap (p99 = 2x p50) indicates consistent performance. A large gap (p99 = 10x p50) indicates high latency variability from queuing, GC pauses, or resource contention. The gap is one of the most telling indicators of system health.
---
Bad Example:
```bash
p50=20ms, p99=800ms (40x gap) — severe queuing problem
# Ignored because "p99 is within SLO"
```

Good Example:
```bash
p50=20ms, p99=80ms (4x gap) — acceptable
p50=20ms, p99=400ms (20x gap) — investigate queuing
```
---
Exceptions: Systems with known periodic batch processing that causes predictable latency spikes.
---
Consequences Of Violation: Unnoticed performance variability, queuing problems undetected until p99 SLO breach.

## Include resource efficiency metrics with every benchmark
---
Category: Performance
---
Report RPS per GB of RAM, CPU utilization, and worker RSS alongside throughput and latency. Never present isolated performance numbers.
---
Reason: A 20% throughput gain at 40% more memory may reduce overall system capacity. Resource efficiency ensures performance improvements are real, not artifacts of over-provisioning.
---
Bad Example:
```bash
"2,200 RPS — 69% improvement" # No resource context
```

Good Example:
```bash
"2,200 RPS (69%), 36KB/RPS, 65% CPU, 68MB RSS"
```
---
Exceptions: Capacity planning benchmarks where resource efficiency is not the question.
---
Consequences Of Violation: Performance improvements that are actually resource trade-offs, misleading capacity decisions.

## Pre-warm for 30+ seconds before recording benchmark data
---
Category: Methodology
---
Always run a warm-up phase of 30-60 seconds (1000-5000 requests) before recording benchmark measurements. Discard warm-up data.
---
Reason: First requests after server start are 20-50% slower due to cold OpCache, JIT compilation, and database connection establishment. Including warm-up data in measurements distorts results and makes them non-representative of steady-state production behavior.
---
Bad Example:
```bash
# No warm-up — data includes cold-start latency
wrk2 -t4 -c64 -d60s http://app/endpoint
```

Good Example:
```bash
# Warm-up 30s, then measure 60s
wrk2 -t4 -c64 -d30s -R 1000 http://app/endpoint > /dev/null
wrk2 -t4 -c64 -d60s -R 2000 --latency http://app/endpoint
```
---
Exceptions: Benchmarks specifically measuring cold-start behavior.
---
Consequences Of Violation: 20-50% inflated latency numbers, non-representative of production steady-state.
