# Standardized Knowledge: eBPF PHP Profiling — Near-Zero Overhead, CPU Sampling, PID Scoping

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | eBPF PHP Profiling — Near-Zero Overhead, CPU Sampling, PID Scoping |
| Difficulty | Advanced |
| Lifecycle | Configure, Monitor, Diagnose |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

eBPF (extended Berkeley Packet Filter) enables kernel-level CPU sampling with near-zero overhead (<1%). Tools like Pyroscope and Parca use eBPF to capture stack traces of PHP processes without modifying PHP or installing a PHP extension. Sampling frequency: 99-199 Hz (configurable). PID scoping limits profiling to specific containers or PHP-FPM process IDs.

## Core Concepts

- **eBPF mechanism**: Attaches a BPF program to the `perf_event_open` kernel subsystem. At each timer interrupt, captures the current stack trace of the running process. User/kernel stacks resolved to function names.
- **PHP symbol resolution**: eBPF sees PHP JIT-compiled native code frames but NOT interpreted PHP opcode frames. For full PHP call stacks, pair eBPF with PHP-specific unwinding (Pyroscope's PHP SDK) or use USDT probes.
- **PID scoping**: `--pid 1234` or `--container-id abc` limits profiling to specific processes. Essential for multi-tenant environments and containerized deployments.
- **Advantages**: Zero PHP extension overhead. Works with any PHP version. Captures kernel-time stacks (syscalls, I/O wait). No impact on request latency.

## When To Use

- Production environments where any profiling overhead is unacceptable
- Always-on continuous profiling for baseline CPU monitoring
- Debugging kernel-level issues (syscall overhead, I/O wait, context switching)
- Containerized environments where PHP extension installation is restricted
- Complementing PHP-level profilers: eBPF for system-level, Blackfire/Tideways for PHP-level

## When NOT To Use

- When PHP function-level call stacks are required without JIT (eBPF sees native code frames only)
- When memory profiling is needed (eBPF does not capture PHP memory allocation or GC events)
- On non-Linux systems (eBPF is Linux-specific)
- On systems without BPF support (older kernels <4.9, restricted containers without CAP_BPF)
- When the team lacks Linux kernel troubleshooting skills

## Best Practices

- **Use eBPF + PHP profiler combo**: eBPF for always-on system-level CPU profiling (<1% overhead). Blackfire/Tideways for deep PHP call graph analysis when investigating specific endpoints.
- **Scope by PID or container**: In multi-tenant or containerized environments, always scope eBPF profiling to specific processes. Otherwise, you capture system-wide data including non-PHP processes.
- **Sample at 99 Hz**: Standard sampling frequency. Higher frequencies (199 Hz) provide more detail but more data storage. Lower frequencies (49 Hz) reduce overhead but may miss short-duration functions.
- **Manage data storage**: eBPF profiling at 99 Hz for 1000 processes generates ~100MB/hour. Configure retention and aggregation to manage storage costs.
- **Pair with PHP slow log for context**: eBPF shows wide frames but not which specific request caused them. Correlate with PHP-FPM slow log or APM transaction traces.

## Architecture Guidelines

- **Kernel-level sampling**: eBPF operates at the kernel level via `perf_event_open`. No PHP extension, no PHP process modification, no application code changes.
- **Stack unwinding**: eBPF walks the kernel and user-space stacks. For JIT-compiled PHP code, it can resolve native code frames. For interpreted PHP, it sees the PHP VM frames but not the PHP function names — unless paired with PHP SDK (Pyroscope) or USDT probes.
- **Data pipeline**: eBPF program → perf ring buffer → user-space agent (Pyroscope/Parca) → storage (files/S3/GCS) → query/visualization
- **Container support**: eBPF can profile containers by cgroup ID. Tools like Parca agent automatically discover containers in Kubernetes.

## Performance Considerations

- CPU overhead: <0.5% at 99 Hz regardless of PHP workload — lowest of all profiling approaches
- Memory overhead: ~50-100MB for the eBPF agent (Pyroscope/Parca)
- Storage: ~100MB/hour for 1000 processes at 99 Hz. Aggregation reduces this significantly.
- No impact on PHP request latency — eBPF runs in kernel context, not in PHP process
- eBPF cannot capture PHP memory allocation, GC events, or opcode cache stats — use PHP extensions for those

## Security

- eBPF profiling requires CAP_BPF, CAP_PERFMON, or root privileges — restrict access to security-critical systems
- eBPF programs run in kernel context — a malicious BPF program could impact system stability. Use signed BPF programs or restricted BPF (BPF_PROG_TYPE_PERF_EVENT only).
- Stack traces may contain sensitive function names and file paths — secure storage and dashboard access
- In multi-tenant environments, ensure PID scoping prevents cross-tenant data leakage
- eBPF agent (Pyroscope/Parca) should run with minimal required capabilities, not full root

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Expecting PHP function names without JIT | Assuming eBPF unwinds PHP opcode stacks | Seeing only PHP VM frames (execute_ex) instead of application functions | Pair eBPF with PHP SDK (Pyroscope) or use with JIT-enabled PHP |
| No PID scoping in multi-tenant environments | Copy-pasting eBPF commands without filtering | Profiling all processes on the host, including other tenants | Always use `--pid` or `--container-id` to scope profiling |
| Ignoring I/O-bound time | Focusing only on CPU flame graphs | Missing that the bottleneck is I/O wait, not CPU | Flame graph colors differentiate CPU (red) from I/O (blue) — check both |
| Insufficient sample duration | Running eBPF for 5 seconds | Noisy, unreliable data | Profile for 60+ seconds at 99 Hz for stable results |
| Not correlating eBPF with PHP slow log | Seeing wide frames without request context | Knowing something is slow but not which endpoint | Cross-reference eBPF wide frames with APM/ slow log data |

## Anti-Patterns

- **eBPF as sole profiler**: eBPF provides system-level CPU data but lacks PHP function context. Always pair with PHP-level profiling for actionable insights.
- **Unscoped system-wide profiling**: Running eBPF without PID/container scoping in shared environments captures irrelevant processes and wastes storage.
- **Expecting zero-overhead myth**: While <0.5% is near-zero, eBPF still consumes CPU and memory for the agent process. Account for this in capacity planning.
- **Ignoring JIT limitations**: eBPF sees native code frames from JIT-compiled PHP but not interpreted frames. If your PHP runs without JIT, eBPF flame graphs will show VM-level frames, not application-level.

## Examples

```bash
# Profile a specific PHP-FPM PID with Pyroscope
pyroscope connect --pid 1234 --sampling-frequency 99

# Profile all processes in a Docker container
pyroscope connect --container-id abc123 --sampling-frequency 99

# Profile with bpftrace (direct eBPF)
bpftrace -e 'profile:hz:99 /pid == 1234/ { @[ustack(100)] = count(); }'

# Parca agent in Kubernetes (annotations-based auto-discovery)
# Annotate PHP pod:
metadata:
  annotations:
    parca.dev/profiling: "true"

# View flame graph: Parca/Pyroscope UI → Flame Graph tab
# Check for wide red frames (CPU) → PHP native code hotspots
# Combine with: PHP slow log for request context
# Combine with: Tideways/Blackfire for PHP function call stacks

# Expected output: flame graph showing CPU distribution across:
# - PHP JIT-compiled functions (if JIT enabled)
# - Zend VM dispatch (execute_ex) for interpreted code
# - Kernel syscalls (read, write, poll) for I/O
# - libc functions for memory allocation
```

## Related Topics

- Flame Graph Generation and Interpretation
- Production Guardrails and Profiling Cost
- Blackfire Installation and Triggered Profiling
- Tideways Setup — Continuous Monitoring
- JIT Compilation and Performance

## AI Agent Notes

- eBPF has the lowest overhead (<0.5%) of any profiling approach — ideal for always-on production use
- eBPF sees JIT-compiled native code frames but NOT interpreted PHP opcode frames — requires JIT or PHP SDK for full PHP call stacks
- PID/container scoping is critical in multi-tenant environments
- Pair eBPF with PHP-level profilers (Tideways/Blackfire) for complete visibility
- eBPF captures kernel syscall stacks — uniquely valuable for identifying I/O wait patterns
- Storage management matters: ~100MB/hour for 1000 processes

## Verification

- [ ] eBPF agent (Pyroscope/Parca/bpftrace) installed and running on target system
- [ ] PID or container scoping configured to target PHP processes only
- [ ] Sampling frequency set to 99 Hz (standard) or adjusted for environment
- [ ] Flame graph generated showing CPU distribution across PHP and kernel stacks
- [ ] JIT mode checked: PHP function names visible (JIT-enabled) or VM frames only (no JIT)
- [ ] eBPF data correlated with PHP slow log or APM data for request context
- [ ] Storage retention configured for eBPF profiling data
- [ ] Agent running with minimal capabilities (not full root)
- [ ] Profiling overhead measured and confirmed <0.5% on target hosts
- [ ] eBPF + PHP profiler combo strategy documented and implemented
