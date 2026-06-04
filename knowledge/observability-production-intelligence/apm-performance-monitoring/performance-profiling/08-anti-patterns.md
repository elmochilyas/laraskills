# Decision Trees: Performance Profiling

## Decision D-01: Profiling Approach

**Question:** Which profiling approach is appropriate for the current scenario?

```mermaid
flowchart TD
    A[Need to profile] --> B{Environment?}
    B -->|Production| C{Overhead tolerance?}
    B -->|Staging| D[Instrumenting profiler ok]
    B -->|Development| E[Any profiler works]
    C -->|< 3%| F[Sampling profiler: XHProf]
    C -->|> 3% not acceptable| G[Don't profile in production]
    D --> H[Blackfire full mode for deep analysis]
    E --> I[Choice by tool preference]
    F --> J{Investigation type?}
    J -->|CPU-bound| K[Sampling is sufficient]
    J -->|Memory leak| L[Memory profiler needed]
    J -->|I/O bound| M[Profiling less useful - check queries]
```

## Decision D-02: Bottleneck Classification

**Question:** Is the performance issue CPU-bound or I/O-bound?

```mermaid
flowchart TD
    A[Analyze bottleneck] --> B{Wall time vs CPU time?}
    B -->|Wall >> CPU (>2x)| C[I/O-bound bottleneck]
    B -->|Wall ≈ CPU| D[CPU-bound bottleneck]
    C --> E[Database queries: check EXPLAIN]
    C --> F[HTTP calls: check external latency]
    C --> G[File I/O: check disk stats]
    D --> H[Flame graph hot functions]
    D --> I[Memory allocations]
    E --> J[Add index, reduce query count, add cache]
    F --> K[Add timeout, parallelize, cache response]
    G --> L[Migrate to SSD, add cache layer]
    H --> M[Optimize algorithm, add cache]
    I --> N[Reduce allocations, reuse objects]
```

## Decision D-03: CI Budget Enforcement

**Question:** How should performance budgets be set and enforced?

```mermaid
flowchart TD
    A[Set CI performance budget] --> B{Baseline available?}
    B -->|Yes| C[Set at baseline + 20%]
    B -->|No| D[Run initial profiles to establish baseline]
    C --> E{Metric type?}
    E -->|Wall-clock time| F[Threshold in ms]
    E -->|Query count| G[Threshold in count]
    E -->|Memory| H[Threshold in MB]
    E -->|I/O wait| I[Threshold in ms]
    F --> J[CI fail if > budget]
    G --> J
    H --> J
    I --> J
    D --> K[Document baseline, set provisional budget]
    K --> L[Review after 1 month, adjust]
```
