## Use static process manager for steady high-traffic workloads
---
Category: Configuration
---
Always choose pm=static for predictable high-traffic APIs (>100 req/s). Avoid dynamic for steady traffic.
---
Reason: Static mode eliminates spawn latency entirely — all workers are ready at startup. Dynamic mode adds unnecessary spawn/kill overhead when traffic is steady. Static consumes constant memory but provides predictable latency.
---
Bad Example:
```ini
; Dynamic mode for steady 500 req/s traffic
pm = dynamic ; Unnecessary spawn/kill overhead
```

Good Example:
```ini
; Static mode for steady high traffic
pm = static
pm.max_children = 50 ; Fixed pool, zero spawn latency
```
---
Exceptions: Variable traffic patterns where memory savings from dynamic mode justify spawn overhead.
---
Consequences Of Violation: Unnecessary spawn/kill cycles, added latency variance from worker spawning.

## Never use ondemand for production APIs above 50 req/s
---
Category: Performance
---
Avoid pm=ondemand for any production API serving more than 50 requests per second.
---
Reason: Ondemand spawns workers on every cold request (~10-50ms spawn latency). At 500 req/s, the server spends 5-25 seconds per second spawning workers. The spawn rate limiter compounds the problem, causing queue buildup.
---
Bad Example:
```ini
; Ondemand for a 500 req/s API — catastrophic
pm = ondemand ; Each request pays spawn latency
```

Good Example:
```ini
; Static or dynamic for production APIs
pm = static
pm.max_children = 50
```
---
Exceptions: Development/staging environments or very low-traffic internal tools (<10 req/s).
---
Consequences Of Violation: Server spends more time spawning than serving, request queue buildup, 502 errors.

## Always set pm.max_children for all process manager modes
---
Category: Configuration
---
Configure pm.max_children in every pool configuration regardless of process manager mode.
---
Reason: Even ondemand mode can exhaust server resources under traffic spikes. Without max_children, there is no upper bound on worker count. Setting it is a safety control against resource exhaustion.
---
Bad Example:
```ini
; No max_children in ondemand mode
pm = ondemand
; No upper bound — OOM under traffic spike
```

Good Example:
```ini
pm = ondemand
pm.max_children = 20 ; Always set an upper bound
pm.process_idle_timeout = 10s
```
---
Exceptions: None. max_children is always required for resource safety.
---
Consequences Of Violation: Unbounded worker creation, OOM kills, server crash under traffic spike.
