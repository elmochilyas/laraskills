# Collector Deployment Decision

```mermaid
flowchart TD
    A[How to deploy\nCollector?] --> B{Deployment\nenvironment?}
    B -->|Kubernetes| C[Sidecar per pod:\ntelemetry isolation,\neasy configuration]
    B -->|VM/Bare metal| D[Gateway per host:\nshared Collector\nfor all processes]
    B -->|Development| E[Direct SDK export:\nno Collector needed]
    C --> F{Need centralized\nprocessing?}
    F -->|Yes| G[Sidecar + Gateway:\nSidecar for batching,\nGateway for sampling\nand multi-backend]
    F -->|No| H[Sidecar only:\nsimpler, sufficient\nfor single-backend]
    D --> I{Gateway HA\nrequired?}
    I -->|Yes| J[Load-balanced\nGateway cluster:\n2+ instances]
    I -->|No| K[Single Gateway:\nacceptable for\nlow-medium volume]
```

# Memory Limiter Decision

```mermaid
flowchart TD
    A[Configure memory\nlimiter?] --> B{Collector memory\nlimit set?}
    B -->|Yes| C[memory_limiter:\n- limit_mib: 80% of limit\n- spike_limit_mib: 20%\n- check_interval: 1s]
    B -->|No - unlimited| D[MANDATORY:\nmemory_limiter prevents\nOOM during spikes]
    C --> E[Set hard_limit:\nstop accepting data\nat 90% of limit]
    D --> F[Set soft_limit:\nstart dropping data\nat 70% of allocatable]
```

# Pipeline Batching Decision

```mermaid
flowchart TD
    A[Configure batching\nfor this signal?} --> B{Telemetry\nvolume?}
    B -->|< 100 spans/sec| C[batch config:\ntimeout: 1s\nsend_batch_size: 1024]
    B -->|100-1000\nspans/sec| D[batch config:\ntimeout: 200ms\nsend_batch_size: 4096]
    B -->|> 1000\nspans/sec| E[batch config:\ntimeout: 100ms\nsend_batch_size: 8192]
    C --> F{Batching benefit vs\nlatency trade-off?}
    D --> F
    E --> F
    F -->|Lower latency\ncritical| G[Reduce timeout:\n50ms minimum\nfor near-real-time]
    F -->|Efficiency\ntarget| H[Increase batch size:\nup to 16384\nfor maximum efficiency]
```
