# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Profiling & Observability
Knowledge Unit: eBPF PHP Profiling — Near-Zero Overhead, CPU Sampling, PID Scoping
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

**eBPF** (extended Berkeley Packet Filter) enables kernel-level CPU sampling with **near-zero overhead** (<1%). Tools like Pyroscope and Parca use eBPF to capture stack traces of PHP processes without modifying PHP or installing a PHP extension. Sampling frequency: 99-199 Hz (configurable). PID scoping limits profiling to specific containers or PHP-FPM process IDs.

---

# Core Concepts

- **eBPF mechanism**: Attaches a BPF program to the `perf_event_open` kernel subsystem. At each timer interrupt, captures the current stack trace of the running process. User/kernel stacks resolved to function names.
- **PHP symbol resolution**: eBPF sees PHP JIT-compiled native code frames but NOT interpreted PHP opcode frames. For full PHP call stacks, pair eBPF with PHP-specific unwinding (Pyroscope's PHP SDK) or use USDT probes.
- **PID scoping**: `--pid 1234` or `--container-id abc` limits profiling to specific processes. Essential for multi-tenant environments and containerized deployments.
- **Advantages**: Zero PHP extension overhead. Works with any PHP version. Captures kernel-time stacks (syscalls, I/O wait). No impact on request latency.

---

# Patterns

**eBPF + PHP profiler combo**: Use eBPF for always-on system-level CPU profiling (<1% overhead). Use Blackfire/Tideways for deep PHP call graph analysis when a specific endpoint needs investigation.

---

# Performance Considerations

- eBPF sampling at 99 Hz: <0.5% CPU overhead regardless of PHP workload
- Storage: ~100MB/hour for 1000 processes at 99 Hz. Manage retention.
- eBPF does not capture PHP memory allocation or GC events. Use PHP extensions for memory profiling.

---

# Common Mistakes

- Using Xdebug in production: adds 50-200% overhead; use sampling profilers (SPX, Tideways)
- Profiling without representative traffic: profiles of idle systems miss real bottlenecks
- Ignoring I/O-bound time: flame graphs show wide bars for I/O wait; optimize queries before CPU
- Not sampling enough requests: single-request profiles are misleading; sample 100+ per endpoint
- Forgetting profiling overhead: profiling reduces throughput; account for 5-25% overhead

---

# Related Knowledge Units

Blackfire Installation | Tideways Setup | Production Guardrails and Profiling Cost

---

## Mental Models

**Camera model**: Profiling is taking slow-motion video of your code. Flame graphs are the video frames â€” width shows how long each actor (function) is on screen. Inclusive time is the actor's total screen time including supporting cast. Exclusive time is the actor's solo performance. Comparing p50 to p95 flame graphs is watching the video at different playback speeds.

---

## Internal Mechanics

Sampling profilers (Xdebug, Tideways, Blackfire) register a timer signal handler (SIGPROF, typically at 49-100 Hz) that interrupts PHP execution and records the current execute_data stack trace via zend_execute_data->prev_execute_data chain. Each sample captures function name, file, line, and inclusive/exclusive time markers. The samples are aggregated into a call graph where node weight = sample count. Xdebug 3 uses a request-level profiler (xdebug.mode=profile) that writes cachegrind-format files. eBPF profiling attaches kprobes to Zend VM dispatch functions (execute_ex, zend_call_function) from kernel space, requiring zero PHP configuration.

---

## Patterns

**Tiered profiling workflow**: 1) Production monitoring â†’ identify slow endpoints via APM, 2) Flame graph generation â†’ identify wide frames (time sinks), 3) Call graph analysis â†’ follow the hot path, 4) Source-level profiling â†’ inspect specific functions, 5) Fix â†’ deploy â†’ verify with same flame graph comparison.

---

## Architectural Decisions

- **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead â€” development/staging only.
- **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth â€” always validate staging findings against production.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Xdebug (sampling) | Low overhead, free | ~3-5% CPU overhead, cachegrind files |
| Blackfire | Production-safe, rich UI | Paid tier, proprietary format |
| Tideways | Continuous monitoring | Subscription cost, integration effort |
| eBPF | Zero PHP overhead, no configuration | Linux-only, requires kernel support |

---

## Production Considerations

- **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

---

## Failure Modes

- **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.

---

## Ecosystem Usage

- **Tideways**: Production profiling SaaS. Low overhead (1-3%). Continuous profiling with monitoring dashboard. PHP extension + API. Ideal for ongoing performance monitoring.
- **Blackfire**: Profiling and testing platform by Symfony. Triggered profiling (via browser extension or CLI). APM features in higher tiers. Rich comparison between profile runs.
- **Xdebug**: Open-source step debugger and profiler. Profiling mode generates cachegrind files. View with KCacheGrind, QCacheGrind, or WebGrind. Best for development profiling.
- **eBPF**: Linux kernel tracing. PHP profiling via uprobe attach to Zend VM functions. Tools like Pixie, Parca, and bpftrace. Zero PHP overhead â€” best for production.

---

## Research Notes

- eBPF for PHP profiling: Active research area. Tools like Parca, Pixie, and bpftrace enable kernel-level profiling without PHP extension overhead. Current limitations: function name resolution in JIT-compiled code, coroutine-aware stack unwinding.
- Continuous profiling: Industry trend toward always-on profiling (instead of triggered). Google's OpenProfiling and Polar Signals show that continuous profiles catch regressions missed by traditional monitoring.
- Flame graph evolution: Brendan Gregg's original flame graphs now include icicle graphs (inverted), flame charts (time-series), and differential flame graphs (before/after comparison).
