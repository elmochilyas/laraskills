# KU-08-CONTEXT-SWITCHING: Context Switching

## Metadata
- **ID**: KU-08-CONTEXT-SWITCHING
- **Subdomain**: Compute Optimization
- **Topic**: Context Switching
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Context switching occurs when the CPU switches between processes (PHP workers, database connections, background tasks). Each switch has overhead: saving/loading registers, flushing TLBs, updating page tables. For Laravel servers, excessive context switching from over-allocated workers reduces effective throughput by 20-50%, meaning the same workload requires more servers. Proper worker sizing minimizes context switching overhead.

## Core Concepts
- **Context switch**: CPU switches from one process/thread to another; costs 1-100 microseconds
- **CPU-bound vs I/O-bound**: CPU-bound workloads benefit from workers = cores; I/O-bound can exceed cores because workers voluntarily yield during I/O waits
- **Nicing**: Adjusting process priority; queue workers should be lower priority than web workers
- **Run queue length**: Linux metric; processes waiting for CPU; consistently > 2x cores indicates over-allocation
- **Voluntary vs involuntary switches**: Voluntary = process yields (I/O wait); Involuntary = preempted (time slice expired)

## Mental Models
- Default: separate web and queue servers to minimize context switching
- Monitor vmstat run queue and context switch rate
- Use cgroups for CPU priority if servers must be shared

## Internal Mechanics
- Context switch cost: 1-100 microseconds per switch; 100000 switches/sec = 100-10000ms CPU overhead per second
- TLB flush cost: More expensive than raw switch time; degrades memory access for next process
- CPU cache pollution: Switching between processes evicts CPU cache; next process starts with cold cache
- Hyperthreading: 2 threads per core share execution units; context switching on hyperthreads has lower cost but also lower throughput
- PHP-FPM vs Octane: Octane has fewer context switches because same process handles many requests

## Patterns
- Monitor vmstat context switch rate
- Set workers to CPU cores for CPU-bound
- Use cgroups for resource limits
- Separate web and queue servers
- Set process affinity for Octane workers

## Architectural Decisions
- Web servers: Run only Nginx + PHP-FPM/Octane; no queue workers, cron jobs, or batch processing
- Queue servers: Dedicated instances for queue workers; lower priority, use Spot instances
- Batch processing servers: Separate from web and queue; scaling independent
- Monitor `/proc/stat` `ctxt` counter daily; trend indicates worker allocation health
- Use `taskset` for Octane worker CPU pinning in production

## Tradeoffs
**When To Use:**
- Context switch monitoring: Any server with constrained CPU or over-allocated workers
- Worker count reduction: When run queue length > 2 on production web servers
- Nice for queue workers: Lower priority for batch jobs to prioritize web responses
- CPU pinning: For Octane or dedicated processing servers
- I/O-heavy pool sizing: Can safely exceed CPU cores because workers yield during I/O

**When NOT To Use:**
- Ignoring context switching: Not relevant for under-utilized servers (<50% CPU)
- CPU pinning for shared servers: Fixed CPU affinity interferes with hypervisor scheduling
- Aggressive nicing: Setting all non-web processes to lowest priority may starve critical background tasks
- Overly complex optimization: For servers with 1000 req/s or less, focus on application-level optimization first

## Performance Considerations
- Context switch cost: 1-100 microseconds per switch; 100000 switches/sec = 100-10000ms CPU overhead per second
- TLB flush cost: More expensive than raw switch time; degrades memory access for next process
- CPU cache pollution: Switching between processes evicts CPU cache; next process starts with cold cache
- Hyperthreading: 2 threads per core share execution units; context switching on hyperthreads has lower cost but also lower throughput
- PHP-FPM vs Octane: Octane has fewer context switches because same process handles many requests

## Production Considerations
- Context switching rate can be used for side-channel attacks (timing differences in cache access)
- Process isolation: cgroups prevent runaway workers from affecting other processes
- Time-sharing: Ensure all processes get fair CPU time; don't starve monitoring agents
- Nice values can be manipulated by compromised workers; monitor for unexpected priority changes

## Common Mistakes
- **Running queue workers on web servers**: Serving HTTP + processing queues on same server (Cause: cost-saving by consolidating; Consequence: queue workers steal 30-50% CPU from web requests; effective server capacity halved; Better: separate servers, or use cgroups to limit queue worker CPU)
- **Ignoring run queue length**: CPU queue consistently > 2x cores but no action (Cause: not monitoring Linux scheduling metrics; Consequence: 20-40% throughput loss from context switching; Better: reduce workers or add servers when run queue > 2x cores)
- **Maximum workers always**: Setting max_children = 250 on 4-core server "in case of traffic spike" (Cause: "more is better" assumption; Consequence: 90% of CPU wasted on context switching between idle workers; Better: right-size workers, use Auto Scaling for traffic spikes)

## Failure Modes
- **Queue + web co-location**: Running queues on web servers to save costs (destroys web performance)
- **Workers = 10x CPU cores**: Extreme over-allocation with 40 workers on 4 cores
- **No CPU limit on workers**: Allowing batch processing to consume 100% CPU, starving web requests

## Ecosystem Usage
- **Web server (4 cores)**: 4-8 PHP-FPM workers; vmstat cs < 10000/sec; run queue < 2
- **Queue server (8 cores)**: 16 queue workers; context switches ~20000/sec (I/O heavy, voluntary switches)
- **Mixed server (anti-pattern)**: 4 cores running 6 Octane workers + 8 queue workers = 50000 cs/sec, run queue = 8

## Related Knowledge Units
- Worker Pool Sizing (ku-07)
- Queue Worker Scaling (ku-10)
- Server Provisioning (ku-02)

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.