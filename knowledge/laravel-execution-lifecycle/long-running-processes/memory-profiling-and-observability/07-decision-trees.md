# Decision Trees: Memory Profiling and Observability

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Memory Profiling and Observability
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-MP-01 | Per-Request Memory Delta Tracking | Performance | Low | Per setup |
| DT-MP-02 | Baseline Monitoring Strategy | Reliability | Medium | Per setup |
| DT-MP-03 | Profiling Tool Selection | Observability | Medium | Per infrastructure setup |

---

## DT-MP-01: Per-Request Memory Delta Tracking

### Decision Context
- **When to decide:** When setting up Octane or queue worker monitoring
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Pre-Octane deployment or OOM incident response
- **Constraint:** Consistent positive deltas indicate accumulation

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Measurement accuracy | High | Must capture both start and end to compute delta |
| Overhead impact | Low | memory_get_usage() is ~0.001ms |
| Log volume | Medium | Structured logging vs metrics-only approach |

### Decision Tree

```
Is Octane or queue workers in use?
├── Yes — long-running processes
│   ├── Are there existing OOM incidents or memory concerns?
│   │   ├── Yes — implement per-request delta tracking immediately
│   │   │   ├── RequestReceived: store memory_get_usage(false) in request attributes
│   │   │   ├── RequestTerminated: compute and log delta
│   │   │   ├── Monitor for consistent positive deltas (>5MB)
│   │   │   └── Use memory_get_usage(false) for delta (actual usage)
│   │   │
│   │   └── No — proactive baseline tracking
│   │       ├── Log delta at a sampled rate (every 10th request)
│   │       └── Enable full tracking before major deployments
│   │
│   └── (delta tracking is the earliest leak indicator)
│
└── No — PHP-FPM only
    └── Memory is freed per-request
        └── Per-request delta tracking is optional
            └── Use for performance profiling, not leak detection
```

### Rationale
Consistent positive memory deltas across requests are the earliest indicator of a memory leak. Without both start-of-request and end-of-request measurements, the delta is meaningless. Using `memory_get_usage(false)` (actual PHP usage) avoids false positives from OS-level allocation that never shrinks.

### Default Path
Register `RequestReceived` and `RequestTerminated` listeners for delta tracking in all Octane deployments.

### Risks
- Using `memory_get_usage(true)` for delta — shows OS allocation that only grows, producing misleading always-positive values
- Logging on every request for 100 workers × 500 req/min = 50,000 log entries per minute
- Profiling tool's own static arrays can become the leak source

### Related Rules/Skills
- Track per-request memory delta on every request
- Use `memory_get_usage(false)` for actual usage, `true` for OS allocation
- Skill: Establish Memory Baseline and Trend Tracking

---

## DT-MP-02: Baseline Monitoring Strategy

### Decision Context
- **When to decide:** During Octane monitoring setup
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up production observability
- **Constraint:** Instantaneous memory values are contextless — trends matter

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Alert methodology | High | Trend-based alerts vs absolute thresholds |
| Metric system | Medium | Grafana, Telescope, or custom |
| Time window | Medium | 1000-request window for meaningful baselines |

### Decision Tree

```
What monitoring infrastructure exists?
├── Grafana + Prometheus (metrics system)
│   └── Track baseline trend via Octane::tick
│       ├── Octane::tick('memory', fn() => Metrics::gauge(...), 60)
│       ├── Gauge: worker_memory_baseline (memory_get_usage(true))
│       ├── Gauge: worker_memory_delta_avg (rolling average)
│       ├── Gauge: worker_gc_roots (gc_status()['roots'])
│       └── Alert: baseline > 20% increase over 1000 requests
│
├── Laravel Telescope
│   └── Enable memory watcher
│       ├── Configure Telescope for Octane (memory mode)
│       ├── Monitor memory trend in Telescope dashboard
│       └── Watch for growing entries in dump/request watchers
│
├── Custom structured logging (ELK, CloudWatch)
│   ├── Log baseline every N requests
│   ├── Log per-request delta with URL and method context
│   └── Post-hoc analysis: GROUP BY period, AVG(baseline)
│
└── No existing infrastructure
    └── Start with structured logging
        ├── Minimal setup: Log delta + baseline per request
        └── Upgrade to metrics system as application grows
```

### Rationale
Baseline trend monitoring is the only reliable way to detect accumulation. A worker at 100MB is fine if stable. A worker growing from 50MB to 100MB to 150MB has a leak. Instantaneous memory usage without trend context leads to wasted investigation on normal high memory and missed real leaks.

### Default Path
Track baseline via `Octane::tick()` with metrics gauges. Alert on >20% baseline increase over 1000 requests.

### Risks
- False positives from legitimate operations (large file downloads, report generation)
- Metrics system itself accumulating data (Telescope watchers known to leak under Octane)
- Too-frequent logging causing metric deluge

### Related Rules/Skills
- Monitor baseline trend, not instantaneous memory
- Skill: Establish Memory Baseline and Trend Tracking

---

## DT-MP-03: Profiling Tool Selection

### Decision Context
- **When to decide:** When choosing memory profiling tools
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up memory observability infrastructure
- **Constraint:** Tools add overhead; combining them can exceed memory_limit

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Overhead tolerance | High | Combined tools can add 10%+ overhead |
| Depth of insight | Medium | Lightweight vs deep profiling |
| Existing infrastructure | High | Prefer tools already deployed |

### Decision Tree

```
What is the profiling goal?
├── Continuous production monitoring
│   ├── Existing infrastructure available?
│   │   ├── Telescope — enable memory watcher, disable unused watchers
│   │   ├── Grafana — Octane::tick() + Metrics facade
│   │   └── Blackfire — continuous profiling at 100ms sampling
│   │
│   └── None available
│       └── Custom structured logging (minimal overhead)
│           ├── memory_get_usage() before/after each request
│           └── Octane::tick() for baseline
│
├── Deep leak investigation
│   ├── php-meminfo (Facebook) — heap dump analysis
│   │   ├── Takes 5-10s per dump
│   │   └── Run on staging, not production
│   │
│   ├── Blackfire — profiling snapshots
│   │   └── Run on staging with representative traffic
│   │
│   └── Xdebug — memory trace
│       └── Only in development (extreme overhead)
│
└── Static analysis (pre-production)
    └── Custom artisan command: reflect all declared classes
        ├── grep static::$property = growing arrays
        ├── grep singleton() with mutable state
        └── Run in CI to catch new leak sources
```

### Rationale
Different profiling goals require different tools. Continuous monitoring needs low overhead (custom logging or metrics). Deep investigations need detailed tools (php-meminfo, Blackfire) that are too expensive for production. Combining multiple tools simultaneously (Blackfire + Telescope + custom logging) can push a worker past memory_limit.

### Default Path
Custom structured logging for continuous monitoring; Blackfire or php-meminfo for deep investigations.

### Risks
- Combined profiling tools add 10%+ overhead, pushing worker past memory_limit
- Profiling tool's own static arrays become the leak source
- Too many tools active simultaneously = measurement artifact obscures real leaks

### Related Rules/Skills
- Skill: Establish Memory Baseline and Trend Tracking
