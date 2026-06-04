# Standardized Knowledge: Concurrency Models

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Concurrency Models |
| Difficulty | Foundation |
| Lifecycle | Understand, Select |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP applications can handle concurrent requests via four models: **process-based** (PHP-FPM — isolated, high overhead), **thread-based** (FrankenPHP — shared memory, lower overhead), **coroutine-based** (Swoole — cooperative multitasking within a single thread), and **goroutine-based** (RoadRunner — Go-managed goroutines dispatching to PHP workers). Each trades isolation for efficiency differently.

## Core Concepts

- **Process-based (FPM)**: Each request in a separate OS process. Maximum isolation, highest memory overhead (~30-80MB per worker). No shared state between requests.
- **Thread-based (FrankenPHP)**: Multiple threads within a single process sharing OpCache and allocated memory. ZTS (Zend Thread Safety) required. Lower per-thread overhead (~10-20MB).
- **Coroutine-based (Swoole)**: Multiple coroutines within a single OS thread. Cooperative scheduling (coroutines yield on I/O). Near-zero context switch overhead. ~1M+ coroutines on 1GB RAM.
- **Goroutine-based (RoadRunner)**: Go runtime manages goroutines (lightweight threads). PHP workers receive requests via Goridge binary protocol. Combines Go scheduler efficiency with standard PHP workers.

## When To Use

- Process-based (FPM): Multi-tenant hosting, legacy apps, maximum isolation requirements, teams without async expertise.
- Thread-based (FrankenPHP): Containerized deployments, operational simplicity, HTTP/3 needs, moderate concurrency.
- Coroutine-based (Swoole): High-latency I/O workloads, WebSocket servers, microservices with many concurrent connections.
- Goroutine-based (RoadRunner): High-throughput APIs, Laravel Octane, enterprise deployments requiring stability.

## When NOT To Use

- Process-based for sub-10ms latency requirements (bootstrap overhead dominates)
- Thread-based without ZTS-enabled PHP (not available in standard PHP builds)
- Coroutine-based for CPU-bound workloads (coroutines don't parallelize CPU work)
- Goroutine-based for very simple deployments where PHP-FPM suffices

## Best Practices (WHY)

- **Match model to workload**: Process for isolation, threads for moderate concurrency, coroutines for I/O-heavy, goroutines for throughput.
- **Consider team expertise**: Process-based (FPM) is universally understood. Coroutine-based (Swoole) requires async programming knowledge.
- **Measure overhead per concurrent unit**: Process: 30-80MB each. Thread: 10-20MB each. Coroutine: ~2KB each. Goroutine: ~4KB each.

## Architecture Guidelines

| Model | Isolation | Memory/Concurrent Unit | Context Switch | Max Concurrency |
|-------|-----------|----------------------|----------------|-----------------|
| Process | Complete | 30-80MB | OS scheduler (us) | Limited by RAM |
| Thread | Moderate | 10-20MB | OS scheduler (us) | RAM + thread count |
| Coroutine | Low | ~2KB | User-space (ns) | Near-unlimited |
| Goroutine | Moderate | ~4KB | Go runtime (ns) | Very high |

## Performance

- Process context switch: OS scheduler overhead, ~1-5us
- Coroutine switch: User-space yield, ~10-100ns
- Goroutine switch: Go runtime M:N scheduling, ~50-200ns
- Memory per concurrent unit determines maximum concurrency ceiling
- Coroutine advantage requires meaningful blocking time — with sub-1ms queries, coroutine overhead can make Swoole slower than FPM

## Security

- Process-based provides hardware-level isolation — a crash in one worker never affects others
- Thread-based shares memory within a process — one thread can corrupt shared state
- Coroutine-based shares everything within a thread — a memory corruption affects all coroutines
- Goroutine-based isolates PHP workers as separate processes — Go runtime handles scheduling safely

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using FPM for sub-50ms APIs | Familiarity, default setup | 3-15x slower than memory-resident | Use Octane (RoadRunner/FrankenPHP) |
| Using Swoole for fast queries | Assuming coroutines always help | 10% slower than FPM under 1ms I/O | Benchmark; coroutines need I/O wait |
| Not isolating tenants with FPM | Simplifying deployment | One tenant's crash kills all | Use separate FPM pools per tenant |
| ZTS not enabled for FrankenPHP | Using standard PHP build | Thread safety errors at runtime | Compile PHP with --enable-zts |

## Anti-Patterns

- **Using coroutines for CPU-bound work**: Coroutines don't parallelize CPU-bound code within a thread. Use multiple processes or threads for CPU parallelism.
- **Assuming "more workers = more throughput"**: Beyond the optimal point, additional workers increase context switching and memory pressure without throughput gain.
- **Ignoring state management in memory-resident models**: Static properties and singletons persist across requests. Audit all global state when migrating from FPM.

## Examples

```php
<?php
// Process-based (FPM) — each request is isolated
// No code change needed — FPM handles processes automatically

// Coroutine-based (Swoole) — concurrent I/O within a process
Co\run(function () {
    $results = [];
    for ($i = 0; $i < 10; $i++) {
        $results[] = go(function () use ($i) {
            // I/O operations here are non-blocking
            $data = http_request("https://api.example.com/data/$i");
            return $data;
        });
    }
});
```

## Related Topics

- Shared-Nothing Architecture
- Memory-Resident Architecture
- PHP-FPM Process Manager Modes
- Swoole Architecture
- FrankenPHP Worker Mode
- RoadRunner Architecture

## AI Agent Notes

- Concurrency model selection is the most impactful architectural decision for PHP performance.
- FPM (process-based) serves 80%+ of production deployments. Octane runways are growing.
- Coroutines excel under high-latency I/O; goroutines excel under high throughput.
- Context switch cost: coroutine < goroutine < process.
- The isolation vs efficiency tradeoff is fundamental — never assume one model is universally superior.

## Verification

- [ ] Concurrency model matched to workload characteristics (CPU vs I/O bound)
- [ ] Team has expertise to operate the chosen model
- [ ] Memory budget calculated for chosen concurrency model
- [ ] Isolation requirements satisfied by chosen model
- [ ] Benchmark validates model choice for specific workload
- [ ] State management implications understood for memory-resident models
