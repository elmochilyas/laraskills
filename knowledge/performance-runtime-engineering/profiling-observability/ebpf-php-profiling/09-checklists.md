# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** eBPF PHP Profiling â€” Near-Zero Overhead, CPU Sampling, PID Scoping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use eBPF + PHP profiler combo**: eBPF for always-on system-level CPU profiling (<1% overhead). Blackfire/Tideways for deep PHP call graph analysis when investigating specific endpoints.
- [ ] **Scope by PID or container**: In multi-tenant or containerized environments, always scope eBPF profiling to specific processes. Otherwise, you capture system-wide data including non-PHP processes.
- [ ] **Sample at 99 Hz**: Standard sampling frequency. Higher frequencies (199 Hz) provide more detail but more data storage. Lower frequencies (49 Hz) reduce overhead but may miss short-duration functions.
- [ ] **Manage data storage**: eBPF profiling at 99 Hz for 1000 processes generates ~100MB/hour. Configure retention and aggregation to manage storage costs.
- [ ] **Pair with PHP slow log for context**: eBPF shows wide frames but not which specific request caused them. Correlate with PHP-FPM slow log or APM transaction traces.
- [ ] eBPF agent (Pyroscope/Parca/bpftrace) installed and running on target system
- [ ] PID or container scoping configured to target PHP processes only
- [ ] Sampling frequency set to 99 Hz (standard) or adjusted for environment
- [ ] Flame graph generated showing CPU distribution across PHP and kernel stacks
- [ ] JIT mode checked: PHP function names visible (JIT-enabled) or VM frames only (no JIT)
- [ ] eBPF agent deployed with <0.5% overhead on all target hosts
- [ ] PID/container scoping prevents cross-tenant data contamination
- [ ] Flame graphs produced and correlated with APM/slow log for context
- [ ] Storage managed with retention policies
- [ ] eBPF + PHP profiler combo strategy documented
- [ ] eBPF agent installed and running
- [ ] PID or container scoping configured
- [ ] Sampling frequency set to 99 Hz
- [ ] Flame graph generated showing CPU distribution
- [ ] eBPF data correlated with PHP slow log or APM

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Kernel-level sampling**: eBPF operates at the kernel level via `perf_event_open`. No PHP extension, no PHP process modification, no application code changes.
- [ ] **Stack unwinding**: eBPF walks the kernel and user-space stacks. For JIT-compiled PHP code, it can resolve native code frames. For interpreted PHP, it sees the PHP VM frames but not the PHP function names â€” unless paired with PHP SDK (Pyroscope) or USDT probes.
- [ ] **Data pipeline**: eBPF program â†’ perf ring buffer â†’ user-space agent (Pyroscope/Parca) â†’ storage (files/S3/GCS) â†’ query/visualization
- [ ] **Container support**: eBPF can profile containers by cgroup ID. Tools like Parca agent automatically discover containers in Kubernetes.
- [ ] Document and follow through on architectural decision: eBPF profiling adoption
- [ ] Ensure architecture aligns with core concept: **eBPF mechanism**: Attaches a BPF program to the `perf_event_open` kernel subsystem. At each timer interrupt, captures the current stack trace of the running process. User/kernel stacks resolved to function names.
- [ ] Ensure architecture aligns with core concept: **PHP symbol resolution**: eBPF sees PHP JIT-compiled native code frames but NOT interpreted PHP opcode frames. For full PHP call stacks, pair eBPF with PHP-specific unwinding (Pyroscope's PHP SDK) or use USDT probes.
- [ ] Ensure architecture aligns with core concept: **PID scoping**: `--pid 1234` or `--container-id abc` limits profiling to specific processes. Essential for multi-tenant environments and containerized deployments.
- [ ] Ensure architecture aligns with core concept: **Advantages**: Zero PHP extension overhead. Works with any PHP version. Captures kernel-time stacks (syscalls, I/O wait). No impact on request latency.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use eBPF + PHP profiler combo**: eBPF for always-on system-level CPU profiling (<1% overhead). Blackfire/Tideways for deep PHP call graph analysis when investigating specific endpoints.
- [ ] **Scope by PID or container**: In multi-tenant or containerized environments, always scope eBPF profiling to specific processes. Otherwise, you capture system-wide data including non-PHP processes.
- [ ] **Sample at 99 Hz**: Standard sampling frequency. Higher frequencies (199 Hz) provide more detail but more data storage. Lower frequencies (49 Hz) reduce overhead but may miss short-duration functions.
- [ ] **Manage data storage**: eBPF profiling at 99 Hz for 1000 processes generates ~100MB/hour. Configure retention and aggregation to manage storage costs.
- [ ] **Pair with PHP slow log for context**: eBPF shows wide frames but not which specific request caused them. Correlate with PHP-FPM slow log or APM transaction traces.

# Performance Checklist (from 04/06)
- [ ] CPU overhead: <0.5% at 99 Hz regardless of PHP workload â€” lowest of all profiling approaches
- [ ] Memory overhead: ~50-100MB for the eBPF agent (Pyroscope/Parca)
- [ ] Storage: ~100MB/hour for 1000 processes at 99 Hz. Aggregation reduces this significantly.
- [ ] No impact on PHP request latency â€” eBPF runs in kernel context, not in PHP process
- [ ] eBPF cannot capture PHP memory allocation, GC events, or opcode cache stats â€” use PHP extensions for those
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] eBPF profiling requires CAP_BPF, CAP_PERFMON, or root privileges â€” restrict access to security-critical systems
- [ ] eBPF programs run in kernel context â€” a malicious BPF program could impact system stability. Use signed BPF programs or restricted BPF (BPF_PROG_TYPE_PERF_EVENT only).
- [ ] Stack traces may contain sensitive function names and file paths â€” secure storage and dashboard access
- [ ] In multi-tenant environments, ensure PID scoping prevents cross-tenant data leakage
- [ ] eBPF agent (Pyroscope/Parca) should run with minimal required capabilities, not full root

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
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
- [ ] eBPF agent deployed with <0.5% overhead on all target hosts
- [ ] PID/container scoping prevents cross-tenant data contamination
- [ ] Flame graphs produced and correlated with APM/slow log for context
- [ ] Storage managed with retention policies
- [ ] eBPF + PHP profiler combo strategy documented
- [ ] eBPF agent installed and running
- [ ] PID or container scoping configured
- [ ] Sampling frequency set to 99 Hz
- [ ] Flame graph generated showing CPU distribution
- [ ] eBPF data correlated with PHP slow log or APM
- [ ] Storage retention configured (7 days raw, 90 days aggregated)
- [ ] Agent running with minimal capabilities

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use eBPF + PHP profiler combo**: eBPF for always-on system-level CPU profiling (<1% overhead). Blackfire/Tideways for deep PHP call graph analysis when investigating specific endpoints.
- [ ] **Scope by PID or container**: In multi-tenant or containerized environments, always scope eBPF profiling to specific processes. Otherwise, you capture system-wide data including non-PHP processes.
- [ ] **Sample at 99 Hz**: Standard sampling frequency. Higher frequencies (199 Hz) provide more detail but more data storage. Lower frequencies (49 Hz) reduce overhead but may miss short-duration functions.
- [ ] **Manage data storage**: eBPF profiling at 99 Hz for 1000 processes generates ~100MB/hour. Configure retention and aggregation to manage storage costs.
- [ ] **Pair with PHP slow log for context**: eBPF shows wide frames but not which specific request caused them. Correlate with PHP-FPM slow log or APM transaction traces.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Expecting PHP function names without JIT
- [ ] Avoid: No PID scoping in multi-tenant environments
- [ ] Avoid: Ignoring I/O-bound time
- [ ] Avoid: Insufficient sample duration
- [ ] Avoid: Not correlating eBPF with PHP slow log
- [ ] Avoid anti-pattern: **eBPF as sole profiler**: eBPF provides system-level CPU data but lacks PHP function context. Always pair with PHP-level profiling for actionable insights.
- [ ] Avoid anti-pattern: **Unscoped system-wide profiling**: Running eBPF without PID/container scoping in shared environments captures irrelevant processes and wastes storage.
- [ ] Avoid anti-pattern: **Expecting zero-overhead myth**: While <0.5% is near-zero, eBPF still consumes CPU and memory for the agent process. Account for this in capacity planning.
- [ ] Avoid anti-pattern: **Ignoring JIT limitations**: eBPF sees native code frames from JIT-compiled PHP but not interpreted frames. If your PHP runs without JIT, eBPF flame graphs will show VM-level frames, not application-level.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **eBPF mechanism**: Attaches a BPF program to the `perf_event_open` kernel subsystem. At each timer interrupt, captures the current stack trace of the running process. User/kernel stacks resolved to function names., **PHP symbol resolution**: eBPF sees PHP JIT-compiled native code frames but NOT interpreted PHP opcode frames. For full PHP call stacks, pair eBPF with PHP-specific unwinding (Pyroscope's PHP SDK) or use USDT probes., **PID scoping**: `--pid 1234` or `--container-id abc` limits profiling to specific processes. Essential for multi-tenant environments and containerized deployments., **Advantages**: Zero PHP extension overhead. Works with any PHP version. Captures kernel-time stacks (syscalls, I/O wait). No impact on request latency.
**Skills:** Flame Graph Generation and Interpretation, Production Guardrails and Profiling Cost, Blackfire Installation and Triggered Profiling, Tideways Setup â€” Continuous Monitoring
**Decision Trees:** eBPF profiling adoption
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Flame Graph Generation and Interpretation, Production Guardrails and Profiling Cost, Blackfire Installation and Triggered Profiling, Tideways Setup â€” Continuous Monitoring, JIT Compilation and Performance

