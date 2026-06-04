## Never use tools that suffer from coordinated omission
---
Category: Methodology
---
Always verify that your benchmarking tool is not affected by coordinated omission. Prefer wrk2, k6, or Vegeta over wrk for latency measurements.
---
Reason: Coordinated omission happens when a benchmark tool ignores slow responses that overlap with subsequent requests, producing falsely optimistic latency results. wrk (not wrk2) and ab are notoriously affected. wrk2 uses open-loop load models to prevent this.
---
Bad Example:
```bash
# wrk (not wrk2) — suffers from coordinated omission
wrk -t4 -c64 -d60s http://app/endpoint
```

Good Example:
```bash
# wrk2 — open-loop model, no coordinated omission
wrk2 -t4 -c64 -d60s -R 2000 --latency http://app/endpoint
```
---
Exceptions: Throughput-only benchmarks where latency data is not analyzed.
---
Consequences Of Violation: Falsely optimistic latency measurements, deploying systems that are actually 2-10x slower than benchmarked.

## Use open-loop load models for realistic latency measurement
---
Category: Methodology
---
Prefer open-loop load models (fixed request rate) over closed-loop (fixed concurrency) for latency benchmarks.
---
Reason: Closed-loop models (fixed concurrency) hide queuing latency by reducing request rate when the system slows. Open-loop models maintain request rate regardless of system speed, revealing true latency under load. wrk2's --rate flag and k6's arrival-rate executors implement open-loop models.
---
Bad Example:
```bash
# Closed-loop — hides queuing when system saturates
ab -c 100 -n 10000 http://app/endpoint
```

Good Example:
```bash
# Open-loop — maintains rate, reveals true latency
wrk2 -t4 -c64 -d60s -R 2000 --latency http://app/endpoint
```
---
Exceptions: Capacity testing where the goal is to find maximum throughput, not measure latency under load.
---
Consequences Of Violation: Hidden queuing latency, optimistic latency numbers, systems that fail under real traffic patterns.
