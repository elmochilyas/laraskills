# Skill: Correlate OpCache Hit Rate with CPU Usage for Capacity Planning

## Purpose

Understand the direct relationship between OpCache hit rate and CPU consumption, and use this to predict the CPU impact of OpCache misconfiguration or resizing.

## When To Use

- Diagnosing unexpected CPU spikes on production servers
- Planning OpCache memory changes with predicted CPU impact
- Building a business case for OpCache optimization based on CPU savings
- Capacity planning for new deployments

## When NOT To Use

- When OpCache hit rate is already >99% (relationship is stable)
- For development environments where metrics are not production-representative
- Without first establishing baseline metrics for the current configuration

## Prerequisites

- OpCache hit rate monitoring in place
- CPU utilization monitoring per server
- OpCache configuration documentation
- Understanding that each 1% hit rate decrease increases CPU ~0.5-1%

## Inputs

- Current OpCache hit rate
- Current CPU utilization percentage
- OpCache memory usage and cache_full status
- PHP file count and average compilation time

## Workflow (numbered steps)

1. Record current OpCache hit rate and CPU utilization at peak traffic
2. If hit rate <95%, calculate the CPU overhead: (100 - hit_rate) * 0.0075 (midpoint of 0.5-1% per 1% miss rate)
3. Multiply by current CPU utilization to estimate how much CPU is wasted on recompilation
4. If cache_full=true, estimate the memory increase needed to restore >99% hit rate
5. For each 128MB memory increase, predict hit rate improvement: ~2-5% depending on current utilization
6. Calculate CPU savings from the predicted hit rate improvement
7. Present the analysis: "Increasing OpCache memory by 256MB will improve hit rate from 92% to 99%, saving ~5% CPU"
8. After the change, verify: hit rate should improve, CPU should decrease proportionally
9. Document the before/after metrics to validate the relationship

## Validation Checklist

- [ ] Current hit rate and CPU recorded
- [ ] CPU overhead from misses calculated
- [ ] Memory increase predicted to restore hit rate
- [ ] CPU savings estimated
- [ ] Change implemented
- [ ] After: hit rate improved, CPU decreased
- [ ] Relationship validated with before/after data

## Common Failures

- **Ignoring other CPU consumers**: CPU may be high from other processes — isolate OpCache-related CPU via profiling
- **Assuming linear relationship**: The 0.5-1% per 1% miss rate is an approximation — actual varies by file complexity
- **Not accounting for JIT interactions**: JIT compilation adds CPU that is separate from OpCache miss CPU
- **Single data point**: CPU varies with traffic — use average over a 24-hour period for correlation

## Decision Points

- Hit rate >99%: no significant CPU waste from recompilation
- Hit rate 95-99%: 2-5% CPU potentially wasted — monitor and plan increase
- Hit rate 90-95%: 5-10% CPU wasted — increase OpCache memory at next maintenance
- Hit rate <90%: >10% CPU wasted — immediate increase needed

## Performance Considerations

- Each OpCache miss requires full compilation: lex + parse + compile = 10-100ms per file
- Compilation is CPU-bound and blocks the worker — directly impacts throughput
- Every 1% miss rate means 1% of file accesses require compilation instead of cache fetch
- For an app with 20K files accessed per request, 1% miss = 200 files recompiled per request
- 200 files × 50ms compilation = 10 seconds of CPU per request — catastrophic for throughput

## Security Considerations

- OpCache hit rate degradation is a performance issue, not a security issue
- High CPU from recompilation may affect co-located services (noisy neighbor)
- No direct security implications from the hit rate / CPU relationship

## Related Rules (from 05-rules.md)

- Monitor Hit Rate and Cache Full Indicator
- Size memory_consumption to Your Application
- Enable OpCache First, Tune Later

## Related Skills

- OpCache Monitoring and Hit Rate Analysis
- OpCache Memory Sizing
- Capacity Planning and Safety Margins

## Success Criteria

- Hit rate vs CPU relationship understood and documented
- Memory increase justified by predicted CPU savings
- After-change metrics confirm the relationship
- Monitoring in place to detect future hit rate degradation
