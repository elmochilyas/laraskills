# Decision Trees: Octane Configuration and Workers

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Octane Configuration and Workers
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-OCW-01 | Worker Count Configuration | Performance | Medium | Per infrastructure setup |
| DT-OCW-02 | max_requests Tuning | Reliability | Medium | Per profiling cycle |
| DT-OCW-03 | Runtime-Specific Timeouts | Reliability | Medium | Per runtime setup |

---

## DT-OCW-01: Worker Count Configuration

### Decision Context
- **When to decide:** During Octane deployment and capacity planning
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Setting up octane.php for production
- **Constraint:** Over-subscription causes context-switch thrashing; under-subscription wastes capacity

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Workload type | High | CPU-bound vs I/O-bound |
| CPU core count | High | Physical cores available on server |
| Runtime adapter | High | Swoole coroutines vs RoadRunner processes |
| Memory budget | Medium | Each worker consumes 30-50MB baseline |

### Decision Tree

```
What type of workload does the application serve?
├── CPU-bound (Computation-heavy: image processing, encryption, complex calculations)
│   └── worker_count = CPU cores
│       ├── More workers than cores causes context-switch thrashing
│       ├── Coroutines provide no benefit (no I/O wait)
│       └── Example: 4-core machine → 4 workers
│
├── I/O-bound with Swoole (Waiting on DB, APIs, file I/O)
│   └── worker_count = CPU cores + Swoole coroutines for concurrency
│       ├── Coroutines handle concurrency within each worker
│       ├── I/O wait time yields to other coroutines
│       └── Example: 4-core machine → 4 workers, each with many coroutines
│
├── I/O-bound with RoadRunner
│   └── worker_count = CPU cores * 1.5-2 (process isolation model)
│       ├── No coroutine support — each request needs a process slot
│       ├── Higher count compensates for lack of coroutines
│       └── Example: 4-core machine → 6-8 workers
│
└── Mixed workload
    └── Start with CPU cores, adjust based on profiling
        ├── Monitor CPU utilization: <60% means room for more workers
        ├── Monitor context switches: excessive = too many workers
        └── Adjust up for I/O bias, down for CPU bias
```

### Rationale
Worker count should match CPU cores for CPU-bound apps and I/O-bound with Swoole (coroutines handle concurrency). RoadRunner may benefit from slightly higher counts since it lacks coroutine support. The `auto` setting defaults to CPU cores, which is a safe starting point.

### Default Path
Use `worker_count => env('OCTANE_WORKER_COUNT', 'auto')` which defaults to CPU cores.

### Risks
- Setting worker_count to expected concurrent users instead of CPU cores — massive oversubscription
- Too few workers for I/O-bound RoadRunner — request queue builds up
- Total memory budget: worker_count × 30-50MB per worker — can exhaust server RAM

### Related Rules/Skills
- Set worker count to CPU core count, not concurrent user count
- Skill: Tune Octane Worker Configuration Based on Memory Profile

---

## DT-OCW-02: max_requests Tuning

### Decision Context
- **When to decide:** After memory profiling data is available
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Initial Octane deployment or worker OOM incidents
- **Constraint:** Too low wastes throughput; too high risks OOM

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Memory growth rate | High | MB per request from profiling |
| Baseline memory | High | Idle worker memory after boot |
| memory_limit | High | PHP memory_limit configuration |

### Decision Tree

```
Has memory profiling been performed?
├── Yes — growth rate is known
│   └── Calculate safe max_requests:
│       ├── safe_max = (memory_limit - baseline - safety_margin) / growth_per_request
│       ├── safety_margin = 20% of memory_limit
│       ├── Example: (128MB - 40MB - 25MB) / 0.5MB = 126
│       └── Round down: max_requests = 100
│
├── No — no profiling data yet
│   ├── Start with default (500) or conservative estimate
│   │   ├── Default 500 is safe for most applications
│   │   └── Profile memory growth within first week
│   │
│   └── Then tune based on:
│       ├── Do workers OOM before reaching max_requests?
│       │   ├── Yes — reduce max_requests
│       │   └── No — consider increasing for less churn
│       └── (continuously adjust based on monitoring)
│
└── Never set to 0 or null
    └── No safety valve = workers grow until OOM
```

### Rationale
`max_requests` is the last line of defense against accumulated memory leaks. Even with perfect code, no application achieves zero accumulation. The formula `(memory_limit - baseline) / growth_per_request` provides a data-driven value. Always add a safety margin and round down.

### Default Path
Calculate from profiled memory data. Never disable (0/null). Default to 500 without data.

### Risks
- Setting too high: workers OOM before recycling, causing request loss
- Setting too low: excessive worker churn, reduced cache warmth, higher CPU from repeated bootstrap
- Confusing per-worker vs global: 8 workers × 500 = 4000 total requests before full rotation

### Related Rules/Skills
- Always set `max_requests` based on profiled memory growth
- Understand that `max_requests` is per-worker, not global
- Skill: Tune Octane Worker Configuration Based on Memory Profile

---

## DT-OCW-03: Runtime-Specific Timeouts

### Decision Context
- **When to decide:** During Octane configuration
- **Stakeholders:** DevOps
- **Trigger:** Setting up timeouts for specific runtime
- **Constraint:** Long legitimate requests must not be killed; stuck requests must be terminated

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Slowest legitimate request | High | Must be under timeout with margin |
| Stuck request detection | High | Must terminate stuck requests |
| Runtime adapter | High | Swoole and RoadRunner have different timeout configs |

### Decision Tree

```
Which Octane runtime is being configured?
├── Swoole
│   ├── Set max_execution_time = 2x slowest legitimate request
│   │   ├── Example: slowest endpoint takes 10s → max_execution_time = 30
│   │   └── This kills stuck requests, not slow legitimate ones
│   │
│   ├── Set max_wait_time (graceful shutdown) = upstream timeout
│   │   ├── Matches load balancer or proxy timeout
│   │   └── Ensures in-flight requests complete before worker kill
│   │
│   └── Set package_max_length for large request bodies
│       ├── Default is 2MB — increase for file uploads
│       └── 10MB is safe for most applications
│
├── RoadRunner
│   ├── Set request_timeout = 2x slowest legitimate request
│   │   └── Kills PHP process if request exceeds timeout
│   │
│   └── Set http.pool.max_jobs in .rr.yaml
│       └── Prevents worker starvation (too-frequent recycling)
│
└── FrankenPHP
    └── Timeouts configured in frankenphp.yml
        └── Caddy handles request timeouts natively
```

### Rationale
Run-time specific timeouts are the guardrails against stuck requests that block the entire worker (Swoole without coroutines) or consume process slots (RoadRunner). The timeout should be 2x the slowest legitimate request to accommodate occasional spikes without killing normal traffic.

### Default Path
Set timeouts at 2x the slowest legitimate request time. Configure graceful shutdown (max_wait_time) to match upstream load balancer timeout.

### Risks
- Timeout too low = legitimate long requests (file exports, report generation) are killed
- Timeout too high = stuck requests block workers for extended periods
- Not setting max_wait_time = workers killed mid-request during graceful shutdown, losing work

### Related Rules/Skills
- Configure graceful shutdown timeouts per runtime
- Match runtime-specific timeout config to application needs
- Skill: Tune Octane Worker Configuration Based on Memory Profile
