## Estimate Octane gain using the bootstrap proportion formula before migrating
---
Category: Design
---
Profile an empty endpoint (bootstrap cost) and a real endpoint (total cost), compute bootstrap proportion, and apply Amdahl's Law (speedup = 1 / (1 - bootstrap_proportion)) to estimate Octane's maximum theoretical gain.
---
Reason: Octane eliminates only the bootstrap portion of request time — I/O (database queries, API calls) takes the same time as FPM. If bootstrap is 80% of a 50ms request, Octane can achieve up to 5x improvement. If bootstrap is 10% of a 500ms request, Octane's maximum gain is 1.11x. Measuring first prevents unrealistic expectations and wasted migration effort on applications where Octane provides minimal benefit.
---
Bad Example:
```bash
# Assuming Octane will give 5x gain without measurement
# Real application: 500ms request, 40ms bootstrap (8%) — max 1.09x theoretical gain
```

Good Example:
```bash
# Measured bootstrap proportion
# Empty endpoint: 40ms (bootstrap)
# Real endpoint: 50ms (bootstrap + 10ms I/O)
# Bootstrap proportion: 80% → 5x theoretical max gain — worthwhile migration
```
---
Exceptions: Applications with bootstrap proportion <20% should optimize database queries first, then re-evaluate Octane's potential gain.
---
Consequences Of Violation: Migration to Octane yields 10-20% gain instead of expected 3-5x, team disappointment, wasted migration investment.

## Never estimate gain using hello-world endpoints — use production-representative requests
---
Category: Testing
---
Measure bootstrap proportion using a realistic application endpoint (with middleware, database queries, and authentication) — not a bare route returning a string.
---
Reason: A hello-world endpoint (returning "OK" from a closure) has bootstrap as 100% of cost, showing 15-20x theoretical gain. A real endpoint with database queries, middleware, and view rendering has a much lower bootstrap proportion. Using hello-world for estimation leads to Order-of-Magnitude overestimates that cause disappointment when production gains are 2-5x lower.
---
Bad Example:
```bash
# Hello-world endpoint — overestimates gain
# Bootstrap: 40ms, Total: 40ms → bootstrap proportion 100% → infinite gain
```

Good Example:
```bash
# Real endpoint — realistic estimate
# Bootstrap: 40ms, Real endpoint: 200ms → bootstrap proportion 20% → 1.25x max gain
# Conclusion: optimize queries first, Octane will help but not dramatically
```
---
Exceptions: Pure-API applications with minimal business logic may have bootstrap proportion closer to the hello-world estimate.
---
Consequences Of Violation: Overestimated gains lead to wrong migration decisions, team expects 10x but achieves 1.5x, migration judged a failure despite being correctly estimated.

## Benchmark under concurrent load, not single-request latency
---
Category: Testing
---
Measure Octane's throughput improvement under concurrent load (multiple simultaneous connections) — single-request latency benchmarks underestimate Octane's real-world benefit.
---
Reason: Octane's primary advantage is handling concurrent requests efficiently by eliminating per-request bootstrap and reusing workers. A single-request latency test only measures the bootstrap elimination benefit (2-5x). Under concurrent load, Octane also benefits from persistent connection reuse and worker pooling, which can multiply the gain to 5-20x. Single-request tests capture only a fraction of the total improvement.
---
Bad Example:
```bash
# Single-request latency — underestimates Octane
curl http://localhost:8000/api/users  # 45ms vs FPM 80ms = 1.8x
```

Good Example:
```bash
# Concurrent load — full picture
wrk -t4 -c100 -d30s http://localhost:8000/api/users
# Octane: 2500 RPS vs FPM: 500 RPS = 5x — concurrent benefit captured
```
---
Exceptions: Latency-sensitive applications (single-user experience, not throughput) may prioritize single-request latency benchmarking.
---
Consequences Of Violation: Underestimated Octane benefit, incorrect cost-benefit analysis, migration rejected based on incomplete data.

## Account for worker overhead when estimating total system capacity
---
Category: Scalability
---
Include per-worker memory (30-80MB RSS) and per-worker connection overhead when calculating how many Octane workers a server can support — each worker consumes resources even at idle.
---
Reason: Each Octane worker consumes RAM and database connections from the moment it starts, regardless of traffic. A server with 16GB RAM might support 16 Octane workers at 80MB RSS + persistent connections = 1.28GB + connection overhead before serving a single request. The gain formula predicts throughput per worker, but the total system throughput is workers × per-worker throughput, constrained by available memory and connections.
---
Bad Example:
```bash
# Gain estimation without resource accounting
# 5x per-worker gain → 5 × current RPS = total gain
# But only 4 workers fit in memory vs 20 FPM workers
```

Good Example:
```bash
# Full resource accounting
# 5x per-worker gain, but only 4 workers fit vs 8 FPM pools
# Effective gain: 5 × (4/8) = 2.5x after accounting for worker count limits
```
---
Exceptions: Applications with low per-worker RSS (<30MB) may see the worker count constraint relax relative to the gain estimate.
---
Consequences Of Violation: Overestimated total system capacity, under-provisioned servers, memory exhaustion or connection pool overflow when scaling to expected throughput.
