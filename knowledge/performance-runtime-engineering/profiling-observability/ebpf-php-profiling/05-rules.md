## Use eBPF as a complement to PHP-level profilers, not a replacement
---
Category: Monitoring
---
Deploy eBPF-based profiling (Pyroscope, Parca) for always-on system-level CPU monitoring and pair it with PHP-level profilers (Tideways, Blackfire) for in-depth PHP call graph analysis during investigations.
---
Reason: eBPF captures kernel-level stack traces with <0.5% overhead — ideal for always-on production profiling. However, eBPF sees PHP JIT-compiled native code frames but not interpreted PHP opcode frames. Without JIT, eBPF flame graphs show Zend VM frames (execute_ex, execute_data) instead of application function names. PHP-level profilers see the full PHP call stack but have higher overhead. The combination provides continuous system visibility (eBPF) plus deep PHP analysis (Tideways/Blackfire) when needed.
---
Bad Example:
```bash
# eBPF only — missing PHP function context
# Flame graph shows: execute_ex at 80% CPU
# No application function names — can't identify the bottleneck
```

Good Example:
```bash
# eBPF + PHP profiler combo
# eBPF: always-on, <0.5% — detects CPU regressions
# Tideways: triggered on-demand — shows PHP call stacks for investigation
```
---
Exceptions: PHP applications with JIT enabled produce native code frames visible to eBPF, reducing the need for PHP-level profilers for CPU profiling.
---
Consequences Of Violation: Missing PHP function context in eBPF profiles, inability to identify application-level bottlenecks significantly slowing investigation time.

## Always scope eBPF profiling by PID or container ID in multi-tenant environments
---
Category: Configuration
```
Use `--pid` or `--container-id` flags when running eBPF profiling to limit data collection to specific PHP processes — never run unscoped eBPF on shared hosts.
---
Reason: Without PID scoping, eBPF captures stack traces for ALL processes on the host — including the kernel, system services, other containers, and other tenants' PHP processes. In a Kubernetes node running 20 pods, unscoped eBPF collects data from all 20, wasting storage on irrelevant profiles and mixing multiple applications' data. PID scoping ensures profiling data is relevant to the target application and avoids cross-tenant data contamination.
---
Bad Example:
```bash
# Unscoped — captures all processes on the host
pyroscope connect --sampling-frequency 99  # All processes, all tenants
```

Good Example:
```bash
# PID-scoped — targets specific PHP processes
pyroscope connect --pid 1234 --sampling-frequency 99
```
---
Exceptions: Dedicated single-tenant hosts may run unscoped profiling if profiling all processes is intentional.
---
Consequences Of Violation: Storage wasted on irrelevant process profiles, cross-tenant data contamination, privacy concerns from profiling other tenants' applications.

## Pair eBPF flame graphs with PHP slow log or APM data for request context
---
Category: Diagnostics
```
Cross-reference wide frames in eBPF flame graphs with PHP-FPM slow log entries or APM transaction traces to identify which specific endpoints caused the CPU hotspot.
---
Reason: eBPF flame graphs show aggregate CPU usage across all requests but don't identify which endpoint or request pattern caused a wide frame. A function showing 40% CPU in the eBPF flame graph could be from a single endpoint under heavy load or evenly distributed across all traffic. Without request context, you can identify the slow function but not which endpoint to optimize. Pairing with slow log or APM traces connects the CPU hotspot to the specific endpoint that triggers it.
---
Bad Example:
```bash
# eBPF flame graph shows wide frame — but which endpoint?
# ImageProcessor::resize at 60% CPU — is it /upload or /thumbnail?
```

Good Example:
```bash
# Cross-reference with slow log
# Slow log shows /upload endpoint hanging for 5 seconds
# eBPF shows ImageProcessor::resize at 60% CPU
# Conclusion: /upload endpoint triggers the CPU hotspot
```
---
Exceptions: Applications with a single endpoint or uniform request patterns may not need cross-referencing.
---
Consequences Of Violation: Know which function is slow but not which endpoint triggers it, leading to incomplete or incorrect optimization targets.

## Profile for 60+ seconds at 99 Hz for stable eBPF results
---
Category: Testing
```
Run eBPF profiling for a minimum of 60 seconds at 99 Hz sampling frequency to collect at least 5940 stack traces — shorter durations produce noisy, unreliable flame graphs.
---
Reason: At 99 Hz, each second collects 99 stack traces. In 10 seconds, only 990 traces are collected — insufficient for stable percentile estimates. Short functions that execute rarely may be missed entirely. At 60 seconds and ~6000 traces, the distribution stabilizes and rare but important code paths are captured. If the application has periodic behavior (cron jobs, GC cycles), longer profiling ensures these are captured.
---
Bad Example:
```bash
# 10-second profile — noisy, unreliable
pyroscope connect --pid 1234 --sampling-frequency 99  # 10 seconds
```

Good Example:
```bash
# 60+ second profile — stable results
pyroscope connect --pid 1234 --sampling-frequency 99  # 60 seconds
```
---
Exceptions: Investigating a transient CPU spike that lasts <30 seconds may require matching the profile duration to the spike duration.
---
Consequences Of Violation: Noisy flame graphs with unstable distributions, rare hot paths missed entirely, unreliable optimization decisions.

## Manage eBPF profiling data storage — ~100MB/hour for 1000 processes
---
Category: Maintainability
```
Plan storage capacity for eBPF profiling data at approximately 100MB/hour per 1000 profiled processes and configure retention and aggregation policies accordingly.
---
Reason: eBPF profiling generates significant data: stack traces at 99 Hz for hundreds of processes quickly accumulates. At 100MB/hour for 1000 processes, a Kubernetes cluster with 50 nodes running 20 pods each generates ~100GB/day of raw tracing data. Without storage planning, profiling fills the disk and causes service disruption. Configure aggregation (minute-level summaries retain trends, raw traces for 7 days) and retention policies to manage the data volume.
---
Bad Example:
```bash
# No storage planning — profiling fills disk
# Day 7: /data 100% full — profiling agent crashes, node alerts
```

Good Example:
```bash
# Storage planned
# Raw traces: 7 days retention
# Aggregated (1-min summaries): 90 days
# Disk allocation: 500GB for profiling data
```
---
Exceptions: Small deployments with <10 processes may not need aggressive retention management.
---
Consequences Of Violation: Profiling data fills disk, agent crashes, profiling stops, or emergency data deletion loses diagnostic information.
