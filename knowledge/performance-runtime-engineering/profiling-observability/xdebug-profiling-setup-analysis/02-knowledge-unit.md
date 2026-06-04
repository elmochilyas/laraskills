# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Profiling & Observability
Knowledge Unit: Xdebug Profiling Setup and Analysis — cachegrind Output, KCacheGrind Visualization
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Xdebug generates **cachegrind**-format profiling files containing per-function inclusive/exclusive time and call counts. Visualize with KCacheGrind (Linux), QCacheGrind (Windows/Mac), or PHPStorm's built-in profiler. Xdebug is a **development-only** tool — its profiling mode adds 50-200% overhead, prohibitive for production.

---

# Core Concepts

- **Setup**: `xdebug.mode=profile`, `xdebug.output_dir=/tmp/profiling`, `xdebug.profiler_output_name=cachegrind.out.%p`. Restart PHP-FPM. Trigger a request. Output file appears in configured directory.
- **cachegrind format**: Flat text format: `fl=file.php`, `fn=functionName`, `cfn=caller`, `calls=N`, line numbers with inclusive/exclusive time. Readable but best viewed in GUI tools.
- **KCacheGrind / QCacheGrind**: Visualize as: call graph (callee map), flat profile (sorted by inclusive/exclusive time), call tree (parent-child cost), source annotation (cost per line).
- **Inclusive vs exclusive time**: Inclusive = time inside function INCLUDING its callees. Exclusive = time only inside function, excluding callees. Hotspots are functions with high inclusive time AND high exclusive time.

---

# Patterns

**Xdebug workflow**: 1) Identify slow endpoint, 2) Hit it once with Xdebug profiling, 3) Open cachegrind file in KCacheGrind, 4) Sort by inclusive time descending, 5) Identify top 5 functions, 6) Click to see source annotation.

---

# Common Mistakes

**Xdebug profiler in production**: Xdebug profiling adds 50-200% overhead. Never enable in production. Use Blackfire or Tideways for production profiling.

---

# Performance Considerations

- Xdebug adds 50-200% overhead; use for staging only. Blackfire adds 10-25% overhead.
- SPX, Tideways add 1-5% overhead; suitable for production with sampling rate and IP restrictions
- Flame graph width = inclusive time, red = CPU-bound, blue = I/O-bound; look for plateaus
- eBPF profiling: kernel-level with <1% overhead; captures PHP + system calls; PHP 8.1+ required
- Production strategy: sample 1% of requests; disable during peak hours; correlate with slow logs

---

# Related Knowledge Units

Blackfire Installation | Tideways Setup | Flame Graph Interpretation | Inclusive vs Exclusive Time

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
