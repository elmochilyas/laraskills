# Standardized Knowledge: Architecture Model Differences

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Architecture Model Differences |
| Difficulty | Foundation |
| Lifecycle | Design, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

All alternative runtimes implement a memory-resident model (boot-once, handle-many) but through different mechanisms: Swoole uses coroutines within PHP processes, RoadRunner uses Go goroutines dispatching to PHP workers, FrankenPHP uses PHP threads via ZTS + CGO, and ReactPHP/AMPHP use userspace event loops within a single PHP process.

## Core Concepts

- **Swoole**: PHP process boots, creates event loop, spawns coroutine per request. Coroutines yield on I/O (auto-hooked). All state is in-process PHP memory. Multiple worker processes for CPU scaling.
- **RoadRunner**: Go process manages goroutines. Each request is dispatched to a PHP worker via Goridge binary protocol. PHP workers are separate processes. Go handles I/O multiplexing; PHP handles business logic.
- **FrankenPHP**: Single Go binary embeds PHP via CGO. Thread pool manages concurrent requests. Each thread is a full PHP interpreter instance (ZTS required). Threads share OpCache but have separate request memory.
- **ReactPHP/AMPHP**: Single PHP process runs an event loop. ReactPHP uses callbacks; AMPHP uses fibers for structured concurrency. No process/thread isolation — one slow callback blocks everything.

## When To Use

- Understanding the fundamental architectural differences between runtimes before selection
- Designing a multi-runtime architecture where different microservices use different concurrency models
- Evaluating the isolation and memory tradeoffs between process, thread, and coroutine models
- Planning a migration path from PHP-FPM to a memory-resident runtime

## When NOT To Use

- When a single runtime has already been selected and deployed — focus on that runtime's specific configuration
- For teams that only need operational guidance on their current runtime
- When the architectural differences don't affect the specific workload (e.g., both RoadRunner and FrankenPHP work equally well)

## Best Practices

- **Match concurrency model to isolation requirements**: Processes (FPM/RoadRunner) provide the strongest isolation. Threads (FrankenPHP) share memory. Coroutines (Swoole) share thread memory.
- **Understand the bottleneck before choosing**: Swoole resolves I/O bottlenecks. RoadRunner resolves bootstrap bottlenecks. FrankenPHP resolves infrastructure complexity bottlenecks.
- **Consider the deployment artifact**: Single binary (FrankenPHP) vs Go binary + PHP workers (RoadRunner) vs PHP extension (Swoole) — each has different CI/CD implications.
- **Plan for operational tooling**: Each runtime requires different monitoring, logging, and debugging approaches. Ensure your toolchain supports the chosen model.

## Architecture Guidelines

- **Process Model (PHP-FPM, RoadRunner PHP workers)**: Each worker is a separate OS process. Max isolation, highest memory per worker. Crash isolation — one worker crash doesn't affect others.
- **Thread Model (FrankenPHP)**: Threads share address space within a process. Lower memory per worker, shared OpCache. Crash risk — one thread crash can crash all threads in the process.
- **Coroutine Model (Swoole)**: Coroutines share thread memory. Lowest memory per request. Cooperative multitasking — one blocking call blocks all coroutines on that thread.
- **Event Loop Model (ReactPHP/AMPHP)**: Single thread, non-blocking I/O. Lowest overhead but no parallelism. One slow callback blocks everything.

## Performance Considerations

- **Swoole**: Best for high-latency I/O (>50ms DB queries). Coroutine overhead ~1µs per yield point.
- **RoadRunner**: Best all-around. Goroutine scheduler efficient even with minimal I/O. 41-111% improvement over FPM.
- **FrankenPHP**: Best for container deployments. Single binary replaces Nginx/PHP-FPM/certbot. Thread pool overhead ~5-10%.
- **ReactPHP/AMPHP**: Best for CLI tools and streaming. Single-threaded bottleneck limits web serving throughput.

## Security Considerations

- Process isolation (FPM, RoadRunner) provides the strongest security boundary. A compromise in one worker cannot access another worker's memory.
- Thread isolation (FrankenPHP) is weaker — threads share the same address space. A memory safety issue can compromise the entire process.
- Coroutine isolation (Swoole) is the weakest — coroutines share thread memory. A coroutine that corrupts memory affects all coroutines on that thread.
- Event loop (ReactPHP/AMPHP) has no isolation — any bug affects the entire application.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not understanding isolation implications | Focusing only on throughput numbers | Incorrect runtime selection for security requirements | Map isolation requirements to concurrency model |
| Assuming coroutines are always better | Reading benchmark-focused articles | Performance regression under wrong workload | Match concurrency model to workload I/O profile |
| Ignoring deployment complexity differences | Not factoring CI/CD pipeline | Extended deployment times, operational incidents | Evaluate deployment artifacts for each runtime |
| Missing ZTS requirements for FrankenPHP | Assuming all PHP builds are compatible | Segfaults at startup under concurrent load | Verify ZTS compilation before FrankenPHP evaluation |

## Anti-Patterns

- **Mixing concurrency models in the same application process**: Running Swoole coroutines with ReactPHP event loops in the same process causes scheduling conflicts.
- **Assuming process model is always safest**: Processes have higher overhead and slower context switches. Threads and coroutines are more efficient for many workloads.
- **Ignoring the evolution of models**: FrankenPHP's thread model has different characteristics than traditional threaded PHP. Don't assume limitations from the ZTS legacy apply equally.
- **Choosing a model based on a single dimension**: Evaluate isolation, performance, memory, and operational complexity together.

## Examples

```
Architecture Comparison:
+----------------+----------+-----------+-----------+
| Runtime        | Concurrency | Memory | Isolation |
+----------------+----------+-----------+-----------+
| PHP-FPM        | Process  | High     | Strongest |
| RoadRunner     | Goroutine | Medium | Strong    |
| FrankenPHP     | Thread   | Low      | Medium    |
| Swoole         | Coroutine| Lowest   | Weakest   |
| ReactPHP/AMPHP | EventLoop| Low      | None      |
+----------------+----------+-----------+-----------+
```

## Related Topics

- Runtime Comparison Overview
- Runtime Selection Decision Tree
- PHP-FPM Worker Management
- Laravel Octane Driver Selection

## AI Agent Notes

- The four concurrency models (process, thread, coroutine, event loop) have distinct isolation and memory tradeoffs.
- Swoole's coroutine model provides the lowest memory per request but requires coroutine-safe libraries.
- FrankenPHP's thread model shares OpCache across threads, reducing total memory vs process-based models.
- RoadRunner's hybrid model (goroutines + PHP processes) combines Go networking efficiency with PHP process isolation.
- ReactPHP/AMPHP are not suitable for high-throughput web serving — they're best for CLI tools and streaming.

## Verification

- [ ] Concurrency model mapped to isolation requirements
- [ ] Workload I/O profile analyzed for model selection
- [ ] Deployment artifact implications understood for chosen model
- [ ] Monitoring approach adapted to concurrency model
- [ ] Team training covers chosen model's specific patterns
- [ ] Rollback plan accounts for model-specific complexity
