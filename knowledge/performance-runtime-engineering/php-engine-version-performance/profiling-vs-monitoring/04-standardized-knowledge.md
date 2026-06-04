# Standardized Knowledge: Profiling vs Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Profiling vs Monitoring |
| Difficulty | Foundation |
| Lifecycle | Diagnose, Observe |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

**Profiling** captures detailed execution snapshots (call stacks, memory allocation, timing) for deep analysis of specific requests. **Monitoring** aggregates summary metrics (average latency, error rate, CPU/memory) continuously across all traffic. Profiling answers "why is this slow?" Monitoring answers "is the system healthy?" Both are essential and serve different purposes.

## Core Concepts

- **Profiling tools**: Xdebug (cachegrind output), Blackfire (triggered production profiling), Tideways (sampled continuous profiling), SPX (self-hosted), XHProf (legacy).
- **Monitoring tools**: APM agents (New Relic, Datadog), server metrics (CPU, RAM, disk I/O), application metrics (request rate, latency percentiles, error rate).
- **Profiling granularity**: Function-level inclusive/exclusive time, memory allocation per call, call count.
- **Monitoring granularity**: Aggregated metrics over time windows (1s, 1m, 5m), percentile distributions, threshold-based alerts.

## When To Use

- Profiling: Debugging specific performance regressions, identifying optimization targets, analyzing hot code paths.
- Monitoring: Always-on observability, alerting on degradation, capacity planning, SLA tracking.

## When NOT To Use

- Profiling for always-on observability (too expensive — use monitoring for that)
- Monitoring for deep root cause analysis (monitoring tells you what is slow, not why)
- Xdebug profiling in production (50-200% overhead — use sampling profilers like Blackfire or Tideways)
- Monitoring without profiling (you'll know something is slow but not why)

## Best Practices (WHY)

- **Profile first, then monitor**: Use profiling to identify the root cause of a regression; deploy monitoring to ensure it stays fixed. Never guess at bottlenecks.
- **Use sampling profilers in production**: Xdebug is for development only. Blackfire (2-5%) and Tideways (1-3%) are safe for production.
- **Monitor the right metrics**: p50/p95/p99 latency, error rate, CPU utilization, memory usage, FPM listen queue, OpCache hit rate.
- **Correlate profiling with monitoring**: When monitoring detects a regression, trigger a profiling session to identify the root cause.

## Architecture Guidelines

- **Camera model**: Profiling is taking slow-motion video of your code. Flame graphs are the video frames. Inclusive time is the actor's total screen time including supporting cast. Exclusive time is the actor's solo performance.
- **Tiered profiling workflow**: 1) Production monitoring -> identify slow endpoints via APM, 2) Flame graph generation -> identify wide frames, 3) Call graph analysis -> follow the hot path, 4) Source-level profiling -> inspect specific functions, 5) Fix -> deploy -> verify.

## Performance

- Xdebug profiling: 50-200% overhead — development/staging only
- Blackfire: 2-5% overhead — safe for production in sampling mode
- Tideways: 1-3% overhead — safe for production with sampling rate control
- SPX: <5% overhead — safe for production when triggered on-demand
- eBPF: <1% overhead — ideal for continuous production profiling

## Security

- Profiling data reveals internal code paths and function names — restrict access to authorized personnel
- Production profiling data should be stored with the same sensitivity as logs
- Never expose raw profiling files on public endpoints
- eBPF profiling requires CAP_BPF or root — restrict access accordingly

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Xdebug in production | Convenience, familiarity | 50-200% overhead, performance collapse | Use sampling profilers (<5% overhead) for production |
| Only monitoring, never profiling | Believing monitoring is sufficient | Know something is slow but not why | Use profiling to diagnose when monitoring alerts |
| Profiling without a hypothesis | Exploratory profiling | Information overload, wasted time | Have a specific question before profiling |
| Ignoring profiling overhead | Assuming all tools are equal | Production degradation from heavy profilers | Measure overhead before continuous profiling |

## Anti-Patterns

- **Relying solely on monitoring**: p95 spikes tell you something is wrong but not what. Always pair monitoring with profiling capability.
- **Using profiling as monitoring**: Profiling every request in production is too expensive. Profile selectively (triggered or sampled).
- **Guessing at bottlenecks**: Without profiling data, optimization targets are guesses. Measure first, optimize second.

## Examples

```bash
# Monitoring: Check FPM status page
curl http://localhost/fpm-status?json

# Profiling: Trigger SPX profile
curl http://localhost/endpoint?SPX_KEY=key&SPX_PROFILE=1

# Monitoring: Check OpCache status
php -r "print_r(opcache_get_status());"

# Profiling: Xdebug in development
php -d xdebug.mode=profile script.php
```

## Related Topics

- Flame Graph Interpretation
- Callgraph Analysis Techniques
- Inclusive vs Exclusive Time Analysis
- Production Guardrails for Profiling
- APM Integration Patterns

## AI Agent Notes

- Profiling = deep dive on specific requests. Monitoring = continuous health tracking.
- Profile first, then monitor: use profiling to find the root cause, monitoring to keep it fixed.
- Never use Xdebug in production (50-200% overhead).
- eBPF is the best option for continuous production profiling (<1% overhead).
- Always pair profiling capability with monitoring alerts.

## Verification

- [ ] Monitoring system in place for key metrics (latency, error rate, CPU, memory)
- [ ] Sampling profiler available for production use (Blackfire, Tideways, or SPX)
- [ ] Xdebug used only in development/staging environments
- [ ] Profiling workflow defined for incident response
- [ ] Monitoring alerts trigger profiling sessions for root cause analysis
- [ ] Profiling data access restricted to authorized personnel
