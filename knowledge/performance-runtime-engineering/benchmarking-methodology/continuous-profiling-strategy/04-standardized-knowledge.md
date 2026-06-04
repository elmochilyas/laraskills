# Standardized Knowledge: Continuous Profiling Strategy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Continuous Profiling Strategy |
| Difficulty | Enterprise |
| Lifecycle | Operate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Continuous profiling runs lightweight sampling (1-5 Hz) on all production hosts to establish baseline behavior. When an SLO breach is detected, sampling rate increases to 50-100 Hz (burst mode) on affected hosts to capture detailed diagnostic data. This approach minimizes profiling overhead during normal operation while providing rich data during incidents.

## Core Concepts

- **Baseline Sampling (1-5 Hz)**: Always-on, minimal overhead (<2% CPU). Collects CPU-hot functions, memory allocation hot spots, lock contention, GC activity. Establishes normal profiles by service endpoint.
- **Burst Sampling (50-100 Hz)**: Triggered by SLO breach alerts. Captures detailed flame graphs during the incident window. Auto-disables when SLO is restored. Data preserved for post-mortem analysis.
- **Tools**: Pyroscope (open source flame graphs), Parca (open source, eBPF-based), Blackfire (triggered production profiling), Tideways (always-on APM).
- **Profile Comparison**: Compare burst profile against baseline profile. The difference highlights what changed — new slow path, increased contention, memory leak onset.

## When To Use

- Production performance monitoring with minimal overhead
- Incident response — capturing diagnostic data during SLO breaches
- Capacity planning — identifying growth trends in resource consumption
- Regression investigation — comparing profiles before and after deployments

## When NOT To Use

- Development profiling where high overhead is acceptable (use Xdebug)
- Systems where profiling is not permitted by security policy
- Very small deployments where the profiling infrastructure overhead is disproportionate
- Environments where the profiling agent is not available for the runtime

## Best Practices

- **Adaptive sampling**: Sampling rate increases proportionally to error budget burn rate. 1x burn: 1 Hz. 5x burn: 10 Hz. 10x burn: 50 Hz. 20x burn: 100 Hz + immediate canary deployment.
- **Profile all production hosts**: Baseline profiles from all hosts establish normal behavior. Without baselines, you can't identify what changed during an incident.
- **Store profiles for comparison**: Keep profiles for 30+ days for historical comparison. Flame graph diffing between last week and today quickly reveals regressions.
- **Exclude health checks from profiling**: Health check endpoints generate traffic that dilutes profile data. Use endpoint filtering to focus on user-facing requests.
- **Integrate profiling with alerting**: When an alert fires, automatically trigger burst sampling on affected hosts. Include profile links in the alert notification.

## Architecture Guidelines

- **Sampling Profiler Mechanics**: Sampling profilers capture stack traces at intervals. 1 Hz captures 1 trace per second. 100 Hz captures 100 traces per second. The percentage of traces in each function approximates CPU time spent there.
- **eBPF-Based Profiling**: eBPF profilers (Parca, Pyroscope's eBPF mode) sample at the kernel level with near-zero overhead. They don't require code instrumentation. Best for always-on production profiling.
- **Agent-Based Profiling**: Blackfire and Tideways use PHP extensions to capture profiles. Higher overhead than eBPF but richer data (memory allocation, function arguments, database queries).
- **Storage and Retention**: Profiles generate significant data. 1 Hz sampling on 100 hosts produces ~8.6M stack traces per day. Store raw profiles for 7 days, aggregated profiles for 30+ days.

## Performance Considerations

- 1-5 Hz sampling: <2% CPU overhead. Safe for always-on production use.
- 50-100 Hz sampling: 5-10% CPU overhead. Use only during incident periods.
- eBPF profiling: <1% overhead. Lowest-cost profiling option available.
- Agent-based profiling: 2-15% overhead depending on tool and configuration.

## Security Considerations

- Profile data includes function names, file paths, and sometimes variable values. This may leak sensitive information. Restrict profile database access.
- Continuous profiling infrastructure is a high-value target — it has access to all production hosts.
- eBPF profiling requires kernel-level access (CAP_BPF or root). Secure the profiling agent appropriately.
- Profile data retention policies should align with data privacy requirements.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running high-frequency profiling continuously | Not understanding overhead | 5-10% CPU waste across all hosts | Use adaptive sampling — low in normal operation, high during incidents |
| No baseline profiles | Starting profiling only during incidents | Nothing to compare against, can't identify what changed | Profile continuously at low frequency to establish baselines |
| Not excluding health checks | Including all traffic in profiles | Profiles diluted with non-representative traffic | Filter profiling to user-facing endpoints only |
| Profiling without alerting integration | Manual activation | Miss the window for diagnostic data | Automatically trigger burst sampling from alerts |

## Anti-Patterns

- **Profiling only during incidents**: Without baselines, you can't tell what changed. Always-on low-frequency profiling is essential.
- **Using high-frequency profiling everywhere**: The cost of 100 Hz profiling across all hosts is prohibitive. Use it selectively during incidents.
- **Ignoring profiling data after incidents**: Profiles captured during incidents contain valuable root cause data. Review them in post-mortems.
- **Not correlating profiles with other signals**: Profiles alone don't tell the full story. Correlate with metrics, traces, and logs for complete incident analysis.

## Examples

```
Adaptive Sampling Policy:
- Normal operation (budget > 50%): 1 Hz baseline
- Budget 20-50%: 5 Hz increased vigilance
- Budget 10-20%: 10 Hz, alert operations
- Budget < 10%: 50 Hz burst on canary hosts, 100 Hz on affected hosts
- SLO breach: 100 Hz on all hosts, page on-call
```

## Related Topics

- SLO Definition and Error Budgets
- Performance Regression Detection
- Flame Graph Interpretation
- Profiling Observability

## AI Agent Notes

- Continuous profiling is always-on, low-overhead sampling that establishes baseline behavior.
- Adaptive sampling adjusts frequency based on error budget burn rate — high when needed, low normally.
- eBPF-based profilers (Parca, Pyroscope eBPF) have the lowest overhead (<1%).
- Profile comparison (diffing) is the key technique for identifying what changed during incidents.
- Health check traffic must be excluded to keep profiles representative of user experience.

## Verification

- [ ] Baseline profiling configured at 1-5 Hz on all hosts
- [ ] Burst sampling triggered by SLO breach alerts
- [ ] Profiles stored for 30+ days for historical comparison
- [ ] Health check endpoints excluded from profiling
- [ ] Profiling integrated with incident alerting
- [ ] Profile data access restricted to authorized personnel
- [ ] Adaptive sampling policy documented and implemented
- [ ] Profile comparison reviewed in post-mortems
